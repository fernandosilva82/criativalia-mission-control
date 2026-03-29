// Kanban - Carrega dados reais do OpenClaw Cron
async function loadKanbanTasks() {
    try {
        const response = await fetch('/api/cron/tasks');
        const data = await response.json();
        const tasks = data.tasks || [];
        
        const columns = [
            { id: 'backlog', title: 'Backlog', color: '#4A5D23' },
            { id: 'todo', title: 'A Fazer', color: '#D4A853' },
            { id: 'inprogress', title: 'Em Progresso', color: '#7a9e7e' },
            { id: 'review', title: 'Revisão', color: '#c17767' },
            { id: 'done', title: 'Concluído', color: '#5A6D33' }
        ];
        
        columns.forEach(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            const container = document.getElementById('col-' + col.id);
            const countEl = document.getElementById('count-' + col.id);
            
            if (countEl) countEl.textContent = colTasks.length;
            
            if (container) {
                if (colTasks.length === 0) {
                    container.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #7a7a6a; font-size: 14px;">Nenhuma tarefa</div>';
                } else {
                    container.innerHTML = colTasks.map(task => {
                        const colors = {
                            strategy: '#D4A853', marketing: '#7a9e7e', design: '#c17767',
                            operations: '#4A5D23', devops: '#5A6D33', analytics: '#7a7a6a', general: '#D4A853'
                        };
                        const catColor = colors[task.category] || colors.general;
                        
                        return '<div style="background: #252520; border: 1px solid #3A4D13; border-radius: 8px; padding: 12px; margin-bottom: 8px;">' +
                            '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">' +
                                '<span style="font-size: 11px; background: ' + catColor + '20; color: ' + catColor + '; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">' + task.category + '</span>' +
                                '<span style="font-size: 11px; color: #D4A853;">P' + task.priority + '</span>' +
                            '</div>' +
                            '<div style="font-weight: 500; margin-bottom: 8px; font-size: 14px; color: #F5F5DC;">' + task.title + '</div>' +
                            '<div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #7a9e7e;">' +
                                '<span><i class="fas fa-robot" style="margin-right: 4px;"></i>' + task.agent + '</span>' +
                            '</div>' +
                            (task.schedule ? '<div style="font-size: 10px; color: #5A6D33; margin-top: 4px;"><i class="fas fa-clock" style="margin-right: 4px;"></i>' + task.schedule + '</div>' : '') +
                        '</div>';
                    }).join('');
                }
            }
        });
    } catch (err) {
        console.error('Erro ao carregar tarefas:', err);
        document.getElementById('kanban-board').innerHTML = '<div style="text-align: center; padding: 40px; color: #c17767;">Erro ao carregar tarefas</div>';
    }
}

// Carregar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', loadKanbanTasks);
