#!/bin/bash
# Deploy automático do Criativalia Mission Control para Vercel
# Uso: ./deploy-vercel.sh

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🚀 Criativalia Mission Control - Vercel Deploy"
echo "==============================================="

# Verifica se vercel CLI está disponível
if ! command -v vercel &> /dev/null; then
    echo "Instalando Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "📦 Iniciando deploy..."
echo ""

# Deploy com confirmação automática
vercel --yes --prod

echo ""
echo "✅ Deploy concluído!"
echo ""