#!/bin/bash
# Setup completo do Marketing Agency - Isolado da Criativalia

set -e

echo "🚀 INICIANDO SETUP DO MARKETING AGENCY..."

# Criar estrutura de diretórios isolada
mkdir -p /opt/agency/{api,web,database,logs,uploads,templates,scripts}
mkdir -p /opt/agency/api/{routes,middleware,utils}
mkdir -p /opt/agency/web/{static/{css,js,images},templates}

# Criar banco de dados isolado
sqlite3 /opt/agency/database/agency.db <> agency-
│   ├── dashboard.html      # Painel principal
│   ├── campaigns.html      # Gerenciamento de campanhas
│   ├── templates.html      # Editor de templates
│   ├── mailing.html        # Importação e gestão de mailing
│   ├── verifier.html       # Verificador de números
│   ├── settings.html       # Configurações e regras anti-ban
│   └── logs.html           # Logs e relatórios
├── docker-compose.yml      # Orquestração
├── Dockerfile.api          # API Node.js
├── Dockerfile.web          # Servidor web Nginx
└── README.md               # Documentação

## 🚀 Deploy

```bash
cd /opt/agency
docker-compose up -d
```

## 🌐 Acessos

- **Painel:** http://72.62.140.110:7777
- **API:** http://72.62.140.110:7778
- **Evolution API:** http://72.62.140.110:8081 (instância isolada)

## ⚠️ ISOLAMENTO

Este sistema é COMPLETAMENTE SEPARADO da Criativalia:
- Banco de dados próprio
- Containers isolados
- Portas diferentes
- Nenhuma conexão com Shopify
EOFREADME

echo "✅ Estrutura criada em /opt/agency/"
echo ""
echo "Próximo: Criar API completa..."
