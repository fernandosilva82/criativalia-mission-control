// Timesheet - Carrega dados reais do OpenClaw Cron
async function loadTimesheetData() {
    try {
        const listEl = document.getElementById('executions-list');
        if (!listEl) return;
        
        listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #7a7a6a;">Carregando...</div>';
        
        // Buscar execuções reais
        const runsRes = await fetch('/api/cron/runs');
        const runsData = await runsRes.json();
        const executions = runsData.runs || [];
        
        // Buscar jobs para contagem
        const jobsRes = await fetch('/api/cron/jobs');
        const jobsData = await jobsRes.json();
        const activeAgents = (jobsData.jobs || []).filter(j => j.enabled !== false).length;
        
        // Atualizar contadores
        const totalEl = document.getElementById('total-executions');
        const activeEl = document.getElementById('active-agents');
        const rateEl = document.getElementById('success-rate');
        
        if (totalEl) totalEl.textContent = executions.length;
        if (activeEl) activeEl.textContent = activeAgents;
        
        const successCount = executions.filter(e => e.status === 'completed' || e.status === 'success').length;
        const rate = executions.length > 0 ? Math.round((successCount / executions.length) * 100) : 100;
        if (rateEl) rateEl.textContent = rate + '%';
        
        if (executions.length === 0) {
            listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #7a7a6a;">Nenhuma execução encontrada</div>';
            return;
        }
        
        // Renderizar lista
        listEl.innerHTML = executions.slice(0, 20).map(exec => {
            const status = exec.status || 'completed';
            const statusColor = status === 'completed' || status === 'success' ? '#7a9e7e' : (status === 'failed' ? '#c17767' : '#D4A853');
            const duration = exec.duration_ms ? Math.round(exec.duration_ms / 1000) + 's' : '-';
            const dateStr = new Date(exec.started_at).toLocaleString('pt-BR');
            
            return '<div style="display: flex; align-items: center; gap: 16px; padding: 16px; border-bottom: 1px solid #3A4D13;">' +
                '<div style="width: 8px; height: 8px; border-radius: 50%; background: ' + statusColor + ';"></div>' +
                '<div style="flex: 1;">' +
                    '<div style="font-weight: 600; color: #F5F5DC;">' + (exec.agent_name || exec.job_name || 'Execução') + '</div>' +
                    '<div style="font-size: 12px; color: #7a9e7e;">' + dateStr + ' • ' + duration + '</div>' +
                '</div>' +
                '<div style="font-size: 12px; color: ' + statusColor + '; text-transform: uppercase;">' + status + '</div>' +
            '</div>';
        }).join('');
    } catch (err) {
        console.error('Erro:', err);
        const listEl = document.getElementById('executions-list');
        if (listEl) listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #c17767;">Erro ao carregar dados</div>';
    }
}

// Carregar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', loadTimesheetData);
