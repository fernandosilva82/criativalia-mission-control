// API Configuration
const API_BASE = window.location.hostname === 'localhost' ? '' : '';

// State
let currentPage = 'dashboard';
let productsData = [];
let ordersData = [];

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    navigateTo(page);
  });
});

document.querySelectorAll('[data-nav]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.nav;
    navigateTo(page);
  });
});

function navigateTo(page) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  
  // Update page
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });
  
  currentPage = page;
  
  // Load page data
  if (page === 'dashboard') loadDashboard();
  if (page === 'kanban') loadKanban();
  if (page === 'timesheet') loadTimesheet();
  if (page === 'reports') loadReports();
  if (page === 'products') loadProducts();
}

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Format date
function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

// Fetch API
async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`/api/shopify?endpoint=${endpoint}`);
    if (!response.ok) throw new Error('API Error');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

// Load Dashboard
async function loadDashboard() {
  const stats = await fetchAPI('stats');
  if (!stats) return;
  
  const container = document.getElementById('dashboard-stats');
  container.innerHTML = `
    <div class="stat-card">
      <p class="stat-label">Receita (30d)</p>
      <p class="stat-value">${formatCurrency(stats.revenue)}</p>
    </div>
    <div class="stat-card">
      <p class="stat-label">Pedidos</p>
      <p class="stat-value">${stats.orders}</p>
    </div>
    <div class="stat-card">
      <p class="stat-label">Clientes</p>
      <p class="stat-value">${stats.customers}</p>
    </div>
    <div class="stat-card">
      <p class="stat-label">Ticket Médio</p>
      <p class="stat-value">${formatCurrency(stats.averageTicket)}</p>
    </div>
  `;
}

// Kanban Data
const KANBAN_TASKS = [
  { id: '1', title: 'Análise de métricas Q1', description: 'Revisar KPIs do primeiro trimestre', status: 'in_progress', priority: 'high', agent: 'florence', time: '4h' },
  { id: '2', title: 'Criar bundle Mushroom Collection', description: 'Bundle com 3 tamanhos de luminárias', status: 'ready_to_deploy', priority: 'urgent', agent: 'jony', time: '2h' },
  { id: '3', title: 'Otimização Google Ads', description: 'Reduzir CAC de R$50 para R$38', status: 'review', priority: 'high', agent: 'gary', time: '6h' },
  { id: '4', title: 'Moodboard Corner Japandi', description: 'Composição visual com Abajur Accordion', status: 'done', priority: 'medium', agent: 'steve', time: '3h' },
  { id: '5', title: 'Sequência de emails de retenção', description: 'Criar fluxo de 5 emails', status: 'inbox', priority: 'medium', agent: 'ziglar', time: '5h' },
  { id: '6', title: 'Integração WhatsApp Business', description: 'Configurar API do WhatsApp', status: 'opportunity_review', priority: 'high', agent: 'elon', time: '8h' },
  { id: '7', title: 'Novo produto: Mushroom XL', description: 'Desenvolver luminária maior', status: 'in_progress', priority: 'high', agent: 'jony', time: '12h' },
  { id: '8', title: 'Fotos produtos Março', description: 'Sessão de fotos dos novos itens', status: 'ready', priority: 'medium', agent: 'steve', time: '6h' },
];

const AGENTS = {
  elon: { name: 'Elon', avatar: '🚀' },
  florence: { name: 'Florence', avatar: '📊' },
  ziglar: { name: 'Ziglar', avatar: '🤝' },
  jony: { name: 'Jony', avatar: '🎨' },
  steve: { name: 'Steve', avatar: '🍎' },
  gary: { name: 'Gary', avatar: '📈' },
};

// Load Kanban
function loadKanban() {
  const columns = ['inbox', 'opportunity_review', 'ready', 'in_progress', 'review', 'ready_to_deploy', 'done'];
  
  columns.forEach(column => {
    const tasks = KANBAN_TASKS.filter(t => t.status === column);
    const container = document.querySelector(`[data-column="${column}"] .kanban-tasks`);
    const countEl = document.querySelector(`[data-column="${column}"] .kanban-count`);
    
    countEl.textContent = tasks.length;
    
    container.innerHTML = tasks.map(task => `
      <div class="task-card" draggable="true" data-task-id="${task.id}">
        <span class="task-priority ${task.priority}">${task.priority}</span>
        <h4 class="task-title">${task.title}</h4>
        <div class="task-meta">
          <span class="task-time">⏱️ ${task.time}</span>
          <span class="task-agent" title="${AGENTS[task.agent]?.name}">${AGENTS[task.agent]?.avatar}</span>
        </div>
      </div>
    `).join('');
  });
  
  // Setup drag and drop
  setupDragAndDrop();
}

