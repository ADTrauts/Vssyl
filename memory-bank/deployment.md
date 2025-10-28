<!--
Update Rules for deployment.md
- Updated when deployment, CI/CD, or operational practices change.
- All changes should be dated and well-documented.
- Use cross-references to other memory bank files for related patterns or requirements.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

## Summary of Major Changes / Update History
- **2025-10-28**: Documented critical migration failure patterns and emergency fix procedures
- **2025-10-25**: Updated deployment documentation to reflect production Google Cloud infrastructure
- **2025-09-19**: Complete Google Cloud Production deployment with automated CI/CD

# Deployment & Operations

## CI/CD - Google Cloud Build ✅ PRODUCTION

### Automated Deployment Pipeline
- **Cloud Build**: Fully automated CI/CD pipeline triggered on git push to main
- **Build Configuration**: `cloudbuild.yaml` in project root
- **Machine Type**: E2_HIGHCPU_8 for fast builds (~7-10 minutes)
- **Region**: us-central1
- **Container Registry**: Google Container Registry (GCR)

### Build Process
On push to main branch:
1. **Prisma Schema Build**: Generate schema from modular files
2. **Prisma Client Generation**: Generate Prisma client BEFORE TypeScript compilation
3. **Multi-stage Docker Build**: Build optimized production images
4. **Push to GCR**: Store images in Google Container Registry
5. **Deploy to Cloud Run**: Automatic deployment to production services

### Production Services
- **Frontend**: `https://vssyl.com` (Cloud Run + domain mapping)
- **Backend**: `https://vssyl-server-235369681725.us-central1.run.app`
- **Database**: Cloud SQL PostgreSQL (172.30.0.15)
- **Storage**: Google Cloud Storage (vssyl-storage-472202)

## Environment Setup

### Local Development
```bash
# Install dependencies (from project root)
pnpm install

# Start both frontend and backend
pnpm dev

# Frontend runs on: http://localhost:3000
# Backend runs on:  http://localhost:5000
```

**Required Local Environment Variables:**
- Backend (`.env`): DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
- Frontend (`.env.local`): NEXTAUTH_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_API_BASE_URL

### Production Environment (Google Cloud)

**Secret Management:**
- **Google Cloud Secret Manager**: All production secrets stored securely
- **Environment Variables**: Injected into Cloud Run services at runtime
- **No Secrets in Code**: Never commit secrets to version control

**Required Production Secrets:**
```bash
# Backend Service
NODE_ENV=production
DATABASE_URL=postgresql://vssyl_user:password@172.30.0.15:5432/vssyl_production
JWT_SECRET=<generated-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generated-with-openssl-rand-base64-32>
FRONTEND_URL=https://vssyl.com
STORAGE_PROVIDER=gcs
GOOGLE_CLOUD_PROJECT_ID=vssyl-472202
GOOGLE_CLOUD_STORAGE_BUCKET=vssyl-storage-472202

# Frontend Service
NEXTAUTH_URL=https://vssyl.com
NEXTAUTH_SECRET=<32-char-secret>
NEXT_PUBLIC_API_BASE_URL=https://vssyl-server-235369681725.us-central1.run.app
NEXT_PUBLIC_APP_URL=https://vssyl.com
NEXT_PUBLIC_WS_URL=wss://vssyl-server-235369681725.us-central1.run.app
```

**Database Migrations:**
- Migrations run automatically during Docker build process
- Prisma schema generated from modular files in `/prisma/modules/`
- Command: `npx prisma migrate deploy` (executed in Dockerfile)

## Operational Best Practices - Google Cloud Production

### Monitoring (Cloud Monitoring)
- **Application Performance**: Cloud Monitoring dashboard for service metrics
- **Uptime Checks**: Configured for frontend and backend services
- **Resource Usage**: CPU, memory, and network monitoring
- **Custom Metrics**: Application-specific metrics and KPIs
- **Alerting**: Email/SMS alerts for critical issues

### Logging (Cloud Logging)
- **Structured Logging**: JSON-formatted logs for easy querying
- **Log Levels**: info, warn, error, debug (development only)
- **Centralized Storage**: All logs aggregated in Cloud Logging
- **Log Retention**: Configurable retention policies
- **Log Exports**: Export to BigQuery for analysis
- **Backend Logger**: `server/src/lib/logger.ts` integrates with Cloud Logging
- **Console Logs**: Also captured in production for debugging

### Incident Response
- **Automated Alerts**: Cloud Monitoring alerts for critical issues
- **Error Tracking**: Cloud Error Reporting for exception monitoring
- **Response Procedures**: Documented escalation paths
- **Rollback Strategy**: Use Cloud Run revisions for quick rollbacks
- **Post-Incident Reviews**: Document and learn from incidents

