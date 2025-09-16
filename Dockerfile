# Temporary root Dockerfile for Google Cloud Build
# This file redirects to the server Dockerfile for builds that expect a root Dockerfile
# The proper build configuration should use cloudbuild.yaml with server/Dockerfile.production

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy Prisma schema
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy TypeScript config
COPY tsconfig.json ./

# Copy shared package
COPY shared/ ./shared/
RUN cd shared && pnpm build

# Copy server source
COPY server/ ./server/

# Build server
RUN cd server && pnpm build

# Expose port
EXPOSE 5000

# Start server
CMD ["cd", "server", "&&", "pnpm", "start"]
