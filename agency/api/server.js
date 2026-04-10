const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 7778;
const JWT_SECRET = process.env.JWT_SECRET || 'agency-secret-key-2024-change-in-production';

// Evolution API config
const EVOLUTION_URL = process.env.EVOLUTION_API_URL || process.env.EVOLUTION_URL || 'http://evolution-whatsapp:8080';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'criativalia2024';

app.use(cors());
app.use(express.json());

// Database
const DB_PATH = '/opt/agency/database/agency.db';
const db = new sqlite3.Database(DB_PATH);

// ========== AUTENTICAÇÃO ==========

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    req.user = user;
    next();
  });
}

// Rota pública de login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  }
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  });
});

// Rota pública para verificar se precisa criar primeiro usuário
app.get('/api/auth/setup', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    res.json({ needsSetup: row.count === 0 });
  });
});

// Criar primeiro usuário admin (só funciona se não houver usuários)
app.post('/api/auth/setup', async (req, res) => {
  const { username, password, name } = req.body;
  
  db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    
    if (row.count > 0) {
      return res.status(403).json({ error: 'Setup já realizado' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [username, passwordHash, name || username, 'admin'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Erro ao criar usuário' });
        }
        res.json({ message: 'Usuário admin criado com sucesso' });
      }
    );
  });
});

// Rota protegida para info do usuário
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// ========== MIDDLEWARE DE AUTENTICAÇÃO PARA TODAS AS ROTAS ABAIXO ==========
app.use('/api', authenticateToken);

// ========== ROTAS PROTEGIDAS ==========

// Init database
function initDB() {
  db.serialize(() => {
    // Tabela de usuários (NOVA - para autenticação)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      template_id INTEGER,
      mailing_id INTEGER,
      instance_name TEXT,
      total_recipients INTEGER DEFAULT 0,
      sent_count INTEGER DEFAULT 0,
      delivered_count INTEGER DEFAULT 0,
      read_count INTEGER DEFAULT 0,
      replied_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      variables TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS mailing_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      total_contacts INTEGER DEFAULT 0,
      valid_contacts INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mailing_id INTEGER,
      phone TEXT NOT NULL,
      name TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabela de warm-up de chips
    db.run(`CREATE TABLE IF NOT EXISTS warmup_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instance_name TEXT NOT NULL,
      status TEXT DEFAULT 'running',
      stage TEXT DEFAULT 'initial',
      progress INTEGER DEFAULT 0,
      target_score INTEGER DEFAULT 100,
      current_score INTEGER DEFAULT 0,
      messages_sent INTEGER DEFAULT 0,
      messages_received INTEGER DEFAULT 0,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      config TEXT
    )`);

    // Tabela de logs de warm-up
    db.run(`CREATE TABLE IF NOT EXISTS warmup_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      action TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabela de números buddies para warm-up
    db.run(`CREATE TABLE IF NOT EXISTS warmup_buddies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT NOT NULL UNIQUE,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ========== V7.0 - NOVAS FUNCIONALIDADES ==========
    
    // 1. ROTAÇÃO DE INSTÂNCIAS
    db.run(`CREATE TABLE IF NOT EXISTS rotation_pools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      instance_names TEXT NOT NULL, -- JSON array
      active INTEGER DEFAULT 1,
      current_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 2. AGENDAMENTO DE CAMPANHAS
    db.run(`CREATE TABLE IF NOT EXISTS campaign_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      scheduled_at DATETIME NOT NULL,
      timezone TEXT DEFAULT 'America/Sao_Paulo',
      status TEXT DEFAULT 'pending', -- pending, sent, cancelled
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    )`);
    
    // 3. BLACKLIST/WHITELIST
    db.run(`CREATE TABLE IF NOT EXISTS number_blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      reason TEXT,
      list_type TEXT DEFAULT 'blacklist', -- blacklist, whitelist
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 4. TEMPLATES COM MÍDIA (ignora erro se coluna já existe)
    db.run(`ALTER TABLE templates ADD COLUMN type TEXT DEFAULT 'text'`, () => {});
    db.run(`ALTER TABLE templates ADD COLUMN media_url TEXT`, () => {});
    db.run(`ALTER TABLE templates ADD COLUMN caption TEXT`, () => {});
    db.run(`ALTER TABLE templates ADD COLUMN filename TEXT`, () => {});
    db.run(`ALTER TABLE templates ADD COLUMN buttons TEXT`, () => {});
    
    // 5. SEGMENTAÇÃO DE LISTAS
    db.run(`CREATE TABLE IF NOT EXISTS contact_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id),
      UNIQUE(contact_id, tag)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS mailing_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mailing_id INTEGER NOT NULL,
      tag_filter TEXT, -- JSON array de tags necessárias
      condition TEXT DEFAULT 'all', -- all, any
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mailing_id) REFERENCES mailing_lists(id)
    )`);
    
    // 6. FOLLOW-UP AUTOMÁTICO
    db.run(`CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      delay_hours INTEGER NOT NULL,
      template_id INTEGER NOT NULL,
      condition TEXT DEFAULT 'no_reply', -- no_reply, not_read, all
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS follow_up_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follow_up_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'sent',
      FOREIGN KEY (follow_up_id) REFERENCES follow_ups(id)
    )`);
    
    // 7. ANALYTICS AVANÇADO - LOGS DETALHADOS
    db.run(`CREATE TABLE IF NOT EXISTS delivery_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      contact_id INTEGER,
      instance_name TEXT,
      event_type TEXT NOT NULL, -- sent, delivered, read, failed, replied
      event_data TEXT, -- JSON com dados adicionais
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    )`);
    
    // 8. CONTROLE DE VELOCIDADE POR INSTÂNCIA
    db.run(`CREATE TABLE IF NOT EXISTS instance_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instance_name TEXT NOT NULL UNIQUE,
      mode TEXT DEFAULT 'balanced', -- stealth, balanced, turbo
      delay_min INTEGER DEFAULT 2000,
      delay_max INTEGER DEFAULT 5000,
      daily_limit INTEGER DEFAULT 500,
      hourly_limit INTEGER DEFAULT 100,
      active_hours_start TEXT DEFAULT '08:00',
      active_hours_end TEXT DEFAULT '20:00',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 9. WEBHOOKS PARA EVENTOS
    db.run(`CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      events TEXT NOT NULL, -- JSON array: ['message.sent', 'message.delivered', 'campaign.completed']
      active INTEGER DEFAULT 1,
      secret TEXT, -- para validação HMAC
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 10. SISTEMA MULTI-TENANT (CRÉDITOS)
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      credits INTEGER DEFAULT 0,
      monthly_limit INTEGER DEFAULT 1000,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS credit_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      amount INTEGER NOT NULL, -- positivo = crédito, negativo = uso
      description TEXT,
      campaign_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )`);
    
    // Índices para performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_delivery_logs_campaign ON delivery_logs(campaign_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_delivery_logs_event ON delivery_logs(event_type)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_delivery_logs_created ON delivery_logs(created_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_contact_tags_contact ON contact_tags(contact_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON contact_tags(tag)`);
  });
}

// ========== EVOLUTION API INTEGRATION ==========

