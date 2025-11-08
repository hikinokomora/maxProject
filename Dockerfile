FROM node:18-alpine

WORKDIR /app

# Copy server package files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --legacy-peer-deps && cd server && npx prisma generate

# Copy client package files and install dependencies
COPY client/package*.json ./client/
RUN cd client && npm install --legacy-peer-deps

# Copy application files
COPY server ./server
RUN cd server && npx prisma db push
COPY client ./client

# Build React app
RUN cd client && npm run build

# Expose ports
EXPOSE 3000 5000

# Start the application
CMD ["node", "server/index.js"]
