# Module Deployment Checklist

**Last Updated**: October 28, 2025  
**Status**: Critical - Follow This Before Every Module Deployment

---

## 🚨 The Problem We Keep Having

**Pattern**: New modules deploy successfully, but fail at runtime with 500 errors due to **schema drift** between local and production databases.

**Root Causes**:
1. Migrations run locally but fail silently in production
2. Dockerfile startup script continues even if migrations fail (`|| echo "continuing anyway"`)
3. No visibility into production database state until runtime errors occur
4. `.dockerignore` and multi-stage builds can exclude critical files

---

## ✅ Pre-Deployment Checklist

### Phase 1: Local Development & Testing

- [ ] **Build Prisma Schema**
  ```bash
  npm run prisma:build
  ```
  Verify: Schema file is generated at `prisma/schema.prisma`

- [ ] **Create Migration**
  ```bash
  npm run prisma:migrate -- --name add_[feature]_schema
  ```
  Verify: New directory in `prisma/migrations/` with `.sql` file

- [ ] **Review Migration SQL**
  ```bash
  cat prisma/migrations/[latest]/migration.sql
  ```
  Check:
  - ✅ All tables have proper indexes
  - ✅ Foreign keys are correct
  - ✅ Enums are created with `DO $$ BEGIN ... EXCEPTION` pattern
  - ✅ No syntax errors

- [ ] **Test Locally**
  ```bash
  npm run dev
  ```
  - ✅ Server starts without errors
  - ✅ Feature works end-to-end
  - ✅ Can create/read/update/delete data
  - ✅ No Prisma errors in console

- [ ] **Check for Schema Drift**
  ```bash
  npx prisma validate
  ```
  Verify: "The schema is valid" message

### Phase 2: Prepare for Production

- [ ] **Verify Files Are Not Ignored**
  Check `.dockerignore`:
  - ✅ `prisma/` directory is **not** excluded
  - ✅ `scripts/build-prisma-schema.js` is **not** excluded (has `!` exception)
  - ✅ Migration files are **not** excluded

- [ ] **Verify Dockerfile Copies Everything**
  Check `server/Dockerfile.production`:
  - ✅ Copies `prisma/` directory in base stage
  - ✅ Copies `scripts/build-prisma-schema.js` in base stage
  - ✅ Copies from base stage to production stage (`COPY --from=base`)
  - ✅ Startup script builds schema THEN runs migrations

- [ ] **Commit Migration Files**
  ```bash
  git add prisma/migrations/
  git add prisma/modules/
  git add server/src/routes/
  git commit -m "Add [module] with database schema"
  ```

### Phase 3: Deployment

- [ ] **Push to GitHub**
  ```bash
  git push origin main
  ```

- [ ] **Monitor Cloud Build**
  ```bash
  gcloud builds list --limit=1
  ```
  Wait for: `STATUS: SUCCESS` (usually 7-10 minutes)

- [ ] **Check Build Logs**
  ```bash
  gcloud builds log [BUILD_ID] | grep -i "migration\|error"
  ```
  Look for: "✅ Migrations applied" or warnings

### Phase 4: Post-Deployment Verification

- [ ] **Hard Refresh Browser**
  - Mac: `Cmd + Shift + R`
  - Windows: `Ctrl + Shift + R`

- [ ] **Check Database State**
  ```javascript
  // In browser console:
  fetch('/api/admin/fix-hr/check-db')
    .then(r => r.json())
    .then(data => {
      console.log('Tables:', data.tables);
      console.log('All tables present:', data.hrTablesExist);
    })
  ```

- [ ] **Test Module Installation**
  - Try installing via UI
  - Check for any 500 errors
  - If errors, check error details for missing columns/tables

- [ ] **If Migration Failed, Run Manual Fix**
  ```javascript
  // Check what's missing:
  fetch('/api/admin/fix-hr/check-db').then(r=>r.json()).then(console.log)
  
  // Create missing tables:
  fetch('/api/admin/create-hr-tables', {method:'POST'}).then(r=>r.json()).then(console.log)
  
  // Or run migrations manually:
  fetch('/api/admin/fix-hr/run-migrations', {method:'POST'}).then(r=>r.json()).then(console.log)
  ```

---

