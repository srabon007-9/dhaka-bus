# Frontend Dockerfile
# This file creates a Docker container for the React + Vite frontend

# Build stage
# First we build the React app (compile TypeScript/JSX to static files)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app (creates optimized production build in dist/)
RUN npm run build

# Production stage
# Now we serve the built files with a simple web server
# We use nginx because it's very lightweight and fast for static files
FROM nginx:alpine

# Copy the built app from builder stage to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Nginx automatically serves files, no CMD needed
