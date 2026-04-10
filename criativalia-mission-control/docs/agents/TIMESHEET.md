# Timesheet Generator

## Propósito
Consolidar e visualizar todas as atividades dos agentes em um timesheet legível e organizado.

## Frequência
- **Execução:** A cada 1 hora (3600000ms)
- **Duração:** Rápido (< 60s)

## Responsabilidades

### 1. Coleta de Atividades
- Ler evidências de todos os agentes
- Consolidar oportunidades geradas
- Mapear deploys realizados

### 2. Geração de Timesheet
- Criar arquivo JSON estruturado
- Calcular horas totais trabalhadas
- Identificar agentes mais ativos

### 3. Dashboard Visual
- Gerar visualização HTML se necessário
- Atualizar dados do kanban
- Preparar resumo para relatórios

## Estrutura do Timesheet

```json
{
  "date": "2026-04-11",
  "summary": {
    "total_hours": 16.5,
    "total_agents": 4,
    "opportunities_found": 3,
    "deploys_made": 1
  },
  "agents": [
    {
      "name": "CEO Agent",
      "cycles": 12,
      "hours": 4.0,
      "deliverables": ["decision_001", "decision_002"]
    },
    {
      "name": "TrafficBot",
      "cycles": 4,
      "hours": 3.5,
      "deliverables": ["traffic_001", "traffic_002"]
    }
  ],
  "deliverables": [
    {
      "id": "opp_001",
      "type": "opportunity",
      "agent": "TrafficBot",
      "impact_score": 7.5,
      "status": "pending"
    }
  ]
}
```

## Arquivos Gerados
- `/timesheets/YYYYMMDD/timesheet_24h.json` - Timesheet principal
- `/evidencias/YYYYMMDD/timesheet_log.json` - Log detalhado

## Visualização

O timesheet é consumido pelo dashboard em:
`https://criativalia-control-plane.onrender.com/timesheet`

## Integração

O Timesheet Generator roda automaticamente a cada hora. Seus dados alimentam:
- Dashboard de timesheet
- Relatórios de produtividade
- Morning Brief (resumo da manhã)

## Regras

1. **Dados reais apenas** - consolidar apenas o que foi feito
2. **Formato consistente** - manter estrutura JSON padronizada
3. **Histórico completo** - manter 30 dias de timesheets

---

**Nota:** O timesheet é evidência de que o sistema está trabalhando 24/7.
