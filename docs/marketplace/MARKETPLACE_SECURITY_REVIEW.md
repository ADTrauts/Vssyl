# Marketplace — Security Review

**Program:** Marketplace & Module Ecosystem — Phase 0A Discovery  
**Date:** 2026-06-23  
**Status:** Discovery only — no penetration test performed  
**Authority:** [`docs/guides/THIRD_PARTY_MODULE_RULEBOOK.md`](../guides/THIRD_PARTY_MODULE_RULEBOOK.md), [`backend-trust-boundaries.mdc`](../../.cursor/rules/backend-trust-boundaries.mdc)

---

## 1. Executive summary

Vssyl's marketplace security model is **defense-in-depth for out-of-process execution**: no partner code in the API container, private GCS artifacts, admin approval gates, and iframe sandboxing. **Tenant isolation for first-party modules is strong**; **partner module isolation depends on partner implementation** with limited automated runtime verification.

**Security posture: Adequate for controlled partner program (Option B). Insufficient for open ecosystem (Option C) without additional automated runtime audits.**

---

## 2. Trust boundaries

```
┌─────────────────────────────────────────────────────────────┐
│ TRUST ZONE A — Vssyl Platform (high trust)                  │
│  Cloud Run API · Cloud SQL · GCS (artifacts) · JWT auth     │
│  First-party module code · PE · Activity · Domain Events      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS + signed URLs
                            │ Server-side fetch (AI context)
┌───────────────────────────▼─────────────────────────────────┐
│ TRUST ZONE B — Partner Module UI (untrusted)                │
│  iframe / blob bundle · postMessage bridge                  │
└───────────────────────────┬─────────────────────────────────┘
                            │ Partner-controlled
┌───────────────────────────▼─────────────────────────────────┐
│ TRUST ZONE C — Partner Backend (partner trust)              │
│  External APIs · Partner database · Partner auth            │
└─────────────────────────────────────────────────────────────┘
```

**Critical invariant:** Zone A must never execute Zone B/C code in-process. Enforced by certification validator forbidden keys/capabilities.

---

## 3. Permission boundaries

### 3.1 Platform-enforced permissions

| Action | Mechanism | Status |
|--------|-----------|--------|
| Marketplace browse | JWT auth | ✅ |
| Module install | JWT + PE `module:install` + membership | ✅ |
| Module uninstall | JWT + PE `module:uninstall` | ✅ |
| Runtime config fetch | Install record + APPROVED + subscription | ✅ |
| Admin review | Admin role check | ✅ |
| Artifact upload init | Developer auth + module ownership | ✅ |
| Global search | JWT + PE `search:read` | ✅ (first-party providers) |

### 3.2 Manifest-declared permissions

- Stored in `Module.permissions[]` and exposed in runtime config
- Validated structurally at certification
- **Not automatically enforced** by Policy Engine for partner entity operations
- Partners must implement authorization on their APIs

**Gap:** No runtime audit that partner APIs honor declared permissions.

### 3.3 Admin vs. developer vs. user

| Role | Capabilities | Controls |
|------|--------------|----------|
| **Platform admin** | Review, suspend, promote, bulk actions | Admin portal auth |
| **Module developer** | Submit, upload, link business | Owner + business membership |
| **Business admin** | Install/configure business scope | Business membership + role |
| **Personal user** | Install/configure personal scope | Authenticated user |

---

## 4. Tenant isolation

### 4.1 Platform data (first-party modules)

| Scope | Enforcement | Status |
|-------|-------------|--------|
| Personal | `dashboardId` + `userId` | ✅ Strong |
| Business | `dashboardId` + `businessId` | ✅ Strong |
| Household | `householdId` where applicable | ✅ Partial (fewer modules) |

Enforced in visibility services and controllers per module.

### 4.2 Marketplace metadata

