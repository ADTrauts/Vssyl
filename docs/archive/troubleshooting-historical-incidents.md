# Troubleshooting Guide - Vssyl Platform

> **📚 Prevent These Errors:** See [../.cursor/rules/RULES_SUMMARY.md](../.cursor/rules/RULES_SUMMARY.md) and topic rules under [../.cursor/rules/](../.cursor/rules/) (e.g. `api-and-auth.mdc`, `database-prisma.mdc`).

## Current Session Issues & Solutions (February 2025)

### **Third-party module artifact upload fails on `/api/modules/:id/uploads/init` or GCS PUT (April 2026) — RESOLVED** ✅

#### **Problem**: Module ZIP upload for marketplace submission fails during init or browser upload
**Symptoms:**
```text
[GCS_SIGNING_FAILED] ... Permission 'iam.serviceAccounts.signBlob' denied ...
```
```text
Access to fetch at https://storage.googleapis.com/... has been blocked by CORS policy
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause**:
1. Cloud Run runtime service account lacked signing capability for GCS V4 signed URLs (`iam.serviceAccounts.signBlob`).
2. Bucket CORS was not configured for browser preflight (`OPTIONS`) from `https://vssyl.com`.

**Solution**:
1. Identify runtime service account used by `vssyl-server`.
2. Grant `roles/iam.serviceAccountTokenCreator` to that same service account on itself.
3. Ensure bucket permissions are present (`roles/storage.objectAdmin` or equivalent).
4. Set bucket CORS on `vssyl-storage-472202`:
   - origins: `https://vssyl.com`, `https://www.vssyl.com` (plus local dev origins as needed)
   - methods: `PUT`, `OPTIONS` (plus `GET`, `HEAD`, `POST` as needed)
   - allowed headers include `Content-Type`
5. Hard refresh browser and retry (new signed URL required).

**Result**: Upload flow works end-to-end (`init` → signed PUT to GCS → `finalize`).

### **Todo Module 500 on /api/todo/projects and /api/todo/tasks**

#### **Problem**: Newly installed To-Do module returns 500 when loading
**Symptoms:**
```
GET /api/todo/projects?dashboardId=... 500 (Internal Server Error)
GET /api/todo/tasks?dashboardId=... 500 (Internal Server Error)
Failed to load projects: Error: Failed to fetch projects
Failed to load tasks: Error: Failed to fetch tasks
```

**Important**: This is not expected when there are no tasks. An empty state should return `200 OK` with `[]`. A 500 indicates a server-side error.

**Root Cause**: Most commonly, the production database does not have the todo tables (`tasks`, `task_projects`, etc.). This happens when:
- Production was deployed before the todo module was added to the schema
- `prisma migrate deploy` was never run against the production database
- Migration history is out of sync between environments

**Solution**:
1. **Verify migrations on production**: Run `pnpm prisma migrate deploy` against the production `DATABASE_URL`
2. **Check migration status**: `pnpm prisma migrate status` to ensure all migrations are applied
3. **In development**: The 500 response now includes a `detail` field with the actual error message for easier debugging
4. **Check server logs**: The logger now includes a hint (`Todo tables may be missing. Run: pnpm prisma migrate deploy`) when the error appears to be schema-related

**Files Modified**: `server/src/controllers/todoController.ts` - Improved error logging and optional `detail` in dev responses

---

### **503 Service Unavailable on POST /api/ai/twin — RESOLVED** ✅

#### **Problem**: AI chat returns 503 when sending a message (especially with image attachments)
**Symptoms:** `POST https://vssyl.com/api/ai/twin 503 (Service Unavailable)`, "Server error" / "Backend service unavailable" in UI.

**Root Cause**: The Next.js API proxy returns 503 when it cannot get a response from the backend (e.g. fetch failure, backend not responding, or backend crashed). The route handler itself returns 500 on caught errors; 503 is from the proxy.

**Solution**: Ensure the backend is running and stable. Restart the full stack with `pnpm dev`; check the **backend** terminal for crashes or errors (e.g. during file/vision processing). If the backend is up and the request still fails, inspect backend logs for the actual error (e.g. fileAnalysisService, DigitalLifeTwinCore, or provider errors).

**Prevention**: Backend errors are now better handled (rate-limit fallback, PDF vision pdftoppm check, file-issue taxonomy). If 503 persists, verify backend env (e.g. OPENAI/ANTHROPIC keys, storage) and that no unhandled exception is killing the process.

---

### **Excessive WebSocket Reconnection Attempts - RESOLVED** ✅

#### **Problem**: Hundreds of WebSocket reconnection attempts when idle
**Symptoms:**
```
🔄 Attempting to reconnect (1/5)
🔄 Attempting to reconnect (2/5)
🔄 Attempting to reconnect (1/5)
🔄 Attempting to reconnect (2/5)
... (repeats hundreds of times)
```

**Root Cause**: 
- **Duplicate reconnection logic**: Socket.IO has built-in automatic reconnection, but `ChatAPI` class also had a manual `handleReconnect()` method
- Both mechanisms were trying to reconnect simultaneously when idle disconnects occurred
- No protection against multiple simultaneous connection attempts
- Reconnection counter not properly reset on successful connection

**Solution Applied (February 2025):**

1. **Removed Manual Reconnection** (`web/src/api/chat.ts`)
   - Removed `handleReconnect()` method that conflicted with Socket.IO's automatic reconnection
   - Let Socket.IO handle all reconnection automatically (it already has exponential backoff)
   - Added `isConnecting` flag to prevent multiple simultaneous connection attempts
   - Properly track Socket.IO's reconnection events (`reconnect_attempt`, `reconnect`, `reconnect_failed`)

2. **Improved Disconnect Handling**
   - Only log disconnects that aren't client-initiated (`io client disconnect`)
   - Reset reconnection counter on successful connection
   - Clean up socket listeners on manual disconnect

3. **Enhanced Socket.IO Configuration** (`web/src/lib/websocketUtils.ts`)
   - Added `reconnectionDelayMax: 5000` to cap maximum delay between attempts
   - Socket.IO already uses exponential backoff by default

