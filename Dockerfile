FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copy application files
COPY . .

# Build React app
RUN cd client && npm run build

# Expose ports
EXPOSE 3000 5000

# Start the application
CMD ["npm", "start"]
