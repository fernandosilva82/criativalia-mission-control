#!/bin/bash
# Script de verificação do Token Shopify
# Uso: bash /root/.openclaw/workspace/scripts/verificar_token_shopify.sh

echo "========================================"
echo "🔍 VERIFICAÇÃO DO TOKEN SHOPIFY"
echo "========================================"
echo ""

ENV_FILE="/root/.openclaw/skills/clawpify/.env"

if [ -f "$ENV_FILE" ]; then
    echo "✅ Arquivo .env encontrado"
    
    # Extrair valores
    SHOP=$(grep SHOPIFY_SHOP "$ENV_FILE" | cut -d'=' -f2)
    TOKEN=$(grep SHOPIFY_ACCESS_TOKEN "$ENV_FILE" | cut -d'=' -f2)
    
    if [ -n "$TOKEN" ]; then
        echo "✅ Token encontrado: ${TOKEN:0:10}...${TOKEN: -5}"
        echo "✅ Loja: $SHOP"
        echo ""
        echo "🧪 Testando conexão com Shopify..."
        
        # Testar API
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
            "https://${SHOP}/admin/api/2024-01/shop.json" \
            -H "X-Shopify-Access-Token: ${TOKEN}")
        
        if [ "$RESPONSE" = "200" ]; then
            echo "✅ CONEXÃO OK - Token válido e funcionando!"
            SHOP_NAME=$(curl -s \
                "https://${SHOP}/admin/api/2024-01/shop.json" \
                -H "X-Shopify-Access-Token: ${TOKEN}" | \
                grep -o '"name":"[^"]*"' | cut -d'"' -f4)
            echo "🏪 Loja: $SHOP_NAME"
        else
            echo "❌ ERRO - Resposta HTTP: $RESPONSE"
            echo "   Verifique se o token não expirou"
        fi
    else
        echo "❌ Token não encontrado no arquivo"
    fi
else
    echo "❌ Arquivo .env não encontrado em $ENV_FILE"
fi

echo ""
echo "========================================"
echo "📋 RESUMO"
echo "========================================"
echo "Status: $(if [ "$RESPONSE" = "200" ]; then echo "✅ ATIVO"; else echo "❌ PROBLEMA"; fi)"
echo "Data: $(date)"
