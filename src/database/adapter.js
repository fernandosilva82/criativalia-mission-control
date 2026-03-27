/**
 * Database Adapter - Simples e funcional
 * Usa MemoryDB (sem persistência) - estável
 */

class SimpleMemoryDB {
  constructor() {
    this.agents = new Map();
    this.tasks = new Map();
    this.opportunities = new Map();
    this.events = [];
    this.timesheet = new Map();
    
    // Agentes padrão
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
    
    defaultAgents.forEach(agent => this.agents.set(agent.id, agent));
    
    console.log('✅ MemoryDB inicializado com', this.agents.size, 'agentes');
  }

  // Agents
  getAgents() {
    return Array.from(this.agents.values());
  }

  updateAgent(id, updates) {
    const agent = this.agents.get(id);
    if (agent) {
      Object.assign(agent, updates);
      this.agents.set(id, agent);
    }
  }

  // Tasks
  getTasks(filters = {}) {
    let tasks = Array.from(this.tasks.values());
    if (filters.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    return tasks;
  }

  createTask(task) {
    this.tasks.set(task.id, task);
  }

  updateTask(id, updates) {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates, { updated_at: new Date().toISOString() });
    }
  }

  // Opportunities
  getOpportunities() {
    return Array.from(this.opportunities.values());
  }

  createOpportunity(opp) {
    this.opportunities.set(opp.id, opp);
  }

  // Events
  getEvents(limit = 100) {
    return this.events.slice(-limit).reverse();
  }

  createEvent(event) {
    this.events.push(event);
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
  }

  // Timesheet
  getTimesheet(date) {
    return this.timesheet.get(date) || [];
  }

  logActivity(agentId, date, hourSlot, activityType, description) {
    const key = `${agentId}_${date}_${hourSlot}`;
    this.timesheet.set(key, { agent_id: agentId, date, hour_slot: hourSlot, activity_type: activityType, description });
  }

  // Stats
  getStats() {
    return {
      agents: { count: this.agents.size },
      tasks: { count: this.tasks.size },
      opportunities: { count: this.opportunities.size }
    };
  }
  
  // Método vazio para compatibilidade
  close() {
    console.log('MemoryDB closed');
  }
}

export const db = new SimpleMemoryDB();
export default db;