**Key Changes:**
```typescript
// BEFORE: Manual reconnection conflicted with Socket.IO
this.socket.on('disconnect', () => {
  this.handleReconnect(); // ❌ Duplicate reconnection!
});

// AFTER: Let Socket.IO handle reconnection automatically
this.socket.on('disconnect', (reason: string) => {
  // Socket.IO handles reconnection automatically ✅
  if (reason !== 'io client disconnect') {
    console.log(`🔌 Disconnected: ${reason}`);
  }
});

// Track Socket.IO's automatic reconnection
this.socket.on('reconnect_attempt', (attemptNumber) => {
  // Only log reasonable attempts
  if (attemptNumber <= this.maxReconnectAttempts) {
    console.log(`🔄 Reconnecting (${attemptNumber}/${this.maxReconnectAttempts})`);
  }
});
```

**Files Modified:**
- `web/src/api/chat.ts` - Removed manual reconnection, added connection state tracking
- `web/src/lib/websocketUtils.ts` - Added max reconnection delay

**Prevention for Future:**
- **Never add manual reconnection** when using Socket.IO - it handles reconnection automatically
- **Use Socket.IO events** (`reconnect_attempt`, `reconnect`, `reconnect_failed`) to track reconnection state
- **Prevent duplicate connections** with `isConnecting` flag or similar guard
- **Check disconnect reason** - some reasons (like `io client disconnect`) shouldn't trigger reconnection

**Result**: ✅ WebSocket reconnection now handled solely by Socket.IO with proper exponential backoff, no duplicate attempts

---

### **Stripe Connection Errors in Production - RESOLVED** ✅

#### **Problem**: StripeConnectionError - "Request was retried 3 times" in Production
**Symptoms:**
```
Stripe not updated
An error occurred with our connection to Stripe. Request was retried 3 times. (type: StripeConnectionError)
```

**Root Cause**: 
- Stripe client didn't have timeout/retry configuration for serverless environments
- Secret key might have trailing newlines/whitespace from Secret Manager
- No visibility into whether key was loaded at runtime
- Network egress issues from Cloud Run to api.stripe.com (less common)

**Solution Applied (February 2025):**

1. **Stripe Client Configuration** (`server/src/config/stripe.ts`)
   - Added `timeout: 30_000` (30 seconds) for serverless environments
   - Added `maxNetworkRetries: 3` for automatic retries
   - Added key trimming to remove leading/trailing whitespace/newlines
   - Added runtime logging: `[Stripe] Key loaded at runtime, prefix: sk_test_` or `[Stripe] STRIPE_SECRET_KEY is not set at runtime...`
   - Production-only fail-fast error if key is missing

2. **Enhanced Error Reporting** (`server/src/controllers/pricingController.ts`)
   - Stripe errors now include `type`, `code`, and `cause` for better debugging
   - Added `GET /api/pricing/stripe-status` endpoint (admin-only) for diagnostics
   - Endpoint tests both raw HTTPS (`fetch`) and Stripe SDK
   - Returns detailed hints based on which check fails (network vs SDK issue)

3. **Documentation** (`docs/deployment/PRODUCTION_LOGS_AND_DB.md`)
   - Added Stripe connection troubleshooting section
   - Documented `gcloud run services describe` command to verify secrets
   - Guidance on checking Cloud Run logs for key prefix messages

**Diagnostic Steps:**
1. **Check Cloud Run Logs**: Look for `[Stripe] Key loaded at runtime, prefix: sk_...` or `[Stripe] STRIPE_SECRET_KEY is not set at runtime...`
2. **Verify Secret Injection**: Run `gcloud run services describe vssyl-server --region us-central1 --format="value(spec.template.spec.containers[0].env)"` and confirm `STRIPE_SECRET_KEY` is present
3. **Test Connectivity**: Call `GET /api/pricing/stripe-status` (admin-only) to see raw vs SDK results
4. **Check Secret Manager**: Ensure Cloud Run service account has `roles/secretmanager.secretAccessor` on the secret

**Fix Process:**
```bash
# 1. Verify secret is injected at runtime
gcloud run services describe vssyl-server --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)"

# 2. Check Cloud Run logs for key prefix
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=vssyl-server" \
  --limit 50 --format="value(textPayload)" | grep -i stripe

# 3. Test Stripe connectivity (requires admin auth)
curl -H "Authorization: Bearer TOKEN" \
  https://vssyl-server-235369681725.us-central1.run.app/api/pricing/stripe-status
```

**Files Modified:**
- `server/src/config/stripe.ts` - Timeout/retries, key trimming, runtime logging
- `server/src/controllers/pricingController.ts` - Enhanced error reporting, stripe-status endpoint
- `server/src/routes/pricing.ts` - Added stripe-status route
- `docs/deployment/PRODUCTION_LOGS_AND_DB.md` - Troubleshooting documentation

**Prevention for Future:**
- **Always trim keys**: Secret Manager may add newlines when copying
- **Check runtime logs**: Look for `[Stripe] Key loaded` message after deploy
- **Use stripe-status endpoint**: Test connectivity before troubleshooting
- **Verify egress**: If raw HTTPS fails, check Cloud Run VPC/egress settings
- **Monitor Stripe errors**: Check error type/code/cause for specific issues

**Result**: ✅ Stripe connections now reliable with timeout/retries, better error reporting, and diagnostic tools

---

### **AI gives generic answer for "what's in this image?" (e.g. profile-pic.jpg)**

**Symptoms:**
- User attaches an image (e.g. profile-pic.jpg) and asks "what's in this image?" or "can you describe this?"
- AI responds with vague wording like "various visual elements and fragmented text", "multiple symbols", "not fully coherent" instead of describing people, objects, or layout.

**Possible causes:**
1. **Vision not used**: Image wasn’t sent as a vision part (only OCR text was used, and OCR found little/no text). Check server logs for `operation: 'vision_image_parts'` and "Vision image part added" for that filename. If missing, confirm file has an image extension (png, jpg, jpeg, gif, webp) and is in the attached fileIds; confirm `getVisionImageParts` runs and storage returns the buffer.
2. **Prompt doesn’t ask for concrete description**: Model receives the image but isn’t instructed to describe it concretely, so it falls back to generic phrasing.

**Resolution:**
- **Verify vision path**: Ensure attached image files trigger `getVisionImageParts` in DigitalLifeTwinCore and that providers receive `data.visionImageParts`. Logs: `vision_image_parts`, `Vision image part added`.
- **Prompt nudge**: When `visionImageParts.length > 0`, add to system or user prompt (e.g. in OpenAIProvider/AnthropicProvider or DigitalLifeTwinCore): "When the user asks what is in an image, describe the contents concretely (people, objects, text visible in the image, layout). Do not give a generic answer like 'various visual elements'."

