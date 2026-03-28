const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const { agents, sessions, tasks, logs, changes, state } = require('./store');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ========== API ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Runtime state
app.get('/api/state', (req, res) => {
    const currentState = state.getById('runtime') || {};
    const allAgents = agents.getAll();
    const allSessions = sessions.getAll();
    const allTasks = tasks.getAll();
    
    res.json({
        ...currentState,
        active_agents: allAgents.filter(a => a.status === 'running').length,
        active_sessions: allSessions.filter(s => s.status === 'running').length,
        active_tasks: allTasks.filter(t => ['pending', 'in_progress'].includes(t.status)).length,
        total_agents: allAgents.length,
        total_tasks: allTasks.length,
        pending_review: changes.getAll().filter(c => !c.reviewed).length
    });
});

// List all agents
app.get('/api/agents', (req, res) => {
    const allAgents = agents.getAll();
    const allSessions = sessions.getAll();
    const allTasks = tasks.getAll();
    
    const enriched = allAgents.map(agent => ({
        ...agent,
        active_sessions: allSessions.filter(s => s.agent_id === agent.id && s.status === 'running').length,
        pending_tasks: allTasks.filter(t => t.agent_id === agent.id && ['pending', 'in_progress'].includes(t.status)).length
    }));
    
    res.json(enriched);
});

// Get single agent
app.get('/api/agents/:id', (req, res) => {
    const agent = agents.getById(req.params.id);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    
    const agentSessions = sessions.getAll().filter(s => s.agent_id === req.params.id);
    const agentTasks = tasks.getAll().filter(t => t.agent_id === req.params.id);
    
    res.json({
        ...agent,
        sessions: agentSessions.slice(0, 10),
        tasks: agentTasks.slice(0, 10)
    });
});

// Create session for agent
app.post('/api/agents/:id/sessions', (req, res) => {
    const agent = agents.getById(req.params.id);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    
    const { workspace_path, task_id } = req.body;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session = sessions.create({
        id: sessionId,
        agent_id: req.params.id,
        workspace_path: workspace_path || `workspaces/${req.params.id}_${Date.now()}`,
        status: 'running',
        pid: null,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
    });
    
    // Update agent status
    agents.update(req.params.id, { status: 'running' });
    
    // If task_id provided, link it
    if (task_id) {
        tasks.update(task_id, { session_id: sessionId, status: 'in_progress' });
    }
    
    // Log
    logs.create({
        id: `log_${Date.now()}`,
        session_id: sessionId,
        agent_id: req.params.id,
        level: 'info',
        message: `Session started: ${sessionId}`,
        created_at: new Date().toISOString()
    });
    
    res.json({ id: sessionId, status: 'running' });
});

// Stop session
app.post('/api/sessions/:id/stop', (req, res) => {
    const session = sessions.getById(req.params.id);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    sessions.update(req.params.id, { 
        status: 'completed', 
        completed_at: new Date().toISOString() 
    });
    
    // Update agent status if no more running sessions
    const runningSessions = sessions.getAll().filter(s => 
        s.agent_id === session.agent_id && s.status === 'running'
    );
    if (runningSessions.length === 0) {
        agents.update(session.agent_id, { status: 'idle' });
    }
    
    // Log
    logs.create({
        id: `log_${Date.now()}`,
        session_id: req.params.id,
        agent_id: session.agent_id,
        level: 'info',
        message: `Session stopped: ${req.params.id}`,
        created_at: new Date().toISOString()
    });
    
    res.json({ status: 'stopped' });
});

// List tasks
app.get('/api/tasks', (req, res) => {
    const allTasks = tasks.getAll();
    const allAgents = agents.getAll();
    
    const enriched = allTasks.map(task => ({
        ...task,
        agent_name: allAgents.find(a => a.id === task.agent_id)?.name || 'Unknown'
    }));
    
    res.json(enriched);
});

// Create task
app.post('/api/tasks', (req, res) => {
    const { agent_id, title, description, priority, context, deliverables } = req.body;
    
    const agent = agents.getById(agent_id);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task = tasks.create({
        id: taskId,
        agent_id,
        title,
        description: description || '',
        priority: priority || 5,
        status: 'pending',
        context: context || {},
        deliverables: deliverables || [],
        created_at: new Date().toISOString()
    });
    
    // Log
    logs.create({
        id: `log_${Date.now()}`,
        agent_id,
        task_id: taskId,
        level: 'info',
        message: `Task created: ${title}`,
        created_at: new Date().toISOString()
    });
    
    res.json({ id: taskId, status: 'created' });
});

