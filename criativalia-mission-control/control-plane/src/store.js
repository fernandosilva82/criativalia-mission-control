// In-memory store for serverless environment
// Data resets on deploy, but works for demo

const DEFAULT_AGENTS = [
    {
        id: 'ceo_orchestrator',
        name: 'CEO_ORCHESTRATOR',
        role: 'Chief Executive Officer / System Orchestrator',
        status: 'idle',
        description: 'Orquestra todos os agentes, toma decisões estratégicas, maximiza lucro',
        skills: ['strategy', 'coordination', 'decision_making', 'resource_allocation'],
        config: { priority: 10, auto_start: false },
        created_at: new Date().toISOString()
    },
    {
        id: 'traffic_manager',
        name: 'TRAFFIC_MANAGER',
        role: 'Gestor de Tráfego Pago',
        status: 'idle',
        description: 'Gerencia campanhas Meta Ads e Google Ads, otimiza ROAS',
        skills: ['meta_ads', 'google_ads', 'analytics', 'creative_strategy'],
        config: { budget_daily: 50, priority: 9, auto_start: false },
        created_at: new Date().toISOString()
    },
    {
        id: 'shopify_specialist',
        name: 'SHOPIFY_SPECIALIST',
        role: 'Especialista Shopify',
        status: 'idle',
        description: 'Otimiza loja, gerencia produtos, integra APIs',
        skills: ['shopify_api', 'ecommerce', 'inventory', 'seo'],
        config: { priority: 8, auto_start: false },
        created_at: new Date().toISOString()
    },
    {
        id: 'copywriter',
        name: 'COPYWRITER',
        role: 'Redator de Conversão',
        status: 'idle',
        description: 'Cria copy para ads, produtos, emails que vende',
        skills: ['copywriting', 'seo', 'email_marketing', 'brand_voice'],
        config: { priority: 7, auto_start: false },
        created_at: new Date().toISOString()
    },
    {
        id: 'designer',
        name: 'DESIGNER',
        role: 'Designer Visual',
        status: 'idle',
        description: 'Cria visuais, mockups, assets para campanhas',
        skills: ['graphic_design', 'ui_design', 'brand_identity', 'canva_figma'],
        config: { priority: 7, auto_start: false },
        created_at: new Date().toISOString()
    },
    {
        id: 'dev_automation',
        name: 'DEV_AUTOMATION_AI',
        role: 'Desenvolvedor / Automação',
        status: 'idle',
        description: 'Desenvolve scripts, automações, integrações',
        skills: ['javascript', 'python', 'automation', 'apis', 'scraping'],
        config: { priority: 8, auto_start: false },
        created_at: new Date().toISOString()
    },
    {
        id: 'data_analyst',
        name: 'DATA_ANALYST',
        role: 'Analista de Dados',
        status: 'idle',
        description: 'Analisa métricas, gera relatórios, identifica insights',
        skills: ['analytics', 'sql', 'data_viz', 'reporting'],
        config: { priority: 6, auto_start: false },
        created_at: new Date().toISOString()
    },
    {
        id: 'executor',
        name: 'EXECUTOR',
        role: 'Executor de Tarefas',
        status: 'idle',
        description: 'Executa tarefas operacionais rapidamente',
        skills: ['execution', 'research', 'data_entry', 'validation'],
        config: { priority: 5, auto_start: false },
        created_at: new Date().toISOString()
    }
];

// In-memory data stores
let agents = [...DEFAULT_AGENTS];
let sessions = [];
let tasks = [];
let logs = [];
let changesStore = [];
let executionsStore = [];
let deliverablesStore = [];
let stateData = {
    id: 'runtime',
    status: 'running',
    last_heartbeat: new Date().toISOString(),
    active_agents: 0,
    active_tasks: 0,
    active_projects: 0
};

class MemoryStore {
    constructor(data) {
        this.data = data;
    }

    getAll() {
        return this.data;
    }

    getById(id) {
        return this.data.find(item => item.id === id);
    }

    create(item) {
        this.data.push(item);
        return item;
    }

    update(id, updates) {
        const index = this.data.findIndex(item => item.id === id);
        if (index === -1) return null;
        this.data[index] = { ...this.data[index], ...updates, updated_at: new Date().toISOString() };
        return this.data[index];
    }

    delete(id) {
        const index = this.data.findIndex(item => item.id === id);
        if (index === -1) return false;
        this.data.splice(index, 1);
        return true;
    }
}

module.exports = {
    agents: new MemoryStore(agents),
    sessions: new MemoryStore(sessions),
    tasks: new MemoryStore(tasks),
    logs: new MemoryStore(logs),
    changes: new MemoryStore(changesStore),
    executions: new MemoryStore(executionsStore),
    deliverables: new MemoryStore(deliverablesStore),
    state: {
        getById: () => stateData,
        update: (id, updates) => {
            stateData = { ...stateData, ...updates };
            return stateData;
        }
    }
};
