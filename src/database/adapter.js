/**
 * Persistência via arquivo JSON
 * Simples, confiável, funciona no Render
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_FILE = process.env.DATA_FILE || '/tmp/criativalia-data.json';

class FileDB {
  constructor() {
    this.agents = new Map();
    this.tasks = new Map();
    this.opportunities = new Map();
    this.events = [];
    this.timesheet = new Map();
    
    this.load();
    
    // Agente padrão se vazio
    if (this.agents.size === 0) {
      this.initDefaultAgents();
    }
    
    console.log('📁 FileDB inicializado:');
    console.log(`   Arquivo: ${DATA_FILE}`);
    console.log(`   Agentes: ${this.agents.size}`);
    console.log(`   Tarefas: ${this.tasks.size}`);
    console.log(`   Eventos: ${this.events.length}`);
  }
  
  initDefaultAgents() {
    const defaultAgents = [
      { id: 'ceo_orchestrator', name: 'CEO Orchestrator', role: 'orchestrator', status: 'running', capabilities: ['prioritization'], total_tasks: 0, last_active: new Date().toISOString() },
      { id: 'bash_architect', name: 'Bash Architect', role: 'developer', status: 'running', capabilities: ['shell'], total_tasks: 0, last_active: new Date().toISOString() },
      { id: 'deploy_engineer', name: 'Deploy Engineer', role: 'devops', status: 'running', capabilities: ['deploy'], total_tasks: 0, last_active: new Date().toISOString() },
      { id: 'ui_guardian', name: 'UI Guardian', role: 'designer', status: 'idle', capabilities: ['ui'], total_tasks: 0 },
      { id: 'data_analyst', name: 'Data Analyst', role: 'analyst', status: 'idle', capabilities: ['data'], total_tasks: 0 },
      { id: 'night_watch', name: 'Night Watch', role: 'monitor', status: 'idle', capabilities: ['monitoring'], total_tasks: 0 },
      { id: 'shopify_specialist', name: 'Shopify Specialist', role: 'ecommerce', status: 'idle', capabilities: ['shopify'], total_tasks: 0 },
      { id: 'copywriter', name: 'Copywriter', role: 'content', status: 'idle', capabilities: ['copy'], total_tasks: 0 }
    ];
    defaultAgents.forEach(agent => this.agents.set(agent.id, agent));
    this.save();
  }
  
  load() {
    try {
      if (existsSync(DATA_FILE)) {
        const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
        this.agents = new Map(data.agents || []);
        this.tasks = new Map(data.tasks || []);
        this.opportunities = new Map(data.opportunities || []);
        this.events = data.events || [];
        this.timesheet = new Map(data.timesheet || []);
      }
    } catch (err) {
      console.log('📁 Nenhum arquivo de dados encontrado, criando novo...');
    }
  }
  
  save() {
    try {
      const data = {
        agents: Array.from(this.agents.entries()),
        tasks: Array.from(this.tasks.entries()),
        opportunities: Array.from(this.opportunities.entries()),
        events: this.events,
        timesheet: Array.from(this.timesheet.entries()),
        lastSave: new Date().toISOString()
      };
      writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('❌ Erro ao salvar:', err.message);
    }
  }

  // Agents
  getAgents() { return Array.from(this.agents.values()); }
  updateAgent(id, updates) {
    const agent = this.agents.get(id);
    if (agent) {
      Object.assign(agent, updates, { updated_at: new Date().toISOString() });
      this.agents.set(id, agent);
      this.save();
    }
  }

  // Tasks
  getTasks(filters = {}) {
    let tasks = Array.from(this.tasks.values());
    if (filters.status) tasks = tasks.filter(t => t.status === filters.status);
    if (filters.kanban_column) tasks = tasks.filter(t => t.kanban_column === filters.kanban_column);
    return tasks;
  }
  createTask(task) {
    this.tasks.set(task.id, task);
    this.save();
  }
  updateTask(id, updates) {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates, { updated_at: new Date().toISOString() });
      this.save();
    }
  }

  // Opportunities
  getOpportunities() { return Array.from(this.opportunities.values()); }
  createOpportunity(opp) {
    this.opportunities.set(opp.id, opp);
    this.save();
  }
  updateOpportunity(id, updates) {
    const opp = this.opportunities.get(id);
    if (opp) {
      Object.assign(opp, updates);
      this.save();
    }
  }

  // Events
  getEvents(limit = 100) { return this.events.slice(-limit).reverse(); }
  createEvent(event) {
    this.events.push({ ...event, timestamp: new Date().toISOString() });
    if (this.events.length > 1000) this.events = this.events.slice(-500);
    this.save();
  }

  // Timesheet
  getTimesheet(date) { return Array.from(this.timesheet.values()).filter(t => t.date === date); }
  logActivity(agentId, date, hourSlot, activityType, description) {
    const key = `${agentId}_${date}_${hourSlot}`;
    this.timesheet.set(key, { agent_id: agentId, date, hour_slot: hourSlot, activity_type: activityType, description, timestamp: new Date().toISOString() });
    this.save();
  }

  // Stats
  getStats() {
    return {
      agents: { count: this.agents.size },
      tasks: { count: this.tasks.size },
      opportunities: { count: this.opportunities.size }
    };
  }
  
  close() {
    this.save();
    console.log('📁 Dados salvos em:', DATA_FILE);
  }
}

export const db = new FileDB();
export default db;
