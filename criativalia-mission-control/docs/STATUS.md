# 🚀 Plano de Ajustes - Sistema Criativalia

## ✅ Já Feito

### 1. Documentação Migrada
- [x] `docs/SYSTEM.md` - Visão geral do sistema
- [x] `docs/agents/CEO_AGENT.md` - Orquestrador
- [x] `docs/agents/TRAFFICBOT.md` - Scanner de tráfego
- [x] `docs/agents/COPYBOT.md` - Gerador de copy
- [x] `docs/agents/OPSBOT.md` - Monitoramento de operações
- [x] `docs/agents/TIMESHEET.md` - Consolidador de atividades
- [x] `config/cron-jobs.json` - Configuração dos jobs
- [x] `.github/workflows/deploy.yml` - Workflow de deploy

### 2. Código Atualizado
- [x] Endpoint `/api/stats` adicionado ao control-plane
- [x] Commit `adda5b78` enviado para `clean-deploy`

### 3. Script de Limpeza
- [x] `scripts/cleanup-duplicate-jobs.sh` criado

---

## 🔄 Em Andamento

### Deploy no Render
- **Status:** Em progresso (pode levar 2-5 minutos)
- **URL:** https://criativalia-control-plane.onrender.com
- **Branch:** clean-deploy
- **Commit:** adda5b78

---

## 📋 Próximos Passos

### 1. Limpar Jobs Duplicados (URGENTE)
Há ~90 jobs "Keep Render Awake" duplicados. Precisa deixar apenas 1-2.

**Comando para limpar:**
```bash
# Listar todos os jobs
openclaw cron list

# Remover duplicados (manter apenas o mais recente)
# Repetir para cada ID duplicado:
openclaw cron remove --job-id <ID_DO_JOB>
```

### 2. Verificar Deploy
Após 5 minutos, testar:
```bash
curl https://criativalia-control-plane.onrender.com/api/stats
curl https://criativalia-control-plane.onrender.com/api/health
```

### 3. Configurar Jobs Principais
Garantir que estes jobs estão ativos:
- [ ] deploy-monitor-notifier (a cada 5 min)
- [ ] CEO Agent (a cada 2h)
- [ ] TrafficBot (a cada 6h)
- [ ] CopyBot (a cada 8h)
- [ ] OpsBot (a cada 4h)
- [ ] Timesheet Generator (a cada 1h)

### 4. Testar Integrações
- [ ] GitHub Actions → Render deploy
- [ ] Shopify API (token já configurado ✅)
- [ ] Telegram notificações

---

## 🐛 Problemas Identificados

1. **Jobs duplicados** - Múltiplos "Keep Render Awake" criados
2. **Endpoint /api/stats** - Aguardando deploy no Render
3. **Deploy Monitor** - Alguns jobs com timeout

---

## 🎯 Status Geral

| Componente | Status |
|------------|--------|
| Documentação | ✅ Completa |
| Código | ✅ Atualizado |
| Deploy Render | 🔄 Em andamento |
| Jobs Cron | ⚠️ Precisa limpar duplicados |
| GitHub Actions | ✅ Configurado |
| Shopify | ✅ Token OK |

---

**Próxima ação recomendada:** Aguardar 5 minutos para o deploy completar, depois limpar os jobs duplicados.
