# 🛒 SEQUÊNCIA CARRINHO ABANDONADO - PRONTA PARA IMPLEMENTAR

**Ferramenta:** Klaviyo (ou Shopify Email)  
**Status:** Pronta para copiar/colar  
**Impacto esperado:** 10-15% recuperação = +R$3.500/mês

---

## ⚙️ CONFIGURAÇÃO TÉCNICA (Klaviyo)

### Passo 1: Criar o Flow
1. Acesse: Flows → Create Flow → Build Your Own
2. Nome: "Carrinho Abandonado - Criativalia"
3. Trigger: "Abandoned Cart" (Metric: Started Checkout)

### Passo 2: Fluxograma
```
Started Checkout
      ↓
[Filter: Hasn't placed order since starting checkout]
      ↓
[Wait: 1 hour]
      ↓
Email #1: Lembrete Gentil
      ↓
[Wait: 23 hours]
      ↓
Email #2: Frete Grátis
      ↓
[Wait: 48 hours]
      ↓
Email #3: Última Chance
      ↓
[Exit]
```

### Passo 3: Exclusões
Adicione filtros para NÃO enviar para:
- Quem comprou nos últimos 3 dias
- Quem já recebeu este flow nos últimos 7 dias
- Emails que deram bounce

---

## 📧 EMAIL 1: LEMBRETE GENTIL (1 hora depois)

**Assunto:** Esqueceu algo? Seus itens estão esperando 🛒  
**Preview:** Dá uma olhada no que você deixou para trás...

### Template HTML (copiar para Klaviyo)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seu carrinho na Criativalia</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding:30px; text-align:center; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius:8px 8px 0 0;">
                            <h1 style="color:#ffffff; margin:0; font-size:24px;">Criativalia</h1>
                            <p style="color:#e0e0e0; margin:5px 0 0 0; font-size:14px;">Arte que ilumina</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding:40px 30px;">
                            <h2 style="color:#333333; margin:0 0 20px 0; font-size:22px;">Oi {{first_name|default:"there"}},</h2>
                            <p style="color:#666666; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
                                Notamos que você estava interessado em algumas peças incríveis, mas não finalizou sua compra.
                            </p>
                            <p style="color:#666666; font-size:16px; line-height:1.6; margin:0 0 30px 0;">
                                Não se preocupe, seus itens estão guardados aqui:
                            </p>
                            
                            <!-- Product Section -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9; border-radius:8px; margin:20px 0;">
                                <tr>
                                    <td style="padding:20px;">
                                        <h3 style="color:#333333; margin:0 0 15px 0; font-size:18px;">Itens no seu carrinho:</h3>
                                        
                                        {% for item in event.Items %}
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin:15px 0; border-bottom:1px solid #e0e0e0;">
                                            <tr>
                                                <td width="80" style="padding:10px 0;">
                                                    <img src="{{item.ImageURL}}" alt="{{item.Name}}" style="width:70px; height:70px; object-fit:cover; border-radius:4px;">
                                                </td>
                                                <td style="padding:10px;">
                                                    <p style="margin:0; color:#333333; font-weight:bold;">{{item.Name}}</p>
                                                    <p style="margin:5px 0 0 0; color:#666666; font-size:14px;">Qtd: {{item.Quantity}}</p>
                                                </td>
                                                <td align="right" style="padding:10px;">
                                                    <p style="margin:0; color:#667eea; font-weight:bold; font-size:16px;">R$ {{item.Price}}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        {% endfor %}
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                                            <tr>
                                                <td align="right">
                                                    <p style="margin:0; color:#333333; font-size:18px; font-weight:bold;">Total: R$ {{event.TotalPrice}}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{event.URL}}" style="display:inline-block; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#ffffff; text-decoration:none; padding:15px 40px; border-radius:30px; font-weight:bold; font-size:16px;">FINALIZAR MINHA COMPRA</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Benefits -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                                <tr>
                                    <td align="center" style="padding:20px; background-color:#f9f9f9; border-radius:8px;">
                                        <p style="margin:0 0 10px 0; color:#666666; font-size:14px;">🚚 Frete grátis para compras acima de R$400</p>
                                        <p style="margin:0 0 10px 0; color:#666666; font-size:14px;">✅ Garantia de 1 ano em todos os produtos</p>
                                        <p style="margin:0 0 10px 0; color:#666666; font-size:14px;">📦 Entrega em 5-7 dias úteis</p>
                                        <p style="margin:0; color:#666666; font-size:14px;">💳 Parcelamento em até 12x</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color:#666666; font-size:14px; line-height:1.6; margin:20px 0 0 0; text-align:center;">
                                Se tiver alguma dúvida, é só responder este email ou falar com a gente no WhatsApp.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 30px; text-align:center; border-top:1px solid #e0e0e0;">
                            <p style="color:#999999; font-size:12px; margin:0;">
                                Criativalia © 2026 - Todos os direitos reservados<br>
                                <a href="{% unsubscribe_link %}" style="color:#999999;">Descadastrar</a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 📧 EMAIL 2: FRETE GRÁTIS (24 horas depois)