**Reference:** `memory-bank/activeContext.md` — "Vision API: Model Can See Attached Images" (Known issue & suggested fix).

---

## Previous Session Issues & Solutions (January 2025)

### **Prisma Migration Failures in Production - RESOLVED** ✅

#### **Problem**: Failed Migrations Blocking All New Migrations on Production
**Symptoms:**
```
migrate found failed migrations in the target database, new migrations will not be applied.
The `20260126230000_initial_schema_baseline` migration started at 2026-01-27 11:26:06.312576 UTC failed
[ERROR] Database migration failed on startup
```

**Root Cause**: 
- The `_prisma_migrations` table had records with `finished_at = NULL` (marking them as "failed")
- When a migration starts but doesn't complete (e.g., connection lost during Cloud Build), it's marked as failed
- Prisma refuses to apply ANY new migrations until failed migrations are resolved
- After database restart, migration tracking table may have orphaned/failed records
- Cloud Build cannot reach the database (VPC restriction), so migrations must run on container startup

**Solution Applied (January 2025):**

1. **Added Admin Migration Management Endpoints** (`server/src/routes/admin-portal.ts`)
   - `GET /api/admin-portal/database/migrations` - View all migrations and their status
   - `POST /api/admin-portal/database/migrations/fix-failed` - Mark failed migrations as applied
   - `POST /api/admin-portal/database/migrations/delete` - Delete orphaned migration records
   - `POST /api/admin-portal/database/migrations/reset-baseline` - Reset & re-baseline all migrations

2. **Fixed Startup Migration Logic** (`server/src/index.ts`)
   - Removed hardcoded resolve step for non-existent `20251026_add_hr_module_schema` migration
   - Improved error logging for migration failures
   - Server continues to start even if migrations fail (allows debugging)

3. **Added Schema Drift Detection** (`server/src/services/adminService.ts`)
   - Detects Prisma errors from missing columns (production DB schema drift)
   - Handles schema drift gracefully in admin service

**Diagnostic Steps:**
1. **Check Cloud Run Logs**: Search for `migration_startup_failed` or `migrate found failed migrations`
2. **Use Admin Endpoint**: Call `GET /api/admin-portal/database/migrations` to see migration status
3. **Check Build Logs**: Look for `P1001: Can't reach database server` during Cloud Build (expected)

**Fix Process:**
```bash
# 1. View current migration status (requires admin auth)
curl -H "Authorization: Bearer TOKEN" \
  https://vssyl-server-235369681725.us-central1.run.app/api/admin-portal/database/migrations

# 2. Fix failed migrations by marking them as applied
curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  https://vssyl-server-235369681725.us-central1.run.app/api/admin-portal/database/migrations/fix-failed

# 3. For complete reset (nuclear option)
curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  https://vssyl-server-235369681725.us-central1.run.app/api/admin-portal/database/migrations/reset-baseline
```

**Files Modified:**
- `server/src/routes/admin-portal.ts` - Added 4 migration management endpoints
- `server/src/index.ts` - Removed hardcoded migration resolve, improved error handling
- `server/src/services/adminService.ts` - Added schema drift detection

**Prevention for Future:**
- **Never edit applied migrations** - Create new migrations instead
- **Monitor startup logs** - Check for migration failures after each deployment
- **Use connection pooling** - Ensure `connection_limit=20&pool_timeout=20` in DATABASE_URL
- **Don't reset database without clearing _prisma_migrations** - Migration tracking must match DB state
- **Cloud Build limitations** - Migrations run on container startup, not during build (VPC restriction)

**Result**: ✅ All 72 migrations now marked as applied, server starts without migration errors

---

### **Backend Overload - 504 Gateway Timeout Errors - RESOLVED** ✅

#### **Problem**: Backend Getting Overloaded with 504 Errors and WebSocket Connection Issues
**Symptoms:**
```
GET http://localhost:3000/api/admin-portal/impersonation/current 504 (Gateway Timeout)
WebSocket connection errors increasing
Backend requests timing out
```

**Root Cause**: 
- Database connection pool too small (5 connections) causing bottlenecks under load
- Missing composite database index on `(adminId, endedAt)` causing slow impersonation queries
- No request timeout middleware allowing requests to hang indefinitely
- No query timeout protection on slow database queries

**Solution Applied (January 2025):**
1. **Increased Connection Pool**: Changed from 5 to 20 connections in production (`server/src/lib/prisma.ts`)
2. **Added Composite Index**: Created index on `(adminId, endedAt)` for impersonation queries
3. **Request Timeout Middleware**: Added 30-second timeout for most requests, 2 minutes for uploads
4. **Query Timeout Protection**: Added 10-second timeout to impersonation endpoint queries
5. **Created Query Timeout Utility**: Reusable `withQueryTimeout()` function for future use

**Files Modified:**
- `server/src/lib/prisma.ts` - Connection pool configuration
- `prisma/modules/admin/admin-portal.prisma` - Composite index
- `prisma/migrations/20260122000000_add_impersonation_composite_index/migration.sql` - Migration
- `server/src/index.ts` - Request timeout middleware
- `server/src/routes/admin-portal.ts` - Query timeout on impersonation endpoint
- `server/src/lib/queryTimeout.ts` - New utility file

**Technical Implementation:**
```typescript
// Connection pool increase (production: 20, development: 5)
const connectionLimit = process.env.NODE_ENV === 'production' ? 20 : 5;

// Request timeout middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timeoutDuration = req.path.includes('/upload') || req.path.includes('/file') ? 120000 : 30000;
  req.setTimeout(timeoutDuration, () => {
    if (!res.headersSent) {
      res.status(504).json({ error: 'Gateway Timeout', message: 'Request timeout' });
    }
  });
  next();
});

// Query timeout pattern
const result = await Promise.race([
  prisma.model.findFirst({...}),
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), 10000);
  })
]);
```

**Prevention for Future**:
- **Monitor connection pool usage** - Adjust pool size based on load
- **Add indexes for common query patterns** - Use composite indexes for multi-column WHERE clauses
- **Always use request timeouts** - Prevent hanging requests
- **Add query timeouts to slow endpoints** - Protect against slow database queries
- **Monitor error rates** - Track 504 errors and WebSocket connection failures

