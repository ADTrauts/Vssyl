#!/bin/bash

echo "🧹 Clearing all caches and build artifacts..."

# Kill any running Next.js processes
echo "🛑 Stopping any running Next.js processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true

# Clear Next.js cache
echo "🗑️  Clearing Next.js cache..."
rm -rf web/.next 2>/dev/null || true

# Clear TypeScript build info
echo "🗑️  Clearing TypeScript build info..."
rm -f web/tsconfig*.tsbuildinfo 2>/dev/null || true
rm -f shared/tsconfig*.tsbuildinfo 2>/dev/null || true
rm -f server/tsconfig*.tsbuildinfo 2>/dev/null || true

# Clear node_modules cache
echo "🗑️  Clearing node_modules cache..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf web/node_modules/.cache 2>/dev/null || true
rm -rf server/node_modules/.cache 2>/dev/null || true

# Clear shared package build
echo "🗑️  Clearing shared package build..."
rm -rf shared/dist 2>/dev/null || true

# Clear server build
echo "🗑️  Clearing server build..."
rm -rf server/dist 2>/dev/null || true

# Rebuild shared package
echo "🔨 Rebuilding shared package..."
cd shared && pnpm build && cd ..

echo "✅ Cache clearing complete!"
echo "🚀 You can now run 'pnpm dev' to start the development servers." 