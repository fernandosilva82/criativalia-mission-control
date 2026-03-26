/**
 * In-Memory Database (Serverless Fallback)
 * 
 * Lightweight storage for serverless environments where SQLite
 * native modules are not available.
 * 
 * Note: Data is lost on cold starts. For production serverless,
 * migrate to Redis/Vercel KV or use a persistent VPS.
 */

import { randomUUID } from 'crypto';

class MemoryDB {
  constructor() {
    this.agents = new Map([
      ['ceo_orchestrator', { id: 'ceo_orchestrator', name: 'CEO Orchestrator', role: 'orchestrator', status: 'idle', capabilities: ['prioritization'], total_tasks: 0 }],
      ['bash_architect', { id: 'bash_architect', name: 'Bash Architect', role: 'developer', status: 'idle', capabilities: ['shell'], total_tasks: 0 }],
      ['deploy_engineer', { id: 'deploy_engineer', name: 'Deploy Engineer', role: 'devops', status: 'idle', capabilities: ['deploy'], total_tasks: 0 }],
      ['ui_guardian', { id: 'ui_guardian', name: 'UI Guardian', role: 'designer', status: 'idle', capabilities: ['ui'], total_tasks: 0 }],
      ['data_analyst', { id: 'data_analyst', name: 'Data Analyst', role: 'analyst', status: 'idle', capabilities: ['data'], total_tasks: 0 }],
      ['night_watch', { id: 'night_watch', name: 'Night Watch', role: 'monitor', status: 'idle', capabilities: ['monitoring'], total_tasks: 0 }],
      ['shopify_specialist', { id: 'shopify_specialist', name: 'Shopify Specialist', role: 'ecommerce', status: 'idle', capabilities: ['shopify'], total_tasks: 0 }],
      ['copywriter', { id: 'copywriter', name: 'Copywriter', role: 'content', status: 'idle', capabilities: ['copy'], total_tasks: 0 }]
    ]);
    
    this.tasks = new Map();
    this.events = [];
    this.opportunities = new Map();
    this.decisions = new Map();
    this.timesheet = [];
    
    // Add sample data
    this.seedData();
  }

  seedData() {
    // Sample tasks
    this.tasks.set('task-1', {
      id: 'task-1',
      title: 'Create backup script',
      description: 'Implement automated database backup',
      agent_id: 'bash_architect',
      priority: 0,
      status: 'backlog',
      kanban_column: 'backlog',
      created_at: new Date().toISOString()
    });
    
    this.tasks.set('task-2', {
      id: 'task-2',
      title: 'Analyze conversion metrics',
      description: 'Identify funnel bottlenecks',
      agent_id: 'data_analyst',
      priority: 1,
      status: 'todo',
      kanban_column: 'todo',
      created_at: new Date().toISOString()
    });
    
    // Sample events
    this.events.push(
      { id: 1, type: 'system', message: 'Runtime initialized (memory mode)', severity: 'info', timestamp: new Date().toISOString() },
      { id: 2, type: 'task_create', message: 'Task created: Create backup script', severity: 'info', timestamp: new Date().toISOString() }
    );
  }

  // Agents
  getAgents() {
    return Array.from(this.agents.values());
  }

  getAgent(id) {
    return this.agents.get(id);
  }

  updateAgentStatus(id, status) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      agent.last_active = new Date().toISOString();
    }
  }

  // Tasks
  createTask(task) {
    this.tasks.set(task.id, task);
  }

  getTasks(filters = {}) {
    let tasks = Array.from(this.tasks.values());
    
    if (filters.status) tasks = tasks.filter(t => t.status === filters.status);
    if (filters.agent_id) tasks = tasks.filter(t => t.agent_id === filters.agent_id);
    if (filters.priority !== undefined) tasks = tasks.filter(t => t.priority === filters.priority);
    if (filters.kanban_column) tasks = tasks.filter(t => t.kanban_column === filters.kanban_column);
    
    return tasks.sort((a, b) => a.priority - b.priority);
  }

  updateTask(id, updates) {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates);
    }
  }

  moveTaskKanban(id, column) {
    const task = this.tasks.get(id);
    if (task) {
      task.kanban_column = column;
      task.status = column === 'done' ? 'done' : 'in_progress';
    }
  }

  // Events
  logEvent(event) {
    this.events.push({
      id: this.events.length + 1,
      ...event,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  getEvents(limit = 100, filters = {}) {
    let events = [...this.events].reverse();
    
    if (filters.type) events = events.filter(e => e.type === filters.type);
    if (filters.agent_id) events = events.filter(e => e.agent_id === filters.agent_id);
    
    return events.slice(0, limit);
  }

  // Timesheet
  logTimesheet(entry) {
    this.timesheet.push({
      id: this.timesheet.length + 1,
      ...entry
    });
  }

  getTimesheet(date, agent_id = null) {
    let entries = this.timesheet.filter(t => t.date === date);
    if (agent_id) entries = entries.filter(t => t.agent_id === agent_id);
    return entries;
  }

  getLast24Hours() {
    return this.timesheet.slice(-100);
  }

  // Opportunities
  createOpportunity(opp) {
    this.opportunities.set(opp.id, opp);
  }

  getOpportunities(status = 'open') {
    return Array.from(this.opportunities.values())
      .filter(o => o.status === status)
      .sort((a, b) => b.impact_score - a.impact_score);
  }

  // Decisions
  createDecision(decision) {
    this.decisions.set(decision.id, decision);
  }

  getPendingDecisions() {
    return Array.from(this.decisions.values())
      .filter(d => d.status === 'pending')
      .sort((a, b) => a.urgency - b.urgency);
  }

  // Stats
  getStats() {
    return {
      agents: { count: this.agents.size },
      agents_active: { count: Array.from(this.agents.values()).filter(a => a.status === 'running').length },
      tasks: { count: this.tasks.size },
      tasks_done: { count: Array.from(this.tasks.values()).filter(t => t.status === 'done').length },
      tasks_in_progress: { count: Array.from(this.tasks.values()).filter(t => t.status === 'in_progress').length },
      events_24h: { count: this.events.length },
      opportunities: { count: this.opportunities.size },
      decisions_pending: { count: this.getPendingDecisions().length }
    };
  }

  close() {
    // No-op for memory DB
  }
}

export default MemoryDB;
