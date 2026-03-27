import { db } from '../database/adapter.js';
import { randomUUID } from 'crypto';

/**
 * Base Agent Worker
 * 
 * All specific agents extend this class.
 * Provides common functionality for:
 * - Task execution
 * - Opportunity generation
 * - Event logging
 * - Timesheet tracking
 */

export class AgentWorker {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.capabilities = config.capabilities || [];
    this.currentTask = null;
    this.isRunning = false;
  }

  /**
   * Initialize the agent
   */
  async init() {
    console.log(`🤖 [${this.id}] Agent initialized`);
    db.updateAgentStatus(this.id, 'idle');
    
    db.logEvent({
      type: 'agent_start',
      agent_id: this.id,
      message: `${this.name} initialized`,
      severity: 'info'
    });

    // Start work loop
    this.startWorkLoop();
  }

  /**
   * Work loop - continuously check for and execute tasks
   */
  startWorkLoop() {
    // Check for work every 2 minutes
    this.workInterval = setInterval(() => this.checkAndWork(), 2 * 60 * 1000);
    console.log(`⚡ [${this.id}] Work loop started`);
    
    // First check after 10 seconds
    setTimeout(() => this.checkAndWork(), 10000);
  }

  async checkAndWork() {
    if (this.currentTask) {
      console.log(`⏳ [${this.id}] Already working on: ${this.currentTask.title}`);
      return;
    }

    try {
      // Look for tasks assigned to this agent
      const tasks = db.getTasks({ agent_id: this.id, status: 'ready' });
      
      if (tasks.length > 0) {
        // Get highest priority task
        const task = tasks.sort((a, b) => {
          const pA = a.priority === 'P0' ? 0 : a.priority === 'P1' ? 1 : 2;
          const pB = b.priority === 'P0' ? 0 : b.priority === 'P1' ? 1 : 2;
          return pA - pB;
        })[0];

        console.log(`🎯 [${this.id}] Found work: ${task.title}`);
        await this.executeTask(task);
      } else {
        // No tasks - maybe scan for opportunities
        console.log(`😴 [${this.id}] No tasks available`);
      }
    } catch (error) {
      console.error(`❌ [${this.id}] Work loop error:`, error.message);
    }
  }

  stopWorkLoop() {
    if (this.workInterval) {
      clearInterval(this.workInterval);
      this.workInterval = null;
    }
  }

  /**
   * Main work loop - override in subclasses
   */
  async run() {
    throw new Error('Agent must implement run() method');
  }

  /**
   * Execute a specific task
   */
  async executeTask(task) {
    this.currentTask = task;
    
    console.log(`⚡ [${this.id}] Executing: ${task.title}`);
    
    // Update task status
    db.updateTask(task.id, {
      status: 'in_progress',
      kanban_column: 'in_progress',
      started_at: new Date().toISOString()
    });

    // Update agent status
    db.updateAgentStatus(this.id, 'running');

    // Log
    db.logEvent({
      type: 'task_update',
      agent_id: this.id,
      task_id: task.id,
      message: `Task started: ${task.title}`,
      severity: 'info'
    });

    try {
      // Track time
      const startTime = Date.now();
      
      // DO THE WORK (implemented by subclass)
      const result = await this.performWork(task);
      
      const duration = (Date.now() - startTime) / 1000 / 60; // minutes

      // Mark task complete
      db.updateTask(task.id, {
        status: 'done',
        kanban_column: 'done',
        completed_at: new Date().toISOString(),
        actual_hours: duration / 60
      });

      // Update agent stats
      const agent = db.getAgent(this.id);
      const newTotal = (agent.total_tasks || 0) + 1;
      db.updateAgent(this.id, { 
        total_tasks: newTotal, 
        last_active: new Date().toISOString() 
      });

      // Log success
      db.logEvent({
        type: 'task_complete',
        agent_id: this.id,
        task_id: task.id,
        message: `Task completed: ${task.title} (${duration.toFixed(1)} min)`,
        severity: 'info',
        metadata: { duration_minutes: duration, result }
      });

      console.log(`✅ [${this.id}] Task completed in ${duration.toFixed(1)} min`);

      return result;

    } catch (error) {
      // Log error
      db.updateTask(task.id, { status: 'blocked' });
      
      db.logEvent({
        type: 'agent_error',
        agent_id: this.id,
        task_id: task.id,
        message: `Task failed: ${error.message}`,
        severity: 'error',
        metadata: { error: error.stack }
      });

      console.error(`❌ [${this.id}] Task failed:`, error.message);
      
      throw error;
    } finally {
      this.currentTask = null;
      db.updateAgentStatus(this.id, 'idle');
    }
  }

  /**
   * Perform the actual work - MUST be implemented by subclass
   */
  async performWork(task) {
    throw new Error('Agent must implement performWork() method');
  }

  /**
   * Generate an opportunity (backlog item)
   */
  async generateOpportunity({ title, description, area, impact, effort, evidence }) {
    const oppId = randomUUID();
    
    db.createOpportunity({
      id: oppId,
      agent_id: this.id,
      title,
      description,
      area,
      impact_score: impact,
      effort_score: effort,
      evidence: JSON.stringify(evidence)
    });

    db.logEvent({
      type: 'opportunity',
      agent_id: this.id,
      message: `Opportunity identified: ${title}`,
      severity: 'info',
      metadata: { area, impact, effort }
    });

    console.log(`💡 [${this.id}] Opportunity: ${title}`);
    
    return oppId;
  }

  /**
   * Request human decision
   */
  async requestDecision({ title, description, options, recommendation, urgency = 1 }) {
    const decisionId = randomUUID();
    
    db.createDecision({
      id: decisionId,
      title,
      description,
      options,
      recommendation,
      urgency
    });

    db.logEvent({
      type: 'decision',
      agent_id: this.id,
      message: `Decision required: ${title}`,
      severity: urgency === 0 ? 'warning' : 'info'
    });

    console.log(`🤔 [${this.id}] Decision requested: ${title}`);
    
    return decisionId;
  }

  /**
   * Log timesheet entry
   */
  logActivity(activityType, description, taskId = null) {
    const now = new Date();
    db.logTimesheet({
      agent_id: this.id,
      task_id: taskId,
      hour_slot: now.getHours(),
      date: now.toISOString().split('T')[0],
      activity_type: activityType,
      description
    });
  }

  /**
   * Check for opportunities in this agent's area
   * Override in subclasses for specific opportunity detection
   */
  async checkOpportunities() {
    // Base implementation - subclasses override
    return [];
  }
}

/**
 * Opportunity Engine
 * Runs periodically to let each agent scan for opportunities
 */
export class OpportunityEngine {
  constructor() {
    this.agents = [];
    this.interval = null;
  }

  registerAgent(agent) {
    this.agents.push(agent);
  }

  start() {
    // Run every 30 minutes
    this.interval = setInterval(() => this.scan(), 30 * 60 * 1000);
    console.log('💡 Opportunity engine started');
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async scan() {
    console.log('🔍 Scanning for opportunities...');
    
    for (const agent of this.agents) {
      try {
        await agent.checkOpportunities();
      } catch (error) {
        console.error(`❌ Opportunity scan failed for ${agent.id}:`, error);
      }
    }
  }
}

export default AgentWorker;
