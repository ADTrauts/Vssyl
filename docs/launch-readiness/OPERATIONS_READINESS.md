# Operations Readiness

**Program:** Launch Readiness — Phase 0A  
**Date:** 2026-06-30

**Reference:** `memory-bank/deployment.md`, `docs/deployment/`

---

## Infrastructure summary

| Component | Production | Status |
|-----------|------------|--------|
| Frontend | Cloud Run → `https://vssyl.com` | ✅ |
| Backend | Cloud Run → `vssyl-server-...us-central1.run.app` | ✅ |
| Database | Cloud SQL PostgreSQL | ✅ |
| File storage | GCS `vssyl-storage-472202` | ✅ |
| WebSocket | Same backend host `/socket.io/` | ✅ |
| CI/CD | GitHub Actions + Cloud Build on `main` | ✅ |
| Region | `us-central1` | ✅ |

---

## Secrets & environment

| Secret / env | Location | Validated |
|--------------|----------|-----------|
| `DATABASE_URL` | Secret Manager | 🔧 Operator |
| `JWT_SECRET` / refresh | Secret Manager | 🔧 |
| `NEXTAUTH_SECRET` | Frontend env | 🔧 |
| Stripe keys | Secret Manager | 🔧 |
| SMTP credentials | Secret Manager | 🔧 |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | ✅ Code fallback to prod URL |
| OpenAI / Anthropic keys | Secret Manager | 🔧 AI features |

**Rule:** No localhost in production-capable code paths — enforced in `.cursor/rules/api-and-auth.mdc`.

---

## Database & migrations

| Item | Status |
|------|--------|
| Prisma modular schema | ✅ |
| `prisma migrate deploy` on Cloud Run startup | ✅ |
| CI runs migrate before tests | ✅ |
| Failed migration recovery logic | ✅ In `server/src/index.ts` |
| Connection pooling | ✅ `connection_limit` in migration URL |
| Backup strategy | 🔧 Operator — Cloud SQL automated backups assumed; verify retention |

---

## Health & monitoring

| Endpoint | Purpose | Wired to status page? |
|----------|---------|---------------------|
| `GET /api/health` | DB + uptime | ❌ |
| `GET /api/ready` | Service readiness | ❌ |
| `GET /api/live` | Liveness | ❌ |
| `/status` (public) | Customer-facing | ⚠️ Static manual |

**Gap:** No external uptime monitor documented. Recommend UptimeRobot or GCP Monitoring alert on `/api/health`.

---

## Logging

| Item | Status |
|------|--------|
| Structured `logger` (`server/src/lib/logger.ts`) | ✅ New code |
| Logs persisted to DB (`logs` table) | ✅ |
| Secret redaction policy | ✅ Rules |
| Cloud Run log export | 🔧 Verify in GCP console |
| Error alerting | ❌ No PagerDuty/Slack integration documented |

---

## Error reporting

| Item | Status |
|------|--------|
| Client error boundaries | ⚠️ Partial |
| Server catch → structured log | ✅ |
| Sentry / similar APM | ❌ Not integrated |
| Admin system logs | ✅ `/admin-portal/system-logs` |

---

## Rate limiting & security

| Item | Status |
|------|--------|
| CORS configured | ✅ `server/src/index.ts` |
| JWT auth on protected routes | ✅ |
| Policy Engine authorization | ✅ Modules |
| Global auth rate limit | ❌ Not implemented |
| Contact form CAPTCHA | ❌ |
| HTTPS enforced | ✅ Cloud Run |
| Schema introspection route | 🔒 Disabled in prod |

---

## Storage & AI attachments

| Item | Status |
|------|--------|
| GCS bucket for uploads | ✅ |
| `storageService` tenant paths | ✅ |
| Local dev fallback | ✅ `uploads/` |

---

## Deployment process

```
git push main
  → Cloud Build (E2_HIGHCPU_8, ~7–10 min)
  → Docker multi-stage build
  → prisma generate + tsc
  → Deploy Cloud Run services
```

**Rollback:** Redeploy previous Cloud Run revision (operator procedure).

---

## Operational gaps before beta

| Priority | Gap | Action |
|----------|-----|--------|
| Critical | SMTP not verified | Run SMTP checklist |
| Critical | Stripe webhook not verified | Run Stripe checklist |
| High | No automated uptime alerts | GCP alert on `/api/health` 503 |
| High | `/status` not automated | Poll health or Statuspage |
| High | No on-call runbook | Create in EARLY_BETA_READINESS |
| Medium | No Sentry | Add for beta cohort |
| Medium | Backup restore untested | Annual restore drill |

---

## Verdict

**Infrastructure:** ✅ Ready for early customers at small scale  
**Operations:** ⚠️ Monitoring and email/commercial verification incomplete

Launch Readiness operations score: **70%**
