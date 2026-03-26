import express from 'express';
import { orchestrator } from '../orchestrator/runtime.js';
import { randomUUID } from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const getDB = () => globalThis.runtimeDB;

// APIs básicas
app.get('/api/stats', (req, res) => {
  res.json({ runtime: orchestrator.getState(), database: getDB().getStats() });
});
app.get('/api/agents', (req, res) => res.json(getDB().getAgents()));
app.get('/api/tasks', (req, res) => res.json(getDB().getTasks()));
app.get('/api/kanban', (req, res) => {
  const db = getDB();
  res.json({
    backlog: db.getTasks({ kanban_column: 'backlog' }),
    todo: db.getTasks({ kanban_column: 'todo' }),
    in_progress: db.getTasks({ kanban_column: 'in_progress' }),
    review: db.getTasks({ kanban_column: 'review' }),
    done: db.getTasks({ kanban_column: 'done' })
  });
});
app.get('/api/opportunities', (req, res) => res.json(getDB().getOpportunities()));

// UI básica
app.get('/', (req, res) => {
  res.send('<!DOCTYPE html><html><head><title>Criativalia Runtime</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-900 text-white p-8"><h1>🚀 Criativalia Runtime - ONLINE</h1><p>Status: Funcionando</p><a href="/api/stats" class="text-blue-400">Ver Stats</a></body></html>');
});

app.listen(PORT, () => console.log('Server on port ' + PORT));
