#!/bin/bash
# Deploy Monitor Notifier - Criativalia
# Monitora deploys no GitHub Actions e notifica no Telegram

set -e

# Configurações
REPO="fernandosilva82/criativalia-mission-control"
STATE_FILE="/root/.openclaw/workspace/criativalia/deploy_notifications.json"
TELEGRAM_CHAT_ID="8601547557"
GITHUB_API_URL="https://api.github.com/repos/${REPO}/actions/runs"

# Criar diretório se não existir
mkdir -p "$(dirname "$STATE_FILE")"

# Função para enviar mensagem Telegram
send_telegram() {
    local message="$1"
    # Usar o comando message do OpenClaw
    curl -s -X POST "http://localhost:8080/api/message" \
        -H "Content-Type: application/json" \
        -d "{\"action\":\"send\",\"target\":\"${TELEGRAM_CHAT_ID}\",\"message\":\"${message}\"}" 2>/dev/null || true
}

# Ler estado atual
if [ -f "$STATE_FILE" ]; then
    NOTIFIED_RUNS=$(jq -r '.notified_runs // [] | .[]' "$STATE_FILE" 2>/dev/null || echo "")
else
    NOTIFIED_RUNS=""
    echo '{"notified_runs": [], "notifiedDeployments": [], "checkHistory": []}' > "$STATE_FILE"
fi

# Buscar runs do GitHub Actions
RUNS_DATA=$(curl -s "${GITHUB_API_URL}?per_page=10" 2>/dev/null || echo '{"workflow_runs":[]}')

# Data/hora atual
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
NOW_FMT=$(date -u +"%d/%m/%Y %H:%M UTC")

# Contadores
CHECK_COUNT=$(jq -r '.check_count // 0' "$STATE_FILE" 2>/dev/null)
CHECK_COUNT=$((CHECK_COUNT + 1))

NEW_DEPLOYS=0
NOTIFICATIONS_SENT=0
NOTIFIED_LIST=()

# Processar cada run
while IFS= read -r run; do
    [ -z "$run" ] && continue
    
    RUN_ID=$(echo "$run" | jq -r '.id')
    RUN_NAME=$(echo "$run" | jq -r '.name')
    STATUS=$(echo "$run" | jq -r '.status')
    CONCLUSION=$(echo "$run" | jq -r '.conclusion // "unknown"')
    CREATED_AT=$(echo "$run" | jq -r '.created_at')
    HTML_URL=$(echo "$run" | jq -r '.html_url')
    
    # Verificar se é um workflow de deploy
    IS_DEPLOY=false
    case "$RUN_NAME" in
        *"Deploy"*) IS_DEPLOY=true ;;
        *"Update Dashboard"*) IS_DEPLOY=true ;;
    esac
    
    # Ignorar workflows que não são de deploy
    if [ "$IS_DEPLOY" = false ]; then
        continue
    fi
    
    # Verificar se já foi notificado
    ALREADY_NOTIFIED=false
    for notified_id in $NOTIFIED_RUNS; do
        if [ "$RUN_ID" = "$notified_id" ]; then
            ALREADY_NOTIFIED=true
            break
        fi
    done
    
    # Se completado e não notificado
    if [ "$STATUS" = "completed" ] && [ "$ALREADY_NOTIFIED" = false ]; then
        NEW_DEPLOYS=$((NEW_DEPLOYS + 1))
        
        # Formatar data
        RUN_DATE=$(date -d "$CREATED_AT" +"%d/%m/%Y %H:%M" 2>/dev/null || echo "$CREATED_AT")
        
        if [ "$CONCLUSION" = "success" ]; then
            # Notificação de sucesso
            MESSAGE="✅ *Deploy Concluído com Sucesso!*

📦 Workflow: ${RUN_NAME}
⏰ Horário: ${RUN_DATE} UTC
🌐 URL: https://criativalia-control-plane.onrender.com
🔗 Detalhes: ${HTML_URL}"
            
            echo "[$(date '+%H:%M:%S')] ✅ Deploy SUCESSO: $RUN_NAME (ID: $RUN_ID)"
            
        else
            # Notificação de falha
            MESSAGE="❌ *Deploy Falhou!*

📦 Workflow: ${RUN_NAME}
⏰ Horário: ${RUN_DATE} UTC
🔗 Logs: ${HTML_URL}
⚠️ Verifique os logs para mais detalhes."
            
            echo "[$(date '+%H:%M:%S')] ❌ Deploy FALHA: $RUN_NAME (ID: $RUN_ID)"
        fi
        
        # Enviar notificação
        send_telegram "$MESSAGE"
        NOTIFICATIONS_SENT=$((NOTIFICATIONS_SENT + 1))
        
        # Adicionar à lista de notificados
        NOTIFIED_LIST+=("$RUN_ID")
    fi
    
done < <(echo "$RUNS_DATA" | jq -c '.workflow_runs[]' 2>/dev/null || echo "")

# Atualizar arquivo de estado
if [ ${#NOTIFIED_LIST[@]} -gt 0 ]; then
    for run_id in "${NOTIFIED_LIST[@]}"; do
        # Adicionar ao estado
        jq --arg id "$run_id" '.notified_runs += [$id | tonumber]' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
    done
fi

# Adicionar histórico de check
jq --arg time "$NOW" \
   --arg runs_checked "$NEW_DEPLOYS" \
   --arg notifications "$NOTIFICATIONS_SENT" \
   --arg note "Check #${CHECK_COUNT}: ${NOW_FMT}. ${NEW_DEPLOYS} novos deploys, ${NOTIFICATIONS_SENT} notificações." \
   '.checkHistory += [{"timestamp": $time, "new_deploys": ($runs_checked | tonumber), "notifications_sent": ($notifications | tonumber), "note": $note}] | .last_check = $time | .check_count = '${CHECK_COUNT}'' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

# Manter apenas últimos 50 checks no histórico
jq '.checkHistory = (.checkHistory | if length > 50 then .[-50:] else . end)' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

echo "[$(date '+%H:%M:%S')] Check #${CHECK_COUNT} concluído. ${NEW_DEPLOYS} novos deploys, ${NOTIFICATIONS_SENT} notificações enviadas."
