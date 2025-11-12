FROM node:25-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Generate package-lock.json if it doesn't exist
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

# Build backend only (skip admin to stay within free tier memory limits)
RUN NODE_OPTIONS="--max-old-space-size=350" npx medusa build --skip-admin

# Expose port
EXPOSE 9000

# Start server with memory limit for Render's free tier (512MB)
# API-only deployment - use admin locally when needed
CMD NODE_OPTIONS="--max-old-space-size=400" npx medusa start --host 0.0.0.0
