# OpsBot Scanner - 2026-04-22

> Scanner de Oportunidades Operacionais | Criativalia
> Dados fonte: Shopify API (dados reais) | Control Plane: Render

---

## 🎯 Resumo Executivo

**3 oportunidades críticas identificadas** a partir de análise de dados reais da Shopify. Valor em risco: **R$ 48.249** em pedidos pendentes de envio.

---

## 🔴 OPORTUNIDADE 1: Backlog de Fulfillment
- **impact_score:** 10/10
- **category:** fulfillment
- **urgency:** CRÍTICA

### Problema
100 pedidos com status "unshipped" acumulados, representando **R$ 48.249,33** em valor de mercadoria não entregue.

### Evidências
- Total unfulfilled orders: 100
- Valor total em risco: R$ 48.249,33
- Pedidos recentes: #2793 a #2789 (20-21/04/2026) — clientes esperando há 1-2 dias
- Itens mais acumulados: Arandela Articture (x30 unidades), Pendente CLARA (x8)

### Quick Win
1. Verificar status de produção/envio com fornecedores/operacional
2. Priorizar pedidos mais recentes (SLA de 48h)
3. Identificar se há gargalo em produção (modelo made-to-order) ou logística

### Owner: Operação/Fernando

---

## 🟠 OPORTUNIDADE 2: Inventário Não Rastreado no Shopify
- **impact_score:** 8/10
- **category:** inventory
- **urgency:** ALTA

### Problema
152 produtos ativos/published no Shopify com **inventory_management = null** (não rastreado) e quantity = 0. Nenhuma location configurada.

### Evidências
- Total products: 250
- Active + published: 152
- Active with stock: **0** (zero produtos com estoque positivo no Shopify)
- inventory_policy: deny (bloqueia venda sem estoque, mas como não é rastreado, comportamento pode ser inconsistente)
- Locations: 0 configuradas

### Hipóteses
1. Modelo made-to-order: produtos são fabricados sob encomenda, estoque gerido fora
2. Drop-shipping: fornecedor mantém estoque, não refletido no Shopify
3. Falta de configuração: ERP/planilha externa não integrada

### Quick Win
1. **Confirmar modelo operacional** com Fernando: made-to-order vs. estoque próprio?
2. Se for made-to-order: configurar tempo de produção visível no checkout (expectativa de entrega)
3. Se houver estoque físico: configurar inventory_tracking e locations no Shopify
4. Ativar rastreamento para evitar vendas de itens indisponíveis

### Owner: Operação + Tech

---

## 🟡 OPORTUNIDADE 3: Produtos em Rascunho (Não Ativados)
- **impact_score:** 5/10
- **category:** catalog
- **urgency:** MÉDIA

### Problema
98 produtos em status "draft" — potencial receita não capturada.

### Evidências
- Draft products: 98 de 250 total (39% do catálogo)
- Podem ser produtos novos pendentes de fotos/descrições ou produtos descontinuados

### Quick Win
1. Auditar lista de draft products
2. Identificar quais estão prontos para publicação (fotos OK, descrição OK, preço OK)
3. Ativar produtos viáveis → potencial de aumentar SKUs ativos em ~65%

### Owner: Marketing/Catálogo

---

## 📊 Métricas da Operação (Últimos 7 dias)

| Métrica | Valor |
|---------|-------|
| Receita 7d | R$ 3.998,04 |
| Receita 30d (amostra) | R$ 13.895,14 |
| Pedidos pagos (últimos 50) | 44 |
| Pedidos não cumpridos | 100 |
| Valor em risco | R$ 48.249,33 |
| Produtos ativos sem estoque | 152 |
| Produtos em draft | 98 |

---

## 🎬 Próximos Passos Recomendados

1. **[HOJE]** Contato com operacional sobre os 100 pedidos pendentes
2. **[ESTA SEMANA]** Decisão sobre modelo de estoque (rastrear no Shopify vs. externo)
3. **[ESTA SEMANA]** Revisão dos 98 produtos em draft para ativação

---

*Gerado por OpsBot Scanner | Dados reais Shopify API | 2026-04-22 13:06 UTC*
