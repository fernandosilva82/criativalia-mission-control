# 🧠 MEMORY.md - Memória de Longo Prazo

## Informações do Usuário
- **Nome:** Fernando Silva
- **Telegram ID:** 8601547557
- **Empresa:** Criativalia
- **Loja Shopify:** m-s-negocios-2.myshopify.com

---

## 🔑 Tokens e Acessos Configurados

### GitHub
- **Repo:** fernandosilva82/criativalia-mission-control
- **Branch:** clean-deploy
- **Token:** configurado no GitHub Actions (RENDER_DEPLOY_HOOK secret)

### Render (Deploy)
- **Service:** criativalia-control-plane
- **URL:** https://criativalia-control-plane.onrender.com
- **Deploy Hook:** Configurado no GitHub Secrets
- **Status:** Deploy automático ativo via GitHub Actions

### Shopify ✅ CONFIGURADO E FUNCIONANDO
- **SHOPIFY_ACCESS_TOKEN:** Configurado em `/root/.openclaw/skills/clawpify/.env`
- **SHOPIFY_STORE:** m-s-negocios-2.myshopify.com
- **Status:** ✅ Token ATIVO e funcionando desde 2026-03-29
- **Última verificação:** 2026-04-02 - Token válido
- **Acesso:** Local funcionando, Render precisa da env var

### ⚠️ NOTA IMPORTANTE PARA O AGENTE:
```
O TOKEN SHOPIFY JÁ EXISTE! Não pedir para configurar novamente.
Caminho: /root/.openclaw/skills/clawpify/.env
Verificar com: cat /root/.openclaw/skills/clawpify/.env | grep TOKEN
```

### Configuração no Render (PENDENTE - SEPARADO)
⚠️ O token LOCAL funciona. O Render online precisa da mesma env var `SHOPIFY_ACCESS_TOKEN` configurada no dashboard.

---

## 🤖 Sistema Multi-Agente Criativalia

### Jobs Ativos (Cron)
| Job | Frequência | Status |
|-----|------------|--------|
| 🧠 CEO Agent - Orquestrador | A cada 2h | ✅ Rodando |
| 🔍 TrafficBot Scanner | A cada 6h | ✅ Rodando |
| ✍️ CopyBot Scanner | A cada 8h | ✅ Rodando |
| ⚙️ OpsBot Scanner | A cada 4h | ✅ Rodando |
| 📊 Timesheet Generator | A cada 1h | ✅ Rodando |
| 🔔 Deploy Monitor Notifier | A cada 5m | ✅ Rodando |
| 🌅 Morning Brief Generator | 7h da manhã (BRT) | ✅ Agendado |
| 🔄 Sync Agent State to Render | A cada 5 min | ✅ Ativo |
| 👁️ Post-Deploy Visual Check | A cada 1h | ✅ Ativo |

### Rotina de Verificação Visual Pós-Deploy
Após cada deploy no Render, o agente deve:
1. Acessar https://criativalia-control-plane.onrender.com
2. Verificar todas as páginas: /, /kanban, /timesheet, /deliverables
3. Tirar screenshots e reportar problemas
4. Auto-ajustar quando possível

### Workflows GitHub Actions
1. **Deploy on Opportunities** - Trigger quando novas oportunidades são geradas
2. **Update Dashboard** - Trigger quando novas evidências são criadas
3. **Notify on Deploy** - Notificação quando deploy conclui (via OpenClaw job)
4. **Deploy to Render** - Deploy manual/automático

### Estrutura de Diretórios
```
/criativalia/
├── opportunities/YYYYMMDD/     # Oportunidades detectadas
├── evidencias/YYYYMMDD/        # Evidências de execução
├── timesheets/YYYYMMDD/        # Timesheets visuais
├── pending_approval/           # Itens aguardando aprovação
└── deploys/                    # Logs de deploy
```

---

## ⚠️ Regras Importantes

### Proibições
- ❌ **DADOS MOCKADOS SÃO PROIBIDOS** - Preferir espaço vazio a dados fake
- ❌ Nunca inventar oportunidades - apenas dados reais baseados em análise

### Decisões de Arquitetura
- Deploy automático apenas para melhorias técnicas
- Estratégias/marketing geram arquivos em `pending_approval` para aprovação manual
- Apenas oportunidades com impact_score >= 6 são mantidas
- Notificações via Telegram para 8601547557

---

## 📝 Histórico Recente

### 2026-03-29
- ✅ Sistema multi-agente completo implementado
- ✅ Deploy automático ativado no Render
- ✅ Jobs de monitoramento criados
- ✅ Dados mockados removidos do código
- 🔄 Aguardando SHOPIFY_ACCESS_TOKEN para dados reais

---

## 🔧 Configurações Técnicas

### Modelo LLM
- **Padrão:** kimi-coding/k2p5
- **Timeout scanners:** 900s (15 min)
- **Timeout CEO Agent:** 600s (10 min)

### Cron Schedules
- CEO Agent: 7200000ms (2h)
- TrafficBot: 21600000ms (6h)
- CopyBot: 28800000ms (8h)
- OpsBot: 14400000ms (4h)
- Timesheet: 3600000ms (1h)
- Morning Brief: 0 10 * * * (7h BRT)
