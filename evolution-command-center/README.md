# ⚡ Evolution Command Center

Centro de Comando profissional para gerenciar **Evolution API** — interface completa para operar WhatsApp em escala.

## 🎯 Funcionalidades

### 📱 Gerenciamento de Instâncias
- ✅ Criar/deletar instâncias WhatsApp
- ✅ Conectar via QR Code
- ✅ Ver status em tempo real
- ✅ Múltiplas instâncias simultâneas

### 💬 Mensagens
- ✅ Enviar texto
- ✅ Enviar mídia (imagens, vídeos, documentos)
- ✅ Enviar localização
- ✅ Enviar enquetes
- ✅ Templates com variáveis

### 👥 Contatos & Grupos
- ✅ Sincronizar contatos
- ✅ Buscar foto de perfil
- ✅ Gerenciar grupos
- ✅ Histórico de mensagens

### 🚀 Campanhas
- ✅ Criar campanhas de disparo
- ✅ Upload de listas CSV
- ✅ Rate limiting (anti-block)
- ✅ Agendamento
- ✅ Relatórios em tempo real

### 📊 Dashboard
- ✅ Estatísticas em tempo real
- ✅ Logs ao vivo (WebSocket)
- ✅ Monitoramento de filas
- ✅ Alertas e notificações

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     Evolution Command Center                │
├─────────────────────────────────────────────────────────────┤
│  Frontend (index.html)  ←────→  Backend API (Node.js)      │
│       ↓                                ↓                    │
│  Dashboard UI                   Auth (JWT)                  │
│  Real-time Logs                 SQLite DB                   │
│  Campaign Manager               Evolution API Client        │
│                                 WebSocket Server            │
└─────────────────────────────────────────────────────────────┘
                              ↕
                    Evolution API (Baileys)
                              ↕
                         WhatsApp Web
```

---

## 🚀 Deploy

### Requisitos
- Docker + Docker Compose
- 2GB RAM mínimo
- Portas: 3333 (app), 8080 (Evolution API - opcional)

### 1. Clone/Prepare
```bash
cd evolution-command-center
```

### 2. Setup
```bash
bash setup.sh
```

### 3. Configure
```bash
nano .env
```

Edite:
```env
EVOLUTION_BASE_URL=http://localhost:8080  # Ou sua API externa
EVOLUTION_API_KEY=sua_chave_segura
ADMIN_PASSWORD=sua_senha_admin
```

### 4. Iniciar

**Opção A: Com Evolution API embutida**
```bash
docker-compose --profile full up -d
```

**Opção B: Apenas Command Center (API externa)**
```bash
docker-compose up -d ecc-backend
```

### 5. Acessar
- 🌐 **Interface:** http://localhost:3333
- 🔌 **API:** http://localhost:3333/api

Login padrão:
- Usuário: `admin`
- Senha: (configurada no .env)

---

## 📚 API Endpoints

### Auth
```
POST /api/auth/login
{ "username": "admin", "password": "senha" }
```

### Dashboard
```
GET /api/dashboard/stats
```

### Instâncias
```
GET    /api/instances
POST   /api/instances              # Criar
GET    /api/instances/:name/connect # QR Code
DELETE /api/instances/:name         # Deletar
```

### Mensagens
```
POST /api/instances/:name/send
{
  "number": "5511999999999",
  "text": "Olá!",
  "options": {}
}

POST /api/instances/:name/send-media
{
  "number": "5511999999999",
  "media": "base64...",
  "caption": "Descrição"
}
```

### Contatos
```
GET /api/instances/:name/contacts
```

### Grupos
```
GET  /api/instances/:name/groups
POST /api/instances/:name/groups  # Criar grupo
```

### Campanhas
```
GET    /api/campaigns
POST   /api/campaigns
{
  "name": "Campanha Abril",
  "instance_id": "instancia-1",
  "message_template": "Olá {nome}!",
  "contacts": [{"jid": "5511...", "name": "João"}]
}
POST   /api/campaigns/:id/start
```

### Logs
```
GET /api/logs?limit=100
```

---

## 🎨 Interface Web

### Dashboard
- Estatísticas em tempo real
- Gráficos de atividade
- Logs ao vivo via WebSocket

### Instâncias
- Lista de instâncias
- Status de conexão
- QR Code para conectar
- Ações: conectar, deletar

### Mensagens
- Enviar mensagem individual
- Seleção de instância
- Preview antes de enviar

### Campanhas
- Criar campanhas
- Upload CSV
- Progresso em tempo real
- Controle de rate limit

### Contatos
- Sincronização
- Busca
- Histórico

### Logs
- Filtros por nível
- Busca
- Tempo real

---

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Rate limiting
- ✅ Helmet.js headers
- ✅ CORS configurável
- ✅ Senhas hasheadas (bcrypt)
- ✅ Input sanitization

---

## ⚙️ Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta da aplicação | 3333 |
| `EVOLUTION_BASE_URL` | URL da Evolution API | http://localhost:8080 |
| `EVOLUTION_API_KEY` | API Key da Evolution | - |
| `JWT_SECRET` | Segredo JWT | - |
| `ADMIN_PASSWORD` | Senha admin | admin123 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requisições | 100 |
| `LOG_LEVEL` | Nível de log | info |

---

## 🛠️ Desenvolvimento

```bash
# Local (sem Docker)
cd backend
npm install
npm run dev

# Frontend é estático - abra frontend/index.html
# Ou sirva com: npx serve frontend
```

---

## 📁 Estrutura

```
evolution-command-center/
├── backend/
│   ├── server.js          # API principal
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   └── index.html         # Interface completa
├── data/                  # SQLite DB
├── logs/                  # Logs da aplicação
├── docker-compose.yml
├── setup.sh
├── .env.example
└── README.md
```

---

## 🆘 Troubleshooting

### "Cannot connect to Evolution API"
→ Verifique se `EVOLUTION_BASE_URL` está correto no `.env`

### "Authentication failed"
→ Verifique `JWT_SECRET` e token expirado (24h)

### "QR Code não aparece"
→ Verifique se a instância foi criada corretamente

### Porta em uso
```bash
# Verificar
sudo lsof -i :3333

# Mudar porta no .env
PORT=3334
```

---

## 📄 Licença

MIT - Use por sua conta e risco.

---

## 🔗 Recursos

- [Evolution API Docs](https://doc.evolution-api.com/)
- [Evolution API GitHub](https://github.com/EvolutionAPI/evolution-api)
- [Baileys Library](https://github.com/WhiskeySockets/Baileys)

---

**Feito para operar WhatsApp em escala com segurança.**
