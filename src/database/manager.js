import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../data/runtime.db');

class DatabaseManager {
  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  // Agents
  getAgents() {
    return this.db.prepare('SELECT * FROM agents ORDER BY name').all();
  }

  getAgent(id) {
    return this.db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  }

  updateAgentStatus(id, status) {
    return this.db.prepare(
      'UPDATE agents SET status = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(status, id);
  }

  // Tasks
  createTask(task) {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, title, description, agent_id, project_id, priority, status, kanban_column, source, metadata)
      VALUES (@id, @title, @description, @agent_id, @project_id, @priority, @status, @kanban_column, @source, @metadata)
    `);
    return stmt.run(task);
  }

  getTasks(filters = {}) {
    let sql = 'SELECT * FROM tasks';
    const params = [];
    const conditions = [];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters.agent_id) {
      conditions.push('agent_id = ?');
      params.push(filters.agent_id);
    }
    if (filters.priority !== undefined) {
      conditions.push('priority = ?');
      params.push(filters.priority);
    }
    if (filters.kanban_column) {
      conditions.push('kanban_column = ?');
      params.push(filters.kanban_column);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY priority ASC, created_at DESC';
    return this.db.prepare(sql).all(...params);
  }

  updateTask(id, updates) {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    return this.db.prepare(`UPDATE tasks SET ${fields} WHERE id = ?`).run(...values, id);
  }

  moveTaskKanban(id, column) {
    return this.db.prepare(
      'UPDATE tasks SET kanban_column = ?, status = ? WHERE id = ?'
    ).run(column, column === 'done' ? 'done' : 'in_progress', id);
  }

  // Events / Logging
  logEvent(event) {
    const stmt = this.db.prepare(`
      INSERT INTO events (type, agent_id, task_id, project_id, message, severity, metadata)
      VALUES (@type, @agent_id, @task_id, @project_id, @message, @severity, @metadata)
    `);
    return stmt.run({
      type: event.type,
      agent_id: event.agent_id || null,
      task_id: event.task_id || null,
      project_id: event.project_id || null,
      message: event.message,
      severity: event.severity || 'info',
      metadata: event.metadata ? JSON.stringify(event.metadata) : null
    });
  }

  getEvents(limit = 100, filters = {}) {
    let sql = 'SELECT * FROM events';
    const params = [];
    
    if (filters.type) {
      sql += ' WHERE type = ?';
      params.push(filters.type);
    }
    if (filters.agent_id) {
      sql += params.length ? ' AND' : ' WHERE';
      sql += ' agent_id = ?';
      params.push(filters.agent_id);
    }
    
    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);
    
    return this.db.prepare(sql).all(...params);
  }

  // Timesheet
  logTimesheet(entry) {
    const stmt = this.db.prepare(`
      INSERT INTO timesheet (agent_id, task_id, hour_slot, date, activity_type, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      entry.agent_id,
      entry.task_id || null,
      entry.hour_slot,
      entry.date,
      entry.activity_type,
      entry.description
    );
  }

  getTimesheet(date, agent_id = null) {
    let sql = 'SELECT * FROM timesheet WHERE date = ?';
    const params = [date];
    
    if (agent_id) {
      sql += ' AND agent_id = ?';
      params.push(agent_id);
    }
    
    sql += ' ORDER BY hour_slot';
    return this.db.prepare(sql).all(...params);
  }

  getLast24Hours() {
    return this.db.prepare(`
      SELECT * FROM timesheet 
      WHERE date >= date('now', '-1 day')
      ORDER BY date DESC, hour_slot DESC
    `).all();
  }

  // Opportunities
  createOpportunity(opp) {
    const stmt = this.db.prepare(`
      INSERT INTO opportunities (id, agent_id, title, description, area, impact_score, effort_score, evidence)
      VALUES (@id, @agent_id, @title, @description, @area, @impact_score, @effort_score, @evidence)
    `);
    return stmt.run(opp);
  }

  getOpportunities(status = 'open') {
    return this.db.prepare(
      'SELECT * FROM opportunities WHERE status = ? ORDER BY impact_score DESC'
    ).all(status);
  }

  convertOpportunityToTask(oppId, taskId) {
    return this.db.prepare(
      'UPDATE opportunities SET status = "converted", converted_to_task_id = ? WHERE id = ?'
    ).run(taskId, oppId);
  }

  // Decisions
  createDecision(decision) {
    const stmt = this.db.prepare(`
      INSERT INTO decisions (id, title, description, context, options, recommendation, urgency)
      VALUES (@id, @title, @description, @context, @options, @recommendation, @urgency)
    `);
    return stmt.run({
      ...decision,
      context: JSON.stringify(decision.context),
      options: JSON.stringify(decision.options)
    });
  }

  getPendingDecisions() {
    return this.db.prepare(
      'SELECT * FROM decisions WHERE status = "pending" ORDER BY urgency ASC, created_at DESC'
    ).all();
  }

  // Stats
  getStats() {
    const stats = {};
    
    stats.agents = this.db.prepare('SELECT COUNT(*) as count FROM agents').get();
    stats.agents_active = this.db.prepare('SELECT COUNT(*) as count FROM agents WHERE status = "running"').get();
    
    stats.tasks = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get();
    stats.tasks_done = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = "done"').get();
    stats.tasks_in_progress = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = "in_progress"').get();
    
    stats.events_24h = this.db.prepare(
      'SELECT COUNT(*) as count FROM events WHERE timestamp > datetime("now", "-24 hours")'
    ).get();
    
    stats.opportunities = this.db.prepare(
      'SELECT COUNT(*) as count FROM opportunities WHERE status = "open"'
    ).get();
    
    stats.decisions_pending = this.db.prepare(
      'SELECT COUNT(*) as count FROM decisions WHERE status = "pending"'
    ).get();
    
    return stats;
  }

  close() {
    this.db.close();
  }
}

export const db = new DatabaseManager();
export default db;
