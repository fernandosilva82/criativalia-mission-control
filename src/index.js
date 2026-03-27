#!/usr/bin/env node

/**
 * Criativalia Autonomous Runtime v1.1
 * 24/7 persistent runtime with Opportunity Engine
 */

import { db } from './database/adapter.js';
import { orchestrator } from './orchestrator/runtime.js';
import { OpportunityEngine } from './orchestrator/opportunity-engine.js';
import { ShopifySpecialistAgent } from './agents/shopify-specialist.js';
import { NightWatchAgent } from './agents/night-watch.js';

// Inject db
orchestrator.db = db;
globalThis.runtimeDB = db;

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 CRIATIVALIA AUTONOMOUS RUNTIME v1.1                     ║
║                                                              ║
║   Persistent runtime • Opportunity Engine • 24/7 operation   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

console.log('📊 Initializing database...');
const stats = db.getStats();
console.log('✅ Database ready');
console.log(`   Agents: ${stats.agents.count}`);
console.log(`   Tasks: ${stats.tasks.count}`);

// Initialize Opportunity Engine
console.log('');
console.log('🔍 Initializing Opportunity Engine...');
const opportunityEngine = new OpportunityEngine(db);

// Register opportunity scanners
const shopifyAgent = new ShopifySpecialistAgent({
  domain: process.env.SHOPIFY_SHOP,
  token: process.env.SHOPIFY_ACCESS_TOKEN
});
opportunityEngine.registerAgent(shopifyAgent);

const nightWatchAgent = new NightWatchAgent();
opportunityEngine.registerAgent(nightWatchAgent);

console.log(`   Registered: ${opportunityEngine.agents.length} scanners`);

// Import and start server
import './api/server.js';

// Start services
console.log('');
console.log('🎛️  Starting services...');

Promise.all([
  orchestrator.start(),
  opportunityEngine.start()
]).then(() => {
  console.log('');
  console.log('✨ Runtime fully operational');
  console.log('');
  console.log('📊 Control Plane: http://localhost:3000');
  console.log('🔍 Opportunity Engine: Scanning every 10 minutes');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  orchestrator.stop();
  opportunityEngine.stop();
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  orchestrator.stop();
  opportunityEngine.stop();
  db.close();
  process.exit(0);
});
