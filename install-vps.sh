#!/bin/bash
# WhatsApp Rotator - Script de instalação para VPS
# Cole TUDO no terminal web da Hostinger e pressione Enter

echo "🚀 Iniciando instalação do WhatsApp Rotator..."

# Criar diretório
mkdir -p /opt/whatsapp-rotator
cd /opt/whatsapp-rotator

# Baixar o pacote
curl -L -o rotator.tar.gz "https://github.com/fernandosilva82/whatsapp-rotator/releases/download/v1.0/whatsapp-rotator-vps.tar.gz"

# Extrair
tar -xzf rotator.tar.gz --strip-components=1
rm rotator.tar.gz

# Instalar Docker se não tiver
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "📦 Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Subir serviços
echo "🚀 Subindo serviços..."
docker-compose up -d

# Mostrar status
echo ""
echo "✅ INSTALAÇÃO CONCLUÍDA!"
echo ""
echo "📱 Acesse: http://$(hostname -I | awk '{print $1}'):3333"
echo "🔌 API: http://$(hostname -I | awk '{print $1}'):8080"
echo ""
echo "Lembre-se de liberar as portas 3333 e 8080 no firewall da Hostinger!"
