import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = process.env.DATA_DIR || '/root/.openclaw/workspace/criativalia-runtime/data';
const DB_PATH = join(DATA_DIR, 'runtime.db');

// Ensure data directory exists
mkdirSync(DATA_DIR, { recursive: true });

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema
const SCHEMA = `
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL,
  status TEXT DEFAULT 'idle', capabilities TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_active DATETIME,
  total_tasks INTEGER DEFAULT 0, success_rate REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
  agent_id TEXT, project_id TEXT, priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'backlog', kanban_column TEXT DEFAULT 'backlog',
  estimated_hours REAL, actual_hours REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME, completed_at DATETIME,
  source TEXT, metadata TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL,
  agent_id TEXT, task_id TEXT, project_id TEXT, message TEXT NOT NULL,
  severity TEXT DEFAULT 'info', metadata TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timesheet (
  id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id TEXT, task_id TEXT,
  hour_slot INTEGER, date DATE, activity_type TEXT, description TEXT
);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, title TEXT NOT NULL,
  description TEXT, area TEXT, impact_score REAL, effort_score REAL,
  confidence REAL, converted_to_task_id TEXT, status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, expires_at DATETIME, evidence TEXT
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
  context TEXT, options TEXT, recommendation TEXT, status TEXT DEFAULT 'pending',
  decided_by TEXT, decided_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deadline DATETIME, urgency INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS night_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME, tasks_completed INTEGER DEFAULT 0, tasks_created INTEGER DEFAULT 0,
  opportunities_found INTEGER DEFAULT 0, summary TEXT, status TEXT DEFAULT 'running'
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_timesheet_date ON timesheet(date);
`;

db.exec(SCHEMA);

// Default agents
const DEFAULT_AGENTS = [
  ['ceo_orchestrator', 'CEO Orchestrator', 'orchestrator', JSON.stringify(['prioritization'])],
  ['bash_architect', 'Bash Architect', 'developer', JSON.stringify(['shell'])],
  ['deploy_engineer', 'Deploy Engineer', 'devops', JSON.stringify(['deploy'])],
  ['ui_guardian', 'UI Guardian', 'designer', JSON.stringify(['ui'])],
  ['data_analyst', 'Data Analyst', 'analyst', JSON.stringify(['data'])],
  ['night_watch', 'Night Watch', 'monitor', JSON.stringify(['monitoring'])],
  ['shopify_specialist', 'Shopify Specialist', 'ecommerce', JSON.stringify(['shopify'])],
  ['copywriter', 'Copywriter', 'content', JSON.stringify(['copy'])]
];

const insert = db.prepare('INSERT OR IGNORE INTO agents (id, name, role, capabilities) VALUES (?, ?, ?, ?)');
for (const agent of DEFAULT_AGENTS) insert.run(agent);

console.log('✅ SQLite database ready at:', DB_PATH);
db.close();
