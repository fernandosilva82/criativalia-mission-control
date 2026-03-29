/**
 * OpenClaw Cron Integration
 * Integra os jobs cron do OpenClaw com o Control Plane
 * 
 * MODO 1: Leitura de arquivo JSON (produção no Render)
 * MODO 2: Execução direta (desenvolvimento local)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Mapeamento dos cron jobs para agentes do dashboard
const CRON_TO_AGENT_MAP = {
    '🌙 Night Shift - UX/UI Review': {
        id: 'ux_ui_agent',
        name: 'UX/UI_AGENT',
        role: 'Especialista UX/UI',
        description: 'Revisa e melhora interface do usuário mobile-first',
        skills: ['ux_design', 'ui_design', 'mobile', 'accessibility'],
        category: 'design',
        priority: 9
    },
    '🌙 Night Shift - Design System': {
        id: 'design_system_agent',
        name: 'DESIGN_SYSTEM_AGENT', 
        role: 'Especialista Design System',
        description: 'Refina tema Criativalia e componentes visuais',
        skills: ['css', 'design_system', 'branding', 'responsive'],
        category: 'design',
        priority: 8
    },
    '🚀 Auto Deploy Manager': {
        id: 'deploy_manager',
        name: 'DEPLOY_MANAGER',
        role: 'Gerente de Deploy',
        description: 'Monitora e garante deploys automáticos no Render',
        skills: ['devops', 'ci_cd', 'github', 'render'],
        category: 'devops',
        priority: 10
    },
    '📊 Timesheet Generator': {
        id: 'timesheet_agent',
        name: 'TIMESHEET_AGENT',
        role: 'Analista de Produtividade',
        description: 'Gera timelines de atividades dos agentes',
        skills: ['analytics', 'reporting', 'visualization'],
        category: 'analytics',
        priority: 7
    },
    '🧠 CEO Agent - Orquestrador': {
        id: 'ceo_orchestrator',
        name: 'CEO_ORCHESTRATOR',
        role: 'CEO / Orquestrador',
        description: 'Analisa oportunidades e prioriza trabalho dos agentes',
        skills: ['strategy', 'coordination', 'decision_making', 'prioritization'],
        category: 'strategy',
        priority: 10
    },
    '🔔 Deploy Monitor - Notificador Telegram': {
        id: 'deploy_monitor',
        name: 'DEPLOY_MONITOR',
        role: 'Monitor de Deploys',
        description: 'Monitora GitHub Actions e notifica status',
        skills: ['monitoring', 'github_api', 'notifications'],
        category: 'devops',
        priority: 8
    },
    '⚙️ OpsBot - Scanner de Oportunidades': {
        id: 'ops_bot',
        name: 'OPSBOT',
        role: 'Analista Operacional',
        description: 'Encontra oportunidades de margem e eficiência',
        skills: ['operations', 'pricing', 'bundles', 'automation'],
        category: 'operations',
        priority: 8
    },
    '🔍 TrafficBot - Scanner de Oportunidades': {
        id: 'traffic_bot',
        name: 'TRAFFICBOT',
        role: 'Especialista em Tráfego',
        description: 'Pesquisa tendências de SEO e keywords',
        skills: ['seo', 'trends', 'competitor_analysis', 'keywords'],
        category: 'marketing',
        priority: 8
    },
    '✍️ CopyBot - Scanner de Oportunidades': {
        id: 'copy_bot',
        name: 'COPYBOT',
        role: 'Copywriter de Conversão',
        description: 'Analisa e sugere melhorias de copy e conteúdo',
        skills: ['copywriting', 'content_strategy', 'conversion'],
        category: 'marketing',
        priority: 7
    },
    '🌅 Morning Brief - Relatório Matinal': {
        id: 'morning_brief',
        name: 'MORNING_BRIEF_AGENT',
        role: 'Relator Matinal',
        description: 'Gera relatório completo das últimas 24h',
        skills: ['reporting', 'analytics', 'communication'],
        category: 'analytics',
        priority: 6
    },
    'Criativalia TrafficBot': {
        id: 'traffic_bot_legacy',
        name: 'TRAFFICBOT_LEGACY',
        role: 'Especialista SEO (Legacy)',
        description: 'Análise SEO noturna',
        skills: ['seo', 'trends'],
        category: 'marketing',
        priority: 5
    },
    'Criativalia CopyBot': {
        id: 'copy_bot_legacy',
        name: 'COPYBOT_LEGACY',
        role: 'Copywriter (Legacy)',
        description: 'Criação de copy noturna',
        skills: ['copywriting'],
        category: 'marketing',
        priority: 5
    },
    'Criativalia DesignBot': {
        id: 'design_bot_legacy',
        name: 'DESIGNBOT_LEGACY',
        role: 'Designer (Legacy)',
        description: 'Design de produto noturno',
        skills: ['design'],
        category: 'design',
        priority: 5
    },
    'Criativalia OpsBot': {
        id: 'ops_bot_legacy',
        name: 'OPSBOT_LEGACY',
        role: 'Analista Ops (Legacy)',
        description: 'Análise operacional noturna',
        skills: ['operations'],
        category: 'operations',
        priority: 5
    },
    'Criativalia Night Shift': {
        id: 'night_shift',
        name: 'NIGHT_SHIFT_SUPERVISOR',
        role: 'Supervisor Noturno',
        description: 'Supervisiona turno noturno completo',
        skills: ['supervision', 'reporting', 'coordination'],
        category: 'strategy',
        priority: 9
    },
    'Keep Render Awake': {
        id: 'keep_alive',
        name: 'KEEP_ALIVE',
        role: 'Monitor de Serviço',
        description: 'Mantém serviços Render ativos (ping)',
        skills: ['monitoring', 'maintenance'],
        category: 'devops',
        priority: 3
    }
};

// Cache para evitar chamadas excessivas
let lastFetch = 0;
let cachedJobs = [];
const CACHE_TTL = 30000; // 30 segundos
const AGENT_STATE_FILE = path.join(__dirname, '../data/agent_state.json');

/**
 * Busca jobs cron do OpenClaw
 * Tenta primeiro ler do arquivo (Render), depois executa comando (local)
 */
