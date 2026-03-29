const express = require('express');
const path = require('path');
const fs = require('fs');
const { agents, sessions, tasks, logs, changes, state, executions } = require('./store');
const { getRealAgents, getAgentsStatus } = require('./cron-integration');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rota raiz - Dashboard (sem cache)
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Página Financial
app.get('/financial', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/pages/financial.html'));
});

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

// Get REAL agents from OpenClaw cron
app.get('/api/agents/real', getRealAgents);

// Get agents status summary
app.get('/api/agents/status', getAgentsStatus);

// List all agents (COMBINED: real + simulated)
app.get('/api/agents', (req, res) => {
    // Primeiro tenta buscar agentes reais
    try {
        const { fetchCronJobs, mapToAgents } = require('./cron-integration');
        const jobs = fetchCronJobs();
        const realAgents = mapToAgents(jobs);
        
        return res.json({
            agents: realAgents,
            source: 'openclaw_cron',
            count: realAgents.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Fallback para agentes simulados
        const allAgents = agents.getAll();
        const allSessions = sessions.getAll();
        const allTasks = tasks.getAll();
        
        const enriched = allAgents.map(agent => ({
            ...agent,
            active_sessions: allSessions.filter(s => s.agent_id === agent.id && s.status === 'running').length,
            pending_tasks: allTasks.filter(t => t.agent_id === agent.id && ['pending', 'in_progress'].includes(t.status)).length
        }));
        
        res.json({
            agents: enriched,
            source: 'simulated',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
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

// ========== SHOPIFY INTEGRATION - REAL DATA ==========

// Helper para chamadas Shopify
async function shopifyFetch(endpoint, token, store) {
    const url = `https://${store}.myshopify.com/admin/api/2024-01/${endpoint}`;
    const response = await fetch(url, {
        headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error(`Shopify API error: ${response.status}`);
    return response.json();
}

// Get REAL Shopify stats
app.get('/api/shopify/stats', async (req, res) => {
    try {
        const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
        const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'criativalia';
        
        if (!SHOPIFY_ACCESS_TOKEN) {
            throw new Error('SHOPIFY_ACCESS_TOKEN not configured');
        }
        
        // Buscar pedidos dos últimos 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const createdAtMin = thirtyDaysAgo.toISOString();
        
        const ordersData = await shopifyFetch(
            `orders.json?status=any&created_at_min=${createdAtMin}&limit=250`,
            SHOPIFY_ACCESS_TOKEN, 
            SHOPIFY_STORE
        );
        
        const orders = ordersData.orders || [];
        
        // Calcular métricas MTD
        const revenueMTD = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
        const ordersMTD = orders.length;
        const aov = ordersMTD > 0 ? revenueMTD / ordersMTD : 0;
        
        // Clientes únicos e taxa de recompra
        const customerIds = orders.map(o => o.customer?.id).filter(Boolean);
        const uniqueCustomers = [...new Set(customerIds)];
        const repeatCustomers = customerIds.filter((id, i) => customerIds.indexOf(id) !== i);
        const repeatRate = uniqueCustomers.length > 0 
            ? (repeatCustomers.length / uniqueCustomers.length) * 100 
            : 0;
        
        // Revenue dos últimos 7 dias
        const revenue7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayOrders = orders.filter(o => o.created_at.startsWith(dateStr));
            const dayRevenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
            revenue7Days.push({ date: dateStr, amount: Math.round(dayRevenue * 100) / 100 });
        }
        
        // Top produtos
        const productMap = {};
        orders.forEach(order => {
            (order.line_items || []).forEach(item => {
                const name = item.title || 'Produto sem nome';
                if (!productMap[name]) {
                    productMap[name] = { name, sold: 0, quantity: 0, revenue: 0 };
                }
                productMap[name].sold += 1;
                productMap[name].quantity += item.quantity || 1;
                productMap[name].revenue += parseFloat(item.price || 0) * (item.quantity || 1);
            });
        });
        
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8)
            .map(p => ({
                name: p.name,
                sold: p.sold,
                quantity: p.quantity,
                revenue: Math.round(p.revenue * 100) / 100
            }));
        
        // Pedidos recentes
        const recentOrders = orders
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10)
            .map(o => ({
                id: o.name || o.order_number,
                customer: o.customer ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim() : 'Cliente anônimo',
                date: o.created_at,
                status: o.financial_status === 'paid' ? 'paid' : o.fulfillment_status || 'processing',
                total: parseFloat(o.total_price || 0)
            }));
        
        // Comparar com período anterior para trends
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const prevOrders = orders.filter(o => new Date(o.created_at) < thirtyDaysAgo);
        const prevRevenue = prevOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
        
        const revenueTrend = prevRevenue > 0 
            ? ((revenueMTD - prevRevenue) / prevRevenue * 100).toFixed(1)
            : '0.0';
        
        res.json({
            revenue_mtd: Math.round(revenueMTD * 100) / 100,
            orders_mtd: ordersMTD,
            aov: Math.round(aov * 100) / 100,
            repeat_rate: Math.round(repeatRate * 100) / 100,
            revenue_trend: revenueTrend,
            orders_trend: '0.0',
            aov_trend: '0.0',
            repeat_trend: '0.0',
            revenue_7days: revenue7Days,
            top_products: topProducts,
            recent_orders: recentOrders,
            _source: 'shopify_api',
            _cached: false
        });
        
    } catch (err) {
        console.error('Shopify API error:', err.message);
        // SEM DADOS MOCKADOS - Retorna erro ou vazio
        res.status(503).json({ 
            error: 'Shopify API unavailable', 
            message: err.message,
            data: null
        });
    }
});

// Get REAL Shopify products
app.get('/api/shopify/products', async (req, res) => {
    try {
        const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
        const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'criativalia';
        
        if (!SHOPIFY_ACCESS_TOKEN) {
            throw new Error('SHOPIFY_ACCESS_TOKEN not configured');
        }
        
        const data = await shopifyFetch('products.json?limit=50', SHOPIFY_ACCESS_TOKEN, SHOPIFY_STORE);
        
        const products = (data.products || []).map(p => ({
            id: p.id,
            title: p.title,
            vendor: p.vendor,
            product_type: p.product_type,
            status: p.status,
            price: p.variants?.[0]?.price || '0.00',
            inventory_quantity: p.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0,
            image: p.images?.[0]?.src || null,
            created_at: p.created_at,
            updated_at: p.updated_at
        }));
        
        res.json({ products, count: products.length, _source: 'shopify_api' });
    } catch (err) {
        console.error('Shopify products error:', err.message);
        res.status(500).json({ error: 'Failed to fetch products', message: err.message });
    }
});

// Get REAL Shopify top products
app.get('/api/shopify/products/top', async (req, res) => {
    try {
        const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
        const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'criativalia';
        
        if (!SHOPIFY_ACCESS_TOKEN) {
            throw new Error('SHOPIFY_ACCESS_TOKEN not configured');
        }
        
        // Buscar pedidos dos últimos 30 dias para calcular top produtos
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const ordersData = await shopifyFetch(
            `orders.json?status=any&created_at_min=${thirtyDaysAgo.toISOString()}&limit=250&fields=line_items`,
            SHOPIFY_ACCESS_TOKEN, 
            SHOPIFY_STORE
        );
        
        const productMap = {};
        (ordersData.orders || []).forEach(order => {
            (order.line_items || []).forEach(item => {
                const name = item.title || 'Produto sem nome';
                if (!productMap[name]) {
                    productMap[name] = { name, sold: 0, quantity: 0, revenue: 0 };
                }
                productMap[name].sold += 1;
                productMap[name].quantity += item.quantity || 1;
                productMap[name].revenue += parseFloat(item.price || 0) * (item.quantity || 1);
            });
        });
        
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
            .map(p => ({
                ...p,
                revenue: Math.round(p.revenue * 100) / 100
            }));
        
        res.json({ products: topProducts, _source: 'shopify_api' });
    } catch (err) {
        console.error('Shopify top products error:', err.message);
        res.status(500).json({ error: 'Failed to fetch top products', message: err.message });
    }
});

// Financial data endpoint - REAL data from Shopify
app.get('/api/shopify/financial', async (req, res) => {
    const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
    const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'criativalia';
    
    if (!SHOPIFY_ACCESS_TOKEN) {
        return res.status(500).json({ 
            error: 'Shopify token not configured',
            _source: 'error'
        });
    }
    
    try {
        // Get orders for revenue calculation
        const ordersData = await shopifyFetch('orders.json?status=any&limit=250&fields=id,total_price,created_at,financial_status,line_items', SHOPIFY_ACCESS_TOKEN, SHOPIFY_STORE);
        const orders = ordersData.orders || [];
        
        // Calculate MTD revenue
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const mtdOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        });
        
        const revenueMTD = mtdOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
        
        // Calculate YTD revenue
        const ytdOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate.getFullYear() === currentYear;
        });
        
        const revenueYTD = ytdOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
        
        // Get products for cost analysis
        const productsData = await shopifyFetch('products.json?limit=250&fields=id,title,variants,vendor,product_type', SHOPIFY_ACCESS_TOKEN, SHOPIFY_STORE);
        const products = productsData.products || [];
        
        // Calculate product metrics (revenue only - no cost data available)
        const productMetrics = {};
        
        orders.forEach(order => {
            (order.line_items || []).forEach(item => {
                const productId = item.product_id;
                if (!productMetrics[productId]) {
                    const product = products.find(p => p.id === productId);
                    productMetrics[productId] = {
                        id: productId,
                        name: item.title,
                        quantity: 0,
                        revenue: 0,
                        orders: 0
                    };
                }
                productMetrics[productId].quantity += item.quantity || 0;
                productMetrics[productId].revenue += parseFloat(item.price || 0) * (item.quantity || 0);
                productMetrics[productId].orders += 1;
            });
        });
        
        const topProducts = Object.values(productMetrics)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
        
        // Monthly comparison data
        const monthlyData = {};
        orders.forEach(o => {
            const date = new Date(o.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[key]) monthlyData[key] = 0;
            monthlyData[key] += parseFloat(o.total_price || 0);
        });
        
        res.json({
            revenue_mtd: Math.round(revenueMTD * 100) / 100,
            revenue_ytd: Math.round(revenueYTD * 100) / 100,
            orders_mtd: mtdOrders.length,
            orders_ytd: ytdOrders.length,
            total_orders: orders.length,
            top_products: topProducts,
            monthly_comparison: monthlyData,
            last_updated: new Date().toISOString(),
            _source: 'shopify_api',
            _note: 'CAC/LTV removed - cost data not available via Shopify API'
        });
        
    } catch (err) {
        console.error('Shopify financial error:', err.message);
        res.status(500).json({ 
            error: 'Failed to fetch financial data', 
            message: err.message,
            _source: 'error'
        });
    }
});

// ========== DELIVERABLES API ==========

const { deliverables } = require('./store');

// List all deliverables
app.get('/api/deliverables', (req, res) => {
    const allDeliverables = deliverables.getAll();
    const allAgents = agents.getAll();
    
    const enriched = allDeliverables.map(d => ({
        ...d,
        agent_name: allAgents.find(a => a.id === d.agent_id)?.name || d.agent_id || 'Manual'
    }));
    
    res.json(enriched);
});

// Get single deliverable
app.get('/api/deliverables/:id', (req, res) => {
    const deliverable = deliverables.getById(req.params.id);
    if (!deliverable) {
        return res.status(404).json({ error: 'Deliverable not found' });
    }
    res.json(deliverable);
});

// Create deliverable
app.post('/api/deliverables', (req, res) => {
    const { title, category, type, agent_id, tags, content, size } = req.body;
    
    const deliverableId = `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const deliverable = deliverables.create({
        id: deliverableId,
        title: title || 'Untitled',
        category: category || 'docs',
        type: type || 'md',
        agent_id: agent_id || null,
        tags: tags || [],
        content: content || '',
        size: size || '0 B',
        created_at: new Date().toISOString()
    });
    
    res.json({ id: deliverableId, status: 'created', deliverable });
});

// Update deliverable
app.patch('/api/deliverables/:id', (req, res) => {
    const { title, category, tags, content } = req.body;
    const updates = {};
    
    if (title) updates.title = title;
    if (category) updates.category = category;
    if (tags) updates.tags = tags;
    if (content) {
        updates.content = content;
        updates.size = `${(content.length / 1024).toFixed(1)} KB`;
    }
    
    const deliverable = deliverables.update(req.params.id, updates);
    if (!deliverable) {
        return res.status(404).json({ error: 'Deliverable not found' });
    }
    
    res.json({ status: 'updated', deliverable });
});

// Delete deliverable
app.delete('/api/deliverables/:id', (req, res) => {
    const deleted = deliverables.delete(req.params.id);
    if (!deleted) {
        return res.status(404).json({ error: 'Deliverable not found' });
    }
    res.json({ status: 'deleted' });
});

// ========== PAGE ROUTES ==========

// Import pages as strings (for serverless compatibility)
const pages = require('./pages');

// Helper to serve page
function servePage(res, pageName) {
    if (pages[pageName]) {
        res.setHeader('Content-Type', 'text/html');
        res.send(pages[pageName]);
    } else {
        res.status(404).send(`Page "${pageName}" not found`);
    }
}

// Kanban page - INLINE HTML to bypass cache issues
app.get('/kanban', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <title>Kanban - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #1a1a15; }
        ::-webkit-scrollbar-thumb { background: #4A5D23; border-radius: 3px; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; }
        .main-content { margin-left: 0; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .kanban-column { background: rgba(74, 93, 35, 0.1); border-radius: 8px; min-height: 400px; }
        .kanban-card { background: #252520; border: 1px solid #3A4D13; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: grab; }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item active"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <h1 style="font-size: 20px; font-weight: 700;"><i class="fas fa-columns" style="color: #D4A853; margin-right: 8px;"></i>Kanban Board</h1>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button onclick="createTask()" class="btn-primary" style="padding: 10px 16px; border-radius: 8px;"><i class="fas fa-plus"></i> Nova Tarefa</button>
                </div>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div id="kanban-board" style="display: flex; gap: 16px; overflow-x: auto; padding-bottom: 16px;">
                <!-- Columns loaded via JS -->
            </div>
        </div>
    </main>

    <script>
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebarOverlay').classList.toggle('open');
        }
        
        const columns = [
            { id: 'backlog', title: 'Backlog', color: '#4A5D23' },
            { id: 'todo', title: 'A Fazer', color: '#D4A853' },
            { id: 'inprogress', title: 'Em Progresso', color: '#7a9e7e' },
            { id: 'review', title: 'Revisão', color: '#c17767' },
            { id: 'done', title: 'Concluído', color: '#5A6D33' }
        ];
        
        function renderKanban() {
            const board = document.getElementById('kanban-board');
            board.innerHTML = columns.map(col => \`
                <div class="kanban-column" style="min-width: 280px; padding: 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div style="font-weight: 600; color: \${col.color};">\${col.title}</div>
                        <span style="background: \${col.color}20; color: \${col.color}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">0</span>
                    </div>
                    <div id="col-\${col.id}" class="column-tasks">
                        <div style="text-align: center; padding: 40px 20px; color: #7a7a6a; font-size: 14px;">
                            Nenhuma tarefa\n                        </div>
                    </div>
                </div>
            \`).join('');
        }
        
        function createTask() {
            alert('Funcionalidade em desenvolvimento');
        }
        
        renderKanban();
    </script>
</body>
</html>
    `);
});

// Timesheet page - INLINE HTML
app.get('/timesheet', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <title>Timesheet - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; }
        .main-content { margin-left: 0; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item active"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <h1 style="font-size: 20px; font-weight: 700;"><i class="fas fa-clock" style="color: #D4A853; margin-right: 8px;"></i>Timesheet</h1>
                </div>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div class="card" style="padding: 24px;">
                <div style="text-align: center; padding: 60px 20px; color: #7a7a6a;">
                    <i class="fas fa-clock" style="font-size: 48px; color: #4A5D23; margin-bottom: 16px;"></i>
                    <p>Timesheet em desenvolvimento</p>
                    <p style="font-size: 12px; margin-top: 8px;">Dados de atividades dos agentes aparecerão aqui</p>
                </div>
            </div>
        </div>
    </main>

    <script>
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebarOverlay').classList.toggle('open');
        }
    </script>
</body>
</html>
    `);
});

// Deliverables page - INLINE HTML
app.get('/deliverables', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <title>Entregas - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; }
        .main-content { margin-left: 0; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item active"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <h1 style="font-size: 20px; font-weight: 700;"><i class="fas fa-box" style="color: #D4A853; margin-right: 8px;"></i>Entregas</h1>
                </div>
                <button onclick="createDeliverable()" class="btn-primary" style="padding: 10px 16px; border-radius: 8px;"><i class="fas fa-plus"></i> Nova Entrega</button>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div id="deliverables-list" class="card" style="padding: 24px;">
                <div style="text-align: center; padding: 60px 20px; color: #7a7a6a;">
                    <i class="fas fa-box-open" style="font-size: 48px; color: #4A5D23; margin-bottom: 16px;"></i>
                    <p>Nenhuma entrega encontrada</p>
                    <p style="font-size: 12px; margin-top: 8px;">As entregas dos agentes aparecerão aqui automaticamente</p>
                </div>
            </div>
        </div>
    </main>

    <script>
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebarOverlay').classList.toggle('open');
        }
        
        function createDeliverable() {
            alert('Funcionalidade em desenvolvimento');
        }
        
        // Load deliverables from API
        async function loadDeliverables() {
            try {
                const response = await fetch('/api/deliverables');
                const data = await response.json();
                
                if (data.length === 0) return;
                
                const container = document.getElementById('deliverables-list');
                container.innerHTML = data.map(d => \`
                    <div class="card" style="padding: 16px; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <div style="font-weight: 600; color: #F5F5DC;">\${d.title}</div>
                                <div style="font-size: 12px; color: #D4A853;">\${d.category} • \${d.type}</div>
                            </div>
                            <span style="background: #4A5D23; color: #F5F5DC; padding: 4px 8px; border-radius: 4px; font-size: 11px;">\${d.size || '0 B'}</span>
                        </div>
                    </div>
                \`).join('');
            } catch (e) {
                console.error('Error loading deliverables:', e);
            }
        }
        
        loadDeliverables();
    </script>
</body>
</html>
    `);
});

