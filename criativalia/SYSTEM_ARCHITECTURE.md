# 🤖 CRIATIVALIA MULTI-AGENT SYSTEM

## Arquitetura de Automação

### 📋 COMPONENTES

#### 1. Opportunity Generators (Geradores de Oportunidades)
Cada agente tem um job dedicado a encontrar oportunidades na sua área.

**TrafficBot Opportunity Scanner**
- Horário: A cada 6 horas
- Busca: Keywords, tendências Google, concorrentes
- Output: Arquivo JSON em `/opportunities/YYYYMMDD/traffic_opps.json`

**CopyBot Opportunity Scanner**  
- Horário: A cada 8 horas
- Busca: Gaps de conteúdo, oportunidades de copy
- Output: Arquivo JSON em `/opportunities/YYYYMMDD/copy_opps.json`

**DesignBot Opportunity Scanner**
- Horário: A cada 12 horas  
- Busca: Tendências de design, gaps de produto
- Output: Arquivo JSON em `/opportunities/YYYYMMDD/design_opps.json`

**OpsBot Opportunity Scanner**
- Horário: A cada 4 horas
- Busca: Ineficiências, oportunidades de margem, bugs
- Output: Arquivo JSON em `/opportunities/YYYYMMDD/ops_opps.json`

#### 2. CEO Agent (Orquestrador)
- Horário: A cada 2 horas
- Função: 
  - Lê todas as oportunidades dos últimos 24h
  - Filtra por impact_score >= 7
  - Calcula effort vs impact
  - Prioriza fila de cada agente
  - Gera `priorities_queue.json`
  - Envia resumo pro Telegram

#### 3. Executors (Executores)
Cada agente consome sua fila priorizada e:
- Executa a tarefa
- Gera evidência em `/evidencias/YYYYMMDD/{agente}/{tarefa_id}/`
- Atualiza timesheet
- Se for melhoria técnica → cria PR/deploy
- Se for estratégia/marketing → cria PDF em `/pending_approval/`

#### 4. Evidence Collector
- Coleta todas as evidências
- Gera página HTML consolidada
- Atualiza Control Plane

#### 5. Timesheet Generator
- Roda a cada hora
- Atualiza timeline visual das 24h
- Gera arquivo HTML interativo

#### 6. Morning Brief Generator
- Horário: 7h da manhã (Brasil)
- Compila:
  - Oportunidades detectadas (últimas 24h)
  - Tarefas executadas com links pra evidências
  - Itens pendentes de aprovação
  - Timesheet visual
  - Deploys automáticos feitos

---

## 📁 ESTRUTURA DE DADOS

### Oportunidade (opportunity.json)
```json
{
  "id": "opp_001",
  "agent": "TrafficBot",
  "timestamp": "2026-03-29T10:00:00Z",
  "title": "Keyword 'luminária nicho' em alta",
  "description": "Aumento de 340% em buscas",
  "impact_score": 8,
  "effort_score": 3,
  "roi_estimate": "high",
  "category": "seo",
  "status": "pending_review",
  "evidence_url": "..."
}
```

### Tarefa Executada (task_evidence.json)
```json
{
  "task_id": "task_001",
  "agent": "CopyBot",
  "opportunity_id": "opp_003",
  "started_at": "2026-03-29T11:00:00Z",
  "completed_at": "2026-03-29T11:30:00Z",
  "duration_minutes": 30,
  "status": "completed",
  "deliverables": [
    {"type": "file", "path": "...", "description": "10 headlines criadas"}
  ],
  "requires_approval": true,
  "auto_deployed": false
}
```

### Timesheet Entry
```json
{
  "agent": "TrafficBot",
  "date": "2026-03-29",
  "entries": [
    {
      "start": "02:00",
      "end": "02:45",
      "duration": "45min",
      "task": "Análise de concorrentes",
      "evidence_link": "...",
      "status": "completed"
    }
  ]
}
```

---

## 🎯 FLUXO DE TRABALHO

```
1. Opportunity Generators → Detectam oportunidades
2. CEO Agent → Filtra e prioriza
3. Executors → Pegam tarefas e executam
4. Evidence Collector → Consolida evidências
5. Timesheet Generator → Atualiza timeline
6. Morning Brief → Compila e envia resumo
```

---

## 📊 EVIDÊNCIAS NO CONTROL PLANE

URL: `/criativalia/evidencias/dashboard.html`

Seções:
- 📈 Oportunidades (últimas 24h, 7d, 30d)
- ✅ Tarefas Executadas (com filtros por agente)
- 🚀 Deploys Automáticos
- ⏳ Pendentes de Aprovação
- 📊 Timesheet 24h (visual)
- 📅 Histórico Completo

---

## 🔄 DEPLOY AUTOMÁTICO

Regras:
- Apenas melhorias técnicas (código)
- Nunca alterações de estratégia sem aprovação
- Sempre com rollback automático
- Evidência em `/deploys/YYYYMMDD/`

---

*Sistema criado em: 2026-03-29*
*Versão: 1.0*
