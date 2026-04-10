#!/bin/bash
# OpenClaw CLI - Ferramenta de linha de comando
# Uso: openclaw [comando]

COMMAND=${1:-help}
DB_FILE="$HOME/memory/brain.db"

case $COMMAND in
    status|s)
        echo "🤖 OpenClaw Status"
        echo "=================="
        echo ""
        echo "🖥️  Recursos:"
        echo "   CPU: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1)%"
        echo "   RAM: $(free -h | grep Mem | awk '{print $3"/"$2}')"
        echo "   Disco: $(df -h / | tail -1 | awk '{print $3"/"$2 " ("$5")"}')"
        echo ""
        echo "🐳 Containers:"
        docker ps --format "   {{.Names}}: {{.Status}}" 2>/dev/null || echo "   Nenhum container"
        echo ""
        echo "🧠 Memória:"
        sqlite3 "$DB_FILE" "SELECT '   Aprendizados: ' || COUNT(*) FROM learnings;" 2>/dev/null
        sqlite3 "$DB_FILE" "SELECT '   Tarefas: ' || COUNT(*) FROM tasks;" 2>/dev/null
        echo ""
        ;;
        
    tasks|t)
        echo "📋 Tarefas Pendentes"
        echo "===================="
        sqlite3 "$DB_FILE" "SELECT id || '. ' || title || ' [P' || priority || ']' FROM tasks WHERE status='pending' ORDER BY priority DESC;" 2>/dev/null || echo "   Nenhuma tarefa"
        echo ""
        ;;
        
    learn|l)
        echo "🧠 Últimos Aprendizados"
        echo "======================="
        sqlite3 "$DB_FILE" "SELECT substr(content, 1, 60) || '...' FROM learnings ORDER BY created_at DESC LIMIT 5;" 2>/dev/null || echo "   Nenhum aprendizado"
        echo ""
        ;;
        
    backup|b)
        echo "💾 Criando backup..."
        cp "$DB_FILE" "$HOME/backups/brain-$(date +%Y%m%d-%H%M%S).db"
        echo "✅ Backup criado em ~/backups/"
        ls -lh "$HOME/backups/" | tail -5
        echo ""
        ;;
        
    logs)
        echo "📜 Últimos logs do agente"
        echo "========================="
        tail -20 "$HOME/logs/agent.log" 2>/dev/null || echo "   Nenhum log ainda"
        echo ""
        ;;
        
    urls|u)
        echo "🌐 URLs Importantes"
        echo "==================="
        echo "   🎛️  Mission Control: http://72.62.140.110:3000"
        echo "   📱 WhatsApp Rotator: http://72.62.140.110:3333"
        echo "   🔌 Evolution API:    http://72.62.140.110:8080"
        echo ""
        ;;
        
    help|h|*)
        echo "🤖 OpenClaw CLI - Comandos disponíveis:"
        echo ""
        echo "   openclaw status    - Status do sistema"
        echo "   openclaw tasks     - Lista tarefas"
        echo "   openclaw learn     - Ver aprendizados"
        echo "   openclaw backup    - Backup do banco"
        echo "   openclaw logs      - Ver logs do agente"
        echo "   openclaw urls      - Listar URLs importantes"
        echo ""
        ;;
esac
