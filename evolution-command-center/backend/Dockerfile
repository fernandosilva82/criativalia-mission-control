FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create directories
RUN mkdir -p /app/data /app/logs

# Expose ports
EXPOSE 3333 3334

# Start
CMD ["node", "server.js"]
