/**
 * API Server - Simplificado e Funcional
 */

import express from 'express';
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

// Database simples
const db = {
  agents: new Map(),
  tasks: new Map(),
  opportunities: new Map(),
  events: [],
  
  getAgents() {
    return Array.from(this.agents.values());
  },
  
  getTasks(filters = {}) {
    let tasks = Array.from(this.tasks.values());
    if (filters.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    return tasks;
  },
  
  updateTask(id, updates) {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates, { updated_at: new Date().toISOString() });
    }
  },
  
  getOpportunities() {
    return Array.from(this.opportunities.values());
  },
  
  getEvents(limit = 100) {
    return this.events.slice(-limit).reverse();
  },
  
  getStats() {
    return {
      agents: { count: this.agents.size },
      tasks: { count: this.tasks.size },
      opportunities: { count: this.opportunities.size }
    };
  }
};

// Inicializar agentes
const defaultAgents = [
  { id: 'ceo_orchestrator', name: 'CEO Orchestrator', role: 'orchestrator', status: 'running', capabilities: ['prioritization'], total_tasks: 0 },
  { id: 'bash_architect', name: 'Bash Architect', role: 'developer', status: 'running', capabilities: ['shell'], total_tasks: 0 },
  { id: 'deploy_engineer', name: 'Deploy Engineer', role: 'devops', status: 'running', capabilities: ['deploy'], total_tasks: 0 },
  { id: 'ui_guardian', name: 'UI Guardian', role: 'designer', status: 'idle', capabilities: ['ui'], total_tasks: 0 },
  { id: 'data_analyst', name: 'Data Analyst', role: 'analyst', status: 'idle', capabilities: ['data'], total_tasks: 0 },
  { id: 'night_watch', name: 'Night Watch', role: 'monitor', status: 'idle', capabilities: ['monitoring'], total_tasks: 0 },
  { id: 'shopify_specialist', name: 'Shopify Specialist', role: 'ecommerce', status: 'idle', capabilities: ['shopify'], total_tasks: 0 },
  { id: 'copywriter', name: 'Copywriter', role: 'content', status: 'idle', capabilities: ['copy'], total_tasks: 0 }
];
defaultAgents.forEach(agent => db.agents.set(agent.id, agent));

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

