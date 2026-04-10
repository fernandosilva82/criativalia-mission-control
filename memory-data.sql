-- Dados iniciais sobre Fernando/Criativalia

-- Preferências do usuário
INSERT OR IGNORE INTO user_preferences (key, value, description) VALUES
    ('user_name', 'Fernando Silva', 'Nome do usuário'),
    ('company', 'Criativalia', 'Empresa do usuário'),
    ('shopify_store', 'm-s-negocios-2.myshopify.com', 'Loja Shopify'),
    ('timezone', 'America/Sao_Paulo', 'Fuso horário'),
    ('telegram_id', '8601547557', 'ID do Telegram'),
    ('vps_ip', '72.62.140.110', 'IP da VPS'),
    ('communication_style', 'direto', 'Estilo preferido de comunicação'),
    ('mock_data_preference', 'never', 'Nunca usar dados mockados'),
    ('github_username', 'fernandosilva82', 'Usuário GitHub');

-- Aprendizados críticos
INSERT OR IGNORE INTO learnings (category, content, importance) VALUES
    ('critical', 'NUNCA usar dados mockados - preferir espaço vazio', 10),
    ('critical', 'Shopify token já configurado em /root/.openclaw/skills/clawpify/.env', 10),
    ('preference', 'Gosta de surpresas pela manhã: deploys automáticos', 8),
    ('preference', 'Quer timesheets reais mostrando trabalho dos agentes', 8),
    ('preference', 'Prefere evidências visíveis de execução', 8),
    ('business', 'Criativalia: e-commerce de produtos de decoração/interiores', 9),
    ('technical', 'Control Plane no Render: https://criativalia-control-plane.onrender.com', 8),
    ('workflow', 'Deploy automático apenas para melhorias técnicas', 7),
    ('workflow', 'Estratégias/marketing geram arquivos pending_approval para aprovação manual', 7),
    ('workflow', 'Apenas oportunidades com impact_score >= 6 são mantidas', 6);

-- Tarefas pendentes iniciais
INSERT OR IGNORE INTO tasks (title, description, status, priority) VALUES
    ('Finalizar integração WhatsApp Rotator', 'Configurar instâncias e testar disparos', 'pending', 9),
    ('Criar agentes autônomos na VPS', 'Implementar sistema de agentes que rodam 24/7', 'in_progress', 9),
    ('Integrar Shopify com dados reais', 'Usar token já configurado para sincronização', 'pending', 8);
