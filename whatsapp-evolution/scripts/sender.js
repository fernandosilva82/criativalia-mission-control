#!/usr/bin/env node
/**
 * WhatsApp Evolution API - Disparador com Anti-Block
 * 
 * Técnicas implementadas:
 * - Delays aleatórios entre mensagens
 - Rate limiting (mensagens/hora)
 * - Cooldown após batches
 * - Horário comercial apenas
 * - Rotação de mensagens (spin-tax)
 * - Simulação de digitação
 * - Pausas aleatórias
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configurações
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'settings.json');
const DATA_PATH = path.join(__dirname, '..', 'data');
const LOGS_PATH = path.join(__dirname, '..', 'logs');

// Estado
let state = {
  sentToday: 0,
  sentInBatch: 0,
  lastSent: null,
  paused: false
};

// Carregar configurações
function loadConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const envPath = path.join(__dirname, '..', 'config', '.env');
    
    if (fs.existsSync(envPath)) {
      const env = fs.readFileSync(envPath, 'utf8');
      env.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !key.startsWith('#')) {
          process.env[key.trim()] = value.trim();
        }
      });
    }
    
    return config;
  } catch (error) {
    console.error('Erro ao carregar config:', error.message);
    process.exit(1);
  }
}

// Logging
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...data };
  
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  
  const logFile = path.join(LOGS_PATH, `${new Date().toISOString().split('T')[0]}.jsonl`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// Delay helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random delay
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Spin-tax: variação de mensagens
function spinTax(text, variations) {
  let result = text;
  
  // Substituir placeholders
  result = result.replace(/\{([^}]+)\}/g, (match, key) => {
    if (key === 'spin') {
      // Escolher variação aleatória
      const spinGroup = variations[Math.floor(Math.random() * variations.length)];
      return spinGroup[Math.floor(Math.random() * spinGroup.length)];
    }
    return match;
  });
  
  return result;
}

// Verificar horário comercial
function isBusinessHours(config) {
  if (!config.antiBlock.businessHours.enabled) return true;
  
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  // Fim de semana
  if (config.antiBlock.businessHours.skipWeekends && (day === 0 || day === 6)) {
    return false;
  }
  
  const [startHour] = config.antiBlock.businessHours.start.split(':').map(Number);
  const [endHour] = config.antiBlock.businessHours.end.split(':').map(Number);
  
  return hour >= startHour && hour < endHour;
}

// Simular digitação
async function simulateTyping(apiUrl, apiKey, instance, phone) {
  try {
    await axios.post(`${apiUrl}/message/sendPresence`, {
      apikey: apiKey,
      instance: instance,
      number: phone,
      presence: 'composing'
    });
    
    // Delay baseado em caracteres
    const typingDelay = randomDelay(1000, 3000);
    await sleep(typingDelay);
    
    await axios.post(`${apiUrl}/message/sendPresence`, {
      apikey: apiKey,
      instance: instance,
      number: phone,
      presence: 'paused'
    });
  } catch (error) {
    // Silencioso - não é crítico
  }
}

// Enviar mensagem
async function sendMessage(phone, message, config) {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.INSTANCE_NAME;
  
  if (!apiUrl || !apiKey) {
    throw new Error('API URL ou Key não configurados');
  }
  
  // Limpar número
  const cleanPhone = phone.replace(/\D/g, '');
  
  try {
    // Simular digitação se habilitado
    if (config.antiBlock.humanLike.typingDelay.enabled) {
      await simulateTyping(apiUrl, apiKey, instance, cleanPhone);
    }
    
    const response = await axios.post(`${apiUrl}/message/sendText`, {
      apikey: apiKey,
      instance: instance,
      number: cleanPhone,
      text: message
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    state.sentToday++;
    state.sentInBatch++;
    state.lastSent = new Date().toISOString();
    
    log('info', `Mensagem enviada`, { 
      phone: cleanPhone, 
      status: response.data?.status || 'unknown',
      sentToday: state.sentToday 
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    log('error', `Falha ao enviar`, { 
      phone: cleanPhone, 
      error: error.message 
    });
    return { success: false, error: error.message };
  }
}

// Verificar cooldown
async function checkCooldown(config) {
  const batchMax = config.antiBlock.messagesPerBatch.max;
  const cooldownMinutes = config.antiBlock.messagesPerBatch.cooldownMinutes;
  
  if (state.sentInBatch >= batchMax) {
    log('info', `Cooldown ativado - aguardando ${cooldownMinutes}min`);
    state.paused = true;
    
    // Progresso visual
    const totalMs = cooldownMinutes * 60 * 1000;
    const steps = 10;
    const stepMs = totalMs / steps;
    
    for (let i = 1; i <= steps; i++) {
      await sleep(stepMs);
      process.stdout.write(`\rCooldown: ${i * 10}% (${Math.round(i * stepMs / 1000)}s/${totalMs / 1000}s)`);
    }
    console.log('');
    
    state.sentInBatch = 0;
    state.paused = false;
    log('info', 'Cooldown finalizado - retomando envios');
  }
}

// Processar lista
async function processList(listFile, messageTemplate, config) {
  const listPath = path.join(DATA_PATH, listFile);
  
  if (!fs.existsSync(listPath)) {
    log('error', `Arquivo não encontrado: ${listPath}`);
    return;
  }
  
  const lines = fs.readFileSync(listPath, 'utf8')
    .split('\n')
    .filter(line => line.trim());
  
  log('info', `Iniciando disparo - ${lines.length} contatos`);
  
  const results = {
    total: lines.length,
    sent: 0,
    failed: 0,
    skipped: 0
  };
  
  for (let i = 0; i < lines.length; i++) {
    // Verificar horário comercial
    if (!isBusinessHours(config)) {
      log('warn', 'Fora do horário comercial - pausando');
      await sleep(60000); // Verificar a cada minuto
      i--; // Tentar mesmo item
      continue;
    }
    
    // Verificar limite diário
    if (state.sentToday >= config.antiBlock.dailyLimits.maxMessages) {
      log('warn', `Limite diário atingido (${config.antiBlock.dailyLimits.maxMessages})`);
      break;
    }
    
    // Verificar cooldown
    await checkCooldown(config);
    
    const line = lines[i];
    const parts = line.split(',').map(p => p.trim());
    const phone = parts[0];
    const name = parts[1] || 'Cliente';
    
    // Pular se já foi enviado hoje
    const sentTodayFile = path.join(DATA_PATH, 'sent-today.txt');
    if (fs.existsSync(sentTodayFile)) {
      const sent = fs.readFileSync(sentTodayFile, 'utf8').split('\n');
      if (sent.includes(phone)) {
        log('info', `Já enviado hoje - pulando ${phone}`);
        results.skipped++;
        continue;
      }
    }
    
    // Personalizar mensagem
    let message = messageTemplate
      .replace(/{nome}/gi, name)
      .replace(/{telefone}/gi, phone);
    
    // Aplicar spin-tax
    if (config.messages.spinTax.enabled) {
      message = spinTax(message, config.messages.spinTax.variations);
    }
    
    log('info', `Enviando ${i + 1}/${lines.length} - ${phone}`);
    
    const result = await sendMessage(phone, message, config);
    
    if (result.success) {
      results.sent++;
      // Registrar envio
      fs.appendFileSync(sentTodayFile, phone + '\n');
    } else {
      results.failed++;
    }
    
    // Delay aleatório entre mensagens
    const delay = randomDelay(
      config.antiBlock.delayBetweenMessages.min,
      config.antiBlock.delayBetweenMessages.max
    );
    
    process.stdout.write(`Aguardando ${delay}ms...`);
    await sleep(delay);
    console.log(' ✓');
    
    // Pausa aleatória ocasional
    if (config.antiBlock.humanLike.randomPauses.enabled) {
      const prob = config.antiBlock.humanLike.randomPauses.probability;
      if (Math.random() < prob) {
        const pauseSeconds = config.antiBlock.humanLike.randomPauses.durationSeconds;
        const pause = pauseSeconds[Math.floor(Math.random() * pauseSeconds.length)];
        log('info', `Pausa aleatória: ${pause}s`);
        await sleep(pause * 1000);
      }
    }
  }
  
  // Resumo
  log('info', 'Disparo finalizado', results);
  console.log('\n=== RESUMO ===');
  console.log(`Total: ${results.total}`);
  console.log(`Enviados: ${results.sent} ✓`);
  console.log(`Falhas: ${results.failed} ✗`);
  console.log(`Pulados: ${results.skipped} ⏭`);
  console.log(`Taxa: ${((results.sent / results.total) * 100).toFixed(1)}%`);
  
  return results;
}

// Reset diário
function resetDaily() {
  const sentTodayFile = path.join(DATA_PATH, 'sent-today.txt');
  if (fs.existsSync(sentTodayFile)) {
    fs.unlinkSync(sentTodayFile);
  }
  state.sentToday = 0;
  log('info', 'Contador diário resetado');
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const config = loadConfig();
  
  if (command === 'send') {
    const listFile = args[1];
    const message = args[2];
    
    if (!listFile || !message) {
      console.log('Uso: node sender.js send <lista.csv> "Sua mensagem aqui"');
      console.log('Exemplo: node sender.js send clientes.csv "Olá {nome}! {spin}"');
      process.exit(1);
    }
    
    await processList(listFile, message, config);
  } else if (command === 'reset') {
    resetDaily();
  } else if (command === 'status') {
    console.log('=== Status ===');
    console.log(`Enviados hoje: ${state.sentToday}/${config.antiBlock.dailyLimits.maxMessages}`);
    console.log(`Último envio: ${state.lastSent || 'Nenhum'}`);
    console.log(`Horário comercial: ${isBusinessHours(config) ? 'Sim' : 'Não'}`);
  } else {
    console.log(`
WhatsApp Evolution API - Disparador

Comandos:
  send <lista.csv> "mensagem"  Enviar mensagens
  status                        Ver status atual
  reset                         Resetar contador diário

Variáveis na mensagem:
  {nome}      - Nome do contato
  {telefone}  - Número do telefone
  {spin}      - Variação aleatória de texto

Exemplo:
  node sender.js send clientes.csv "Olá {nome}! Tudo bem? Temos novidades 🚀"
`);
  }
}

main().catch(console.error);
