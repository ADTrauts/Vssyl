# Search Delegate — Security Model

**Program:** Marketplace & Module Ecosystem — Phase 1B-A  
**Date:** 2026-06-23  
**Status:** Security architecture — **implemented in Phase 1B-B** (`server/src/marketplace/searchDelegateJwt.ts`, `searchDelegateProxy.ts`)  
**Authority:** [SEARCH_DELEGATE_ARCHITECTURE.md](./SEARCH_DELEGATE_ARCHITECTURE.md), [MARKETPLACE_SECURITY_REVIEW.md](./MARKETPLACE_SECURITY_REVIEW.md)

---

## 1. Threat model

### 1.1 Trust zones

```
Zone A — Vssyl Platform (trusted)
  searchCapabilityService, PE, JWT issuer, registry loader

Zone B — Partner Search Delegate (semi-trusted)
  HTTPS endpoint on partner infrastructure
  Approved via admin review + certification

Zone C — End user (authenticated)
  Initiates search; must not control delegate URL or JWT claims
```

**Assumption:** Approved partners are not malicious at approval time; runtime controls detect compromise, bugs, or policy violations.

### 1.2 Threat actors

| Actor | Goal |
|-------|------|
| **Malicious partner** | Inject fake entities, exfiltrate cross-tenant data |
| **Compromised partner backend** | Leak JWT, return unauthorized hits |
| **Malicious user** | Access entities outside tenant via search |
| **External attacker** | SSRF, delegate URL manipulation, JWT forgery |

---

## 2. Security controls (summary)

| # | Control | Prevents |
|---|---------|----------|
| **SD-S01** | Platform PE `search:read` before any delegate call | PE bypass |
| **SD-S02** | Delegate URL fixed at publish time (manifest snapshot) | User-controlled SSRF |
| **SD-S03** | HTTPS-only delegate URLs | MITM |
| **SD-S04** | Short-lived Search Delegate JWT (60s) | Token replay |
| **SD-S05** | Distinct JWT `aud: vssyl:search-delegate:v1` | Context-token reuse |
| **SD-S06** | Registry only APPROVED + current PUBLISHED version | Unapproved module injection |
| **SD-S07** | Response normalization + schema validation | Field injection, prototype pollution |
| **SD-S08** | Result count cap + timeout + circuit breaker | DoS / slowloris |
| **SD-S09** | `moduleId` pinning on every result | Cross-module impersonation |
| **SD-S10** | Install gate (recommended) | Search without entitlement |
| **SD-S11** | Admin Test Lab probe before approval | Broken/malicious delegate at publish |
| **SD-S12** | Structured audit logging | Forensics |
| **SD-S13** | Suspend module → registry purge on sync | Revoked partner continued access |

---

## 3. JWT issuance

### 3.1 Issuer service (proposed)

`server/src/services/search/searchDelegateJwtService.ts`

**Invoked by:** `partnerSearchDelegateProxy.ts` immediately before outbound POST.

### 3.2 Token structure

```typescript
interface SearchDelegateJwtClaims {
  sub: string;           // userId
  aud: 'vssyl:search-delegate:v1';
  iss: 'vssyl-platform';
  moduleId: string;
  moduleVersionId: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  requestId: string;
  iat: number;
  exp: number;           // iat + 60
}
```

**Signing algorithm:** HS256 with `JWT_SECRET` (Phase 1B).  
**Phase 2 option:** RS256 with partner-fetched JWKS for asymmetric verification on partner side.

### 3.3 Partner verification guide (documented for developers)

Partners **must**:
1. Verify signature (shared secret provisioned at onboarding OR platform-published verification key)
2. Reject expired tokens (`exp`)
3. Reject wrong `aud`
4. Reject `moduleId` mismatch with self
5. Scope all database queries to `sub` + tenant claims
6. Never log full JWT

### 3.4 Secret provisioning (pilot model)

| Model | Phase | Notes |
|-------|-------|-------|
| **JWT only (HS256)** | Pilot | Partner trusts platform signature; uses claims for scoping |
| **Manifest `searchDelegate.signingSecretRef`** | 1B+ | Platform stores partner webhook-style secret for mutual auth on response (optional) |
| **mTLS** | Future | Enterprise tier |

**Pilot recommendation:** JWT claims-only auth on partner side (mirror AI context provider trust model). Add optional HMAC response signing in Phase 1C if needed.

---

## 4. Module identity verification

| Step | Verification |
|------|--------------|
| Registry load | `moduleId` from `Module.id`; manifest from `ModuleVersion.manifestSnapshot` where `isCurrent && PUBLISHED` |
| Outbound call | JWT `moduleId` matches registry entry |
| Inbound results | Each `result.moduleId` must equal registry `moduleId` — else drop row |
| URL binding | `searchDelegate.url` hostname logged at publish; changes require new version + re-approval |

**Suspended modules:** `Module.status !== APPROVED'` → removed from dynamic registry on next sync; in-flight JWT expires in 60s max.

---

## 5. Tenant context passing

### 5.1 Platform obligations

- Pass `context` exactly as received from `SearchFilters.context` (after PE validation)
- Never infer `businessId` from user alone when business scope search requested
- Include tenant claims in JWT **and** request body (redundant by design for partner validation)

