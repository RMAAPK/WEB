# Optimized Node.js Docker Container for Render
FROM node:20-alpine

# Install tar and certificates
RUN apk add --no-cache bash tar ca-certificates

WORKDIR /app

# Install production dependencies first (layer caching)
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts || npm install --production

# Copy application code
COPY . .

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose HTTP port
EXPOSE 3000

# Start WA-DB Sentinel Daemon
CMD ["node", "src/index.js"]