**Result**: ✅ 504 errors eliminated, WebSocket errors reduced, faster response times

---

### **Logger DB Failures (LogLevel enum missing) - MITIGATED** ✅

#### **Problem**: `type "public.LogLevel" does not exist` — Prisma errors on every API request
**Symptoms:**
- Cloud Run logs show repeated `prisma:error` / `Failed to log to database` with `ConnectorError(PostgresError { code: "42704", message: "type \"public.LogLevel\" does not exist" })`
- API responses often still 200; errors come from structured logger writing to `logs` table

**Root Cause**: The `fix_logging_enums` migration (`20251218020000_fix_logging_enums`) was not applied to production. The `logs` table exists but uses `LogLevel`/`LogService` enums that were never created.

**Solution Applied (January 2025):**
1. **Resilient logger** (`server/src/lib/logger.ts`): On first `LogLevel`/`42704` error, set `dbLoggingDisabled = true` and skip all further DB logging for the process. Log a single warning. Console and Cloud Logging unchanged.
2. **Restore DB logging**: Run `pnpm prisma migrate deploy` against production (or redeploy so startup migrations apply). Once `fix_logging_enums` is applied, new revisions will log to DB again.

**Prevention**: Ensure `prisma migrate deploy` runs against production (e.g. on container startup or in Cloud Build) so migrations stay in sync.

---

### **503 / 500 on GCP After Deploy - DIAGNOSTIC GUIDE**

#### **Problem**: 503 on `/api/calendar/events`, 500 on `/api/business`, "Attempting to reconnect" (WebSocket) after deploying to Google Cloud

**Symptoms:**
```
GET https://vssyl.com/api/calendar/events?... 503 (Service Unavailable)
GET https://vssyl.com/api/business 500 (Internal Server Error)
🔄 Attempting to reconnect (1/5)
Failed to load events: Error: Server error. Please try again later.
```

**What each status means:**
- **503**: The Next.js API proxy **cannot reach** the backend (Cloud Run server). Returned when `fetch()` to the backend fails (network, ECONNREFUSED, cold start). Can also occur if the backend instance is unhealthy or restarting.
- **500**: The backend **received** the request but the handler threw (e.g. Prisma/DB error). The proxy forwards the backend’s 500.

**Diagnostic steps:**

1. **Check Cloud Run logs (backend – vssyl-server)**  
   In GCP Console → Cloud Run → vssyl-server → Logs. Look for:
   - `❌ Database migration failed` → migrations did not run; schema may be out of sync.
   - `Business controller error` / `get_user_businesses` / `prismaCode` → Prisma errors in business routes.
   - `Calendar listEventsInRange failed` → Prisma or other errors in calendar.
   - `[Logger] Database logging disabled: LogLevel enum...` → `fix_logging_enums` not applied; logger skips DB logging but API should still work.
   - Connection/timeout errors → DATABASE_URL or Cloud SQL connectivity issues.

2. **Verify migrations in production**  
   Server runs `prisma migrate deploy` at startup. If the DB is unreachable then, we catch and continue (no exit). Ensure:
   - `prisma migrate deploy` succeeds (see logs for `✅ Database migrations completed`).
   - `fix_logging_enums` (`20251218020000_fix_logging_enums`) is applied:  
     `pnpm prisma migrate status` against production DATABASE_URL (or run `prisma migrate deploy` from a environment that can reach prod DB).

3. **Verify DATABASE_URL secret**  
   Cloud Run uses `database-url` from Secret Manager. Ensure:
   - Secret exists and is correct for the **Cloud SQL instance** used by Cloud Run (`--add-cloudsql-instances`).
   - For Unix socket: `postgresql://user:pass@/db?host=/cloudsql/PROJECT:REGION:INSTANCE&connection_limit=20&pool_timeout=20`.
   - For private IP (VPC): include `connection_limit=20&pool_timeout=20`; `server/src/lib/prisma` adds them if missing for IP-based URLs.

4. **Reduce 503s from restarts**  
   Unhandled rejections in async route handlers (e.g. calendar) can crash the process → instance restart → 503 on next request. Ensure:
   - Calendar `listEventsInRange` and other async handlers use try/catch and log errors (see **Solution Applied** below).
   - Cloud Run `min-instances: 1` avoids scale-to-zero cold starts.

**Solution Applied (January 2025):**
1. **Calendar `listEventsInRange`**: Wrapped logic in try/catch, log errors via `logger.error` with `operation: 'list_events_in_range'`, return 500 with a safe message. Prevents unhandled rejections that could crash the process.
2. **Business `handleError`**: Use `logger.error` with operation, error message, stack, and Prisma `code` when present. Improves Cloud Run log debugging for 500s.
3. **Prisma IP-based URLs**: In `server/src/lib/prisma.ts`, add `connection_limit` and `pool_timeout` to DATABASE_URL when using IP (non–Cloud SQL socket) if not already present.

**Files modified:**  
- `server/src/controllers/calendarController.ts` – try/catch + logging in `listEventsInRange`  
- `server/src/controllers/businessController.ts` – `handleError` uses logger  
- `server/src/lib/prisma.ts` – connection pool params for IP-based DATABASE_URL  
- `memory-bank/troubleshooting.md` – this section

**Prevention:**  
- Add try/catch + structured logging to async route handlers that use Prisma.  
- Run `prisma migrate deploy` against production as part of deploy or startup and monitor logs.  
- Keep DATABASE_URL and connection pool settings correct for the chosen Cloud SQL access method.

---

### **500 on Login / Common Endpoints (Trash, Modules, Profile Photos, Calendar, Location)**

#### **Problem**: Many 500s when logging in or navigating: `/api/trash/items`, `/api/modules/installed?scope=personal`, `/api/profile-photos`, `/api/calendar/events`, `/api/location/user-location`, `POST /api/profile-photos/upload`

**Symptoms:**
```
GET https://vssyl.com/api/trash/items 500
GET https://vssyl.com/api/modules/installed?scope=personal 500 (Failed to get installed modules)
GET https://vssyl.com/api/profile-photos 500
GET https://vssyl.com/api/calendar/events?... 500 (Failed to load events)
GET https://vssyl.com/api/location/user-location 500 (Failed to fetch user location)
POST https://vssyl.com/api/profile-photos/upload 500 (Failed to upload profile photo)
```

