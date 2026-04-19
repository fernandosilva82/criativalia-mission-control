#!/bin/bash
# Deploy Monitor - Verificador de Status
# Criativalia Mission Control

STATE_FILE="/root/.openclaw/workspace/criativalia/deploy_notifications.json"
GITHUB_API="https://api.github.com/repos/fernandosilva82/criativalia-mission-control/actions/runs?per_page=10"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Deploy Monitor - $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# Buscar runs do GitHub
echo "📡 Consultando GitHub Actions..."
RUNS=$(curl -s "$GITHUB_API" 2>/dev/null)

if [ -z "$RUNS" ]; then
    echo -e "${RED}❌ Erro ao consultar GitHub API${NC}"
    exit 1
fi

# Verificar se há workflows de deploy
DEPLOY_WORKFLOWS="Deploy to Render|Deploy on Opportunities Update|Update Dashboard on Evidence"

echo ""
echo "📋 Workflows recentes:"
echo "$RUNS" | grep -E '"name"|"status"|"conclusion"|"html_url"|"created_at"|"id"' | head -60

echo ""
echo "✅ Verificação concluída!"