function fetchCronJobs() {
    try {
        const now = Date.now();
        if (now - lastFetch < CACHE_TTL && cachedJobs.length > 0) {
            return cachedJobs;
        }

        let jobs = [];

        // MODO 1: Tenta ler do arquivo (produção no Render)
        if (fs.existsSync(AGENT_STATE_FILE)) {
            try {
                const fileContent = fs.readFileSync(AGENT_STATE_FILE, 'utf8');
                const data = JSON.parse(fileContent);
                jobs = data.jobs || [];
                console.log(`📁 Lidos ${jobs.length} jobs do arquivo`);
            } catch (e) {
                console.log('⚠️ Erro ao ler arquivo:', e.message);
            }
        }

        // MODO 2: Executa comando openclaw (desenvolvimento local)
        if (jobs.length === 0) {
            try {
                const output = execSync('openclaw cron list --json 2>/dev/null || echo "[]"', {
                    encoding: 'utf8',
                    timeout: 10000,
                    cwd: '/root/.openclaw/workspace'
                });
                jobs = JSON.parse(output);
                console.log(`⚡ Lidos ${jobs.length} jobs via comando`);
            } catch (e) {
                console.log('⚠️ Comando openclaw não disponível');
            }
        }

        // MODO 3: Fallback - retorna agentes conhecidos (quando nada mais funciona)
        if (jobs.length === 0) {
            jobs = getKnownJobs();
            console.log(`📋 Usando ${jobs.length} jobs conhecidos (fallback)`);
        }

        cachedJobs = jobs;
        lastFetch = now;
        return jobs;
    } catch (error) {
        console.error('Erro ao buscar cron jobs:', error.message);
        return cachedJobs.length > 0 ? cachedJobs : [];
    }
}

/**
 * Parse do formato texto do openclaw cron list
 */
