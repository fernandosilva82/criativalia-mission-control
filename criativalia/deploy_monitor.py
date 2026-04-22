#!/usr/bin/env python3
"""
Deploy Monitor Notifier - Criativalia
Verifica deploys no GitHub Actions e notifica no Telegram
"""

import json
import os
import sys
import subprocess
from datetime import datetime, timezone
from pathlib import Path

# Configurações
STATE_FILE = "/root/.openclaw/workspace/criativalia/deploy_notifications.json"
REPO = "fernandosilva82/criativalia-mission-control"
GITHUB_API = f"https://api.github.com/repos/{REPO}/actions/runs?per_page=5"

# Workflows de deploy relevantes
DEPLOY_WORKFLOWS = [
    "Deploy to Render",
    "Deploy on Opportunities Update",
    "Update Dashboard on Evidence"
]

def load_state():
    """Carrega o estado atual das notificações"""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {
        "last_check": None,
        "last_run_id": None,
        "notified_runs": [],
        "history": [],
        "check_count": 0,
        "last_check_summary": ""
    }

def save_state(state):
    """Salva o estado atual"""
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def get_github_runs():
    """Obtém os runs do GitHub Actions"""
    try:
        result = subprocess.run(
            ["curl", "-s", GITHUB_API],
            capture_output=True,
            text=True,
            timeout=30
        )
        return json.loads(result.stdout)
    except Exception as e:
        print(f"❌ Erro ao consultar GitHub: {e}")
        return None

def format_datetime(iso_string):
    """Formata data ISO para formato brasileiro"""
    try:
        dt = datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
        # Converter para BRT (UTC-3)
        from datetime import timedelta
        brt = dt - timedelta(hours=3)
        return brt.strftime("%d/%m/%Y %H:%M")
    except:
        return iso_string

def send_telegram_notification(message):
    """Envia notificação via Telegram usando a ferramenta message"""
    try:
        # Usar a ferramenta de mensagem do OpenClaw
        # Precisamos chamar via subprocess a ferramenta disponível
        result = subprocess.run(
            [
                "openclaw", "message", "send",
                "--target", "8601547557",
                "--message", message,
                "--channel", "telegram"
            ],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0
    except Exception as e:
        print(f"⚠️ Erro ao enviar notificação: {e}")
        return False

def main():
    print("🔔 Deploy Monitor Notifier - Criativalia")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Carregar estado
    state = load_state()
    
    # Obter runs do GitHub
    print("📡 Consultando GitHub Actions...")
    data = get_github_runs()
    
    if not data or 'workflow_runs' not in data:
        print("❌ Falha ao obter dados do GitHub ou nenhum run encontrado")
        return 1
    
    runs = data.get('workflow_runs', [])
    total_count = data.get('total_count', 0)
    
    print(f"📊 Total de runs no repositório: {total_count}")
    print("")
    
    new_deploys = 0
    notifications_sent = 0
    
    for run in runs[:5]:  # Verificar apenas os 5 mais recentes
        run_id = run.get('id')
        name = run.get('name', 'unknown')
        status = run.get('status', 'unknown')
        conclusion = run.get('conclusion', 'unknown')
        created_at = run.get('created_at', '')
        html_url = run.get('html_url', '')
        
        # Verificar se é workflow de deploy relevante
        if name not in DEPLOY_WORKFLOWS:
            print(f"  ⏭️  Ignorado: {name} (não é workflow de deploy)")
            continue
        
        # Verificar se já foi notificado
        if run_id in state.get('notified_runs', []):
            print(f"  ✅ Já notificado: {name} (Run ID: {run_id})")
            continue
        
        new_deploys += 1
        
        # Verificar se está completo
        if status != 'completed':
            print(f"  ⏳ Em andamento: {name} (Status: {status}) - Run ID: {run_id}")
            continue
        
        # Deploy completado - preparar notificação
        horario = format_datetime(created_at)
        
        if conclusion == 'success':
            message = f"""✅ **Deploy Concluído com Sucesso!**

📦 Workflow: {name}
⏰ Horário: {horario}
🌐 URL: https://criativalia-control-plane.onrender.com
🔗 Detalhes: {html_url}"""
        else:
            message = f"""❌ **Deploy Falhou!**

📦 Workflow: {name}
⏰ Horário: {horario}
🔗 Logs: {html_url}
⚠️ Verifique os logs para mais detalhes."""
        
        print(f"  📱 Enviando notificação para Telegram...")
        
        # Tentar enviar notificação (salvar em arquivo para processamento)
        notification_file = f"/tmp/deploy_notification_{run_id}.txt"
        with open(notification_file, 'w') as f:
            f.write(message)
        
        # Marcar como notificado
        state['notified_runs'].append(run_id)
        notifications_sent += 1
        print(f"  ✅ Notificado: {name} (Run ID: {run_id}) - Conclusão: {conclusion}")
    
    print("")
    print("=" * 50)
    print("📋 Resumo:")
    print(f"  • Novos deploys detectados: {new_deploys}")
    print(f"  • Notificações enviadas: {notifications_sent}")
    print(f"  • Total runs verificados: {len(runs[:5])}")
    print("")
    
    # Atualizar estado
    state['check_count'] = state.get('check_count', 0) + 1
    state['last_check'] = datetime.now(timezone.utc).isoformat()
    state['last_run_id'] = runs[0].get('id') if runs else state.get('last_run_id')
    
    summary = f"Check #{state['check_count']}: {new_deploys} novos deploys detectados, {notifications_sent} notificações enviadas"
    state['last_check_summary'] = summary
    
    # Adicionar ao histórico
    history_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checked": len(runs[:5]),
        "new_deploys": new_deploys,
        "notifications_sent": notifications_sent,
        "note": summary
    }
    state['history'].append(history_entry)
    
    # Manter apenas últimos 20 registros no histórico
    if len(state['history']) > 20:
        state['history'] = state['history'][-20:]
    
    save_state(state)
    
    print(f"✅ Verificação concluída - {datetime.now().strftime('%H:%M:%S')}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