// Update task status
app.patch('/api/tasks/:id', (req, res) => {
    const { status, started_at, completed_at } = req.body;
    const updates = {};
    
    if (status) updates.status = status;
    if (started_at) updates.started_at = started_at;
    if (completed_at) updates.completed_at = completed_at;
    
    const task = tasks.update(req.params.id, updates);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ status: 'updated', task });
});

// Mark task for review
app.post('/api/tasks/:id/review', (req, res) => {
    const task = tasks.update(req.params.id, { status: 'review' });
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ status: 'marked_for_review' });
});

// Get logs
app.get('/api/logs', (req, res) => {
    const { session_id, agent_id, limit = 50 } = req.query;
    let allLogs = logs.getAll();
    
    if (session_id) {
        allLogs = allLogs.filter(l => l.session_id === session_id);
    }
    if (agent_id) {
        allLogs = allLogs.filter(l => l.agent_id === agent_id);
    }
    
    allLogs = allLogs.slice(-parseInt(limit));
    res.json(allLogs);
});

// Add log entry
app.post('/api/logs', (req, res) => {
    const { session_id, agent_id, task_id, level, message, metadata } = req.body;
    
    const logEntry = logs.create({
        id: `log_${Date.now()}`,
        session_id: session_id || null,
        agent_id: agent_id || null,
        task_id: task_id || null,
        level: level || 'info',
        message,
        metadata: metadata || {},
        created_at: new Date().toISOString()
    });
    
    res.json({ status: 'logged', id: logEntry.id });
});

// Get changes for review
app.get('/api/changes', (req, res) => {
    const { session_id, reviewed } = req.query;
    let allChanges = changes.getAll();
    
    if (session_id) {
        allChanges = allChanges.filter(c => c.session_id === session_id);
    }
    if (reviewed !== undefined) {
        allChanges = allChanges.filter(c => c.reviewed === (reviewed === '1' || reviewed === 'true'));
    }
    
    res.json(allChanges);
});

// Create change record
app.post('/api/changes', (req, res) => {
    const { session_id, task_id, file_path, change_type, diff } = req.body;
    
    const change = changes.create({
        id: `change_${Date.now()}`,
        session_id,
        task_id: task_id || null,
        file_path,
        change_type: change_type || 'modified',
        diff: diff || '',
        reviewed: false,
        approved: null,
        created_at: new Date().toISOString()
    });
    
    res.json({ status: 'created', id: change.id });
});

// Review change (approve/reject)
app.post('/api/changes/:id/review', (req, res) => {
    const { approved } = req.body;
    
    const change = changes.update(req.params.id, { 
        reviewed: true, 
        approved: approved === true || approved === 'true',
        reviewed_at: new Date().toISOString()
    });
    
    if (!change) {
        return res.status(404).json({ error: 'Change not found' });
    }
    
    res.json({ status: 'reviewed', approved: change.approved });
});

// Shopify Routes - Proxy to Render backend
const SHOPIFY_BACKEND = 'https://criativalia-runtime.onrender.com';

app.get('/api/shopify/stats', async (req, res) => {
    try {
        const response = await fetch(`${SHOPIFY_BACKEND}/api/shopify/stats`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch Shopify stats', details: err.message });
    }
});

app.get('/api/shopify/products', async (req, res) => {
    try {
        const response = await fetch(`${SHOPIFY_BACKEND}/api/shopify/products`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products', details: err.message });
    }
});

app.get('/api/shopify/products/top', async (req, res) => {
    try {
        const response = await fetch(`${SHOPIFY_BACKEND}/api/shopify/products/top`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch top products', details: err.message });
    }
});

app.get('/api/shopify/orders', async (req, res) => {
    try {
        const response = await fetch(`${SHOPIFY_BACKEND}/api/shopify/orders`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
    }
});

// Kanban and Dashboard pages
app.get('/kanban', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/kanban.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Serve dashboard HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// For Vercel serverless
module.exports = app;
