/**
 * Database Configuration
 * Uses SQLite for persistent storage (server mode)
 */

import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = process.env.DATA_DIR || '/data';
const DB_PATH = join(DATA_DIR, 'runtime.db');

// Ensure data directory exists
try {
  mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {}

class SQLiteManager {
  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initSchema();
    this.seedData();
  }

  initSchema() {
    const SCHEMA = `
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL,
        status TEXT DEFAULT 'idle', capabilities TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_active DATETIME,
        total_tasks INTEGER DEFAULT 0, success_rate REAL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
        agent_id TEXT, priority INTEGER DEFAULT 1, status TEXT DEFAULT 'backlog',
        kanban_column TEXT DEFAULT 'backlog', created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME, completed_at DATETIME, metadata TEXT
      );
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, agent_id TEXT, task_id TEXT,
        message TEXT, severity TEXT DEFAULT 'info', metadata TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS timesheet (
        id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id TEXT, task_id TEXT,
        hour_slot INTEGER, date DATE, activity_type TEXT, description TEXT
      );
      CREATE TABLE IF NOT EXISTS opportunities (
        id TEXT PRIMARY KEY, agent_id TEXT, title TEXT, description TEXT,
        area TEXT, impact_score REAL, effort_score REAL, status TEXT DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, evidence TEXT
      );
      CREATE TABLE IF NOT EXISTS decisions (
        id TEXT PRIMARY KEY, title TEXT, description TEXT, options TEXT,
        recommendation TEXT, status TEXT DEFAULT 'pending', urgency INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    `;
    this.db.exec(SCHEMA);
  }

  seedData() {
    const agents = [
      ['ceo_orchestrator', 'CEO Orchestrator', 'orchestrator', JSON.stringify(['prioritization'])],
      ['bash_architect', 'Bash Architect', 'developer', JSON.stringify(['shell', 'automation'])],
      ['deploy_engineer', 'Deploy Engineer', 'devops', JSON.stringify(['deploy', 'ci/cd'])],
      ['ui_guardian', 'UI Guardian', 'designer', JSON.stringify(['ui', 'ux'])],
      ['data_analyst', 'Data Analyst', 'analyst', JSON.stringify(['data', 'reports'])],
      ['night_watch', 'Night Watch', 'monitor', JSON.stringify(['monitoring', 'alerts'])],
      ['shopify_specialist', 'Shopify Specialist', 'ecommerce', JSON.stringify(['shopify', 'orders'])],
      ['copywriter', 'Copywriter', 'content', JSON.stringify(['copy', 'ads'])]
    ];
    const stmt = this.db.prepare('INSERT OR IGNORE INTO agents (id, name, role, capabilities) VALUES (?, ?, ?, ?)');
    for (const a of agents) stmt.run(a);
  }

  getAgents() { return this.db.prepare('SELECT * FROM agents').all(); }
  getAgent(id) { return this.db.prepare('SELECT * FROM agents WHERE id = ?').get(id); }
  updateAgentStatus(id, status) {
    this.db.prepare('UPDATE agents SET status = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  }

  createTask(task) {
    this.db.prepare(`INSERT INTO tasks (id, title, description, agent_id, priority, status, kanban_column, metadata)
      VALUES (@id, @title, @description, @agent_id, @priority, @status, @kanban_column, @metadata)`).run(task);
  }

  getTasks(filters = {}) {
    let sql = 'SELECT * FROM tasks';
    const params = [];
    const conds = [];
    if (filters.status) { conds.push('status = ?'); params.push(filters.status); }
    if (filters.agent_id) { conds.push('agent_id = ?'); params.push(filters.agent_id); }
    if (filters.kanban_column) { conds.push('kanban_column = ?'); params.push(filters.kanban_column); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY priority, created_at DESC';
    return this.db.prepare(sql).all(...params);
  }

  updateTask(id, updates) {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    this.db.prepare(`UPDATE tasks SET ${fields} WHERE id = ?`).run(...Object.values(updates), id);
  }

  moveTaskKanban(id, column) {
    this.db.prepare('UPDATE tasks SET kanban_column = ?, status = ? WHERE id = ?')
      .run(column, column === 'done' ? 'done' : 'in_progress', id);
  }

  logEvent(event) {
    this.db.prepare(`INSERT INTO events (type, agent_id, task_id, message, severity, metadata)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      event.type, event.agent_id || null, event.task_id || null,
      event.message, event.severity || 'info', event.metadata ? JSON.stringify(event.metadata) : null
    );
  }

  getEvents(limit = 100) {
    return this.db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT ?').all(limit);
  }

  logTimesheet(entry) {
    this.db.prepare(`INSERT INTO timesheet (agent_id, task_id, hour_slot, date, activity_type, description)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      entry.agent_id, entry.task_id || null, entry.hour_slot, entry.date, entry.activity_type, entry.description
    );
  }

  getTimesheet(date, agent_id = null) {
    if (agent_id) {
      return this.db.prepare('SELECT * FROM timesheet WHERE date = ? AND agent_id = ? ORDER BY hour_slot').all(date, agent_id);
    }
    return this.db.prepare('SELECT * FROM timesheet WHERE date = ? ORDER BY hour_slot').all(date);
  }

  getLast24Hours() {
    return this.db.prepare(`SELECT * FROM timesheet WHERE date >= date('now', '-1 day') ORDER BY date, hour_slot`).all();
  }

  getOpportunities(status = 'open') {
    return this.db.prepare('SELECT * FROM opportunities WHERE status = ? ORDER BY impact_score DESC').all(status);
  }

  createOpportunity(opp) {
    this.db.prepare(`INSERT INTO opportunities (id, agent_id, title, description, area, impact_score, effort_score, evidence, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      opp.id,
      opp.agent_id,
      opp.title,
      opp.description || null,
      opp.area || null,
      opp.impact_score || 0,
      opp.effort_score || 0,
      opp.evidence ? JSON.stringify(opp.evidence) : null,
      opp.status || 'open',
      opp.created_at || new Date().toISOString()
    );
  }

  getPendingDecisions() {
    return this.db.prepare('SELECT * FROM decisions WHERE status = "pending" ORDER BY urgency, created_at DESC').all();
  }

  createDecision(decision) {
    this.db.prepare(`INSERT INTO decisions (id, title, description, options, recommendation, urgency)
      VALUES (@id, @title, @description, @options, @recommendation, @urgency)`).run({
      ...decision,
      options: JSON.stringify(decision.options)
    });
  }

  getStats() {
    const agents = this.db.prepare('SELECT COUNT(*) as count FROM agents').get();
    const agents_active = this.db.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'running'").get();
    const tasks = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get();
    const tasks_done = this.db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'").get();
    const tasks_in_progress = this.db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'").get();
    const opportunities = this.db.prepare("SELECT COUNT(*) as count FROM opportunities WHERE status = 'open'").get();
    const decisions_pending = this.db.prepare("SELECT COUNT(*) as count FROM decisions WHERE status = 'pending'").get();
    
    return {
      agents: { count: agents ? agents.count : 0 },
      agents_active: { count: agents_active ? agents_active.count : 0 },
      tasks: { count: tasks ? tasks.count : 0 },
      tasks_done: { count: tasks_done ? tasks_done.count : 0 },
      tasks_in_progress: { count: tasks_in_progress ? tasks_in_progress.count : 0 },
      events_24h: { count: 0 },
      opportunities: { count: opportunities ? opportunities.count : 0 },
      decisions_pending: { count: decisions_pending ? decisions_pending.count : 0 }
    };
  }

  close() { this.db.close(); }
}

export const db = new SQLiteManager();
export default db;
