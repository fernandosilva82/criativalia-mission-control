const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Database = require('better-sqlite3');
const Queue = require('bull');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Database
const dbPath = process.env.DATABASE_URL?.replace('sqlite://', '') || '/app/data/central.db';
const db = new Database(dbPath);

// Init database
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    message_template TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    total_contacts INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    campaign_id TEXT,
    phone TEXT NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'pending',
    sent_at DATETIME,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );

  CREATE TABLE IF NOT EXISTS instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT,
    status TEXT DEFAULT 'disconnected',
    connected_at DATETIME,
    last_activity DATETIME,
    daily_sent INTEGER DEFAULT 0,
    last_reset DATE
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT,
    message TEXT,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_contacts_campaign ON contacts(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
`);

// Redis Queue
const messageQueue = new Queue('message-sending', process.env.REDIS_URL || 'redis://localhost:6379');

// Logger
function log(level, message, data = {}) {
  const stmt = db.prepare('INSERT INTO logs (level, message, data) VALUES (?, ?, ?)');
  stmt.run(level, message, JSON.stringify(data));
  console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`, data);
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  const stats = messageQueue.getJobCounts();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    queue: stats
  });
});

// Listar campanhas
app.get('/api/campaigns', (req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
  res.json(campaigns);
});

// Criar campanha
app.post('/api/campaigns', (req, res) => {
  const { name, message_template, contacts } = req.body;
  
  if (!name || !message_template || !contacts || !Array.isArray(contacts)) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const campaignId = uuidv4();
  
  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (id, name, message_template, total_contacts, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);
  insertCampaign.run(campaignId, name, message_template, contacts.length);

  const insertContact = db.prepare(`
    INSERT INTO contacts (id, campaign_id, phone, name)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction((contactsList) => {
    for (const contact of contactsList) {
      insertContact.run(uuidv4(), campaignId, contact.phone, contact.name || '');
    }
  });

  insertMany(contacts);

  log('info', 'Campanha criada', { campaignId, name, contacts: contacts.length });

  res.json({ 
    id: campaignId, 
    name, 
    total_contacts: contacts.length,
    status: 'pending'
  });
});

// Iniciar campanha
app.post('/api/campaigns/:id/start', async (req, res) => {
  const { id } = req.params;
  
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campanha não encontrada' });
  }

  if (campaign.status !== 'pending') {
    return res.status(400).json({ error: 'Campanha já iniciada ou finalizada' });
  }

  // Atualizar status
  db.prepare('UPDATE campaigns SET status = ?, started_at = ? WHERE id = ?')
    .run('running', new Date().toISOString(), id);

  // Buscar contatos pendentes
  const contacts = db.prepare('SELECT * FROM contacts WHERE campaign_id = ? AND status = ?')
    .all(id, 'pending');

  // Adicionar à fila
  for (const contact of contacts) {
    await messageQueue.add('send-message', {
      contactId: contact.id,
      campaignId: id,
      phone: contact.phone,
      name: contact.name,
      message: campaign.message_template
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000
      }
    });
  }

  log('info', 'Campanha iniciada', { campaignId: id, contacts: contacts.length });

  res.json({ 
    status: 'started', 
    campaignId: id,
    queued: contacts.length 
  });
});

// Pausar campanha
app.post('/api/campaigns/:id/pause', (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('paused', id);
  log('info', 'Campanha pausada', { campaignId: id });
  res.json({ status: 'paused' });
});

// Status da campanha
app.get('/api/campaigns/:id/status', (req, res) => {
  const { id } = req.params;
  
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campanha não encontrada' });
  }

  const stats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM contacts 
    WHERE campaign_id = ?
    GROUP BY status
  `).all(id);

  res.json({
    ...campaign,
    breakdown: stats
  });
});

// Listar instâncias
app.get('/api/instances', (req, res) => {
  const instances = db.prepare('SELECT * FROM instances').all();
  res.json(instances);
});

// Criar instância
app.post('/api/instances', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO instances (id, name) VALUES (?, ?)').run(id, name);
  
  log('info', 'Instância criada', { instanceId: id, name });
  res.json({ id, name, status: 'disconnected' });
});

// Logs
app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs = db.prepare('SELECT * FROM logs ORDER BY created_at DESC LIMIT ?').all(limit);
  res.json(logs);
});

// Estatísticas gerais
app.get('/api/stats', (req, res) => {
  const campaigns = db.prepare('SELECT COUNT(*) as total, SUM(sent_count) as sent FROM campaigns').get();
  const today = new Date().toISOString().split('T')[0];
  const todaySent = db.prepare(`
    SELECT COUNT(*) as count FROM contacts 
    WHERE DATE(sent_at) = ? AND status = 'sent'
  `).get(today);

  res.json({
    total_campaigns: campaigns.total,
    total_sent: campaigns.sent || 0,
    sent_today: todaySent.count,
    queue_status: 'active'
  });
});

// Upload CSV
const multer = require('multer');
const upload = multer({ dest: '/tmp/uploads/' });
const { parse } = require('csv-parse/sync');

app.post('/api/upload-csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo não enviado' });
  }

  try {
    const content = fs.readFileSync(req.file.path, 'utf8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true
    });

    const contacts = records.map(r => ({
      phone: r.telefone || r.phone || r.numero || r.tel,
      name: r.nome || r.name || r.Nome || ''
    })).filter(c => c.phone);

    fs.unlinkSync(req.file.path);

    res.json({
      contacts,
      count: contacts.length
    });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao processar CSV: ' + error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  log('error', 'API Error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start
app.listen(PORT, () => {
  log('info', `Central de Disparos API rodando na porta ${PORT}`);
});

module.exports = app;
