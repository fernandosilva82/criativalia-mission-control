#!/bin/bash
# Sincroniza dados do agent_state.json para o Render via API
# Roda a cada 5 minutos

set -e

WORKSPACE="/root/.openclaw/workspace"
STATE_FILE="$WORKSPACE/criativalia-mission-control/control-plane/data/agent_state.json"
RENDER_URL="https://criativalia-control-plane.onrender.com"

echo "🔄 Sync para Render iniciado: $(date)"

# Verifica se arquivo existe
if [ ! -f "$STATE_FILE" ]; then
    echo "❌ Arquivo $STATE_FILE não existe"
    exit 1
fi

# Cria resumo compacto com Python
python3 << EOF
import json, datetime

try:
    with open("$STATE_FILE", 'r') as f:
        data = json.load(f)
    
    # Cria resumo compacto (apenas essencial)
    summary = {
        "timestamp": data.get("timestamp", datetime.datetime.now().isoformat()),
        "total_jobs": data.get("total_jobs", 0),
        "summary": data.get("summary", {}),
        "jobs": [
            {
                "id": j.get("jobId", j.get("id", "unknown")),
                "name": j.get("name", "Unnamed"),
                "enabled": j.get("enabled", True),
                "running": bool(j.get("state", {}).get("runningAtMs")),
                "lastRun": j.get("state", {}).get("lastRunAtMs"),
                "errors": j.get("state", {}).get("consecutiveErrors", 0)
            }
            for j in data.get("jobs", [])[:50]  # Limita a 50 jobs
        ]
    }
    
    # Salva resumo temporário
    with open("/tmp/agent_summary.json", 'w') as f:
        json.dump(summary, f)
    
    print(f"✅ Resumo criado: {summary['total_jobs']} jobs")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    exit(1)
EOF

# Envia resumo para o Render
curl -s -X POST \
    -H "Content-Type: application/json" \
    -d @/tmp/agent_summary.json \
    "$RENDER_URL/api/sync/agents" 2>/dev/null || echo "⚠️ API não disponível"

rm -f /tmp/agent_summary.json
echo "✅ Sync concluído: $(date)"
