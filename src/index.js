#!/usr/bin/env node
 
/**
 * Criativalia Runtime v1.2
 * Com persistência JSON, Night Watch e Opportunity Engine
 */

import { db } from './database/adapter.js';
import { NightWatchAgent } from './agents/night-watch.js';
import { OpportunityEngine, shopifyScanner, contentScanner } from './orchestrator/opportunity-engine.js';

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 CRIATIVALIA RUNTIME v1.2                                ║
║                                                              ║
║   Persistência JSON • Night Watch • Opportunity Engine       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

console.log('📁 Persistência:', process.env.DATA_FILE || '/tmp/criativalia-data.json');
console.log('');

// Iniciar servidor API
import './api/server.js';

// Iniciar Night Watch
const nightWatch = new NightWatchAgent();
nightWatch.start(db);

// Iniciar Opportunity Engine
const opportunityEngine = new OpportunityEngine(db);
opportunityEngine.registerScanner('shopify', shopifyScanner);
opportunityEngine.registerScanner('content', contentScanner);
opportunityEngine.start();

// Evento de inicialização
db.createEvent({
  type: 'system',
  message: 'Runtime v1.2 iniciado com sucesso',
  agent: 'system'
});

console.log('');
console.log('✨ Runtime v1.2 operacional');
console.log('📊 API: http://localhost:' + (process.env.PORT || 3000));
console.log('🌙 Night Watch: Ativo');
console.log('🔍 Opportunity Engine: Ativo');
console.log('');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando graciosamente...');
  nightWatch.stop();
  opportunityEngine.stop();
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando graciosamente...');
  nightWatch.stop();
  opportunityEngine.stop();
  db.close();
  process.exit(0);
});