### 5.2 Partner obligations

| Scope | Required enforcement |
|-------|---------------------|
| **personal** | Results scoped to `userId` + optional `dashboardId` |
| **business** | Results scoped to `businessId`; user must be active member |
| **household** | Results scoped to `householdId` |

**Certification test:** Platform QA uses two tenants — delegate must return zero cross-tenant hits.

---

## 6. Permission enforcement

### 6.1 Two-layer model

| Layer | Enforcer | Scope |
|-------|----------|-------|
| **Platform** | Policy Engine `search:read` | User may use global search at all |
| **Partner** | Partner SoR visibility | User may see specific entities |

### 6.2 Result-level permissions

Partner returns per hit:

```json
"permissions": [{ "type": "read", "granted": true }]
```

Platform normalizer:
- Drops hits where `granted === false`
- Sets `permissionsVerified` in retrieval evidence via mapper logic (existing: empty permissions array = verified)

**AI Retrieval / Context Graph:** Evidence with `permissionsVerified: false` excluded from graph bridge (existing rule).

---

## 7. Attack scenarios & mitigations

### 7.1 Inject fake entities

| Vector | Mitigation |
|--------|------------|
| Partner returns fabricated ids | Partner responsibility; user sees unresolvable deep links — acceptable risk for pilot |
| Partner impersonates `drive` moduleId | **SD-S09** drops mismatched moduleId |
| User crafts POST to partner directly | Partner validates JWT; no user-facing delegate URL without token |
| SQL injection in query | Partner parameterized queries (cert checklist) |

### 7.2 Leak cross-tenant data

| Vector | Mitigation |
|--------|------------|
| Partner ignores `businessId` | Certification QA + periodic audit sampling |
| JWT replay across tenants | Short TTL; tenant in claims; partner must re-validate |
| Platform passes wrong context | PE scope validation; unit tests |

### 7.3 Bypass Policy Engine

| Vector | Mitigation |
|--------|------------|
| Direct delegate call bypassing `/api/search` | Partner requires valid platform JWT — only platform issues |
| User without `search:read` | **SD-S01** blocks before delegate fan-out |
| Uninstalled module still searchable | **SD-S10** install gate |

### 7.4 Delegate URL attacks

| Vector | Mitigation |
|--------|------------|
| User changes URL at runtime | URL not user-controlled — manifest snapshot only |
| Partner redirects to internal metadata service | Platform does not follow redirects (fetch `redirect: 'manual'`) |
| Private IP / metadata SSRF from platform | Allowlist: delegate URL must be public HTTPS; block RFC1918 in validator at publish |

**Publish-time URL validation:** Extend `validateModuleHostedUrl` patterns for delegate URLs — reject localhost, IP literals, non-HTTPS.

---

## 8. Malicious delegate response handling

| Response pattern | Platform action |
|------------------|-----------------|
| 10 MB JSON body | Reject at 256 KB read cap |
| 10,000 results | Truncate to `limit` |
| HTML error page | Schema fail → `[]` |
| `permissions.granted: false` on all | Empty merge — valid |
| Prototype keys (`__proto__`) | JSON parse with safe schema validator |
| XSS in title/description | Strip HTML tags in normalizer; React escapes in UI |

---

## 9. Governance & revocation

| Event | Action |
|-------|--------|
| Admin **suspend** module | Purge from delegate registry immediately |
| Certification **FAILED** on promote | Block publish |
| Security incident | Admin suspend + invalidate via registry purge |
| Partner URL compromise | Admin rollback to prior version or suspend |

---

## 10. Logging & monitoring (no PII in logs)

| Field | Logged |
|-------|--------|
| `moduleId`, `requestId`, `durationMs`, `resultCount`, `httpStatus` | ✅ |
| `userId` | ✅ (internal logs) |
| `query` | ✅ (existing search logging pattern) |
| JWT raw | ❌ |
| Full result payloads | ❌ (debug flag only) |

**Cloud Monitoring alerts (recommended):**
- Spike in `partner_search_delegate` 5xx
- Circuit breaker open for module
- >50% invalid result rate

---

## 11. Certification security checklist (admin)

- [ ] Delegate URL is HTTPS public endpoint
- [ ] Test Lab probe returns valid schema
- [ ] Cross-tenant test passed (platform QA script)
- [ ] Timeout behavior verified
- [ ] Module suspended → search results disappear (post-approve test)
- [ ] No `capabilities.search` without delegate block in validator

---

## 12. Security readiness

| Dimension | Score (0–5) |
|-----------|-------------|
| Architecture completeness | 4 |
| Runtime enforcement (designed) | 4 |
| Partner attestation process | 3 |
| Automated cross-tenant testing | 2 |
| Incident response | 3 |

**Adequate for curated pilot after implementation. Not adequate for open marketplace without continuous monitoring.**

---

**Implementation:** Phase 1B-B — see [SEARCH_DELEGATE_RUNTIME_FOUNDATION.md](./SEARCH_DELEGATE_RUNTIME_FOUNDATION.md).

**Last updated:** 2026-06-24