**Assunto:** 🎁 Frete grátis para você! Só mais 48h  
**Preview:** Aproveite, seu carrinho ainda está disponível...

### Template HTML

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Frete Grátis - Criativalia</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding:30px; text-align:center; background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius:8px 8px 0 0;">
                            <h1 style="color:#ffffff; margin:0; font-size:24px;">🎁 FRETE GRÁTIS</h1>
                            <p style="color:#ffe0e0; margin:5px 0 0 0; font-size:14px;">Só para você, só por 48 horas</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding:40px 30px;">
                            <h2 style="color:#333333; margin:0 0 20px 0; font-size:22px;">{{first_name|default:"Oi"}},</h2>
                            <p style="color:#666666; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
                                Seus itens ainda estão esperando por você... e queremos tanto ver essas luminárias na sua casa que vamos fazer algo especial:
                            </p>
                            
                            <!-- Coupon Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius:8px; margin:20px 0;">
                                <tr>
                                    <td style="padding:30px; text-align:center;">
                                        <p style="color:#ffffff; margin:0 0 10px 0; font-size:14px; text-transform:uppercase; letter-spacing:2px;">CUPOM EXCLUSIVO</p>
                                        <p style="color:#ffffff; margin:0 0 10px 0; font-size:36px; font-weight:bold; letter-spacing:4px;">VOLTEI</p>
                                        <p style="color:#ffe0e0; margin:0; font-size:18px;">Frete Grátis em TODO o site</p>
                                        <p style="color:#ffe0e0; margin:10px 0 0 0; font-size:14px;">Válido por 48 horas</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Urgency -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                                <tr>
                                    <td style="padding:15px; background-color:#fff3cd; border-left:4px solid #ffc107; border-radius:4px;">
                                        <p style="margin:0; color:#856404; font-size:14px;">
                                            ⏰ <strong>Estoque limitado:</strong> Alguns dos itens no seu carrinho estão com poucas unidades disponíveis.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{event.URL}}" style="display:inline-block; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#ffffff; text-decoration:none; padding:15px 40px; border-radius:30px; font-weight:bold; font-size:16px;">COMPLETAR COM FRETE GRÁTIS</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- FAQ -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                                <tr>
                                    <td style="padding:20px; background-color:#f9f9f9; border-radius:8px;">
                                        <h4 style="color:#333333; margin:0 0 15px 0;">Dúvidas frequentes:</h4>
                                        <p style="margin:0 0 10px 0; color:#666666; font-size:14px;">
                                            <strong>❓ E se eu não gostar quando chegar?</strong><br>
                                            Você tem 7 dias para devolução, sem burocracia.
                                        </p>
                                        <p style="margin:0 0 10px 0; color:#666666; font-size:14px;">
                                            <strong>❓ Quanto tempo demora pra chegar?</strong><br>
                                            5-7 dias úteis para todo o Brasil.
                                        </p>
                                        <p style="margin:0; color:#666666; font-size:14px;">
                                            <strong>❓ É seguro comprar?</strong><br>
                                            Sim! Site com SSL e pagamento processado por Stripe/MercadoPago.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 30px; text-align:center; border-top:1px solid #e0e0e0;">
                            <p style="color:#999999; font-size:12px; margin:0;">
                                Criativalia © 2026 - Todos os direitos reservados<br>
                                <a href="{% unsubscribe_link %}" style="color:#999999;">Descadastrar</a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 📧 EMAIL 3: ÚLTIMA CHANCE (72 horas depois)

**Assunto:** ⏰ Último aviso: seu carrinho expira em 24h  
**Preview:** E esses produtos estão acabando...