## 🔧 HR Module Specific Fixes We Made

### What We Fixed Today (October 28, 2025)

**Database Fixes:**
1. Created `employee_hr_profiles` table
2. Created `manager_approval_hierarchy` table  
3. Created `hr_module_settings` table
4. Added `installedBy` column to `business_module_installations`
5. Added `employeeCount`, `includedEmployees`, `additionalEmployeeCost` to `subscriptions`

**Code Fixes:**
1. Removed `installedBy` field from installation code (column didn't exist)
2. Added error details to production error responses
3. Created 4 admin diagnostic/fix endpoints

**Build Fixes:**
1. Fixed `.dockerignore` to allow `scripts/build-prisma-schema.js`
2. Fixed Dockerfile multi-stage build to copy script from base stage
3. Updated startup script to build schema before running migrations
4. Improved error messages for migration failures

---

## 🎯 Going Forward: Module Deployment Protocol

### For New Modules with Database Changes:

**1. ALWAYS Create These Admin Endpoints:**
```typescript
// /api/admin/create-[module]-tables - Raw SQL table creation
// /api/admin/fix-[module]/check-db - Check if tables exist
// /api/admin/fix-[module]/seed - Seed module data
```

**2. ALWAYS Test in Production After Deploy:**
```javascript
// Step 1: Check database
fetch('/api/admin/fix-[module]/check-db').then(r=>r.json()).then(console.log)

// Step 2: If tables missing, create them
fetch('/api/admin/create-[module]-tables', {method:'POST'}).then(r=>r.json()).then(console.log)

// Step 3: Install module
// Click install button or use API
```

**3. NEVER Trust Automatic Migrations:**
- Always verify manually with diagnostic endpoints
- Have backup raw SQL endpoints ready
- Don't assume startup script succeeded

---

## 🏗️ Long-Term Fix Recommendations

### Option A: Improve Migration Reliability (Recommended)
```dockerfile
# In Dockerfile.production startup script:
# - Check if migrations are needed
# - Run migrations with explicit error handling  
# - Log migration status to Cloud Logging
# - FAIL container startup if critical migrations fail
```

### Option B: Pre-deployment Migration Step
```yaml
# In cloudbuild.yaml:
# - Add step that runs migrations during build (with VPC access)
# - Fail build if migrations fail
# - Only deploy if migrations succeed
```

### Option C: Migration Status Dashboard
```
# Create admin page:
# - Shows all migrations and their status
# - Shows schema drift (local vs production)
# - One-click "run pending migrations" button
```

---

## 📊 What Worked Today

### Successful Pattern:
1. ✅ Created diagnostic endpoints FIRST
2. ✅ Checked production database state
3. ✅ Created manual fix endpoints (raw SQL)
4. ✅ Applied fixes via admin API
5. ✅ Verified fixes before testing module

### Failed Pattern (What We Did Initially):
1. ❌ Assumed migrations would run automatically
2. ❌ Trusted Dockerfile startup script
3. ❌ No visibility into production database
4. ❌ Fixed code without fixing database
5. ❌ Multiple failed deployments

---

## 🎓 Lessons Learned

### The Golden Rule:
**"Migrations are not reliable in production. Always verify and have manual fixes ready."**

### The Checklist Rule:
**"Never deploy a module without diagnostic and fix endpoints."**

### The Verification Rule:
**"After every deployment, check production database state before testing features."**

---

## ✅ Quick Reference: Deploy New Module

```bash
# 1. Local: Create and test migration
npm run prisma:migrate -- --name add_mymodule

# 2. Create admin endpoints
touch server/src/routes/admin-fix-mymodule.ts
touch server/src/routes/admin-create-mymodule-tables.ts

# 3. Deploy
git push origin main

# 4. Wait for build (7-10 min)
gcloud builds list --limit=1

# 5. Hard refresh browser
# Cmd+Shift+R

# 6. Verify database
fetch('/api/admin/fix-mymodule/check-db').then(r=>r.json()).then(console.log)

# 7. If tables missing, create them
fetch('/api/admin/create-mymodule-tables', {method:'POST'}).then(r=>r.json()).then(console.log)

# 8. Test module installation
# Click install button
```

---

**Follow this checklist for EVERY module deployment to avoid the issues we had today!** 🎯

