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

# Start development server
CMD ["npm", "run", "dev"]