function setupDragAndDrop() {
  const cards = document.querySelectorAll('.task-card');
  const columns = document.querySelectorAll('.kanban-tasks');
  
  cards.forEach(card => {
    card.addEventListener('dragstart', () => {
      card.classList.add('dragging');
    });
    
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });
  
  columns.forEach(column => {
    column.addEventListener('dragover', e => {
      e.preventDefault();
      const afterElement = getDragAfterElement(column, e.clientY);
      const card = document.querySelector('.dragging');
      if (afterElement == null) {
        column.appendChild(card);
      } else {
        column.insertBefore(card, afterElement);
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function addTask() {
  alert('Função de adicionar tarefa em desenvolvimento');
}

// Timesheet Data
const TIMESHEET_ENTRIES = [
  { agent: 'elon', hour: 8, activity: 'Revisão estratégia Q2', category: 'strategy' },
  { agent: 'elon', hour: 9, activity: 'Coordenação agentes', category: 'management' },
  { agent: 'elon', hour: 10, activity: 'Análise performance', category: 'analytics' },
  { agent: 'elon', hour: 14, activity: 'Planejamento sprint', category: 'planning' },
  { agent: 'florence', hour: 7, activity: 'Relatório vendas', category: 'analytics' },
  { agent: 'florence', hour: 8, activity: 'Análise métricas', category: 'analytics' },
  { agent: 'florence', hour: 9, activity: 'KPIs dashboard', category: 'analytics' },
  { agent: 'florence', hour: 13, activity: 'Forecasting', category: 'analytics' },
  { agent: 'florence', hour: 15, activity: 'Revisão financeira', category: 'finance' },
  { agent: 'ziglar', hour: 9, activity: 'Atendimento cliente', category: 'support' },
  { agent: 'ziglar', hour: 10, activity: 'Follow-up vendas', category: 'sales' },
  { agent: 'ziglar', hour: 11, activity: 'Email marketing', category: 'marketing' },
  { agent: 'ziglar', hour: 14, activity: 'Revisão templates', category: 'content' },
  { agent: 'jony', hour: 8, activity: 'Criação bundles', category: 'product' },
  { agent: 'jony', hour: 9, activity: 'Análise margens', category: 'analytics' },
  { agent: 'jony', hour: 10, activity: 'Novo produto: Mushroom XL', category: 'product' },
  { agent: 'jony', hour: 11, activity: 'Precificação', category: 'pricing' },
  { agent: 'jony', hour: 15, activity: 'Revisão estoque', category: 'inventory' },
  { agent: 'steve', hour: 8, activity: 'Moodboard Japandi', category: 'design' },
  { agent: 'steve', hour: 9, activity: 'Fotos produtos', category: 'photography' },
  { agent: 'steve', hour: 10, activity: 'Edição imagens', category: 'design' },
  { agent: 'steve', hour: 13, activity: 'Banner promocional', category: 'design' },
  { agent: 'steve', hour: 14, activity: 'Social media assets', category: 'marketing' },
  { agent: 'gary', hour: 9, activity: 'Análise Google Ads', category: 'ads' },
  { agent: 'gary', hour: 10, activity: 'Otimização keywords', category: 'seo' },
  { agent: 'gary', hour: 11, activity: 'Relatório CAC', category: 'analytics' },
  { agent: 'gary', hour: 14, activity: 'A/B test analysis', category: 'analytics' },
];

const CATEGORY_COLORS = {
  strategy: 'background: rgba(139, 92, 246, 0.2); color: #8b5cf6;',
  management: 'background: rgba(59, 130, 246, 0.2); color: #3b82f6;',
  analytics: 'background: rgba(34, 197, 94, 0.2); color: #22c55e;',
  planning: 'background: rgba(245, 158, 11, 0.2); color: #f59e0b;',
  support: 'background: rgba(6, 182, 212, 0.2); color: #06b6d4;',
  sales: 'background: rgba(16, 185, 129, 0.2); color: #10b981;',
  marketing: 'background: rgba(236, 72, 153, 0.2); color: #ec4899;',
  content: 'background: rgba(99, 102, 241, 0.2); color: #6366f1;',
  product: 'background: rgba(249, 115, 22, 0.2); color: #f97316;',
  pricing: 'background: rgba(234, 179, 8, 0.2); color: #eab308;',
  inventory: 'background: rgba(100, 116, 139, 0.2); color: #64748b;',
  design: 'background: rgba(244, 63, 94, 0.2); color: #f43f5e;',
  photography: 'background: rgba(20, 184, 166, 0.2); color: #14b8a6;',
  ads: 'background: rgba(239, 68, 68, 0.2); color: #ef4444;',
  seo: 'background: rgba(132, 204, 22, 0.2); color: #84cc16;',
  finance: 'background: rgba(168, 85, 247, 0.2); color: #a855f7;',
};

const AGENTS_LIST = [
  { id: 'elon', name: 'Elon', avatar: '🚀', role: 'Mission Director' },
  { id: 'florence', name: 'Florence', avatar: '📊', role: 'OpsAgent' },
  { id: 'ziglar', name: 'Ziglar', avatar: '🤝', role: 'VendaAgent' },
  { id: 'jony', name: 'Jony', avatar: '🎨', role: 'ProductAgent' },
  { id: 'steve', name: 'Steve', avatar: '🍎', role: 'CreativeAgent' },
  { id: 'gary', name: 'Gary', avatar: '📈', role: 'TrafegoAgent' },
];

// Load Timesheet
function loadTimesheet() {
  const today = new Date();
  document.getElementById('current-date').textContent = formatDate(today);
  
  const container = document.getElementById('timesheet-grid');
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Header
  let html = '<div class="timesheet-header">';
  html += '<div class="timesheet-agent">Agente</div>';
  hours.forEach(hour => {
    const isCurrent = hour === today.getHours();
    html += `<div class="timesheet-hour" style="${isCurrent ? 'color: var(--accent); font-weight: 600;' : ''}">${hour.toString().padStart(2, '0')}h</div>`;
  });
  html += '</div>';
  
  // Rows
  AGENTS_LIST.forEach(agent => {
    html += '<div class="timesheet-row">';
    html += `
      <div class="timesheet-agent-cell">
        <span class="agent-avatar-small">${agent.avatar}</span>
        <div>
          <div class="agent-name">${agent.name}</div>
          <div class="agent-role">${agent.role}</div>
        </div>
      </div>
    `;
    
    hours.forEach(hour => {
      const entries = TIMESHEET_ENTRIES.filter(e => e.agent === agent.id && e.hour === hour);
      html += '<div class="timesheet-cell">';
      entries.forEach(entry => {
        html += `<div class="entry-tag" style="${CATEGORY_COLORS[entry.category]}" title="${entry.activity}">${entry.activity}</div>`;
      });
      html += '</div>';
    });
    
    html += '</div>';
  });
  
  container.innerHTML = html;
  
  // Legend
  const legendContainer = document.getElementById('legend-items');
  legendContainer.innerHTML = Object.entries(CATEGORY_COLORS).map(([cat, style]) => `
    <div class="legend-item" style="${style}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
  `).join('');
}

// Load Reports
async function loadReports() {
  const [stats, topProducts] = await Promise.all([
    fetchAPI('stats'),
    fetchAPI('products/top')
  ]);
  
  if (stats) {
    const container = document.getElementById('reports-stats');
    container.innerHTML = `
      <div class="stat-card">
        <p class="stat-label">Receita Total</p>
        <p class="stat-value">${formatCurrency(stats.revenue)}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Total de Pedidos</p>
        <p class="stat-value">${stats.orders}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Ticket Médio</p>
        <p class="stat-value">${formatCurrency(stats.averageTicket)}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Clientes</p>
        <p class="stat-value">${stats.customers}</p>
      </div>
    `;
  }
  
  if (topProducts && topProducts.products) {
    const listContainer = document.getElementById('top-products-list');
    if (topProducts.products.length === 0) {
      listContainer.innerHTML = `
        <div class="loading-state">
          <p>Sem dados de vendas no período</p>
        </div>
      `;
    } else {
      listContainer.innerHTML = `
        <div class="top-products-list">
          ${topProducts.products.map((product, index) => `
            <div class="top-product-item">
              <div class="top-product-rank">${index + 1}</div>
              <div class="top-product-image">
                ${product.image ? `<img src="${product.image}" alt="">` : '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 20px;">📦</div>'}
              </div>
              <div class="top-product-info">
                <div class="top-product-title">${product.title}</div>
                <div class="top-product-quantity">${product.quantity} vendidos</div>
              </div>
              <div class="top-product-revenue">
                <div class="top-product-revenue-value">${formatCurrency(product.revenue)}</div>
                <div class="top-product-revenue-label">receita</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
}

// Load Products
async function loadProducts() {
  const data = await fetchAPI('products');
  if (!data || !data.products) return;
  
  productsData = data.products;
  renderProducts(productsData);
}

function renderProducts(products) {
  const container = document.getElementById('products-grid');
  container.innerHTML = products.map(product => {
    const stockClass = product.inventory_quantity > 10 ? 'in' : product.inventory_quantity > 0 ? 'low' : 'out';
    const stockText = product.inventory_quantity > 10 ? 'Em estoque' : product.inventory_quantity > 0 ? 'Baixo' : 'Esgotado';
    
    return `
      <div class="product-card">
        <div class="product-image">
          ${product.image ? `<img src="${product.image}" alt="${product.title}">` : '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 32px;">📦</div>'}
        </div>
        <div class="product-info">
          <p class="product-type">${product.product_type || 'Produto'}</p>
          <h3 class="product-title">${product.title}</h3>
          <div class="product-meta">
            <span class="product-price">${formatCurrency(parseFloat(product.price))}</span>
            <span class="product-stock ${stockClass}">${stockText}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Product search
document.getElementById('product-search')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = productsData.filter(p => 
    p.title.toLowerCase().includes(query) ||
    (p.product_type || '').toLowerCase().includes(query)
  );
  renderProducts(filtered);
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
});