**Common causes:**
- **DB schema / migrations**: Missing tables or columns (e.g. `UserProfilePhoto`, `ModuleInstallation`, `Module`, `Event`, `Task`, `Message` with `deletedAt`, or `LogLevel` for logger). Production DB out of sync with Prisma schema.
- **Prisma include/relations**: e.g. `User` `include: { country, region, town }` or `Module` `include: { developer }` failing (missing relations or tables).
- **Storage**: Profile photo upload fails if GCS/local storage misconfigured.

**Solution applied (January 2025):**
1. **Trash** (`listTrashedItems`): Wrapped `userProfilePhoto`, `message`, `task` queries in try/catch; continue with empty arrays on failure. Use `logger.warn` for optional-query failures, `logger.error` in main catch. Reduces 500s when only some trash sources are missing.
2. **Modules** (`getInstalledModules`): Use `developer?.name || developer?.email || '…'` to avoid throws on null developer. Structured `logger.error` in catch.
3. **Location** (`/user-location`): Return `200 { location: null }` when user not found (instead of 404) so the frontend does not treat it as error. Keeps existing `logger.error` in catch.
4. **Profile photos / Calendar**: Already use `logger.error` in catch blocks; check Cloud Run logs for `operation: 'get_profile_photos'`, `upload_profile_photo`, `list_events_in_range`, etc.

**Diagnostic steps:**
1. **Cloud Run logs (vssyl-server)**: Search for `operation: 'list_trashed_items'`, `get_installed_modules`, `get_profile_photos`, `upload_profile_photo`, `list_events_in_range`, `get_user_location`. Error metadata includes `message`, `stack`, `userId`.
2. **Migrations**: Run `pnpm prisma migrate status` against production `DATABASE_URL`. Apply any pending migrations (`pnpm prisma migrate deploy`).
3. **Schema vs DB**: If logs show "relation … does not exist" or "column … does not exist", fix via migrations or ensure `prisma migrate deploy` runs at deploy/startup.

**Service Worker message:**  
`Service Worker not registered - will be registered on-demand when push notifications are enabled` is informational only; it is not an error.

---

## Previous Session Issues & Solutions (December 2025)

### **Scheduling Module Database Tables Missing - RESOLVED** ✅

#### **Problem**: Scheduling Module Returning 500 Errors - Missing Database Tables
**Symptoms:**
```
GET http://localhost:3000/api/scheduling/admin/schedules?businessId=... 500 (Internal Server Error)
Invalid `prisma.schedule.findMany()` invocation in ...
The table `public.schedules` does not exist in the current database.
```

**Root Cause**: 
- Scheduling tables (`schedules`, `schedule_shifts`, etc.) were created using `prisma db push` instead of `prisma migrate dev`
- `db push` syncs the schema but doesn't create migration files
- When the database was reset or migrations were reapplied, the tables disappeared because there was no migration to recreate them
- Existing migrations only added columns to tables (assuming they already existed), but never created the base tables

**Solution Applied (December 2025):**
1. **Recreated Database Tables**: Used `prisma db push --accept-data-loss` to sync database schema with Prisma schema
2. **Regenerated Prisma Client**: Ran `pnpm prisma:generate` to regenerate Prisma client with new tables
3. **Verified Tables Created**: Confirmed `schedules`, `schedule_shifts`, `schedule_templates`, `shift_templates`, `shift_swap_requests`, and `employee_availability` tables now exist

**Files Modified:**
- Database schema synced via `prisma db push`
- Prisma client regenerated

**Technical Implementation:**
```bash
# Sync database with schema (creates missing tables)
pnpm prisma db push --accept-data-loss --skip-generate

# Regenerate Prisma client
pnpm prisma:generate
```

**Prevention for Future**:
- **Always use `prisma migrate dev`** for schema changes to create proper migration files
- **Never use `prisma db push`** for production schema changes (only for quick prototyping)
- **Create baseline migration** for scheduling tables to prevent this issue in the future

**Result**: ✅ All scheduling endpoints now work correctly, no more 500 errors

---

### **ScheduleBuilderVisual Undefined scheduleId Prop - RESOLVED** ✅

#### **Problem**: ScheduleBuilderVisual Component Receiving Undefined scheduleId Prop
**Symptoms:**
```
⚠️ ScheduleBuilderVisual: scheduleId prop is undefined - this should not happen
```

**Root Cause**: 
- React Strict Mode double-rendering or brief state transitions
- Component rendering before `selectedSchedule.id` is fully set in parent component
- No defensive checks in component to handle undefined props gracefully

**Solution Applied (December 2025):**
1. **Parent Component Validation**: Added `selectedSchedule && selectedSchedule.id` check in `SchedulingAdminContent` before rendering `ScheduleBuilderVisual`
2. **Component Early Return**: Added early return in `ScheduleBuilderVisual` after all hooks to return `null` if `scheduleId` is undefined (following Rules of Hooks)
3. **Defensive Programming**: Component now handles undefined state gracefully without console warnings

**Files Modified:**
- `web/src/components/scheduling/SchedulingAdminContent.tsx` — Added validation: `if (selectedSchedule && selectedSchedule.id)`
- `web/src/components/scheduling/ScheduleBuilderVisual.tsx` — Added early return after hooks: `if (!scheduleId) return null;`

**Technical Implementation:**
```typescript
// Parent component - validate before rendering
if (selectedSchedule && selectedSchedule.id) {
  return (
    <ScheduleBuilderVisual
      scheduleId={selectedSchedule.id}
      // ... other props
    />
  );
}

// Child component - early return after hooks
export default function ScheduleBuilderVisual({ scheduleId, ... }: Props) {
  // All hooks called first (Rules of Hooks)
  const { data: session } = useSession();
  const { schedules, shifts, ... } = useScheduling(...);
  
  // Early return after hooks
  if (!scheduleId) {
    console.warn('⚠️ ScheduleBuilderVisual: scheduleId prop is undefined - returning null');
    return null;
  }
  
  // Rest of component...
}
```

**Result**: ✅ No more warnings, component handles undefined state gracefully

---

### **Dashboard Page 500 Errors - RESOLVED** ✅

