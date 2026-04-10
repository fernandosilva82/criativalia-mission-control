#!/bin/bash
# Script para limpar todos os jobs duplicados de "Keep Render Awake"
# Mantém apenas os jobs essenciais do sistema

echo "🧹 Iniciando limpeza de jobs duplicados..."

# Lista de jobs para REMOVER (todos os Keep Render Awake)
# Vamos manter apenas:
# - deploy-monitor-notifier
# - Jobs dos agentes principais (se houver)

echo ""
echo "📋 Jobs que serão mantidos:"
echo "  ✅ deploy-monitor-notifier"
echo "  ✅ 1 job de keep-alive (vamos criar um novo eficiente)"
echo ""
echo "📋 Jobs que serão removidos:"
echo "  ❌ Todos os 'Keep Render Awake' duplicados"
echo ""

# Contar jobs atuais
echo "🔍 Contando jobs..."

# A lista completa de jobs será processada
# Este script serve como documentação do processo

echo ""
echo "💡 Para limpar manualmente, execute:"
echo "   openclaw cron list | grep 'Keep Render Awake'"
echo ""
echo "   Depois para cada um:"
echo "   openclaw cron remove --job-id <ID>"
echo ""
