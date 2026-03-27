#!/usr/bin/env node

/**
 * Criativalia Autonomous Runtime v1.2
 * 21 Agents • 24/7 Operation • Opportunity Engine
 */

import { db } from './database/adapter.js';
import { OpportunityEngine } from './orchestrator/opportunity-engine.js';

// Import all 21 agents
import { CEOOrchestratorAgent } from './agents/ceo-orchestrator.js';
import { DevAutomationAIAgent } from './agents/dev-automation-ai.js';
import { TrafficManagerAgent } from './agents/traffic-manager.js';
import { SocialMediaAgent } from './agents/social-media.js';
import { CopywriterAgent } from './agents/copywriter.js';
import { DesignerAgent } from './agents/designer.js';
import { ShopifySpecialistAgent } from './agents/shopify-specialist.js';
import { CROSpecialistAgent } from './agents/cro-specialist.js';
import { DataAnalystAgent } from './agents/data-analyst.js';
import { BrandDirectorAgent } from './agents/brand-director.js';
import { CustomerSupportAgent } from './agents/customer-support.js';
import { ProductionManagerAgent } from './agents/production-manager.js';
import { LogisticsManagerAgent } from './agents/logistics-manager.js';
import { FinancialManagerAgent } from './agents/financial-manager.js';
import { InnovationAgent } from './agents/innovation-agent.js';
import { ExecutorAgent } from './agents/executor.js';
import { BashArchitectAgent } from './agents/bash-architect.js';
import { DeployEngineerAgent } from './agents/deploy-engineer.js';
import { PremiumUIGuardianAgent } from './agents/ui-guardian.js';
import { ReleaseManagerAgent } from './agents/release-manager.js';
import { NightWatchAgent } from './agents/night-watch.js';

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 CRIATIVALIA AUTONOMOUS RUNTIME v1.2                     ║
║                                                              ║
║   21 Agents • Opportunity Engine • 24/7 Operation            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

console.log('📊 Initializing database...');
const stats = db.getStats();
console.log('✅ Database ready');
console.log(`   Agents in DB: ${stats.agents.count}`);
console.log(`   Tasks: ${stats.tasks.count}`);
console.log(`   Opportunities: ${stats.opportunities ? stats.opportunities.count : 0}`);

// Initialize all agents
console.log('');
console.log('🤖 Initializing 21 Agents...');

const agents = [
  new CEOOrchestratorAgent(),
  new DevAutomationAIAgent(),
  new TrafficManagerAgent(),
  new SocialMediaAgent(),
  new CopywriterAgent(),
  new DesignerAgent(),
  new ShopifySpecialistAgent(),
  new CROSpecialistAgent(),
  new DataAnalystAgent(),
  new BrandDirectorAgent(),
  new CustomerSupportAgent(),
  new ProductionManagerAgent(),
  new LogisticsManagerAgent(),
  new FinancialManagerAgent(),
  new InnovationAgent(),
  new ExecutorAgent(),
  new BashArchitectAgent(),
  new DeployEngineerAgent(),
  new PremiumUIGuardianAgent(),
  new ReleaseManagerAgent(),
  new NightWatchAgent()
];

// Register agents in database
for (const agent of agents) {
  db.registerAgent({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    capabilities: JSON.stringify(agent.capabilities),
    status: 'idle'
  });
  console.log(`   ✅ ${agent.name}`);
}

// Initialize Opportunity Engine
console.log('');
console.log('🔍 Initializing Opportunity Engine...');
const opportunityEngine = new OpportunityEngine(db);

// Register all agents as opportunity scanners
for (const agent of agents) {
  if (agent.checkOpportunities) {
    opportunityEngine.registerAgent(agent);
  }
}

console.log(`   Registered: ${opportunityEngine.agents.length} opportunity scanners`);

// Import and start server
import './api/server.js';

// Start services
console.log('');
console.log('🎛️  Starting services...');

// Initialize all agents
Promise.all(agents.map(agent => agent.init())).then(() => {
  console.log('   ✅ All agents initialized');
  
  // Start opportunity engine
  opportunityEngine.start();
  console.log('   ✅ Opportunity Engine started (10min intervals)');
  
  // Trigger first scan immediately
  setTimeout(() => {
    console.log('');
    console.log('🔍 Running first opportunity scan...');
    opportunityEngine.scan();
  }, 5000);
  
  console.log('');
  console.log('✨ Runtime fully operational');
  console.log('');
  console.log('📊 Stats Endpoint: /api/stats');
  console.log('🤖 Agents Endpoint: /api/agents');
  console.log('💡 Opportunities Endpoint: /api/opportunities');
  console.log('📋 Tasks Endpoint: /api/tasks');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  opportunityEngine.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  opportunityEngine.stop();
  process.exit(0);
});
