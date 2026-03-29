#!/bin/bash
# Sincroniza estado dos cron jobs para JSON acessível pelo dashboard
# Roda a cada 1 minuto

WORKSPACE="/root/.openclaw/workspace"
OUTPUT_FILE="$WORKSPACE/criativalia-mission-control/control-plane/data/agent_state.json"

# Garante diretório existe
mkdir -p "$(dirname $OUTPUT_FILE)"

# Busca cron jobs e salva
openclaw cron list --json > "$OUTPUT_FILE.tmp" 2>/dev/null || echo "[]" > "$OUTPUT_FILE.tmp"

# Adiciona timestamp
python3 << 'EOF' - "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
import json, sys, datetime

input_file = sys.argv[1]
output_file = sys.argv[2]

try:
    with open(input_file, 'r') as f:
        jobs = json.load(f)
except:
    jobs = []

# Enriquece dados
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

with open(output_file, 'w') as f:
    json.dump(enriched, f, indent=2)

print(f"✅ {len(jobs)} jobs sincronizados")
EOF

rm "$OUTPUT_FILE.tmp"
