#!/usr/bin/env python3
"""
Deploy Monitor Notifier - Criativalia
Monitora deploys no GitHub Actions e notifica no Telegram.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
import urllib.request
import urllib.error

# Configurações
REPO = "fernandosilva82/criativalia-mission-control"
STATE_FILE = Path("/root/.openclaw/workspace/criativalia/deploy_notifications.json")
TELEGRAM_CHAT_ID = "8601547557"
CONTROL_PLANE_URL = "https://criativalia-control-plane.onrender.com"
GITHUB_API_URL = f"https://api.github.com/repos/{REPO}/actions/runs"

# Workflows de deploy para monitorar
DEPLOY_WORKFLOWS = [
    "Deploy to Render",
    "Deploy on Opportunities Update", 
    "Update Dashboard on Evidence"
]

# Workflows para ignorar
IGNORE_WORKFLOWS = [
    "pages build",
    "notify-deploy.yml",
    "Notify Deploy Status"
]


def load_state():
    """Carrega o estado das notificações."""
    if STATE_FILE.exists():
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {
        "last_check": None,
        "check_count": 0,
        "notified_runs": [],
        "notifiedDeployments": [],
        "checkHistory": [],
        "ignored": []
    }


def save_state(state):
    """Salva o estado das notificações."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)


def fetch_github_runs(per_page=10):
    """Busca runs do GitHub Actions."""
    url = f"{GITHUB_API_URL}?per_page={per_page}"
    try:
        req = urllib.request.Request(url, headers={
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Criativalia-DeployMonitor/1.0'
        })
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode())
            return data.get('workflow_runs', [])
    except Exception as e:
        print(f"❌ Erro ao buscar runs do GitHub: {e}")
        return []


def is_deploy_workflow(name):
    """Verifica se é um workflow de deploy."""
    name_lower = name.lower()
    # Ignorar explicitamente
    for ignore in IGNORE_WORKFLOWS:
        if ignore.lower() in name_lower:
            return False
    # Verificar se é deploy
    for deploy in DEPLOY_WORKFLOWS:
        if deploy.lower() in name_lower:
            return True
    return False


def format_telegram_message(run, conclusion):
    """Formata mensagem para Telegram."""
    name = run['name']
    run_id = run['id']
    html_url = run['html_url']
    created_at = run['created_at']
    
    # Formatar data
    try:
        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        formatted_date = dt.strftime('%d/%m/%Y %H:%M UTC')
    except:
        formatted_date = created_at
    
    if conclusion == 'success':
        return f"""✅ **Deploy Concluído com Sucesso!**

📦 Workflow: {name}
⏰ Horário: {formatted_date}
🌐 URL: {CONTROL_PLANE_URL}
🔗 Detalhes: {html_url}"""
    else:
        return f"""❌ **Deploy Falhou!**

📦 Workflow: {name}
⏰ Horário: {formatted_date}
🔗 Logs: {html_url}
⚠️ Verifique os logs para mais detalhes."""


def print_notification(run, conclusion):
    """Imprime notificação no formato que o OpenClaw pode capturar."""
    name = run['name']
    run_id = run['id']
    html_url = run['html_url']
    created_at = run['created_at']
    
    # Formatar data
    try:
        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        formatted_date = dt.strftime('%d/%m/%Y %H:%M UTC')
    except:
        formatted_date = created_at
    
    if conclusion == 'success':
        icon = "✅"
        status_text = "SUCESSO"
    else:
        icon = "❌"
        status_text = "FALHA"
    
    print(f"\n{'='*60}")
    print(f"📢 NOTIFICAÇÃO TELEGRAM - Deploy {status_text}")
    print(f"{'='*60}")
    print(f"{icon} Workflow: {name}")
    print(f"🆔 Run ID: {run_id}")
    print(f"⏰ Horário: {formatted_date}")
    print(f"🔗 URL: {html_url}")
    print(f"{'='*60}\n")
    
    # Formato especial para facilitar parsing
    print(f"::NOTIFICATION::{name}|{run_id}|{conclusion}|{html_url}|{formatted_date}::")


