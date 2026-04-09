FROM node:20-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código
COPY . .

# Criar diretórios necessários
RUN mkdir -p /app/data /app/logs /app/config

EXPOSE 3000

CMD ["node", "server.js"]
