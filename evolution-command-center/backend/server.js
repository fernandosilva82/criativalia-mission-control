const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Database = require('better-sqlite3');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const WebSocket = require('ws');
const http = require('http');
const cron = require('node-cron');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const PORT = process.env.PORT || 3333;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Database
const dbPath = process.env.DATABASE_URL || './data/command-center.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);

// Init database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    instance_id TEXT UNIQUE,
    status TEXT DEFAULT 'disconnected',
    phone_number TEXT,
    profile_picture TEXT,
    connected_at DATETIME,
    last_activity DATETIME,
    settings TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id TEXT,
    remote_jid TEXT,
    message_type TEXT,
    content TEXT,
    from_me BOOLEAN,
    message_id TEXT,
    timestamp DATETIME,
    status TEXT,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id TEXT,
    remote_jid TEXT,
    name TEXT,
    phone TEXT,
    profile_pic_url TEXT,
    last_message_at DATETIME,
    message_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    instance_id TEXT,
    message_template TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    total_contacts INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    scheduled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS campaign_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT,
    contact_jid TEXT,
    status TEXT DEFAULT 'pending',
    sent_at DATETIME,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT,
    category TEXT,
    message TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_messages_instance ON messages(instance_id);
  CREATE INDEX IF NOT EXISTS idx_messages_remote_jid ON messages(remote_jid);
  CREATE INDEX IF NOT EXISTS idx_contacts_instance ON contacts(instance_id);
  CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at);
