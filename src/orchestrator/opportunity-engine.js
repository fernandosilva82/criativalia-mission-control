/**
 * Opportunity Engine - Geração de oportunidades
 * Versão simplificada e estável
 */

export class OpportunityEngine {
  constructor(db) {
    this.db = db;
    this.isRunning = false;
    this.interval = null;
    this.scanners = [];
    this.agents = [];
  }

  registerScanner(name, scannerFn) {
    this.scanners.push({ name, fn: scannerFn });
    console.log(`🔍 Scanner registrado: ${name}`);
  }

  registerAgent(agent) {
    if (agent.checkOpportunities) {
      this.agents.push(agent);
      console.log(`🔍 Agente registrado no Opportunity Engine: ${agent.name}`);
    }
  }

  start() {
    this.isRunning = true;
    console.log('🔍 Opportunity Engine iniciado');
    
    // Escanear a cada 10 minutos
    this.interval = setInterval(() => this.scan(), 10 * 60 * 1000);
    
    // Primeira execução
    setTimeout(() => this.scan(), 5000);
  }

  stop() {
    this.isRunning = false;
    if (this.interval) clearInterval(this.interval);
    console.log('🔍 Opportunity Engine parado');
  }

  async scan() {
    if (!this.isRunning) return;
    
    console.log('🔍 Escaneando oportunidades...');
    
    // Scan usando scanners registrados
    for (const scanner of this.scanners) {
      try {
        const opportunities = await scanner.fn(this.db);
        if (opportunities && opportunities.length > 0) {
          for (const opp of opportunities) {
            this.db.createOpportunity({
              id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...opp,
              created_at: new Date().toISOString(),
              status: 'open'
            });
          }
          console.log(`✅ ${opportunities.length} oportunidades de ${scanner.name}`);
        }
      } catch (err) {
        console.error(`❌ Erro no scanner ${scanner.name}:`, err.message);
      }
    }
    
    // Scan usando agentes registrados
    for (const agent of this.agents) {
      try {
        if (agent.checkOpportunities) {
          await agent.checkOpportunities();
        }
      } catch (err) {
        console.error(`❌ Erro no agente ${agent.name}:`, err.message);
      }
    }
  }
}

// Scanner de Shopify
export async function shopifyScanner(db) {
  // Simular análise de dados Shopify
  const opportunities = [];
  
  // Verificar se há pedidos pendentes
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 18) {
    opportunities.push({
      type: 'sales',
      title: 'Analisar taxa de conversão',
      description: 'Período comercial ativo - verificar métricas',
      priority: 'p1',
      source: 'shopify'
    });
  }
  
  return opportunities;
}

// Scanner de conteúdo
export async function contentScanner(db) {
  const opportunities = [];
  const hour = new Date().getHours();
  
  // Sugerir conteúdo durante horário comercial
  if (hour === 10 || hour === 15) {
    opportunities.push({
      type: 'content',
      title: 'Criar post para redes sociais',
      description: 'Horário ideal para engajamento',
      priority: 'p2',
      source: 'copywriter'
    });
  }
  
  return opportunities;
}