// Listar instâncias
app.get('/api/evolution/instances', async (req, res) => {
  try {
    const response = await axios.get(`${EVOLUTION_URL}/instance/fetchInstances`, {
      headers: { 'apikey': EVOLUTION_KEY }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Evolution error:', error.message);
    res.json({ instances: [] });
  }
});

// Criar instância
app.post('/api/evolution/instances', async (req, res) => {
  const { name } = req.body;
  try {
    const response = await axios.post(
      `${EVOLUTION_URL}/instance/create`,
      {
        instanceName: name,
        qrcode: true
        // Não enviar number, token, webhook - deixar a Evolution gerenciar
      },
      { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Create instance error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      return res.status(error.response.status).json({ 
        error: error.message,
        details: error.response.data 
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// Conectar (QR Code)
app.get('/api/evolution/:name/connect', async (req, res) => {
  try {
    const response = await axios.get(
      `${EVOLUTION_URL}/instance/connect/${req.params.name}`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    
    // Normalizar a resposta - Evolution retorna em response.data.qrcode
    const data = response.data;
    
    // Formato da Evolution: { qrcode: { base64: "...", code: "...", pairingCode: "..." } }
    if (data.qrcode) {
      const result = {};
      if (data.qrcode.base64) result.base64 = data.qrcode.base64;
      if (data.qrcode.code) result.code = data.qrcode.code;
      if (data.qrcode.pairingCode) result.pairingCode = data.qrcode.pairingCode;
      res.json(result);
    }
    // Fallback para outros formatos
    else if (data.base64) {
      res.json({ base64: data.base64 });
    }
    else if (data.code) {
      res.json({ code: data.code });
    }
    else {
      console.log('[QR Code] Formato não reconhecido:', JSON.stringify(data).substring(0, 200));
      res.json(data);
    }
  } catch (error) {
    console.error('Connect error:', error.message);
    
    // Tratar erros específicos da Evolution API
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 404) {
        return res.status(404).json({ 
          error: 'Instância não encontrada na Evolution API',
          details: 'A instância pode ter sido deletada ou não existe. Crie uma nova instância.'
        });
      }
      
      if (status === 400) {
        return res.status(400).json({
          error: 'Instância já conectada ou erro de configuração',
          details: errorData
        });
      }
      
      return res.status(status).json({
        error: `Erro na Evolution API: ${status}`,
        details: errorData
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Logout
app.post('/api/evolution/:name/logout', async (req, res) => {
  try {
    const response = await axios.delete(
      `${EVOLUTION_URL}/instance/logout/${req.params.name}`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Deletar instância
app.delete('/api/evolution/:name', async (req, res) => {
  try {
    const response = await axios.delete(
      `${EVOLUTION_URL}/instance/delete/${req.params.name}`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Verificar se número existe no WhatsApp
app.post('/api/evolution/instances/:name/check-number', async (req, res) => {
  const { number } = req.body;
  try {
    const response = await axios.post(
      `${EVOLUTION_URL}/chat/whatsappNumbers/${req.params.name}`,
      { numbers: [number] },
      { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' } }
    );
    // Retorna o primeiro resultado (a API retorna um array)
    const result = response.data[0] || { exists: false, number };
    res.json(result);
  } catch (error) {
    console.error('Check number error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Verificar múltiplos números (bulk)
app.post('/api/evolution/instances/:name/check-numbers', async (req, res) => {
  const { numbers } = req.body;
  try {
    const response = await axios.post(
      `${EVOLUTION_URL}/chat/whatsappNumbers/${req.params.name}`,
      { numbers },
      { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Check numbers error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Obter perfil
app.post('/api/evolution/instances/:name/profile', async (req, res) => {
  const { number } = req.body;
  try {
    const response = await axios.post(
      `${EVOLUTION_URL}/chat/fetchProfile/${req.params.name}`,
      { number },
      { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensagem de texto
app.post('/api/evolution/instances/:name/send-text', async (req, res) => {
  const { number, text } = req.body;
  try {
    const response = await axios.post(
      `${EVOLUTION_URL}/message/sendText/${req.params.name}`,
      { number, textMessage: { text } },
      { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Send text error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========== TEMPLATES ==========

app.get('/api/templates', (req, res) => {
  db.all("SELECT * FROM templates ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/templates', (req, res) => {
  const { name, content } = req.body;
  db.run(
    "INSERT INTO templates (name, content) VALUES (?, ?)",
    [name, content],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Template criado' });
    }
  );
});

app.delete('/api/templates/:id', (req, res) => {
  db.run("DELETE FROM templates WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Template deletado' });
  });
});

// ========== MAILING LISTS ==========

app.get('/api/mailing', (req, res) => {
  db.all("SELECT * FROM mailing_lists ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/mailing', (req, res) => {
  const { name } = req.body;
  db.run(
    "INSERT INTO mailing_lists (name) VALUES (?)",
    [name],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Lista criada' });
    }
  );
});

app.get('/api/mailing/:id/contacts', (req, res) => {
  db.all("SELECT * FROM contacts WHERE mailing_id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.delete('/api/mailing/:id', (req, res) => {
  db.run("DELETE FROM contacts WHERE mailing_id = ?", [req.params.id], function(err) {
    db.run("DELETE FROM mailing_lists WHERE id = ?", [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Lista deletada' });
    });
  });
});

// ========== UPLOAD CSV ==========

app.post('/api/mailing/:id/upload-csv', express.json({ limit: '10mb' }), (req, res) => {
  const mailingId = req.params.id;
  const { csvData } = req.body;
  
  if (!csvData) {
    return res.status(400).json({ error: 'Dados CSV não fornecidos' });
  }
  
  const lines = csvData.trim().split('\n');
  const contacts = [];
  let format = 'unknown';
  
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('nome') && firstLine.includes('telefone')) {
    format = 'nome-telefone';
  } else if (firstLine.includes('name') && firstLine.includes('phone')) {
    format = 'name-phone';
  } else if (firstLine.includes('telefone') || firstLine.includes('phone') || firstLine.includes('numero')) {
    format = 'telefone-only';
  } else if (lines[0].includes(',')) {
    format = 'csv-raw';
  }
  
  const startIndex = (format === 'nome-telefone' || format === 'name-phone' || format === 'telefone-only') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',').map(p => p.trim());
    
    if (format === 'nome-telefone' || format === 'name-phone') {
      const name = parts[0];
      const phone = parts[1]?.replace(/\D/g, '');
      if (phone && phone.length >= 10) {
        contacts.push({ name, phone });
      }
    } else if (format === 'telefone-only') {
      const phone = parts[0]?.replace(/\D/g, '');
      if (phone && phone.length >= 10) {
        contacts.push({ name: '', phone });
      }
    } else {
      const phone = parts.find(p => p.replace(/\D/g, '').length >= 10)?.replace(/\D/g, '');
      const name = parts.find(p => p.replace(/\D/g, '').length < 10 && p.length > 2) || '';
      if (phone) {
        contacts.push({ name, phone });
      }
    }
  }
  
  let inserted = 0;
  const stmt = db.prepare("INSERT INTO contacts (mailing_id, phone, name) VALUES (?, ?, ?)");
  
  contacts.forEach(contact => {
    stmt.run(mailingId, contact.phone, contact.name);
    inserted++;
  });
  
  stmt.finalize();
  
  db.run(
    "UPDATE mailing_lists SET total_contacts = total_contacts + ? WHERE id = ?",
    [inserted, mailingId]
  );
  
  res.json({
    message: `${inserted} contatos importados`,
    total: inserted,
    format: format,
    sample: contacts.slice(0, 3)
  });
});

// ========== CAMPAIGNS ==========

app.get('/api/campaigns', (req, res) => {
  db.all(`
    SELECT c.*, t.name as template_name, m.name as mailing_name
    FROM campaigns c
    LEFT JOIN templates t ON c.template_id = t.id
    LEFT JOIN mailing_lists m ON c.mailing_id = m.id
    ORDER BY c.created_at DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/campaigns', (req, res) => {
  const { name, instance_name, template_id, mailing_id } = req.body;
  
  db.get("SELECT COUNT(*) as total FROM contacts WHERE mailing_id = ?", [mailing_id], (err, row) => {
    const total = row?.total || 0;
    
    db.run(
      `INSERT INTO campaigns (name, instance_name, template_id, mailing_id, total_recipients, status)
       VALUES (?, ?, ?, ?, ?, 'draft')`,
      [name, instance_name, template_id, mailing_id, total],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Campanha criada', total_recipients: total });
      }
    );
  });
});

app.post('/api/campaigns/:id/start', async (req, res) => {
  const campaignId = req.params.id;
  
  db.get(`
    SELECT c.*, t.content as template_content
    FROM campaigns c
    LEFT JOIN templates t ON c.template_id = t.id
    WHERE c.id = ?
  `, [campaignId], async (err, campaign) => {
    if (err || !campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    db.all("SELECT * FROM contacts WHERE mailing_id = ?", [campaign.mailing_id], async (err, contacts) => {
      if (contacts.length === 0) {
        return res.status(400).json({ error: 'Nenhum contato' });
      }
      
      db.run("UPDATE campaigns SET status = 'running' WHERE id = ?", [campaignId]);
      
      res.json({ message: 'Campanha iniciada', total: contacts.length });
      
      sendMessages(campaign, contacts);
    });
  });
});

async function sendMessages(campaign, contacts) {
  let sent = 0;
  let failed = 0;
  
  for (const contact of contacts) {
    try {
      let message = campaign.template_content;
      message = message.replace(/{{nome}}/g, contact.name || '');
      message = message.replace(/{{telefone}}/g, contact.phone);
      
      await axios.post(
        `${EVOLUTION_URL}/message/sendText/${campaign.instance_name}`,
        { number: contact.phone, text: message },
        { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' } }
      );
      
      sent++;
      db.run("UPDATE campaigns SET sent_count = ? WHERE id = ?", [sent, campaign.id]);
      
      await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
    } catch (error) {
      failed++;
      console.error('Erro:', error.message);
    }
  }
  
  db.run("UPDATE campaigns SET status = 'completed', sent_count = ?, failed_count = ? WHERE id = ?",
    [sent, failed, campaign.id]);
}

app.delete('/api/campaigns/:id', (req, res) => {
  db.run("DELETE FROM campaigns WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Campanha deletada' });
  });
});

// ========== WARM-UP ==========

app.get('/api/warmup', (req, res) => {
  db.all(
    `SELECT * FROM warmup_sessions ORDER BY started_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(r => ({
        ...r,
        config: JSON.parse(r.config || '{}'),
        ready: r.current_score >= r.target_score
      })));
    }
  );
});

app.get('/api/warmup/:id', (req, res) => {
  db.get(
    `SELECT * FROM warmup_sessions WHERE id = ?`,
    [req.params.id],
    (err, row) => {
      if (err || !row) return res.status(404).json({ error: 'Sessão não encontrada' });
      
      const config = JSON.parse(row.config || '{}');
      const healthScore = calculateHealthScore(row);
      
      res.json({
        ...row,
        config,
        health: healthScore,
        ready: row.current_score >= row.target_score,
        recommendations: getRecommendations(healthScore, row)
      });
    }
  );
});

app.post('/api/warmup/start', (req, res) => {
  const { instance_name, instances, config } = req.body;
  
  if (!instance_name && (!instances || instances.length === 0)) {
    return res.status(400).json({ error: 'Nome da instância ou lista de instâncias obrigatório' });
  }
  
  const allInstances = instances && instances.length > 0 ? instances : [instance_name];
  
  const defaultConfig = {
    messagesPerDay: 50,
    minDelay: 30000,
    maxDelay: 120000,
    stages: ['initial', 'building', 'active', 'mature'],
    currentStage: 'initial',
    instances: allInstances
  };
  
  const finalConfig = JSON.stringify({ ...defaultConfig, ...config, instances: allInstances });
  
  db.run(
    `INSERT INTO warmup_sessions (instance_name, status, stage, progress, config)
     VALUES (?, 'running', 'initial', 0, ?)`,
    [allInstances[0], finalConfig],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const sessionId = this.lastID;
      
      startWarmup(sessionId, allInstances[0], { ...defaultConfig, ...config, instances: allInstances });
      
      res.json({
        id: sessionId,
        message: `Warm-up iniciado com ${allInstances.length} instância(s)`,
        instances: allInstances,
        status: 'running'
      });
    }
  );
});

app.post('/api/warmup/:id/pause', (req, res) => {
  db.run(
    "UPDATE warmup_sessions SET status = 'paused' WHERE id = ?",
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Warm-up pausado' });
    }
  );
});

app.post('/api/warmup/:id/resume', (req, res) => {
  db.run(
    "UPDATE warmup_sessions SET status = 'running' WHERE id = ?",
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Warm-up retomado' });
    }
  );
});

app.post('/api/warmup/:id/stop', (req, res) => {
  db.run(
    "UPDATE warmup_sessions SET status = 'stopped', completed_at = datetime('now') WHERE id = ?",
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Warm-up finalizado' });
    }
  );
});

// ========== WARM-UP BUDDIES ==========

app.get('/api/warmup-buddies', (req, res) => {
  db.all(
    "SELECT * FROM warmup_buddies ORDER BY created_at DESC",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/warmup-buddies', (req, res) => {
  const { name, phone } = req.body;
  
  if (!phone) return res.status(400).json({ error: 'Telefone obrigatório' });
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  db.run(
    "INSERT INTO warmup_buddies (name, phone) VALUES (?, ?)",
    [name || 'Buddy', cleanPhone],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Número já cadastrado' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Buddy adicionado' });
    }
  );
});

app.delete('/api/warmup-buddies/:id', (req, res) => {
  db.run(
    "DELETE FROM warmup_buddies WHERE id = ?",
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Buddy removido' });
    }
  );
});

app.get('/api/warmup/:id/logs', (req, res) => {
  db.all(
    "SELECT * FROM warmup_logs WHERE session_id = ? ORDER BY created_at DESC LIMIT 100",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Funções auxiliares de warm-up
function calculateHealthScore(session) {
  let score = 0;
  score += Math.min(session.messages_received * 2, 40);
  const hoursActive = (Date.now() - new Date(session.started_at).getTime()) / (1000 * 60 * 60);
  score += Math.min(hoursActive * 5, 30);
  score += Math.min(session.messages_sent, 20);
  const stageBonus = { initial: 0, building: 5, active: 10, mature: 15 };
  score += stageBonus[session.stage] || 0;
  return Math.min(Math.round(score), 100);
}

function getRecommendations(health, session) {
  const recs = [];
  if (health.score < 30) {
    recs.push('🔴 Chip muito frio - Evite envios em massa');
  } else if (health.score < 60) {
    recs.push('🟡 Chip esquentando - Pode fazer envios leves');
  } else {
    recs.push('🟢 Chip pronto! - Pode usar para campanhas');
  }
  return recs;
}

// ========== WARM-UP MULTI-INSTÂNCIA ==========

const WARMUP_MESSAGES = {
  outgoing: [
    "Oi, tudo bem?", "E aí, como foi seu dia?", "Vi uma coisa hoje que lembrei de você",
    "Que saudade! Quando a gente se vê?", "Mandei aquele áudio que falei", "Você viu o jogo ontem?",
    "Vamos marcar aquele almoço?", "Feliz aniversário atrasado 🎉", "Oi! Desculpa sumir, correria total",
    "Te mandei mensagem no outro número", "Olha essa foto que achei aqui", "Que bom te ver por aqui!",
    "Ainda está usando esse número?", "Preciso de uma ajuda sua", "Meu celular quebrou, troquei de número"
  ],
  incoming: [
    "Tudo ótimo! E você?", "Foi tranquilo, e o seu?", "Sério? O que foi?", "Também tô com saudade!",
    "Vou ouvir agora", "Vi sim! Que jogo", "Bora! Quando você pode?", "Obrigado! Melhor tarde que nunca 😄",
    "Relaxa, acontece!", "Qual é o outro?", "Nossa, que nostalgia!", "Igualmente! Que surpresa",
    "Sim, uso sim!", "Claro! O que precisa?", "Ah, entendi! Novo número então"
  ]
};

const instanceNumbersCache = {};

async function getInstanceNumber(instanceName) {
  if (instanceNumbersCache[instanceName]) {
    return instanceNumbersCache[instanceName];
  }
  
  try {
    const response = await axios.get(
      `${EVOLUTION_URL}/instance/fetchInstances`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    
    const instance = response.data?.instances?.find(i => i.instanceName === instanceName);
    if (instance?.number) {
      instanceNumbersCache[instanceName] = instance.number;
      return instance.number;
    }
    return null;
  } catch (error) {
    console.error(`[Warm-up] Erro ao obter número da instância ${instanceName}:`, error.message);
    return null;
  }
}

async function sendWarmupMessage(instanceName, toNumber, message) {
  try {
    const response = await axios.post(
      `${EVOLUTION_URL}/message/sendText/${instanceName}`,
      { number: toNumber, text: message },
      { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`[Warm-up] Erro ao enviar:`, error.message);
    return { success: false, error: error.message };
  }
}

async function startWarmup(sessionId, primaryInstance, config) {
  const instances = config.instances || [primaryInstance];
  
  console.log(`[Warm-up] Iniciando sessão ${sessionId} com ${instances.length} instância(s)`);
  console.log(`[Warm-up] Instâncias: ${instances.join(', ')}`);
  
  // Obter números de todas as instâncias
  const instanceNumbers = {};
  for (const inst of instances) {
    const num = await getInstanceNumber(inst);
    if (num) {
      instanceNumbers[inst] = num;
      console.log(`[Warm-up] Instância ${inst} = ${num}`);
    }
  }
  
  const multiInstanceMode = Object.keys(instanceNumbers).length >= 2;
  
  if (multiInstanceMode) {
    console.log(`[Warm-up] 🔥 MODO MULTI-INSTÂNCIA ATIVADO! ${Object.keys(instanceNumbers).length} chips se aquecerão entre si.`);
  } else {
    console.log(`[Warm-up] MODO SINGLE - Apenas 1 instância disponível`);
  }
  
  const stages = [
    { name: 'initial', days: 1, messagesPerDay: 10, minDelay: 60000, maxDelay: 180000 },
    { name: 'building', days: 2, messagesPerDay: 20, minDelay: 45000, maxDelay: 120000 },
    { name: 'active', days: 2, messagesPerDay: 35, minDelay: 30000, maxDelay: 90000 },
    { name: 'mature', days: 2, messagesPerDay: 50, minDelay: 20000, maxDelay: 60000 }
  ];
  
  let totalMessagesSent = 0;
  let totalMessagesReceived = 0;
  
  for (const stage of stages) {
    console.log(`[Warm-up] Sessão ${sessionId} - Estágio: ${stage.name}`);
    db.run("UPDATE warmup_sessions SET stage = ? WHERE id = ?", [stage.name, sessionId]);
    
    for (let day = 0; day < stage.days; day++) {
      console.log(`[Warm-up] Dia ${day + 1} do estágio ${stage.name} - ${stage.messagesPerDay} mensagens`);
      
      for (let msgCount = 0; msgCount < stage.messagesPerDay; msgCount++) {
        const sessionStatus = await new Promise((resolve) => {
          db.get("SELECT status FROM warmup_sessions WHERE id = ?", [sessionId], (err, row) => resolve(row?.status));
        });
        
        if (sessionStatus === 'paused') {
          await new Promise(r => setTimeout(r, 10000));
          msgCount--;
          continue;
        }
        
        if (sessionStatus === 'stopped') {
          console.log(`[Warm-up] Sessão ${sessionId} parada`);
          return;
        }
        
        let fromInstance, toInstance, toNumber;
        
        if (multiInstanceMode) {
          const availableInstances = Object.keys(instanceNumbers);
          fromInstance = availableInstances[Math.floor(Math.random() * availableInstances.length)];
          const otherInstances = availableInstances.filter(i => i !== fromInstance);
          toInstance = otherInstances[Math.floor(Math.random() * otherInstances.length)];
          toNumber = instanceNumbers[toInstance];
        } else {
          fromInstance = primaryInstance;
          const buddies = config.buddyNumbers || [];
          if (buddies.length === 0) {
            await new Promise(r => setTimeout(r, 60000));
            continue;
          }
          toNumber = buddies[Math.floor(Math.random() * buddies.length)];
        }
        
        const message = WARMUP_MESSAGES.outgoing[Math.floor(Math.random() * WARMUP_MESSAGES.outgoing.length)];
        console.log(`[Warm-up] ${fromInstance} → ${multiInstanceMode ? toInstance : toNumber}: "${message}"`);
        
        const result = await sendWarmupMessage(fromInstance, toNumber, message);
        
        if (result.success) {
          totalMessagesSent++;
          db.run("UPDATE warmup_sessions SET messages_sent = ? WHERE id = ?", [totalMessagesSent, sessionId]);
          db.run(
            "INSERT INTO warmup_logs (session_id, action, details) VALUES (?, ?, ?)",
            [sessionId, 'sent', `De: ${fromInstance}, Para: ${multiInstanceMode ? toInstance : toNumber}, Msg: ${message}`]
          );
          
          if (multiInstanceMode) {
            const replyChance = stage.name === 'initial' ? 0.9 : stage.name === 'building' ? 0.8 : 0.7;
            
            if (Math.random() < replyChance) {
              const replyDelay = 15000 + Math.random() * 45000;
              await new Promise(r => setTimeout(r, replyDelay));
              
              const replyMessage = WARMUP_MESSAGES.incoming[Math.floor(Math.random() * WARMUP_MESSAGES.incoming.length)];
              const fromNumber = instanceNumbers[fromInstance];
              
              console.log(`[Warm-up] ${toInstance} → ${fromInstance}: "${replyMessage}"`);
              
              const replyResult = await sendWarmupMessage(toInstance, fromNumber, replyMessage);
              
              if (replyResult.success) {
                totalMessagesReceived++;
                db.run("UPDATE warmup_sessions SET messages_received = ? WHERE id = ?", [totalMessagesReceived, sessionId]);
                db.run(
                  "INSERT INTO warmup_logs (session_id, action, details) VALUES (?, ?, ?)",
                  [sessionId, 'received', `De: ${toInstance}, Para: ${fromInstance}, Msg: ${replyMessage}`]
                );
                
                if (Math.random() < 0.4) {
                  await new Promise(r => setTimeout(r, 10000 + Math.random() * 20000));
                  const followUp = WARMUP_MESSAGES.outgoing[Math.floor(Math.random() * WARMUP_MESSAGES.outgoing.length)];
                  await sendWarmupMessage(fromInstance, toNumber, followUp);
                  totalMessagesSent++;
                  db.run("UPDATE warmup_sessions SET messages_sent = ? WHERE id = ?", [totalMessagesSent, sessionId]);
                }
              }
            }
          } else {
            if (Math.random() < 0.8) {
              await new Promise(r => setTimeout(r, 10000 + Math.random() * 50000));
              totalMessagesReceived++;
              db.run("UPDATE warmup_sessions SET messages_received = ? WHERE id = ?", [totalMessagesReceived, sessionId]);
            }
          }
          
          const currentScore = Math.min(Math.round((totalMessagesSent / 200) * 100), 100);
          const progress = Math.round((totalMessagesSent / 200) * 100);
          db.run("UPDATE warmup_sessions SET current_score = ?, progress = ? WHERE id = ?", [currentScore, progress, sessionId]);
        }
        
        const delay = stage.minDelay + Math.random() * (stage.maxDelay - stage.minDelay);
        await new Promise(r => setTimeout(r, delay));
      }
      
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  
  db.run(
    "UPDATE warmup_sessions SET status = 'completed', completed_at = datetime('now'), current_score = 100, progress = 100 WHERE id = ?",
    [sessionId]
  );
  
  console.log(`[Warm-up] ✅ Sessão ${sessionId} COMPLETADA! ${totalMessagesSent} enviadas, ${totalMessagesReceived} recebidas`);
}

// ========== STATS ==========

app.get('/api/stats', (req, res) => {
  db.get("SELECT COUNT(*) as total FROM campaigns", (err, campaigns) => {
    db.get("SELECT COUNT(*) as total FROM contacts", (err, contacts) => {
      db.get(`
        SELECT SUM(sent_count) as total_sent,
          SUM(delivered_count) as total_delivered,
          SUM(read_count) as total_read,
          SUM(replied_count) as total_replied
        FROM campaigns
      `, (err, stats) => {
        res.json({
          totalCampaigns: campaigns?.total || 0,
          totalContacts: contacts?.total || 0,
          today: {
            sent: stats?.total_sent || 0,
            delivered: stats?.total_delivered || 0,
            read: stats?.total_read || 0,
            replied: stats?.total_replied || 0
          },
          conversionRates: {
            delivery: stats?.total_sent ? Math.round((stats.total_delivered / stats.total_sent) * 100) : 0,
            read: stats?.total_delivered ? Math.round((stats.total_read / stats.total_delivered) * 100) : 0,
            reply: stats?.total_read ? Math.round((stats.total_replied / stats.total_read) * 100) : 0
          }
        });
      });
    });
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Agency Marketing API',
    version: '6.0-final',
    features: [
      'QR Code funcionando',
      'Multi-instance warm-up',
      'Number verification',
      'Campaign analytics',
      'Auto-rotation'
    ]
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Agency Marketing API',
    version: '6.0',
    features: [
      'Evolution API integration',
      'Campaign management',
      'Templates',
      'Mailing lists',
      'Multi-instance Warm-up',
      'Number verification',
      'Auto instance rotation',
      'Campaign analytics'
    ]
  });
});

// ========== FEATURES EXTRAS v6.0 ==========

// 1. VERIFICADOR DE NÚMEROS WHATSAPP (BULK)
app.post('/api/verify-numbers', async (req, res) => {
  const { instance_name, numbers } = req.body;
  
  if (!instance_name || !numbers || !Array.isArray(numbers)) {
    return res.status(400).json({ error: 'instance_name e array numbers obrigatórios' });
  }
  
  try {
    // Limitar a 100 números por vez
    const batch = numbers.slice(0, 100);
    
    const response = await axios.post(
      `${EVOLUTION_URL}/chat/whatsappNumbers/${instance_name}`,
      { numbers: batch },
      { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' } }
    );
    
    const results = response.data || [];
    const valid = results.filter(r => r.exists).length;
    const invalid = results.length - valid;
    
    res.json({
      total_checked: results.length,
      valid: valid,
      invalid: invalid,
      results: results
    });
  } catch (error) {
    console.error('Verify numbers error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. OBTER NÚMERO DA INSTÂNCIA CONECTADA
app.get('/api/evolution/:name/number', async (req, res) => {
  try {
    const response = await axios.get(
      `${EVOLUTION_URL}/instance/fetchInstances`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    
    const instances = response.data || [];
    const instance = instances.find(i => i.instance?.instanceName === req.params.name);
    
    if (instance?.instance?.owner) {
      // Extrair número do formato 5521987945000@s.whatsapp.net
      const number = instance.instance.owner.replace(/@s\.whatsapp\.net$/, '');
      res.json({
        number: number,
        owner: instance.instance.owner,
        profileName: instance.instance.profileName,
        status: instance.instance.status
      });
    } else {
      res.status(404).json({ error: 'Instância não encontrada ou não conectada' });
    }
  } catch (error) {
    console.error('Get number error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 3. ESTATÍSTICAS DETALHADAS DE CAMPANHA
app.get('/api/campaigns/:id/stats', (req, res) => {
  const campaignId = req.params.id;
  
  db.get(`
    SELECT c.*, t.name as template_name, t.content as template_content, m.name as mailing_name
    FROM campaigns c
    LEFT JOIN templates t ON c.template_id = t.id
    LEFT JOIN mailing_lists m ON c.mailing_id = m.id
    WHERE c.id = ?
  `, [campaignId], (err, campaign) => {
    if (err || !campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    db.get("SELECT COUNT(*) as total FROM contacts WHERE mailing_id = ?", [campaign.mailing_id], (err, contacts) => {
      const totalContacts = contacts?.total || 0;
      const sent = campaign.sent_count || 0;
      const delivered = campaign.delivered_count || 0;
      const read = campaign.read_count || 0;
      const replied = campaign.replied_count || 0;
      const failed = campaign.failed_count || 0;
      
      // Calcular taxas
      const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
      const readRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;
      const replyRate = read > 0 ? Math.round((replied / read) * 100) : 0;
      const successRate = sent > 0 ? Math.round(((sent - failed) / sent) * 100) : 0;
      
      res.json({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          instance_name: campaign.instance_name,
          template_name: campaign.template_name,
          mailing_name: campaign.mailing_name,
          created_at: campaign.created_at
        },
        summary: {
          total_contacts: totalContacts,
          sent: sent,
          delivered: delivered,
          read: read,
          replied: replied,
          failed: failed,
          pending: totalContacts - sent
        },
        rates: {
          delivery: deliveryRate,
          read: readRate,
          reply: replyRate,
          success: successRate
        },
        performance: {
          status: successRate >= 90 ? 'excellent' : successRate >= 70 ? 'good' : successRate >= 50 ? 'average' : 'poor',
          recommendation: successRate < 70 ? 'Considere verificar os números antes de enviar' : 'Campanha performando bem'
        }
      });
    });
  });
});

// 4. REENVIAR PARA FALHOS
app.post('/api/campaigns/:id/retry-failed', (req, res) => {
  const campaignId = req.params.id;
  
  db.get("SELECT * FROM campaigns WHERE id = ?", [campaignId], async (err, campaign) => {
    if (err || !campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    if (campaign.failed_count === 0) {
      return res.json({ message: 'Não há falhas para reenviar', retry_count: 0 });
    }
    
    // Aqui você implementaria a lógica de reenvio
    // Por enquanto, apenas marca como retentativa
    res.json({
      message: 'Funcionalidade de reenvio em desenvolvimento',
      failed_count: campaign.failed_count,
      campaign_id: campaignId
    });
  });
});

// 5. CLONAR CAMPANHA
app.post('/api/campaigns/:id/clone', (req, res) => {
  const campaignId = req.params.id;
  const { new_name } = req.body;
  
  db.get(`
    SELECT c.*, m.total_contacts
    FROM campaigns c
    LEFT JOIN mailing_lists m ON c.mailing_id = m.id
    WHERE c.id = ?
  `, [campaignId], (err, campaign) => {
    if (err || !campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    const name = new_name || `${campaign.name} (Cópia)`;
    
    db.run(
      `INSERT INTO campaigns (name, instance_name, template_id, mailing_id, total_recipients, status)
       VALUES (?, ?, ?, ?, ?, 'draft')`,
      [name, campaign.instance_name, campaign.template_id, campaign.mailing_id, campaign.total_contacts],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          id: this.lastID,
          message: 'Campanha clonada com sucesso',
          original_id: campaignId,
          name: name
        });
      }
    );
  });
});

// 6. PAUSAR/RETOMAR CAMPANHA EM ANDAMENTO
app.post('/api/campaigns/:id/pause', (req, res) => {
  db.run(
    "UPDATE campaigns SET status = 'paused' WHERE id = ? AND status = 'running'",
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(400).json({ error: 'Campanha não está em execução' });
      }
      res.json({ message: 'Campanha pausada' });
    }
  );
});

app.post('/api/campaigns/:id/resume', (req, res) => {
  db.run(
    "UPDATE campaigns SET status = 'running' WHERE id = ? AND status = 'paused'",
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(400).json({ error: 'Campanha não está pausada' });
      }
      res.json({ message: 'Campanha retomada' });
    }
  );
});

// ========== V7.0 - FEATURES AVANÇADAS ==========

// 1. ROTAÇÃO DE INSTÂNCIAS (ANTI-BAN)
// Pool de instâncias para envio distribuído

// Criar pool de rotação
app.post('/api/rotation-pools', (req, res) => {
  const { name, instance_names } = req.body;
  
  if (!name || !instance_names || !Array.isArray(instance_names)) {
    return res.status(400).json({ error: 'name e instance_names (array) são obrigatórios' });
  }
  
  db.run(
    'INSERT INTO rotation_pools (name, instance_names) VALUES (?, ?)',
    [name, JSON.stringify(instance_names)],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, instances: instance_names });
    }
  );
});

// Listar pools
app.get('/api/rotation-pools', (req, res) => {
  db.all('SELECT * FROM rotation_pools WHERE active = 1', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const pools = rows.map(row => ({
      ...row,
      instance_names: JSON.parse(row.instance_names || '[]')
    }));
    res.json(pools);
  });
});

// Enviar mensagem com rotação
app.post('/api/send-rotate', async (req, res) => {
  const { pool_id, to, message, template_id } = req.body;
  
  if (!pool_id || !to) {
    return res.status(400).json({ error: 'pool_id e to são obrigatórios' });
  }
  
  db.get('SELECT * FROM rotation_pools WHERE id = ? AND active = 1', [pool_id], async (err, pool) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!pool) return res.status(404).json({ error: 'Pool não encontrado' });
    
    const instances = JSON.parse(pool.instance_names || '[]');
    if (instances.length === 0) {
      return res.status(400).json({ error: 'Pool não tem instâncias' });
    }
    
    // Selecionar instância por round-robin
    const currentIndex = pool.current_index || 0;
    const selectedInstance = instances[currentIndex % instances.length];
    
    // Atualizar índice
    const nextIndex = (currentIndex + 1) % instances.length;
    db.run('UPDATE rotation_pools SET current_index = ? WHERE id = ?', [nextIndex, pool_id]);
    
    // Verificar blacklist
    const cleanNumber = to.replace(/\D/g, '');
    db.get('SELECT * FROM number_blacklist WHERE number = ? AND list_type = "blacklist"', [cleanNumber], async (err, blacklisted) => {
      if (blacklisted) {
        return res.status(403).json({ error: 'Número está na blacklist', number: to });
      }
      
      try {
        let messageContent = message;
        
        // Se tem template_id, buscar conteúdo
        if (template_id) {
          const template = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM templates WHERE id = ?', [template_id], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          });
          if (template) messageContent = template.content;
        }
        
        // Enviar via Evolution
        const response = await axios.post(
          `${EVOLUTION_URL}/message/sendText/${selectedInstance}`,
          { number: to, text: messageContent },
          { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' } }
        );
        
        // Log de delivery
        db.run(
          'INSERT INTO delivery_logs (campaign_id, instance_name, event_type, event_data) VALUES (?, ?, ?, ?)',
          [null, selectedInstance, 'sent', JSON.stringify({ to, message: messageContent?.substring(0, 100) })]
        );
        
        res.json({
          success: true,
          instance_used: selectedInstance,
          next_index: nextIndex,
          response: response.data
        });
      } catch (error) {
        console.error('Send error:', error.message);
        res.status(500).json({ error: error.message, instance: selectedInstance });
      }
    });
  });
});

// 2. AGENDAMENTO DE CAMPANHAS
app.post('/api/campaigns/:id/schedule', (req, res) => {
  const { scheduled_at, timezone } = req.body;
  
  if (!scheduled_at) {
    return res.status(400).json({ error: 'scheduled_at é obrigatório (ISO 8601)' });
  }
  
  db.run(
    'INSERT INTO campaign_schedules (campaign_id, scheduled_at, timezone) VALUES (?, ?, ?)',
    [req.params.id, scheduled_at, timezone || 'America/Sao_Paulo'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        campaign_id: req.params.id,
        scheduled_at,
        timezone: timezone || 'America/Sao_Paulo',
        status: 'pending'
      });
    }
  );
});

// Listar agendamentos
app.get('/api/campaigns/:id/schedules', (req, res) => {
  db.all(
    'SELECT * FROM campaign_schedules WHERE campaign_id = ? ORDER BY scheduled_at DESC',
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Cancelar agendamento
app.post('/api/schedules/:id/cancel', (req, res) => {
  db.run(
    "UPDATE campaign_schedules SET status = 'cancelled' WHERE id = ?",
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Agendamento cancelado' });
    }
  );
});

// 3. BLACKLIST/WHITELIST
app.post('/api/blacklist/add', (req, res) => {
  const { number, reason, list_type } = req.body;
  
  if (!number) {
    return res.status(400).json({ error: 'number é obrigatório' });
  }
  
  const cleanNumber = number.replace(/\D/g, '');
  
  db.run(
    'INSERT OR REPLACE INTO number_blacklist (number, reason, list_type) VALUES (?, ?, ?)',
    [cleanNumber, reason || '', list_type || 'blacklist'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ number: cleanNumber, reason, list_type: list_type || 'blacklist' });
    }
  );
});

app.get('/api/blacklist', (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT * FROM number_blacklist';
  const params = [];
  
  if (type) {
    sql += ' WHERE list_type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.delete('/api/blacklist/:number', (req, res) => {
  const cleanNumber = req.params.number.replace(/\D/g, '');
  
  db.run('DELETE FROM number_blacklist WHERE number = ?', [cleanNumber], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Número removido', number: cleanNumber });
  });
});

// Verificar número na blacklist
app.get('/api/blacklist/check/:number', (req, res) => {
  const cleanNumber = req.params.number.replace(/\D/g, '');
  
  db.get('SELECT * FROM number_blacklist WHERE number = ?', [cleanNumber], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      number: cleanNumber,
      blacklisted: !!row,
      details: row || null
    });
  });
});

// 4. SEGMENTAÇÃO DE LISTAS (TAGS)
app.post('/api/contacts/:id/tags', (req, res) => {
  const { tags } = req.body; // array de tags
  
  if (!tags || !Array.isArray(tags)) {
    return res.status(400).json({ error: 'tags (array) é obrigatório' });
  }
  
  const stmt = db.prepare('INSERT OR IGNORE INTO contact_tags (contact_id, tag) VALUES (?, ?)');
  tags.forEach(tag => stmt.run(req.params.id, tag));
  stmt.finalize();
  
  res.json({ contact_id: req.params.id, tags_added: tags.length });
});

app.get('/api/contacts/:id/tags', (req, res) => {
  db.all('SELECT tag FROM contact_tags WHERE contact_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.tag));
  });
});

// Criar segmento
app.post('/api/mailing-segments', (req, res) => {
  const { name, mailing_id, tag_filter, condition } = req.body;
  
  if (!name || !mailing_id || !tag_filter) {
    return res.status(400).json({ error: 'name, mailing_id e tag_filter são obrigatórios' });
  }
  
  db.run(
    'INSERT INTO mailing_segments (name, mailing_id, tag_filter, condition) VALUES (?, ?, ?, ?)',
    [name, mailing_id, JSON.stringify(tag_filter), condition || 'all'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, mailing_id, tag_filter, condition: condition || 'all' });
    }
  );
});

// Obter contatos de um segmento
app.get('/api/mailing-segments/:id/contacts', (req, res) => {
  db.get('SELECT * FROM mailing_segments WHERE id = ?', [req.params.id], (err, segment) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!segment) return res.status(404).json({ error: 'Segmento não encontrado' });
    
    const tags = JSON.parse(segment.tag_filter || '[]');
    const condition = segment.condition || 'all';
    
    let sql = `
      SELECT c.* FROM contacts c
      INNER JOIN contact_tags ct ON c.id = ct.contact_id
      WHERE c.mailing_id = ?
    `;
    
    if (condition === 'all') {
      // Todos as tags devem estar presentes
      sql += ` AND ct.tag IN (${tags.map(() => '?').join(',')})
               GROUP BY c.id
               HAVING COUNT(DISTINCT ct.tag) = ?`;
    } else {
      // Qualquer tag basta
      sql += ` AND ct.tag IN (${tags.map(() => '?').join(',')})`;
    }
    
    const params = [segment.mailing_id, ...tags];
    if (condition === 'all') params.push(tags.length);
    
    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ segment: segment.name, contacts: rows, count: rows.length });
    });
  });
});

// 5. FOLLOW-UP AUTOMÁTICO
app.post('/api/follow-ups', (req, res) => {
  const { campaign_id, name, delay_hours, template_id, condition } = req.body;
  
  if (!campaign_id || !name || !delay_hours || !template_id) {
    return res.status(400).json({ error: 'campaign_id, name, delay_hours e template_id são obrigatórios' });
  }
  
  db.run(
    'INSERT INTO follow_ups (campaign_id, name, delay_hours, template_id, condition) VALUES (?, ?, ?, ?, ?)',
    [campaign_id, name, delay_hours, template_id, condition || 'no_reply'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        campaign_id,
        name,
        delay_hours,
        template_id,
        condition: condition || 'no_reply'
      });
    }
  );
});

app.get('/api/campaigns/:id/follow-ups', (req, res) => {
  db.all(
    'SELECT * FROM follow_ups WHERE campaign_id = ? AND active = 1',
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// 6. ANALYTICS AVANÇADO
app.get('/api/analytics/delivery', (req, res) => {
  const { campaign_id, start_date, end_date } = req.query;
  
  let sql = `
    SELECT 
      event_type,
      COUNT(*) as count,
      DATE(created_at) as date,
      STRFTIME('%H', created_at) as hour
    FROM delivery_logs
    WHERE 1=1
  `;
  const params = [];
  
  if (campaign_id) {
    sql += ' AND campaign_id = ?';
    params.push(campaign_id);
  }
  if (start_date) {
    sql += ' AND DATE(created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(created_at) <= ?';
    params.push(end_date);
  }
  
  sql += ' GROUP BY event_type, DATE(created_at), STRFTIME("%H", created_at) ORDER BY date DESC, hour DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Agregar por tipo de evento
    const summary = {};
    rows.forEach(row => {
      if (!summary[row.event_type]) summary[row.event_type] = 0;
      summary[row.event_type] += row.count;
    });
    
    res.json({ summary, details: rows });
  });
});

// Melhores horários
app.get('/api/analytics/best-hours', (req, res) => {
  const { campaign_id } = req.query;
  
  let sql = `
    SELECT 
      STRFTIME('%H', created_at) as hour,
      COUNT(*) as total,
      SUM(CASE WHEN event_type = 'read' THEN 1 ELSE 0 END) as reads
    FROM delivery_logs
    WHERE event_type IN ('sent', 'read')
  `;
  const params = [];
  
  if (campaign_id) {
    sql += ' AND campaign_id = ?';
    params.push(campaign_id);
  }
  
  sql += ' GROUP BY STRFTIME("%H", created_at) ORDER BY reads DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 7. CONFIGURAÇÃO DE VELOCIDADE
app.post('/api/instance-configs', (req, res) => {
  const {
    instance_name,
    mode,
    delay_min,
    delay_max,
    daily_limit,
    hourly_limit,
    active_hours_start,
    active_hours_end
  } = req.body;
  
  if (!instance_name) {
    return res.status(400).json({ error: 'instance_name é obrigatório' });
  }
  
  db.run(
    `INSERT OR REPLACE INTO instance_configs 
     (instance_name, mode, delay_min, delay_max, daily_limit, hourly_limit, active_hours_start, active_hours_end)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      instance_name,
      mode || 'balanced',
      delay_min || 2000,
      delay_max || 5000,
      daily_limit || 500,
      hourly_limit || 100,
      active_hours_start || '08:00',
      active_hours_end || '20:00'
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ instance_name, mode: mode || 'balanced', configured: true });
    }
  );
});

app.get('/api/instance-configs/:instance_name', (req, res) => {
  db.get(
    'SELECT * FROM instance_configs WHERE instance_name = ?',
    [req.params.instance_name],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) {
        // Retorna configuração padrão
        return res.json({
          instance_name: req.params.instance_name,
          mode: 'balanced',
          delay_min: 2000,
          delay_max: 5000,
          daily_limit: 500,
          hourly_limit: 100,
          active_hours_start: '08:00',
          active_hours_end: '20:00'
        });
      }
      res.json(row);
    }
  );
});

// 8. WEBHOOKS
app.post('/api/webhooks', (req, res) => {
  const { name, url, events, secret } = req.body;
  
  if (!name || !url || !events) {
    return res.status(400).json({ error: 'name, url e events são obrigatórios' });
  }
  
  db.run(
    'INSERT INTO webhooks (name, url, events, secret) VALUES (?, ?, ?, ?)',
    [name, url, JSON.stringify(events), secret || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, url, events });
    }
  );
});

app.get('/api/webhooks', (req, res) => {
  db.all('SELECT * FROM webhooks WHERE active = 1', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const webhooks = rows.map(row => ({
      ...row,
      events: JSON.parse(row.events || '[]')
    }));
    res.json(webhooks);
  });
});

// 9. CLIENTES E CRÉDITOS (MULTI-TENANT)
app.post('/api/clients', (req, res) => {
  const { name, email, credits, monthly_limit } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'name é obrigatório' });
  }
  
  db.run(
    'INSERT INTO clients (name, email, credits, monthly_limit) VALUES (?, ?, ?, ?)',
    [name, email || '', credits || 0, monthly_limit || 1000],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, email, credits: credits || 0 });
    }
  );
});

app.get('/api/clients', (req, res) => {
  db.all('SELECT * FROM clients WHERE active = 1 ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Adicionar créditos
app.post('/api/clients/:id/credits', (req, res) => {
  const { amount, description } = req.body;
  
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: 'amount (número) é obrigatório' });
  }
  
  db.serialize(() => {
    db.run('UPDATE clients SET credits = credits + ? WHERE id = ?', [amount, req.params.id]);
    db.run(
      'INSERT INTO credit_transactions (client_id, amount, description) VALUES (?, ?, ?)',
      [req.params.id, amount, description || 'Adição de créditos']
    );
  });
  
  res.json({ client_id: req.params.id, credits_added: amount });
});

// Ver saldo
app.get('/api/clients/:id/credits', (req, res) => {
  db.get('SELECT credits, monthly_limit FROM clients WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Cliente não encontrado' });
    
    db.all(
      'SELECT * FROM credit_transactions WHERE client_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.params.id],
      (err, transactions) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ...row, recent_transactions: transactions });
      }
    );
  });
});

// ========== UTILIDADES ==========

// Dashboard completo
app.get('/api/dashboard', (req, res) => {
  const stats = {};
  
  db.serialize(() => {
    // Campanhas
    db.get("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as active FROM campaigns", [], (err, row) => {
      stats.campaigns = row;
    });
    
    // Contatos
    db.get("SELECT COUNT(*) as total FROM contacts", [], (err, row) => {
      stats.contacts = row;
    });
    
    // Templates
    db.get("SELECT COUNT(*) as total FROM templates", [], (err, row) => {
      stats.templates = row;
    });
    
    // Instâncias conectadas
    db.get("SELECT COUNT(*) as total FROM instance_configs", [], (err, row) => {
      stats.configured_instances = row?.total || 0;
    });
    
    // Blacklist
    db.get("SELECT COUNT(*) as total FROM number_blacklist WHERE list_type = 'blacklist'", [], (err, row) => {
      stats.blacklisted = row?.total || 0;
    });
    
    // Envios hoje
    db.get("SELECT COUNT(*) as total FROM delivery_logs WHERE DATE(created_at) = DATE('now') AND event_type = 'sent'", [], (err, row) => {
      stats.sent_today = row?.total || 0;
      
      // Responder quando todas as queries terminarem
      res.json({
        version: '7.0-pro',
        stats,
        features: [
          'rotação_de_instâncias',
          'agendamento',
          'blacklist',
          'segmentação',
          'follow_up',
          'analytics',
          'webhooks',
          'multi_tenant'
        ]
      });
    });
  });
});

// Exportar relatório CSV
app.get('/api/reports/csv/:campaign_id', (req, res) => {
  const campaignId = req.params.campaign_id;
  
  db.all(
    `SELECT 
      c.name as contact_name,
      c.phone,
      dl.event_type,
      dl.created_at as event_time
    FROM delivery_logs dl
    LEFT JOIN contacts c ON dl.contact_id = c.id
    WHERE dl.campaign_id = ?
    ORDER BY dl.created_at DESC`,
    [campaignId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Gerar CSV
      const headers = ['Nome', 'Telefone', 'Evento', 'Horário'];
      const csv = [
        headers.join(','),
        ...rows.map(row => [
          `"${row.contact_name || ''}"`,
          row.phone,
          row.event_type,
          row.event_time
        ].join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-campanha-${campaignId}.csv"`);
      res.send(csv);
    }
  );
});

initDB();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Agency API v7.0 PRO rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`✅ Features: Rotação, Agendamento, Blacklist, Analytics, Multi-tenant`);
  
  // Iniciar cron de agendamentos
  startScheduleChecker();
  // Iniciar cron de follow-ups
  startFollowUpChecker();
});

// ========== CRON INTERNO ==========

// Verificar campanhas agendadas a cada minuto
function startScheduleChecker() {
  setInterval(async () => {
    const now = new Date().toISOString();
    
    db.all(
      `SELECT s.*, c.*, s.id as schedule_id
       FROM campaign_schedules s
       JOIN campaigns c ON s.campaign_id = c.id
       WHERE s.status = 'pending' AND s.scheduled_at <= ?`,
      [now],
      async (err, schedules) => {
        if (err || !schedules || schedules.length === 0) return;
        
        for (const schedule of schedules) {
          console.log(`[Cron] Executando campanha agendada #${schedule.campaign_id}`);
          
          // Marcar como enviado
          db.run('UPDATE campaign_schedules SET status = "sent" WHERE id = ?', [schedule.schedule_id]);
          
          // Iniciar campanha (chamar endpoint interno)
          try {
            await axios.post(`http://localhost:${PORT}/api/campaigns/${schedule.campaign_id}/start`);
          } catch (error) {
            console.error(`[Cron] Erro ao iniciar campanha #${schedule.campaign_id}:`, error.message);
          }
        }
      }
    );
  }, 60000); // A cada minuto
  
  console.log('[Cron] Verificador de agendamentos iniciado (a cada 60s)');
}

// Verificar follow-ups a cada 15 minutos
function startFollowUpChecker() {
  setInterval(async () => {
    db.all(
      `SELECT f.*, c.name as campaign_name, t.content as template_content
       FROM follow_ups f
       JOIN campaigns c ON f.campaign_id = c.id
       JOIN templates t ON f.template_id = t.id
       WHERE f.active = 1`,
      [],
      async (err, followups) => {
        if (err || !followups || followups.length === 0) return;
        
        for (const followup of followups) {
          const delayMs = followup.delay_hours * 60 * 60 * 1000;
          const cutoffTime = new Date(Date.now() - delayMs).toISOString();
          
          // Buscar contatos que receberam mas não responderam
          db.all(
            `SELECT DISTINCT c.* FROM contacts c
             JOIN delivery_logs dl_sent ON dl_sent.contact_id = c.id
             LEFT JOIN delivery_logs dl_reply ON dl_reply.contact_id = c.id 
               AND dl_reply.event_type = 'replied' 
               AND dl_reply.created_at > dl_sent.created_at
             WHERE dl_sent.campaign_id = ? 
               AND dl_sent.event_type = 'sent'
               AND dl_sent.created_at <= ?
               AND dl_reply.id IS NULL
               AND c.id NOT IN (
                 SELECT contact_id FROM follow_up_logs 
                 WHERE follow_up_id = ?
               )`,
            [followup.campaign_id, cutoffTime, followup.id],
            async (err, contacts) => {
              if (err || !contacts || contacts.length === 0) return;
              
              console.log(`[FollowUp] Enviando ${contacts.length} follow-ups para campanha #${followup.campaign_id}`);
              
              for (const contact of contacts) {
                try {
                  // Buscar uma instância configurada
                  const instanceConfig = await new Promise((resolve) => {
                    db.get('SELECT * FROM instance_configs LIMIT 1', [], (err, row) => resolve(row));
                  });
                  const instanceName = instanceConfig?.instance_name || 'teste';
                  
                  // Enviar mensagem de follow-up
                  await axios.post(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
                    number: contact.phone,
                    text: followup.template_content
                  }, { headers: { 'apikey': EVOLUTION_KEY } });
                  
                  // Log
                  db.run('INSERT INTO follow_up_logs (follow_up_id, contact_id) VALUES (?, ?)', 
                    [followup.id, contact.id]);
                } catch (error) {
                  console.error(`[FollowUp] Erro ao enviar para ${contact.phone}:`, error.message);
                }
              }
            }
          );
        }
      }
    );
  }, 900000); // A cada 15 minutos
  
  console.log('[Cron] Verificador de follow-ups iniciado (a cada 15min)');
}
