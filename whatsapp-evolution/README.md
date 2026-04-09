# 📱 WhatsApp Evolution API - Disparador Anti-Block

Sistema de disparo de mensagens WhatsApp usando Evolution API com técnicas avançadas de anti-bloqueio.

## ⚠️ Aviso Legal

Este sistema é para **testes e desenvolvimento**. O uso em produção deve migrar para:
- **WhatsApp Business API (Oficial)**
- Meta for Developers

O WhatsApp pode banir números que violam seus termos de serviço.

---

## 🛡️ Técnicas Anti-Block Implementadas

| Técnica | Descrição | Configuração |
|---------|-----------|--------------|
| **Delay Aleatório** | Intervalos variáveis entre mensagens (3-8s) | `DELAY_MIN_MS`, `DELAY_MAX_MS` |
| **Rate Limiting** | Máximo 30 mensagens/hora, 200/dia | `MESSAGES_PER_HOUR_MAX`, `DAILY_LIMIT` |
| **Cooldown** | Pausa de 15min após cada 10 mensagens | `COOLDOWN_AFTER_MESSAGES` |
| **Horário Comercial** | Só envia 9h-18h, sem fins de semana | `BUSINESS_HOURS_ONLY` |
| **Spin-Tax** | Variação automática de texto | `RANDOMIZE_MESSAGE` |
| **Simulação de Digitação** | Mostra "digitando..." antes de enviar | `humanLike.typingDelay` |
| **Pausas Aleatórias** | Pausas ocasionais de 5-15s | `humanLike.randomPauses` |
| **Deduplicação** | Não reenvia para mesmo número no dia | Arquivo `sent-today.txt` |

---

## 🚀 Setup

### 1. Instalar Evolution API

Você precisa de uma instância Evolution API rodando. Opções:

**Docker (Recomendado):**
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua_chave_segura \
  atendai/evolution-api:latest
```

**Ou use um servidor já configurado.**

### 2. Configurar este projeto

```bash
cd whatsapp-evolution/scripts
bash setup.sh
```

### 3. Configurar credenciais

Edite `config/.env`:
```bash
EVOLUTION_API_URL=http://localhost:8080  # ou seu servidor
EVOLUTION_API_KEY=sua_api_key_aqui
INSTANCE_NAME=criativalia-bot

# Anti-block settings
DELAY_MIN_MS=3000
DELAY_MAX_MS=8000
MESSAGES_PER_HOUR_MAX=30
DAILY_LIMIT=200
```

### 4. Criar instância no Evolution

1. Acesse `http://localhost:8080/manager`
2. Crie uma nova instância
3. Escaneie o QR Code com seu WhatsApp
4. Copie o nome da instância para `.env`

---

## 📋 Uso

### Formato da Lista

Arquivo CSV com: `telefone,nome`
```
5511999999999,Fernando Silva
5511888888888,Maria Oliveira
```

> **Importante:** Use formato internacional (55 + DDD + número)

### Comandos

**Enviar mensagens:**
```bash
node sender.js send contatos.csv "Sua mensagem aqui"
```

**Com variáveis:**
```bash
node sender.js send contatos.csv "Olá {nome}! Tudo bem? Temos novidades 🚀"
```

**Ver status:**
```bash
node sender.js status
```

**Resetar contador:**
```bash
node sender.js reset
```

---

## 🎨 Personalização de Mensagens

### Variáveis Disponíveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{nome}` | Nome do contato | "Fernando" |
| `{telefone}` | Número formatado | "5511999999999" |
| `{spin}` | Variação aleatória | Ver config |

### Spin-Tax (Variações de Texto)

Editar `config/settings.json`:
```json
{
  "messages": {
    "templates": [
      "Olá {nome}! {spin}"
    ],
    "spinTax": {
      "enabled": true,
      "variations": [
        ["Olá", "Oi", "E aí", "Hey"],
        ["tudo bem", "como vai", "beleza"]
      ]
    }
  }
}
```

Resultado aleatório:
- "Olá Fernando! tudo bem"
- "Oi Maria! como vai"
- "E aí João! beleza"

---

## ⚙️ Configurações Avançadas

### settings.json

```json
{
  "antiBlock": {
    "delayBetweenMessages": {
      "min": 3000,      // Mínimo 3 segundos
      "max": 8000       // Máximo 8 segundos
    },
    "messagesPerBatch": {
      "max": 10,        // Pausa após 10 msgs
      "cooldownMinutes": 15
    },
    "dailyLimits": {
      "maxMessages": 200,
      "resetAt": "00:00"
    },
    "businessHours": {
      "enabled": true,
      "start": "09:00",
      "end": "18:00",
      "skipWeekends": true
    },
    "humanLike": {
      "typingDelay": {
        "enabled": true,
        "charsPerSecond": 5
      },
      "randomPauses": {
        "enabled": true,
        "probability": 0.1,  // 10% chance
        "durationSeconds": [5, 10, 15]
      }
    }
  }
}
```

---

## 📊 Logs

Todos os envios são logados em `logs/YYYY-MM-DD.jsonl`:

```json
{"timestamp":"2026-04-09T10:30:00Z","level":"info","message":"Mensagem enviada","phone":"5511999999999","status":"sent","sentToday":1}
```

---

## 🔒 Segurança

- ✅ Nunca commitar `config/.env`
- ✅ Rotacionar API keys periodicamente
- ✅ Manter backups das listas
- ✅ Monitorar logs para anomalias

---

## 🆘 Troubleshooting

### "API URL ou Key não configurados"
→ Edite `config/.env` com credenciais corretas

### "Instância não encontrada"
→ Verifique se a instância foi criada no manager e está conectada

### "Número inválido"
→ Use formato internacional: 55 + DDD + número (ex: 5511999999999)

### Mensagens não chegam
→ Verifique se:
1. WhatsApp está conectado na instância
2. Número não bloqueou você
3. Não atingiu limites diários

---

## 📚 Recursos

- [Evolution API Docs](https://doc.evolution-api.com/)
- [WhatsApp Business API (Oficial)](https://business.whatsapp.com/products/business-platform)

---

**Use com responsabilidade. Respeite os limites e os termos do WhatsApp.**
