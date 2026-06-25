# GCP Runtime Validation

**Phase:** Platform Controller 1E  
**Date:** 2026-06-25

---

## 1. Production topology

| Component | Identifier | Region |
|-----------|------------|--------|
| Cloud Run (API) | `vssyl-server` | `us-central1` |
| Cloud Run (web) | `vssyl-web` | `us-central1` |
| Cloud SQL | `vssyl-db-optimized` | `us-central1` |
| GCS bucket | `vssyl-storage-472202` | US |
| Artifact Registry | `us-central1-docker.pkg.dev/vssyl-472202/vssyl` | `us-central1` |
| Public API | `https://vssyl-server-235369681725.us-central1.run.app` | — |
| Public web | `https://vssyl.com` | — |

---

## 2. Cloud Run — server (`vssyl-server`)

### 2.1 Deploy configuration (`cloudbuild.yaml`)

| Setting | Value |
|---------|-------|
| Memory / CPU | 2Gi / 2 |
| Min instances | 1 |
| Timeout | 300s |
| Cloud SQL | `vssyl-472202:us-central1:vssyl-db-optimized` |
| VPC egress | `private-ranges-only` (SQL via connector) |
| Port | 5000 |

### 2.2 Environment variables (non-secret)

| Variable | Purpose |
|----------|---------|
| `NODE_ENV=production` | Runtime |
| `FRONTEND_URL` / `NEXT_PUBLIC_APP_URL` | CORS / redirects |
| `STORAGE_PROVIDER=gcs` | Use GCS not local disk |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project |
| `GOOGLE_CLOUD_STORAGE_BUCKET` | Artifact / file storage |

### 2.3 Secrets (Secret Manager → env)

| Secret name | Env var |
|-------------|---------|
| `database-url` | `DATABASE_URL`, `DIRECT_URL` |
| `jwt-secret` | `JWT_SECRET` |
| `jwt-refresh-secret` | `JWT_REFRESH_SECRET` |
| `openai-api-key` | `OPENAI_API_KEY` |
| `openai-admin-api-key` | `OPENAI_ADMIN_API_KEY` |
| `anthropic-api-key` | `ANTHROPIC_API_KEY` |
| `stripe-secret-key` | `STRIPE_SECRET_KEY` |
| `stripe-webhook-secret` | `STRIPE_WEBHOOK_SECRET` |

### 2.4 Live health probes (2026-06-25)

```json
GET /api/health → {
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
GET /api/ready → 200
```

| Endpoint | Purpose | Stripe/GCS depth |
|----------|---------|------------------|
| `/api/health` | DB + process | DB only |
| `/api/ready` | Readiness | DB only |
| `/api/live` | Liveness ping | None |
| `/api/schema` | Disabled in prod | — |

**Gap:** Health does not prove Stripe or GCS — only database connectivity.

---

## 3. Cloud Run — web (`vssyl-web`)

| Secret / env | Purpose |
|--------------|---------|
| `NEXTAUTH_SECRET` | Auth |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client Stripe |
| `BACKEND_URL` / `NEXT_PUBLIC_API_BASE_URL` | Proxy to server |
| `NEXTAUTH_URL=https://vssyl.com` | Session |

Platform Controller calls `/api/admin-portal/*` via Next.js proxy (`BACKEND_URL`).

---

## 4. Cloud SQL

| Attribute | Live value |
|-----------|------------|
| Instance | `vssyl-db-optimized` |
| State | **RUNNABLE** |
| Version | PostgreSQL **15** |
| Tier | `db-f1-micro` |

Prisma connects via socket from Cloud Run (`--add-cloudsql-instances`).

Migrations: run on server startup per `cloudbuild.yaml` comment (not as separate build step).

**Platform Controller dependency:** All admin lists (billing, modules, pipeline traces) require SQL reachable — **verified live** via `/api/health`.

---

## 5. Google Cloud Storage

| Attribute | Value |
|-----------|-------|
| Bucket | `vssyl-storage-472202` |
| Provider flag | `STORAGE_PROVIDER=gcs` |
| Service | `server/src/services/storageService.ts` |

| Capability | Method | PC relevance |
|------------|--------|--------------|
| Upload | `uploadToGCS` | Module artifacts |
| Signed read URL | `getSignedUrl` | Secure artifact download |
| Signed upload URL | `getSignedUploadUrl` | Developer artifact upload |
| Fallback | Local on GCS failure | Should not occur in prod |

**Live validation:** Bucket exists via `gcloud storage buckets describe`. Signed URL generation **not** exercised in 1E (requires runtime upload path + IAM).

---

## 6. Module runtime loading

| Path | Validation |
|------|------------|
| Partner iframe / bundle | Marketplace runtime (not PC) |
| Artifact scan | Admin modules certification |
| `moduleRuntimeController` | Entitlement before run |
| Sandbox pilot | Readiness probes |

Platform Controller does not host module runtime — validates via **readiness probes** and **module stats** only.

---

## 7. Required env vars checklist (operators)

### Server (minimum for PC + billing truth)

- [x] `DATABASE_URL` / `DIRECT_URL`
- [x] `JWT_SECRET` / `JWT_REFRESH_SECRET`
- [x] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- [x] `STORAGE_PROVIDER=gcs` + `GOOGLE_CLOUD_STORAGE_BUCKET`
- [x] `GOOGLE_CLOUD_PROJECT_ID`
- [ ] `SOCKET_IO_REDIS_URL` (if multi-instance realtime — optional for PC)

### Web

- [x] `NEXTAUTH_*`
- [x] `BACKEND_URL` / `NEXT_PUBLIC_API_BASE_URL`
- [x] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## 8. Feature table

| Capability | PC tie-in | GCP dependency | Live status | Risk |
|------------|-----------|----------------|-------------|------|
| Admin API | All PC pages | Cloud Run server | **Healthy** | Low |
| Billing DB reads | Billing | Cloud SQL | **Connected** | Low |
| Stripe webhooks | Billing sync | Cloud Run + secrets | **Route live** | Medium |
| Module artifacts | Modules | GCS | **Bucket exists** | Low |
| AI provider expenses | Billing tab | External APIs + secrets | Not probed | Medium |
| Pipeline traces | Programs / pipeline | Cloud SQL | Data-dependent | Medium |
| File signed URLs | Marketplace ops | GCS IAM | Code only | Medium |

---

## 9. Cloud Build

| Item | Status |
|------|--------|
| Pipeline | `cloudbuild.yaml` Kaniko + deploy |
| Recent failure | `bdb96683` — web TS billing types (fixed `9bb0756c`) |
| Follow-up build | Expected success after push |

---

**Last updated:** 2026-06-25
