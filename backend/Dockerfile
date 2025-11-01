FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies from lockfile (deterministic)
# Use legacy-peer-deps to match how lockfile was generated
RUN npm ci --legacy-peer-deps

# Copy application files
COPY . .

# Expose port
EXPOSE 9000

# Start development server
CMD ["npm", "run", "dev"]
