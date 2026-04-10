#!/bin/bash
cd /opt/webhook-hub

# Criar Dockerfile
echo "FROM python:3.11-slim" > Dockerfile
echo "" >> Dockerfile
echo "WORKDIR /app" >> Dockerfile
echo "" >> Dockerfile
echo "RUN pip install flask requests" >> Dockerfile
echo "" >> Dockerfile
echo "COPY webhook-hub.py ." >> Dockerfile
echo "" >> Dockerfile
echo "EXPOSE 5555" >> Dockerfile
echo "" >> Dockerfile
echo 'CMD ["python", "webhook-hub.py"]' >> Dockerfile

# Criar docker-compose
cat > docker-compose.yml <> /app/brain.db:ro
    networks:
      - criativalia-network

networks:
  criativalia-network:
    driver: bridge
EOF

echo "✅ Arquivos de config criados!"
