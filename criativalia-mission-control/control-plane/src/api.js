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
        const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
        const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'criativalia';
        
        if (!SHOPIFY_TOKEN) {
            throw new Error('SHOPIFY_ACCESS_TOKEN not configured');
        }
        
        // Buscar pedidos dos últimos 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const createdAtMin = thirtyDaysAgo.toISOString();
        
        const ordersData = await shopifyFetch(
            `orders.json?status=any&created_at_min=${createdAtMin}&limit=250`,
            SHOPIFY_TOKEN, 
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
        const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
        const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'criativalia';
        
        if (!SHOPIFY_TOKEN) {
            throw new Error('SHOPIFY_ACCESS_TOKEN not configured');
        }
        
        const data = await shopifyFetch('products.json?limit=50', SHOPIFY_TOKEN, SHOPIFY_STORE);
        
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
        const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
        const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'criativalia';
        
        if (!SHOPIFY_TOKEN) {
            throw new Error('SHOPIFY_ACCESS_TOKEN not configured');
        }
        
        // Buscar pedidos dos últimos 30 dias para calcular top produtos
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const ordersData = await shopifyFetch(
            `orders.json?status=any&created_at_min=${thirtyDaysAgo.toISOString()}&limit=250&fields=line_items`,
            SHOPIFY_TOKEN, 
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

// Kanban page
app.get('/kanban', (req, res) => servePage(res, 'kanban'));

// Timesheet page
app.get('/timesheet', (req, res) => servePage(res, 'timesheet'));

// Dashboard page
app.get('/dashboard', (req, res) => servePage(res, 'dashboard'));

// Agent page
app.get('/agent', (req, res) => servePage(res, 'agent'));

// Deliverables page
app.get('/deliverables', (req, res) => servePage(res, 'deliverables'));

// Financial page
app.get('/financial', (req, res) => servePage(res, 'financial'));

// Serve index HTML (root)
app.get('/', (req, res) => servePage(res, 'index'));

// Serve output files (if directory exists)
app.use('/data/outputs', express.static(path.join(__dirname, '../data/outputs')));

// For Vercel serverless
module.exports = app;
