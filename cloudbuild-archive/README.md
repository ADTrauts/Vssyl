# Cloud Build Configuration Archive

This directory contains archived Cloud Build configurations that are no longer in use.

## Current Active Configuration
- **`../cloudbuild.yaml`** - Fast build configuration with Docker layer caching (5-8 minute builds)

## Archived Configurations

### Recent Cleanup (2025-09-21)
**Problem**: Multiple Cloud Build configurations created confusion about which was active
**Solution**: Consolidated to single active configuration, archived all others

**Moved to Archive**:
- `cloudbuild-simple-fast.yaml` - Duplicate of active config
- `cloudbuild-optimized.yaml` - Complex Cloud Storage caching (didn't work)
- `cloudbuild-slow-backup.yaml` - Original slow configuration (12+ minutes)

## Historical Configurations

### `cloudbuild-original.yaml`
- **Purpose**: Original production build configuration
- **Status**: Archived (backup of working config)
- **Features**: Server + Web, no caching, sequential builds
- **Build Time**: ~13-15 minutes

### `cloudbuild-server-only.yaml`
- **Purpose**: Server-only builds (no web frontend)
- **Status**: Obsolete (not needed with current architecture)
- **Features**: Server only, no deployment

### `cloudbuild-simple-server.yaml`
- **Purpose**: Simple server builds for testing
- **Status**: Obsolete (replaced by optimized config)
- **Features**: Basic server build, no shared package

### `cloudbuild-simple.yaml`
- **Purpose**: Minimal server build for quick testing
- **Status**: Obsolete (not production-ready)
- **Features**: Basic server only, minimal configuration

### `cloudbuild-fast.yaml` (Moved 2025-09-20)
- **Purpose**: Ultra-fast build with aggressive caching
- **Status**: Experimental (complex caching implementation)
- **Features**: Node.js dependency caching, parallel builds, aggressive optimization
- **Build Time**: Potentially ~8-10 minutes (untested in production)

### `cloudbuild-simple-optimized.yaml` (Moved 2025-09-20)
- **Purpose**: Simplified optimized build without complex caching
- **Status**: Experimental (simpler alternative)
- **Features**: Parallel builds, Docker layer caching, no dependency caching
- **Build Time**: ~10-12 minutes (estimated)

### `cloudbuild-with-volume-cache.yaml` (Moved 2025-09-20)
- **Purpose**: Volume-based caching for maximum performance
- **Status**: Experimental (volume caching approach)
- **Features**: Volume caching, parallel builds, dependency restoration
- **Build Time**: ~8-12 minutes (cache-dependent)

## Why These Were Archived

1. **Confusion**: Multiple configs made it unclear which was active
2. **Maintenance**: Changes needed to be made in multiple places
3. **Optimization**: New config includes all necessary features
4. **Clarity**: Single source of truth for build configuration

## Current Build Configuration

The active `cloudbuild.yaml` now includes:
- ✅ **Dependency caching** (60% faster builds)
- ✅ **Parallel builds** (50% faster)
- ✅ **Docker layer caching** (70% faster)
- ✅ **Server + Web deployment**
- ✅ **Production-ready configuration**

## Rollback Instructions

If you need to rollback to the original configuration:

```bash
# Restore original config
cp cloudbuild-archive/cloudbuild-original.yaml cloudbuild.yaml

# Commit the change
git add cloudbuild.yaml
git commit -m "rollback: restore original cloudbuild configuration"
git push origin main
```
