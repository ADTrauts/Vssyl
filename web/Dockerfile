# Optimized multi-stage Docker build for web with proper caching
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY web/package.json ./web/

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

# Copy Next.js config and other static files (cached if config doesn't change)
COPY web/next.config.js ./web/
COPY web/tailwind.config.js ./web/
COPY web/postcss.config.js ./web/
COPY web/tsconfig.json ./web/

# Copy public assets (cached if assets don't change)
COPY web/public/ ./web/public/

# Copy web source (this changes most often, so it's last)
COPY web/src/ ./web/src/

# Build web application (only rebuilds if web code changes)
RUN cd web && pnpm build

# Production stage - minimal final image
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files for production install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY web/package.json ./web/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built shared package
COPY --from=base /app/shared/dist ./shared/dist
COPY --from=base /app/shared/package.json ./shared/

# Copy built Next.js application
COPY --from=base /app/web/.next/standalone ./
COPY --from=base /app/web/.next/static ./web/.next/static
COPY --from=base /app/web/public ./web/public

# Copy Prisma schema and generate client for production
COPY prisma/ ./prisma/
RUN npx prisma generate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S vssyl -u 1001

# Change ownership of the app directory
RUN chown -R vssyl:nodejs /app
USER vssyl

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "web/server.js"]
