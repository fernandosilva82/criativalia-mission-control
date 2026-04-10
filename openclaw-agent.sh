#!/bin/bash
# OpenClaw Autonomous Agent
# Agente que roda 24/7 na VPS Criativalia

LOG_FILE="$HOME/logs/agent.log"
DB_FILE="$HOME/memory/brain.db"

echo "🤖 OpenClaw Agent iniciado - $(date)" >> "$LOG_FILE"

# Função: Verificar saúde dos serviços
check_services() {
    local issues=0
    
    # Verificar WhatsApp Rotator
    if ! curl -s http://localhost:3333 > /dev/null; then
        echo "❌ WhatsApp Rotator offline - $(date)" >> "$LOG_FILE"
        ((issues++))
    fi
    
    # Verificar Evolution API
    if ! curl -s http://localhost:8080 > /dev/null; then
        echo "❌ Evolution API offline - $(date)" >> "$LOG_FILE"
        ((issues++))
    fi
    
    # Verificar Painel Mission Control
    if ! curl -s http://localhost:3000 > /dev/null; then
        echo "❌ Mission Control offline - $(date)" >> "$LOG_FILE"
        ((issues++))
    fi
    
    if [ $issues -eq 0 ]; then
        echo "✅ Todos os serviços OK - $(date)" >> "$LOG_FILE"
    fi
}

# Função: Coletar métricas do sistema
collect_metrics() {
    local cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    local ram=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    local disk=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
    
    # Salvar no banco
    sqlite3 "$DB_FILE" "INSERT INTO criativalia_data (category, key_name, value, updated_at) 
        VALUES ('metrics', 'cpu_usage', '$cpu', datetime('now'))
        ON CONFLICT(category, key_name) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;"
    
    sqlite3 "$DB_FILE" "INSERT INTO criativalia_data (category, key_name, value, updated_at) 
        VALUES ('metrics', 'ram_usage', '$ram', datetime('now'))
        ON CONFLICT(category, key_name) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;"
    
    sqlite3 "$DB_FILE" "INSERT INTO criativalia_data (category, key_name, value, updated_at) 
        VALUES ('metrics', 'disk_usage', '$disk', datetime('now'))
        ON CONFLICT(category, key_name) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;"
    
    echo "📊 Métricas coletadas - CPU: ${cpu}% RAM: ${ram}% Disk: ${disk}% - $(date)" >> "$LOG_FILE"
}

# Função: Backup automático do banco de memória
backup_memory() {
    local backup_file="$HOME/backups/brain-$(date +%Y%m%d-%H%M%S).db"
    cp "$DB_FILE" "$backup_file"
    gzip "$backup_file"
    
    # Manter apenas últimos 10 backups
    ls -t "$HOME/backups/"/*.gz 2>/dev/null | tail -n +11 | xargs rm -f
    
    echo "💾 Backup criado: $backup_file.gz - $(date)" >> "$LOG_FILE"
}

# Função principal
main() {
    check_services
    collect_metrics
    
    # Backup a cada hora (quando minuto é 00)
    if [ "$(date +%M)" == "00" ]; then
        backup_memory
    fi
}

# Loop infinito - roda a cada 5 minutos
while true; do
    main
    sleep 300
done
