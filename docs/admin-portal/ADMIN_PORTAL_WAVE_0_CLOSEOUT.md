# Admin Portal — Wave 0 Closeout

**Program:** Admin Portal Reference Program — Wave 0 Operational Confidence  
**Date:** 2026-07-05  
**Status:** Complete

---

## Summary

Wave 0 wired **live platform health** into the Admin Portal shell and dashboard using existing probes — no new monitoring stack, no architecture redesign. Operators can answer “Is Vssyl healthy?” from the header and Platform Overview without drilling into multiple pages.

**Operational maturity:** **~82% → ~86%** (post–Wave 0 estimate)

---

## Completed work

| ID | Item | Status |
|----|------|--------|
| W0-1 | Header health indicator (replaces static “System Online”) | ✅ |
| W0-2 | `ai-context` → `ai-pipeline/diagnostics` redirect | ✅ (pre-existing; verified) |
| W0-3 | `ai-system` → `ai-pipeline` redirect | ✅ |
| W0-4 | Marketplace probe toasts + inline feedback | ✅ |
| W0-5 | Email test + SMTP status on System Admin | ✅ |
| — | Platform health panel on dashboard | ✅ |
| — | `GET /api/admin-portal/platform/operations-status` | ✅ |
| — | Integration probe logic extracted to service | ✅ |

---

## Files modified

### Backend

| File | Change |
|------|--------|
| `server/src/services/admin/adminPlatformOperationsService.ts` | **New** — consolidates integration probes, platform metadata, operator status |
| `server/src/routes/admin-portal/adminPortalRoutes.platform.ts` | Operations-status route; integrations/status delegates to service |
| `server/src/routes/__tests__/admin-portal-operations-status.test.ts` | **New** — auth + response shape tests |

### Frontend

| File | Change |
|------|--------|
| `web/src/lib/adminPlatformOperations.ts` | **New** — operator status types and helpers |
| `web/src/lib/adminPortalOperatorToast.ts` | **New** — lightweight probe toasts (`react-hot-toast`) |
| `web/src/hooks/usePlatformOperationsStatus.ts` | **New** — polling hook |
| `web/src/components/admin-portal/PlatformHealthIndicator.tsx` | **New** — header status |
| `web/src/components/admin-portal/PlatformOperationsPanel.tsx` | **New** — dashboard/system health grid |
| `web/src/lib/adminApiService.ts` | `getPlatformOperationsStatus`, email status/test via proxy |
| `web/src/app/admin-portal/layout.tsx` | Live health indicator |
| `web/src/app/admin-portal/dashboard/page.tsx` | Health panel + copy polish |
| `web/src/app/admin-portal/system/page.tsx` | Compact health panel + SMTP test |
| `web/src/app/admin-portal/ai-system/page.tsx` | Redirect to AI Pipeline |
| `web/src/components/admin/MarketplaceReadinessCard.tsx` | Probe toasts + result messaging |
| `web/src/lib/__tests__/adminPlatformOperations.test.ts` | **New** |
| `web/src/lib/__tests__/adminPortalWave0Redirects.test.ts` | **New** |

### Documentation

| File | Change |
|------|--------|
| `docs/admin-portal/ADMIN_PORTAL_MODERNIZATION_PLAN.md` | Wave 0 marked complete |
| `docs/admin-portal/ADMIN_PORTAL_REFERENCE_PROGRAM_EXECUTIVE_SUMMARY.md` | Maturity updated |
| `docs/admin-portal/README.md` | Wave 0 closeout link |

---

## UX improvements

- Header shows **Healthy / Warning / Offline / Unknown** with refresh on click
- Platform Overview leads with **Platform health** grid (9 services)
- Probe buttons show **toast + inline success/failure** (no network-tab dependency)
- System Admin includes **SMTP configured/available** and **Send test email**
- Section descriptions clarified on dashboard and system pages
- Legacy **AI System** launcher removed (redirect to AI Pipeline)

---

## Operational improvements

| Service | Source | Surfaced in |
|---------|--------|-------------|
| API / uptime | `process.uptime()` | Operations status |
| Database | `probeDatabaseConnection` + `SELECT version()` | Operations status |
| Storage | GCS `bucket.exists()` or local | Operations status |
| Stripe | Stripe SDK `customers.list` | Operations status |
| Email (SMTP) | Env + configured flag | Operations status + System Admin |
| OpenAI | `models.list` | Operations status |
| Anthropic | Key format validation | Operations status |
| Realtime | Redis adapter env | Operations status (warning if single-process) |
| Search | `searchDelegateRegistry` count | Operations status |
| Cloud Run | `K_SERVICE`, `K_REVISION` | Platform metadata block |
| Environment | `NODE_ENV` | Platform metadata block |

---

## Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | ✅ Pass |
| `admin-portal-operations-status.test.ts` | ✅ 3/3 |
| `admin-portal-system-health.test.ts` | ✅ 3/3 |
| `adminPlatformOperations.test.ts` | ✅ 4/4 |
| `adminPortalWave0Redirects.test.ts` | ✅ 5/5 |
| Smart redirects (ai-system, ai-context, ai-learning, BI) | ✅ Verified |
| No duplicate static “System Online” | ✅ |

---

## Known limitations

1. **Cloud Run / Cloud SQL** — metadata from env (`K_SERVICE`, `K_REVISION`); no GCP API polling (by design).
2. **Anthropic** — format check only; no paid API call.
3. **Realtime** — warns when Redis adapter unset; does not prove socket connections.
4. **Search** — delegate count only; no index health.
5. **Product funnel analytics** — still outside portal (Wave 1+ / product program).
6. **Global operator search** — deferred to Wave 1.
7. **Businesses hub** — deferred to Wave 1.

---

## Recommended Wave 1 scope

1. **Businesses operator hub** (`/admin-portal/businesses`)
2. **Email Operations** dedicated panel (template list from existing previews)
3. **Global operator search** (users, businesses, modules, tickets)
4. **Analytics / BI merge** into single analytics destination

See [Modernization Plan](./ADMIN_PORTAL_MODERNIZATION_PLAN.md) Waves 1–2.

---

**Last updated:** 2026-07-05
