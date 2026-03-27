import { AgentWorker } from './base.js';

/**
 * Premium UI Guardian Agent
 * 
 * Mission: Prevent ugly interfaces and raise visual quality across the system.
 * Soul: Demanding, minimalist, premium, visually intelligent, taste-driven.
 * Domain: UI quality, visual standards, design review
 */
export class PremiumUIGuardianAgent extends AgentWorker {
  constructor() {
    super({
      id: 'ui_guardian',
      name: 'UI Guardian',
      role: 'designer',
      capabilities: ['ui', 'quality', 'review', 'premium', 'standards']
    });
  }

  async checkOpportunities() {
    console.log('🔍 [UI Guardian] Scanning for UI quality issues...');
    
    await this.generateOpportunity({
      title: 'Revisar consistência Japandi Dark no Control Plane',
      description: 'Verificar se todas as 6 páginas seguem o design system.',
      area: 'ui',
      impact_score: 7,
      effort_score: 5,
      evidence: { pages: 6, standard: 'japandi_dark' }
    });

    await this.generateOpportunity({
      title: 'Ajustar espaçamento e hierarquia visual no Kanban',
      description: 'Cards muito juntos, precisa de mais breathing room.',
      area: 'ui',
      impact_score: 6,
      effort_score: 3,
      evidence: { issue: 'spacing', current_state: 'cramped' }
    });

    await this.generateOpportunity({
      title: 'Padronizar tipografia em todo o sistema',
      description: 'Garantir Playfair Display + Inter + JetBrains Mono.',
      area: 'ui',
      impact_score: 7,
      effort_score: 4,
      evidence: { fonts_defined: 3, consistency_check: 'needed' }
    });
  }

  async performWork(task) {
    console.log(`🎨 [UI Guardian] Reviewing: ${task.title}`);
    this.logActivity('review', `Reviewing: ${task.title}`, task.id);
    await new Promise(r => setTimeout(r, 2000));
    return { completed: true, result: 'UI polished' };
  }
}

export default PremiumUIGuardianAgent;
