#!/bin/bash

# Criativalia Runtime - Systemd Service Installer
# Installs the runtime as a system service for 24/7 operation

set -e

RUNTIME_DIR="/opt/criativalia-runtime"
SERVICE_NAME="criativalia-runtime"
USER="root"

echo "🔧 Installing Criativalia Runtime Service..."

# Create runtime directory
mkdir -p $RUNTIME_DIR
cp -r /root/.openclaw/workspace/criativalia-runtime/* $RUNTIME_DIR/

# Create data directory for SQLite
mkdir -p /var/lib/criativalia-runtime
chmod 755 /var/lib/criativalia-runtime

# Install dependencies
cd $RUNTIME_DIR
npm install --production 2>/dev/null || npm install

# Create environment file
cat > /etc/criativalia-runtime.env << 'EOF'
NODE_ENV=production
PORT=3000
DATA_DIR=/var/lib/criativalia-runtime
EOF

# Create systemd service file
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Criativalia Autonomous Runtime
After=network.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${RUNTIME_DIR}
ExecStart=/usr/bin/node ${RUNTIME_DIR}/src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATA_DIR=/var/lib/criativalia-runtime
StandardOutput=journal
StandardError=journal
SyslogIdentifier=criativalia-runtime

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}

echo ""
echo "✅ Service installed successfully!"
echo ""
echo "Commands:"
echo "  sudo systemctl start  ${SERVICE_NAME}  # Start runtime"
echo "  sudo systemctl stop   ${SERVICE_NAME}  # Stop runtime"
echo "  sudo systemctl status ${SERVICE_NAME}  # Check status"
echo "  sudo journalctl -u    ${SERVICE_NAME}  # View logs"
echo ""
echo "Control Plane: http://localhost:3000"
echo "Data dir: /var/lib/criativalia-runtime"
