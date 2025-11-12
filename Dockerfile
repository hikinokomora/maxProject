FROM node:18-alpine

WORKDIR /app/server

# Backend-only Dockerfile (mini-app removed)

# Install dependencies
COPY server/package*.json ./
RUN npm install --legacy-peer-deps && npx prisma generate

# Copy server code
COPY server/ ./

# Expose backend port
EXPOSE 5000

# Run DB migration (for dev) and start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node index.js"]
