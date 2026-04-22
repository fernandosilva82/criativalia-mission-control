#!/bin/bash
# Deploy Monitor Notifier - Criativalia (Versão Integrada)
# Este script é chamado pelo cron job a cada 5 minutos

STATE_FILE="/root/.openclaw/workspace/criativalia/deploy_notifications.json"
REPO="fernandosilva82/criativalia-mission-control"
GITHUB_API="https://api.github.com/repos/${REPO}/actions/runs?per_page=5"

LOG_FILE="/tmp/deploy_monitor_$(date +%Y%m%d).log"

echo "🔔 Deploy Monitor Notifier - $(date '+%Y-%m-%d %H:%M:%S %Z')" | tee -a "$LOG_FILE"
echo "================================================" | tee -a "$LOG_FILE"

# Workflows de deploy relevantes
DEPLOY_WORKFLOWS=("Deploy to Render" "Deploy on Opportunities Update" "Update Dashboard on Evidence")

# Obter runs do GitHub
echo "📡 Consultando GitHub Actions..." | tee -a "$LOG_FILE"
RESPONSE=$(curl -s "${GITHUB_API}")

if [ -z "$RESPONSE" ] || [ "$RESPONSE" = "null" ]; then
    echo "❌ Falha ao obter dados do GitHub" | tee -a "$LOG_FILE"
    exit 1
fi

# Verificar se o jq está disponível
if ! command -v jq &> /dev/null; then
    echo "❌ jq não está instalado. Instalando..." | tee -a "$LOG_FILE"
    apt-get update && apt-get install -y jq
fi

# Criar arquivo de estado se não existir
if [ ! -f "$STATE_FILE" ]; then
    echo '{"last_check": null, "last_run_id": null, "notified_runs": [], "history": [], "check_count": 0, "last_check_summary": ""}' > "$STATE_FILE"
fi

TOTAL_RUNS=$(echo "$RESPONSE" | jq -r '.total_count // 0')
echo "📊 Total de runs no repositório: ${TOTAL_RUNS}" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Processar runs
NEW_DEPLOYS=0
NOTIFICATIONS=0
CHECK_COUNT=$(jq -r '.check_count // 0' "$STATE_FILE")
CHECK_COUNT=$((CHECK_COUNT + 1))

# Criar array de notificações pendentes
declare -a PENDING_MESSAGES
declare -a PENDING_RUN_IDS

for i in {0..4}; do
    RUN=$(echo "$RESPONSE" | jq -r ".workflow_runs[$i]")
    if [ -z "$RUN" ] || [ "$RUN" = "null" ]; then
        continue
    fi
    
    RUN_ID=$(echo "$RUN" | jq -r '.id // 0')
    NAME=$(echo "$RUN" | jq -r '.name // "unknown"')
    STATUS=$(echo "$RUN" | jq -r '.status // "unknown"')
    CONCLUSION=$(echo "$RUN" | jq -r '.conclusion // "unknown"')
    CREATED_AT=$(echo "$RUN" | jq -r '.created_at // "unknown"')
    HTML_URL=$(echo "$RUN" | jq -r '.html_url // "unknown"')
    
    # Verificar se é workflow de deploy
    IS_DEPLOY=false
    for WF in "${DEPLOY_WORKFLOWS[@]}"; do
        if [ "$NAME" = "$WF" ]; then
            IS_DEPLOY=true
            break
        fi
    done
    
    if [ "$IS_DEPLOY" = false ]; then
        echo "  ⏭️  Ignorado: $NAME (não é workflow de deploy)" | tee -a "$LOG_FILE"
        continue
    fi
    
    # Verificar se já foi notificado
    ALREADY_NOTIFIED=false
    if jq -e --arg id "$RUN_ID" '.notified_runs | contains([($id | tonumber)])' "$STATE_FILE" > /dev/null 2>&1; then
        ALREADY_NOTIFIED=true
    fi
    
    if [ "$ALREADY_NOTIFIED" = true ]; then
        echo "  ✅ Já notificado: $NAME (Run ID: $RUN_ID)" | tee -a "$LOG_FILE"
        continue
    fi
    
    NEW_DEPLOYS=$((NEW_DEPLOYS + 1))
    
    # Verificar status
    if [ "$STATUS" != "completed" ]; then
        echo "  ⏳ Em andamento: $NAME (Status: $STATUS) - Run ID: $RUN_ID" | tee -a "$LOG_FILE"
        continue
    fi
    
    # Formatar data para BRT (UTC-3)
    HORARIO=$(date -d "$CREATED_AT" '+%d/%m/%Y %H:%M' 2>/dev/null || echo "$CREATED_AT")
    
    # Preparar mensagem
    if [ "$CONCLUSION" = "success" ]; then
        MESSAGE="✅ *Deploy Concluído com Sucesso!*

