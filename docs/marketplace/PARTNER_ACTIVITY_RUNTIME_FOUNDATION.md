# Partner Activity — Runtime Foundation

**Program:** Marketplace & Module Ecosystem — Phase 1B-F  
**Date:** 2026-06-24  
**Status:** ✅ Implemented

---

## 1. Purpose

Runtime foundation for **certified partner modules** to publish normalized activity into Vssyl via a guarded HTTP ingest path. Partners never call `emitModuleActivityEvent` directly.

---

## 2. Shared types

**`shared/src/types/activity-ingest.ts`**

| Type | Role |
|------|------|
| `PartnerActivityIngestManifest` | Manifest `activityIngest` block |
| `PartnerActivityIngestRequest` / `Response` | HTTP contract |
| `ActivityIngestJwtClaims` | Short-lived JWT payload |
| `NormalizedPartnerActivityPayload` | Post-validation internal shape |
| `ActivityIngestDiagnostics` | Probe / telemetry |
| `PartnerActivityIngestRegistration` | Registry entry |

Contract version: **`ACTIVITY_INGEST_CONTRACT_VERSION = "1"`**

---

## 3. Server modules

| Module | Path |
|--------|------|
| Config | `server/src/marketplace/activityIngestConfig.ts` |
| Manifest parser | `activityIngestManifest.ts` |
| JWT issue/verify | `activityIngestJwt.ts` |
| Registry + idempotency + rate limits | `activityIngestRegistry.ts` |
| Ingest service | `partnerActivityIngestService.ts` |
| Admin probe | `activityIngestProbe.ts` |
| Sync | `syncPartnerActivityIngest.ts`, `syncPartnerActivityIngestForModule.ts` |
| Sandbox pilot | `registerSandboxPilotActivityIngest.ts` |
| Controller | `server/src/controllers/module/moduleActivityIngestController.ts` |

---

## 4. API surface

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/modules/:moduleId/activity-ingest-token` | User session |
| `POST` | `/api/modules/:moduleId/activity-ingest` | Activity Ingest JWT |
| `GET` | `/api/admin-portal/modules/:moduleId/activity-ingest-probe` | Admin (`?live=true`) |

---

## 5. JWT

| Property | Value |
|----------|-------|
| Audience | `vssyl:activity-ingest:v1` |
| Issuer | `vssyl-platform` |
| TTL | 60–120s (default 90 via env) |
| Claims | `sub`, `moduleId`, `moduleVersionId`, `scope`, tenant ids, `userRef` hash, `requestId`, `jti` |
| Replay | `jti` consumed on successful ingest |

---

## 6. Registry & sync

Registration loads from published manifest when:

- Module is **APPROVED**
- Manifest declares `capabilities.activity` + valid `activityIngest`
- Certification checklist `activity_ingest` passes (validator **1.4.0**)
- Feature flag + allowlist permit runtime

**Sync hooks:**

- `ModuleRegistrySyncService` (per-module publish)
- Server startup: `syncAllPartnerActivityIngestFromDatabase()` + sandbox pilot registration

---

## 7. Ingest pipeline

```
Session → activity-ingest-token → partner POST activity-ingest
  → partnerActivityIngestService
    → JWT + moduleId pin + actor match + tenant match
    → entitlement (skipped in admin probe)
    → rate limit + idempotency
    → sanitize metadata
    → emitModuleActivityEvent
```

Metadata always includes `partnerOrigin: true` and `sourceModuleId`.

---

## 8. Environment

```bash
PARTNER_ACTIVITY_INGEST_ENABLED=false
PARTNER_ACTIVITY_INGEST_MODULE_ALLOWLIST=vssyl-pilot-assets
# PARTNER_ACTIVITY_INGEST_JWT_TTL_SECONDS=90
```

---

## 9. Tests

| File | Coverage |
|------|----------|
| `activityIngestJwt.test.ts` | Audience, jti replay, actor hash |
| `partnerActivityIngestService.test.ts` | Validation, pin, idempotency, metadata strip |
| `activityIngestRegistry.test.ts` | Manifest load, sandbox actions |
| `activityIngestProbe.test.ts` | Manifest validation, live probe |

---

## 10. Related docs

- [PARTNER_ACTIVITY_EVENT_CONTRACT.md](./PARTNER_ACTIVITY_EVENT_CONTRACT.md)
- [PARTNER_ACTIVITY_SECURITY_MODEL.md](./PARTNER_ACTIVITY_SECURITY_MODEL.md)
- [PARTNER_ACTIVITY_INGEST_ARCHITECTURE.md](./PARTNER_ACTIVITY_INGEST_ARCHITECTURE.md)
- [PARTNER_ACTIVITY_SANDBOX_PILOT.md](./PARTNER_ACTIVITY_SANDBOX_PILOT.md)
- [MARKETPLACE_PHASE_1B_F_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_F_CLOSEOUT.md)

---

**Last updated:** 2026-06-24
