#!/bin/bash

# Script para adicionar link CSS em todas as páginas HTML

CSS_LINK='    <!-- Criativalia Theme CSS -->
    <link rel="stylesheet" href="css/criativalia-theme.css">'

# Lista de arquivos HTML
FILES=(
  "/root/.openclaw/workspace/criativalia-mission-control/control-plane/public/index.html"
  "/root/.openclaw/workspace/criativalia-mission-control/control-plane/public/dashboard.html"
  "/root/.openclaw/workspace/criativalia-mission-control/control-plane/public/unified-dashboard.html"
  "/root/.openclaw/workspace/criativalia-mission-control/control-plane/public/deliverables.html"
  "/root/.openclaw/workspace/criativalia-mission-control/control-plane/public/kanban.html"
  "/root/.openclaw/workspace/criativalia-mission-control/control-plane/public/timesheet.html"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Verifica se já tem o link
    if ! grep -q "criativalia-theme.css" "$file"; then
      # Adiciona após o font-awesome
      sed -i 's|<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">|<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n    <!-- Criativalia Theme CSS -->\n    <link rel="stylesheet" href="css/criativalia-theme.css">|g' "$file"
      echo "✅ CSS adicionado em: $file"
    else
      echo "⏭️  CSS já existe em: $file"
    fi
  else
    echo "❌ Arquivo não encontrado: $file"
  fi
done

echo "✨ Done!"
