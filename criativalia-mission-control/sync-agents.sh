#!/bin/bash
# Sincroniza estado dos cron jobs para JSON acessível pelo dashboard

WORKSPACE="/root/.openclaw/workspace"
OUTPUT_FILE="$WORKSPACE/criativalia-mission-control/control-plane/data/agent_state.json"
TEMP_FILE="/tmp/cron_jobs_$$.json"

echo "🔄 Sync iniciado: $(date)"

# Garante diretório existe
mkdir -p "$(dirname $OUTPUT_FILE)"

# Busca cron jobs via openclaw CLI, extrai só o JSON (após a linha que começa com {)
openclaw cron list --json 2>/dev/null | sed -n '/^{/,$p' > "$TEMP_FILE"

# Se arquivo está vazio ou inválido, usa array vazio
if [ ! -s "$TEMP_FILE" ] || ! python3 -c "import json; json.load(open('$TEMP_FILE'))" 2>/dev/null; then
    echo '[]' > "$TEMP_FILE"
fi

# Processa com Python
python3 << EOF
import json, datetime, sys

try:
    with open("$TEMP_FILE", 'r') as f:
        content = f.read()
        # Tenta parsear como objeto com 'jobs' ou como array
        try:
            data = json.loads(content)
            if isinstance(data, dict) and 'jobs' in data:
                jobs = data['jobs']
            elif isinstance(data, list):
                jobs = data
            else:
                jobs = []
        except:
            jobs = []
except Exception as e:
    print(f"Erro: {e}")
    jobs = []

enriched = {
    "timestamp": datetime.datetime.now().isoformat(),
    "total_jobs": len(jobs),
    "jobs": jobs,
    "summary": {
        "running": sum(1 for j in jobs if j.get('state', {}).get('runningAtMs')),
        "enabled": sum(1 for j in jobs if j.get('enabled', True)),
        "errors": sum(1 for j in jobs if j.get('state', {}).get('consecutiveErrors', 0) > 0)
    }
}

with open("$OUTPUT_FILE", 'w') as f:
    json.dump(enriched, f, indent=2)

print(f"✅ {len(jobs)} jobs sincronizados")
EOF

# Limpa temp
rm -f "$TEMP_FILE"

echo "✅ Sync concluído: $(date)"
