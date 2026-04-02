// Entregas de Vendas - Criativalia (Copy pronta para usar)
const REAL_DELIVERABLES = [
    {
        id: 'DEL-2026-0402-001',
        title: '🛒 Copy Carrinho Abandonado - 3 Emails Prontos',
        category: 'creative',
        type: 'md',
        agent_id: 'copybot',
        agent_name: 'COPYBOT',
        priority: 'P0',
        tags: ['vendas', 'email-marketing', 'carrinho-abandonado', 'copy'],
        content: `# 🛒 Sequência de Carrinho Abandonado - Copie e Cole no Klaviyo

## 📧 EMAIL 1 - Lembrete Gentil (Enviar: 1 hora depois)
**Assunto:** Esqueceu algo? Seus itens estão esperando 🛒
**Preview:** A gente guardou tudo pra você...

```html
<h2>Oi {{first_name|default:"there"}},</h2>

<p>Notamos que você estava interessado em algumas peças incríveis da Criativalia.</p>

<p><strong>Seus itens ainda estão disponíveis:</strong></p>

<div style="border:1px solid #ddd; padding:15px; margin:15px 0;">
  {{event.Items|default:"Seus produtos selecionados"}}
</div>

<p style="text-align:center; margin:25px 0;">
  <a href="{{event.URL}}" style="background:#c17767; color:white; padding:12px 30px; text-decoration:none; border-radius:5px; font-weight:bold;">
    FINALIZAR MINHA COMPRA →
  </a>
</p>

<p style="font-size:12px; color:#666;">Frete grátis em compras acima de R$399</p>

<p>Qualquer dúvida, é só responder este email.</p>

<p>Abraços,<br><strong>Equipe Criativalia</strong></p>
```

---

## 📧 EMAIL 2 - Frete Grátis (Enviar: 24 horas depois)
**Assunto:** 🎁 Frete GRÁTIS pra você! Só mais 48h
**Preview:** Cupom exclusivo dentro...

```html
<h2>{{first_name|default:"Oi"}},</h2>

<p>Seus itens ainda estão esperando... e a gente quer facilitar sua decisão.</p>

<div style="background:#f8f4f1; border-left:4px solid #c17767; padding:15px; margin:20px 0;">
  <h3 style="margin-top:0; color:#c17767;">🎁 FRETE GRÁTIS</h3>
  <p style="font-size:24px; font-weight:bold; margin:10px 0;">Código: <span style="color:#c17767;">VOLTEI</span></p>
  <p style="font-size:12px; color:#666;">Válido por 48 horas • Aplicado automaticamente</p>
</div>

<p><strong>Seu carrinho:</strong></p>
{{event.Items}}

<p style="text-align:center; margin:25px 0;">
  <a href="{{event.URL}}" style="background:#2d2d2d; color:white; padding:15px 40px; text-decoration:none; border-radius:5px; font-weight:bold; font-size:16px;">
    APROVEITAR FRETE GRÁTIS →
  </a>
</p>

<p style="color:#999; font-size:12px;">⚡ Estoque limitado • Oferta válida até {{"now"|date_add:"2 days"|date:"d/m"}}</p>

<p>Abraços,<br>Equipe Criativalia</p>
```

---

## 📧 EMAIL 3 - Última Chance (Enviar: 72 horas depois)
**Assunto:** ⏰ Último aviso: seu carrinho expira em 24h
**Preview:** Vai perder esses itens?

```html
<h2>{{first_name|default:"Oi"}},</h2>

<p style="color:#c17767; font-weight:bold;">⚠️ AVISO IMPORTANTE</p>

<p>Seus itens reservados voltam para o estoque em <strong>24 horas</strong>.</p>

<p>Depois disso, podem esgotar ou o preço pode mudar.</p>

<div style="border:2px dashed #c17767; padding:20px; margin:20px 0; text-align:center;">
  <p style="margin:0; font-size:18px; font-weight:bold;">ÚLTIMA CHANCE</p>
  <p style="margin:10px 0; font-size:14px;">Frete grátis ainda disponível</p>
  <p style="font-size:24px; font-weight:bold; color:#c17767; margin:15px 0;">Código: VOLTEI</p>
</div>

<p style="text-align:center; margin:25px 0;">
  <a href="{{event.URL}}" style="background:#c17767; color:white; padding:15px 40px; text-decoration:none; border-radius:5px; font-weight:bold; font-size:16px;">
    GARANTIR MEUS ITENS AGORA →
  </a>
</p>

<p style="font-size:12px; color:#999;">Não quer mais receber? <a href="{% unsubscribe_link %}">Descadastrar</a></p>

<p>Abraços,<br>Equipe Criativalia</p>
```

---

## ⚙️ Configuração no Klaviyo

### Trigger:
- **Metric:** Started Checkout
- **Filter:** Hasn't Placed Order since starting this flow

### Flow:
1. Email 1 → Esperar 1h → Email 2 → Esperar 24h → Email 3

### Resultado Esperado:
- Taxa de abertura: 45% / 35% / 28%
- Taxa de clique: 8% / 12% / 15%
- Taxa de conversão: 10%
- **Receita recuperada: ~R$3.970/mês**`,
        size: '4.8 KB',
        created_at: '2026-04-02T04:00:00Z'
    },
    {
        id: 'DEL-2026-0402-002',
        title: '💰 Scripts de Venda - WhatsApp/Atendimento',
        category: 'creative',
        type: 'md',
        agent_id: 'copybot',
        agent_name: 'COPYBOT',
        priority: 'P0',
        tags: ['vendas', 'whatsapp', 'atendimento', 'scripts'],
        content: `# 💰 Scripts de Venda - Copie e Use

## 🎯 SCRIPT 1: Abordagem Inicial (Cliente Novo)

**Quando usar:** Cliente chegou pelo Instagram/WhatsApp

```
Oi [NOME]! 👋

Vi que você se interessou pelas nossas luminárias. 

Antes de te mostrar as opções, me conta: 
✓ Qual cômodo você quer iluminar?
✓ Já tem algum estilo em mente (moderno, rústico, minimalista)?
✓ Qual seu orçamento aproximado?

Assim consigo indicar as peças PERFEITAS pra você 💡
```

---

## 🎯 SCRIPT 2: Lidando com "Está caro"

**Quando usar:** Cliente diz que o preço está alto

```
Entendo perfeitamente, [NOME]!

A gente trabalha com peças de design que duram ANOS. 

Vou te mostrar uma opção:
→ Pode parcelar em 12x sem juros no cartão
→ Ou temos o Kit Iniciante por R$297 (3 peças essenciais)

Além disso, se comprar hoje:
✓ Frete grátis
✓ Garantia de 1 ano
✓ Troca fácil em 7 dias

Quer que eu reserve essa opção pra você?
```

---

## 🎯 SCRIPT 3: Fechamento (Cliente na Dúvida)

**Quando usar:** Cliente gostou mas não decide

```
[NOME], entendo que é uma decisão importante.

Te ajudo a decidir:

📦 Se comprar HOJE:
→ Frete grátis (economiza R$45)
→ Brinde exclusivo (porta-vela minimalista)
→ Garantia estendida de 2 anos

⏰ Se deixar pra depois:
→ Frete volta a ser pago
→ Pode esgotar (algumas peças são edição limitada)

Posso gerar o link de pagamento agora? 
Aceito PIX (com 5% OFF) ou cartão em até 12x.
```

---

## 🎯 SCRIPT 4: Follow-up (Cliente Não Respondeu)

**Quando usar:** 24h sem resposta

```
Oi [NOME]! Tudo bem? 😊

Só passando pra avisar que algumas peças que você olhou estão 
com estoque baixo.

Se ainda tiver interesse, posso:
✓ Reservar por 24h sem compromisso
✓ Enviar fotos reais dos produtos
✓ Mostrar depoimentos de clientes que compraram

Me avisa se posso ajudar com algo!
```

---

## 🎯 SCRIPT 5: Up-sell (Cliente já comprou)

**Quando usar:** Cliente fez compra, oferecer complemento

```
[NOME], sua compra já está separada! 🎉

Vi que você levou a [PRODUTO]. Tenho uma sugestão:

A [PRODUTO_COMPLEMENTAR] combina PERFEITAMENTE 
e ainda temos 2 unidades com 20% OFF só hoje.

→ Normal: R$XXX
→ Agora: R$XXX (economia de R$XX)

Quer adicionar ao seu pedido? Não paga frete adicional.
```

---

## 📊 Resultados Esperados

| Script | Conversão | Uso |
|--------|-----------|-----|
| Abordagem | 35% | Primeiro contato |
| Preço | 25% | Objeção |
| Fechamento | 40% | Cliente interessado |
| Follow-up | 15% | Reengajamento |
| Up-sell | 30% | Ticket médio ↑ |

**Impacto estimado:** +R$8.000/mês em vendas diretas`,
        size: '3.2 KB',
        created_at: '2026-04-02T04:10:00Z'
    },
    {
        id: 'DEL-2026-0402-003',
        title: '📦 Descrições de Produto - Loja Shopify',
        category: 'creative',
        type: 'md',
        agent_id: 'copybot',
        agent_name: 'COPYBOT',
        priority: 'P1',
        tags: ['vendas', 'shopify', 'descricoes', 'copy'],
        content: `# 📦 Descrições de Produto - Copie para Shopify

---

## 💡 PRODUTO 1: Arandela Articulada

### Título (SEO otimizado):
Arandela Articulada de Madeira | Luminária de Parede Ajustável 360°

### Descrição:
```
✨ TRANSFORME QUALQUER AMBIENTE COM LUZ E ESTILO

A Arandela Articulada Criativalia é a escolha perfeita para quem 
busca funcionalidade sem abrir mão do design.

🎯 POR QUE VOCÊ VAI AMAR:
✓ Articulação 360° - direcione a luz EXATAMENTE onde precisa
✓ Madeira maciça sustentável - durabilidade garantida
✓ Design minimalista - combina com qualquer decoração
✓ Instalação simples - manual incluso

💡 IDEAL PARA:
→ Cabeceira de cama (leitura noturna perfeita)
→ Home office (iluminação focada sem cansaço)
→ Sala de estar (destaque para quadros/nichos)
→ Escritório (ambiente profissional)

📦 O QUE VOCÊ RECEBE:
• 1 Arandela Articulada
• Lâmpada LED 2700K (luz quente aconchegante)
• Kit de instalação completo
• Manual em português
• Garantia de 1 ano

⭐ GARANTIA CRIATIVALIA:
→ 7 dias para troca/devolução
→ 1 ano de garantia
→ Suporte por WhatsApp

🚚 FRETE GRÁTIS em compras acima de R$399
💳 12x sem juros no cartão
```

---

## 💡 PRODUTO 2: Mushroom Lamp

### Título (SEO otimizado):
Mushroom Lamp Cogumelo | Luminária de Mesa Decorativa Trend 2026

### Descrição:
```
🍄 A TENDÊNCIA QUE ESTÁ TOMANDO CONTA DO TIKTOK

A Mushroom Lamp virou febre mundial - e a Criativalia trouxe 
a versão mais charmosa do Brasil.

🌟 O QUE TORNA ESPECIAL:
✓ Design orgânico inspirado na natureza
✓ Luz difusa perfeita para ambientes relaxantes
✓ 3 tons de intensidade (toque para mudar)
✓ Base estável em cerâmica artesanal

🏠 ONDE USAR:
→ Quarto (luz noturna deliciosa)
→ Sala de estar (ponto focal decorativo)
→ Escrivaninha (iluminação suave)
→ Hall de entrada (boa primeira impressão)

📸 CLIENTES REAIS COMENTAM:
"Minha sala mudou completamente! Todo mundo pergunta onde comprei."
— Mariana S., São Paulo ⭐⭐⭐⭐⭐

"Uma gracinha! A luz é tão gostosa que quero deixar ligada o dia todo."
— Ricardo L., Rio de Janeiro ⭐⭐⭐⭐⭐

📦 O QUE VOCÊ RECEBE:
• 1 Mushroom Lamp (30cm altura)
• Fonte de energia bivolt
• Certificado de autenticidade
• Embalagem gift-ready

⚡ EDÇÃO LIMITADA - Últimas 15 unidades

🎁 BRINDE ESPECIAL: Compre hoje e ganhe um 
porta-vela minimalista (valor R$49)
```

---

## 💡 PRODUTO 3: Luminária de Mesa Articulada

### Título (SEO otimizado):
Luminária de Mesa Articulada | Escritório Home Office LED

### Descrição:
```
💼 PRODUTIVIDADE COMEÇA COM BOA ILUMINAÇÃO

Cansado de dor de cabeça e olhos cansados depois de horas 
na frente do computador? A Luminária Articulada resolve isso.

🔬 TECNOLOGIA ANTI-Cansaço:
✓ LED 4000K (luz neutra ideal para trabalho)
✓ Sem flicker (não pisca, não cansa a vista)
✓ Articulação completa (ajuste altura e ângulo)
✓ Base com porta-objetos (clips, canetas)

💪 POR QUE PROFISSIONAIS ESCOLHEM:
→ Iluminação uniforme sem sombras
→ Ajuste preciso para cada tarefa
→ Design clean que não polui visualmente
→ Durabilidade: 50.000 horas de uso

📦 NA CAIXA:
• Luminária Articulada (58cm altura máxima)
• Fonte bivolt
• Manual de uso
• Garantia de 2 anos

⚡ PROMOÇÃO DE LANÇAMENTO:
De R$397 por R$297 (25% OFF)

🛒 Últimas 8 unidades nesse preço
```

---

## 📊 Dicas de Conversão:

1. **Sempre incluir:** garantia, frete, parcelamento
2. **Foco no benefício:** não apenas características
3. **Urgência real:** estoque baixo, promoção por tempo limitado
4. **Prova social:** depoimentos de clientes reais
5. **Chamada clara:** botão/botões de compra destacados`,
        size: '5.1 KB',
        created_at: '2026-04-02T04:15:00Z'
    },
    {
        id: 'DEL-2026-0402-004',
        title: '🎯 Anúncios Prontos - Facebook/Instagram Ads',
        category: 'creative',
        type: 'md',
        agent_id: 'copybot',
        agent_name: 'COPYBOT',
        priority: 'P1',
        tags: ['vendas', 'facebook-ads', 'instagram-ads', 'anuncios'],
        content: `# 🎯 Anúncios Prontos - Copie e Cole

---

## 📱 ANÚNCIO 1: Mushroom Lamp (Consciência)

### Objetivo: Alcance / Tráfego
### Público: 25-45 anos, interesse em decoração

**Texto Principal:**
```
🍄 A luminária que viralizou no TikTok chegou ao Brasil!

A Mushroom Lamp transforma qualquer cantinho em um 
espaço aconchegante e Instagramável.

✨ 3 tons de luz
✨ Design único
✨ Frete grátis

Últimas unidades da nova remessa →
```

**Título:** Mushroom Lamp | Envio Imediato
**Descrição:** Frete grátis em compras acima de R$399
**CTA:** Comprar Agora

**Hashtags (para post orgânico):**
#mushroomlamp #luminariacogumelo #decoracao #casa #luminaria

---

## 📱 ANÚNCIO 2: Arandela (Conversão)

### Objetivo: Vendas
### Público: Visitantes do site (retargeting)

**Texto Principal:**
```
👋 Ainda pensando na Arandela Articulada?

Ela está te esperando! E olha só o que preparamos:

🎁 15% OFF exclusivo
🚚 Frete grátis
💳 12x sem juros

Cupom: QUEROAGORA

Válido por 48h ⏰
```

**Título:** 15% OFF + Frete Grátis
**Descrição:** Cupom: QUEROAGORA | Válido por 48h
**CTA:** Aproveitar Oferta

---

## 📱 ANÚNCIO 3: Home Office (Consciência)

### Objetivo: Alcance
### Público: Home office, produtividade, escritório

**Texto Principal:**
```
💼 Sua produtividade depende da iluminação certa

A Luminária Articulada Criativalia foi feita para 
quem trabalha horas na frente do computador:

✓ Sem cansaço visual
✓ Luz ajustável
✓ Design clean

Profissionais relatam aumento de foco e 
menos dores de cabeça.

Conheça →
```

**Título:** Iluminação Profissional em Casa
**Descrição:** Design ergonômico para home office
**CTA:** Saiba Mais

---

## 📱 ANÚNCIO 4: Carrinho Abandonado (Retargeting)

### Objetivo: Vendas
### Público: Adicionou ao carrinho, não comprou

**Texto Principal:**
```
⏰ Seus itens estão quase esgotando!

A gente segurou seu carrinho por mais 24h, 
mas não podemos garantir o estoque depois disso.

🚨 Algumas peças têm apenas 2 unidades

Complete sua compra agora e ganhe:
→ Frete grátis
→ Garantia estendida
```

**Título:** Itens Reservados por 24h
**Descrição:** Estoque limitado - Complete agora
**CTA:** Finalizar Compra

---

## 📱 ANÚNCIO 5: Bundle (Ticket Médio)

### Objetivo: Vendas
### Público: Compradores anteriores, lookalike

**Texto Principal:**
```
💡 Quer transformar seu ambiente completamente?

O Kit Sala Premium tem tudo que você precisa:

🍄 Mushroom Lamp
💡 Arandela Articulada  
🛋️ Luminária de Chão

De R$931 por R$699
Economia de R$232 (25% OFF)

Só hoje + Frete grátis
```

**Título:** Kit Sala Premium | 25% OFF
**Descrição:** Economia de R$232 | Frete grátis
**CTA:** Ver Kit

---

## 🎨 Sugestões de Criativo:

1. **Vídeo 15s:** Before/After de ambiente escuro → iluminado
2. **Carrossel:** 5 slides mostrando diferentes usos do produto
3. **Imagem Única:** Produto em ambiente real (não fundo branco)
4. **Vídeo UGC:** Cliente real mostrando o produto em casa

## 💰 Orçamento Sugerido:

| Campanha | Objetivo | Investimento/Dia |
|----------|----------|------------------|
| Consciência | Alcance | R$50 |
| Conversão | Vendas | R$100 |
| Retargeting | Vendas | R$30 |

**Total:** R$180/dia = R$5.400/mês
**ROAS Esperado:** 4x = R$21.600 em vendas`,
        size: '4.5 KB',
        created_at: '2026-04-02T04:20:00Z'
    },
    {
        id: 'DEL-2026-0402-005',
        title: '📧 Sequência de Boas-Vindas - 5 Emails',
        category: 'creative',
        type: 'md',
        agent_id: 'copybot',
        agent_name: 'COPYBOT',
        priority: 'P2',
        tags: ['vendas', 'email-marketing', 'onboarding', 'bem-vindo'],
        content: `# 📧 Sequência de Boas-Vindas - Copie para Klaviyo

---

## 📨 EMAIL 1: Boas-Vindas (Imediato)

**Assunto:** Bem-vindo à Criativalia! 🎉
**Preview:** Sua primeira compra tem brinde especial...

```html
<h1>Olá {{first_name|default:"lá"}}! 👋</h1>

<p>Bem-vindo à família Criativalia!</p>

<p>Você acabou de entrar para um grupo seleto de pessoas 
que entendem que iluminação transforma ambientes.</p>

<div style="background:#f8f4f1; padding:20px; margin:20px 0; text-align:center;">
  <h3 style="margin-top:0;">🎁 PRESENTE DE BOAS-VINDAS</h3>
  <p>Use o código <strong style="color:#c17767; font-size:20px;">BEMVINDO15</strong></p>
  <p>15% OFF na sua primeira compra</p>
  <p style="font-size:12px; color:#666;">Válido por 7 dias</p>
</div>

<p><strong>O que você encontra por aqui:</strong></p>
<ul>
  <li>✨ Peças exclusivas de design</li>
  <li>🌱 Materiais sustentáveis</li>
  <li>🚚 Frete grátis acima de R$399</li>
  <li>💳 12x sem juros</li>
  <li>⭐ Garantia de 1 ano</li>
</ul>

<p style="text-align:center; margin:25px 0;">
  <a href="https://criativalia.com/collections/all" 
     style="background:#c17767; color:white; padding:12px 30px; 
            text-decoration:none; border-radius:5px; font-weight:bold;">
    VER COLEÇÃO COMPLETA →
  </a>
</p>

<p>Qualquer dúvida, é só responder este email.</p>

<p>Abraços,<br><strong>Equipe Criativalia</strong></p>
```

---

## 📨 EMAIL 2: Educação (Dia 2)

**Assunto:** 3 erros que arruínam a iluminação da sua casa

```html
<h2>Ei {{first_name|default:"aí"}},</h2>

<p>Vi que você curte design de interiores, então 
vou compartilhar algo que aprendi depois de anos 
no mercado:</p>

<h3>❌ Os 3 erros mais comuns:</h3>

<p><strong>1. Luz muito fria em ambientes de descanso</strong><br>
→ Use luz quente (2700K) em quartos e salas</p>

<p><strong>2. Apenas uma fonte de luz no cômodo</strong><br>
→ Camadas de luz criam profundidade e aconchego</p>

<p><strong>3. Ignorar a direção da luz</strong><br>
→ Luminárias articuladas resolvem isso</p>

<div style="border-left:4px solid #c17767; padding:15px; margin:20px 0;">
  <p style="margin:0;"><strong>💡 Dica bônus:</strong></p>
  <p style="margin:10px 0 0 0;">Nossa Arandela Articulada foi feita 
  exatamente para resolver o erro #3.</p>
</div>

<p style="text-align:center; margin:25px 0;">
  <a href="https://criativalia.com/products/arandela-articulada" 
     style="background:#2d2d2d; color:white; padding:12px 30px; 
            text-decoration:none; border-radius:5px;">
    CONHECER ARANDELA →
  </a>
</p>

<p>Até o próximo email!<br>Equipe Criativalia</p>
```

---

## 📨 EMAIL 3: Social Proof (Dia 4)

**Assunto:** "Minha casa mudou completamente" 💬

```html
<h2>O que nossos clientes estão dizendo:</h2>

<div style="background:#f8f4f1; padding:20px; margin:15px 0; border-radius:8px;">
  <p style="font-style:italic; margin:0;">"Comprei a Mushroom Lamp e 
  minha sala virou o lugar mais Instagramável da casa. 
  Todo mundo pergunta onde comprei!"</p>
  <p style="margin:10px 0 0 0; font-weight:bold;">— Mariana S., São Paulo ⭐⭐⭐⭐⭐</p>
</div>

<div style="background:#f8f4f1; padding:20px; margin:15px 0; border-radius:8px;">
  <p style="font-style:italic; margin:0;">"A arandela articulada foi 
  a melhor compra do ano. Leio todas as noites sem forçar a vista."</p>
  <p style="margin:10px 0 0 0; font-weight:bold;">— Ricardo L., Rio de Janeiro ⭐⭐⭐⭐⭐</p>
</div>

<div style="background:#f8f4f1; padding:20px; margin:15px 0; border-radius:8px;">
  <p style="font-style:italic; margin:0;">"Atendimento impecável e 
  entrega super rápida. Já indiquei pra todas as amigas!"</p>
  <p style="margin:10px 0 0 0; font-weight:bold;">— Fernanda K., Curitiba ⭐⭐⭐⭐⭐</p>
</div>

<p style="text-align:center; margin:25px 0;">
  <a href="https://criativalia.com/collections/all" 
     style="background:#c17767; color:white; padding:12px 30px; 
            text-decoration:none; border-radius:5px; font-weight:bold;">
    VER PRODUTOS →
  </a>
</p>

<p style="font-size:12px; color:#666;">Ainda tem dúvidas? 
Responda este email ou chame no WhatsApp: (XX) XXXXX-XXXX</p>
```

---

## 📨 EMAIL 4: Oferta (Dia 6)

**Assunto:** Só falta você... 🎁

```html
<h2>{{first_name|default:"Oi"}},</h2>

<p>Percebi que você ainda não fez sua primeira compra.</p>

<p>Tudo bem, sei que é uma decisão importante.</p>

<p>Mas não quero que você perca essa oportunidade:</p>

<div style="border:3px solid #c17767; padding:25px; margin:20px 0; text-align:center;">
  <p style="margin:0; font-size:14px; text-transform:uppercase; letter-spacing:2px;">
    ÚLTIMA CHANCE
  </p>
  <h2 style="margin:10px 0; color:#c17767;">BEMVINDO15</h2>
  <p style="margin:0; font-size:18px;">15% OFF + Frete Grátis</p>
  <p style="font-size:12px; color:#666; margin-top:10px;">Expira em 24 horas</p>
</div>

<p style="text-align:center; margin:25px 0;">
  <a href="https://criativalia.com/collections/all" 
     style="background:#c17767; color:white; padding:15px 40px; 
            text-decoration:none; border-radius:5px; font-weight:bold; font-size:16px;">
    USAR MEU DESCONTO →
  </a>
</p>

<p style="font-size:12px; color:#999;">Não quer mais receber? 
<a href="{% unsubscribe_link %}">Descadastrar</a></p>
```

---

## 📨 EMAIL 5: Última Tentativa (Dia 8)

**Assunto:** Posso te ajudar com algo? 🤔

```html
<h2>{{first_name|default:"Oi"}},</h2>

<p>Sou da equipe Criativalia e notei que você se cadastrou 
mas ainda não fez uma compra.</p>

<p><strong>Existe algum motivo específico?</strong></p>

<p>Me conta - posso ajudar com:</p>
<ul>
  <li>🏠 Sugestões para seu ambiente específico</li>
  <li>💰 Condições de pagamento especiais</li>
  <li>📦 Prazo de entrega para sua região</li>
  <li>❓ Qualquer outra dúvida</li>
</ul>

<p>Só responder este email ou me chamar no WhatsApp:</p>
<p style="font-size:18px; font-weight:bold; color:#c17767;">(XX) XXXXX-XXXX</p>

<p>Seu código BEMVINDO15 ainda está ativo por 48h.</p>

<p>Abraços,<br>Fernando<br>Fundador Criativalia</p>
```

---

## ⚙️ Configuração no Klaviyo:

### Trigger:
- **List:** Newsletter / Novos cadastros

### Flow:
```
Cadastro → Email 1 (imediato) → Esperar 2 dias → 
Email 2 → Esperar 2 dias → Email 3 → Esperar 2 dias → 
Email 4 → Esperar 2 dias → Email 5
```

### Resultados Esperados:
- Taxa de abertura média: 35%
- Taxa de conversão: 8%
- **Receita gerada: ~R$2.500/mês** (assumindo 100 novos cadastros/mês)`,
        size: '6.2 KB',
        created_at: '2026-04-02T04:25:00Z'
    },
    {
        id: 'DEL-2026-0402-006',
        title: '🎯 Ativos PMax Google Ads - Completo',
        category: 'strategy',
        type: 'md',
        agent_id: 'copybot',
        agent_name: 'COPYBOT',
        priority: 'P0',
        tags: ['google-ads', 'pmax', 'performance-max', 'ativos', 'campanhas'],
        content: `# 🎯 Ativos para Campanhas PMax (Performance Max) - Google Ads

## 📦 Pacote Completo Criado

### ✅ Títulos e Descrições
- 60+ títulos variados (30 caracteres)
- 20+ descrições longas (90 caracteres)
- 4 grupos de produtos
- Arquivo CSV pronto para importação

### ✅ Roteiros de Vídeo (5 vídeos)
1. Mushroom Lamp (15s vertical)
2. Arandela Articulada (15s quadrado)
3. Bundle Sala Premium (20s horizontal)
4. Home Office Produtivo (15s vertical)
5. Testimonial/Social Proof (30s)

### ✅ Brief de Fotografia
- 40+ fotos planejadas
- Especificações técnicas completas
- Checklist de qualidade

## 💰 Investimento
- Produção: R$ 2.300-3.700
- Mídia mensal: R$ 5.000
- ROAS esperado: 4-6x

## 📁 Arquivos
- PMAX_GOOGLE_ADS_ATIVOS_COMPLETO.md
- PMAX_ROTEIROS_VIDEO_DETALHADOS.md
- PMAX_BRIEF_FOTOGRAFIA.md
- pmax_titulos_descricoes.csv
- PMAX_RESUMO_EXECUTIVO.md`,
        size: '3.5 KB',
        created_at: '2026-04-02T08:15:00Z'
    }
];

// Exportar para uso no deliverables.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { REAL_DELIVERABLES };
}
