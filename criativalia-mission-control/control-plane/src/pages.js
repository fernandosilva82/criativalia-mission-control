// Auto-generated pages file
module.exports = {
  index: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0a0a0b; color: #fafafa; }
        .card { background: #141414; border: 1px solid #2a2a2a; border-radius: 12px; }
        .btn-primary { background: #c17767; color: white; }
        .btn-primary:hover { background: #d48877; }
        .status-idle { color: #888; }
        .status-running { color: #7a9e7e; }
        .status-error { color: #c17767; }
        .log-debug { color: #888; }
        .log-info { color: #fafafa; }
        .log-warning { color: #d4a373; }
        .log-error { color: #c17767; }
    </style>
</head>
<body class="min-h-screen">
    <!-- Header -->
    <header class="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <i class="fas fa-rocket text-white"></i>
                </div>
                <div>
                    <h1 class="font-bold text-lg">Criativalia Control Plane</h1>
                    <p class="text-xs text-gray-400">Multi-Agent Runtime v1.0</p>
                </div>
            </div>
            <nav class="hidden md:flex items-center gap-1">
                <a href="/kanban" class="px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition">
                    <i class="fas fa-columns mr-1"></i> Kanban
                </a>
                <a href="/timesheet" class="px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition">
                    <i class="fas fa-clock mr-1"></i> Timesheet
                </a>
                <a href="/dashboard" class="px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition">
                    <i class="fas fa-chart-line mr-1"></i> Dashboard
                </a>
                <a href="/deliverables" class="px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition text-orange-400">
                    <i class="fas fa-box mr-1"></i> Entregas
                </a>
            </nav>
            <div class="flex items-center gap-4">
                <div id="runtime-status" class="flex items-center gap-2 text-sm">
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span>Running</span>
                </div>
                <button onclick="refreshData()" class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-6">
        <!-- Stats -->
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="card p-4">
                <div class="text-gray-400 text-xs uppercase tracking-wider mb-1">Active Agents</div>
                <div id="stat-agents" class="text-2xl font-bold">-</div>
            </div>
            <div class="card p-4">
                <div class="text-gray-400 text-xs uppercase tracking-wider mb-1">Active Tasks</div>
                <div id="stat-tasks" class="text-2xl font-bold">-</div>
            </div>
            <div class="card p-4">
                <div class="text-gray-400 text-xs uppercase tracking-wider mb-1">Sessions</div>
                <div id="stat-sessions" class="text-2xl font-bold">-</div>
            </div>
            <div class="card p-4">
                <div class="text-gray-400 text-xs uppercase tracking-wider mb-1">Pending Review</div>
                <div id="stat-review" class="text-2xl font-bold text-orange-400">-</div>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-6">
            <!-- Agents List -->
            <div class="col-span-2">
                <div class="card">
                    <div class="p-4 border-b border-gray-800 flex items-center justify-between">
                        <h2 class="font-semibold flex items-center gap-2">
                            <i class="fas fa-robot text-orange-400"></i>
                            Agents
                        </h2>
                        <button onclick="createTask()" class="btn-primary px-3 py-1.5 rounded-lg text-sm font-medium">
                            <i class="fas fa-plus mr-1"></i> New Task
                        </button>
                    </div>
                    <div id="agents-list" class="divide-y divide-gray-800">
                        <!-- Agents loaded here -->
                    </div>
                </div>

                <!-- Tasks -->
                <div class="card mt-6">
                    <div class="p-4 border-b border-gray-800">
                        <h2 class="font-semibold flex items-center gap-2">
                            <i class="fas fa-tasks text-blue-400"></i>
                            Recent Tasks
                        </h2>
                    </div>
                    <div id="tasks-list" class="divide-y divide-gray-800 max-h-64 overflow-y-auto">
                        <!-- Tasks loaded here -->
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
                <!-- Create Task Form -->
                <div class="card p-4">
                    <h3 class="font-semibold mb-4 flex items-center gap-2">
                        <i class="fas fa-plus-circle text-green-400"></i>
                        Create Task
                    </h3>
                    <form id="task-form" class="space-y-3">
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Agent</label>
                            <select id="task-agent" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                                <option value="">Select agent...</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Title</label>
                            <input type="text" id="task-title" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Task title...">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Description</label>
                            <textarea id="task-desc" rows="3" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Task description..."></textarea>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Priority</label>
                            <input type="range" id="task-priority" min="1" max="10" value="5" class="w-full">
                            <div class="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Low</span>
                                <span id="priority-val">5</span>
                                <span>High</span>
                            </div>
                        </div>
                        <button type="submit" class="w-full btn-primary py-2 rounded-lg text-sm font-medium">
                            Create Task
                        </button>
                    </form>
                </div>

                <!-- Live Logs -->
                <div class="card p-4">
                    <h3 class="font-semibold mb-4 flex items-center gap-2">
                        <i class="fas fa-terminal text-purple-400"></i>
                        Live Logs
                    </h3>
                    <div id="logs-container" class="bg-gray-900 rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs space-y-1">
                        <!-- Logs here -->
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="card p-4">
                    <h3 class="font-semibold mb-3">Quick Actions</h3>
                    <div class="space-y-2">
                        <button onclick="viewChanges()" class="w-full text-left px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-sm flex items-center gap-2">
                            <i class="fas fa-code-branch text-orange-400"></i>
                            Review Changes
                            <span id="changes-badge" class="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full hidden">0</span>
                        </button>
                        <button onclick="startAll()" class="w-full text-left px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-sm flex items-center gap-2">
                            <i class="fas fa-play text-green-400"></i>
                            Start All Idle
                        </button>
                        <button onclick="stopAll()" class="w-full text-left px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-sm flex items-center gap-2">
                            <i class="fas fa-stop text-red-400"></i>
                            Stop All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Agent Detail Modal -->
    <div id="agent-modal" class="fixed inset-0 bg-black/80 backdrop-blur z-50 hidden flex items-center justify-center p-6">
        <div class="card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div class="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 id="modal-title" class="font-bold text-lg">Agent Details</h3>
                <button onclick="closeModal()" class="p-2 hover:bg-gray-800 rounded-lg">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="modal-content" class="p-6 overflow-y-auto">
                <!-- Content -->
            </div>
        </div>
    </div>

    <script>
        // State
        let agents = [];
        let refreshInterval;

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadData();
            refreshInterval = setInterval(loadData, 5000);
            
            // Priority slider
            document.getElementById('task-priority').addEventListener('input', (e) => {
                document.getElementById('priority-val').textContent = e.target.value;
            });

            // Task form
            document.getElementById('task-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await createTaskSubmit();
            });
        });

        async function loadData() {
            try {
                // Load state
                const stateRes = await fetch('/api/state');
                const state = await stateRes.json();
                document.getElementById('stat-agents').textContent = state.active_agents || 0;
                document.getElementById('stat-tasks').textContent = state.active_tasks || 0;
                document.getElementById('stat-sessions').textContent = state.active_sessions || 0;

                // Load agents
                const agentsRes = await fetch('/api/agents');
                agents = await agentsRes.json();
                renderAgents(agents);
                updateAgentSelect(agents);

                // Load tasks
                const tasksRes = await fetch('/api/tasks');
                const tasks = await tasksRes.json();
                renderTasks(tasks);

                // Load changes
                const changesRes = await fetch('/api/changes?reviewed=0');
                const changes = await changesRes.json();
                document.getElementById('stat-review').textContent = changes.length;
                const badge = document.getElementById('changes-badge');
                if (changes.length > 0) {
                    badge.textContent = changes.length;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }

                // Load logs
                const logsRes = await fetch('/api/logs?limit=20');
                const logs = await logsRes.json();
                renderLogs(logs);

            } catch (err) {
                console.error('Error loading data:', err);
                addLog('error', 'Failed to load data: ' + err.message);
            }
        }

        function renderAgents(agents) {
            const container = document.getElementById('agents-list');
            container.innerHTML = agents.map(agent => \`
                <div class="p-4 hover:bg-gray-800/50 transition group">
                    <div class="flex items-start justify-between">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg">
                                \${getAgentIcon(agent.role)}
                            </div>
                            <div>
                                <h3 class="font-medium">\${agent.name}</h3>
                                <p class="text-xs text-gray-400">\${agent.role}</p>
                                <div class="flex items-center gap-3 mt-2 text-xs">
                                    <span class="status-\${agent.status}">
                                        <i class="fas fa-circle text-[8px] mr-1"></i>
                                        \${agent.status}
                                    </span>
                                    \${agent.active_sessions > 0 ? \`<span class="text-blue-400">\${agent.active_sessions} session\${agent.active_sessions > 1 ? 's' : ''}</span>\` : ''}
                                    \${agent.pending_tasks > 0 ? \`<span class="text-orange-400">\${agent.pending_tasks} task\${agent.pending_tasks > 1 ? 's' : ''}</span>\` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                            \${agent.status === 'idle' ? \`
                                <button onclick="startSession('\${agent.id}')" class="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30" title="Start Session">
                                    <i class="fas fa-play"></i>
                                </button>
                            \` : \`
                                <button onclick="stopSession('\${agent.id}')" class="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30" title="Stop Session">
                                    <i class="fas fa-stop"></i>
                                </button>
                            \`}
                            <button onclick="viewAgent('\${agent.id}')" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <a href="/agent?id=\${agent.id}" class="p-2 rounded-lg bg-[#c17767] hover:bg-[#d48877] text-white" title="Open Agent Page">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-1">
                        \${agent.skills.slice(0, 4).map(skill => \`
                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">\${skill}</span>
                        \`).join('')}
                    </div>
                </div>
            \`).join('');
        }

        function renderTasks(tasks) {
            const container = document.getElementById('tasks-list');
            if (tasks.length === 0) {
                container.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">No tasks yet</div>';
                return;
            }
            container.innerHTML = tasks.slice(0, 10).map(task => \`
                <div class="p-3 hover:bg-gray-800/50 transition">
                    <div class="flex items-start justify-between">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-medium px-2 py-0.5 rounded bg-gray-800">P\${task.priority}</span>
                                <h4 class="font-medium text-sm">\${task.title}</h4>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">\${task.agent_name}</p>
                        </div>
                        <span class="text-xs px-2 py-1 rounded-full \${getTaskStatusClass(task.status)}">
                            \${task.status}
                        </span>
                    </div>
                </div>
            \`).join('');
        }

        function renderLogs(logs) {
            const container = document.getElementById('logs-container');
            container.innerHTML = logs.reverse().map(log => \`
                <div class="log-\${log.level} flex items-start gap-2">
                    <span class="text-gray-600">[\${new Date(log.created_at).toLocaleTimeString()}]</span>
                    <span class="uppercase text-[10px] px-1 rounded bg-gray-800">\${log.level}</span>
                    <span>\${log.message}</span>
                </div>
            \`).join('');
            container.scrollTop = container.scrollHeight;
        }

        function updateAgentSelect(agents) {
            const select = document.getElementById('task-agent');
            select.innerHTML = '<option value="">Select agent...</option>' + 
                agents.map(a => \`<option value="\${a.id}">\${a.name}</option>\`).join('');
        }

        function getAgentIcon(role) {
            if (role.includes('CEO')) return '👑';
            if (role.includes('Traffic')) return '📢';
            if (role.includes('Shopify')) return '🛒';
            if (role.includes('Copy')) return '✍️';
            if (role.includes('Design')) return '🎨';
            if (role.includes('Dev')) return '💻';
            if (role.includes('Data')) return '📊';
            if (role.includes('Support')) return '🎧';
            return '🤖';
        }

        function getTaskStatusClass(status) {
            const classes = {
                'pending': 'bg-gray-800 text-gray-400',
                'in_progress': 'bg-blue-900/50 text-blue-400',
                'review': 'bg-orange-900/50 text-orange-400',
                'completed': 'bg-green-900/50 text-green-400',
                'blocked': 'bg-red-900/50 text-red-400'
            };
            return classes[status] || 'bg-gray-800';
        }

        async function startSession(agentId) {
            try {
                const res = await fetch(\`/api/agents/\${agentId}/sessions\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ workspace_path: \`workspaces/\${agentId}_\${Date.now()}\` })
                });
                const data = await res.json();
                addLog('info', \`Started session \${data.id.slice(0, 8)}... for \${agentId}\`);
                loadData();
            } catch (err) {
                addLog('error', 'Failed to start session: ' + err.message);
            }
        }

        async function stopSession(agentId) {
            // Find running session for agent
            try {
                const res = await fetch(\`/api/agents/\${agentId}\`);
                const agent = await res.json();
                if (agent.sessions && agent.sessions.length > 0) {
                    const session = agent.sessions.find(s => s.status === 'running');
                    if (session) {
                        await fetch(\`/api/sessions/\${session.id}/stop\`, { method: 'POST' });
                        addLog('info', \`Stopped session for \${agentId}\`);
                        loadData();
                    }
                }
            } catch (err) {
                addLog('error', 'Failed to stop session: ' + err.message);
            }
        }

        async function createTaskSubmit() {
            const agentId = document.getElementById('task-agent').value;
            const title = document.getElementById('task-title').value;
            const desc = document.getElementById('task-desc').value;
            const priority = document.getElementById('task-priority').value;

            if (!agentId || !title) {
                addLog('warning', 'Please select agent and enter title');
                return;
            }

            try {
                const res = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agent_id: agentId,
                        title: title,
                        description: desc,
                        priority: parseInt(priority),
                        deliverables: ['output']
                    })
                });
                const data = await res.json();
                addLog('info', \`Created task: \${title}\`);
                document.getElementById('task-form').reset();
                loadData();
            } catch (err) {
                addLog('error', 'Failed to create task: ' + err.message);
            }
        }

        function viewAgent(agentId) {
            const agent = agents.find(a => a.id === agentId);
            if (!agent) return;

            document.getElementById('modal-title').textContent = agent.name;
            document.getElementById('modal-content').innerHTML = \`
                <div class="space-y-4">
                    <div>
                        <label class="text-xs text-gray-500 uppercase">Role</label>
                        <p>\${agent.role}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 uppercase">Description</label>
                        <p class="text-gray-300">\${agent.description}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 uppercase">Skills</label>
                        <div class="flex flex-wrap gap-2 mt-1">
                            \${agent.skills.map(s => \`<span class="px-2 py-1 rounded bg-gray-800 text-sm">\${s}</span>\`).join('')}
                        </div>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 uppercase">Configuration</label>
                        <pre class="mt-1 p-3 rounded-lg bg-gray-900 text-xs overflow-x-auto">\${JSON.stringify(agent.config, null, 2)}</pre>
                    </div>
                </div>
            \`;
            document.getElementById('agent-modal').classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('agent-modal').classList.add('hidden');
        }

        function viewChanges() {
            window.open('/api/changes', '_blank');
        }

        function refreshData() {
            loadData();
            addLog('info', 'Manual refresh');
        }

        function addLog(level, message) {
            const container = document.getElementById('logs-container');
            const entry = document.createElement('div');
            entry.className = \`log-\${level}\`;
            entry.innerHTML = \`
                <span class="text-gray-600">[\${new Date().toLocaleTimeString()}]</span>
                <span class="uppercase text-[10px] px-1 rounded bg-gray-800">\${level}</span>
                <span>\${message}</span>
            \`;
            container.appendChild(entry);
            container.scrollTop = container.scrollHeight;
        }

        function startAll() {
            agents.filter(a => a.status === 'idle').forEach(a => startSession(a.id));
        }

        function stopAll() {
            agents.filter(a => a.status === 'running').forEach(a => stopSession(a.id));
        }

        // Close modal on outside click
        document.getElementById('agent-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });
    </script>
</body>
</html>
`,
  dashboard: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shopify Dashboard - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #2a2a2a #0a0a0b; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0b; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        body { font-family: 'Inter', sans-serif; background: #0a0a0b; color: #fafafa; }
        .card { background: #141414; border: 1px solid #2a2a2a; border-radius: 12px; }
        .metric-card { 
            background: linear-gradient(135deg, #141414 0%, #1a1a1b 100%);
            border: 1px solid #2a2a2a; 
            border-radius: 12px;
            position: relative;
            overflow: hidden;
        }
        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #c17767, #d48877);
        }
        .metric-value { 
            background: linear-gradient(135deg, #fafafa 0%, #c17767 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .btn-primary { background: #c17767; color: white; }
        .btn-primary:hover { background: #d48877; }
        .trend-up { color: #7a9e7e; }
        .trend-down { color: #c17767; }
        .product-row:hover { background: rgba(193, 119, 103, 0.1); }
        .chart-container { position: relative; height: 300px; }
    </style>
</head>
<body class="min-h-screen">
    <!-- Header -->
    <header class="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <a href="/" class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center hover:opacity-80 transition">
                    <i class="fas fa-rocket text-white"></i>
                </a>
                <div>
                    <h1 class="font-bold text-lg">Shopify Dashboard</h1>
                    <p class="text-xs text-gray-400">Real-time Store Analytics</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <div id="data-source-indicator" class="mr-2"></div>
                <div class="text-right">
                    <div class="text-xs text-gray-400">Last Updated</div>
                    <div id="last-updated" class="text-sm font-medium">-</div>
                </div>
                <button onclick="refreshDashboard()" class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <a href="/" class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
                    <i class="fas fa-arrow-left"></i>
                </a>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-6">
        <!-- Key Metrics -->
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="metric-card p-5">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-xs uppercase tracking-wider">Receita MTD</span>
                    <i class="fas fa-dollar-sign text-[#c17767]"></i>
                </div>
                <div id="metric-revenue" class="text-3xl font-bold metric-value">-</div>
                <div id="trend-revenue" class="text-xs mt-2 flex items-center gap-1">
                    <i class="fas fa-chart-line"></i>
                    <span>-</span>
                </div>
            </div>
            <div class="metric-card p-5">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-xs uppercase tracking-wider">Pedidos</span>
                    <i class="fas fa-shopping-bag text-blue-400"></i>
                </div>
                <div id="metric-orders" class="text-3xl font-bold metric-value">-</div>
                <div id="trend-orders" class="text-xs mt-2 flex items-center gap-1">
                    <i class="fas fa-chart-line"></i>
                    <span>-</span>
                </div>
            </div>
            <div class="metric-card p-5">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-xs uppercase tracking-wider">Ticket Médio</span>
                    <i class="fas fa-receipt text-green-400"></i>
                </div>
                <div id="metric-aov" class="text-3xl font-bold metric-value">-</div>
                <div id="trend-aov" class="text-xs mt-2 flex items-center gap-1">
                    <i class="fas fa-chart-line"></i>
                    <span>-</span>
                </div>
            </div>
            <div class="metric-card p-5">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-xs uppercase tracking-wider">Taxa Recompra</span>
                    <i class="fas fa-redo text-purple-400"></i>
                </div>
                <div id="metric-repeat" class="text-3xl font-bold metric-value">-</div>
                <div id="trend-repeat" class="text-xs mt-2 flex items-center gap-1">
                    <i class="fas fa-chart-line"></i>
                    <span>-</span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-6">
            <!-- Revenue Chart -->
            <div class="col-span-2 card p-5">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="font-semibold flex items-center gap-2">
                        <i class="fas fa-chart-bar text-[#c17767]"></i>
                        Receita - Últimos 7 Dias
                    </h2>
                    <div class="flex items-center gap-2 text-xs">
                        <span class="flex items-center gap-1">
                            <span class="w-3 h-3 rounded bg-[#c17767]"></span> Receita
                        </span>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>

            <!-- Top Products -->
            <div class="card">
                <div class="p-4 border-b border-gray-800">
                    <h2 class="font-semibold flex items-center gap-2">
                        <i class="fas fa-trophy text-yellow-400"></i>
                        Top Produtos
                    </h2>
                </div>
                <div id="top-products" class="divide-y divide-gray-800 max-h-[340px] overflow-y-auto">
                    <!-- Products loaded here -->
                </div>
            </div>
        </div>

        <!-- Recent Orders -->
        <div class="card mt-6">
            <div class="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 class="font-semibold flex items-center gap-2">
                    <i class="fas fa-list text-blue-400"></i>
                    Pedidos Recentes
                </h2>
                <a href="#" class="text-xs text-[#c17767] hover:underline">Ver todos</a>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-900/50">
                        <tr>
                            <th class="text-left p-3 text-xs font-medium text-gray-400 uppercase">ID</th>
                            <th class="text-left p-3 text-xs font-medium text-gray-400 uppercase">Cliente</th>
                            <th class="text-left p-3 text-xs font-medium text-gray-400 uppercase">Data</th>
                            <th class="text-left p-3 text-xs font-medium text-gray-400 uppercase">Status</th>
                            <th class="text-right p-3 text-xs font-medium text-gray-400 uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody id="recent-orders" class="divide-y divide-gray-800">
                        <!-- Orders loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <script>
        let revenueChart = null;

        document.addEventListener('DOMContentLoaded', () => {
            loadDashboard();
        });

        async function loadDashboard() {
            try {
                const res = await fetch('/api/shopify/stats');
                const data = await res.json();
                
                updateMetrics(data);
                renderChart(data.revenue_7days || []);
                renderTopProducts(data.top_products || []);
                renderRecentOrders(data.recent_orders || []);
                
                // Mostrar indicador de dados reais vs mockados
                const sourceIndicator = document.getElementById('data-source-indicator');
                if (sourceIndicator) {
                    if (data._source === 'shopify_api') {
                        sourceIndicator.innerHTML = '<span class="text-green-400 text-xs flex items-center gap-1"><i class="fas fa-check-circle"></i> Dados Reais Shopify</span>';
                    } else {
                        sourceIndicator.innerHTML = '<span class="text-yellow-400 text-xs flex items-center gap-1"><i class="fas fa-exclamation-triangle"></i> Dados Simulados</span>';
                    }
                }
                
                document.getElementById('last-updated').textContent = new Date().toLocaleTimeString('pt-BR');
            } catch (err) {
                console.error('Error loading dashboard:', err);
                // Fallback data
                loadFallbackData();
            }
        }

        function updateMetrics(data) {
            // Revenue MTD
            const revenue = data.revenue_mtd || 0;
            document.getElementById('metric-revenue').textContent = formatCurrency(revenue);
            updateTrend('trend-revenue', data.revenue_trend);
            
            // Orders
            const orders = data.orders_mtd || 0;
            document.getElementById('metric-orders').textContent = orders.toLocaleString('pt-BR');
            updateTrend('trend-orders', data.orders_trend);
            
            // AOV
            const aov = data.aov || 0;
            document.getElementById('metric-aov').textContent = formatCurrency(aov);
            updateTrend('trend-aov', data.aov_trend);
            
            // Repeat rate
            const repeatRate = data.repeat_rate || 0;
            document.getElementById('metric-repeat').textContent = repeatRate.toFixed(1) + '%';
            updateTrend('trend-repeat', data.repeat_trend);
        }

        function updateTrend(elementId, trend) {
            const el = document.getElementById(elementId);
            if (!trend) {
                el.innerHTML = '<span class="text-gray-500">-</span>';
                return;
            }
            const isUp = trend >= 0;
            const icon = isUp ? 'fa-arrow-up' : 'fa-arrow-down';
            const colorClass = isUp ? 'trend-up' : 'trend-down';
            el.innerHTML = \`<i class="fas \${icon} \${colorClass}"></i><span class="\${colorClass}">\${Math.abs(trend).toFixed(1)}% vs mês anterior</span>\`;
        }

        function renderChart(revenueData) {
            const ctx = document.getElementById('revenueChart').getContext('2d');
            
            const labels = revenueData.map(d => {
                const date = new Date(d.date);
                return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
            });
            const values = revenueData.map(d => d.amount);
            
            if (revenueChart) {
                revenueChart.destroy();
            }
            
            revenueChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Receita',
                        data: values,
                        backgroundColor: 'rgba(193, 119, 103, 0.8)',
                        borderColor: '#c17767',
                        borderWidth: 1,
                        borderRadius: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1a1a1b',
                            titleColor: '#fafafa',
                            bodyColor: '#fafafa',
                            borderColor: '#2a2a2a',
                            borderWidth: 1,
                            callbacks: {
                                label: (context) => formatCurrency(context.raw)
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#1f1f1f' },
                            ticks: {
                                color: '#888',
                                callback: (value) => 'R$ ' + (value / 1000).toFixed(0) + 'k'
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#888' }
                        }
                    }
                }
            });
        }

        function renderTopProducts(products) {
            const container = document.getElementById('top-products');
            if (products.length === 0) {
                container.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">No products data</div>';
                return;
            }
            
            container.innerHTML = products.slice(0, 10).map((product, index) => \`
                <div class="product-row p-3 flex items-center gap-3 transition cursor-pointer">
                    <div class="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-sm \${index < 3 ? 'text-[#c17767]' : 'text-gray-500'}">
                        \${index + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-medium truncate">\${product.name}</h4>
                        <p class="text-xs text-gray-500">\${product.sold} vendas</p>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-medium">\${formatCurrency(product.revenue)}</div>
                        <div class="text-xs text-gray-500">\${product.quantity} unid.</div>
                    </div>
                </div>
            \`).join('');
        }

        function renderRecentOrders(orders) {
            const container = document.getElementById('recent-orders');
            if (orders.length === 0) {
                container.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500 text-sm">No orders</td></tr>';
                return;
            }
            
            container.innerHTML = orders.slice(0, 10).map(order => \`
                <tr class="hover:bg-gray-900/30 transition">
                    <td class="p-3 text-sm font-mono">#\${order.id.slice(-6)}</td>
                    <td class="p-3 text-sm">\${order.customer}</td>
                    <td class="p-3 text-sm text-gray-400">\${new Date(order.date).toLocaleDateString('pt-BR')}</td>
                    <td class="p-3">
                        <span class="text-xs px-2 py-1 rounded-full \${getStatusClass(order.status)}">
                            \${order.status}
                        </span>
                    </td>
                    <td class="p-3 text-sm text-right font-medium">\${formatCurrency(order.total)}</td>
                </tr>
            \`).join('');
        }

        function getStatusClass(status) {
            const classes = {
                'paid': 'bg-green-900/50 text-green-400',
                'pending': 'bg-yellow-900/50 text-yellow-400',
                'processing': 'bg-blue-900/50 text-blue-400',
                'fulfilled': 'bg-purple-900/50 text-purple-400',
                'cancelled': 'bg-red-900/50 text-red-400'
            };
            return classes[status?.toLowerCase()] || 'bg-gray-800 text-gray-400';
        }

        function formatCurrency(value) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value || 0);
        }

        function loadFallbackData() {
            const fallbackData = {
                revenue_mtd: 45678.90,
                orders_mtd: 123,
                aov: 371.37,
                repeat_rate: 32.5,
                revenue_trend: 12.5,
                orders_trend: 8.3,
                aov_trend: 3.7,
                repeat_trend: -2.1,
                revenue_7days: [
                    { date: '2024-03-21', amount: 5234.50 },
                    { date: '2024-03-22', amount: 7891.20 },
                    { date: '2024-03-23', amount: 4567.80 },
                    { date: '2024-03-24', amount: 6234.90 },
                    { date: '2024-03-25', amount: 8912.40 },
                    { date: '2024-03-26', amount: 7234.60 },
                    { date: '2024-03-27', amount: 5423.70 }
                ],
                top_products: [
                    { name: 'Camiseta Oversized', sold: 45, quantity: 89, revenue: 4455.50 },
                    { name: 'Boné Dad Hat', sold: 38, quantity: 52, revenue: 1899.00 },
                    { name: 'Calça Jogger', sold: 32, quantity: 41, revenue: 3196.80 },
                    { name: 'Moletom Essential', sold: 28, quantity: 35, revenue: 3916.00 },
                    { name: 'Tote Bag', sold: 25, quantity: 48, revenue: 997.50 }
                ],
                recent_orders: [
                    { id: 'order_001', customer: 'João Silva', date: '2024-03-27T10:30:00', status: 'paid', total: 234.50 },
                    { id: 'order_002', customer: 'Maria Santos', date: '2024-03-27T09:15:00', status: 'processing', total: 189.90 },
                    { id: 'order_003', customer: 'Pedro Costa', date: '2024-03-26T18:45:00', status: 'fulfilled', total: 567.80 }
                ]
            };
            
            updateMetrics(fallbackData);
            renderChart(fallbackData.revenue_7days);
            renderTopProducts(fallbackData.top_products);
            renderRecentOrders(fallbackData.recent_orders);
        }

        function refreshDashboard() {
            loadDashboard();
        }
    </script>
</body>
</html>
`,
  kanban: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kanban - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #2a2a2a #0a0a0b; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0b; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        body { font-family: 'Inter', sans-serif; background: #0a0a0b; color: #fafafa; }
        .card { background: #141414; border: 1px solid #2a2a2a; border-radius: 12px; }
        .kanban-column { background: #0f0f10; border: 1px solid #1f1f1f; border-radius: 8px; min-width: 280px; max-width: 280px; }
        .kanban-card { background: #1a1a1b; border: 1px solid #2a2a2a; border-radius: 8px; cursor: grab; transition: all 0.2s; }
        .kanban-card:hover { border-color: #3a3a3a; transform: translateY(-2px); }
        .kanban-card.dragging { opacity: 0.5; transform: rotate(2deg); }
        .kanban-column.drag-over { background: #1a1a1b; border-color: #c17767; }
        .btn-primary { background: #c17767; color: white; }
        .btn-primary:hover { background: #d48877; }
        .priority-1, .priority-2 { border-left: 3px solid #7a9e7e; }
        .priority-3, .priority-4, .priority-5 { border-left: 3px solid #d4a373; }
        .priority-6, .priority-7, .priority-8 { border-left: 3px solid #c17767; }
        .priority-9, .priority-10 { border-left: 3px solid #e74c3c; }
        .column-header-inbox { border-top: 3px solid #888; }
        .column-header-opportunity { border-top: 3px solid #9b59b6; }
        .column-header-ready { border-top: 3px solid #3498db; }
        .column-header-progress { border-top: 3px solid #f39c12; }
        .column-header-review { border-top: 3px solid #e67e22; }
        .column-header-deploy { border-top: 3px solid #1abc9c; }
        .column-header-done { border-top: 3px solid #7a9e7e; }
    </style>
</head>
<body class="min-h-screen">
    <!-- Header -->
    <header class="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div class="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <a href="/" class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center hover:opacity-80 transition">
                    <i class="fas fa-rocket text-white"></i>
                </a>
                <div>
                    <h1 class="font-bold text-lg">Kanban Board</h1>
                    <p class="text-xs text-gray-400">Task Management</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2 text-sm text-gray-400">
                    <i class="fas fa-info-circle"></i>
                    <span>Arraste os cards entre as colunas</span>
                </div>
                <button onclick="refreshBoard()" class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <a href="/" class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
                    <i class="fas fa-arrow-left"></i>
                </a>
            </div>
        </div>
    </header>

    <!-- Kanban Board -->
    <main class="p-6 overflow-x-auto">
        <div class="flex gap-4 min-w-max pb-4" id="kanban-board">
            <!-- Columns will be rendered here -->
        </div>
    </main>

    <!-- Task Detail Modal -->
    <div id="task-modal" class="fixed inset-0 bg-black/80 backdrop-blur z-50 hidden flex items-center justify-center p-6">
        <div class="card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div class="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 class="font-bold text-lg">Task Details</h3>
                <button onclick="closeModal()" class="p-2 hover:bg-gray-800 rounded-lg">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="modal-content" class="p-6 overflow-y-auto">
                <!-- Content -->
            </div>
        </div>
    </div>

    <script>
        const COLUMNS = [
            { id: 'inbox', name: 'Inbox', headerClass: 'column-header-inbox', icon: 'fa-inbox' },
            { id: 'opportunity_review', name: 'Opportunity Review', headerClass: 'column-header-opportunity', icon: 'fa-search' },
            { id: 'ready', name: 'Ready', headerClass: 'column-header-ready', icon: 'fa-clipboard-check' },
            { id: 'in_progress', name: 'In Progress', headerClass: 'column-header-progress', icon: 'fa-spinner' },
            { id: 'review', name: 'Review', headerClass: 'column-header-review', icon: 'fa-eye' },
            { id: 'ready_to_deploy', name: 'Ready to Deploy', headerClass: 'column-header-deploy', icon: 'fa-rocket' },
            { id: 'done', name: 'Done', headerClass: 'column-header-done', icon: 'fa-check-circle' }
        ];

        let tasks = [];
        let agents = [];
        let draggedTask = null;

        document.addEventListener('DOMContentLoaded', () => {
            loadBoard();
        });

        async function loadBoard() {
            try {
                const [tasksRes, agentsRes] = await Promise.all([
                    fetch('/api/tasks'),
                    fetch('/api/agents')
                ]);
                
                tasks = await tasksRes.json();
                agents = await agentsRes.json();
                
                renderBoard();
            } catch (err) {
                console.error('Error loading board:', err);
            }
        }

        function renderBoard() {
            const board = document.getElementById('kanban-board');
            board.innerHTML = COLUMNS.map(col => {
                const colTasks = tasks.filter(t => t.status === col.id);
                return \`
                    <div class="kanban-column \${col.headerClass}" 
                         data-column="\${col.id}"
                         ondrop="handleDrop(event, '\${col.id}')" 
                         ondragover="handleDragOver(event)"
                         ondragleave="handleDragLeave(event)">
                        <div class="p-3 border-b border-gray-800/50">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <i class="fas \${col.icon} text-gray-400"></i>
                                    <span class="font-semibold text-sm">\${col.name}</span>
                                </div>
                                <span class="text-xs bg-gray-800 px-2 py-1 rounded-full">\${colTasks.length}</span>
                            </div>
                        </div>
                        <div class="p-2 space-y-2 min-h-[200px]" id="column-\${col.id}">
                            \${colTasks.map(task => renderTaskCard(task)).join('')}
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function renderTaskCard(task) {
            const agent = agents.find(a => a.id === task.agent_id);
            const priority = task.priority || 5;
            return \`
                <div class="kanban-card p-3 priority-\${priority}"
                     draggable="true"
                     data-task-id="\${task.id}"
                     ondragstart="handleDragStart(event, '\${task.id}')"
                     ondragend="handleDragEnd(event)"
                     onclick="viewTask('\${task.id}')">
                    <div class="flex items-start justify-between mb-2">
                        <span class="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">P\${priority}</span>
                        \${task.deliverables?.length ? \`<span class="text-[10px] text-gray-500"><i class="fas fa-paperclip mr-1"></i>\${task.deliverables.length}</span>\` : ''}
                    </div>
                    <h4 class="font-medium text-sm mb-2 line-clamp-2">\${task.title}</h4>
                    <div class="flex items-center justify-between text-xs text-gray-500">
                        <span class="flex items-center gap-1">
                            <i class="fas fa-robot text-[10px]"></i>
                            \${agent?.name || 'Unassigned'}
                        </span>
                        <span>\${formatDate(task.created_at)}</span>
                    </div>
                </div>
            \`;
        }

        function handleDragStart(e, taskId) {
            draggedTask = tasks.find(t => t.id === taskId);
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }

        function handleDragEnd(e) {
            e.target.classList.remove('dragging');
            document.querySelectorAll('.kanban-column').forEach(col => {
                col.classList.remove('drag-over');
            });
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const column = e.currentTarget;
            column.classList.add('drag-over');
        }

        function handleDragLeave(e) {
            const column = e.currentTarget;
            if (!column.contains(e.relatedTarget)) {
                column.classList.remove('drag-over');
            }
        }

        async function handleDrop(e, newStatus) {
            e.preventDefault();
            const column = e.currentTarget;
            column.classList.remove('drag-over');
            
            if (!draggedTask || draggedTask.status === newStatus) return;
            
            try {
                const res = await fetch(\`/api/tasks/\${draggedTask.id}\`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                
                if (res.ok) {
                    draggedTask.status = newStatus;
                    renderBoard();
                }
            } catch (err) {
                console.error('Error updating task:', err);
            }
            
            draggedTask = null;
        }

        function viewTask(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;
            
            const agent = agents.find(a => a.id === task.agent_id);
            
            document.getElementById('modal-content').innerHTML = \`
                <div class="space-y-4">
                    <div>
                        <label class="text-xs text-gray-500 uppercase">Title</label>
                        <h2 class="text-xl font-bold mt-1">\${task.title}</h2>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-xs text-gray-500 uppercase">Status</label>
                            <p class="mt-1">
                                <span class="px-2 py-1 rounded bg-gray-800 text-sm">\${task.status.replace(/_/g, ' ')}</span>
                            </p>
                        </div>
                        <div>
                            <label class="text-xs text-gray-500 uppercase">Priority</label>
                            <p class="mt-1 flex items-center gap-2">
                                <span class="text-lg font-bold">\${task.priority || 5}</span>
                                <span class="text-xs text-gray-400">/ 10</span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 uppercase">Agent</label>
                        <p class="mt-1 flex items-center gap-2">
                            <i class="fas fa-robot text-gray-400"></i>
                            \${agent?.name || 'Unassigned'}
                            <span class="text-gray-500">(\${agent?.role || 'Unknown'})</span>
                        </p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 uppercase">Description</label>
                        <p class="mt-1 text-gray-300 whitespace-pre-wrap">\${task.description || 'No description'}</p>
                    </div>
                    \${task.deliverables?.length ? \`
                        <div>
                            <label class="text-xs text-gray-500 uppercase">Deliverables</label>
                            <ul class="mt-1 space-y-1">
                                \${task.deliverables.map(d => \`<li class="text-sm text-gray-300"><i class="fas fa-check text-green-400 mr-2"></i>\${d}</li>\`).join('')}
                            </ul>
                        </div>
                    \` : ''}
                    <div class="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                            <label class="uppercase">Created</label>
                            <p>\${formatFullDate(task.created_at)}</p>
                        </div>
                        \${task.started_at ? \`
                            <div>
                                <label class="uppercase">Started</label>
                                <p>\${formatFullDate(task.started_at)}</p>
                            </div>
                        \` : ''}
                        \${task.completed_at ? \`
                            <div>
                                <label class="uppercase">Completed</label>
                                <p>\${formatFullDate(task.completed_at)}</p>
                            </div>
                        \` : ''}
                    </div>
                </div>
            \`;
            document.getElementById('task-modal').classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('task-modal').classList.add('hidden');
        }

        function refreshBoard() {
            loadBoard();
        }

        function formatDate(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            const now = new Date();
            const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            if (diff === 0) return 'Hoje';
            if (diff === 1) return 'Ontem';
            if (diff < 7) return \`\${diff}d\`;
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }

        function formatFullDate(dateStr) {
            if (!dateStr) return '-';
            return new Date(dateStr).toLocaleString('pt-BR');
        }

        // Close modal on outside click
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });
    </script>
</body>
</html>
`,
  timesheet: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timesheet - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #2a2a2a #0a0a0b; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0b; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        body { font-family: 'Inter', sans-serif; background: #0a0a0b; color: #fafafa; }
        .card { background: #141414; border: 1px solid #2a2a2a; border-radius: 12px; }
        .btn-primary { background: #c17767; color: white; }
        .btn-primary:hover { background: #d48877; }
        .timeline-container { overflow-x: auto; }
        .timeline-grid {
            display: grid;
            grid-template-columns: 150px repeat(24, 60px);
            gap: 1px;
            background: #1a1a1b;
            min-width: max-content;
        }
        .timeline-header {
            background: #0f0f10;
            padding: 12px 8px;
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            border-bottom: 1px solid #2a2a2a;
        }
        .timeline-hour {
            background: #0f0f10;
            padding: 12px 4px;
            text-align: center;
            font-size: 11px;
            color: #888;
            border-bottom: 1px solid #2a2a2a;
            border-left: 1px solid #1f1f1f;
        }
        .timeline-hour.current {
            background: #c17767/20;
            color: #c17767;
            font-weight: 600;
        }
        .agent-row { display: contents; }
        .agent-name {
            background: #141414;
            padding: 12px;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            position: sticky;
            left: 0;
            z-index: 10;
            border-right: 1px solid #2a2a2a;
        }
        .time-cell {
            background: #0a0a0b;
            border-left: 1px solid #1f1f1f;
            min-height: 50px;
            position: relative;
        }
        .activity-bar {
            position: absolute;
            left: 2px;
            right: 2px;
            border-radius: 4px;
            font-size: 9px;
            padding: 2px 4px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            cursor: pointer;
            transition: all 0.2s;
        }
        .activity-bar:hover {
            z-index: 100;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .activity-session { background: #7a9e7e; color: #0a0a0b; }
        .activity-task { background: #c17767; color: white; }
        .activity-log { background: #3b82f6; color: white; }
        .current-time-line {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #c17767;
            z-index: 50;
            pointer-events: none;
        }
        .current-time-line::before {
            content: '';
            position: absolute;
            top: -4px;
            left: -3px;
            width: 8px;
            height: 8px;
            background: #c17767;
            border-radius: 50%;
        }
    </style>
</head>
<body class="min-h-screen">
    <!-- Header -->
    <header class="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div class="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <a href="/" class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center hover:opacity-80 transition">
                    <i class="fas fa-rocket text-white"></i>
                </a>
                <div>
                    <h1 class="font-bold text-lg">Timesheet</h1>
                    <p class="text-xs text-gray-400">Agent Activity Timeline (24h)</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-4 text-xs">
                    <span class="flex items-center gap-1">
                        <span class="w-3 h-3 rounded bg-[#7a9e7e]"></span> Session
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="w-3 h-3 rounded bg-[#c17767]"></span> Task
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="w-3 h-3 rounded bg-[#3b82f6]"></span> Log
                    </span>
                </div>
                <button onclick="refreshTimesheet()" class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <a href="/" class="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
                    <i class="fas fa-arrow-left"></i>
                </a>
            </div>
        </div>
    </header>

    <!-- Timesheet -->
    <main class="p-6">
        <div class="card overflow-hidden">
            <div class="timeline-container" id="timeline-container">
                <div class="timeline-grid" id="timeline-grid">
                    <!-- Timeline will be rendered here -->
                </div>
            </div>
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-4 gap-4 mt-6">
            <div class="card p-4">
                <div class="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Sessions</div>
                <div id="stat-sessions" class="text-2xl font-bold">-</div>
            </div>
            <div class="card p-4">
                <div class="text-gray-400 text-xs uppercase tracking-wider mb-1">Active Now</div>
                <div id="stat-active" class="text-2xl font-bold text-green-400">-</div>
            </div>
            <div class="card p-4">
                <div class="text-gray-400 text-xs uppercase tracking-wider mb-1">Tasks Completed</div>
                <div id="stat-completed" class="text-2xl font-bold text-orange-400">-</div>
            </div>
            <div class="card p-4">
                <div class="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Logs</div>
                <div id="stat-logs" class="text-2xl font-bold">-</div>
            </div>
        </div>
    </main>

    <!-- Activity Detail Modal -->
    <div id="activity-modal" class="fixed inset-0 bg-black/80 backdrop-blur z-50 hidden flex items-center justify-center p-6">
        <div class="card max-w-lg w-full">
            <div class="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 class="font-bold text-lg">Activity Details</h3>
                <button onclick="closeModal()" class="p-2 hover:bg-gray-800 rounded-lg">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="modal-content" class="p-6">
                <!-- Content -->
            </div>
        </div>
    </div>

    <script>
        let sessions = [];
        let tasks = [];
        let logs = [];
        let agents = [];
        let currentHour = new Date().getHours();

        document.addEventListener('DOMContentLoaded', () => {
            loadTimesheet();
            setInterval(updateCurrentTimeLine, 60000);
        });

        async function loadTimesheet() {
            try {
                const [sessionsRes, tasksRes, logsRes, agentsRes] = await Promise.all([
                    fetch('/api/sessions'),
                    fetch('/api/tasks'),
                    fetch('/api/logs?limit=200'),
                    fetch('/api/agents')
                ]);
                
                sessions = await sessionsRes.json();
                tasks = await tasksRes.json();
                logs = await logsRes.json();
                agents = await agentsRes.json();
                
                renderTimeline();
                updateStats();
            } catch (err) {
                console.error('Error loading timesheet:', err);
            }
        }

        function renderTimeline() {
            const grid = document.getElementById('timeline-grid');
            const hours = Array.from({length: 24}, (_, i) => i);
            
            // Header row
            let html = '<div class="timeline-header sticky left-0 z-20">Agent</div>';
            hours.forEach(hour => {
                const isCurrent = hour === currentHour;
                html += \`<div class="timeline-hour \${isCurrent ? 'current' : ''}" data-hour="\${hour}">\${String(hour).padStart(2, '0')}:00</div>\`;
            });
            
            // Agent rows
            agents.forEach(agent => {
                html += \`<div class="agent-name">\${getAgentIcon(agent.role)} \${agent.name}</div>\`;
                hours.forEach(hour => {
                    const activities = getActivitiesForHour(agent.id, hour);
                    html += \`
                        <div class="time-cell" data-agent="\${agent.id}" data-hour="\${hour}">
                            \${activities.map(act => renderActivityBar(act, hour)).join('')}
                        </div>
                    \`;
                });
            });
            
            grid.innerHTML = html;
            updateCurrentTimeLine();
        }

        function getActivitiesForHour(agentId, hour) {
            const activities = [];
            const hourStart = new Date();
            hourStart.setHours(hour, 0, 0, 0);
            const hourEnd = new Date();
            hourEnd.setHours(hour, 59, 59, 999);
            
            // Sessions
            sessions.filter(s => s.agent_id === agentId).forEach(session => {
                const start = new Date(session.started_at);
                if (start >= hourStart && start <= hourEnd) {
                    activities.push({
                        type: 'session',
                        title: 'Session started',
                        time: start,
                        data: session
                    });
                }
            });
            
            // Tasks
            tasks.filter(t => t.agent_id === agentId).forEach(task => {
                if (task.started_at) {
                    const start = new Date(task.started_at);
                    if (start >= hourStart && start <= hourEnd) {
                        activities.push({
                            type: 'task',
                            title: task.title,
                            time: start,
                            data: task
                        });
                    }
                }
            });
            
            // Logs
            logs.filter(l => l.agent_id === agentId).forEach(log => {
                const time = new Date(log.created_at);
                if (time >= hourStart && time <= hourEnd) {
                    activities.push({
                        type: 'log',
                        title: log.message.substring(0, 30) + '...',
                        time: time,
                        data: log
                    });
                }
            });
            
            return activities.sort((a, b) => a.time - b.time);
        }

        function renderActivityBar(activity, hour) {
            const minute = activity.time.getMinutes();
            const top = (minute / 60) * 100;
            const height = Math.max(20, 100 / Math.max(1, getActivitiesForHour(activity.data.agent_id || activity.data.agent_id, hour).length));
            
            return \`
                <div class="activity-bar activity-\${activity.type}" 
                     style="top: \${top}%; height: \${height}%;"
                     onclick="showActivityDetail('\${activity.type}', '\${activity.data.id || activity.data.id}')">
                    \${activity.title}
                </div>
            \`;
        }

        function updateCurrentTimeLine() {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            // Remove existing lines
            document.querySelectorAll('.current-time-line').forEach(el => el.remove());
            
            // Add new line
            const hourCell = document.querySelector(\`.timeline-hour[data-hour="\${currentHour}"]\`);
            if (hourCell) {
                const line = document.createElement('div');
                line.className = 'current-time-line';
                line.style.left = \`\${hourCell.offsetLeft + (currentMinute / 60) * hourCell.offsetWidth}px\`;
                document.getElementById('timeline-grid').appendChild(line);
            }
        }

        function updateStats() {
            document.getElementById('stat-sessions').textContent = sessions.length;
            document.getElementById('stat-active').textContent = sessions.filter(s => s.status === 'running').length;
            document.getElementById('stat-completed').textContent = tasks.filter(t => t.status === 'completed').length;
            document.getElementById('stat-logs').textContent = logs.length;
        }

        function showActivityDetail(type, id) {
            let data;
            let html;
            
            switch(type) {
                case 'session':
                    data = sessions.find(s => s.id === id);
                    if (!data) return;
                    html = \`
                        <div class="space-y-3">
                            <div><span class="text-xs text-gray-500 uppercase">Type</span><p>Session</p></div>
                            <div><span class="text-xs text-gray-500 uppercase">ID</span><p class="font-mono text-xs">\${data.id}</p></div>
                            <div><span class="text-xs text-gray-500 uppercase">Status</span><p class="capitalize">\${data.status}</p></div>
                            <div><span class="text-xs text-gray-500 uppercase">Started</span><p>\${new Date(data.started_at).toLocaleString('pt-BR')}</p></div>
                            \${data.completed_at ? \`<div><span class="text-xs text-gray-500 uppercase">Completed</span><p>\${new Date(data.completed_at).toLocaleString('pt-BR')}</p></div>\` : ''}
                        </div>
                    \`;
                    break;
                case 'task':
                    data = tasks.find(t => t.id === id);
                    if (!data) return;
                    html = \`
                        <div class="space-y-3">
                            <div><span class="text-xs text-gray-500 uppercase">Type</span><p>Task</p></div>
                            <div><span class="text-xs text-gray-500 uppercase">Title</span><p class="font-medium">\${data.title}</p></div>
                            <div><span class="text-xs text-gray-500 uppercase">Status</span><p class="capitalize">\${data.status}</p></div>
                            <div><span class="text-xs text-gray-500 uppercase">Priority</span><p>P\${data.priority}</p></div>
                        </div>
                    \`;
                    break;
                case 'log':
                    data = logs.find(l => l.id === id);
                    if (!data) return;
                    html = \`
                        <div class="space-y-3">
                            <div><span class="text-xs text-gray-500 uppercase">Type</span><p>Log Entry</p></div>
                            <div><span class="text-xs text-gray-500 uppercase">Level</span><p class="capitalize \${data.level}">\${data.level}</p></div>
                            <div><span class="text-xs text-gray-500 uppercase">Message</span><p>\${data.message}</p></div>
                            <div><span class="text-xs text-gray-500 uppercase">Time</span><p>\${new Date(data.created_at).toLocaleString('pt-BR')}</p></div>
                        </div>
                    \`;
                    break;
            }
            
            document.getElementById('modal-content').innerHTML = html;
            document.getElementById('activity-modal').classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('activity-modal').classList.add('hidden');
        }

        function refreshTimesheet() {
            loadTimesheet();
        }

        function getAgentIcon(role) {
            if (role?.includes('CEO')) return '👑';
            if (role?.includes('Traffic')) return '📢';
            if (role?.includes('Shopify')) return '🛒';
            if (role?.includes('Copy')) return '✍️';
            if (role?.includes('Design')) return '🎨';
            if (role?.includes('Dev')) return '💻';
            if (role?.includes('Data')) return '📊';
            if (role?.includes('Support')) return '🎧';
            return '🤖';
        }

        // Close modal on outside click
        document.getElementById('activity-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });
    </script>
</body>
</html>
`,
  deliverables: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entregas - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        * { scrollbar-width: thin; scrollbar-color: #2a2a2a #0a0a0b; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0b; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        
        body { 
            font-family: 'Inter', sans-serif; 
            background: #0a0a0b; 
            color: #fafafa; 
        }
        
        .code-font { font-family: 'JetBrains Mono', monospace; }
        
        .card { 
            background: #141414; 
            border: 1px solid #2a2a2a; 
            border-radius: 12px;
            transition: all 0.2s ease;
        }
        
        .card:hover {
            border-color: #c17767;
            transform: translateY(-2px);
        }
        
        .btn-primary { 
            background: linear-gradient(135deg, #c17767 0%, #d48877 100%);
            color: white;
            transition: all 0.2s;
        }
        
        .btn-primary:hover { 
            opacity: 0.9;
            transform: translateY(-1px);
        }
        
        .category-badge {
            background: rgba(193, 119, 103, 0.15);
            color: #c17767;
            border: 1px solid rgba(193, 119, 103, 0.3);
        }
        
        .file-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        
        .file-md { background: rgba(66, 153, 225, 0.15); color: #4299e1; }
        .file-json { background: rgba(236, 201, 75, 0.15); color: #ecc94b; }
        .file-js { background: rgba(246, 224, 94, 0.15); color: #f6e05e; }
        .file-py { background: rgba(72, 187, 120, 0.15); color: #48bb78; }
        .file-csv { background: rgba(159, 122, 234, 0.15); color: #9f7aea; }
        .file-img { background: rgba(237, 100, 166, 0.15); color: #ed64a6; }
        .file-code { background: rgba(160, 174, 192, 0.15); color: #a0aec0; }
        
        .preview-panel {
            background: #0d0d0e;
            border-left: 1px solid #2a2a2a;
        }
        
        .deliverable-item {
            cursor: pointer;
            transition: all 0.15s;
        }
        
        .deliverable-item:hover {
            background: rgba(193, 119, 103, 0.05);
        }
        
        .deliverable-item.active {
            background: rgba(193, 119, 103, 0.1);
            border-left: 3px solid #c17767;
        }
        
        .hljs {
            background: #0d0d0e !important;
            border-radius: 8px;
            padding: 16px;
        }
        
        .markdown-body {
            color: #e2e8f0;
            line-height: 1.6;
        }
        
        .markdown-body h1 { color: #fafafa; border-bottom: 1px solid #2a2a2a; padding-bottom: 8px; }
        .markdown-body h2 { color: #e2e8f0; margin-top: 24px; }
        .markdown-body h3 { color: #a0aec0; }
        .markdown-body code {
            background: #1a1a1b;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9em;
        }
        .markdown-body pre {
            background: #0d0d0e;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
        }
        .markdown-body blockquote {
            border-left: 4px solid #c17767;
            padding-left: 16px;
            color: #a0aec0;
            font-style: italic;
        }
        .markdown-body table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }
        .markdown-body th,
        .markdown-body td {
            border: 1px solid #2a2a2a;
            padding: 8px 12px;
            text-align: left;
        }
        .markdown-body th {
            background: #1a1a1b;
            font-weight: 600;
        }
    </style>
</head>
<body class="min-h-screen">
    <!-- Header -->
    <header class="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div class="max-w-full mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <a href="/" class="text-gray-400 hover:text-white transition">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <div>
                        <h1 class="text-xl font-bold text-white">📦 Entregas</h1>
                        <p class="text-sm text-gray-500">Catálogo de entregas e assets</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="openUploadModal()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
                        <i class="fas fa-plus mr-2"></i>Nova Entrega
                    </button>
                </div>
            </div>
        </div>
    </header>

    <div class="flex h-[calc(100vh-73px)]">
        <!-- Sidebar - Filtros -->
        <aside class="w-64 border-r border-gray-800 bg-gray-900/30 p-4 overflow-y-auto">
            <div class="space-y-6">
                <!-- Busca -->
                <div>
                    <label class="text-xs font-medium text-gray-500 uppercase mb-2 block">Buscar</label>
                    <div class="relative">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                        <input type="text" id="searchInput" placeholder="Nome, tag, conteúdo..."
                            class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-c17767">
                    </div>
                </div>

                <!-- Categorias -->
                <div>
                    <label class="text-xs font-medium text-gray-500 uppercase mb-2 block">Categorias</label>
                    <div class="space-y-1" id="categoryFilters">
                        <button class="filter-btn w-full text-left px-3 py-2 rounded-lg text-sm text-white bg-c17767/20 border border-c17767/30 flex items-center gap-2" data-category="all">
                            <i class="fas fa-th-large"></i> Todas
                            <span class="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded-full" id="count-all">0</span>
                        </button>
                        <button class="filter-btn w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 flex items-center gap-2" data-category="strategy">
                            <i class="fas fa-chess"></i> Estratégia
                            <span class="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded-full" id="count-strategy">0</span>
                        </button>
                        <button class="filter-btn w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 flex items-center gap-2" data-category="creative">
                            <i class="fas fa-palette"></i> Criativos
                            <span class="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded-full" id="count-creative">0</span>
                        </button>
                        <button class="filter-btn w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 flex items-center gap-2" data-category="analysis">
                            <i class="fas fa-chart-line"></i> Análises
                            <span class="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded-full" id="count-analysis">0</span>
                        </button>
                        <button class="filter-btn w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 flex items-center gap-2" data-category="code">
                            <i class="fas fa-code"></i> Código
                            <span class="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded-full" id="count-code">0</span>
                        </button>
                        <button class="filter-btn w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 flex items-center gap-2" data-category="docs">
                            <i class="fas fa-file-alt"></i> Documentação
                            <span class="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded-full" id="count-docs">0</span>
                        </button>
                    </div>
                </div>

                <!-- Tipo de Arquivo -->
                <div>
                    <label class="text-xs font-medium text-gray-500 uppercase mb-2 block">Tipo</label>
                    <div class="space-y-1" id="typeFilters">
                        <button class="type-btn w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 flex items-center gap-2" data-type="md">
                            <i class="fab fa-markdown text-blue-400"></i> Markdown
                        </button>
                        <button class="type-btn w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 flex items-center gap-2" data-type="json">
                            <i class="fas fa-brackets-curly text-yellow-400"></i> JSON
                        </button>
                        <button class="type-btn w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 flex items-center gap-2" data-type="js">
                            <i class="fab fa-js text-yellow-300"></i> JavaScript
                        </button>
                        <button class="type-btn w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 flex items-center gap-2" data-type="csv">
                            <i class="fas fa-table text-purple-400"></i> CSV / Planilha
                        </button>
                        <button class="type-btn w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 flex items-center gap-2" data-type="img">
                            <i class="fas fa-image text-pink-400"></i> Imagem
                        </button>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Lista de Entregas -->
        <main class="flex-1 overflow-y-auto p-6" id="deliverablesList">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white" id="listTitle">Todas as Entregas</h2>
                <div class="text-sm text-gray-500">
                    <span id="showingCount">0</span> de <span id="totalCount">0</span> entregas
                </div>
            </div>
            
            <div class="space-y-3" id="deliverablesContainer">
                <!-- Entregas serão inseridas aqui -->
            </div>
        </main>

        <!-- Preview Panel -->
        <aside class="w-[45%] preview-panel overflow-y-auto hidden" id="previewPanel">
            <div class="sticky top-0 bg-gray-900/90 backdrop-blur border-b border-gray-800 p-4 z-10">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div id="previewIcon" class="file-icon file-md">
                            <i class="fab fa-markdown"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-white" id="previewTitle">Nome do Arquivo</h3>
                            <p class="text-xs text-gray-500" id="previewMeta">Categoria • Tamanho • Data</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="downloadCurrent()" class="p-2 text-gray-400 hover:text-white transition" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="closePreview()" class="p-2 text-gray-400 hover:text-white transition" title="Fechar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="p-6" id="previewContent">
                <!-- Conteúdo do preview -->
            </div>
        </aside>
    </div>

    <!-- Modal de Upload -->
    <div id="uploadModal" class="fixed inset-0 bg-black/70 backdrop-blur hidden items-center justify-center z-50">
        <div class="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 m-4">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-white">Nova Entrega</h3>
                <button onclick="closeUploadModal()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="uploadForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Título</label>
                    <input type="text" name="title" required
                        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c17767"
                        placeholder="Ex: Análise de LTV - Março 2026">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
                        <select name="category" required
                            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c17767">
                            <option value="strategy">Estratégia</option>
                            <option value="creative">Criativos</option>
                            <option value="analysis">Análises</option>
                            <option value="code">Código</option>
                            <option value="docs">Documentação</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Agente</label>
                        <select name="agent_id"
                            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c17767">
                            <option value="">Selecione...</option>
                            <option value="data_analyst">DATA_ANALYST</option>
                            <option value="copywriter">COPYWRITER</option>
                            <option value="designer">DESIGNER</option>
                            <option value="shopify_specialist">SHOPIFY_SPECIALIST</option>
                            <option value="dev_automation">DEV_AUTOMATION</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Tags (separadas por vírgula)</label>
                    <input type="text" name="tags"
                        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-c17767"
                        placeholder="ltv, análise, março">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Conteúdo / Descrição</label>
                    <textarea name="content" rows="8" required
                        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white code-font text-sm focus:outline-none focus:border-c17767 resize-none"
                        placeholder="Cole o conteúdo aqui (Markdown, JSON, código, etc.)"></textarea>
                </div>
                
                <div class="flex justify-end gap-3 pt-4">
                    <button type="button" onclick="closeUploadModal()"
                        class="px-4 py-2 text-gray-400 hover:text-white transition">
                        Cancelar
                    </button>
                    <button type="submit"
                        class="btn-primary px-6 py-2 rounded-lg font-medium">
                        Salvar Entrega
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Estado
        let deliverables = [];
        let currentFilter = 'all';
        let currentTypeFilter = null;
        let selectedDeliverable = null;

        // Categoria labels
        const categoryLabels = {
            strategy: 'Estratégia',
            creative: 'Criativos',
            analysis: 'Análises',
            code: 'Código',
            docs: 'Documentação'
        };

        // Icones por tipo
        const fileIcons = {
            md: { class: 'file-md', icon: 'fab fa-markdown' },
            json: { class: 'file-json', icon: 'fas fa-brackets-curly' },
            js: { class: 'file-js', icon: 'fab fa-js' },
            py: { class: 'file-py', icon: 'fab fa-python' },
            csv: { class: 'file-csv', icon: 'fas fa-table' },
            img: { class: 'file-img', icon: 'fas fa-image' },
            default: { class: 'file-code', icon: 'fas fa-file-code' }
        };

        // Detectar tipo de arquivo
        function detectType(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            if (['md', 'markdown'].includes(ext)) return 'md';
            if (['json'].includes(ext)) return 'json';
            if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return 'js';
            if (['py'].includes(ext)) return 'py';
            if (['csv'].includes(ext)) return 'csv';
            if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return 'img';
            return 'default';
        }

        // Carregar entregas
        async function loadDeliverables() {
            try {
                const response = await fetch('/api/deliverables');
                deliverables = await response.json();
                renderDeliverables();
                updateCounts();
            } catch (err) {
                console.error('Erro ao carregar entregas:', err);
                // Dados de exemplo
                deliverables = [
                    {
                        id: 'del_1',
                        title: 'Análise LTV - Clientes Inativos',
                        category: 'analysis',
                        type: 'md',
                        agent_id: 'data_analyst',
                        agent_name: 'DATA_ANALYST',
                        tags: ['ltv', 'clientes', 'março'],
                        content: '# Análise LTV - Clientes Inativos\\n\\n## Resumo\\n- **Total clientes inativos:** 73\\n- **Potencial de receita:** R$ 31.000\\n- **Ticket médio histórico:** R$ 425\\n\\n## Recomendações\\n1. Campanha de reativação com 15% OFF\\n2. Sequência de 3 emails\\n3. Oferta de bundle especial',
                        size: '2.4 KB',
                        created_at: '2026-03-28T14:30:00Z'
                    },
                    {
                        id: 'del_2',
                        title: 'Estratégia de Bundles',
                        category: 'strategy',
                        type: 'md',
                        agent_id: 'shopify_specialist',
                        agent_name: 'SHOPIFY_SPECIALIST',
                        tags: ['bundles', 'receita', 'estrategia'],
                        content: '# Estratégia de Bundles\\n\\n## Bundles Propostos\\n\\n### 1. Kit Home Office\\n- Produtos: Mesa + Luminária + Organizador\\n- Preço: R$ 599 (economia de 20%)\\n- Margem: 45%\\n\\n### 2. Kit Decoração\\n- Produtos: 3 Vasos + Bandeja + Porta-retrato\\n- Preço: R$ 299 (economia de 25%)\\n- Margem: 52%',
                        size: '1.8 KB',
                        created_at: '2026-03-28T13:15:00Z'
                    },
                    {
                        id: 'del_3',
                        title: 'Script Automação de Relatórios',
                        category: 'code',
                        type: 'js',
                        agent_id: 'dev_automation',
                        agent_name: 'DEV_AUTOMATION',
                        tags: ['automação', 'script', 'relatórios'],
                        content: \`// Automação de relatórios diários\\nconst { fetchShopifyData } = require('./shopify');\\nconst { generateReport } = require('./reports');\\n\\nasync function generateDailyReport() {\\n  const data = await fetchShopifyData();\\n  const report = generateReport(data);\\n  \\n  await sendEmail({\\n    to: 'fernando@criativalia.com',\\n    subject: 'Relatório Diário - ' + new Date().toLocaleDateString(),\\n    html: report\\n  });\\n}\\n\\nmodule.exports = { generateDailyReport };\`,
                        size: '856 B',
                        created_at: '2026-03-28T10:00:00Z'
                    },
                    {
                        id: 'del_4',
                        title: 'Copy Email de Reativação',
                        category: 'creative',
                        type: 'md',
                        agent_id: 'copywriter',
                        agent_name: 'COPYWRITER',
                        tags: ['email', 'copy', 'reativação'],
                        content: '# Email de Reativação\\n\\n**Assunto:** Sentimos sua falta, [Nome] 💙\\n\\n---\\n\\nOi [Nome],\\n\\nPercebi que faz um tempo que você não visita a Criativalia.\\n\\nE se eu te dissesse que preparamos algo especial só para você?\\n\\n**15% OFF** em todo o site\\nCódigo: **VOLTEI15**\\n\\nVálido por 48h ⏰\\n\\n[Ver Novidades]\\n\\n---\\n\\nUm abraço,\\nFernando',
                        size: '1.2 KB',
                        created_at: '2026-03-27T16:45:00Z'
                    }
                ];
                renderDeliverables();
                updateCounts();
            }
        }

        // Renderizar lista
        function renderDeliverables() {
            const container = document.getElementById('deliverablesContainer');
            const filtered = filterDeliverables();
            
            document.getElementById('showingCount').textContent = filtered.length;
            document.getElementById('totalCount').textContent = deliverables.length;
            
            if (filtered.length === 0) {
                container.innerHTML = \`\\n                    <div class="text-center py-12 text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-4"></i>
                        <p>Nenhuma entrega encontrada</p>
                    </div>\\n                \`;
                return;
            }
            
            container.innerHTML = filtered.map(d => {
                const typeInfo = fileIcons[d.type] || fileIcons.default;
                const date = new Date(d.created_at).toLocaleDateString('pt-BR');
                return \`\\n                    <div class="deliverable-item card p-4 flex items-center gap-4 \${selectedDeliverable?.id === d.id ? 'active' : ''}"
                         onclick="selectDeliverable('\${d.id}')">
                        <div class="file-icon \${typeInfo.class}">
                            <i class="\${typeInfo.icon}"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <h4 class="font-medium text-white truncate">\${d.title}</h4>
                                <span class="category-badge text-xs px-2 py-0.5 rounded-full">
                                    \${categoryLabels[d.category] || d.category}
                                </span>
                            </div>
                            <p class="text-sm text-gray-500 mt-1">
                                \${d.agent_name || 'Desconhecido'} • \${date} • \${d.size || ''}
                            </p>
                            \${d.tags?.length ? \`\\n                                <div class="flex gap-1 mt-2">
                                    \${d.tags.map(t => \`<span class="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">#\${t}</span>\`).join('')}
                                </div>\\n                            \` : ''}
                        </div>
                        <i class="fas fa-chevron-right text-gray-600"></i>
                    </div>\\n                \`;
            }).join('');
        }

        // Filtrar entregas
        function filterDeliverables() {
            let filtered = deliverables;
            
            // Filtro de categoria
            if (currentFilter !== 'all') {
                filtered = filtered.filter(d => d.category === currentFilter);
            }
            
            // Filtro de tipo
            if (currentTypeFilter) {
                filtered = filtered.filter(d => d.type === currentTypeFilter);
            }
            
            // Busca
            const search = document.getElementById('searchInput').value.toLowerCase();
            if (search) {
                filtered = filtered.filter(d => 
                    d.title.toLowerCase().includes(search) ||
                    d.tags?.some(t => t.toLowerCase().includes(search)) ||
                    d.content?.toLowerCase().includes(search)
                );
            }
            
            // Ordenar por data (mais recente primeiro)
            return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        // Atualizar contagens
        function updateCounts() {
            const counts = {
                all: deliverables.length,
                strategy: deliverables.filter(d => d.category === 'strategy').length,
                creative: deliverables.filter(d => d.category === 'creative').length,
                analysis: deliverables.filter(d => d.category === 'analysis').length,
                code: deliverables.filter(d => d.category === 'code').length,
                docs: deliverables.filter(d => d.category === 'docs').length
            };
            
            Object.entries(counts).forEach(([key, count]) => {
                const el = document.getElementById(\`count-\${key}\`);
                if (el) el.textContent = count;
            });
        }

        // Selecionar entrega
        function selectDeliverable(id) {
            selectedDeliverable = deliverables.find(d => d.id === id);
            if (!selectedDeliverable) return;
            
            // Atualizar UI
            document.querySelectorAll('.deliverable-item').forEach(el => el.classList.remove('active'));
            event.currentTarget.classList.add('active');
            
            // Mostrar preview
            const panel = document.getElementById('previewPanel');
            panel.classList.remove('hidden');
            
            // Atualizar header
            document.getElementById('previewTitle').textContent = selectedDeliverable.title;
            const date = new Date(selectedDeliverable.created_at).toLocaleDateString('pt-BR');
            document.getElementById('previewMeta').textContent = 
                \`\${categoryLabels[selectedDeliverable.category]} • \${selectedDeliverable.size || 'N/A'} • \${date}\`;
            
            // Icon
            const typeInfo = fileIcons[selectedDeliverable.type] || fileIcons.default;
            const iconEl = document.getElementById('previewIcon');
            iconEl.className = \`file-icon \${typeInfo.class}\`;
            iconEl.innerHTML = \`<i class="\${typeInfo.icon}"></i>\`;
            
            // Renderizar conteúdo
            renderPreview();
        }

        // Renderizar preview
        function renderPreview() {
            const contentEl = document.getElementById('previewContent');
            const type = selectedDeliverable.type;
            const content = selectedDeliverable.content;
            
            if (type === 'md') {
                // Markdown
                contentEl.innerHTML = \`<div class="markdown-body">\${marked.parse(content)}</div>\`;
            } else if (['js', 'py', 'json'].includes(type)) {
                // Código
                contentEl.innerHTML = \`<pre><code class="language-\${type}">\${escapeHtml(content)}</code></pre>\`;
                hljs.highlightAll();
            } else {
                // Texto plano
                contentEl.innerHTML = \`<pre class="text-gray-300 code-font text-sm whitespace-pre-wrap">\${escapeHtml(content)}</pre>\`;
            }
        }

        // Escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Fechar preview
        function closePreview() {
            document.getElementById('previewPanel').classList.add('hidden');
            selectedDeliverable = null;
            document.querySelectorAll('.deliverable-item').forEach(el => el.classList.remove('active'));
        }

        // Download
        function downloadCurrent() {
            if (!selectedDeliverable) return;
            
            const blob = new Blob([selectedDeliverable.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`\${selectedDeliverable.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.\${selectedDeliverable.type === 'md' ? 'md' : selectedDeliverable.type}\`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Modal de upload
        function openUploadModal() {
            document.getElementById('uploadModal').classList.remove('hidden');
            document.getElementById('uploadModal').classList.add('flex');
        }

        function closeUploadModal() {
            document.getElementById('uploadModal').classList.add('hidden');
            document.getElementById('uploadModal').classList.remove('flex');
            document.getElementById('uploadForm').reset();
        }

        // Submit do formulário
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = {
                title: formData.get('title'),
                category: formData.get('category'),
                agent_id: formData.get('agent_id'),
                tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t),
                content: formData.get('content'),
                type: detectType(formData.get('title')),
                size: \`\${(formData.get('content').length / 1024).toFixed(1)} KB\`,
                created_at: new Date().toISOString()
            };
            
            try {
                const response = await fetch('/api/deliverables', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    deliverables.unshift({ ...data, id: result.id });
                    renderDeliverables();
                    updateCounts();
                    closeUploadModal();
                } else {
                    alert('Erro ao salvar entrega');
                }
            } catch (err) {
                // Adicionar localmente se API falhar
                deliverables.unshift({
                    ...data,
                    id: 'del_' + Date.now(),
                    agent_name: formData.get('agent_id') || 'Manual'
                });
                renderDeliverables();
                updateCounts();
                closeUploadModal();
            }
        });

        // Event listeners para filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('bg-c17767/20', 'border', 'border-c17767/30', 'text-white');
                    b.classList.add('text-gray-400');
                });
                btn.classList.add('bg-c17767/20', 'border', 'border-c17767/30', 'text-white');
                btn.classList.remove('text-gray-400');
                
                currentFilter = btn.dataset.category;
                renderDeliverables();
            });
        });

        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const isActive = btn.classList.contains('text-white');
                document.querySelectorAll('.type-btn').forEach(b => {
                    b.classList.remove('text-white', 'bg-gray-800');
                    b.classList.add('text-gray-400');
                });
                
                if (!isActive) {
                    btn.classList.add('text-white', 'bg-gray-800');
                    btn.classList.remove('text-gray-400');
                    currentTypeFilter = btn.dataset.type;
                } else {
                    currentTypeFilter = null;
                }
                renderDeliverables();
            });
        });

        document.getElementById('searchInput').addEventListener('input', renderDeliverables);

        // Inicializar
        loadDeliverables();
    </script>
</body>
</html>
`,
};
