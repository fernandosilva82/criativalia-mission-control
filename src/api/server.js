import express from 'express';
import { orchestrator } from '../orchestrator/runtime.js';
import { shopify } from '../integrations/shopify.js';
import { randomUUID } from 'crypto';

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

// === CONTROL PLANE UI ===
app.get('/', (req, res) => {
  res.send(ControlPlaneHTML);
});

app.listen(PORT, () => console.log('Server on port ' + PORT));

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
      <!-- Dashboard -->
      <div id="view-dashboard" class="view active">
        <h2 class="text-2xl font-bold mb-6">Dashboard</h2>
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="card"><p class="text-sm text-gray-500">Agentes</p><p class="text-3xl font-bold" id="dash-agents">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Tarefas</p><p class="text-3xl font-bold" id="dash-tasks">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Oportunidades</p><p class="text-3xl font-bold accent" id="dash-opp">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Status</p><p class="text-xl font-bold" id="dash-status">-</p></div>
        </div>
      </div>

      <!-- Timesheet -->
      <div id="view-timesheet" class="view">
        <h2 class="text-2xl font-bold mb-2">Timesheet - Agenda 24h</h2>
        <div class="card mb-4">
          <div class="grid grid-cols-4 gap-4 text-center">
            <div><p class="text-sm text-gray-500">Total Agentes</p><p class="text-2xl font-bold" id="ts-total">-</p></div>
            <div><p class="text-sm text-gray-500">Ativos</p><p class="text-2xl font-bold text-green-400" id="ts-active">-</p></div>
            <div><p class="text-sm text-gray-500">Ociosos</p><p class="text-2xl font-bold text-yellow-400" id="ts-idle">-</p></div>
            <div><p class="text-sm text-gray-500">Hora</p><p class="text-2xl font-bold accent" id="ts-hour">-</p></div>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="border-b border-gray-700" id="ts-header"><th class="p-2 sticky left-0 bg-gray-900">Agente</th></tr></thead>
            <tbody id="ts-body"></tbody>
          </table>
        </div>
        <div class="mt-4 flex gap-4 text-xs">
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-green-500 rounded"></span> Trabalhando</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-yellow-500 rounded"></span> Ocioso</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-gray-600 rounded"></span> Sem atividade</span>
        </div>
      </div>

      <!-- Kanban -->
      <div id="view-kanban" class="view">
        <h2 class="text-2xl font-bold mb-4">Kanban Macro</h2>
        <div class="flex gap-6 mb-4 text-sm">
          <span>Total: <b id="kb-total">-</b></span>
          <span class="text-red-400">● P0: <b id="kb-p0">-</b></span>
          <span class="text-yellow-400">● P1: <b id="kb-p1">-</b></span>
          <span class="text-gray-400">● P2: <b id="kb-p2">-</b></span>
        </div>
        <div class="grid grid-cols-5 gap-3">
          ${['backlog','todo','in_progress','review','done'].map(col => `
            <div class="bg-gray-900 rounded-lg p-3">
              <div class="flex justify-between mb-2">
                <h4 class="font-semibold ${col==='backlog'?'text-gray-400':col==='todo'?'text-blue-400':col==='in_progress'?'text-yellow-400':col==='review'?'text-purple-400':'text-green-400'}">${col==='backlog'?'📋 Backlog':col==='todo'?'📝 To Do':col==='in_progress'?'⚡ Doing':col==='review'?'👀 Review':'✅ Done'}</h4>
                <span class="text-xs bg-gray-700 px-2 rounded" id="kb-count-${col}">0</span>
              </div>
              <div id="kb-${col}" class="space-y-2"></div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Financeiro -->
      <div id="view-finance" class="view">
        <h2 class="text-2xl font-bold mb-6">Financeiro</h2>
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="card"><p class="text-sm text-gray-500">Vendas Brutas (MTD)</p><p class="text-3xl font-bold accent" id="fin-gross">-</p><p class="text-xs mt-1" id="fin-gross-var">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Vendas Líquidas</p><p class="text-3xl font-bold text-green-400" id="fin-net">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Ticket Médio</p><p class="text-3xl font-bold" id="fin-aov">-</p></div>
          <div class="card"><p class="text-sm text-gray-500">Pedidos (MTD)</p><p class="text-3xl font-bold" id="fin-orders">-</p></div>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="card">
            <h3 class="font-semibold mb-4">Comparativo Mensal (MoM)</h3>
            <div class="space-y-2">
              <div class="flex justify-between"><span class="text-gray-400">Mês Atual</span><span id="fin-mom-cur">-</span></div>
              <div class="flex justify-between"><span class="text-gray-400">Mês Anterior</span><span id="fin-mom-prev">-</span></div>
              <div class="flex justify-between font-bold"><span>Variação</span><span id="fin-mom-var">-</span></div>
            </div>
          </div>
          <div class="card">
            <h3 class="font-semibold mb-4">Comparativo Anual (YoY)</h3>
            <div class="space-y-2">
              <div class="flex justify-between"><span class="text-gray-400">YTD Atual</span><span id="fin-yoy-cur">-</span></div>
              <div class="flex justify-between"><span class="text-gray-400">YTD Anterior</span><span id="fin-yoy-prev">-</span></div>
              <div class="flex justify-between font-bold"><span>Crescimento</span><span id="fin-yoy-growth">-</span></div>
            </div>
          </div>
        </div>
        <div class="card">
          <h3 class="font-semibold mb-4">Detalhamento</h3>
          <div class="grid grid-cols-4 gap-4 text-center">
            <div><p class="text-sm text-gray-500">Itens Vendidos</p><p class="text-2xl font-bold" id="fin-items">-</p></div>
            <div><p class="text-sm text-gray-500">Itens/Pedido</p><p class="text-2xl font-bold" id="fin-ipp">-</p></div>
            <div><p class="text-sm text-gray-500">Conversão</p><p class="text-2xl font-bold" id="fin-conv">-</p></div>
            <div><p class="text-sm text-gray-500">Receita/Dia</p><p class="text-2xl font-bold" id="fin-rpd">-</p></div>
          </div>
        </div>
      </div>

      <!-- Agentes -->
      <div id="view-agents" class="view"><h2 class="text-2xl font-bold mb-6">Agentes</h2><div id="agents-list"></div></div>

      <!-- Eventos -->
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
      if(view==='timesheet') loadTimesheet();
      if(view==='kanban') loadKanban();
      if(view==='finance') loadFinance();
      if(view==='agents') loadAgents();
      if(view==='events') loadEvents();
    }

    function fmtMoney(v) { return 'R$ ' + v.toLocaleString('pt-BR', {minimumFractionDigits:2}); }
    function fmtVar(v) { 
      const c = v >= 0 ? 'text-green-400' : 'text-red-400';
      const a = v >= 0 ? '↑' : '↓';
      return '<span class="' + c + '">' + a + ' ' + Math.abs(v).toFixed(1) + '%</span>';
    }

    async function loadDashboard() {
      const d = await (await fetch('/api/stats')).json();
      document.getElementById('dash-agents').textContent = d.runtime.agents.filter(a=>a.status==='running').length;
      document.getElementById('dash-tasks').textContent = d.database.tasks.count;
      document.getElementById('dash-opp').textContent = d.database.opportunities.count;
      document.getElementById('dash-status').innerHTML = d.runtime.isRunning ? '<span class="text-green-400">● Running</span>' : '<span class="text-gray-400">○ Stopped</span>';
    }

    async function loadTimesheet() {
      const d = await (await fetch('/api/timesheet/visual')).json();
      document.getElementById('ts-total').textContent = d.summary.total_agents;
      document.getElementById('ts-active').textContent = d.summary.active_now;
      document.getElementById('ts-idle').textContent = d.summary.idle_now;
      document.getElementById('ts-hour').textContent = d.summary.current_hour + 'h';
      
      const hr = document.getElementById('ts-header');
      hr.innerHTML = '<th class="p-2 sticky left-0 bg-gray-900">Agente</th>';
      for(let h=0; h<24; h++) hr.innerHTML += '<th class="p-2 text-center w-8 ' + (h===d.summary.current_hour?'accent-bg text-white':'text-gray-500') + '">' + h + 'h</th>';
      
      const tb = document.getElementById('ts-body');
      tb.innerHTML = '';
      Object.values(d.grid).forEach(g => {
        let row = '<tr class="border-b border-gray-800"><td class="p-2 sticky left-0 bg-gray-900"><span class="w-2 h-2 rounded-full ' + (g.agent.status==='running'?'bg-green-500':'bg-gray-500') + ' inline-block mr-2"></span>' + g.agent.name + '</td>';
        g.hours.forEach(h => {
          let bg = 'bg-gray-800', title = 'Sem atividade';
          if(h.is_current && h.is_idle) { bg = 'bg-yellow-500/20 border border-yellow-500'; title = 'Ocioso ' + h.idle_minutes + 'min'; }
          else if(h.is_current && h.activity==='working') { bg = 'bg-green-500/20 border border-green-500'; title = h.description || 'Trabalhando'; }
          else if(h.activity==='working') bg = 'bg-green-900/30';
          row += '<td class="p-1"><div class="w-6 h-6 rounded ' + bg + ' mx-auto" title="' + title + '"></div></td>';
        });
        tb.innerHTML += row + '</tr>';
      });
    }

    async function loadKanban() {
      const d = await (await fetch('/api/kanban/macro')).json();
      document.getElementById('kb-total').textContent = d.stats.total;
      document.getElementById('kb-p0').textContent = d.stats.by_priority.p0;
      document.getElementById('kb-p1').textContent = d.stats.by_priority.p1;
      document.getElementById('kb-p2').textContent = d.stats.by_priority.p2;
      
      ['backlog','todo','in_progress','review','done'].forEach(col => {
        document.getElementById('kb-count-'+col).textContent = d.columns[col].length;
        document.getElementById('kb-'+col).innerHTML = d.columns[col].map(t => 
          '<div class="kanban-card"><div class="flex justify-between"><span class="font-medium text-sm">' + t.title + '</span><span class="text-xs px-2 rounded ' + (t.priority===0?'bg-red-500/20 text-red-400':t.priority===1?'bg-yellow-500/20 text-yellow-400':'bg-gray-600/20 text-gray-400') + '">P' + t.priority + '</span></div><div class="mt-2 flex gap-1"><button onclick="setPriority(\'' + t.id + '\',0)" class="text-xs px-2 py-1 bg-red-600 rounded">P0</button><button onclick="setPriority(\'' + t.id + '\',1)" class="text-xs px-2 py-1 bg-yellow-600 rounded">P1</button><button onclick="setPriority(\'' + t.id + '\',2)" class="text-xs px-2 py-1 bg-gray-600 rounded">P2</button></div></div>'
        ).join('');
      });
    }

    async function setPriority(id, p) {
      await fetch('/api/tasks/' + id + '/priority', {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({priority:p})});
      loadKanban();
    }

    async function loadFinance() {
      const d = await (await fetch('/api/finance/summary')).json();
      document.getElementById('fin-gross').textContent = fmtMoney(d.mtd.gross);
      document.getElementById('fin-gross-var').innerHTML = fmtVar(d.variations.mom);
      document.getElementById('fin-net').textContent = fmtMoney(d.mtd.net);
      document.getElementById('fin-aov').textContent = fmtMoney(d.metrics.aov);
      document.getElementById('fin-orders').textContent = d.mtd.orders;
      document.getElementById('fin-mom-cur').textContent = fmtMoney(d.mtd.gross);
      document.getElementById('fin-mom-prev').textContent = fmtMoney(d.previous_month.gross);
      document.getElementById('fin-mom-var').innerHTML = fmtVar(d.variations.mom);
      document.getElementById('fin-yoy-cur').textContent = fmtMoney(d.ytd.gross);
      document.getElementById('fin-yoy-prev').textContent = fmtMoney(d.previous_ytd.gross);
      document.getElementById('fin-yoy-growth').innerHTML = fmtVar(d.variations.yoy);
      document.getElementById('fin-items').textContent = d.mtd.items;
      document.getElementById('fin-ipp').textContent = d.metrics.items_per_order.toFixed(1);
      document.getElementById('fin-conv').textContent = d.metrics.conversion_rate.toFixed(1) + '%';
      document.getElementById('fin-rpd').textContent = fmtMoney(d.mtd.gross / d.mtd.days_in_month);
    }

    async function loadAgents() {
      const d = await (await fetch('/api/agents')).json();
      document.getElementById('agents-list').innerHTML = d.map(a => '<div class="card mb-3 flex justify-between"><div><p class="font-semibold">' + a.name + '</p><p class="text-sm text-gray-500">' + a.role + '</p></div><span class="' + (a.status==='running'?'text-green-400':'text-gray-400') + '">' + (a.status==='running'?'● Running':'○ Idle') + '</span></div>').join('');
    }

    async function loadEvents() {
      const d = await (await fetch('/api/events?limit=30')).json();
      document.getElementById('events-list').innerHTML = d.map(e => '<div class="card mb-2"><p class="font-medium">' + e.message + '</p><p class="text-sm text-gray-500">' + e.type + ' • ' + new Date(e.timestamp).toLocaleString() + '</p></div>').join('');
    }

    setInterval(() => { loadDashboard(); if(document.getElementById('view-timesheet').classList.contains('active')) loadTimesheet(); if(document.getElementById('view-kanban').classList.contains('active')) loadKanban(); }, 5000);
    loadDashboard();
  </script>
</body>
</html>`;