`);

// Default admin user
const initAdmin = () => {
  const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashed = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run('admin', hashed, 'admin');
    console.log('✅ Usuário admin criado');
  }
};
initAdmin();

// Logger
function log(level, category, message, metadata = {}) {
  const stmt = db.prepare('INSERT INTO logs (level, category, message, metadata) VALUES (?, ?, ?, ?)');
  stmt.run(level, category, message, JSON.stringify(metadata));
  
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    metadata
  };
  
  console.log(`[${entry.timestamp}] [${level.toUpperCase()}] [${category}] ${message}`);
  
  // Broadcast to WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'log', data: entry }));
    }
  });
}

// Evolution API Client
class EvolutionAPI {
  constructor() {
    this.baseURL = process.env.EVOLUTION_BASE_URL || 'http://localhost:8080';
    this.apiKey = process.env.EVOLUTION_API_KEY;
  }

  async request(method, endpoint, data = null, instanceName = null) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey
    };

    if (instanceName) {
      headers.instance = instanceName;
    }

    try {
      const response = await axios({
        method,
        url,
        data,
        headers,
        timeout: 30000
      });
      return { success: true, data: response.data };
    } catch (error) {
      log('error', 'evolution-api', `API Error: ${endpoint}`, { error: error.message });
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Instance Management
  async fetchInstances() {
    return this.request('GET', '/instance/fetchInstances');
  }

  async createInstance(name, settings = {}) {
    return this.request('POST', '/instance/create', {
      instanceName: name,
      ...settings
    });
  }

  async connectInstance(name) {
    return this.request('GET', `/instance/connect/${name}`);
  }

  async logoutInstance(name) {
    return this.request('DELETE', `/instance/logout/${name}`);
  }

  async deleteInstance(name) {
    return this.request('DELETE', `/instance/delete/${name}`);
  }

  async setPresence(name, presence) {
    return this.request('POST', '/chat/setPresence', {
      number: presence
    }, name);
  }

  // Messaging
  async sendText(instance, number, text, options = {}) {
    const cleanNumber = number.replace(/\D/g, '');
    return this.request('POST', '/message/sendText', {
      number: cleanNumber,
      text,
      ...options
    }, instance);
  }

  async sendMedia(instance, number, media, caption = '') {
    const cleanNumber = number.replace(/\D/g, '');
    return this.request('POST', '/message/sendMedia', {
      number: cleanNumber,
      media,
      caption
    }, instance);
  }

  async sendLocation(instance, number, latitude, longitude, name = '') {
    return this.request('POST', '/message/sendLocation', {
      number: number.replace(/\D/g, ''),
      latitude,
      longitude,
      name
    }, instance);
  }

  async sendPoll(instance, number, name, options) {
    return this.request('POST', '/message/sendPoll', {
      number: number.replace(/\D/g, ''),
      name,
      options
    }, instance);
  }

  // Contacts & Groups
  async getContacts(instance) {
    return this.request('POST', '/chat/fetchContacts', {}, instance);
  }

  async getProfilePicture(instance, number) {
    return this.request('POST', '/chat/fetchProfilePictureUrl', {
      number: number.replace(/\D/g, '')
    }, instance);
  }

  async getProfileStatus(instance, number) {
    return this.request('POST', '/chat/fetchProfileStatus', {
      number: number.replace(/\D/g, '')
    }, instance);
  }

  // Groups
  async getGroups(instance) {
    return this.request('GET', '/group/fetchAllGroups', null, instance);
  }

  async createGroup(instance, subject, description, participants) {
    return this.request('POST', '/group/create', {
      subject,
      description,
      participants
    }, instance);
  }

  async sendGroupMessage(instance, groupId, text) {
    return this.request('POST', '/message/sendText', {
      number: groupId,
      text
    }, instance);
  }
}

const evolution = new EvolutionAPI();

// Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Routes

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  log('info', 'auth', 'Login realizado', { username });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticate, async (req, res) => {
  const instances = db.prepare('SELECT COUNT(*) as count FROM instances').get();
  const messages = db.prepare('SELECT COUNT(*) as count FROM messages').get();
  const contacts = db.prepare('SELECT COUNT(*) as count FROM contacts').get();
  const campaigns = db.prepare('SELECT COUNT(*) as count FROM campaigns').get();
  
  const today = new Date().toISOString().split('T')[0];
  const todayMessages = db.prepare(`
    SELECT COUNT(*) as count FROM messages WHERE DATE(timestamp) = ?
  `).get(today);

  res.json({
    instances: instances.count,
    messages: messages.count,
    contacts: contacts.count,
    campaigns: campaigns.count,
    todayMessages: todayMessages.count
  });
});

// Instances
app.get('/api/instances', authenticate, async (req, res) => {
  // Fetch from Evolution API
  const result = await evolution.fetchInstances();
  
  if (result.success) {
    // Sync with local DB
    const instances = result.data || [];
    
    for (const inst of instances) {
      const exists = db.prepare('SELECT * FROM instances WHERE instance_id = ?').get(inst.instanceId || inst.id);
      if (exists) {
        db.prepare(`
          UPDATE instances 
          SET name = ?, status = ?, phone_number = ?, last_activity = ?
          WHERE instance_id = ?
        `).run(inst.instanceName || inst.name, inst.connectionStatus || inst.status, inst.ownerJid, new Date().toISOString(), inst.instanceId || inst.id);
      } else {
        db.prepare(`
          INSERT INTO instances (id, name, instance_id, status)
          VALUES (?, ?, ?, ?)
        `).run(inst.instanceId || inst.id, inst.instanceName || inst.name, inst.instanceId || inst.id, inst.connectionStatus || inst.status);
      }
    }
    
    res.json(instances);
  } else {
    // Return from DB if API fails
    const local = db.prepare('SELECT * FROM instances').all();
    res.json(local);
  }
});

app.post('/api/instances', authenticate, async (req, res) => {
  const { name, settings } = req.body;
  
  const result = await evolution.createInstance(name, settings);
  
  if (result.success) {
    log('info', 'instance', 'Instância criada', { name });
    res.json(result.data);
  } else {
    res.status(400).json({ error: result.error });
  }
});

app.get('/api/instances/:name/connect', authenticate, async (req, res) => {
  const result = await evolution.connectInstance(req.params.name);
  res.json(result);
});

app.delete('/api/instances/:name', authenticate, async (req, res) => {
  const result = await evolution.deleteInstance(req.params.name);
  
  if (result.success) {
    db.prepare('DELETE FROM instances WHERE name = ?').run(req.params.name);
    log('info', 'instance', 'Instância deletada', { name: req.params.name });
  }
  
  res.json(result);
});

// Messaging
app.post('/api/instances/:name/send', authenticate, async (req, res) => {
  const { number, text, options } = req.body;
  
  const result = await evolution.sendText(req.params.name, number, text, options);
  
  if (result.success) {
    log('info', 'message', 'Mensagem enviada', { instance: req.params.name, number });
  }
  
  res.json(result);
});

app.post('/api/instances/:name/send-media', authenticate, async (req, res) => {
  const { number, media, caption } = req.body;
  
  const result = await evolution.sendMedia(req.params.name, number, media, caption);
  res.json(result);
});

// Contacts
app.get('/api/instances/:name/contacts', authenticate, async (req, res) => {
  const result = await evolution.getContacts(req.params.name);
  
  if (result.success) {
    // Store in DB
    const contacts = result.data || [];
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO contacts (instance_id, remote_jid, name, phone)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const contact of contacts) {
      stmt.run(req.params.name, contact.id, contact.name || contact.pushname, contact.id?.split('@')[0]);
    }
    
    res.json(contacts);
  } else {
    res.status(400).json({ error: result.error });
  }
});

// Groups
app.get('/api/instances/:name/groups', authenticate, async (req, res) => {
  const result = await evolution.getGroups(req.params.name);
  res.json(result);
});

// Campaigns
app.get('/api/campaigns', authenticate, (req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
  res.json(campaigns);
});

app.post('/api/campaigns', authenticate, (req, res) => {
  const { name, instance_id, message_template, contacts, scheduled_at } = req.body;
  const id = require('crypto').randomUUID();
  
  db.prepare(`
    INSERT INTO campaigns (id, name, instance_id, message_template, total_contacts, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, instance_id, message_template, contacts.length, scheduled_at);
  
  const stmt = db.prepare(`
    INSERT INTO campaign_contacts (campaign_id, contact_jid)
    VALUES (?, ?)
  `);
  
  for (const contact of contacts) {
    stmt.run(id, contact.jid || contact);
  }
  
  log('info', 'campaign', 'Campanha criada', { id, name, contacts: contacts.length });
  res.json({ id, name, status: 'pending' });
});

