#!/bin/bash
# Script de setup completo do Agency Marketing na VPS

set -e

echo "🚀 INICIANDO SETUP DO AGENCY MARKETING..."

# Criar diretórios
mkdir -p /opt/agency/{api,web,database,logs,uploads,evolution-store,redis-data}
mkdir -p /opt/agency/api/{routes,middleware,utils}
mkdir -p /opt/agency/web/static

# Criar Dockerfile da API
cat > /opt/agency/api/Dockerfile << 'EOFDOCKER'
FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./

EXPOSE 7778

CMD ["npm", "start"]
EOFDocker

# Criar nginx.conf
cat > /opt/agency/web/nginx.conf << 'EOFNGINX'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://agency-api:7778;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOFNGINX

# Criar server.js simplificado se não existir
if [ ! -f /opt/agency/api/server.js ]; then
cat > /opt/agency/api/server.js << 'EOFSERVER'
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 7778;

app.use(cors());
app.use(express.json());

// Database
const DB_PATH = '/opt/agency/database/agency.db';
const db = new sqlite3.Database(DB_PATH);

// Init database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        variables TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        name TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Database initialized');
});

// Routes
app.get('/', (req, res) => {
    res.json({ service: 'Agency Marketing API', status: 'running' });
});

app.get('/api/stats', (req, res) => {
    res.json({
        totalCampaigns: 0,
        totalContacts: 0,
        connectedInstances: 0,
        sentToday: 0
    });
});

app.get('/api/templates', (req, res) => {
    db.all("SELECT * FROM templates ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/templates', (req, res) => {
    const { name, content, variables } = req.body;
    db.run(
        "INSERT INTO templates (name, content, variables) VALUES (?, ?, ?)",
        [name, content, JSON.stringify(variables || [])],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Template created' });
        }
    );
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Agency API running on port ${PORT}`);
});
EOFSERVER
fi

# Criar package.json se não existir
if [ ! -f /opt/agency/api/package.json ]; then
cat > /opt/agency/api/package.json << 'EOFPACKAGE'
{
    "name": "agency-marketing-api",
    "version": "1.0.0",
    "main": "server.js",
    "scripts": {
        "start": "node server.js"
    },
    "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "sqlite3": "^5.1.6"
    }
}
EOFPACKAGE
fi

# Criar docker-compose
if [ ! -f /opt/agency/docker-compose.yml ]; then
cat > /opt/agency/docker-compose.yml << 'EOFDC'
version: '3.8'

services:
  agency-api:
    build: ./api
    container_name: agency-api
    restart: always
    ports:
      - "7778:7778"
    volumes:
      - /opt/agency/database:/opt/agency/database
      - /opt/agency/logs:/opt/agency/logs
    environment:
      - NODE_ENV=production
      - PORT=7778
    networks:
      - agency-network

  agency-web:
    image: nginx:alpine
    container_name: agency-web
    restart: always
    ports:
      - "7777:80"
    volumes:
      - /opt/agency/web:/usr/share/nginx/html:ro
      - /opt/agency/web/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - agency-network

  agency-evolution:
    image: atendai/evolution-api:v1.8.0
    container_name: agency-evolution
    restart: always
    ports:
      - "8081:8080"
    environment:
      - SERVER_URL=http://72.62.140.110:8081
      - AUTHENTICATION_API_KEY=agency-evolution-2024
    volumes:
      - /opt/agency/evolution-store:/evolution/store
    networks:
      - agency-network

networks:
  agency-network:
    driver: bridge
EOFDC
fi

echo "✅ Arquivos criados!"

# Iniciar serviços
cd /opt/agency
docker-compose down 2>/dev/null || true
docker-compose up -d --build

echo ""
echo "🎉 AGENCY MARKETING DEPLOYADO!"
echo ""
echo "URLs de acesso:"
echo "  📊 Dashboard: http://72.62.140.110:7777"
echo "  🔌 API: http://72.62.140.110:7778"
echo "  📱 Evolution: http://72.62.140.110:8081"
echo "  🔐 API Key: agency-evolution-2024"
echo ""
