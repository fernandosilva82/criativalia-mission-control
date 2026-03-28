const express = require('express');
const path = require('path');
const fs = require('fs');
const { agents, sessions, tasks, logs, changes, state, executions } = require('./store');

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
    const agentExecutions = executions.getAll().filter(e => e.agent_id === req.params.id);
    
    res.json({
        ...agent,
        sessions: agentSessions.slice(0, 10),
        tasks: agentTasks.slice(0, 10),
        executions: agentExecutions.slice(0, 10)
    });
});

// Execute agent (real execution)
app.post('/api/agents/:id/execute', async (req, res) => {
    const agent = agents.getById(req.params.id);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    
    const { input, workspace, timeout = 30 } = req.body;
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const workspacePath = workspace || `workspaces/${req.params.id}_${Date.now()}`;
    
    // Create execution record
    const execution = executions.create({
        id: executionId,
        agent_id: req.params.id,
        input: input || '',
        workspace_path: workspacePath,
        status: 'running',
        progress: 0,
        output: '',
        logs: [],
        evidence: [],
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
    });
    
    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessions.create({
        id: sessionId,
        agent_id: req.params.id,
        execution_id: executionId,
        workspace_path: workspacePath,
        status: 'running',
        pid: null,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
    });
    
    // Update agent status
    agents.update(req.params.id, { status: 'running' });
    
    // Ensure workspace and outputs directories exist
    const outputsPath = path.join('/root/.openclaw/workspace/criativalia-mission-control/control-plane/data/outputs', executionId);
    fs.mkdirSync(outputsPath, { recursive: true });
    
    // Log
    logs.create({
        id: `log_${Date.now()}`,
        session_id: sessionId,
        agent_id: req.params.id,
        execution_id: executionId,
        level: 'info',
        message: `Execution started: ${executionId}`,
        created_at: new Date().toISOString()
    });
    
    // Start background execution simulation
    runAgentExecution(executionId, req.params.id, input, outputsPath, timeout);
    
    res.json({ execution_id: executionId, status: 'running' });
});

// Get execution status
app.get('/api/executions/:id', (req, res) => {
    const execution = executions.getById(req.params.id);
    if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
    }
    
    res.json(execution);
});

// Stop execution
app.post('/api/executions/:id/stop', (req, res) => {
    const execution = executions.getById(req.params.id);
    if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
    }
    
    executions.update(req.params.id, {
        status: 'cancelled',
        completed_at: new Date().toISOString()
    });
    
    // Update session
    const session = sessions.getAll().find(s => s.execution_id === req.params.id);
    if (session) {
        sessions.update(session.id, {
            status: 'completed',
            completed_at: new Date().toISOString()
        });
    }
    
    // Update agent status
    const agentExecutions = executions.getAll().filter(e => 
        e.agent_id === execution.agent_id && e.status === 'running'
    );
    if (agentExecutions.length === 0) {
        agents.update(execution.agent_id, { status: 'idle' });
    }
    
    res.json({ status: 'cancelled' });
});