| Query | Scoping | Status |
|-------|---------|--------|
| Installed modules | User/business membership | ✅ |
| Marketplace list | APPROVED only; business scope checks businessId | ✅ |
| Runtime config | Install record for scope | ✅ |
| Module submissions (admin) | Admin role | ✅ |
| User submissions | Developer ownership | ✅ |

### 4.3 Partner data

- Stored on **partner infrastructure** — outside Vssyl DB
- Vssyl passes `dashboardId` / `businessId` via runtime context and AI provider JWT claims
- **Partner must enforce** — certification checklist item; not automated

**Risk MS-01:** Compromised partner backend could expose cross-tenant data if partner fails to scope queries.

---

## 5. Module isolation

### 5.1 UI isolation (ModuleHost)

| Control | Implementation | Status |
|---------|----------------|--------|
| iframe sandbox | `allow-forms allow-scripts allow-same-origin` | ✅ |
| Cross-origin hosted URL | Origin check on postMessage | ✅ |
| Bundle mode | blob: same-origin | 🟡 Reduced isolation vs. cross-origin |
| Secret exclusion from runtime payload | Controller sanitization | ✅ |
| CSP for partner content | Partner responsibility | ⚠️ |

**Risk MS-02:** `allow-same-origin` + blob bundle allows module JS full same-origin access to parent origin cookies/storage if sandbox misconfigured. Mitigation: blob URLs isolate from parent DOM but share origin.

### 5.2 API process isolation

| Control | Status |
|---------|--------|
| No partner code in Express process | ✅ Enforced |
| Forbidden manifest keys blocked | ✅ Certification |
| Forbidden capability strings | ✅ Certification |
| Artifact baseline scan (path traversal, size) | ✅ |
| Smart scan layer | ✅ |
| Docker sandbox | ❌ Not production-viable on Cloud Run |

### 5.3 Storage isolation

| Asset | Access | Status |
|-------|--------|--------|
| Module artifacts | Private GCS; signed URLs only | ✅ |
| Drive/Chat/Platform data | Not accessible to partner without API | ✅ |
| Partner artifact bucket path | `modules/{moduleId}/versions/{version}/` | ✅ Namespaced |

---

## 6. Business isolation

| Scenario | Protection | Gap |
|----------|------------|-----|
| User A installs module in Business X | Installation scoped to businessId | ✅ |
| User B (non-member) installs in Business X | 403 membership check | ✅ |
| Module runtime in business scope | Runtime query requires businessId + install | ✅ |
| Partner API called with wrong businessId | Partner must reject | ⚠️ Not verified |
| Business A data visible in Business B | Platform queries scoped | ✅ Platform data |
| Cross-business via shared partner SaaS | — | ❌ Partner responsibility |

---

## 7. Household isolation

- Marketplace supports `household` context in manifest certification
- Few modules implement household scope today
- Install paths primarily personal/business
- **Household marketplace flows: Partial**

---

## 8. Attack surface inventory

| Surface | Risk level | Mitigation | Residual |
|---------|------------|------------|----------|
| `/api/modules/submit` | Medium | Security service validation | Hosted URL SSRF vectors — HTTPS validation |
| GCS signed upload URL | Medium | Short TTL, auth required | Leaked URL window |
| GCS signed read URL (runtime) | Medium | 15 min TTL, install gate | URL sharing |
| `GET /api/modules/:id/runtime` | Medium | Install + subscription checks | — |
| postMessage bridge | Medium | Origin allowlist | Message type validation limited |
| Admin review bypass | High | Scan + certification gate | Human error |
| `/api/debug/modules` | High | Dev-gated in index | Must not enable in prod |
| AI context provider fetch (server-side) | Medium | JWT + timeout | SSRF to partner URL — partner controlled |
| Webhook action executor | Medium | HMAC verification | Weak partner secret |
| Legacy hosted URL modules | Medium | Deprecation policy | Immutability bypass until cutoff |

---

## 9. What prevents a module from compromising platform security?

### Effective controls today

