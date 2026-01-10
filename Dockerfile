FROM node:20-alpine

# Install Prisma dependencies
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app

# Copy package files from backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npm run prisma:generate

# Copy source code from backend
COPY backend/ .

# Build
RUN npm run build

# Expose port
EXPOSE 3001

# Start
CMD ["npm", "start"]
