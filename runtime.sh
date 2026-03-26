#!/bin/bash

# Criativalia Runtime Control Script

SERVICE_NAME="criativalia-runtime"
RUNTIME_DIR="/opt/criativalia-runtime"
DATA_DIR="/var/lib/criativalia-runtime"

case "$1" in
  install)
    echo "🔧 Installing Criativalia Runtime..."
    
    # Create directories
    mkdir -p $RUNTIME_DIR $DATA_DIR
    
    # Copy files
    cp -r /root/.openclaw/workspace/criativalia-runtime/src $RUNTIME_DIR/
    cp /root/.openclaw/workspace/criativalia-runtime/package.json $RUNTIME_DIR/
    
    # Install dependencies
    cd $RUNTIME_DIR
    npm install --production
    
    # Create systemd service
    cat > /etc/systemd/system/${SERVICE_NAME}.service <> EOF
[Unit]
Description=Criativalia Autonomous Runtime
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${RUNTIME_DIR}
ExecStart=/usr/bin/node ${RUNTIME_DIR}/src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATA_DIR=${DATA_DIR}

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable ${SERVICE_NAME}
    
    echo "✅ Installed! Use: ./runtime.sh start"
    ;;
    
  start)
    echo "🚀 Starting runtime..."
    systemctl start ${SERVICE_NAME}
    sleep 2
    systemctl status ${SERVICE_NAME} --no-pager
    ;;
    
  stop)
    echo "🛑 Stopping runtime..."
    systemctl stop ${SERVICE_NAME}
    ;;
    
  restart)
    echo "🔄 Restarting runtime..."
    systemctl restart ${SERVICE_NAME}
    ;;
    
  status)
    systemctl status ${SERVICE_NAME} --no-pager
    ;;
    
  logs)
    journalctl -u ${SERVICE_NAME} -f
    ;;
    
  test)
    echo "🧪 Testing runtime..."
    curl -s http://localhost:3000/api/stats | jq '.'
    ;;
    
  *)
    echo "Criativalia Runtime Control"
    echo ""
    echo "Usage: ./runtime.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install   - Install systemd service"
    echo "  start     - Start runtime"
    echo "  stop      - Stop runtime"
    echo "  restart   - Restart runtime"
    echo "  status    - Check status"
    echo "  logs      - View logs"
    echo "  test      - Test API"
    ;;
esac
