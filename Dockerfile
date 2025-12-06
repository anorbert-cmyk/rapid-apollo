# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies (lighter image)
RUN npm ci --only=production

# Install Redis client if not in package? (It is in package.json now)

# Expose Port
EXPOSE 3000

# Start Command
CMD ["npm", "run", "start:prod"]