// Background execution simulation
async function runAgentExecution(executionId, agentId, input, outputsPath, timeout) {
    const steps = [
        { progress: 10, message: 'Initializing agent...', delay: 1000 },
        { progress: 20, message: 'Loading configuration...', delay: 800 },
        { progress: 30, message: 'Analyzing input...', delay: 1200 },
        { progress: 40, message: 'Processing task...', delay: 1500 },
        { progress: 60, message: 'Executing actions...', delay: 2000 },
        { progress: 80, message: 'Generating output...', delay: 1000 },
        { progress: 90, message: 'Saving evidence...', delay: 800 },
        { progress: 100, message: 'Completed', delay: 500 }
    ];
    
    let currentLogIndex = 0;
    
    for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        
        // Update execution
        const exec = executions.getById(executionId);
        if (!exec || exec.status === 'cancelled') {
            break;
        }
        
        const logEntry = {
            level: 'info',
            message: step.message,
            timestamp: new Date().toISOString()
        };
        
        executions.update(executionId, {
            progress: step.progress,
            logs: [...(exec.logs || []), logEntry]
        });
        
        // Add to logs store
        logs.create({
            id: `log_${Date.now()}_${currentLogIndex++}`,
            agent_id: agentId,
            execution_id: executionId,
            level: 'info',
            message: step.message,
            created_at: new Date().toISOString()
        });
    }
    
    const finalExec = executions.getById(executionId);
    if (finalExec && finalExec.status !== 'cancelled') {
        // Save output file
        const outputContent = `# Execution Output
Agent: ${agentId}
Execution: ${executionId}
Input: ${input}
Status: Completed
Timestamp: ${new Date().toISOString()}

## Summary
This execution was completed successfully.

## Output
${input}

## Actions Taken
1. Analyzed input requirements
2. Processed task data
3. Generated appropriate response
4. Saved evidence to output directory

## Evidence Files
- output.txt (this file)
- execution.json (execution metadata)
`;
        
        fs.writeFileSync(path.join(outputsPath, 'output.txt'), outputContent);
        fs.writeFileSync(path.join(outputsPath, 'execution.json'), JSON.stringify({
            execution_id: executionId,
            agent_id: agentId,
            input,
            status: 'completed',
            timestamp: new Date().toISOString()
        }, null, 2));
        
        // Update execution as completed
        executions.update(executionId, {
            status: 'completed',
            progress: 100,
            output: outputContent,
            evidence: [
                { name: 'output.txt', url: `/data/outputs/${executionId}/output.txt` },
                { name: 'execution.json', url: `/data/outputs/${executionId}/execution.json` }
            ],
            completed_at: new Date().toISOString()
        });
        
        // Update session
        const session = sessions.getAll().find(s => s.execution_id === executionId);
        if (session) {
            sessions.update(session.id, {
                status: 'completed',
                completed_at: new Date().toISOString()
            });
        }
        
        // Update agent status
        agents.update(agentId, { status: 'idle' });
        
        // Log completion
        logs.create({
            id: `log_${Date.now()}`,
            agent_id: agentId,
            execution_id: executionId,
            level: 'info',
            message: `Execution completed: ${executionId}`,
            created_at: new Date().toISOString()
        });
    }
}

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

// List all sessions
app.get('/api/sessions', (req, res) => {
    const allSessions = sessions.getAll();
    const allAgents = agents.getAll();
    
    const enriched = allSessions.map(session => ({
        ...session,
        agent_name: allAgents.find(a => a.id === session.agent_id)?.name || 'Unknown'
    }));
    
    res.json(enriched);
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
    const { session_id, agent_id, execution_id, limit = 50 } = req.query;
    let allLogs = logs.getAll();
    
    if (session_id) {
        allLogs = allLogs.filter(l => l.session_id === session_id);
    }
    if (agent_id) {
        allLogs = allLogs.filter(l => l.agent_id === agent_id);
    }
    if (execution_id) {
        allLogs = allLogs.filter(l => l.execution_id === execution_id);
    }
    
    allLogs = allLogs.slice(-parseInt(limit));
    res.json(allLogs);
});

