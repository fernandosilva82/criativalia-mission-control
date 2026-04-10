#!/bin/bash
# Criativalia Deploy Manager - Script de verificação periódica
# Verifica: commits pendentes, mudanças locais, dados mockados na API

set -e

REPO_DIR="/root/.openclaw/workspace/criativalia-mission-control"
API_URL="https://criativalia-control-plane.onrender.com/api/shopify/stats"
LOG_FILE="/root/.openclaw/logs/deploy-manager.log"
ALERT_FILE="/root/.openclaw/logs/deploy-manager-alerts.log"

mkdir -p "$(dirname "$LOG_FILE")"

# Timestamp
TS=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TS] Iniciando verificação..." >> "$LOG_FILE"

# 1. Verificar commits pendentes na branch clean-deploy
cd "$REPO_DIR" 2>/dev/null || {
    echo "[$TS] ❌ ERRO: Diretório do repo não encontrado" >> "$LOG_FILE"
    exit 1
}

current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
if [ "$current_branch" != "clean-deploy" ]; then
    echo "[$TS] ⚠️ Branch atual: $current_branch (esperado: clean-deploy)" >> "$LOG_FILE"
fi

commits_ahead=$(git log --oneline origin/clean-deploy..HEAD 2>/dev/null | wc -l)
if [ "$commits_ahead" -gt 0 ]; then
    echo "[$TS] 🚨 ALERTA: $commits_ahead commit(s) pendente(s) na branch clean-deploy" >> "$ALERT_FILE"
    echo "[$TS] 🚨 Commits pendentes detectados" >> "$LOG_FILE"
fi

# 2. Verificar mudanças em control-plane/src/
changes_in_src=$(git status --short control-plane/src/ 2>/dev/null | wc -l)
if [ "$changes_in_src" -gt 0 ]; then
    echo "[$TS] 📝 Mudanças não commitadas em control-plane/src/:" >> "$LOG_FILE"
    git status --short control-plane/src/ >> "$LOG_FILE" 2>/dev/null || true
fi

# 3. Verificar se API retorna dados reais ou mockados
api_response=$(curl -s "$API_URL" --max-time 15 || echo "{}")
source_field=$(echo "$api_response" | grep -o '"_source"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:"\([^"]*\)".*/\1/' || echo "")

if [ "$source_field" = "mock_data" ]; then
    echo "[$TS] 🚨 ALERTA: Dados mockados detectados na API!" >> "$ALERT_FILE"
    echo "[$TS] 🚨 Dados mockados detectados" >> "$LOG_FILE"
elif [ "$source_field" = "shopify_api" ]; then
    echo "[$TS] ✅ Dados reais confirmados (shopify_api)" >> "$LOG_FILE"
else
    echo "[$TS] ⚠️ Campo _source não encontrado ou resposta inválida" >> "$LOG_FILE"
fi

echo "[$TS] Verificação concluída." >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
