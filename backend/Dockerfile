FROM node:25-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Generate package-lock.json if it doesn't exist
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

# Build backend only (admin disabled via env var)
RUN NODE_OPTIONS="--max-old-space-size=400" npx medusa build

# Expose port
EXPOSE 9000

# Start in production mode with admin disabled (served separately on Vercel)
CMD NODE_OPTIONS="--max-old-space-size=400" npx medusa start --host 0.0.0.0
