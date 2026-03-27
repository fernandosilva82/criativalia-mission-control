import { AgentWorker } from './base.js';

/**
 * Copywriter Agent
 * 
 * Mission: Write persuasive content that increases conversion and clarity.
 * Soul: Sharp, persuasive, commercially intelligent, audience-aware.
 * Domain: Copywriting, conversion copy, messaging
 */
export class CopywriterAgent extends AgentWorker {
  constructor() {
    super({
      id: 'copywriter',
      name: 'Copywriter',
      role: 'content',
      capabilities: ['copy', 'conversion', 'messaging', 'email', 'ads']
    });
  }

  async checkOpportunities() {
    console.log('🔍 [Copywriter] Scanning for copy opportunities...');
    
    await this.generateOpportunity({
      title: 'Escrever email de reativação para 1504 clientes inativos',
      description: 'Campanha "Voltamos a te Procurar" com 15% off + frete grátis.',
      area: 'copy',
      impact_score: 9,
      effort_score: 4,
      evidence: { target: 1504, expected_open_rate: '25%', expected_conversion: '5%' }
    });

    await this.generateOpportunity({
      title: 'Reescrever descrições de produtos top 10',
      description: 'Focar em benefícios e emoção, não apenas características.',
      area: 'copy',
      impact_score: 7,
      effort_score: 5,
      evidence: { products: 10, current_conversion: '2.1%', target: '3.5%' }
    });

    await this.generateOpportunity({
      title: 'Criar copy para anúncios Meta (3 variações)',
      description: 'Testar hooks diferentes para mesmo produto.',
      area: 'copy',
      impact_score: 7,
      effort_score: 4,
      evidence: { variations: 3, testing_goal: 'ctr' }
    });
  }

  async performWork(task) {
    console.log(`✍️ [Copywriter] Writing: ${task.title}`);
    this.logActivity('writing', `Writing: ${task.title}`, task.id);
    await new Promise(r => setTimeout(r, 2000));
    return { completed: true, result: 'Copy delivered' };
  }
}

export default CopywriterAgent;
