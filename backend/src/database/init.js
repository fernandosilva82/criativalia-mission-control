import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const DB_PATH = join(DATA_DIR, 'runtime.db');

// Ensure data directory exists
try {
  mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {
  // Directory already exists
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
const SCHEMA = `
-- Agents registry
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'error', 'paused')),
  capabilities TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME,
  total_tasks INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0
);

-- Tasks / Backlog
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  agent_id TEXT,
  project_id TEXT,
  priority INTEGER DEFAULT 1 CHECK (priority IN (0, 1, 2)), -- 0=P0, 1=P1, 2=P2
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done', 'blocked')),
  kanban_column TEXT DEFAULT 'backlog' CHECK (kanban_column IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
  estimated_hours REAL,
  actual_hours REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  source TEXT, -- 'manual', 'opportunity_engine', 'agent_generated'
  metadata TEXT, -- JSON
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  priority INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  target_date DATETIME,
  completed_at DATETIME,
  metadata TEXT -- JSON
);

-- Events / Activity Log
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('agent_start', 'agent_complete', 'agent_error', 'task_create', 'task_update', 'task_complete', 'decision', 'deploy', 'system', 'opportunity')),
  agent_id TEXT,
  task_id TEXT,
  project_id TEXT,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  metadata TEXT, -- JSON
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Decisions requiring human input
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  context TEXT, -- JSON
  options TEXT, -- JSON array
  recommendation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
  decided_by TEXT,
  decided_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deadline DATETIME,
  urgency INTEGER DEFAULT 1 -- 0=urgent, 1=normal, 2=low
);

-- Deploys
CREATE TABLE IF NOT EXISTS deploys (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  version TEXT,
  environment TEXT CHECK (environment IN ('preview', 'production')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'deploying', 'success', 'failed', 'rolled_back')),
  url TEXT,
  logs TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  metadata TEXT -- JSON
);

-- Scripts / Code artifacts
CREATE TABLE IF NOT EXISTS scripts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('setup', 'deploy', 'healthcheck', 'diagnostic', 'utility')),
  content TEXT,
  path TEXT,
  version TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  metadata TEXT -- JSON
);

-- Timesheet / Hour-by-hour activity
CREATE TABLE IF NOT EXISTS timesheet (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT,
  task_id TEXT,
  hour_slot INTEGER CHECK (hour_slot >= 0 AND hour_slot <= 23),
  date DATE,
  activity_type TEXT CHECK (activity_type IN ('idle', 'working', 'meeting', 'research', 'deploy', 'error', 'maintenance')),
  description TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Opportunities (auto-generated backlog items)
CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  area TEXT, -- 'shopify', 'marketing', 'design', 'code', 'data'
  impact_score REAL, -- 0-10
  effort_score REAL, -- 0-10
  confidence REAL, -- 0-1
  converted_to_task_id TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'converted', 'rejected', 'stale')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  evidence TEXT, -- JSON: metrics, screenshots, etc.
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (converted_to_task_id) REFERENCES tasks(id)
);

-- Night mode sessions
CREATE TABLE IF NOT EXISTS night_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  tasks_completed INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  opportunities_found INTEGER DEFAULT 0,
  summary TEXT,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'interrupted'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_timesheet_date ON timesheet(date);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
`;

// Execute schema
db.exec(SCHEMA);

console.log('✅ Database initialized at:', DB_PATH);
console.log('📊 Tables created:', [
  'agents', 'tasks', 'projects', 'events', 
  'decisions', 'deploys', 'scripts', 'timesheet',
  'opportunities', 'night_sessions'
].join(', '));

// Insert default agents
const DEFAULT_AGENTS = [
  { id: 'ceo_orchestrator', name: 'CEO Orchestrator', role: 'orchestrator', capabilities: JSON.stringify(['prioritization', 'planning', 'coordination']) },
  { id: 'bash_architect', name: 'Bash Architect', role: 'developer', capabilities: JSON.stringify(['shell', 'automation', 'scripts']) },
  { id: 'deploy_engineer', name: 'Deploy Engineer', role: 'devops', capabilities: JSON.stringify(['deploy', 'vercel', 'github', 'ci/cd']) },
  { id: 'ui_guardian', name: 'UI Guardian', role: 'designer', capabilities: JSON.stringify(['ui', 'ux', 'review', 'css']) },
  { id: 'data_analyst', name: 'Data Analyst', role: 'analyst', capabilities: JSON.stringify(['data', 'shopify', 'metrics', 'reports']) },
  { id: 'night_watch', name: 'Night Watch', role: 'monitor', capabilities: JSON.stringify(['monitoring', 'patrol', 'alerts']) },
  { id: 'shopify_specialist', name: 'Shopify Specialist', role: 'ecommerce', capabilities: JSON.stringify(['shopify', 'products', 'orders', 'inventory']) },
  { id: 'copywriter', name: 'Copywriter', role: 'content', capabilities: JSON.stringify(['copy', 'ads', 'email', 'seo']) }
];

const insertAgent = db.prepare(`
  INSERT OR IGNORE INTO agents (id, name, role, capabilities)
  VALUES (@id, @name, @role, @capabilities)
`);

for (const agent of DEFAULT_AGENTS) {
  insertAgent.run(agent);
}

console.log('🤖 Default agents registered:', DEFAULT_AGENTS.length);

db.close();
console.log('✅ Database ready');
