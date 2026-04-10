#!/bin/bash
# Deploy Monitor - Script de verificação de deploys GitHub Actions
# Criativalia - Notificador Telegram

set -e

# Configurações
REPO="fernandosilva82/criativalia-mission-control"
STATE_FILE="/root/.openclaw/workspace/criativalia/deploy_notifications.json"
TELEGRAM_CHAT_ID="8601547557"
CONTROL_PLANE_URL="https://criativalia-control-plane.onrender.com"

# Workflows de deploy para monitorar
DEPLOY_WORKFLOWS=(
    "Deploy to Render"
    "Deploy on Opportunities Update"
    "Update Dashboard on Evidence"
)

# Criar diretório se não existir
mkdir -p "$(dirname "$STATE_FILE")"

# Inicializar arquivo de estado se não existir
if [[ ! -f "$STATE_FILE" ]]; then
    echo '{"notified_runs": {}, "last_check": "", "pending_notifications": []}' > "$STATE_FILE"
fi

# Função para verificar se um workflow é de deploy
is_deploy_workflow() {
    local name="$1"
    for wf in "${DEPLOY_WORKFLOWS[@]}"; do
        if [[ "$name" == "$wf" ]]; then
            return 0
        fi
    done
    return 1
}

# Função para enviar notificação via Telegram (usando webhook do OpenClaw)
send_telegram_notification() {
    local message="$1"
    
    # Usar o sistema de mensagens do OpenClaw via gateway
    curl -s -X POST "http://localhost:8080/api/channels/telegram/send" \
        -H "Content-Type: application/json" \
        -d "{\"chat_id\":\"$TELEGRAM_CHAT_ID\",\"text\":\"$message\",\"parse_mode\":\"HTML\"}" 2>/dev/null || true
}

# Buscar runs recentes do GitHub Actions
echo "🔍 Buscando deploys recentes..."
RUNS_JSON=$(curl -s "https://api.github.com/repos/$REPO/actions/runs?per_page=10" 2>/dev/null || echo '{"workflow_runs":[]}')

# Verificar se a API retornou dados válidos
if [[ -z "$RUNS_JSON" ]] || [[ "$RUNS_JSON" == "null" ]]; then
    echo "❌ Erro ao buscar dados da API do GitHub"
    exit 1
fi

# Data/hora atual em ISO format
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Contadores
NEW_NOTIFICATIONS=0
RUNS_CHECKED=0

# Processar cada run
while IFS= read -r run; do
    [[ -z "$run" ]] && continue
    
    RUN_ID=$(echo "$run" | jq -r '.id // empty')
    RUN_NAME=$(echo "$run" | jq -r '.name // "Unknown"')
    STATUS=$(echo "$run" | jq -r '.status // "unknown"')
    CONCLUSION=$(echo "$run" | jq -r '.conclusion // "unknown"')
    HTML_URL=$(echo "$run" | jq -r '.html_url // ""')
    CREATED_AT=$(echo "$run" | jq -r '.created_at // ""')
    UPDATED_AT=$(echo "$run" | jq -r '.updated_at // ""')
    DISPLAY_TITLE=$(echo "$run" | jq -r '.display_title // ""')
    
    ((RUNS_CHECKED++))
    
    # Verificar se é um workflow de deploy
    if ! is_deploy_workflow "$RUN_NAME"; then
        continue
    fi
    
    # Verificar se já foi notificado
    ALREADY_NOTIFIED=$(jq -r ".notified_runs[\"$RUN_ID\"] // empty" "$STATE_FILE" 2>/dev/null || echo "")
    
    if [[ -n "$ALREADY_NOTIFIED" ]]; then
        continue
    fi
    
    # Verificar se está completado
    if [[ "$STATUS" != "completed" ]]; then
        continue
    fi
    
    # Formatar data/hora para exibição
    FORMATTED_TIME=$(date -d "$UPDATED_AT" +"%d/%m/%Y %H:%M" 2>/dev/null || echo "$UPDATED_AT")
    
    # Criar mensagem de notificação
    if [[ "$CONCLUSION" == "success" ]]; then
        MESSAGE="✅ <b>Deploy Concluído com Sucesso!</b>

📦 <b>Workflow:</b> $RUN_NAME
📝 <b>Título:</b> $DISPLAY_TITLE
⏰ <b>Horário:</b> $FORMATTED_TIME UTC
🌐 <b>URL:</b> $CONTROL_PLANE_URL
🔗 <b>Detalhes:</b> $HTML_URL"
    else
        MESSAGE="❌ <b>Deploy Falhou!</b>

📦 <b>Workflow:</b> $RUN_NAME
📝 <b>Título:</b> $DISPLAY_TITLE
⏰ <b>Horário:</b> $FORMATTED_TIME UTC
🔗 <b>Logs:</b> $HTML_URL
⚠️ Verifique os logs para mais detalhes."
    fi
    
    # Enviar notificação
    echo "📨 Notificando deploy $RUN_ID ($RUN_NAME) - $CONCLUSION"
    
    # Salvar mensagem em arquivo temporário para envio
    echo "$MESSAGE" > "/tmp/deploy_notify_$RUN_ID.txt"
    
    # Atualizar arquivo de estado
    jq --arg run_id "$RUN_ID" \
       --arg workflow "$RUN_NAME" \
       --arg conclusion "$CONCLUSION" \
       --arg notified_at "$CURRENT_TIME" \
       '.notified_runs[$run_id] = {
           "workflow": $workflow,
           "conclusion": $conclusion,
           "notified_at": $notified_at
       }' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
    
    ((NEW_NOTIFICATIONS++))
    
done < <(echo "$RUNS_JSON" | jq -c '.workflow_runs[] // empty' 2>/dev/null)

# Atualizar resumo do último check
jq --arg checked_at "$CURRENT_TIME" \
   --argjson runs_checked "$RUNS_CHECKED" \
   --argjson new_notifications "$NEW_NOTIFICATIONS" \
   '.last_check_summary = {
       "checked_at": $checked_at,
       "runs_checked": $runs_checked,
       "new_notifications": $new_notifications,
       "status": "completed",
       "message": (if $new_notifications > 0 then "Novos deploys notificados: " + ($new_notifications | tostring) else "Nenhum novo deploy para notificar" end)
   }' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

echo "✅ Verificação concluída: $RUNS_CHECKED runs verificados, $NEW_NOTIFICATIONS novas notificações"
