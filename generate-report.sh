#!/bin/bash
# Gerador de Relatórios Automáticos - OpenClaw
# Gera relatório diário do sistema

REPORT_DIR="$HOME/reports"
LOG_FILE="$HOME/logs/agent.log"
DB_FILE="$HOME/memory/brain.db"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)

mkdir -p "$REPORT_DIR"

REPORT_FILE="$REPORT_DIR/daily-report-${DATE}.md"

cat > "$REPORT_FILE" <> /dev/null 2>&1 || echo "- Nenhum serviço rodando"

echo "" >> "$REPORT_FILE"

# Métricas do sistema
echo "## 📊 Métricas do Sistema" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Recurso | Valor |" >> "$REPORT_FILE"
echo "|---------|-------|" >> "$REPORT_FILE"
echo "| CPU | $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1)% |" >> "$REPORT_FILE"
echo "| RAM | $(free -h | grep Mem | awk '{print $3"/"$2}') |" >> "$REPORT_FILE"
echo "| Disco | $(df -h / | tail -1 | awk '{print $5}') usado |" >> "$REPORT_FILE"
echo "| Uptime | $(uptime -p) |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Logs recentes
echo "## 📜 Logs Recentes" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
tail -15 "$LOG_FILE" 2>/dev/null >> "$REPORT_FILE" || echo "Nenhum log disponível" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Tarefas pendentes
echo "## 📋 Tarefas Pendentes" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
sqlite3 "$DB_FILE" "SELECT '- ' || title || ' (Prioridade: ' || priority || ')' FROM tasks WHERE status='pending' ORDER BY priority DESC;" 2>/dev/null >> "$REPORT_FILE" || echo "Nenhuma tarefa pendente" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Links úteis
echo "## 🔗 Links Rápidos" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- [Mission Control](http://72.62.140.110:3000)" >> "$REPORT_FILE"
echo "- [WhatsApp Rotator](http://72.62.140.110:3333)" >> "$REPORT_FILE"
echo "- [Evolution API](http://72.62.140.110:8080)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "---" >> "$REPORT_FILE"
echo "*Relatório gerado automaticamente pelo OpenClaw Agent*" >> "$REPORT_FILE"

echo "✅ Relatório gerado: $REPORT_FILE"
