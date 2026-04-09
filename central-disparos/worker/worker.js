const Queue = require('bull');
const Database = require('better-sqlite3');
const axios = require('axios');
const moment = require('moment-timezone');

// Config
const TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/Sao_Paulo';
const DELAY_MIN = parseInt(process.env.DELAY_MIN_MS) || 5000;
const DELAY_MAX = parseInt(process.env.DELAY_MAX_MS) || 12000;
const MESSAGES_PER_HOUR = parseInt(process.env.MESSAGES_PER_HOUR_MAX) || 25;
const COOLDOWN_AFTER = parseInt(process.env.COOLDOWN_AFTER_MESSAGES) || 8;
const COOLDOWN_MINUTES = parseInt(process.env.COOLDOWN_DURATION_MINUTES) || 20;
const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT_PER_NUMBER) || 150;

// Database
const dbPath = process.env.DATABASE_URL?.replace('sqlite://', '') || '/app/data/central.db';
const db = new Database(dbPath);

// Queue
const messageQueue = new Queue('message-sending', process.env.REDIS_URL || 'redis://localhost:6379');

// State
let state = {
  sentInBatch: 0,
  lastSent: null,
  dailyCount: {},
  isPaused: false
};

// Logger
function log(level, message, data = {}) {
  const stmt = db.prepare('INSERT INTO logs (level, message, data) VALUES (?, ?, ?)');
  stmt.run(level, message, JSON.stringify(data));
  console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`, data);
}

// Delay helpers
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;

// Business hours check
function isBusinessHours() {
  const now = moment().tz(TIMEZONE);
  const hour = now.hour();
  const day = now.day();
  
  // Skip weekends
  if (day === 0 || day === 6) return false;
  
  const startHour = parseInt(process.env.BUSINESS_START_HOUR) || 9;
  const endHour = parseInt(process.env.BUSINESS_END_HOUR) || 18;
  
  return hour >= startHour && hour < endHour;
}

// Daily limit check
function checkDailyLimit(instanceId) {
  const today = moment().tz(TIMEZONE).format('YYYY-MM-DD');
  
  if (!state.dailyCount[instanceId] || state.dailyCount[instanceId].date !== today) {
    state.dailyCount[instanceId] = { date: today, count: 0 };
  }
  
  return state.dailyCount[instanceId].count < DAILY_LIMIT;
}

// Increment daily count
function incrementDailyCount(instanceId) {
  const today = moment().tz(TIMEZONE).format('YYYY-MM-DD');
  if (!state.dailyCount[instanceId] || state.dailyCount[instanceId].date !== today) {
    state.dailyCount[instanceId] = { date: today, count: 0 };
  }
  state.dailyCount[instanceId].count++;
}

// Cooldown check
async function checkCooldown() {
  if (state.sentInBatch >= COOLDOWN_AFTER) {
    log('info', `Cooldown ativado: ${COOLDOWN_MINUTES} minutos`);
    state.isPaused = true;
    
    const totalMs = COOLDOWN_MINUTES * 60 * 1000;
    await sleep(totalMs);
    
    state.sentInBatch = 0;
    state.isPaused = false;
    log('info', 'Cooldown finalizado, retomando envios');
  }
}

// Spin tax - variação de texto
const variations = [
  ['Olá', 'Oi', 'E aí', 'Hey'],
  ['tudo bem', 'como vai', 'beleza', 'tudo certo', 'como está'],
  ['!', ' 👋', '?', ' 😊', '']
];

function spinTax(text) {
  return text.replace(/\{spin:(\d+)\}/g, (match, index) => {
    const group = variations[parseInt(index) % variations.length];
    return group[Math.floor(Math.random() * group.length)];
  });
}

// Send message via Evolution API
async function sendMessage(job) {
  const { contactId, campaignId, phone, name, message } = job.data;
  
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instanceName = 'central-instance'; // Pode ser dinâmico
  
  if (!apiUrl || !apiKey) {
    throw new Error('API não configurada');
  }
  
  // Personalizar mensagem
  let finalMessage = message
    .replace(/{nome}/gi, name || 'Cliente')
    .replace(/{telefone}/gi, phone);
  
  // Aplicar spin tax
  finalMessage = spinTax(finalMessage);
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  try {
    // Simular digitação
    await axios.post(`${apiUrl}/message/sendPresence`, {
      apikey: apiKey,
      instance: instanceName,
      number: cleanPhone,
      presence: 'composing'
    }).catch(() => {});
    
    await sleep(randomDelay() / 2);
    
    // Enviar mensagem
    const response = await axios.post(`${apiUrl}/message/sendText`, {
      apikey: apiKey,
      instance: instanceName,
      number: cleanPhone,
      text: finalMessage
    }, { timeout: 30000 });
    
    // Atualizar banco
    db.prepare(`
      UPDATE contacts 
      SET status = ?, sent_at = ? 
      WHERE id = ?
    `).run('sent', new Date().toISOString(), contactId);
    
    // Incrementar contadores
    state.sentInBatch++;
    state.lastSent = new Date();
    incrementDailyCount(instanceName);
    
    // Atualizar campanha
    db.prepare(`
      UPDATE campaigns 
      SET sent_count = sent_count + 1 
      WHERE id = ?
    `).run(campaignId);
    
    log('info', 'Mensagem enviada', { 
      contactId, 
      phone: cleanPhone,
      campaignId,
      batchCount: state.sentInBatch 
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    // Atualizar erro
    db.prepare(`
      UPDATE contacts 
      SET status = ?, error_message = ?, retry_count = retry_count + 1 
      WHERE id = ?
    `).run('failed', error.message.substring(0, 255), contactId);
    
    db.prepare(`
      UPDATE campaigns 
      SET failed_count = failed_count + 1 
      WHERE id = ?
    `).run(campaignId);
    
    log('error', 'Falha ao enviar', { 
      contactId, 
      phone: cleanPhone, 
      error: error.message 
    });
    
    throw error;
  }
}

// Process jobs
messageQueue.process('send-message', async (job) => {
  // Verificar horário comercial
  if (process.env.BUSINESS_HOURS_ONLY === 'true') {
    while (!isBusinessHours()) {
      log('info', 'Fora do horário comercial, aguardando...');
      await sleep(60000); // Verificar a cada minuto
    }
  }
  
  // Verificar cooldown
  if (state.isPaused) {
    throw new Error('Worker em cooldown');
  }
  
  await checkCooldown();
  
  // Delay aleatório antes de enviar
  const delay = randomDelay();
  log('info', `Aguardando ${delay}ms antes de enviar`);
  await sleep(delay);
  
  // Enviar
  return await sendMessage(job);
});

// Event handlers
messageQueue.on('completed', (job, result) => {
  log('info', 'Job completado', { jobId: job.id, result });
});

messageQueue.on('failed', (job, err) => {
  log('error', 'Job falhou', { jobId: job.id, error: err.message });
  
  // Se falhou muitas vezes, não tentar novamente
  if (job.attemptsMade >= 3) {
    db.prepare(`
      UPDATE contacts 
      SET status = ? 
      WHERE id = ?
    `).run('permanent_fail', job.data.contactId);
  }
});

// Monitoramento contínuo
setInterval(() => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as pending,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM contacts 
    WHERE status IN ('pending', 'sent', 'failed')
  `).get();
  
  log('info', 'Worker stats', {
    ...stats,
    batchCount: state.sentInBatch,
    isPaused: state.isPaused
  });
}, 60000); // A cada minuto

log('info', 'Worker de Disparos iniciado', {
  delayMin: DELAY_MIN,
  delayMax: DELAY_MAX,
  cooldownAfter: COOLDOWN_AFTER,
  dailyLimit: DAILY_LIMIT
});
