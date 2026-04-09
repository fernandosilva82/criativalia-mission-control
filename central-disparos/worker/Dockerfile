FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/data /app/logs

CMD ["node", "worker.js"]
