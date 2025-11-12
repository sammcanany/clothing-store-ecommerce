FROM node:25-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Generate package-lock.json if it doesn't exist
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 9000

# Start server with memory limit for Render's free tier (512MB)
# Use production mode to reduce memory usage
CMD NODE_ENV=production NODE_OPTIONS="--max-old-space-size=400" npx medusa start