### Template HTML

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Última Chance - Criativalia</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding:30px; text-align:center; background-color:#dc3545; border-radius:8px 8px 0 0;">
                            <h1 style="color:#ffffff; margin:0; font-size:24px;">⏰ ÚLTIMA CHANCE</h1>
                            <p style="color:#ffe0e0; margin:5px 0 0 0; font-size:14px;">Seu carrinho expira em 24 horas</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding:40px 30px;">
                            <h2 style="color:#333333; margin:0 0 20px 0; font-size:22px;">{{first_name|default:"Oi"}},</h2>
                            <p style="color:#666666; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
                                Este é meu último email sobre seu carrinho.
                            </p>
                            <p style="color:#666666; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
                                Nas próximas <strong>24 horas</strong>, seus itens voltarão para o estoque geral e poderão ser comprados por outra pessoa.
                            </p>
                            
                            <!-- Stock Alert -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                                <tr>
                                    <td style="padding:20px; background-color:#f8d7da; border:2px solid #dc3545; border-radius:8px; text-align:center;">
                                        <p style="margin:0 0 10px 0; color:#721c24; font-size:18px; font-weight:bold;">🔴 ESTOQUE LIMITADO</p>
                                        <p style="margin:0; color:#721c24; font-size:14px;">
                                            {% for item in event.Items %}
                                            • {{item.Name}} - Apenas {{item.Quantity|default:"poucas"}} unidades<br>
                                            {% endfor %}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Final CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{event.URL}}" style="display:inline-block; background-color:#dc3545; color:#ffffff; text-decoration:none; padding:18px 50px; border-radius:30px; font-weight:bold; font-size:18px;">RESGATAR MEUS ITENS AGORA</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                                <tr>
                                    <td style="padding:20px; background-color:#f9f9f9; border-radius:8px; text-align:center;">
                                        <p style="margin:0 0 15px 0; color:#666666; font-size:14px;">
                                            Se não quiser mais receber lembretes de carrinhos, <a href="{% unsubscribe_link %}" style="color:#667eea;">clique aqui</a>.
                                        </p>
                                        <p style="margin:0; color:#999999; font-size:12px;">
                                            Se precisar de ajuda com algo específico, é só responder este email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 30px; text-align:center; border-top:1px solid #e0e0e0;">
                            <p style="color:#999999; font-size:12px; margin:0;">
                                Criativalia © 2026 - Todos os direitos reservados<br>
                                <a href="{% unsubscribe_link %}" style="color:#999999;">Descadastrar</a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 📊 CONFIGURAÇÕES ADICIONAIS

### Email de Confirmação (Imediato)
**Trigger:** Placed Order  
**Delay:** 0 minutos

**Assunto:** 🎉 Pedido confirmado! Obrigado por escolher a Criativalia  
**Conteúdo:** Número do pedido, resumo, previsão de entrega, código de rastreio (quando disponível)

### Email de Entrega (Quando enviado)
**Trigger:** Fulfilled Order  
**Delay:** 0 minutos

**Assunto:** 🚚 Seu pedido está a caminho!  
**Conteúdo:** Código de rastreio, link para rastreamento, dicas de instalação

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar flow "Carrinho Abandonado" no Klaviyo
- [ ] Configurar trigger "Started Checkout"
- [ ] Adicionar filtros de exclusão
- [ ] Copiar templates HTML dos 3 emails
- [ ] Personalizar cores se necessário (match com marca)
- [ ] Testar envio (modo preview)
- [ ] Ativar flow (set to Live)
- [ ] Monitorar métricas: Taxa de abertura, clique, conversão

---

## 📈 MÉTRICAS ESPERADAS

| Email | Abertura | Clique | Conversão |
|-------|----------|--------|-----------|
| Email 1 (1h) | 45% | 8% | 3% |
| Email 2 (24h) | 35% | 10% | 4% |
| Email 3 (72h) | 25% | 12% | 3% |
| **TOTAL** | - | - | **10%** |

**Impacto financeiro (estimativa):**
- 100 carrinhos abandonados/mês
- 10% recuperação = 10 pedidos
- Ticket médio R$397 = **R$3.970/mês recuperados**

---

**Arquivo salvo em:** `/root/.openclaw/workspace/criativalia/estrategias/SEQUENCIA_CARRINHO_ABANDONADO_KLAVIYO.md`