1. **No in-process execution** — partner cannot run arbitrary Node code in API container
2. **Admin approval gate** — no install without APPROVED status
3. **Artifact scanning** — blocks obvious zip attacks (path traversal, bombs)
4. **Certification validator** — blocks forbidden capabilities/keys
5. **iframe sandbox** — limits DOM access to parent (with bundle caveat)
6. **Runtime config sanitization** — no backend secrets in client payload
7. **Install/subscription gates** — runtime requires authorized install
8. **Private GCS** — artifacts not publicly listable
9. **JWT auth on all marketplace endpoints** — no anonymous install
10. **Policy Engine on install/uninstall** — privileged action gating

### Insufficient controls for open ecosystem

1. **No continuous runtime monitoring** of partner iframe behavior
2. **No automated tenant isolation audit** of partner APIs
3. **No bug bounty / penetration test program** for partner modules
4. **No content security policy enforcement** on partner bundles
5. **No rate limiting** specific to runtime config / AI provider fan-out per module
6. **Admin = manual admin review** for behavioral compliance
7. **postMessage bridge** not fully standardized or audited
8. **Mock security monitoring** in admin security routes

---

## 10. Security monitoring

| Component | Path | Status |
|-----------|------|--------|
| Structured logging | `logger.ts` — install, runtime, upload ops | ✅ |
| Admin security routes | `adminSecurityRoutes.ts` | 🟡 Partial mock |
| Certification audit trail | `ModuleVersion.certification*` fields | ✅ |
| Scan results persistence | `ModuleArtifact.scanSummary` | ✅ |
| Runtime access denied logging | `moduleRuntimeController` | ✅ |
| SIEM / alerting for marketplace | — | ❌ Not dedicated |

---

## 11. Security risk register

| ID | Risk | Severity | Likelihood | Mitigation |
|----|------|----------|------------|------------|
| MS-01 | Partner cross-tenant data leak | Critical | Medium | Partner audit program; automated spot checks |
| MS-02 | Bundle same-origin escalation | High | Low | CSP; cross-origin hosted preferred |
| MS-03 | SSRF via AI context provider URL | High | Low | URL allowlist; egress controls |
| MS-04 | Leaked signed GCS URL | Medium | Low | Short TTL; audit logging |
| MS-05 | Admin approves malicious module | High | Low | Scan + cert + manual review |
| MS-06 | Legacy hosted URL supply chain | Medium | Medium | Enforce artifact cutoff |
| MS-07 | Debug endpoint in production | Critical | Low | Verify prod config disables |
| MS-08 | BusinessModuleSubscription bypass | Medium | Medium | Fix billing write path |
| MS-09 | postMessage injection | Medium | Low | Strict message schema validation |
| MS-10 | Partner webhook secret exposure | High | Low | Secret manager pattern for partners |

---

## 12. Security readiness score

| Dimension | Score (0–5) |
|-----------|-------------|
| Execution isolation | 4 |
| Artifact pipeline security | 4 |
| Tenant isolation (platform) | 5 |
| Tenant isolation (partner) | 2 |
| Authorization gates | 4 |
| Monitoring & response | 2 |
| Certification automation | 3 |
| Open ecosystem readiness | 1 |

**Composite security readiness: 3.1 / 5** (adequate for curated partner program)

---

## 13. Recommendations (Phase 1 — no implementation in 0A)

1. **Enforce hosted URL cutoff** — reduce supply chain risk  
2. **Disable/verify debug routes in production** — operational checklist  
3. **Standardize postMessage schema** — reduce injection risk  
4. **Add marketplace-specific Cloud Monitoring alerts** — install/runtime 403/402 spikes  
5. **Partner security questionnaire** — required for approval beyond structural cert  
6. **Fix BusinessModuleSubscription** — close billing bypass  
7. **CSP guidance for bundle modules** — document required headers for hosted entryUrl  

---

**Last updated:** 2026-06-23
