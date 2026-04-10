const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();
const PORT = 7778;

// Evolution API config
const EVOLUTION_URL = 'http://agency-evolution:8080';
const EVOLUTION_KEY = 'agency-evolution-2024';

app.use(cors());
app.use(express.json());

// Database
const DB_PATH = '/opt/agency/database/agency.db';
const db = new sqlite3.Database(DB_PATH);

// Init database
function initDB() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      template_id INTEGER,
      mailing_id INTEGER,
      instance_id INTEGER,
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
  });
}

// ========== EVOLUTION API INTEGRATION ==========

// Listar instâncias do Evolution
app.get('/api/evolution/instances', async (req, res) => {
  try {
    const response = await axios.get(`${EVOLUTION_URL}/instance/fetchInstances`, {
      headers: { 'apikey': EVOLUTION_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message, instances: [] });
  }
});

// Criar nova instância
app.post('/api/evolution/instances', async (req, res) => {
  const { name, description } = req.body;
  try {
    const response = await axios.post(`${EVOLUTION_URL}/instance/create`, {
      instanceName: name,
      description: description || '',
      qrcode: true,
      number: ''
    }, {
      headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Conectar instância (gerar QR Code)
app.get('/api/evolution/instances/:name/connect', async (req, res) => {
  try {
    const response = await axios.get(
      `${EVOLUTION_URL}/instance/connect/${req.params.name}`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status da instância
app.get('/api/evolution/instances/:name/status', async (req, res) => {
  try {
    const response = await axios.get(
      `${EVOLUTION_URL}/instance/connectionState/${req.params.name}`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Desconectar instância
app.post('/api/evolution/instances/:name/logout', async (req, res) => {
  try {
    const response = await axios.delete(
      `${EVOLUTION_URL}/instance/logout/${req.params.name}`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensagem
app.post('/api/evolution/instances/:name/send', async (req, res) => {
  const { number, message } = req.body;
  try {
    const response = await axios.post(
      `${EVOLUTION_URL}/message/sendText/${req.params.name}`,
      { number, text: message },
      { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar instância
app.delete('/api/evolution/instances/:name', async (req, res) => {
  try {
    const response = await axios.delete(
      `${EVOLUTION_URL}/instance/delete/${req.params.name}`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    res.json(response.data);
  } catch (error) {
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
  const { name, content, variables } = req.body;
  db.run(
    "INSERT INTO templates (name, content, variables) VALUES (?, ?, ?)",
    [name, content, JSON.stringify(variables || [])],
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

// ========== MAILING ==========

app.get('/api/mailing', (req, res) => {
  db.all("SELECT * FROM mailing_lists ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/mailing', (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO mailing_lists (name) VALUES (?)", [name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Lista criada' });
  });
});

app.get('/api/mailing/:id/contacts', (req, res) => {
  db.all("SELECT * FROM contacts WHERE mailing_id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/mailing/:id/contacts', (req, res) => {
  const { contacts } = req.body;
  const stmt = db.prepare("INSERT INTO contacts (mailing_id, phone, name) VALUES (?, ?, ?)");
  let count = 0;
  
  contacts.forEach(c => {
    stmt.run(req.params.id, c.phone, c.name);
    count++;
  });
  stmt.finalize();
  
  db.run(
    "UPDATE mailing_lists SET total_contacts = (SELECT COUNT(*) FROM contacts WHERE mailing_id = ?) WHERE id = ?",
    [req.params.id, req.params.id]
  );
  
  res.json({ imported: count });
});

app.delete('/api/mailing/:id', (req, res) => {
  db.run("DELETE FROM contacts WHERE mailing_id = ?", [req.params.id], () => {
    db.run("DELETE FROM mailing_lists WHERE id = ?", [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Lista deletada' });
    });
  });
});

// ========== CAMPANHAS ==========

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
  const { name, template_id, mailing_id, instance_id } = req.body;
  
  db.get("SELECT COUNT(*) as count FROM contacts WHERE mailing_id = ?", [mailing_id], (err, row) => {
    const total = row.count;
    
    db.run(
      "INSERT INTO campaigns (name, template_id, mailing_id, instance_id, total_recipients) VALUES (?, ?, ?, ?, ?)",
      [name, template_id, mailing_id, instance_id, total],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Campanha criada', total_recipients: total });
      }
    );
  });
});

// Iniciar campanha
app.post('/api/campaigns/:id/start', async (req, res) => {
  const campaignId = req.params.id;
  
  // Buscar campanha
  db.get(`
    SELECT c.*, t.content as template_content
    FROM campaigns c
    LEFT JOIN templates t ON c.template_id = t.id
    WHERE c.id = ?
  `, [campaignId], async (err, campaign) => {
    if (err || !campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    // Buscar contatos
    db.all("SELECT * FROM contacts WHERE mailing_id = ? AND status = 'valid'", 
      [campaign.mailing_id], async (err, contacts) => {
      
      if (contacts.length === 0) {
        return res.status(400).json({ error: 'Nenhum contato válido' });
      }
      
      // Atualizar status
      db.run("UPDATE campaigns SET status = 'running' WHERE id = ?", [campaignId]);
      
      res.json({ 
        message: 'Campanha iniciada', 
        total: contacts.length,
        campaign: campaign
      });
      
      // Iniciar envio em background
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
        `${EVOLUTION_URL}/message/sendText/${campaign.instance_id}`,
        { number: contact.phone, text: message },
        { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' } }
      );
      
      sent++;
      db.run("UPDATE campaigns SET sent_count = ? WHERE id = ?", [sent, campaign.id]);
      
      // Delay entre mensagens
      await new Promise(r => setTimeout(r, 5000 + Math.random() * 10000));
      
    } catch (error) {
      failed++;
      console.error('Erro ao enviar:', error.message);
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

// ========== STATS ==========

app.get('/api/stats', (req, res) => {
  db.get("SELECT COUNT(*) as total FROM campaigns", (err, campaigns) => {
    db.get("SELECT COUNT(*) as total FROM contacts WHERE status = 'valid'", (err, contacts) => {
      db.get(`
        SELECT 
          SUM(sent_count) as total_sent,
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
            delivery: stats?.total_sent ? ((stats.total_delivered / stats.total_sent) * 100).toFixed(1) : 0,
            read: stats?.total_delivered ? ((stats.total_read / stats.total_delivered) * 100).toFixed(1) : 0,
            reply: stats?.total_read ? ((stats.total_replied / stats.total_read) * 100).toFixed(1) : 0
          }
        });
      });
    });
  });
});

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Agency Marketing API' });
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Agency Marketing API',
    version: '2.0.0 - FUNCIONAL',
    endpoints: {
      evolution: '/api/evolution/*',
      templates: '/api/templates',
      mailing: '/api/mailing',
      campaigns: '/api/campaigns',
      stats: '/api/stats'
    }
  });
});

initDB();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Agency Marketing API v2.0 rodando na porta ${PORT}`);
});