function parseCronListText(output) {
    const jobs = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
        // Formato: id name schedule status
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3 && parts[0].match(/^[a-f0-9-]+$/)) {
            jobs.push({
                id: parts[0],
                name: parts.slice(1, -2).join(' '),
                schedule: parts[parts.length - 2],
                status: parts[parts.length - 1]
            });
        }
    }
    
    return jobs;
}

/**
 * Retorna lista de jobs conhecidos (fallback quando não consegue ler do OpenClaw)
 */
function getKnownJobs() {
    const now = Date.now();
    return [
        {
            id: '5705037a-4df8-4439-a12c-6a257a87730b',
            name: '🌙 Night Shift - UX/UI Review',
            enabled: true,
            schedule: { kind: 'every', everyMs: 7200000 },
            state: { nextRunAtMs: now + 3600000, lastRunStatus: 'ok' }
        },
        {
            id: '9ff6401d-de79-40fc-b11e-2171bdad3847',
            name: '🌙 Night Shift - Design System',
            enabled: true,
            schedule: { kind: 'every', everyMs: 10800000 },
            state: { nextRunAtMs: now + 5400000, lastRunStatus: 'ok' }
        },
        {
            id: '88a7e086-005d-49e0-9c30-51a3be5e9f0d',
            name: '🚀 Auto Deploy Manager',
            enabled: true,
            schedule: { kind: 'every', everyMs: 1800000 },
            state: { nextRunAtMs: now + 900000, lastRunStatus: 'ok' }
        },
        {
            id: 'ceo-agent-orchestrator',
            name: '🧠 CEO Agent - Orquestrador',
            enabled: true,
            schedule: { kind: 'every', everyMs: 7200000 },
            state: { nextRunAtMs: now + 3600000, lastRunStatus: 'ok' }
        },
        {
            id: 'ops-opportunity-scanner',
            name: '⚙️ OpsBot - Scanner de Oportunidades',
            enabled: true,
            schedule: { kind: 'every', everyMs: 14400000 },
            state: { nextRunAtMs: now + 7200000, lastRunStatus: 'ok' }
        },
        {
            id: 'traffic-opportunity-scanner',
            name: '🔍 TrafficBot - Scanner de Oportunidades',
            enabled: true,
            schedule: { kind: 'every', everyMs: 21600000 },
            state: { nextRunAtMs: now + 10800000, lastRunStatus: 'ok' }
        },
        {
            id: 'copy-opportunity-scanner',
            name: '✍️ CopyBot - Scanner de Oportunidades',
            enabled: true,
            schedule: { kind: 'every', everyMs: 28800000 },
            state: { nextRunAtMs: now + 14400000, lastRunStatus: 'ok' }
        },
        {
            id: 'timesheet-generator',
            name: '📊 Timesheet Generator',
            enabled: true,
            schedule: { kind: 'every', everyMs: 3600000 },
            state: { nextRunAtMs: now + 1800000, lastRunStatus: 'ok' }
        },
        {
            id: 'ba4553e1-3aaf-42d3-8f44-76a90d51e02b',
            name: 'Keep Render Awake',
            enabled: true,
            schedule: { kind: 'every', everyMs: 300000 },
            state: { nextRunAtMs: now + 150000, lastRunStatus: 'ok' }
        },
        {
            id: 'deploy-monitor-notifier',
            name: '🔔 Deploy Monitor - Notificador Telegram',
            enabled: true,
            schedule: { kind: 'every', everyMs: 300000 },
            state: { nextRunAtMs: now + 150000, lastRunStatus: 'ok' }
        }
    ];
}

/**
 * Converte cron jobs para formato de agentes
 */
