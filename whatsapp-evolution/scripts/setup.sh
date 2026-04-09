#!/bin/bash
# Setup script para WhatsApp Evolution API

echo "🚀 WhatsApp Evolution API - Setup"
echo "=================================="
echo ""

# Criar diretórios
mkdir -p ../config ../data ../logs ../sessions

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale primeiro:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    exit 1
fi

echo "✓ Node.js encontrado: $(node --version)"

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
cd "$(dirname "$0")"
npm install axios 2>/dev/null || echo "⚠️ axios já instalado ou erro na instalação"

# Criar .env se não existir
if [ ! -f ../config/.env ]; then
    echo ""
    echo "📝 Criando arquivo de configuração..."
    cp ../config/.env.example ../config/.env
    echo "✓ Arquivo .env criado em ../config/.env"
    echo "⚠️  EDITE este arquivo com suas credenciais!"
else
    echo "✓ Arquivo .env já existe"
fi

# Criar lista de exemplo
if [ ! -f ../data/contatos-exemplo.csv ]; then
    echo ""
    echo "📋 Criando lista de exemplo..."
    cat > ../data/contatos-exemplo.csv << 'EOF'
5511999999999,Fernando
5511888888888,Maria
5511777777777,João
EOF
    echo "✓ Lista de exemplo criada em ../data/contatos-exemplo.csv"
fi

echo ""
echo "=================================="
echo "✅ Setup concluído!"
echo ""
echo "Próximos passos:"
echo "1. Edite: config/.env (coloque sua API key)"
echo "2. Crie sua lista: data/seus-contatos.csv"
echo "3. Formato: telefone,nome (ex: 5511999999999,Fernando)"
echo ""
echo "Para enviar:"
echo "   node sender.js send seus-contatos.csv \"Olá {nome}! Tudo bem?\""
echo ""
