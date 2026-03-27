import { AgentWorker } from './base.js';
import { db } from '../database/adapter.js';

/**
 * CEO Orchestrator Agent
 * 
 * Mission: Coordinate the company, prioritize work, orchestrate backlog, and keep the system aligned with company goals.
 * Soul: Strategic, direct, commercially intelligent, decisive, calm under pressure.
 * Domain: Strategy, prioritization, orchestration
 */
export class CEOOrchestratorAgent extends AgentWorker {
  constructor() {
    super({
      id: 'ceo_orchestrator',
      name: 'CEO Orchestrator',
      role: 'orchestrator',
      capabilities: ['strategy', 'prioritization', 'orchestration', 'decisions']
    });
  }

  async init() {
    await super.init();
    // Start orchestration loop
    this.startOrchestration();
    // Run immediately
    setTimeout(() => this.orchestrate(), 5000);
  }

  startOrchestration() {
    // Run every 5 minutes (mais frequente para gerar trabalho)
    setInterval(() => this.orchestrate(), 5 * 60 * 1000);
    console.log('👔 [CEO Orchestrator] Orchestration started (every 5 min)');
  }

  async orchestrate() {
    console.log('👔 [CEO Orchestrator] Running orchestration...');
    
    try {
      // 1. Get all opportunities
      const opportunities = db.getOpportunities ? db.getOpportunities() : [];
      console.log(`  📊 Found ${opportunities.length} opportunities`);

      // 2. Filter unprocessed opportunities (status 'new' or null/undefined)
      const unprocessed = opportunities.filter(opp => opp.status === 'new' || !opp.status);
      console.log(`  🆕 ${unprocessed.length} unprocessed opportunities`);
      
      // 3. Prioritize
      const prioritized = this.prioritize(unprocessed);
      
      // 4. Convert top opportunities to tasks
      let created = 0;
      for (const opp of prioritized.slice(0, 5)) { // Process top 5
        await this.convertToTask(opp);
        created++;
      }

      console.log(`  ✅ Created ${created} tasks from opportunities`);
      
    } catch (error) {
      console.error('❌ [CEO Orchestrator] Error:', error.message);
    }
  }

  prioritize(opportunities) {
    return opportunities
      .map(opp => ({
        ...opp,
        score: (opp.impact_score || 5) * 10 - (opp.effort_score || 5)
      }))
      .sort((a, b) => b.score - a.score);
  }

  async convertToTask(opportunity) {
    // Create task from opportunity
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const priority = opportunity.impact_score >= 9 ? 'P0' : 
                    opportunity.impact_score >= 7 ? 'P1' : 'P2';

    db.createTask({
      id: taskId,
      title: `[${priority}] ${opportunity.title}`,
      description: opportunity.description,
      agent_id: opportunity.agent_id || 'executor',
      kanban_column: 'ready',
      status: 'ready',
      priority: priority,
      impact: opportunity.evidence ? JSON.stringify(opportunity.evidence) : '',
      source_opportunity: opportunity.id
    });

    // Mark opportunity as processed
    db.updateOpportunity(opportunity.id, { status: 'converted', task_id: taskId });

    console.log(`  📝 Created task: ${taskId} (P0)`);

    db.logEvent({
      type: 'task_created',
      agent_id: this.id,
      message: `Task created from opportunity: ${opportunity.title}`,
      severity: 'info',
      metadata: { task_id, priority, source: opportunity.id }
    });
  }

  async checkOpportunities() {
    // CEO doesn't generate opportunities, only processes them
    console.log('👔 [CEO Orchestrator] Reviewing system status...');
  }

  async performWork(task) {
    console.log(`👔 [CEO Orchestrator] Strategizing: ${task.title}`);
    this.logActivity('strategy', `Strategizing: ${task.title}`, task.id);
    await new Promise(r => setTimeout(r, 2000));
    return { completed: true, result: 'Strategy defined' };
  }
}

export default CEOOrchestratorAgent;
