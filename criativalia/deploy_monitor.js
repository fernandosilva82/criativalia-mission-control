/**
 * Criativalia Deploy Monitor
 * Verifica deploys recentes no GitHub Actions e notifica no Telegram
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configurações
const CONFIG = {
  github: {
    owner: 'fernandosilva82',
    repo: process.env.GITHUB_REPO || 'criativalia-control-plane',
    token: process.env.GITHUB_TOKEN || null
  },
  telegram: {
    chatId: '8601547557'
  },
  stateFile: path.join(__dirname, 'deploy_notifications.json')
};

// Carregar estado anterior
function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      const data = fs.readFileSync(CONFIG.stateFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao carregar estado:', err.message);
  }
  return {
    lastChecked: null,
    notifiedRuns: []
  };
}

// Salvar estado
function saveState(state) {
  try {
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
    console.log('✅ Estado salvo em:', CONFIG.stateFile);
  } catch (err) {
    console.error('❌ Erro ao salvar estado:', err.message);
  }
}

// Fazer requisição HTTP
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Criativalia-Deploy-Monitor',
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers
    };

    if (CONFIG.github.token) {
      headers['Authorization'] = `token ${CONFIG.github.token}`;
    }

    const client = url.startsWith('https:') ? https : require('http');
    const req = client.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Buscar runs do GitHub Actions
async function fetchWorkflowRuns() {
  const url = `https://api.github.com/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/actions/runs?per_page=10`;
  console.log('🔍 Buscando workflow runs...');
  
  try {
    const response = await httpRequest(url);
    if (response.statusCode === 200 && response.data.workflow_runs) {
      return response.data.workflow_runs;
    }
    console.log('⚠️ Resposta inesperada:', response.statusCode);
    return [];
  } catch (err) {
    console.error('❌ Erro ao buscar runs:', err.message);
    return [];
  }
}

// Formatar data
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Formatar duração
function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

// Verificar e notificar novos deploys
async function checkAndNotify() {
  const state = loadState();
  const runs = await fetchWorkflowRuns();
  
  if (runs.length === 0) {
    console.log('ℹ️ Nenhuma run encontrada ou erro na API');
    return { notified: 0, runs: [] };
  }

  const completedStatuses = ['completed', 'success', 'failure', 'cancelled'];
  const completedRuns = runs.filter(run => 
    completedStatuses.includes(run.status) || 
    completedStatuses.includes(run.conclusion)
  );

  console.log(`📊 Encontradas ${completedRuns.length} runs concluídas`);

  const newRuns = completedRuns.filter(run => {
    // Verificar se já foi notificado
    const alreadyNotified = (state.notifiedRuns || []).includes(run.id);
    const afterLastCheck = !state.lastChecked || 
      new Date(run.updated_at) > new Date(state.lastChecked);
    return !alreadyNotified && afterLastCheck;
  });

  console.log(`🆕 ${newRuns.length} novas runs para notificar`);

  const notifications = [];

  for (const run of newRuns) {
    const status = run.conclusion || run.status;
    const emoji = status === 'success' ? '✅' : 
                  status === 'failure' ? '❌' : 
                  status === 'cancelled' ? '⚠️' : '⏹️';
    
    const message = {
      type: 'deploy',
      chatId: CONFIG.telegram.chatId,
      text: `${emoji} **Deploy ${status.toUpperCase()}**\n\n` +
            `📝 **Workflow:** ${run.name}\n` +
            `🏷️ **Branch:** ${run.head_branch}\n` +
            `👤 **Autor:** ${run.actor.login}\n` +
            `⏱️ **Duração:** ${formatDuration(run.run_duration_ms / 1000)}\n` +
            `📅 **Data:** ${formatDate(run.updated_at)}\n\n` +
            `🔗 [Ver no GitHub](${run.html_url})`,
      runId: run.id,
      status: status,
      workflow: run.name,
      branch: run.head_branch,
      author: run.actor.login,
      date: run.updated_at
    };

    notifications.push(message);
    
    // Adicionar à lista de notificados
    if (!state.notifiedRuns) state.notifiedRuns = [];
    if (!state.notifiedRuns.includes(run.id)) {
      state.notifiedRuns.push(run.id);
    }
    
    // Limitar histórico a 50 runs
    if (state.notifiedRuns.length > 50) {
      state.notifiedRuns = state.notifiedRuns.slice(-50);
    }
  }

  // Atualizar timestamp
  state.lastChecked = new Date().toISOString();
  saveState(state);

  return { 
    notified: notifications.length, 
    runs: notifications,
    state: state
  };
}

// Função para enviar notificação (saída em formato que pode ser consumido)
function outputNotification(notification) {
  // Saída em formato estruturado para facilitar parsing
  console.log('\n=== NOTIFICATION ===');
  console.log(JSON.stringify(notification, null, 2));
  console.log('=== END NOTIFICATION ===\n');
}

// Execução principal
async function main() {
  console.log('🚀 Criativalia Deploy Monitor');
  console.log('⏰', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  console.log('─'.repeat(50));

  const result = await checkAndNotify();

  console.log('\n📋 Resumo:');
  console.log(`   Novos deploys: ${result.notified}`);
  
  if (result.notified > 0) {
    console.log('\n📤 Notificações geradas:');
    for (const notif of result.runs) {
      outputNotification(notif);
    }
  } else {
    console.log('   ℹ️ Nenhum deploy novo para notificar');
  }

  console.log('\n✅ Monitoramento concluído');
  
  // Retornar resultado em formato JSON para processamento externo
  return result;
}

// Executar
main()
  .then(result => {
    // Saída final em JSON para o sistema capturar
    console.log('\n=== RESULT ===');
    console.log(JSON.stringify({
      success: true,
      notified: result.notified,
      runs: result.runs.map(r => ({
        runId: r.runId,
        status: r.status,
        workflow: r.workflow,
        branch: r.branch
      }))
    }));
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Erro fatal:', err);
    console.log('\n=== RESULT ===');
    console.log(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  });
