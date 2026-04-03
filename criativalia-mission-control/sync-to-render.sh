#!/bin/bash
# Sincroniza dados do agent_state.json para o Render via API
# Roda a cada 5 minutos

set -e

WORKSPACE="/root/.openclaw/workspace"
STATE_FILE="$WORKSPACE/criativalia-mission-control/control-plane/data/agent_state.json"
RENDER_URL="https://criativalia-control-plane.onrender.com"

echo "🔄 Sync para Render iniciado: $(date)"

# Verifica se arquivo existe e tem conteúdo
if [ ! -f "$STATE_FILE" ] || [ ! -s "$STATE_FILE" ]; then
    echo "❌ Arquivo $STATE_FILE não existe ou está vazio"
    exit 1
fi

# Valida JSON
if ! python3 -c "import json; json.load(open('$STATE_FILE'))" 2>/dev/null; then
    echo "❌ Arquivo JSON inválido"
    exit 1
fi

# Envia para o Render
curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "@$STATE_FILE" \
    "$RENDER_URL/api/sync/agents" 2>/dev/null || {
    echo "⚠️ API de sync não disponível, dados ficam no arquivo"
}

echo "✅ Sync concluído: $(date)"
