/**
 * API Server - Usando FileDB persistente
 */

import express from 'express';
import { db } from '../database/adapter.js';
import { shopify } from '../integrations/shopify.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// === HEALTH ===
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === STATS ===
app.get('/api/stats', (req, res) => {
  res.json({
    runtime: {
      isRunning: true,
      agents: db.getAgents(),
      mode: 'active'
    },
    database: db.getStats()
  });
});

// === AGENTS ===
app.get('/api/agents', (req, res) => res.json(db.getAgents()));

// === TASKS ===
app.get('/api/tasks', (req, res) => res.json(db.getTasks()));

app.post('/api/tasks', (req, res) => {
  const task = req.body;
  if (!task.id) task.id = 'task_' + Date.now();
  db.createTask(task);
  res.json({ success: true, task });
});

app.put('/api/tasks/:id/priority', (req, res) => {
  const { priority } = req.body;
  db.updateTask(req.params.id, { priority });
  res.json({ success: true });
});

// === KANBAN ===
app.get('/api/kanban', (req, res) => {
  const tasks = db.getTasks();
  res.json({
    backlog: tasks.filter(t => t.kanban_column === 'backlog'),
    todo: tasks.filter(t => t.kanban_column === 'todo'),
    in_progress: tasks.filter(t => t.kanban_column === 'in_progress'),
    review: tasks.filter(t => t.kanban_column === 'review'),
    done: tasks.filter(t => t.kanban_column === 'done')
  });
});

app.get('/api/kanban/macro', (req, res) => {
  const tasks = db.getTasks();
  
  const columns = {
    backlog: tasks.filter(t => t.kanban_column === 'backlog' || !t.kanban_column),
    todo: tasks.filter(t => t.kanban_column === 'todo'),
    in_progress: tasks.filter(t => t.kanban_column === 'in_progress'),
    review: tasks.filter(t => t.kanban_column === 'review'),
    done: tasks.filter(t => t.kanban_column === 'done')
  };
  
  for (const col in columns) {
    columns[col].sort((a, b) => (a.priority || 2) - (b.priority || 2));
  }
  
  res.json({
    columns,
    stats: {
      total: tasks.length,
      by_priority: {
        p0: tasks.filter(t => t.priority === 0).length,
        p1: tasks.filter(t => t.priority === 1).length,
        p2: tasks.filter(t => t.priority === 2).length
      }
    }
  });
});

// === TIMESHEET ===
app.get('/api/timesheet/visual', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const agents = db.getAgents();
  const tasks = db.getTasks();
  const now = new Date();
  const currentHour = now.getHours();
  
  const grid = {};
  agents.forEach(agent => {
    grid[agent.id] = {
      agent: { id: agent.id, name: agent.name, status: agent.status },
      hours: Array(24).fill(null).map((_, hour) => {
        const currentTask = tasks.find(t => t.agent_id === agent.id);
        const isCurrentHour = hour === currentHour;
        const isIdle = agent.status !== 'running' && isCurrentHour;
        
        let idleMinutes = 0;
        if (isIdle && agent.last_active) {
          idleMinutes = Math.floor((now - new Date(agent.last_active)) / 60000);
        }
        
        return {
          hour,
          activity: isCurrentHour ? (currentTask ? 'working' : 'idle') : null,
          description: currentTask ? currentTask.title : null,
          is_current: isCurrentHour,
          is_idle: isIdle,
          idle_minutes: isCurrentHour ? idleMinutes : 0
        };
      })
    };
  });
  
  res.json({
    grid,
    summary: {
      total_agents: agents.length,
      active_now: agents.filter(a => a.status === 'running').length,
      idle_now: agents.filter(a => a.status !== 'running').length,
      current_hour: currentHour,
      date
    }
  });
});

// === FINANCEIRO ===
app.get('/api/finance/summary', async (req, res) => {
  try {
    if (shopify.enabled) {
      const metrics = await shopify.getMetrics();
      res.json({
        source: 'shopify',
        mtd: metrics.mtd,
        previous_month: metrics.previous_month,
        ytd: metrics.ytd,
        previous_ytd: metrics.previous_ytd,
        metrics: metrics.metrics,
        variations: metrics.variations,
        shopify: metrics.shopify
      });
    } else {
      // Dados simulados
      res.json({
        source: 'simulated',
        mtd: { gross: 19780.84, net: 15824.67, orders: 59, items: 118, days_in_month: 26 },
        previous_month: { gross: 15234.50, net: 12187.60, orders: 48, items: 96 },
        ytd: { gross: 156432.18, net: 125145.74, orders: 467, items: 934 },
        previous_ytd: { gross: 128765.32, net: 103012.26, orders: 385, items: 770 },
        metrics: { aov: 335.27, items_per_order: 2, conversion_rate: 2.8 },
        variations: { mom: 29.8, yoy: 21.5 },
        shopify: { connected: false, message: 'Token não configurado' }
      });
    }
  } catch (error) {
    console.error('Finance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// === SHOPIFY ===
app.get('/api/shopify/status', (req, res) => {
  res.json({
    connected: shopify.enabled,
    shop: process.env.SHOPIFY_SHOP,
    message: shopify.enabled ? 'Conectado' : 'Token não configurado'
  });
});

app.get('/api/shopify/orders', async (req, res) => {
  try {
    const orders = await shopify.getOrders(parseInt(req.query.days) || 30);
    res.json({ count: orders.length, orders: orders.slice(0, 50) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shopify/metrics', async (req, res) => {
  try {
    const metrics = await shopify.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shopify/inactive-customers', async (req, res) => {
  try {
    const customers = await shopify.getInactiveCustomers(parseInt(req.query.days) || 90);
    res.json({ count: customers.length, customers: customers.slice(0, 100) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === OPPORTUNITIES ===
app.get('/api/opportunities', (req, res) => res.json(db.getOpportunities()));

app.post('/api/opportunities', (req, res) => {
  const opp = req.body;
  if (!opp.id) opp.id = 'opp_' + Date.now();
  db.createOpportunity(opp);
  res.json({ success: true, opportunity: opp });
});

// === EVENTS ===
app.get('/api/events', (req, res) => res.json(db.getEvents(parseInt(req.query.limit) || 100)));

// === PERSISTENCE TEST ===
app.post('/api/test-persistence', (req, res) => {
  const testData = {
    id: 'test_' + Date.now(),
    message: 'Teste de persistência',
    timestamp: new Date().toISOString()
  };
  db.createEvent(testData);
  res.json({ success: true, message: 'Dados salvos. Faça restart e verifique /api/events', testData });
});

app.listen(PORT, () => {
  console.log('✅ Server running on port ' + PORT);
  console.log('📁 Usando FileDB em:', process.env.DATA_FILE || '/data/criativalia-data.json');
});
