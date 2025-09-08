# Troubleshooting Guide

## Common Issues and Solutions

### 1. Middleware Manifest Error

**Error**: `Cannot find module '/path/to/web/.next/server/middleware-manifest.json'`

**Cause**: Next.js build cache corruption

**Solution**:
```bash
# Quick fix
pnpm clear-cache

# Or manual fix
rm -rf web/.next
rm -f web/tsconfig*.tsbuildinfo
pnpm dev
```

### 2. TypeScript Build Errors

**Error**: TypeScript compilation errors or missing type definitions

**Solution**:
```bash
# Clear all TypeScript build info
rm -f */tsconfig*.tsbuildinfo

# Rebuild shared package
pnpm --filter shared build

# Restart development
pnpm dev
```

### 3. Import Resolution Errors

**Error**: Cannot resolve module 'shared/components' or similar

**Solution**:
```bash
# Clear cache and rebuild
pnpm clear-cache

# Verify shared package is built
ls -la shared/dist/

# Restart development
pnpm dev
```

### 4. Database Schema Drift

**Error**: Prisma migration errors or schema drift

**Solution**:
```bash
# Reset database (⚠️ WARNING: This will delete all data)
pnpm prisma migrate reset --force

# Or apply migrations
pnpm prisma migrate dev

# Regenerate client
pnpm prisma:generate
```

### 5. Port Conflicts

**Error**: EADDRINUSE or port already in use

**Solution**:
```bash
# Kill processes on ports 3000 and 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9

# Or use the clear cache script
pnpm clear-cache
```

## Quick Commands

### Clear All Caches
```bash
pnpm clear-cache
```

### Full Reset (Nuclear Option)
```bash
pnpm reset
```

### Rebuild Everything
```bash
pnpm clear-cache
pnpm install
pnpm --filter shared build
pnpm --filter server build
pnpm dev
```

## Prevention Tips

1. **Always use `pnpm clear-cache`** when you encounter build issues
2. **Don't interrupt builds** - let them complete
3. **Keep dependencies updated** - run `pnpm install` regularly
4. **Monitor disk space** - low disk space can cause build failures
5. **Use the reset script** for major issues: `pnpm reset`

## Development Workflow

1. Start development: `pnpm dev`
2. If issues occur: `pnpm clear-cache`
3. If still issues: `pnpm reset`
4. For database issues: `pnpm prisma migrate reset --force`

## File Locations

- **Next.js cache**: `web/.next/`
- **TypeScript build info**: `*/tsconfig*.tsbuildinfo`
- **Shared package build**: `shared/dist/`
- **Server build**: `server/dist/`
- **Node modules cache**: `node_modules/.cache/` 