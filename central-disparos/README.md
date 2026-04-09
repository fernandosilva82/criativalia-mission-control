# 🚀 Central de Disparos WhatsApp

Infraestrutura completa e isolada para disparo de mensagens WhatsApp usando Evolution API.

## 📁 Estrutura

```
central-disparos/
├── api/                    # API REST (Node.js + Express)
│   ├── server.js          # Servidor principal
│   ├── package.json
│   └── Dockerfile
├── worker/                 # Worker de processamento (Bull Queue)
│   ├── worker.js          # Processador de filas
│   ├── package.json
│   └── Dockerfile
├── web/                    # Interface Web
│   ├── index.html         # Dashboard
│   └── Dockerfile
├── docker/                 # Configurações Docker
│   └── nginx.conf         # Reverse proxy
├── config/                 # Configurações
│   └── .env.example       # Template de env
├── data/                   # Banco de dados SQLite
├── logs/                   # Logs da aplicação
├── docker-compose.yml      # Orquestração completa
└── deploy.sh              # Script de deploy
```

## 🏗️ Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│  Web UI     │     │   Redis     │
│  (Port 80)  │     │  (Port 8081)│     │  (Filas)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
       │                                       │
       │         ┌─────────────────────────────┘
       │         │
       ▼         ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   API       │────▶│   Worker    │────▶│  Evolution  │
│  (Port 3000)│     │  (Bull)     │     │    API      │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│  SQLite DB  │                         │  WhatsApp   │
│  (Campanhas)│                         │  Web        │
└─────────────┘                         └─────────────┘
```

## 🛡️ Técnicas Anti-Block

| Técnica | Implementação |
|---------|---------------|
| **Delay Progressivo** | 5-12s entre mensagens |
| **Rate Limiting** | 25 msg/hora, 150/dia |
| **Cooldown Automático** | 20min pausa a cada 8 msgs |
| **Horário Comercial** | 9h-18h, sem fins de semana |
| **Spin-Tax** | Variação automática de texto |
| **Simulação de Digitação** | "digitando..." antes de enviar |
| **Retry com Backoff** | 3 tentativas com delay exponencial |
| **Controle por Instância** | Limites diários por número |

## 🚀 Deploy

### Requisitos
- Docker + Docker Compose
- 2GB RAM mínimo
- Portas 80, 8080, 3000 disponíveis

### 1. Clone/Prepare
```bash
cd central-disparos
```

### 2. Configure
```bash
cp config/.env.example config/.env
nano config/.env  # Edite suas configurações
```

### 3. Deploy
```bash
bash deploy.sh
```

Ou manualmente:
```bash
docker-compose up -d --build
```

## 🌐 Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Dashboard | http://localhost | Interface Web |
| API | http://localhost/api | Endpoints REST |
| Evolution | http://localhost:8080/manager | Gerenciamento WhatsApp |

## 📋 Uso

### 1. Criar Instância WhatsApp
1. Acesse http://localhost:8080/manager
2. Clique em "Create Instance"
3. Escaneie o QR Code com WhatsApp
4. Anote o nome da instância

### 2. Criar Campanha (via Web)
1. Acesse http://localhost
2. Preencha nome e mensagem
3. Faça upload da lista CSV
4. Clique em "Criar Campanha"
5. Clique em "Iniciar"

### 3. Criar Campanha (via API)
```bash
curl -X POST http://localhost/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Campanha Abril",
    "message_template": "Olá {nome}! {spin:0} {spin:1}{spin:2}",
    "contacts": [
      {"phone": "5511999999999", "name": "Fernando"},
      {"phone": "5511888888888", "name": "Maria"}
    ]
  }'
```

### 4. Iniciar Campanha
```bash
curl -X POST http://localhost/api/campaigns/{id}/start
```

## 📊 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/health | Health check |
| GET | /api/stats | Estatísticas |
| GET | /api/campaigns | Listar campanhas |
| POST | /api/campaigns | Criar campanha |
| POST | /api/campaigns/:id/start | Iniciar campanha |
| POST | /api/campaigns/:id/pause | Pausar campanha |
| GET | /api/campaigns/:id/status | Status detalhado |
| GET | /api/instances | Listar instâncias |
| POST | /api/instances | Criar instância |
| GET | /api/logs | Ver logs |
| POST | /api/upload-csv | Upload de lista |

## 🔧 Configuração (.env)

```bash
# API
PORT=3000
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=sua_chave_segura

# Anti-Block
DELAY_MIN_MS=5000
DELAY_MAX_MS=12000
MESSAGES_PER_HOUR_MAX=25
DAILY_LIMIT_PER_NUMBER=150
COOLDOWN_AFTER_MESSAGES=8
COOLDOWN_DURATION_MINUTES=20
BUSINESS_HOURS_ONLY=true
```

## 📦 Variáveis de Mensagem

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{nome}` | Nome do contato | "Fernando" |
| `{telefone}` | Número | "5511999999999" |
| `{spin:0}` | Variação 1 | Olá/Oi/E aí |
| `{spin:1}` | Variação 2 | tudo bem/como vai |
| `{spin:2}` | Variação 3 | !/?/👋 |

## 📋 Formato CSV

```csv
telefone,nome
5511999999999,Fernando Silva
5511888888888,Maria Oliveira
5511777777777,João Santos
```

## 🔍 Monitoramento

```bash
# Ver logs
docker-compose logs -f worker
docker-compose logs -f api

# Status
docker-compose ps

# Estatísticas Redis
docker-compose exec redis redis-cli info

# Banco de dados
docker-compose exec api sqlite3 /app/data/central.db
```

## 🆘 Troubleshooting

### Porta em uso
```bash
# Verificar
sudo lsof -i :80

# Matar processo ou mudar porta no docker-compose.yml
```

### Permissão negada
```bash
sudo chown -R $USER:$USER data logs
```

### WhatsApp não conecta
1. Verifique se o número não está banido
2. Use um número novo para testes
3. Aguarde 24h após criar instância antes de enviar em massa

## 🔄 Atualização

```bash
# Puxar novas versões
docker-compose pull

# Rebuild
docker-compose up -d --build
```

## ⚠️ Aviso Legal

Este sistema é para **testes e desenvolvimento**. Para uso em produção:
- Use **WhatsApp Business API Oficial**
- Respeite os limites do WhatsApp
- Obtenha consentimento dos destinatários
- Forneça opção de opt-out

## 📄 Licença

MIT - Use por sua conta e risco.
