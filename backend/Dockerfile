# Backend Dockerfile
# This file creates a Docker container for the Node.js + Express backend

# Use official Node.js image as base
# Alpine is a lightweight Linux distribution (very small image)
FROM node:22-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files
# This is done separately from the code to leverage Docker cache
COPY package*.json ./

# Install dependencies
# npm ci is like npm install but better for Docker (exact versions)
RUN npm ci

# Copy application code
COPY . .

# Expose port 3000
# This tells Docker this container uses port 3000
EXPOSE 3000

# Health check - tells Docker how to check if container is healthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health >/dev/null 2>&1 || exit 1

# Start the application
# Use node server.js instead of npm start for better signal handling in Docker
CMD ["node", "server.js"]
