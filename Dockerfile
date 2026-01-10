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
RUN ls -la dist/ || echo "Build failed - dist directory not found"

# Expose port
EXPOSE 3001

# Start
CMD ["npm", "start"]
