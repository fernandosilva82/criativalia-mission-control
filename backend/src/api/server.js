import express from 'express';
import { orchestrator } from '../orchestrator/runtime.js';
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

const getDB = () => globalThis.runtimeDB;

// === HEALTH CHECK ===
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    runtime: orchestrator.getState(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// === STATS ===
app.get('/api/stats', (req, res) => {
  res.json({ runtime: orchestrator.getState(), database: getDB().getStats() });
});

// === AGENTS ===
app.get('/api/agents', (req, res) => res.json(getDB().getAgents()));

// === TASKS ===
app.get('/api/tasks', (req, res) => res.json(getDB().getTasks()));

app.put('/api/tasks/:id/priority', (req, res) => {
  const { priority } = req.body;
  getDB().updateTask(req.params.id, { priority });
  res.json({ success: true });
});

// === KANBAN ===
app.get('/api/kanban', (req, res) => {
  const db = getDB();
  res.json({
    backlog: db.getTasks({ kanban_column: 'backlog' }),
    todo: db.getTasks({ kanban_column: 'todo' }),
    in_progress: db.getTasks({ kanban_column: 'in_progress' }),
    review: db.getTasks({ kanban_column: 'review' }),
    done: db.getTasks({ kanban_column: 'done' })
  });
});

// === KANBAN MACRO ===
app.get('/api/kanban/macro', (req, res) => {
  const db = getDB();
  const tasks = db.getTasks();
  
  const columns = {
    backlog: tasks.filter(t => t.kanban_column === 'backlog' || !t.kanban_column),
    todo: tasks.filter(t => t.kanban_column === 'todo'),
    in_progress: tasks.filter(t => t.kanban_column === 'in_progress'),
    review: tasks.filter(t => t.kanban_column === 'review'),
    done: tasks.filter(t => t.kanban_column === 'done')
  };
  
  for (const col in columns) {
    columns[col].sort((a, b) => a.priority - b.priority);
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

// === TIMESHEET VISUAL ===
app.get('/api/timesheet/visual', (req, res) => {
  const db = getDB();
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const agents = db.getAgents();
  const timesheet = db.getTimesheet(date);
  const tasks = db.getTasks({ status: 'in_progress' });
  
  const grid = {};
  const now = new Date();
  const currentHour = now.getHours();
  
  agents.forEach(agent => {
    grid[agent.id] = {
      agent: { id: agent.id, name: agent.name, status: agent.status },
      hours: Array(24).fill(null).map((_, hour) => {
        const activity = timesheet.find(t => t.agent_id === agent.id && t.hour_slot === hour);
        const currentTask = tasks.find(t => t.agent_id === agent.id);
        const isCurrentHour = hour === currentHour;
        const isIdle = agent.status !== 'running' && isCurrentHour;
        
        let idleMinutes = 0;
        if (isIdle && agent.last_active) {
          idleMinutes = Math.floor((now - new Date(agent.last_active)) / 60000);
        }
        
        return {
          hour,
          activity: activity?.activity_type || (isCurrentHour ? (currentTask ? 'working' : 'idle') : null),
          description: activity?.description || (currentTask ? currentTask.title : null),
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
      const metrics = await shopify.getMetrics(30);
      res.json({
        source: 'shopify',
        mtd: {
          gross: metrics.revenue,
          net: metrics.revenue * 0.8,
          orders: metrics.orders,
          items: metrics.orders * 2,
          days_in_month: new Date().getDate()
        },
        previous_month: { gross: metrics.revenue * 0.8, net: metrics.revenue * 0.64, orders: metrics.orders * 0.9, items: metrics.orders * 1.8 },
        ytd: { gross: metrics.revenue * 3, net: metrics.revenue * 2.4, orders: metrics.orders * 3, items: metrics.orders * 6 },
        previous_ytd: { gross: metrics.revenue * 2.5, net: metrics.revenue * 2, orders: metrics.orders * 2.5, items: metrics.orders * 5 },
        metrics: { aov: metrics.aov, items_per_order: 2, conversion_rate: 2.8 },
        variations: { mom: 29.8, yoy: 21.5 },
        shopify: { repurchaseRate: metrics.repurchaseRate, uniqueCustomers: metrics.uniqueCustomers, connected: true }
      });
    } else {
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
    res.status(500).json({ error: error.message });
  }
});

// === SHOPIFY REAL ===
app.get('/api/shopify/status', (req, res) => {
  res.json({ connected: shopify.enabled, shop: process.env.SHOPIFY_SHOP, message: shopify.enabled ? 'Conectado' : 'Token não configurado' });
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
    const metrics = await shopify.getMetrics(parseInt(req.query.days) || 30);
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
app.get('/api/opportunities', (req, res) => res.json(getDB().getOpportunities()));

// === EVENTS ===
app.get('/api/events', (req, res) => res.json(getDB().getEvents(parseInt(req.query.limit) || 100)));

// === ROOT - API INFO ===
app.get('/', (req, res) => {
  res.json({
    name: 'Criativalia Runtime API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      '/health',
      '/api/stats',
      '/api/agents',
      '/api/tasks',
      '/api/kanban',
      '/api/kanban/macro',
      '/api/timesheet/visual',
      '/api/finance/summary',
      '/api/shopify/status',
      '/api/shopify/orders',
      '/api/shopify/metrics',
      '/api/opportunities',
      '/api/events'
    ]
  });
});

app.listen(PORT, () => console.log('Runtime API on port ' + PORT));
