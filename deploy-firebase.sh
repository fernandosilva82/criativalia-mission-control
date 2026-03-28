#!/bin/bash
# Deploy automático do Criativalia Mission Control para Firebase Hosting
# Uso: ./deploy-firebase.sh [token]

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🚀 Criativalia Mission Control - Firebase Deploy"
echo "================================================"

# Verifica se tem token
if [ -z "$1" ]; then
    echo ""
    echo "Primeiro deploy - Gerando token de CI..."
    echo "Execute: npx firebase login:ci"
    echo ""
    echo "Depois salve o token em .secrets/firebase-token.txt"
    echo ""
    exit 1
fi

TOKEN="$1"

echo "📦 Iniciando deploy..."
npx firebase deploy --only hosting --token "$TOKEN" --non-interactive

echo ""
echo "✅ Deploy concluído!"
echo "🌐 URL: https://criativalia-mission-control.web.app"
echo ""