// === TIMESHEET ===
app.get('/api/timesheet/visual', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const agents = db.getAgents();
  const tasks = db.getTasks({ status: 'in_progress' });
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

// === EVENTS ===
app.get('/api/events', (req, res) => res.json(db.getEvents(parseInt(req.query.limit) || 100)));

// === CONTROL PLANE UI ===
app.get('/', (req, res) => {
  res.send(ControlPlaneHTML);
});

app.listen(PORT, () => {
  console.log('✅ Server running on port ' + PORT);
});

const ControlPlaneHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Criativalia Runtime</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { font-family: Inter, sans-serif; background: #0a0a0b; color: #fafafa; }
    .accent { color: #c17767; }
    .accent-bg { background: #c17767; }
    .card { background: #141414; border: 1px solid #2a2a2a; border-radius: 12px; padding: 16px; }
    .nav-item { padding: 12px 16px; cursor: pointer; border-radius: 8px; }
    .nav-item:hover { background: #1a1a1a; }
    .nav-item.active { background: #c17767; }
    .view { display: none; }
    .view.active { display: block; }
    .kanban-card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 12px; }
  </style>
</head>
<body class="min-h-screen">
  <div class="flex">
    <aside class="w-64 h-screen bg-gray-900 border-r border-gray-800 fixed">
      <div class="p-6 border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg accent-bg flex items-center justify-center"><i class="fas fa-rocket text-white"></i></div>
          <div><h1 class="font-bold">Criativalia</h1><p class="text-xs text-gray-500">Runtime v1.2</p></div>
        </div>
      </div>
      <nav class="p-4">
        <div class="nav-item active mb-2" onclick="showView('dashboard')"><i class="fas fa-chart-line w-6"></i> Dashboard</div>
        <div class="nav-item mb-2" onclick="showView('timesheet')"><i class="fas fa-clock w-6"></i> Timesheet</div>
        <div class="nav-item mb-2" onclick="showView('kanban')"><i class="fas fa-columns w-6"></i> Kanban</div>
        <div class="nav-item mb-2" onclick="showView('finance')"><i class="fas fa-dollar-sign w-6"></i> Financeiro</div>
        <div class="nav-item mb-2" onclick="showView('agents')"><i class="fas fa-robot w-6"></i> Agentes</div>
        <div class="nav-item" onclick="showView('events')"><i class="fas fa-list w-6"></i> Eventos</div>
      </nav>
    </aside>

    <main class="ml-64 flex-1 p-8">
      <div id="view-dashboard" class="view active">
        <h2 class="text-2xl font-bold mb-6">Dashboard</h2>
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="card"><p class="text-sm text-gray-500">Agentes</p><p class="text-3xl font-bold" id="dash-agents">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Tarefas</p><p class="text-3xl font-bold" id="dash-tasks">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Oportunidades</p><p class="text-3xl font-bold accent" id="dash-opp">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Status</p><p class="text-xl font-bold" id="dash-status">-</p></div>
        </div>
      </div>

      <div id="view-timesheet" class="view">
        <h2 class="text-2xl font-bold mb-2">Timesheet</h2>
        <p class="text-gray-500">Em desenvolvimento...</p>
      </div>

      <div id="view-kanban" class="view">
        <h2 class="text-2xl font-bold mb-4">Kanban</h2>
        <p class="text-gray-500">Em desenvolvimento...</p>
      </div>

      <div id="view-finance" class="view">
        <h2 class="text-2xl font-bold mb-6">Financeiro</h2>
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="card"><p class="text-sm text-gray-500">Vendas Brutas</p><p class="text-3xl font-bold accent" id="fin-gross">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Vendas Líquidas</p><p class="text-3xl font-bold text-green-400" id="fin-net">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Ticket Médio</p><p class="text-3xl font-bold" id="fin-aov">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Pedidos</p><p class="text-3xl font-bold" id="fin-orders">-</p></div>
        </div>
      </div>

      <div id="view-agents" class="view"><h2 class="text-2xl font-bold mb-6">Agentes</h2><div id="agents-list"></div></div>
      <div id="view-events" class="view"><h2 class="text-2xl font-bold mb-6">Eventos</h2><div id="events-list"></div></div>
    </main>
  </div>

  <script>
    const views = ['dashboard','timesheet','kanban','finance','agents','events'];
    function showView(view) {
      views.forEach(v => document.getElementById('view-'+v).classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.getElementById('view-'+view).classList.add('active');
      event.target.classList.add('active');
      if(view==='dashboard') loadDashboard();
      if(view==='finance') loadFinance();
      if(view==='agents') loadAgents();
    }
    
    function fmtMoney(v) { return 'R$ ' + v.toLocaleString('pt-BR', {minimumFractionDigits:2}); }

    async function loadDashboard() {
      const d = await (await fetch('/api/stats')).json();
      document.getElementById('dash-agents').textContent = d.runtime.agents.filter(a=>a.status==='running').length;
      document.getElementById('dash-tasks').textContent = d.database.tasks.count;
      document.getElementById('dash-opp').textContent = d.database.opportunities.count;
      document.getElementById('dash-status').innerHTML = '<span class="text-green-400">● Online</span>';
    }

    async function loadFinance() {
      const d = await (await fetch('/api/finance/summary')).json();
      document.getElementById('fin-gross').textContent = fmtMoney(d.mtd.gross);
      document.getElementById('fin-net').textContent = fmtMoney(d.mtd.net);
      document.getElementById('fin-aov').textContent = fmtMoney(d.metrics.aov);
      document.getElementById('fin-orders').textContent = d.mtd.orders;
    }

    async function loadAgents() {
      const d = await (await fetch('/api/agents')).then(r => r.json());
      document.getElementById('agents-list').innerHTML = d.map(a => '<div class="card mb-3 flex justify-between"><div><p class="font-semibold">' + a.name + '</p><p class="text-sm text-gray-500">' + a.role + '</p></div><span class="' + (a.status==='running'?'text-green-400':'text-gray-400') + '">' + (a.status==='running'?'● Running':'○ Idle') + '</span></div>').join('');
    }

    setInterval(loadDashboard, 5000);
    loadDashboard();
  </script>
</body>
</html>`;
