#!/bin/bash
# Evolution Command Center - Setup Script

set -e

echo "⚡ Evolution Command Center - Setup"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado${NC}"
    echo "Instale em: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker encontrado${NC}"

# Create directories
echo ""
echo "📁 Criando diretórios..."
mkdir -p data logs uploads

# Setup .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo "Criando a partir do exemplo..."
    cp .env.example .env
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || date | md5sum | head -c 32)
    API_KEY=$(openssl rand -base64 24 2>/dev/null || date | md5sum | head -c 24)
    
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
    sed -i "s/EVOLUTION_API_KEY=.*/EVOLUTION_API_KEY=${API_KEY}/" .env
    
    echo -e "${BLUE}✓ Arquivo .env criado com segredos gerados${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo .env e configure:${NC}"
    echo "  - EVOLUTION_BASE_URL (URL da sua Evolution API)"
    echo "  - ADMIN_PASSWORD (senha do usuário admin)"
else
    echo -e "${GREEN}✓ Arquivo .env já existe${NC}"
fi

# Install dependencies (for local development)
if [ "$1" == "--local" ]; then
    echo ""
    echo "📦 Instalando dependências..."
    cd backend && npm install && cd ..
fi

# Build
echo ""
echo "🔨 Buildando containers..."
docker-compose build

echo ""
echo "==================================="
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo "Para iniciar:"
echo -e "  ${BLUE}docker-compose up -d${NC}"
echo ""
echo "Acesso:"
echo "  🌐 Interface: http://localhost:3333"
echo "  🔌 API: http://localhost:3333/api"
echo ""
echo "Credenciais padrão:"
echo "  Usuário: admin"
echo "  Senha: (veja no .env)"
echo ""
echo "Para usar com Evolution API externa:"
echo "  1. Configure EVOLUTION_BASE_URL no .env"
echo "  2. Inicie apenas o backend: docker-compose up -d ecc-backend"
echo ""
