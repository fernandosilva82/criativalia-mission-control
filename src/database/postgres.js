/**
 * PostgreSQL Database Adapter
 * Persistente - dados sobrevivem a restarts
 */

import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

class PostgresDB {
  constructor() {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL não configurada');
    }
    
    this.pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    const client = await this.pool.connect();
    try {
      // Criar tabelas
      await client.query(`
        CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT DEFAULT 'idle',
          capabilities JSONB DEFAULT '[]',
          total_tasks INTEGER DEFAULT 0,
          last_active TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          agent_id TEXT,
          priority INTEGER DEFAULT 2,
          status TEXT DEFAULT 'backlog',
          kanban_column TEXT DEFAULT 'backlog',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS opportunities (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          impact TEXT,
          effort TEXT,
          priority INTEGER DEFAULT 2,
          status TEXT DEFAULT 'open',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          agent_id TEXT,
          metadata JSONB DEFAULT '{}',
          timestamp TIMESTAMP DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS timesheet (
          id TEXT PRIMARY KEY,
          agent_id TEXT NOT NULL,
          date DATE NOT NULL,
          hour_slot INTEGER NOT NULL,
          activity_type TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Inserir agentes padrão se não existirem
      const defaultAgents = [
        { id: 'ceo_orchestrator', name: 'CEO Orchestrator', role: 'orchestrator', capabilities: ['prioritization'] },
        { id: 'bash_architect', name: 'Bash Architect', role: 'developer', capabilities: ['shell'] },
        { id: 'deploy_engineer', name: 'Deploy Engineer', role: 'devops', capabilities: ['deploy'] },
        { id: 'ui_guardian', name: 'UI Guardian', role: 'designer', capabilities: ['ui'] },
        { id: 'data_analyst', name: 'Data Analyst', role: 'analyst', capabilities: ['data'] },
        { id: 'night_watch', name: 'Night Watch', role: 'monitor', capabilities: ['monitoring'] },
        { id: 'shopify_specialist', name: 'Shopify Specialist', role: 'ecommerce', capabilities: ['shopify'] },
        { id: 'copywriter', name: 'Copywriter', role: 'content', capabilities: ['copy'] }
      ];

      for (const agent of defaultAgents) {
        await client.query(`
          INSERT INTO agents (id, name, role, capabilities)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO NOTHING
        `, [agent.id, agent.name, agent.role, JSON.stringify(agent.capabilities)]);
      }

      this.initialized = true;
      console.log('✅ PostgreSQL inicializado');
    } finally {
      client.release();
    }
  }

  // Agents
  async getAgents() {
    await this.init();
    const result = await this.pool.query('SELECT * FROM agents ORDER BY name');
    return result.rows.map(row => ({
      ...row,
      capabilities: row.capabilities || []
    }));
  }

  async updateAgent(id, updates) {
    await this.init();
    const fields = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(updates);
    await this.pool.query(`UPDATE agents SET ${fields} WHERE id = $1`, [id, ...values]);
  }

  // Tasks
  async getTasks(filters = {}) {
    await this.init();
    let query = 'SELECT * FROM tasks';
    const params = [];
    
    if (filters.status) {
      query += ' WHERE status = $1';
      params.push(filters.status);
    }
    
    query += ' ORDER BY priority, created_at';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async createTask(task) {
    await this.init();
    await this.pool.query(`
      INSERT INTO tasks (id, title, description, agent_id, priority, status, kanban_column)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        updated_at = NOW()
    `, [task.id, task.title, task.description, task.agent_id, task.priority, task.status, task.kanban_column]);
  }

  async updateTask(id, updates) {
    await this.init();
    const fields = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(updates);
    await this.pool.query(`UPDATE tasks SET ${fields}, updated_at = NOW() WHERE id = $1`, [id, ...values]);
  }

  // Opportunities
  async getOpportunities() {
    await this.init();
    const result = await this.pool.query('SELECT * FROM opportunities ORDER BY priority, created_at DESC');
    return result.rows;
  }

  async createOpportunity(opp) {
    await this.init();
    await this.pool.query(`
      INSERT INTO opportunities (id, title, description, impact, effort, priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `, [opp.id, opp.title, opp.description, opp.impact, opp.effort, opp.priority]);
  }

  // Events
  async getEvents(limit = 100) {
    await this.init();
    const result = await this.pool.query(
      'SELECT * FROM events ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );
    return result.rows.map(row => ({
      ...row,
      metadata: row.metadata || {}
    }));
  }

  async createEvent(event) {
    await this.init();
    await this.pool.query(`
      INSERT INTO events (id, type, message, agent_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [event.id, event.type, event.message, event.agent_id, JSON.stringify(event.metadata || {})]);
  }

  // Timesheet
  async getTimesheet(date) {
    await this.init();
    const result = await this.pool.query(
      'SELECT * FROM timesheet WHERE date = $1',
      [date]
    );
    return result.rows;
  }

  async logActivity(agentId, date, hourSlot, activityType, description) {
    await this.init();
    const id = `${agentId}_${date}_${hourSlot}`;
    await this.pool.query(`
      INSERT INTO timesheet (id, agent_id, date, hour_slot, activity_type, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        activity_type = EXCLUDED.activity_type,
        description = EXCLUDED.description
    `, [id, agentId, date, hourSlot, activityType, description]);
  }

  // Stats
  async getStats() {
    await this.init();
    const [agents, tasks, opportunities] = await Promise.all([
      this.pool.query('SELECT COUNT(*) FROM agents'),
      this.pool.query('SELECT COUNT(*) FROM tasks'),
      this.pool.query('SELECT COUNT(*) FROM opportunities')
    ]);
    
    return {
      agents: { count: parseInt(agents.rows[0].count) },
      tasks: { count: parseInt(tasks.rows[0].count) },
      opportunities: { count: parseInt(opportunities.rows[0].count) }
    };
  }
}

export const db = new PostgresDB();
export default db;