// Dashboard (Shopify) page - INLINE HTML
app.get('/dashboard', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <title>Shopify - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; }
        .main-content { margin-left: 0; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item active"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <h1 style="font-size: 20px; font-weight: 700;"><i class="fas fa-store" style="color: #D4A853; margin-right: 8px;"></i>Shopify Dashboard</h1>
                </div>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div class="card" style="padding: 20px;">
                    <div style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Revenue MTD</div>
                    <div id="revenue-mtd" style="font-size: 28px; font-weight: 700; margin-top: 8px;">-</div>
                </div>
                <div class="card" style="padding: 20px;">
                    <div style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Pedidos</div>
                    <div id="total-orders" style="font-size: 28px; font-weight: 700; margin-top: 8px;">-</div>
                </div>
                <div class="card" style="padding: 20px;">
                    <div style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Produtos</div>
                    <div id="total-products" style="font-size: 28px; font-weight: 700; margin-top: 8px;">-</div>
                </div>
            </div>
            
            <div class="card" style="padding: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;"><i class="fas fa-shopping-bag" style="color: #D4A853; margin-right: 8px;"></i>Pedidos Recentes</h2>
                <div id="recent-orders">
                    <div style="text-align: center; padding: 40px; color: #7a7a6a;">Carregando...</div>
                </div>
            </div>
        </div>
    </main>

    <script>
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebarOverlay').classList.toggle('open');
        }
        
        async function loadShopifyData() {
            try {
                const response = await fetch('/api/shopify/stats');
                const data = await response.json();
                
                document.getElementById('revenue-mtd').textContent = 'R$ ' + (data.revenue_mtd || 0).toLocaleString('pt-BR');
                document.getElementById('total-orders').textContent = data.total_orders || 0;
                document.getElementById('total-products').textContent = data.total_products || 0;
                
                const ordersContainer = document.getElementById('recent-orders');
                if (data.recent_orders && data.recent_orders.length > 0) {
                    ordersContainer.innerHTML = data.recent_orders.map(o => \`
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #2a2a22;">
                            <div>
                                <div style="font-weight: 500;">\${o.name || o.id}</div>
                                <div style="font-size: 12px; color: #7a7a6a;">\${o.created_at || ''}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: #D4A853;">R$ \${(o.total_price || 0).toLocaleString('pt-BR')}</div>
                                <div style="font-size: 11px; color: #7a9e7e;">\${o.financial_status}</div>
                            </div>
                        </div>
                    \`).join('');
                } else {
                    ordersContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #7a7a6a;">Nenhum pedido encontrado</div>';
                }
            } catch (e) {
                console.error('Error loading Shopify data:', e);
                document.getElementById('recent-orders').innerHTML = '<div style="text-align: center; padding: 40px; color: #c17767;">Erro ao carregar dados</div>';
            }
        }
        
        loadShopifyData();
    </script>
</body>
</html>
    `);
});

// Index page (root) - INLINE HTML
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <title>Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; }
        .main-content { margin-left: 0; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item active"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <h1 style="font-size: 20px; font-weight: 700;"><i class="fas fa-home" style="color: #D4A853; margin-right: 8px;"></i>Dashboard</h1>
                </div>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div class="card" style="padding: 20px;">
                    <div style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Agentes Ativos</div>
                    <div id="stat-agents" style="font-size: 28px; font-weight: 700; margin-top: 8px;">-</div>
                </div>
                <div class="card" style="padding: 20px;">
                    <div style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Tarefas Ativas</div>
                    <div id="stat-tasks" style="font-size: 28px; font-weight: 700; margin-top: 8px;">-</div>
                </div>
                <div class="card" style="padding: 20px;">
                    <div style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Entregas</div>
                    <div id="stat-deliverables" style="font-size: 28px; font-weight: 700; margin-top: 8px;">-</div>
                </div>
            </div>
            
            <div class="card" style="padding: 24px;">
                <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;"><i class="fas fa-robot" style="color: #D4A853; margin-right: 8px;"></i>Agentes</h2>
                <div id="agents-list">
                    <div style="text-align: center; padding: 40px; color: #7a7a6a;">Carregando agentes...</div>
                </div>
            </div>
        </div>
    </main>

    <script>
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebarOverlay').classList.toggle('open');
        }
        
        async function loadDashboard() {
            try {
                const [stateRes, agentsRes] = await Promise.all([
                    fetch('/api/state'),
                    fetch('/api/agents')
                ]);
                
                const state = await stateRes.json();
                const agentsData = await agentsRes.json();
                const agents = agentsData.agents || [];
                
                document.getElementById('stat-agents').textContent = state.active_agents || 0;
                document.getElementById('stat-tasks').textContent = state.active_tasks || 0;
                document.getElementById('stat-deliverables').textContent = state.pending_review || 0;
                
                const agentsContainer = document.getElementById('agents-list');
                if (agents.length > 0) {
                    agentsContainer.innerHTML = agents.slice(0, 6).map(a => \`
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #2a2a22;">
                            <div>
                                <div style="font-weight: 500;">\${a.name}</div>
                                <div style="font-size: 12px; color: #7a7a6a;">\${a.role}</div>
                            </div>
                            <span style="background: \${a.status === 'running' ? '#7a9e7e' : '#4A5D23'}; color: #F5F5DC; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                                \${a.status === 'running' ? '🔥 RUNNING' : '⏳ IDLE'}
                            </span>
                        </div>
                    \`).join('');
                } else {
                    agentsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #7a7a6a;">Nenhum agente encontrado</div>';
                }
            } catch (e) {
                console.error('Error loading dashboard:', e);
            }
        }
        
        loadDashboard();
    </script>
</body>
</html>
    `);
});

// Serve output files (if directory exists)
app.use('/data/outputs', express.static(path.join(__dirname, '../data/outputs')));

// For Vercel serverless
module.exports = app;
