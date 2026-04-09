#!/bin/bash
# Script de monitoramento do WhatsApp Sender

echo "📊 WhatsApp Evolution - Monitor"
echo "==============================="
echo ""

LOGS_DIR="$(dirname "$0")/../logs"
DATA_DIR="$(dirname "$0")/../data"
CONFIG_DIR="$(dirname "$0")/../config"

# Verificar se há logs
if [ ! -d "$LOGS_DIR" ] || [ -z "$(ls -A $LOGS_DIR 2>/dev/null)" ]; then
    echo "⚠️  Nenhum log encontrado"
    exit 1
fi

# Último log
LATEST_LOG=$(ls -t $LOGS_DIR/*.jsonl 2>/dev/null | head -1)

echo "📁 Log atual: $(basename $LATEST_LOG)"
echo ""

# Contadores
echo "📈 Estatísticas de hoje:"
echo "------------------------"

if [ -f "$LATEST_LOG" ]; then
    TOTAL=$(wc -l < "$LATEST_LOG")
    ENVIADAS=$(grep -c '"status":"sent"' "$LATEST_LOG" 2>/dev/null || echo "0")
    FALHAS=$(grep -c '"level":"error"' "$LATEST_LOG" 2>/dev/null || echo "0")
    
    echo "Total de registros: $TOTAL"
    echo "Mensagens enviadas: $ENVIADAS ✓"
    echo "Falhas: $FALHAS ✗"
    
    if [ "$TOTAL" -gt 0 ] && [ "$ENVIADAS" -gt 0 ]; then
        TAXA=$(echo "scale=1; ($ENVIADAS / $TOTAL) * 100" | bc -l 2>/dev/null || echo "N/A")
        echo "Taxa de sucesso: ${TAXA}%"
    fi
fi

echo ""
echo "📋 Contatos enviados hoje:"
echo "------------------------"

SENT_FILE="$DATA_DIR/sent-today.txt"
if [ -f "$SENT_FILE" ]; then
    COUNT=$(wc -l < "$SENT_FILE")
    echo "Total: $COUNT números"
    echo ""
    echo "Últimos 5:"
    tail -5 "$SENT_FILE" | while read line; do
        echo "  • $line"
    done
else
    echo "Nenhum envio registrado hoje"
fi

echo ""
echo "🔧 Configuração atual:"
echo "------------------------"

if [ -f "$CONFIG_DIR/.env" ]; then
    API_URL=$(grep EVOLUTION_API_URL "$CONFIG_DIR/.env" | cut -d= -f2)
    INSTANCE=$(grep INSTANCE_NAME "$CONFIG_DIR/.env" | cut -d= -f2)
    
    echo "API URL: ${API_URL:-Não configurado}"
    echo "Instância: ${INSTANCE:-Não configurado}"
    
    # Verificar se API está respondendo
    if [ -n "$API_URL" ]; then
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null || echo "000")
        if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
            echo "Status API: 🟢 Online"
        else
            echo "Status API: 🔴 Offline (HTTP $STATUS)"
        fi
    fi
else
    echo "Arquivo .env não encontrado"
fi

echo ""
echo "==============================="
echo "Para ver logs completos:"
echo "  tail -f $LATEST_LOG"