## Cross-References
- [techContext.md](./techContext.md) (project structure, deployment stack)
- [progress.md](./progress.md) (deployment status, known issues)
- [testingStrategy.md](./testingStrategy.md) (test enforcement in CI)
- [lintingAndCodeQuality.md](./lintingAndCodeQuality.md) (linting in CI)

## Production Infrastructure Summary

### Current Status: ✅ FULLY OPERATIONAL
- **Deployment**: Automated via Google Cloud Build
- **Hosting**: Google Cloud Run (serverless)
- **Database**: Cloud SQL PostgreSQL
- **Storage**: Google Cloud Storage
- **Domain**: vssyl.com with SSL
- **Monitoring**: Cloud Monitoring & Logging
- **Secrets**: Google Cloud Secret Manager

### Key Commands

**View Logs:**
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

**Deploy Manually (if needed):**
```bash
gcloud builds submit --config=cloudbuild.yaml
```

**Check Service Status:**
```bash
gcloud run services list --region=us-central1
```

---

## 🚨 CRITICAL: Production Migration Failures

### The Pattern (October 28, 2025 - HR Module Deployment)

**Problem**: Migrations fail silently in production, causing schema drift and runtime 500 errors.

**Root Causes**:
1. **Startup script hides failures**: `|| echo "continuing anyway"` in Dockerfile
2. **No migration visibility**: Can't see if migrations succeeded without checking logs
3. **Schema drift**: Prisma schema has fields that don't exist in production database
4. **Build exclusions**: `.dockerignore` can exclude critical files like schema builders

**Symptoms**:
- ✅ Build succeeds
- ✅ Containers start successfully
- ❌ Runtime 500 errors when using new features
- ❌ Error: "column does not exist in the current database"

### Emergency Fix Procedures

**Always create these admin endpoints for new modules**:

```typescript
// Check database state (bypasses Prisma models)
GET /api/admin/fix-[module]/check-db

// Create tables via raw SQL (backup if migrations fail)
POST /api/admin/create-[module]-tables

// Run migrations manually
POST /api/admin/fix-[module]/run-migrations
```

**Production Database Fix Commands**:
```javascript
// 1. Check what's missing
fetch('/api/admin/fix-hr/check-db').then(r=>r.json()).then(console.log)

// 2. Create missing tables
fetch('/api/admin/create-hr-tables', {method:'POST'}).then(r=>r.json()).then(console.log)

// 3. Fix missing columns
fetch('/api/admin/fix-subscriptions/add-employee-columns', {method:'POST'}).then(r=>r.json()).then(console.log)
```

### Prevention Strategy

**Pre-Deployment**:
1. ✅ Test migrations locally with `npm run prisma:migrate`
2. ✅ Review generated SQL in `prisma/migrations/[name]/migration.sql`
3. ✅ Create diagnostic and fix endpoints BEFORE deploying
4. ✅ Verify `.dockerignore` doesn't exclude migration files or schema builder

**Post-Deployment**:
1. ✅ Hard refresh browser (Cmd+Shift+R) to get latest code
2. ✅ Run diagnostic endpoints to verify database state
3. ✅ Manually apply fixes if migrations failed
4. ✅ Check Cloud Run logs for migration warnings

**See Also**: `docs/deployment/MODULE_DEPLOYMENT_CHECKLIST.md` for complete checklist

### HR Module Deployment (October 28, 2025)

**Issues Found**:
1. Missing `subscriptions` columns: `employeeCount`, `includedEmployees`, `additionalEmployeeCost`
2. Missing HR tables: `employee_hr_profiles`, `manager_approval_hierarchy`, `hr_module_settings`
3. Missing `business_module_installations.installedBy` column
4. `.dockerignore` excluded `scripts/build-prisma-schema.js`

**Fixes Applied**:
- Created 6 admin diagnostic/fix endpoints
- Manually created tables via raw SQL
- Added missing columns to subscriptions table
- Fixed `.dockerignore` to allow schema builder
- Improved Dockerfile startup script error messages

**Files Created**:
- `server/src/routes/admin-fix-hr.ts` - HR diagnostics
- `server/src/routes/admin-create-hr-tables.ts` - Raw SQL table creation
- `server/src/routes/admin-fix-subscriptions.ts` - Subscription table fixes
- `docs/deployment/MODULE_DEPLOYMENT_CHECKLIST.md` - Comprehensive guide

---

## Archive (Deprecated Deployment / Operational Practices)
- **2025-09-19**: Migrated from manual deployment to automated Google Cloud Build CI/CD
- **2025-09-18**: Removed load balancer setup in favor of Cloud Run domain mapping (simpler architecture) 