📦 Workflow: ${NAME}
⏰ Horário: ${HORARIO}
🌐 URL: https://criativalia-control-plane.onrender.com
🔗 Detalhes: ${HTML_URL}"
    else
        MESSAGE="❌ *Deploy Falhou!*

📦 Workflow: ${NAME}
⏰ Horário: ${HORARIO}
🔗 Logs: ${HTML_URL}
⚠️ Verifique os logs para mais detalhes."
    fi
    
    echo "  📱 Preparando notificação: $NAME (Run ID: $RUN_ID)" | tee -a "$LOG_FILE"
    
    # Salvar mensagem e run_id para envio posterior
    PENDING_MESSAGES+=("$MESSAGE")
    PENDING_RUN_IDS+=("$RUN_ID")
    
    NOTIFICATIONS=$((NOTIFICATIONS + 1))
    echo "  ✅ Notificação pronta: $NAME - Conclusão: $CONCLUSION" | tee -a "$LOG_FILE"
done

echo "" | tee -a "$LOG_FILE"
echo "================================================" | tee -a "$LOG_FILE"
echo "📋 Resumo da Verificação #${CHECK_COUNT}:" | tee -a "$LOG_FILE"
echo "  • Novos deploys detectados: ${NEW_DEPLOYS}" | tee -a "$LOG_FILE"
echo "  • Notificações preparadas: ${NOTIFICATIONS}" | tee -a "$LOG_FILE"
echo "  • Total runs verificados: 5" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Atualizar estado com as novas notificações
for RUN_ID in "${PENDING_RUN_IDS[@]}"; do
    jq --arg id "$RUN_ID" '.notified_runs += [($id | tonumber)]' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
done

# Atualizar histórico
SUMMARY="Check #${CHECK_COUNT}: ${NEW_DEPLOYS} novos deploys, ${NOTIFICATIONS} notificações"
jq --arg time "$(date -Iseconds)" \
   --argjson count "$CHECK_COUNT" \
   --argjson new "$NEW_DEPLOYS" \
   --argjson notif "$NOTIFICATIONS" \
   --arg summary "$SUMMARY" \
   '.last_check = $time | .check_count = $count | .last_check_summary = $summary | .history += [{"timestamp": $time, "checked": 5, "new_deploys": $new, "notifications_sent": $notif, "note": $summary}]' \
   "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

# Manter apenas últimos 20 registros no histórico
jq '.history = (.history | if length > 20 then .[-20:] else . end)' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

# Atualizar last_run_id
LATEST_RUN=$(echo "$RESPONSE" | jq -r '.workflow_runs[0].id // 0')
jq --arg id "$LATEST_RUN" '.last_run_id = ($id | tonumber)' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

echo "✅ Verificação concluída - $(date '+%H:%M:%S')" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Exportar notificações pendentes para processamento pelo agente OpenClaw
if [ ${#PENDING_MESSAGES[@]} -gt 0 ]; then
    echo "📤 Exportando ${#PENDING_MESSAGES[@]} notificações pendentes..." | tee -a "$LOG_FILE"
    
    # Criar arquivo de notificações pendentes
    PENDING_FILE="/tmp/deploy_notifications_pending_$(date +%s).json"
    echo '{"notifications": [' > "$PENDING_FILE"
    
    for i in "${!PENDING_MESSAGES[@]}"; do
        if [ $i -gt 0 ]; then
            echo "," >> "$PENDING_FILE"
        fi
        echo "{\"run_id\": ${PENDING_RUN_IDS[$i]}, \"message\": $(echo "${PENDING_MESSAGES[$i]}" | jq -Rs .)}" >> "$PENDING_FILE"
    done
    
    echo ']}' >> "$PENDING_FILE"
    
    echo "📝 Notificações exportadas para: $PENDING_FILE" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo "⚠️ NOTIFICAÇÕES PENDENTES:" | tee -a "$LOG_FILE"
    echo "=============================" | tee -a "$LOG_FILE"
    
    for MSG in "${PENDING_MESSAGES[@]}"; do
        echo "" | tee -a "$LOG_FILE"
        echo "$MSG" | tee -a "$LOG_FILE"
        echo "" | tee -a "$LOG_FILE"
        echo "----------------------------" | tee -a "$LOG_FILE"
    done
fi
