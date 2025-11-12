FROM node:25-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Generate package-lock.json if it doesn't exist
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

# Expose port
EXPOSE 9000

# Start server with memory limit for Render's free tier (512MB)
# Use develop mode to avoid admin build requirement, bind to 0.0.0.0 for Render
CMD NODE_OPTIONS="--max-old-space-size=400" npm run dev --host 0.0.0.0
