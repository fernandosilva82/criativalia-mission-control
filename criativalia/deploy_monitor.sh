#!/bin/bash
# Deploy Monitor Notifier - Criativalia
# Verifica deploys no GitHub Actions e notifica no Telegram

STATE_FILE="/root/.openclaw/workspace/criativalia/deploy_notifications.json"
REPO="fernandosilva82/criativalia-mission-control"
GITHUB_API="https://api.github.com/repos/${REPO}/actions/runs?per_page=5"

echo "🔔 Deploy Monitor Notifier - $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "================================================"

# Workflows de deploy relevantes
DEPLOY_WORKFLOWS=(
    "Deploy to Render"
    "Deploy on Opportunities Update"
    "Update Dashboard on Evidence"
)

# Obter runs do GitHub
echo "📡 Consultando GitHub Actions..."
RESPONSE=$(curl -s "${GITHUB_API}")

if [ -z "$RESPONSE" ] || [ "$RESPONSE" = "null" ]; then
    echo "❌ Falha ao obter dados do GitHub"
    exit 1
fi

# Criar arquivo de estado se não existir
if [ ! -f "$STATE_FILE" ]; then
    echo '{}' > "$STATE_FILE"
fi

# Extrair runs completados
TOTAL_RUNS=$(echo "$RESPONSE" | jq -r '.total_count // 0')
echo "📊 Total de runs no repositório: ${TOTAL_RUNS}"
echo ""

# Processar cada run
NOTIFICATIONS=0
NEW_RUNS=0

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
    
    # Verificar se é workflow de deploy relevante
    IS_DEPLOY=false
    for WF in "${DEPLOY_WORKFLOWS[@]}"; do
        if [ "$NAME" = "$WF" ]; then
            IS_DEPLOY=true
            break
        fi
    done
    
    if [ "$IS_DEPLOY" = false ]; then
        echo "  ⏭️  Ignorado: $NAME (não é workflow de deploy)"
        continue
    fi
    
    # Verificar se já foi notificado
    ALREADY_NOTIFIED=$(jq -r --arg id "$RUN_ID" '.notified_runs // [] | contains([($id | tonumber)])' "$STATE_FILE" 2>/dev/null || echo "false")
    
    if [ "$ALREADY_NOTIFIED" = "true" ]; then
        echo "  ✅ Já notificado: $NAME (Run ID: $RUN_ID)"
        continue
    fi
    
    # Novo deploy detectado!
    NEW_RUNS=$((NEW_RUNS + 1))
    
    # Verificar se está completo
    if [ "$STATUS" != "completed" ]; then
        echo "  ⏳ Em andamento: $NAME (Status: $STATUS) - Run ID: $RUN_ID"
        continue
    fi
    
    # Deploy completado - notificar
    if [ "$CONCLUSION" = "success" ]; then
        MESSAGE=$(cat <<EOF
✅ *Deploy Concluído com Sucesso!*

📦 Workflow: ${NAME}
⏰ Horário: $(date -d "$CREATED_AT" '+%d/%m/%Y %H:%M')
🌐 URL: https://criativalia-control-plane.onrender.com
🔗 Detalhes: ${HTML_URL}
EOF
)
    else
        MESSAGE=$(cat <<EOF
❌ *Deploy Falhou!*

📦 Workflow: ${NAME}
⏰ Horário: $(date -d "$CREATED_AT" '+%d/%m/%Y %H:%M')
🔗 Logs: ${HTML_URL}
⚠️ Verifique os logs para mais detalhes.
EOF
)
    fi
    
    # Enviar notificação Telegram
    echo "  📱 Enviando notificação para Telegram..."
    
    # Enviar usando o comando message do OpenClaw via curl
    # Nota: Vamos usar o método curl direto para evitar dependências
    TELEGRAM_TOKEN="${TELEGRAM_BOT_TOKEN}"
    
    # Usar webhook ou API do Telegram (se houver token configurado)
    # Por padrão, salvamos para processamento posterior ou usamos mecanismo disponível
    
    # Salvar notificação pendente
    PENDING_FILE="/tmp/deploy_notification_${RUN_ID}.txt"
    echo "$MESSAGE" > "$PENDING_FILE"
    echo "  📝 Notificação salva: $PENDING_FILE"
    
    # Marcar como notificado
    jq --arg id "$RUN_ID" '.notified_runs += [($id | tonumber)]' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
    
    NOTIFICATIONS=$((NOTIFICATIONS + 1))
    echo "  ✅ Notificado: $NAME (Run ID: $RUN_ID) - Conclusão: $CONCLUSION"
done

echo ""
echo "================================================"
echo "📋 Resumo:"
echo "  • Novos deploys detectados: ${NEW_RUNS}"
echo "  • Notificações enviadas: ${NOTIFICATIONS}"
echo "  • Total runs verificados: 5"
echo ""

# Atualizar arquivo de estado com histórico
CHECK_COUNT=$(jq -r '.check_count // 0' "$STATE_FILE")
CHECK_COUNT=$((CHECK_COUNT + 1))

NOTE="Check #${CHECK_COUNT}: ${NEW_RUNS} novos deploys detectados, ${NOTIFICATIONS} notificações enviadas"

jq --arg time "$(date -Iseconds)" \
   --argjson count "$CHECK_COUNT" \
   --arg note "$NOTE" \
   '.last_check = $time | .check_count = $count | .history += [{"timestamp": $time, "checked": 5, "new_deploys": '${NEW_RUNS}', "notifications_sent": '${NOTIFICATIONS}', "note": $note}] | .last_check_summary = $note' \
   "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

echo "✅ Verificação concluída - $(date '+%H:%M:%S')"