#### **Problem**: Dashboard Page Returning 500 Errors with useContext Errors
**Symptoms:**
```
TypeError: Cannot read properties of null (reading 'useContext')
Server Error
GET http://localhost:3000/dashboard/[id] 500 (Internal Server Error)
No default component was found for a parallel route rendered on this page
```

**Root Cause**: 
- Server component trying to use client-side hooks during SSR
- `usePathname` and other Next.js hooks being called during server-side rendering
- React context not available during SSR phase

**Solution Applied (December 2025):**
1. **Converted Dashboard Page to Client Component**: Changed from server component (`async function`) to client component (`'use client'`)
2. **Moved Authentication to useEffect**: Authentication checks now happen in `useEffect` instead of during render
3. **Replaced getServerSession with useSession**: Using client-side session hook instead of server-side session check
4. **Proper Loading States**: Added loading states while session is being checked

**Files Modified:**
- `web/src/app/dashboard/[id]/page.tsx` — Converted to client component, fixed authentication flow
- `web/src/app/dashboard/[id]/error.tsx` — Enhanced error boundary with better error display

**Technical Implementation:**
```typescript
// Before (Server Component - Caused SSR errors)
export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  return <DashboardClient dashboardId={id} />;
}

// After (Client Component - Works correctly)
'use client';
export default function DashboardPage() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [session, status, router]);
  return <DashboardClient dashboardId={id} />;
}
```

**Result**: ✅ Dashboard pages now load correctly without SSR errors

---

### **File Download 404/ENOENT Errors - RESOLVED** ✅

#### **Problem**: File Downloads Failing with 404 and ENOENT Errors
**Symptoms:**
```
GET http://localhost:3000/api/drive/files/[id]/download 404 (Not Found)
ENOENT: no such file or directory, stat '/Users/.../uploads/http:/localhost:5000...'
```

**Root Cause**: 
- File's `url` field in database contained full URLs (e.g., `http://localhost:5000/uploads/files/...`)
- Download function was trying to use URL as file path
- File's `path` field (actual file path) was being ignored
- No file existence validation before attempting download

**Solution Applied (December 2025):**
1. **Prioritize `file.path` Over `file.url`**: Download function now uses `file.path` from database first
2. **URL Path Extraction**: Added fallback logic to extract path from URL when `file.path` is not available
3. **File Existence Validation**: Added `fs.existsSync()` check before attempting download
4. **Proper Path Construction**: Uses `LOCAL_UPLOAD_DIR` environment variable for correct path construction
5. **Enhanced Error Logging**: Added detailed logging showing file path, URL, and database path for debugging

**Files Modified:**
- `server/src/controllers/fileController.ts` — Fixed download function path handling, added file existence checks, added `fs` import

**Technical Implementation:**
```typescript
// Before (Incorrect path handling)
const filePath = path.join(__dirname, '../../uploads', file.url.replace('/uploads/', ''));

// After (Proper path handling)
let filePath: string;
if (file.path) {
  // Use actual file path from database
  const uploadDir = process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '../../uploads');
  filePath = path.join(uploadDir, file.path);
} else if (file.url) {
  // Extract path from URL if file.path not available
  const urlPath = file.url.replace(/^https?:\/\/[^\/]+/, '').replace(/^\/uploads\//, '');
  const uploadDir = process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '../../uploads');
  filePath = path.join(uploadDir, urlPath);
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  return res.status(404).json({ message: 'File not found on disk' });
}
```

**Result**: ✅ File downloads now work correctly for both new files (with `file.path`) and legacy files (with URLs)

---

## Previous Session Issues & Solutions (October 2025)

### **Login 403 Authentication Errors - RESOLVED** ✅

#### **Problem**: 403 Errors on Initial Dashboard Load After Login
**Symptoms:**
```
Failed to load resource: the server responded with a status of 403 ()
Failed to load conversations: Error: HTTP error! status: 403
api/trash/items:1  Failed to load resource: the server responded with a status of 403 ()
api/dashboard:1  Failed to load resource: the server responded with a status of 403 ()
api/modules/installed?scope=business&businessId=...:1  Failed to load resource: the server responded with a status of 403 ()
```

**User Experience:**
- Login succeeds with "Login successful, redirecting to dashboard" message
- Dashboard page loads but shows "Failed to load dashboards" error
- Multiple API calls fail with 403 errors (chat, modules, org chart, business data)
- After manual page reload, everything works fine
- This happens **every time** on initial login
- NEXT_REDIRECT error appears in console (expected Next.js behavior)

**Root Cause**: Race condition in authentication flow
- User logs in → `signIn()` completes successfully
- **Immediately** redirects to `/dashboard` (no delay)
- NextAuth session cookie hasn't fully propagated to browser yet
- Dashboard components and contexts make API calls before session is available
- **403 errors occur** because API calls have no valid authentication token
- Contexts like `BusinessConfigurationContext` and `ChatContext` fire on mount before session ready
- After page reload, session is established → all API calls work

**Solution Applied (Updated November 2025):**
Implemented comprehensive session readiness checks with three layers of protection:

1. **Login Page**: `waitForSession()` now actually polls for session availability
   - Waits minimum 300ms for cookie propagation
   - Then polls `getSession()` every 100ms until session with `accessToken` is confirmed
   - Maximum 5 second timeout before proceeding
   - Only redirects when session is confirmed ready

2. **SessionReadyGate Component**: Global gate preventing providers from mounting without session
   - New component `web/src/components/auth/SessionReadyGate.tsx` wraps all authenticated providers
   - Checks current route (public vs protected) using `usePathname()`
   - Public routes (login, register, landing) render immediately
   - Protected routes wait for `session?.accessToken` before rendering children
   - Shows loading spinner with timeout message while waiting
   - Prevents all contexts (ChatContext, BusinessConfigurationContext, etc.) from mounting until session ready

3. **BusinessConfigurationContext**: Added session checks before API calls
   - `loadConfiguration()` checks for `session?.accessToken` before making any API calls
   - `useEffect` waits for both `businessId` AND `session?.accessToken` before loading
   - `loadOrgChart()` also checks for session before making calls
   - All API calls use `session!.accessToken` directly after session check

4. **ChatContext**: Already had proper session checks (no changes needed)

