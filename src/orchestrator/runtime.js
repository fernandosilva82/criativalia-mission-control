import { randomUUID } from 'crypto';

/**
 * Orchestrator Runtime Loop
 */

class Orchestrator {
  constructor() {
    this.isRunning = false;
    this.loopInterval = null;
    this.tickCount = 0;
    this.agents = new Map();
    this.nightMode = false;
    this.currentSession = null;
    this.db = null;
  }

  getDb() {
    return this.db || globalThis.runtimeDB;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Orchestrator already running');
      return;
    }

    console.log('🚀 Starting Criativalia Orchestrator...');
    
    const db = this.getDb();
    const agents = db.getAgents();
    for (const agent of agents) {
      this.agents.set(agent.id, {
        ...agent,
        currentTask: null,
        capabilities: agent.capabilities || []
      });
    }
    console.log(`🤖 Loaded ${this.agents.size} agents`);

    db.logEvent({
      type: 'system',
      message: 'Orchestrator started',
      severity: 'info'
    });

    this.isRunning = true;
    this.loopInterval = setInterval(() => this.tick(), 60000);
    await this.tick();
    
    console.log('✅ Orchestrator active');
  }

  stop() {
    console.log('🛑 Stopping orchestrator...');
    this.isRunning = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    
    const db = this.getDb();
    db.logEvent({
      type: 'system',
      message: 'Orchestrator stopped',
      severity: 'info'
    });
    
    console.log('✅ Orchestrator stopped');
  }

  async tick() {
    this.tickCount++;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Tick #${this.tickCount}`);

    try {
      await this.checkNightMode();
      await this.prioritizeBacklog();
      await this.assignTasks();
      this.logActivity();
    } catch (error) {
      console.error('❌ Tick error:', error);
      this.getDb().logEvent({
        type: 'system',
        message: `Tick error: ${error.message}`,
        severity: 'error'
      });
    }
  }

  async checkNightMode() {
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 7;

    if (isNight && !this.nightMode) {
      this.nightMode = true;
      this.getDb().logEvent({ type: 'system', message: '🌙 Night mode ON', severity: 'info' });
      console.log('🌙 Night mode ON');
    } else if (!isNight && this.nightMode) {
      this.nightMode = false;
      this.getDb().logEvent({ type: 'system', message: '☀️ Night mode OFF', severity: 'info' });
      console.log('☀️ Night mode OFF');
    }
  }

  async prioritizeBacklog() {
    const db = this.getDb();
    const tasks = db.getTasks({ status: 'backlog' });
    if (tasks.length === 0) return;

    console.log(`📋 Processing ${tasks.length} backlog items`);

    for (const task of tasks) {
      let score = (2 - task.priority) * 10;
      const ageDays = (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.min(ageDays * 2, 15);
      
      const metadata = { priority_score: score, last_scored: new Date().toISOString() };
      db.updateTask(task.id, { metadata: JSON.stringify(metadata) });
    }
  }

  async assignTasks() {
    const db = this.getDb();
    const idleAgents = Array.from(this.agents.values()).filter(a => a.status === 'idle');
    if (idleAgents.length === 0) return;

    const tasks = db.getTasks({ status: 'backlog' }).filter(t => t.priority === 0).slice(0, idleAgents.length);
    if (tasks.length === 0) return;

    console.log(`🎯 Assigning ${tasks.length} tasks`);

    for (let i = 0; i < Math.min(tasks.length, idleAgents.length); i++) {
      const task = tasks[i];
      const agent = idleAgents[i];

      db.updateTask(task.id, { agent_id: agent.id, status: 'todo', kanban_column: 'todo' });
      this.agents.set(agent.id, { ...agent, status: 'running', currentTask: task.id });
      db.updateAgentStatus(agent.id, 'running');

      db.logEvent({
        type: 'task_update',
        agent_id: agent.id,
        task_id: task.id,
        message: `Assigned: ${task.title}`,
        severity: 'info'
      });

      console.log(`  ✓ [${agent.id}] → ${task.title}`);
    }
  }

  logActivity() {
    const now = new Date();
    this.getDb().logTimesheet({
      agent_id: 'ceo_orchestrator',
      hour_slot: now.getHours(),
      date: now.toISOString().split('T')[0],
      activity_type: 'maintenance',
      description: `Tick #${this.tickCount}`
    });
  }

  getState() {
    return {
      isRunning: this.isRunning,
      tickCount: this.tickCount,
      nightMode: this.nightMode,
      agents: Array.from(this.agents.values()).map(a => ({
        id: a.id, name: a.name, status: a.status, currentTask: a.currentTask
      })),
      stats: this.getDb().getStats()
    };
  }
}

export const orchestrator = new Orchestrator();
export default orchestrator;
