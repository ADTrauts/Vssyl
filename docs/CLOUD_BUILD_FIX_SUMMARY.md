# Cloud Build Fix Summary

**Date:** October 8, 2025  
**Status:** ✅ RESOLVED  
**Build Status:** SUCCESS

## Problem

Google Cloud Build was failing with two main issues:

### Issue 1: MODULE_NOT_FOUND Error
```
Error: Cannot find module '/app/scripts/register-built-in-modules.js'
```

**Root Cause:** The `register-built-in-modules.ts` script was located in `/scripts` (root directory) but was not being compiled or copied into the Docker production image. The server build only compiles files in `/server/src/`.

### Issue 2: Database Connectivity During Build
Even after fixing Issue 1, the module registration step failed because Cloud Build containers cannot reach the private database IP (`172.30.0.15:5432`) during the build process.

## Solution

### Fix 1: Move Script to Correct Location
- **Moved** `register-built-in-modules.ts` from `/scripts/` to `/server/src/scripts/`
- **Updated** import paths to use server's path aliases (`shared/types/module-ai-context`)
- **Updated** `cloudbuild.yaml` to reference the correct compiled script path: `server/dist/scripts/register-built-in-modules.js`

### Fix 2: Make Module Registration Non-Blocking
- Modified the `register-modules` step in `cloudbuild.yaml` to gracefully handle database connection failures
- Changed from `exit 1` on failure to `|| echo "⚠️  Skipped - will run after deployment"`
- Added informative messages explaining that module registration will run post-deployment

## Changes Made

### Files Modified
1. **server/src/scripts/register-built-in-modules.ts** (new)
   - Moved from `/scripts/register-built-in-modules.ts`
   - Updated import: `import type { ModuleAIContext } from 'shared/types/module-ai-context'`

2. **cloudbuild.yaml**
   - Updated script path: `node server/dist/scripts/register-built-in-modules.js`
   - Made step non-blocking with `|| echo` fallback
   - Added warning messages about database connectivity

3. **scripts/post-deploy-register-modules.sh** (new)
   - Created helper script to run module registration after deployment
   - Uses Cloud Run Jobs to execute the script with database access

## Build Results

| Build ID | Status | Key Changes |
|----------|--------|-------------|
| `a0d9cab3` | ❌ FAILURE | Original - MODULE_NOT_FOUND error |
| `d4dec025` | ❌ FAILURE | Script found but database unreachable, step failed build |
| `b74ea234` | ✅ SUCCESS | Non-blocking registration, build completes successfully |

## Post-Deployment Steps

After deploying to Cloud Run, run the module registration manually:

```bash
# Option 1: Run the helper script
./scripts/post-deploy-register-modules.sh

# Option 2: Create and execute a Cloud Run Job manually
gcloud run jobs create register-modules \
  --image=gcr.io/vssyl-472202/vssyl-server:latest \
  --region=us-central1 \
  --vpc-connector=default \
  --set-env-vars="DATABASE_URL=postgresql://..." \
  --command="node" \
  --args="server/dist/scripts/register-built-in-modules.js"

gcloud run jobs execute register-modules --region=us-central1 --wait

# Option 3: Exec into the running Cloud Run service
gcloud run services proxy vssyl-server --region=us-central1 &
# Then run the script via the proxy
```

## Verification

To verify the build and deployment:

```bash
# Check latest build status
gcloud builds list --limit=1

# Check Cloud Run services
gcloud run services list

# Verify module registration (after post-deploy step)
curl https://vssyl-server-235369681725.us-central1.run.app/api/health
```

## Key Learnings

1. **Docker Image Context:** Only files compiled or explicitly copied into the Docker image are available at runtime
2. **Cloud Build Network Isolation:** Build containers don't have access to private VPC resources (like Cloud SQL)
3. **Non-Critical Steps:** Steps that depend on runtime resources should be non-blocking during build
4. **Post-Deployment Jobs:** Use Cloud Run Jobs for operations that need database access after deployment

## Future Improvements

1. **Automated Post-Deploy Hook:** Add a Cloud Run post-deployment trigger to automatically run module registration
2. **Health Check Enhancement:** Add module registration status to health check endpoint
3. **VPC Connector for Build:** Consider using VPC connectors for Cloud Build if migrations need to run during build
4. **Database Migrations:** Similar pattern could be applied to database migrations during build

## Related Documentation

- [Cloud Build Configuration](../cloudbuild.yaml)
- [Post-Deployment Script](../scripts/post-deploy-register-modules.sh)
- [Module Registration Script](../server/src/scripts/register-built-in-modules.ts)
- [Google Cloud Deployment Guide](./GOOGLE_CLOUD_DEPLOYMENT.md)

---

**Status:** ✅ Cloud Build is now working successfully  
**Next Action:** Run post-deployment module registration using the provided script