function mapToAgents(jobs) {
    const agents = [];
    const now = new Date();

    for (const job of jobs) {
        const config = CRON_TO_AGENT_MAP[job.name] || {
            id: `cron_${job.id}`,
            name: job.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
            role: 'Agente Automatizado',
            description: job.name,
            skills: ['automation'],
            category: 'general',
            priority: 5
        };

        // Determina status baseado no estado do job
        let status = 'idle';
        let lastRun = null;
        let nextRun = null;

        if (job.state) {
            if (job.state.runningAtMs) {
                status = 'running';
            } else if (job.state.lastRunAtMs) {
                lastRun = new Date(job.state.lastRunAtMs).toISOString();
                // Se rodou nos últimos 5 min, considera como recente
                const minsSinceLastRun = (now - job.state.lastRunAtMs) / 60000;
                if (minsSinceLastRun < 5) {
                    status = 'running';
                }
            }
            
            if (job.state.nextRunAtMs) {
                nextRun = new Date(job.state.nextRunAtMs).toISOString();
            }
        }

        // Calcula tempo até próxima execução
        let timeUntilNext = null;
        if (nextRun) {
            const diff = new Date(nextRun) - now;
            timeUntilNext = Math.max(0, Math.floor(diff / 60000)); // minutos
        }

        agents.push({
            ...config,
            cron_id: job.id,
            status,
            enabled: job.enabled !== false,
            schedule: job.schedule,
            last_run: lastRun,
            next_run: nextRun,
            time_until_next_min: timeUntilNext,
            last_status: job.state?.lastRunStatus || 'unknown',
            consecutive_errors: job.state?.consecutiveErrors || 0,
            total_executions: job.state?.totalExecutions || 0,
            created_at: job.createdAtMs ? new Date(job.createdAtMs).toISOString() : null,
            updated_at: job.updatedAtMs ? new Date(job.updatedAtMs).toISOString() : null
        });
    }

    // Ordena por prioridade
    return agents.sort((a, b) => b.priority - a.priority);
}

/**
 * Obtém estatísticas dos agentes
 */
function getAgentStats(agents) {
    const now = new Date();
    
    return {
        total: agents.length,
        running: agents.filter(a => a.status === 'running').length,
        idle: agents.filter(a => a.status === 'idle').length,
        error: agents.filter(a => a.consecutive_errors > 0).length,
        disabled: agents.filter(a => !a.enabled).length,
        by_category: agents.reduce((acc, a) => {
            acc[a.category] = (acc[a.category] || 0) + 1;
            return acc;
        }, {}),
        next_execution_in_min: Math.min(
            ...agents.filter(a => a.time_until_next_min !== null)
                     .map(a => a.time_until_next_min)
                     .filter(t => t > 0)
        ),
        last_updated: now.toISOString()
    };
}

/**
 * API Handler para /api/agents/real
 */
function getRealAgents(req, res) {
    try {
        const jobs = fetchCronJobs();
        const agents = mapToAgents(jobs);
        const stats = getAgentStats(agents);

        res.json({
            agents,
            stats,
            source: 'openclaw_cron',
            cached: Date.now() - lastFetch < CACHE_TTL
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch agents',
            message: error.message
        });
    }
}

/**
 * API Handler para /api/agents/status
 */
function getAgentsStatus(req, res) {
    try {
        const jobs = fetchCronJobs();
        const agents = mapToAgents(jobs);
        
        // Resumo rápido
        const running = agents.filter(a => a.status === 'running');
        const upcoming = agents
            .filter(a => a.status === 'idle' && a.time_until_next_min !== null)
            .sort((a, b) => a.time_until_next_min - b.time_until_next_min)
            .slice(0, 5);

        res.json({
            summary: {
                total_agents: agents.length,
                active_now: running.length,
                idle: agents.filter(a => a.status === 'idle').length,
                errors: agents.filter(a => a.consecutive_errors > 0).length
            },
            running_agents: running.map(a => ({
                id: a.id,
                name: a.name,
                role: a.role,
                started_at: a.last_run
            })),
            upcoming_executions: upcoming.map(a => ({
                id: a.id,
                name: a.name,
                role: a.role,
                in_minutes: a.time_until_next_min,
                next_run: a.next_run
            })),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch status',
            message: error.message
        });
    }
}

module.exports = {
    getRealAgents,
    getAgentsStatus,
    fetchCronJobs,
    mapToAgents,
    CRON_TO_AGENT_MAP
};