app.post('/api/campaigns/:id/start', authenticate, async (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
  
  db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('running', req.params.id);
  
  // Process in background
  processCampaign(campaign);
  
  res.json({ status: 'running' });
});

// Process campaign
async function processCampaign(campaign) {
  const contacts = db.prepare('SELECT * FROM campaign_contacts WHERE campaign_id = ? AND status = ?')
    .all(campaign.id, 'pending');
  
  for (const contact of contacts) {
    const result = await evolution.sendText(
      campaign.instance_id,
      contact.contact_jid,
      campaign.message_template
    );
    
    if (result.success) {
      db.prepare('UPDATE campaign_contacts SET status = ?, sent_at = ? WHERE id = ?')
        .run('sent', new Date().toISOString(), contact.id);
      db.prepare('UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = ?').run(campaign.id);
    } else {
      db.prepare('UPDATE campaign_contacts SET status = ?, error_message = ? WHERE id = ?')
        .run('failed', result.error, contact.id);
      db.prepare('UPDATE campaigns SET failed_count = failed_count + 1 WHERE id = ?').run(campaign.id);
    }
    
    // Anti-block delay
    await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
  }
  
  db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('completed', campaign.id);
  log('info', 'campaign', 'Campanha finalizada', { id: campaign.id });
}

// Logs
app.get('/api/logs', authenticate, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs = db.prepare('SELECT * FROM logs ORDER BY created_at DESC LIMIT ?').all(limit);
  res.json(logs);
});

// WebSocket
wss.on('connection', (ws) => {
  log('info', 'websocket', 'Cliente conectado');
  
  ws.on('close', () => {
    log('info', 'websocket', 'Cliente desconectado');
  });
});

// Error handler
app.use((err, req, res, next) => {
  log('error', 'server', err.message, { stack: err.stack });
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start
server.listen(PORT, () => {
  log('info', 'server', `Evolution Command Center rodando na porta ${PORT}`);
});

module.exports = { app, server, evolution };
