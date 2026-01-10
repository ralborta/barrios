FROM node:20-alpine

# Install Prisma dependencies
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files from backend
COPY backend/package*.json ./
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npm run prisma:generate

# Copy source code from backend
COPY backend/src ./src

# Build TypeScript
RUN npm run build

# Verify build output
RUN ls -la dist/ && echo "✅ Build successful" || (echo "❌ Build failed" && exit 1)

# Verify dist/index.js exists
RUN test -f dist/index.js && echo "✅ dist/index.js exists" || (echo "❌ dist/index.js not found" && exit 1)

# Expose port (Railway will assign dynamically via PORT env var)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start with explicit error handling
CMD ["sh", "-c", "echo '🚀 Starting server on port ${PORT:-3001}' && node dist/index.js"]
