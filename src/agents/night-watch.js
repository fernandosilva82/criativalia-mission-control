import { AgentWorker } from './base.js';
import { db } from '../database/adapter.js';

/**
 * Night Watch Agent
 * 
 * Mission: Monitor the system during night hours (22:00-07:00) and execute safe tasks only.
 * Soul: Vigilant, careful, autonomous, trustworthy.
 * Domain: Monitoring, health checks, safe autonomous execution
 */
export class NightWatchAgent extends AgentWorker {
  constructor() {
    super({
      id: 'night_watch',
      name: 'Night Watch',
      role: 'monitor',
      capabilities: ['monitoring', 'health', 'night_mode', 'safe_execution']
    });
    this.isNightMode = false;
  }

  async init() {
    await super.init();
    this.startNightModeCheck();
  }

  startNightModeCheck() {
    // Check every 10 minutes
    setInterval(() => this.checkNightMode(), 10 * 60 * 1000);
    this.checkNightMode(); // Check immediately
  }

  checkNightMode() {
    const hour = new Date().getHours();
    const wasNightMode = this.isNightMode;
    this.isNightMode = hour >= 22 || hour < 7;
    
    if (this.isNightMode !== wasNightMode) {
      const status = this.isNightMode ? 'ACTIVATED' : 'DEACTIVATED';
      console.log(`🌙 [Night Watch] Night mode ${status}`);
      
      db.logEvent({
        type: 'night_mode_change',
        agent_id: this.id,
        message: `Night mode ${status}`,
        severity: 'info',
        metadata: { hour, is_night: this.isNightMode }
      });
    }
  }

  async checkOpportunities() {
    console.log('🔍 [Night Watch] Scanning for monitoring opportunities...');
    
    // Only suggest night-safe tasks
    await this.generateOpportunity({
      title: 'Gerar relatório matinal 06:55',
      description: 'Relatório automático com oportunidades detectadas à noite.',
      area: 'monitoring',
      impact_score: 8,
      effort_score: 4,
      evidence: { schedule: '06:55', content: 'overnight_summary' },
      night_mode_safe: true
    });

    await this.generateOpportunity({
      title: 'Health check a cada 30 minutos',
      description: 'Verificar se todos os agentes estão respondendo.',
      area: 'monitoring',
      impact_score: 7,
      effort_score: 3,
      evidence: { interval: '30min', coverage: 'all_agents' },
      night_mode_safe: true
    });
  }

  async performWork(task) {
    console.log(`🌙 [Night Watch] Monitoring: ${task.title}`);
    this.logActivity('monitoring', `Watching: ${task.title}`, task.id);
    await new Promise(r => setTimeout(r, 2000));
    return { completed: true, result: 'Night watch complete' };
  }
}

export default NightWatchAgent;
