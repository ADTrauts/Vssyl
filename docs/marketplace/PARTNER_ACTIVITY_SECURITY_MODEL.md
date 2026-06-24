# Partner Activity — Security Model

**Program:** Marketplace & Module Ecosystem — Phase 1B-E / **1B-F implemented**  
**Date:** 2026-06-24  
**Status:** Architecture specification — **controls implemented**  
**Principle:** Partner activity is a **platform trust boundary**.

---

## 1. Threat model

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **T1 — User spoofing** | Partner claims `actor` is another user | JWT actor binding + membership proof |
| **T2 — Tenant escape** | Activity for business B while entitled only to A | Tenant validation against install + JWT |
| **T3 — Entity invention** | References non-existent or foreign entities | Entity type allowlist + optional entity registry |
| **T4 — Feed flooding** | High-volume spam | Rate limits + payload caps + certification |
| **T5 — Notification abuse** | Activity triggers unwanted pushes | Activity-only default; gated notification map |
| **T6 — Replay attacks** | Duplicate or delayed replay | Idempotency + short JWT TTL + optional jti |
| **T7 — Token theft** | Stolen ingest JWT | Short TTL, audience pinning, module binding |
| **T8 — Metadata injection** | XSS, secrets, oversized JSON | Sanitize, size limits, schema validation |

---

## 2. Authentication methods

### Primary: Activity Ingest JWT (recommended)

Mirror Search Delegate / Workspace Bridge pattern.

| Claim | Purpose |
|-------|---------|
| `aud` | `vssyl:activity-ingest:v1` |
| `sub` | `module:{moduleId}` |
| `moduleId` | Certified module id |
| `businessId` / `dashboardId` / `householdId` | Tenant scope |
| `actorUserId` | Platform user authorized in embed/session |
| `jti` | Optional replay protection (120s window) |
| `exp` | ≤ 120s from issue |

**Issuance:** Platform endpoint `POST /api/modules/:moduleId/activity-ingest-token` — only after:

1. User session valid
2. Module installed + entitled for tenant
3. Module on activity ingest allowlist (pilot)
4. `capabilities.activity` certified

Partner includes JWT as `Authorization: Bearer <token>` on ingest POST.

### Alternative: HMAC server-to-server (phase 2+)

For batch/async partners with dedicated integration credentials:

- `X-Vssyl-Signature` over canonical body (reuse `webhookSigning` patterns)
- Requires per-module **ingest secret** rotated via admin portal
- Still requires tenant + actor fields in body; platform validates independently

**Pilot:** JWT only. HMAC deferred until pilot proves JWT ergonomics insufficient.

---

## 3. Tenant validation

```
authorize ingest:
  1. Resolve moduleId from URL + JWT — must match
  2. Resolve tenant from JWT claims (authoritative)
  3. Reject if body.context.businessId ≠ JWT.businessId (when business scope)
  4. Prove BusinessModuleSubscription active (or free tier allowed)
  5. Prove module installed for dashboard/business
```

| Scope | Required proof |
|-------|----------------|
| `business` | `businessId` + active subscription + install row |
| `personal` | `dashboardId` + user owns dashboard |
| `household` | `householdId` + membership |

**Never** trust tenant ids from unsigned body fields alone.

---

## 4. Actor validation

| Step | Rule |
|------|------|
| 1 | `actorUserId` from JWT is primary |
| 2 | If body `actor.userRef` present, must equal JWT `actorUserId` |
| 3 | User must be member of business/household when scoped |
| 4 | Blocked/suspended users → `FORBIDDEN` |
| 5 | Service accounts | ❌ Not allowed in pilot — human actors only |

Partner cannot attribute activity to users outside the JWT-bound session.

---

## 5. Entitlement validation

| Check | Source |
|-------|--------|
| Module approved | `Module` status + certification |
| Activity capability | Manifest `capabilities.activity` + `activityIngest` |
| Runtime entitlement | `evaluateBusinessModuleEntitlement` |
| Pilot allowlist | `PARTNER_ACTIVITY_INGEST_MODULE_ALLOWLIST` env |
| Feature flag | `PARTNER_ACTIVITY_INGEST_ENABLED` |

Fail closed: missing any check → `FORBIDDEN` (not silent drop).

---

## 6. Entity validation

| Level | Pilot | Production |
|-------|-------|------------|
| Type allowlist | Manifest `entityTypes` | Same |
| ID format | Non-empty, max 128 chars | Same |
| Existence proof | ❌ Not required (partner SoR) | Optional entity registry webhook |
| Cross-tenant entity | Reject if metadata implies foreign tenant | Same |

Platform records **partner entity references** as opaque ids — it does not assert entity truth beyond type allowlist.

---

## 7. Rate limits

| Dimension | Pilot limit | Production target |
|-----------|-------------|-------------------|
| Per module + tenant | 60 events / minute | Configurable per tier |
| Per module global | 1000 events / minute | Burst protection |
| Payload size | 8 KB request | 8 KB |
| Metadata | 4 KB | Manifest `maxMetadataBytes` |
| Concurrent in-flight | 10 | 20 |

Exceeded → `429` / `RATE_LIMITED` with `Retry-After`.

---

## 8. Idempotency

| Property | Specification |
|----------|---------------|
| Store | In-memory (pilot); Redis target for production |
| Key | Partner-supplied `idempotencyKey` |
| Scope | moduleId + tenant + key |
| Conflict | Same key, different canonical payload hash → reject |
| Replay window | 72h minimum |

---

## 9. Audit & observability

| Event | Log |
|-------|-----|
| Ingest accepted | `operation: partner_activity_ingest_accepted` |
| Ingest rejected | `operation: partner_activity_ingest_rejected` + reason code |
| Rate limited | `partner_activity_ingest_rate_limited` |
| Idempotency hit | `partner_activity_ingest_duplicate` |

Admin probe: `GET /api/admin-portal/modules/:id/activity-ingest-probe?live=true` — synthetic ingest in sandbox. ✅ Implemented Phase 1B-F.

---

## 10. Security controls summary

| Control | Prevents |
|---------|----------|
| Short-lived JWT | T7 |
| Audience pinning | Token misuse across surfaces |
| Tenant JWT binding | T2 |
| Actor JWT binding | T1 |
| Manifest action/entity allowlist | T3 (partial) |
| Rate limits | T4 |
| Idempotency | T6 |
| Metadata sanitization | T8 |
| No auto-notification | T5 |
| Fail-closed entitlement | Unauthorized modules |

---

**Last updated:** 2026-06-24