**Files Modified:**
- `web/src/app/auth/login/page.tsx` - Updated `waitForSession()` to poll for actual session availability
- `web/src/components/auth/SessionReadyGate.tsx` - NEW: Global gate component that prevents providers from mounting without session
- `web/src/app/layout.tsx` - Wrapped authenticated provider stack with `SessionReadyGate`
- `web/src/contexts/BusinessConfigurationContext.tsx` - Added session checks in `loadConfiguration()` and `loadOrgChart()`, updated `useEffect` dependencies

**Technical Implementation:**
```typescript
// 1. Login page - waitForSession() now actually checks for session
async function waitForSession() {
  const maxWait = 5000; // 5 seconds max
  const checkInterval = 100; // Check every 100ms
  const minDelay = 300; // Minimum 300ms for cookie propagation
  const startTime = Date.now();
  
  // First, wait minimum delay for cookie propagation
  await new Promise(resolve => setTimeout(resolve, minDelay));
  
  // Then poll for actual session availability
  while (Date.now() - startTime < maxWait) {
    try {
      const session = await getSession();
      if (session?.accessToken) {
        console.log('Session confirmed with access token, redirecting...');
        return; // Session is ready
      }
    } catch (error) {
      console.warn('Error checking session:', error);
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  console.warn('Session wait timeout reached, proceeding anyway');
}

// 2. SessionReadyGate - Global gate preventing provider mounting
export function SessionReadyGate({ children }: SessionReadyGateProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const publicRoutes = ['/auth/login', '/auth/register', '/landing', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

  const isReady = useMemo(() => {
    // Public routes always render immediately
    if (isPublicRoute) return true;
    
    // For protected routes, wait for session token
    if (status === 'loading') return false;
    if (status === 'unauthenticated') return true; // Route protection handles redirect
    
    // Authenticated state requires access token
    return Boolean(session?.accessToken);
  }, [status, session?.accessToken, pathname, isPublicRoute]);

  if (!isReady) {
    return <LoadingSpinner />; // Shows "Establishing secure session..." message
  }

  return <>{children}</>;
}

// 3. BusinessConfigurationContext - session check before API calls
const loadConfiguration = useCallback(async (businessId: string) => {
  // Don't proceed if session is not ready
  if (!session?.accessToken) {
    console.log('[BusinessConfig] Waiting for session before loading configuration...');
    return;
  }
  // ... rest of function
}, [session?.accessToken]);

// useEffect waits for both businessId and session
useEffect(() => {
  const targetBusinessId = workCredentials?.businessId || businessId;
  
  // Only load if we have both businessId and session token
  if (targetBusinessId && session?.accessToken) {
    loadConfiguration(targetBusinessId);
    subscribeToUpdates(targetBusinessId);
  }
}, [workCredentials?.businessId, businessId, session?.accessToken, ...]);
```

**Layout Integration:**
```typescript
// web/src/app/layout.tsx
<SessionProvider>
  <SessionReadyGate>  {/* NEW: Gate prevents providers from mounting without session */}
    <WorkAuthProvider>
      <DashboardProvider>
        <GlobalBrandingProvider>
          <GlobalSearchProvider>
            <ChatProvider>
              <GlobalTrashProvider>
                {/* ... rest of providers */}
              </GlobalTrashProvider>
            </ChatProvider>
          </GlobalSearchProvider>
        </GlobalBrandingProvider>
      </DashboardProvider>
    </WorkAuthProvider>
  </SessionReadyGate>
</SessionProvider>
```

**Verification:**
- ✅ No 403 errors on initial login
- ✅ Dashboard loads correctly on first try
- ✅ No "Failed to load dashboards" message
- ✅ Business configuration loads without errors
- ✅ Chat conversations load without errors
- ✅ Org chart data loads without errors
- ✅ Smooth user experience without page reload required
- ✅ NEXT_REDIRECT error still appears (expected Next.js behavior, harmless)

---

## Previous Session Issues & Solutions (January 2025)

### **API Routing Issues - RESOLVED** ✅

#### **Problem**: 404 Errors for Multiple API Endpoints
**Symptoms:**
```
GET https://vssyl.com/api/features/all 404 (Not Found)
GET https://vssyl.com/api/chat/api/chat/conversations 404 (Not Found)
```

**Root Causes:**
1. **Environment Variable Issues**: Next.js API routes using undefined `process.env.NEXT_PUBLIC_API_URL`
2. **Double Path Issues**: Chat API functions passing `/api/chat/conversations` as endpoint, but `apiCall` already adding `/api/chat` prefix

**Solutions Applied:**
1. **Fixed Environment Variables**: Updated all 9 Next.js API route files to use `process.env.NEXT_PUBLIC_API_BASE_URL` with proper fallback
2. **Fixed Chat API Paths**: Removed `/api/chat` prefix from all endpoint calls in `web/src/api/chat.ts`

**Files Modified:**
- `web/src/app/api/features/all/route.ts`
- `web/src/app/api/features/check/route.ts`
- `web/src/app/api/features/module/route.ts`
- `web/src/app/api/features/usage/route.ts`
- `web/src/app/api/trash/items/route.ts`
- `web/src/app/api/trash/delete/[id]/route.ts`
- `web/src/app/api/trash/restore/[id]/route.ts`
- `web/src/app/api/trash/empty/route.ts`
- `web/src/app/api/[...slug]/route.ts`
- `web/src/api/chat.ts`

**Verification:**
- All endpoints now return authentication errors instead of 404s
- Build deployed successfully (Build ID: 8990f80d-b65b-4adf-948e-4a6ad87fe7fc)

---

### **Browser Cache Issues - IDENTIFIED** ⚠️

#### **Problem**: Users See Old Error Logs After Deployment
**Symptoms:**
```
API Call Debug: {endpoint: '/api/features/all', API_BASE_URL: '', NEXT_PUBLIC_API_BASE_URL: undefined, NEXT_PUBLIC_API_URL: undefined, finalUrl: '/api/features/all', …}
```

**Root Cause**: Browser cache holding old JavaScript files from previous deployment

**Solutions:**
1. **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear Browser Cache**: 
   - Open Developer Tools (`F12`)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"
3. **Incognito Mode**: Test in private/incognito window to bypass cache

**Verification**: API endpoints work correctly when tested directly with curl commands

---

### **WebSocket Connection Issues - EXPECTED BEHAVIOR** 🔌

