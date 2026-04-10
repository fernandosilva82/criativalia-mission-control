# Criativalia Multi-Agent System

Sistema autônomo de agentes de IA para operação 24/7 da loja Criativalia.

## 🎯 Objetivo

Criar um sistema de agentes autônomos que trabalham continuamente para:
- Detectar oportunidades de negócio
- Gerar conteúdo otimizado
- Monitorar operações
- Prover relatórios visuais de atividades

## 🤖 Agentes

### CEO Agent (Orquestrador)
- **Frequência:** A cada 2 horas
- **Função:** Coordenar outros agentes, priorizar oportunidades, aprovar estratégias
- **Saída:** Arquivos de decisão em `/opportunities/YYYYMMDD/`

### TrafficBot Scanner
- **Frequência:** A cada 6 horas
- **Função:** Analisar fontes de tráfego, tendências de busca, comportamento de usuários
- **Saída:** Oportunidades de tráfego com impact_score >= 6

### CopyBot Scanner
- **Frequência:** A cada 8 horas
- **Função:** Gerar copy otimizado para produtos, emails, anúncios
- **Saída:** Arquivos de copy em `/pending_approval/`

### OpsBot Scanner
- **Frequência:** A cada 4 horas
- **Função:** Monitorar operações, estoque, processos, métricas
- **Saída:** Alertas operacionais, relatórios de saúde

### Timesheet Generator
- **Frequência:** A cada 1 hora
- **Função:** Consolidar atividades de todos os agentes
- **Saída:** `/timesheets/YYYYMMDD/timesheet_24h.json`

### Deploy Monitor
- **Frequência:** A cada 5 minutos
- **Função:** Verificar saúde do deploy no Render
- **Saída:** Notificações de problemas, screenshots de verificação

## 📁 Estrutura de Diretórios

```
/criativalia/
├── opportunities/YYYYMMDD/     # Oportunidades detectadas
├── evidencias/YYYYMMDD/        # Evidências de execução
├── timesheets/YYYYMMDD/        # Timesheets visuais
├── pending_approval/           # Itens aguardando aprovação manual
└── deploys/                    # Logs de deploy
```

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# Shopify (já configurado ✅)
SHOPIFY_ACCESS_TOKEN=shpat_***
SHOPIFY_STORE=m-s-negocios-2.myshopify.com

# Render Deploy
RENDER_DEPLOY_HOOK=https://api.render.com/v1/services/***/deploys

# OpenClaw (local)
OPENCLAW_GATEWAY_URL=http://localhost:3000
```

### Cron Jobs (Automatizados)

Todos os agentes são agendados automaticamente via OpenClaw cron:

| Job | Frequência | Status |
|-----|------------|--------|
| CEO Agent | A cada 2h | ✅ |
| TrafficBot | A cada 6h | ✅ |
| CopyBot | A cada 8h | ✅ |
| OpsBot | A cada 4h | ✅ |
| Timesheet | A cada 1h | ✅ |
| Deploy Monitor | A cada 5m | ✅ |

## 🚀 Deploy

### Render (Control Plane)
- **URL:** https://criativalia-control-plane.onrender.com
- **Branch:** clean-deploy
- **Deploy:** Automático via GitHub Actions

### GitHub Actions Workflows

1. **deploy.yml** - Trigger em push para clean-deploy
2. **update-dashboard.yml** - Trigger quando novas evidências são criadas
3. **notify-deploy.yml** - Notificação após deploy

## 📊 Dashboards

- **Kanban:** https://criativalia-control-plane.onrender.com/kanban
- **Timesheet:** https://criativalia-control-plane.onrender.com/timesheet
- **Deliverables:** https://criativalia-control-plane.onrender.com/deliverables

## 🔒 Regras Importantes

1. **NUNCA usar dados mockados** - Sempre preferir espaço vazio
2. **Oportunidades reais apenas** - impact_score >= 6
3. **Deploy automático apenas** para melhorias técnicas
4. **Estratégias de marketing** → sempre em `pending_approval/`
5. **Notificações via Telegram** para 8601547557

## 📝 Histórico

- **2026-03-29:** Sistema multi-agente inicial implementado
- **2026-04-02:** Token Shopify confirmado e funcionando
- **2026-04-10:** Agency Pro v7.0 PRO deployado

---

**Status:** ✅ Sistema operacional e autônomo
