import { AgentWorker } from '../agents/base.js';
import { randomUUID } from 'crypto';

/**
 * Opportunity Engine
 * 
 * Responsável por:
 * - Escavar dados periodicamente
 * - Identificar oportunidades
 * - Gerar tasks automaticamente
 * - Alimentar o backlog
 */

export class OpportunityEngine {
  constructor(db) {
    this.db = db;
    this.agents = [];
    this.interval = null;
    this.isRunning = false;
  }

  registerAgent(agent) {
    this.agents.push(agent);
    console.log(`🔍 [OpportunityEngine] Registered: ${agent.name}`);
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔍 Opportunity Engine started');
    
    // Scan every 10 minutes
    this.interval = setInterval(() => this.scan(), 10 * 60 * 1000);
    
    // First scan immediately
    this.scan();
  }

  stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log('🔍 Opportunity Engine stopped');
  }

  async scan() {
    console.log(`\n🔍 [${new Date().toISOString()}] Scanning for opportunities...`);
    
    for (const agent of this.agents) {
      try {
        const opportunities = await agent.scanForOpportunities();
        
        if (opportunities && opportunities.length > 0) {
          console.log(`  💡 ${agent.name} found ${opportunities.length} opportunities`);
          
          for (const opp of opportunities) {
            // Save opportunity
            this.db.createOpportunity({
              id: randomUUID(),
              agent_id: agent.id,
              ...opp,
              status: 'open',
              created_at: new Date().toISOString()
            });

            // Auto-convert high-impact opportunities to tasks
            if (opp.impact_score >= 7 && opp.auto_convert !== false) {
              await this.convertToTask(opp, agent.id);
            }
          }
        }
      } catch (error) {
        console.error(`  ❌ ${agent.name} scan failed:`, error.message);
        this.db.logEvent({
          type: 'system',
          agent_id: agent.id,
          message: `Opportunity scan failed: ${error.message}`,
          severity: 'error'
        });
      }
    }
    
    console.log('🔍 Scan complete\n');
  }

  async convertToTask(opp, agentId) {
    const taskId = randomUUID();
    
    this.db.createTask({
      id: taskId,
      title: opp.title,
      description: opp.description,
      agent_id: agentId,
      priority: opp.impact_score >= 8 ? 0 : opp.impact_score >= 5 ? 1 : 2,
      status: 'backlog',
      kanban_column: 'backlog',
      source: 'opportunity_engine',
      metadata: JSON.stringify({ 
        opportunity_id: opp.id,
        impact: opp.impact_score,
        effort: opp.effort_score,
        area: opp.area
      })
    });

    this.db.logEvent({
      type: 'task_create',
      agent_id: agentId,
      message: `Auto-generated task from opportunity: ${opp.title}`,
      severity: 'info'
    });

    console.log(`  📝 Auto-converted to task: ${opp.title}`);
  }
}

// Base class for opportunity scanners
export class OpportunityScanner extends AgentWorker {
  constructor(config) {
    super(config);
  }

  async scanForOpportunities() {
    throw new Error('Scanner must implement scanForOpportunities()');
  }
}

export default OpportunityEngine;