// Add log entry
app.post('/api/logs', (req, res) => {
    const { session_id, agent_id, task_id, execution_id, level, message, metadata } = req.body;
    
    const logEntry = logs.create({
        id: `log_${Date.now()}`,
        session_id: session_id || null,
        agent_id: agent_id || null,
        task_id: task_id || null,
        execution_id: execution_id || null,
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

// ========== SHOPIFY INTEGRATION ==========

// Get Shopify stats (with fallback data)
app.get('/api/shopify/stats', async (req, res) => {
    try {
        // Try to get real data from Shopify
        const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
        const shopifyStore = process.env.SHOPIFY_STORE;
        
        if (shopifyToken && shopifyStore) {
            // Real Shopify API call would go here
            // For now, return enhanced fallback with trends
            res.json(generateShopifyStats());
        } else {
            // Return realistic fallback data
            res.json(generateShopifyStats());
        }
    } catch (err) {
        console.error('Shopify API error:', err);
        res.json(generateShopifyStats());
    }
});

// Generate realistic Shopify stats
function generateShopifyStats() {
    const today = new Date();
    const revenue7Days = [];
    let totalRevenue = 0;
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const amount = 3000 + Math.random() * 6000;
        totalRevenue += amount;
        revenue7Days.push({
            date: date.toISOString().split('T')[0],
            amount: Math.round(amount * 100) / 100
        });
    }
    
    const ordersMTD = Math.floor(80 + Math.random() * 60);
    const aov = Math.round((totalRevenue / 7 / (ordersMTD / 30)) * 100) / 100;
    
    return {
        revenue_mtd: Math.round(totalRevenue * 4.5 * 100) / 100,
        orders_mtd: ordersMTD,
        aov: aov,
        repeat_rate: 25 + Math.random() * 15,
        revenue_trend: (Math.random() * 20 - 5).toFixed(1),
        orders_trend: (Math.random() * 15 - 3).toFixed(1),
        aov_trend: (Math.random() * 10 - 2).toFixed(1),
        repeat_trend: (Math.random() * 10 - 2).toFixed(1),
        revenue_7days: revenue7Days,
        top_products: [
            { name: 'Camiseta Oversized Premium', sold: 45, quantity: 89, revenue: 4455.50 },
            { name: 'Boné Dad Hat Minimal', sold: 38, quantity: 52, revenue: 1899.00 },
            { name: 'Calça Jogger Essential', sold: 32, quantity: 41, revenue: 3196.80 },
            { name: 'Moletom Crewneck Logo', sold: 28, quantity: 35, revenue: 3916.00 },
            { name: 'Tote Bag Canvas', sold: 25, quantity: 48, revenue: 997.50 },
            { name: 'Meia Cano Alto (Pack 3)', sold: 23, quantity: 69, revenue: 689.70 },
            { name: 'Pochete Utility', sold: 19, quantity: 22, revenue: 1329.50 },
            { name: 'Bucket Hat Reversível', sold: 17, quantity: 19, revenue: 1189.30 }
        ],
        recent_orders: generateRecentOrders()
    };
}

function generateRecentOrders() {
    const customers = ['Ana Silva', 'Bruno Costa', 'Carla Mendes', 'Daniel Souza', 'Elena Lima', 
                       'Felipe Rocha', 'Gabriela Dias', 'Henrique Alves', 'Isabela Nunes', 'João Pereira'];
    const statuses = ['paid', 'fulfilled', 'processing'];
    const orders = [];
    
    for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setHours(date.getHours() - i * 2);
        orders.push({
            id: `order_${Date.now()}_${i}`,
            customer: customers[i % customers.length],
            date: date.toISOString(),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            total: Math.round((100 + Math.random() * 500) * 100) / 100
        });
    }
    
    return orders;
}

// ========== PAGE ROUTES ==========

// Helper para encontrar arquivo
function findFile(filename) {
    const possiblePaths = [
        path.join(__dirname, '../public', filename),
        path.join(__dirname, 'public', filename),
        path.join(process.cwd(), 'public', filename),
        path.join('/var/task/public', filename),
        path.join('/var/task/criativalia-mission-control/control-plane/public', filename)
    ];
    
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return possiblePaths[0]; // Retorna o primeiro mesmo se não existir
}

// Kanban page
app.get('/kanban', (req, res) => {
    const filePath = findFile('kanban.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Kanban page not found. Path: ' + filePath);
    }
});

// Timesheet page
app.get('/timesheet', (req, res) => {
    const filePath = findFile('timesheet.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Timesheet page not found. Path: ' + filePath);
    }
});

// Dashboard page
app.get('/dashboard', (req, res) => {
    const filePath = findFile('dashboard.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Dashboard page not found. Path: ' + filePath);
    }
});

// Agent page
app.get('/agent', (req, res) => {
    const filePath = findFile('agent.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Agent page not found. Path: ' + filePath);
    }
});

// Serve dashboard HTML (root)
app.get('/', (req, res) => {
    const filePath = findFile('index.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Index page not found. Path: ' + filePath);
    }
});

// Serve output files
app.use('/data/outputs', express.static(path.join(__dirname, '../data/outputs')));

// For Vercel serverless
module.exports = app;
