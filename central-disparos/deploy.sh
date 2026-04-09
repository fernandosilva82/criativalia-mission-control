#!/bin/bash
# Deploy script para Central de Disparos

set -e

echo "🚀 Central de Disparos - Deploy"
echo "================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado${NC}"
    echo "Instale primeiro: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker encontrado${NC}"

# Verificar .env
if [ ! -f "config/.env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo config/.env não encontrado${NC}"
    echo "Criando a partir do exemplo..."
    cp config/.env.example config/.env
    echo -e "${RED}⚠️  EDITE config/.env antes de continuar!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Configuração encontrada${NC}"

# Criar diretórios
echo ""
echo "📁 Criando diretórios..."
mkdir -p data logs docker/ssl

# Build
echo ""
echo "🔨 Build dos containers..."
docker-compose build

# Start
echo ""
echo "🚀 Iniciando serviços..."
docker-compose up -d

# Aguardar serviços
echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status
echo ""
echo "📊 Status dos serviços:"
docker-compose ps

echo ""
echo "================================"
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "Acesse:"
echo "  🌐 Interface Web: http://localhost"
echo "  🔌 API: http://localhost/api"
echo "  📱 Evolution Manager: http://localhost:8080/manager"
echo ""
echo "Próximos passos:"
echo "1. Acesse http://localhost:8080/manager"
echo "2. Crie uma instância do WhatsApp"
echo "3. Escaneie o QR Code"
echo "4. Comece a usar em http://localhost"
echo ""
echo "Para ver logs: docker-compose logs -f"
echo "Para parar: docker-compose down"
