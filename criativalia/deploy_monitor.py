#!/usr/bin/env python3
"""
Deploy Monitor Notifier - Criativalia
Monitora deploys no GitHub Actions e notifica no Telegram.
"""

import json
import urllib.request
import urllib.error
import os
from datetime import datetime, timezone

# Configurações
GITHUB_REPO = "fernandosilva82/criativalia-mission-control"
STATE_FILE = "/root/.openclaw/workspace/criativalia/deploy_notifications.json"
TELEGRAM_CHAT_ID = "8601547557"
CONTROL_PLANE_URL = "https://criativalia-control-plane.onrender.com"

# Workflows de deploy para monitorar
DEPLOY_WORKFLOWS = [
    "Deploy to Render",
    "Deploy on Opportunities Update",
    "Update Dashboard on Evidence"
]

def load_state():
    """Carrega o estado atual das notificações."""
    try:
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "last_checked": None,
            "notified_runs": [],
            "last_check_summary": {}
        }

def save_state(state):
    """Salva o estado das notificações."""
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def get_github_workflows():
    """Consulta workflows recentes no GitHub Actions."""
    url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs?per_page=10"
    try:
        req = urllib.request.Request(url, headers={
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Deploy-Monitor/1.0'
        })
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Erro ao consultar GitHub API: {e}")
        return None

def is_notified(run_id, state):
    """Verifica se um run já foi notificado."""
    return any(n.get('run_id') == run_id for n in state['notified_runs'])

def format_time(iso_time):
    """Formata horário ISO para formato legível."""
    try:
        dt = datetime.fromisoformat(iso_time.replace('Z', '+00:00'))
        return dt.strftime('%d/%m/%Y %H:%M UTC')
    except:
        return iso_time

def send_telegram_message(message):
    """Envia mensagem para o Telegram via OpenClaw message tool."""
    # Escreve mensagem em arquivo temporário para ser lida pelo sistema
    notification_file = "/tmp/deploy_notification.txt"
    with open(notification_file, 'w') as f:
        f.write(message)
    print(f"NOTIFICATION_READY: {notification_file}")
    return True

def process_deploys():
    """Processa deploys e envia notificações."""
    state = load_state()
    workflows_data = get_github_workflows()
    
    if not workflows_data:
        print("❌ Falha ao obter dados do GitHub")
        return
    
    workflow_runs = workflows_data.get('workflow_runs', [])
    new_notifications = []
    notifications_to_send = []
    
    for run in workflow_runs:
        run_id = run['id']
        workflow_name = run['name']
        status = run['status']
        conclusion = run.get('conclusion', 'unknown')
        html_url = run['html_url']
        created_at = run['created_at']
        
        # Só processa workflows de deploy
        if workflow_name not in DEPLOY_WORKFLOWS:
            continue
        
        # Só processa runs completados
        if status != 'completed':
            continue
        
        # Verifica se já foi notificado
        if is_notified(run_id, state):
            continue
        
        # É um novo deploy concluído - prepara notificação
        time_str = format_time(created_at)
        
        if conclusion == 'success':
            message = f"""✅ **Deploy Concluído com Sucesso!**

📦 Workflow: {workflow_name}
⏰ Horário: {time_str}
🌐 URL: {CONTROL_PLANE_URL}
🔗 Detalhes: {html_url}"""
        else:
            message = f"""❌ **Deploy Falhou!**

📦 Workflow: {workflow_name}
⏰ Horário: {time_str}
🔗 Logs: {html_url}
⚠️ Verifique os logs para mais detalhes."""
        
        notification = {
            'run_id': run_id,
            'workflow': workflow_name,
            'conclusion': conclusion,
            'notified_at': datetime.now(timezone.utc).isoformat()
        }
        
        new_notifications.append(notification)
        notifications_to_send.append(message)
        
        print(f"📝 Novo deploy detectado: {workflow_name} ({conclusion})")
    
    # Envia notificações
    for message in notifications_to_send:
        send_telegram_message(message)
    
    # Atualiza estado
    state['notified_runs'].extend(new_notifications)
    state['last_checked'] = datetime.now(timezone.utc).isoformat()
    state['last_check_summary'] = {
        'checked_at': state['last_checked'],
        'total_runs_found': len(workflow_runs),
        'new_notifications': len(new_notifications),
        'message': f"{len(new_notifications)} novo(s) deploy(s) notificado(s)." if new_notifications else "Nenhum novo deploy detectado."
    }
    
    save_state(state)
    
    # Gera resumo para o cron
    summary = state['last_check_summary']
    print(f"\n📊 Resumo: {summary['message']}")
    print(f"   Total runs verificados: {summary['total_runs_found']}")
    print(f"   Novas notificações: {summary['new_notifications']}")
    
    return len(new_notifications)

if __name__ == "__main__":
    print("🔔 Deploy Monitor Notifier - Criativalia")
    print(f"⏰ Execução: {datetime.now(timezone.utc).isoformat()}")
    print("-" * 50)
    
    try:
        count = process_deploys()
        if count and count > 0:
            # Indica que há notificações pendentes
            exit(0)
        exit(0)
    except Exception as e:
        print(f"❌ Erro durante execução: {e}")
        exit(1)