#### **Problem**: WebSocket Connection Failures
**Symptoms:**
```
WebSocket connection to 'wss://vssyl-server-235369681725.us-central1.run.app/socket.io/' failed
🔄 Attempting to reconnect (1/5)
🔄 Attempting to reconnect (2/5)
...
❌ Max reconnection attempts reached
```

**Root Cause**: WebSocket requires authentication; fails when user is not logged in or session is invalid

**Status**: **EXPECTED BEHAVIOR** - This is normal when:
- User is not authenticated
- Session token is expired
- User is not logged in

**Configuration**: Socket.IO is properly configured on backend with:
- CORS settings for allowed origins
- Authentication middleware
- Proper error handling

**Resolution**: WebSocket will connect successfully once user is properly authenticated with valid session token

#### **Local development: `ws://localhost:5000` TransportError / "websocket error"**

**Symptoms:**
```
WebSocket connection to 'ws://localhost:5000/socket.io/?EIO=4&transport=websocket' failed
❌ Notification socket connection error: TransportError: websocket error
🔄 Attempting to reconnect (1/5)
```

**Causes:**
1. **Backend not running** – Chat and notification sockets connect **directly** to the Express server at `localhost:5000`. Run **both** frontend and backend via `pnpm dev` from project root (starts Next.js + Express). If you only run `pnpm --filter web dev`, the backend is down → connection refused → TransportError.
2. **CORS** – The browser sends `Origin: http://localhost:3000` when the app is served from Next.js. Socket.IO CORS must allow that origin. The backend now allows `http://localhost:3000` and `http://localhost:3002` in addition to `ws://` variants.

**Checks:**
- Run `pnpm dev` from root; ensure the server logs show it listening on port 5000.
- Confirm no env overrides point WebSocket at production while you're testing locally.

---

#### **Business AI 404s (`/api/business-ai/:businessId/...`)**

**Symptoms:**
```
GET http://localhost:3000/api/business-ai/057335c0-.../employee-access 404 (Not Found)
GET http://localhost:3000/api/business-ai/057335c0-.../config 404 (Not Found)
GET .../analytics 404, .../learning-events 404, .../centralized-insights 404
```

**Cause:** The backend returns 404 when there is **no Business AI Digital Twin** for that business (e.g. not initialized, or wrong `businessId`). The proxy forwards to the backend; the 404 comes from the backend, not Next.js.

**Resolution:** Initialize Business AI for the business (e.g. via Control Center or admin flow). Until then, those endpoints correctly return 404; the UI should handle it (e.g. "Set up Business AI" or hide those sections).

---

## Build System Issues - RESOLVED ✅

### **Problem**: Builds Taking 20+ Minutes
**Root Cause**: Machine type configuration issues in Cloud Build

**Solution**: 
- Switched to E2_HIGHCPU_8 machine type
- Optimized Cloud Build configuration
- Removed problematic environment variable settings

**Result**: Builds now complete in 7-8 minutes consistently

---

## Common Troubleshooting Steps

### **For API Issues:**
1. **Check Build Status**: Verify latest build deployed successfully
2. **Test Endpoints Directly**: Use curl to test API endpoints
3. **Clear Browser Cache**: Hard refresh to get latest frontend code
4. **Check Authentication**: Ensure user is properly logged in

### **For WebSocket Issues:**
1. **Check Authentication**: WebSocket requires valid session token
2. **Verify Backend Status**: Ensure server is running and accessible
3. **Check CORS Settings**: Verify allowed origins in Socket.IO configuration

### **For Build Issues:**
1. **Check Cloud Build Logs**: Review build logs for specific errors
2. **Verify Machine Type**: Ensure E2_HIGHCPU_8 is available in region
3. **Check Environment Variables**: Verify no problematic env var settings

---

## Environment Variable Reference

### **Frontend Environment Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - Primary API base URL (preferred)
- `NEXT_PUBLIC_API_URL` - Fallback API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (optional)

### **Backend Environment Variables:**
- `BACKEND_URL` - Backend server URL
- `DATABASE_URL` - Database connection string
- `FRONTEND_URL` - Frontend URL for CORS

### **Fallback Hierarchy:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
                    process.env.NEXT_PUBLIC_API_URL || 
                    'https://vssyl-server-235369681725.us-central1.run.app';
```

---

## Production URLs

### **Service Endpoints:**
- **Frontend**: https://vssyl.com
- **Backend**: https://vssyl-server-235369681725.us-central1.run.app
- **WebSocket**: wss://vssyl-server-235369681725.us-central1.run.app/socket.io/

### **API Proxy:**
- Next.js API routes at `/api/*` proxy to backend server
- Authentication handled via NextAuth session tokens
- CORS configured for production domains

---

## Known Issues & Workarounds

### **Browser Cache After Deployment:**
- **Issue**: Users see old error logs after successful deployment
- **Workaround**: Always instruct users to hard refresh after deployment
- **Prevention**: Consider implementing cache-busting strategies

### **WebSocket Authentication:**
- **Issue**: WebSocket fails when user not authenticated
- **Workaround**: This is expected behavior, not an error
- **Documentation**: Clearly document that WebSocket requires authentication

### **Environment Variable Consistency:**
- **Issue**: Mixed usage of `NEXT_PUBLIC_API_URL` vs `NEXT_PUBLIC_API_BASE_URL`
- **Solution**: Standardized on `NEXT_PUBLIC_API_BASE_URL` as primary
- **Prevention**: Use consistent naming across all files

---

## Testing Checklist

### **After Each Deployment:**
- [ ] Test API endpoints with curl
- [ ] Verify frontend loads without console errors
- [ ] Check authentication flow
- [ ] Test WebSocket connection (when authenticated)
- [ ] Verify environment variables in browser console

### **For New Features:**
- [ ] Test API routing
- [ ] Verify environment variable usage
- [ ] Check WebSocket integration
- [ ] Test authentication requirements
- [ ] Verify CORS settings

---

## Contact & Support

### **Build Issues:**
- Check Cloud Build logs in Google Cloud Console
- Verify machine type availability
- Check environment variable configuration

### **API Issues:**
- Test endpoints directly with curl
- Check browser network tab
- Verify authentication status

### **WebSocket Issues:**
- Check authentication status
- Verify backend server status
- Check CORS configuration

---

*Last Updated: November 2025*
*Session: Session Timing Fix - Comprehensive Session Readiness Checks*
