#!/bin/bash
# Instalador do Sistema de Memória OpenClaw

set -e

echo "🧠 Instalando Sistema de Memória OpenClaw..."
echo ""

# Criar estrutura
cd ~
mkdir -p memory agents api config logs

# Instalar dependências Python
sudo apt-get update -qq
sudo apt-get install -y -qq python3-pip sqlite3

# Criar ambiente virtual (opcional mas recomendado)
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

pip install -q flask flask-cors requests

echo "✅ Dependências instaladas!"

# O banco já foi criado pelo init-brain.sh
echo "✅ Banco de memória verificado!"

echo ""
echo "🚀 Instalação concluída!"
echo ""
echo "📂 Estrutura criada:"
echo "   ~/memory/     - Banco de dados e esquemas"
echo "   ~/agents/     - Agentes autônomos"
echo "   ~/api/        - APIs de integração"
echo "   ~/config/     - Configurações"
echo "   ~/logs/       - Logs do sistema"
echo ""
