# Partner Activity — Ingest Architecture

**Program:** Marketplace & Module Ecosystem — Phase 1B-E / **1B-F implemented**  
**Date:** 2026-06-24  
**Status:** ✅ **Implemented** (Phase 1B-F) — Hybrid HTTP Activity Ingest API  
**Implementation:** [PARTNER_ACTIVITY_RUNTIME_FOUNDATION.md](./PARTNER_ACTIVITY_RUNTIME_FOUNDATION.md)

---

## 1. Options evaluated

### A) Direct HTTP Activity Ingest API

Partner calls Vssyl `POST /api/modules/:moduleId/activity-ingest`.

| Pros | Cons |
|------|------|
| Explicit trust boundary | New surface to secure |
| Mirrors Search Delegate / Workspace Bridge | Requires registry + probe |
| Partners control when to emit | Partner must implement client |
| Maps cleanly to `emitModuleActivityEvent` | |

### B) Webhook Executor Bridge (inbound)

Reuse `ActionExecutorRegistry` webhook infrastructure for inbound activity.

| Pros | Cons |
|------|------|
| Existing HMAC signing patterns | Executors are **outbound** (platform → partner) |
| | Wrong semantic direction |
| | Couples activity to AI action executor lifecycle |
| | Harder to certify independently |

**Verdict:** ❌ Not recommended as primary. Outbound executor patterns inform HMAC option only.

### C) Domain Event Adapter (partner posts domain events)

Partner publishes to platform domain event bus.

| Pros | Cons |
|------|------|
| Reuses subscriber fan-out | Domain events = platform authoritative facts |
| | Partner claims are not facts until validated |
| | Would pollute domain taxonomy |
| | Notification subscriber would fire uncontrolled |

**Verdict:** ❌ Reject. Optional **derived** platform event after ingest only.

### D) Hybrid (recommended)

1. **Primary:** HTTP Activity Ingest API + JWT auth  
2. **Internal:** `partnerActivityIngestService` → validate → normalize → `emitModuleActivityEvent`  
3. **Optional downstream:** Platform emits `partner.activity.recorded` domain event for outbound webhooks  
4. **Future:** HMAC batch path for high-volume partners  

---

## 2. Recommended architecture

```
┌─────────────────────┐
│ Partner module      │
│ (iframe / server)   │
└──────────┬──────────┘
           │ 1. Request activity-ingest-token (session)
           ▼
┌─────────────────────┐
│ activityIngestToken │  JWT: aud, moduleId, tenant, actorUserId
│ Controller          │
└──────────┬──────────┘
           │ 2. POST activity-ingest + JWT
           ▼
┌─────────────────────┐
│ partnerActivity     │  authZ, rate limit, idempotency, schema
│ IngestService       │
└──────────┬──────────┘
           │ 3. normalize
           ▼
┌─────────────────────┐
│ emitModuleActivity  │  existing write path
│ Event               │
└──────────┬──────────┘
           │ 4. persist Log + socket refresh
           ▼
┌─────────────────────┐
│ platformActivity    │  GET /api/activity-feed (unchanged)
│ QueryService        │
└─────────────────────┘

Optional:
           │ 5. derived domain event (feature-flagged)
           ▼
┌─────────────────────┐
│ emitDomainEvent     │  partner.activity.recorded
│ (platform only)     │
└─────────────────────┘
```

---

## 3. Server modules (implemented — Phase 1B-F)

| Module | Responsibility |
|--------|----------------|
| `server/src/marketplace/activityIngestManifest.ts` | Parse manifest `activityIngest` block |
| `activityIngestConfig.ts` | Feature flags + allowlist |
| `activityIngestJwt.ts` | Issue/verify JWT |
| `activityIngestRegistry.ts` | Certified modules with ingest enabled |
| `partnerActivityIngestService.ts` | Validate + normalize + emit |
| `activityIngestProbe.ts` | Admin sandbox probe |
| `activityIngestController.ts` | HTTP routes → `moduleActivityIngestController.ts` |

**Sync hook:** Extend `ModuleRegistrySyncService` to register ingest-capable modules (mirror search delegate).

---

## 4. API surface (implemented)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/modules/:moduleId/activity-ingest-token` | User session | Issue short-lived JWT |
| `POST` | `/api/modules/:moduleId/activity-ingest` | Activity JWT | Ingest event |
| `GET` | `/api/admin-portal/modules/:id/activity-ingest-probe` | Admin | Sandbox validation |

---

## 5. Normalization service

```typescript
// Conceptual — implementation phase
async function ingestPartnerActivity(
  moduleId: string,
  jwt: ActivityIngestJwtClaims,
  body: PartnerActivityIngestRequest
): Promise<PartnerActivityIngestSuccessResponse> {
  // 1. verify JWT aud, moduleId, tenant, actor
  // 2. check idempotency
  // 3. validate action + entity against manifest
  // 4. rate limit
  // 5. emitModuleActivityEvent({ ...normalized })
  // 6. optional: emitDomainEvent derived
}
```

**Critical:** Only `partnerActivityIngestService` may call `emitModuleActivityEvent` for partner-sourced events — never expose emit directly.

---

## 6. Registry & certification

| Registry field | Source |
|----------------|--------|
| `moduleId` | Module table |
| `contractVersion` | Manifest |
| `actionTypes` | Manifest |
| `entityTypes` | Manifest |
| `ingestEnabled` | Admin approval + probe pass |
| `sandboxUrl` | Optional internal pilot |

Certification validator extension: AP-C01–AP-C07 (see event contract doc).

---

## 7. Sandbox pilot pattern

Reuse `vssyl-internal://sandbox/...` pattern from Search Delegate:

- Internal pilot module `vssyl-pilot-assets` emits sample activity via ingest API
- Admin probe validates end-to-end without external partner dependency

---

## 8. Why not domain-event-first

| Reason | Detail |
|--------|--------|
| Authority | Domain bus is for platform mutations |
| Notifications | `notificationDomainEventSubscriber` would fire on unvetted types |
| Taxonomy | `{module}.{entity}.{verb}` owned by platform |
| Audit | Activity ingest needs its own rejection telemetry |

Derived events **after** normalization preserve bus integrity.

---

## 9. Implementation phases

| Phase | Deliverable |
|-------|-------------|
| **1B-F** | JWT + ingest service + registry + probe + pilot | ✅ Complete |
| **1B-G** | Idempotency store + rate limiter + admin metrics |
| **1C** | First external partner pilot |
| **1D** | Optional HMAC batch path |
| **2** | Derived domain event + outbound webhook type |

---

## 10. Decision record

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary transport | HTTP ingest API | Explicit boundary; proven delegate pattern |
| Write path | `emitModuleActivityEvent` | Feed consumers unchanged |
| Auth | Short-lived JWT | Tenant + actor binding |
| Domain events | Derived optional | Protect bus semantics |
| Webhook executor | Not primary | Wrong direction |

---

**Last updated:** 2026-06-24
