# Marketplace Partner — Security Review

**Program:** Marketplace & Module Ecosystem — Phase 1B-G  
**Date:** 2026-06-24  
**Status:** Consolidated security review — **no penetration test**  
**Supersedes for partner delegates:** Sections of [MARKETPLACE_SECURITY_REVIEW.md](./MARKETPLACE_SECURITY_REVIEW.md) (Phase 0A) updated through 1B-F  
**Authority:** [SEARCH_DELEGATE_SECURITY_MODEL.md](./SEARCH_DELEGATE_SECURITY_MODEL.md), [PARTNER_ACTIVITY_SECURITY_MODEL.md](./PARTNER_ACTIVITY_SECURITY_MODEL.md), [POSTMESSAGE_AUTH_BRIDGE.md](./POSTMESSAGE_AUTH_BRIDGE.md)

---

## 1. Executive summary

Partner marketplace security is **defense-in-depth for out-of-process execution** plus **short-lived capability JWTs** at each delegate boundary. Platform Zone A never executes partner code in-process.

**Posture after Phase 1B:** **Adequate for controlled partner pilots (Level 3). Insufficient for open ecosystem (Level 5) without automated partner runtime audits and durable replay/idempotency stores.**

| Zone | Trust | Partner exposure |
|------|-------|------------------|
| A — Vssyl Platform | High | API, DB, GCS, JWT issuance, normalization |
| B — Partner UI (iframe) | Untrusted | postMessage bridge only |
| C — Partner Backend | Partner trust | Delegate HTTPS endpoints |

---

## 2. Trust boundary controls

### 2.1 iframe isolation (ModuleHost)

| Control | Status | Notes |
|---------|--------|-------|
| sandbox attribute | ✅ | `allow-forms allow-scripts allow-same-origin` |
| Cross-origin postMessage filter | ✅ | Origin validation |
| Blob bundle mode | 🟡 | Same-origin; reduced isolation vs hosted HTTPS iframe |
| Session token in iframe | ❌ Forbidden | Bridge JWT only |
| Runtime payload sanitization | ✅ | Secrets stripped from config response |

### 2.2 Workspace bridge JWT

| Property | Value |
|----------|-------|
| Audience | `vssyl:workspace-bridge:v1` |
| TTL | ~120s (configurable) |
| Binding | moduleId, tenant scope, user ref |
| Replay | jti consumption pattern |
| Session exposure | None via postMessage |

### 2.3 Search delegate JWT

| Property | Value |
|----------|-------|
| Audience | `vssyl:search-delegate:v1` |
| TTL | ~60s |
| Binding | moduleId, tenant, user |
| SSRF mitigation | Fixed HTTPS URL at publish time |
| PE gate | `search:read` before delegate call |
| Failure mode | Empty partner slice; global search continues |

### 2.4 Activity ingest JWT

| Property | Value |
|----------|-------|
| Audience | `vssyl:activity-ingest:v1` |
| TTL | ~90s |
| Binding | moduleId, tenant, actor hash |
| Actor spoofing | Rejected — actor.userRef must match token subject |
| Write path | Only `partnerActivityIngestService` → `emitModuleActivityEvent` |
| Metadata | Size cap + unsafe key stripping |

---

## 3. Tenant isolation

### 3.1 Platform-enforced

| Path | Mechanism |
|------|-----------|
| Install / runtime | Install record + APPROVED + entitlement |
| Search delegate | JWT tenant + PE |
| Workspace bridge | JWT tenant + membership |
| Activity ingest | JWT tenant + business membership + entitlement |
| Module scope | `moduleScope` gates install/browse/billing |
| Marketplace list | APPROVED + scope-compatible context |

### 3.2 Partner-enforced (certification honor)

| Risk | ID | Mitigation today | Gap |
|------|-----|------------------|-----|
| Partner API cross-tenant leak | MS-01 | Certification checklist | No automated audit |
| Partner stores wrong businessId | MS-02 | Runtime context passed explicitly | Partner must validate |
| Over-privileged manifest permissions | MS-03 | Structural validation | PE not applied to partner entity ops |

---

## 4. moduleId pinning & impersonation

| Surface | Pin mechanism |
|---------|---------------|
| Search | URL `:moduleId` = JWT `moduleId`; results tagged |
| Workspace | URL `:moduleId` = JWT `moduleId` |
| Activity ingest | URL `:moduleId` = JWT `moduleId`; platform assigns event moduleId |
| Registry | Only APPROVED + certified modules registered |

Partners **cannot** publish activity or search results as another module.

---

## 5. jti replay protection

| Surface | Implementation | Production note |
|---------|----------------|-----------------|
| Search delegate | In-memory jti cache | Multi-instance: use Redis |
| Workspace bridge | In-memory jti cache | Same |
| Activity ingest | In-memory jti cache | Same |

Replay after consumption → reject. TTL pruning on cache.

---

## 6. Entitlement & certification gates

| Gate | When enforced |
|------|---------------|
| Module APPROVED | Registry sync, runtime, ingest |
| Certification validator 1.4.0 | Publish/approve; capability blocks |
| Feature flag + allowlist | Each delegate surface |
| `evaluateBusinessModuleEntitlement` | Business runtime, billing, ingest (non-probe) |
| Admin probe (probeMode) | Skips entitlement for synthetic validation only |

**Fail-closed:** Missing gate → `FORBIDDEN` or empty delegate participation — not silent success.

---

## 7. Admin probes (security role)

Probes allow admins to validate delegate contracts **before** enabling production flags:

| Probe | Validates |
|-------|-----------|
| search-delegate-probe | Manifest + registry + live delegate round-trip |
| workspace-bridge-probe | Manifest + JWT + embed contract |
| business-billing-probe | Subscription / entitlement path |
| activity-ingest-probe | Manifest + registry + synthetic ingest (probeMode) |

Probes require **ADMIN** role.

---

## 8. GCP / egress security

| Topic | Assessment |
|-------|------------|
| Partner code in Cloud Run container | ❌ By design — correct |
| GCS artifacts private | ✅ Signed URLs only |
| Server egress to partner URLs | ✅ Required for delegates; URL pinned at publish |
| Secrets in env | ✅ Secret Manager / Cloud Run secrets |
| Rollback | ✅ Version archive + promote previous |

---

## 9. Threat summary

| Threat | Control | Residual |
|--------|---------|----------|
| T1 Actor spoofing | JWT subject + actor ref match | Low (platform paths) |
| T2 Cross-tenant publish | Tenant JWT + membership + entitlement | Low (platform); Medium (partner SoR) |
| T3 Arbitrary event/search types | Manifest allowlists | Low |
| T4 Feed/search flooding | Rate limits (pilot in-memory) | Medium until Redis |
| T5 Notification spam from activity | Activity-only policy; no auto-notify | Low |
| T6 Replay attacks | jti consumption | Medium multi-instance |
| T7 Token theft / reuse | Short TTL + distinct aud | Low |
| T8 Metadata injection | Sanitization + size caps | Low |

---

## 10. Security recommendation

| Audience | Recommendation |
|----------|----------------|
| Controlled pilot (1C) | **Approve** with allowlist + flags + admin probe gate |
| Production multi-instance | **Require** Redis-backed jti/idempotency before broad enablement |
| Open ecosystem | **Defer** until MP-05, MP-10, MP-11 addressed |

---

**Last updated:** 2026-06-24
