import { OpportunityScanner } from '../orchestrator/opportunity-engine.js';

/**
 * Night Watch Agent
 * 
 * Responsável por:
 * - Patrulha noturna (22h-07h)
 * - Monitorar métricas
 * - Gerar morning report
 * - Detectar anomalias
 */

export class NightWatchAgent extends OpportunityScanner {
  constructor() {
    super({
      id: 'night_watch',
      name: 'Night Watch',
      role: 'monitor',
      capabilities: ['monitoring', 'patrol', 'alerts', 'reports']
    });
    this.patrolCount = 0;
  }

  async scanForOpportunities() {
    // Night Watch only operates during night hours
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 7;
    
    if (!isNight) {
      return []; // Day mode - no night opportunities
    }

    const opportunities = [];
    this.patrolCount++;
    
    console.log(`  🌙 Night Watch patrol #${this.patrolCount}`);

    // Check system health
    const health = await this.checkSystemHealth();
    if (!health.ok) {
      opportunities.push({
        title: 'Sistema com anomalias detectadas',
        description: `Health check falhou: ${health.issues.join(', ')}`,
        area: 'system',
        impact_score: 8,
        effort_score: 2,
        auto_convert: true,
        evidence: health
      });
    }

    // Check for overnight sales
    const overnightSales = await this.getOvernightSales();
    if (overnightSales > 0) {
      opportunities.push({
        title: `${overnightSales} vendas durante a noite`,
        description: 'Novos pedidos para processar pela manhã.',
        area: 'operations',
        impact_score: 6,
        effort_score: 3,
        auto_convert: true,
        evidence: { sales_count: overnightSales }
      });
    }

    // Daily morning report opportunity (at 6:30 AM)
    if (hour === 6 && this.patrolCount % 3 === 0) {
      opportunities.push({
        title: 'Gerar Morning Report',
        description: 'Relatório diário com métricas de vendas, tarefas completadas e oportunidades.',
        area: 'reporting',
        impact_score: 7,
        effort_score: 3,
        auto_convert: true,
        evidence: { report_type: 'morning_summary' }
      });
    }

    return opportunities;
  }

  async checkSystemHealth() {
    // Simulated health check
    return {
      ok: true,
      issues: [],
      timestamp: new Date().toISOString()
    };
  }

  async getOvernightSales() {
    // Simulated - would query Shopify
    return Math.floor(Math.random() * 3); // 0-2 sales overnight
  }

  async performWork(task) {
    console.log(`🌙 [Night Watch] Executing: ${task.title}`);
    this.logActivity('maintenance', task.title, task.id);

    if (task.title.includes('Morning Report')) {
      return await this.generateMorningReport();
    }

    // Default work
    await new Promise(r => setTimeout(r, 1000));
    return { completed: true };
  }

  async generateMorningReport() {
    const now = new Date();
    const report = {
      date: now.toISOString().split('T')[0],
      summary: {
        overnight_sales: await this.getOvernightSales(),
        tasks_completed: 0, // Would query from DB
        new_opportunities: 0,
        system_status: 'healthy'
      },
      recommendations: [
        'Processar pedidos pendentes',
        'Verificar estoque de produtos populares',
        'Revisar campanha de reativação de clientes'
      ]
    };

    console.log('📊 Morning Report Generated:', report);
    
    return { 
      completed: true, 
      result: 'Morning report generated',
      report 
    };
  }
}

export default NightWatchAgent;