def main():
    """Função principal do monitor."""
    print(f"🔍 Deploy Monitor - Criativalia")
    print(f"⏰ Iniciado em: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"📁 Estado: {STATE_FILE}")
    print(f"🔄 Buscando runs do GitHub...\n")
    
    # Carregar estado
    state = load_state()
    
    # Incrementar contador de checks
    state['check_count'] = state.get('check_count', 0) + 1
    check_count = state['check_count']
    
    # Buscar runs
    runs = fetch_github_runs(per_page=10)
    
    if not runs:
        print("⚠️ Nenhum run encontrado ou erro na API")
        return
    
    print(f"📊 Total de runs encontrados: {len(runs)}\n")
    
    # Runs já notificados
    notified_ids = set(state.get('notified_runs', []))
    
    new_deploys = 0
    notifications_sent = 0
    
    for run in runs:
        run_id = run['id']
        name = run['name']
        status = run['status']
        conclusion = run.get('conclusion', 'unknown')
        
        # Verificar se é workflow de deploy
        if not is_deploy_workflow(name):
            print(f"⏭️  Ignorado: {name} (ID: {run_id}) - não é deploy")
            if run_id not in state.get('ignored', []):
                state.setdefault('ignored', []).append(run_id)
            continue
        
        print(f"📋 Workflow: {name}")
        print(f"   ID: {run_id} | Status: {status} | Conclusion: {conclusion}")
        
        # Verificar se já foi notificado
        if run_id in notified_ids:
            print(f"   ✅ Já notificado anteriormente")
            continue
        
        # Se estiver completo
        if status == 'completed':
            new_deploys += 1
            
            print(f"   🔔 NOVO DEPLOY CONCLUÍDO! Enviando notificação...")
            
            # Imprimir notificação (para ser capturada pelo agente)
            print_notification(run, conclusion)
            
            # Adicionar aos notificados
            notified_ids.add(run_id)
            state['notified_runs'] = list(notified_ids)
            
            # Adicionar detalhes do deployment
            deployment_info = {
                "id": run_id,
                "name": name,
                "conclusion": conclusion,
                "notified_at": datetime.now(timezone.utc).isoformat(),
                "html_url": run['html_url']
            }
            state.setdefault('notifiedDeployments', []).append(deployment_info)
            
            notifications_sent += 1
            print(f"   ✅ Marcado como notificado\n")
        else:
            print(f"   ⏳ Status: {status} - aguardando conclusão\n")
    
    # Atualizar estado
    now = datetime.now(timezone.utc)
    state['last_check'] = now.isoformat()
    
    # Adicionar ao histórico
    history_entry = {
        "timestamp": now.isoformat(),
        "runs_checked": len(runs),
        "new_deploys": new_deploys,
        "notifications_sent": notifications_sent,
        "note": f"Check #{check_count}: {new_deploys} novos deploys, {notifications_sent} notificações"
    }
    state.setdefault('checkHistory', []).append(history_entry)
    
    # Manter apenas últimos 50 checks
    if len(state['checkHistory']) > 50:
        state['checkHistory'] = state['checkHistory'][-50:]
    
    save_state(state)
    
    print(f"\n{'='*60}")
    print(f"✅ Check #{check_count} concluído")
    print(f"📊 Novos deploys: {new_deploys}")
    print(f"📨 Notificações: {notifications_sent}")
    print(f"🕐 Próximo check: em 5 minutos")
    print(f"{'='*60}")
    
    # Retornar quantidade de notificações para o agente
    return notifications_sent


if __name__ == "__main__":
    try:
        result = main()
        sys.exit(0 if result is not None else 1)
    except Exception as e:
        print(f"❌ Erro fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
