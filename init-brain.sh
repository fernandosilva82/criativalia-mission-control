#!/bin/bash
# Script para inicializar banco de memória OpenClaw

DB_FILE="$HOME/memory/brain.db"

sqlite3 "$DB_FILE" "
CREATE TABLE IF NOT EXISTS learnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    context TEXT,
    importance INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 3,
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS criativalia_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    key_name TEXT NOT NULL,
    value TEXT,
    metadata TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO user_preferences (key, value, description) VALUES
  ('user_name', 'Fernando Silva', 'Nome do usuário'),
  ('company', 'Criativalia', 'Empresa do usuário'),
  ('shopify_store', 'm-s-negocios-2.myshopify.com', 'Loja Shopify'),
  ('timezone', 'America/Sao_Paulo', 'Fuso horário'),
  ('telegram_id', '8601547557', 'ID do Telegram'),
  ('vps_ip', '72.62.140.110', 'IP da VPS'),
  ('communication_style', 'direto', 'Estilo de comunicação'),
  ('mock_data_preference', 'never', 'Nunca usar dados mockados');

INSERT OR IGNORE INTO learnings (category, content, importance) VALUES
  ('critical', 'NUNCA usar dados mockados - preferir espaço vazio', 10),
  ('critical', 'Shopify token já configurado em /root/.openclaw/skills/clawpify/.env', 10),
  ('preference', 'Gosta de surpresas pela manhã: deploys automáticos', 8),
  ('preference', 'Quer timesheets reais mostrando trabalho dos agentes', 8),
  ('preference', 'Prefere evidências visíveis de execução', 8),
  ('business', 'Criativalia: e-commerce de produtos de decoração/interiores', 9),
  ('technical', 'Control Plane no Render: criativalia-control-plane.onrender.com', 8);

INSERT OR IGNORE INTO tasks (title, description, status, priority) VALUES
  ('Finalizar integração WhatsApp Rotator', 'Configurar instâncias e testar disparos', 'pending', 9),
  ('Criar agentes autônomos na VPS', 'Sistema de agentes 24/7', 'in_progress', 9),
  ('Integrar Shopify com dados reais', 'Usar token já configurado', 'pending', 8);
"

echo "✅ Banco de memória criado com sucesso!"
echo "📁 Local: $DB_FILE"
sqlite3 "$DB_FILE" ".tables"
