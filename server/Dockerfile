# Optimized multi-stage Docker build for server with proper caching
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install dependencies (this layer will be cached if package files don't change)
RUN pnpm install --frozen-lockfile

# Copy shared source and build (cached if shared code doesn't change)
COPY shared/ ./shared/
RUN cd shared && pnpm build

# Copy Prisma schema (cached if schema doesn't change)
COPY prisma/ ./prisma/
RUN npx prisma generate

# Copy TypeScript config
COPY tsconfig.json ./

# Copy server source (this changes most often, so it's last)
COPY server/ ./server/

# Build server (only rebuilds if server code changes)
RUN cd server && pnpm build

# Production stage - minimal final image
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files for production install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install production dependencies including Prisma
RUN pnpm install --frozen-lockfile --prod
RUN pnpm add prisma@6.10.1

# Copy built artifacts from build stage
COPY --from=base /app/shared/dist ./shared/dist
COPY --from=base /app/shared/package.json ./shared/
COPY --from=base /app/server/dist ./server/dist
COPY --from=base /app/server/package.json ./server/

# Copy Prisma schema and generate client for production
COPY prisma/ ./prisma/
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p /app/uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S vssyl -u 1001

# Change ownership of the app directory
RUN chown -R vssyl:nodejs /app
USER vssyl

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server/dist/index.js"]
