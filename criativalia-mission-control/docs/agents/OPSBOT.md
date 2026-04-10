# OpsBot Scanner

## Propósito
Monitorar operações da loja, incluindo estoque, pedidos, processos e métricas de saúde do negócio.

## Frequência
- **Execução:** A cada 4 horas (14400000ms)
- **Duração máxima:** 900 segundos (15 min)

## Responsabilidades

### 1. Monitoramento de Estoque
- Verificar produtos com estoque baixo
- Identificar produtos sem movimentação
- Alertar sobre rupturas iminentes

### 2. Acompanhamento de Pedidos
- Detectar pedidos pendentes há muito tempo
- Identificar problemas de fulfillment
- Monitorar taxa de cancelamento

### 3. Métricas de Saúde
- Calcular métricas operacionais:
  - Taxa de conversão
  - Ticket médio
  - CAC (Customer Acquisition Cost)
  - LTV (Lifetime Value)
- Comparar com benchmarks

### 4. Alertas Operacionais
- Notificar problemas críticos imediatamente
- Escalar quando necessário
- Sugerir ações corretivas

## Saída Esperada

```json
{
  "timestamp": "2026-04-11T06:00:00Z",
  "agent": "OpsBot",
  "scan_id": "ops_001",
  "alerts": [
    {
      "severity": "high",
      "type": "low_stock",
      "product": "Vaso Cerâmica Azul",
      "current_stock": 3,
      "reorder_point": 10,
      "action": "alert_sent"
    }
  ],
  "metrics": {
    "conversion_rate": "2.3%",
    "avg_ticket": "R$ 189,00",
    "pending_orders": 12
  },
  "status": "healthy"
}
```

## Arquivos Gerados
- `/opportunities/YYYYMMDD/ops_*.json` - Oportunidades operacionais
- `/evidencias/YYYYMMDD/opsbot_*.md` - Evidências do scan

## Thresholds de Alerta

| Métrica | Alerta | Crítico |
|---------|--------|---------|
| Estoque | < 10 unidades | < 3 unidades |
| Pedido pendente | > 24h | > 48h |
| Conversão | < 1.5% | < 1.0% |

## Integração com Shopify

O OpsBot consome dados da API Shopify para análise operacional. Requer:
- `SHOPIFY_ACCESS_TOKEN`
- `SHOPIFY_STORE`

## Regras

1. **Alertas HIGH severity** → notificação imediata
2. **Dados sempre reais** - via Shopify API
3. **Sugerir ações práticas** - não apenas reportar
4. **Manter histórico** - tendências são importantes

---

**Nota:** Alertas críticos são enviados imediatamente via Telegram.
