# Search Delegate — Architecture

**Program:** Marketplace & Module Ecosystem — Phase 1B-A  
**Date:** 2026-06-23  
**Status:** Architecture design — **implemented in Phase 1B-B** (see [SEARCH_DELEGATE_RUNTIME_FOUNDATION.md](./SEARCH_DELEGATE_RUNTIME_FOUNDATION.md))  
**Authority:** [SEARCH_PARTICIPATION_ARCHITECTURE.md](./SEARCH_PARTICIPATION_ARCHITECTURE.md), [SEARCH_CONSTITUTION.md](../search/SEARCH_CONSTITUTION.md), [SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md](../search/SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md) (M-02)

---

## 1. Purpose

Define the complete architecture for **certified partner modules** to participate in Unified Search via an **HTTP Search Delegate** — without modifying the search orchestrator's external contract, Policy Engine model, or first-party provider implementations.

**Framing:** Search Delegate is a **Platform Capability Integration**, not a marketplace feature. Partners join the **Vssyl intelligence stack** at the discovery layer; downstream consumers (AI Retrieval, Context Graph inference) inherit participation automatically through existing mappers.

---

## 2. Participation readiness

| Metric | Value |
|--------|-------|
| **Current level** | **3 — Pilot Ready** (Phase 1B-B) |
| **Pre-1B-A level** | 2 — Architecturally Ready (Phase 1A sketch) |
| **Target after pilot certification** | **4 — Certified Partner Capability** |
| **Remaining blockers to Level 4** | Production HTTPS partner endpoint, Test Lab UI probe surfacing, governance allowlist |

---

## 3. End-to-end flow

```
┌──────────────┐     POST /api/search      ┌─────────────────────────────┐
│ User / AI    │ ────────────────────────► │ searchCapabilityService      │
│ consumer     │                           │  1. evaluateSearchPolicyDual │
└──────────────┘                           │  2. resolveProviders()       │
                                           │  3. fan-out per provider     │
                                           └──────────────┬──────────────┘
                                                          │
                    ┌─────────────────────────────────────┼─────────────────────────────────────┐
                    │                                     │                                     │
                    ▼                                     ▼                                     ▼
           ┌────────────────┐              ┌─────────────────────────┐              ┌────────────────┐
           │ In-process     │              │ Partner HTTP delegate    │              │ Platform       │
           │ visibility     │              │ proxyPartnerSearch()     │              │ delegate       │
           │ service        │              │                          │              │ (member,vlink) │
           └────────────────┘              └────────────┬────────────┘              └────────────────┘
                                                         │
                                                         │ POST + platform JWT
                                                         ▼
                                              ┌─────────────────────────┐
                                              │ Partner HTTPS endpoint   │
                                              │ (module SoR boundary)    │
                                              └─────────────────────────┘
                                                         │
                                                         ▼
                                              SearchResult[] (partner contract)
                                                         │
                    ┌────────────────────────────────────┘
                    ▼
           normalizePartnerSearchResults()
                    │
                    ▼
           merge + sort by relevanceScore
                    │
                    ▼
           GlobalSearchResponse (unchanged shape)
```

### Downstream (no changes required in 1B-A implementation scope)

| Consumer | Integration point | Mechanism |
|----------|-------------------|-----------|
| **AI Retrieval** | `aiRetrievalCapabilityService.discover()` | Already calls `executeGlobalSearch` → `mapSearchResultsToEvidence` |
| **Context Graph inference** | `enrichGraphBundlesFromRetrieval` | Eligible evidence with `permissionsVerified: true` |
| **Global search UI** | `POST /api/search` response | Standard `SearchResult[]` |

---

## 4. Platform components (proposed)

| Component | Path (proposed) | Responsibility |
|-----------|-----------------|----------------|
| **Partner registry** | `server/src/services/search/partnerSearchDelegateRegistry.ts` | In-memory index from published manifests |
| **Registry loader** | Extend `ModuleRegistrySyncService.syncModule` | Materialize/clear delegate on approve/suspend |
| **HTTP proxy** | `server/src/services/search/partnerSearchDelegateProxy.ts` | JWT, POST, timeout, normalize, metrics |
| **Normalizer** | `server/src/services/search/partnerSearchResultNormalizer.ts` | Strip unknown fields; enforce caps |
| **Dynamic provider factory** | `server/src/services/search/buildPartnerSearchProvider.ts` | Returns `RegisteredSearchProvider` |
| **Registry merge** | `searchProviderRegistry.ts` | `getReadySearchProviders()` = static ∪ dynamic |
| **Certification** | `moduleCertificationValidator.ts` | Require `searchDelegate` when search claimed |
| **Test Lab** | Admin portal modules page | Pre-approval delegate probe |

**Existing components unchanged:** `searchCapabilityService.ts`, `searchController.ts`, `searchPolicyDual.ts`, `aiRetrievalEvidenceMapper.ts`.

---

## 5. Request format

### 5.1 HTTP semantics

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `manifest.searchDelegate.url` (HTTPS only, fixed at publish) |
| **Content-Type** | `application/json` |
| **Accept** | `application/json` |
| **Timeout** | `min(manifest.searchDelegate.timeoutMs, 3000)` — platform cap 3000 ms |
| **Idempotency** | None required (read-only) |

### 5.2 Request body (`PartnerSearchDelegateRequest` v1)

```typescript
interface PartnerSearchDelegateRequest {
  /** Contract version — must match manifest searchDelegate.version */
  contractVersion: '1';
  /** Normalized query (trimmed, min length already enforced by orchestrator) */
  query: string;
  /** Authenticated Vssyl user id */
  userId: string;
  /** Tenant scope from SearchFilters.context */
  context: {
    dashboardId?: string;
    businessId?: string;
    householdId?: string;
  };
  /** Provider module id (marketplace moduleId) */
  moduleId: string;
  /** Optional filters forwarded from global search */
  filters?: {
    type?: string;
    dateRange?: { start: string; end: string };
    pinned?: boolean;
  };
  /** Platform-enforced result cap */
  limit: number;
  /** Correlation id for logs — platform-generated UUID */
  requestId: string;
}
```

### 5.3 Request headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <platform_search_jwt>` |
| `Content-Type` | `application/json` |
| `X-Vssyl-Request-Id` | Same as body `requestId` |
| `X-Vssyl-Contract-Version` | `1` |
| `User-Agent` | `Vssyl-Search-Delegate/1.0` |

---

## 6. Response format

### 6.1 Success (`PartnerSearchDelegateResponse` v1)

```typescript
interface PartnerSearchDelegateResponse {
  success: true;
  contractVersion: '1';
  results: PartnerSearchResultItem[];
  /** Optional partner-side timing for diagnostics */
  meta?: {
    durationMs?: number;
    totalMatches?: number;
    truncated?: boolean;
  };
}
```

### 6.2 Error (`PartnerSearchDelegateErrorResponse`)

```typescript
interface PartnerSearchDelegateErrorResponse {
  success: false;
  error: {
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_REQUEST' | 'INTERNAL_ERROR';
    message: string;
  };
}
```

| HTTP status | Platform behavior |
|-------------|-------------------|
| **200** + `success: true` | Normalize and merge results |
| **401 / 403** | Log security event; return `[]` for this provider |
| **4xx** other | Log warn; return `[]` |
| **5xx / timeout / network** | Log warn; circuit breaker tick; return `[]` |
| **Invalid JSON / schema** | Log error; return `[]`; flag for admin review |

**Principle:** Partner delegate failure **must not** fail global search. First-party results still return.

---

## 7. Authentication

Platform issues a **Search Delegate JWT** per request (not the user's session token).

| Claim | Value |
|-------|-------|
| `sub` | `userId` |
| `aud` | `vssyl:search-delegate:v1` |
| `iss` | `vssyl-platform` |
| `moduleId` | Marketplace module id |
| `moduleVersionId` | Current published version id (audit) |
| `dashboardId` | Optional, from context |
| `businessId` | Optional, from context |
| `householdId` | Optional, from context |
| `requestId` | Correlation id |
| `iat` / `exp` | **TTL: 60 seconds** |

**Signing:** `JWT_SECRET` (same secret family as context providers; separate `aud` prevents token reuse across capability types).

**Partner verification:**
1. Validate signature with published platform public key OR shared secret model (Phase 1: HMAC with partner-registered secret in manifest — see Security Model doc)
2. Validate `aud`, `exp`, `moduleId` matches self
3. Enforce tenant scope on all SoR queries

---

## 8. Authorization

### 8.1 Platform layer (before delegate call)

| Gate | Mechanism |
|------|-----------|
| User authenticated | `POST /api/search` requires JWT |
| Policy Engine | `evaluateSearchPolicyDual` — `search:read` |
| Module approved | Delegate registry only contains APPROVED + PUBLISHED modules |
| Module installed | Optional gate: user/business has `ModuleInstallation` / `BusinessModuleInstallation` |
| Scope supported | `searchDelegate.supportedContexts` includes active scope |

**Open design decision (pilot):** Require install record for search participation — **recommended YES** for business scope; personal scope same as runtime.

### 8.2 Partner layer (delegate endpoint)

Partner **must** enforce entity-level read using JWT claims. Platform trusts only results with `permissions: [{ type: 'read', granted: true }]`.

Platform re-validates:
- `result.moduleId === delegate.moduleId`
- `result.id` non-empty, stable
- Result count ≤ `limit`

---

## 9. Error handling & resilience

| Scenario | Behavior |
|----------|----------|
| Timeout (>3000 ms) | Abort fetch; `[]`; increment `partnerSearchDelegateTimeouts` metric |
| Circuit open (5 failures / 60s) | Skip delegate until half-open probe succeeds |
| Partial invalid results | Drop invalid rows; keep valid; warn if >50% invalid |
| Empty results | Valid — no error |
| Partner returns 403 | Expected for unauthorized tenant — log at info |

Structured log fields: `operation: 'partner_search_delegate'`, `moduleId`, `requestId`, `durationMs`, `resultCount`, `httpStatus`.

---

## 10. Timeout behavior

| Layer | Default | Max |
|-------|---------|-----|
| Manifest `timeoutMs` | 2500 | 3000 |
| Platform hard cap | — | 3000 |
| Orchestrator total budget | — | 8000 (all providers) |

Partner delegates run **in parallel** with in-process providers (same as current sequential loop — future: parallelize with `Promise.allSettled`).

---

## 11. Result normalization

All partner responses pass through `normalizePartnerSearchResults()` before entering merge sort.

See [SEARCH_DELEGATE_RESULT_CONTRACT.md](./SEARCH_DELEGATE_RESULT_CONTRACT.md) for field-level rules.

Post-normalization, partner results are indistinguishable from first-party results in:
- `executeGlobalSearch` merge
- `mapSearchResultToEvidence`
- Context Graph inference eligibility

---

## 12. `RegisteredSearchProvider` mapping

Dynamic partner providers use new `searchMethod` value (proposed):

```typescript
searchMethod: 'partner_http_delegate'
```

```typescript
{
  providerId: moduleId,
  moduleId,
  moduleName: manifest.name,
  displayName: manifest.name,
  entityTypes: searchDelegate.entityTypes,
  supportedContexts: searchDelegate.supportedContexts,
  requiredPermission: 'search:read',
  readiness: 'ready',
  manifestSearchClaim: true,
  search: (query, userId, filters) =>
    proxyPartnerSearch({ moduleId, query, userId, filters }),
}
```

Aligns with existing `RegisteredSearchProvider` in `shared/types/search.ts` (extend `SearchProviderMethod` union at implementation time).

---

## 13. Platform impact assessment

| System | Impact | Change required |
|--------|--------|-----------------|
| **Unified Search** | Partner results in merged response | Registry merge + proxy |
| **AI Retrieval** | Partner evidence via existing mapper | **None** (inherits search) |
| **Context Graph** | Inference nodes from partner evidence | **None** in 1B-A (bridge already exists) |
| **Marketplace governance** | Test Lab + cert gate | Admin UI + validator |
| **Certification** | PS-01–PS-10 checklist | Validator extension |
| **ModuleRegistrySyncService** | Load/unload delegates | Sync hook |
| **First-party providers** | None | **Zero regression** |

---

## 14. Strategic answer

**Should Search Delegate become the standard entry point for partner intelligence integrations?**

**Yes — with narrow scope.**

| Future capability | Entry via Search Delegate? | Rationale |
|-------------------|---------------------------|-----------|
| **AI Retrieval discovery** | **Yes** | Already `discover()` → `executeGlobalSearch` |
| **Context Graph inference** | **Yes (read path)** | Evidence from search mapper; not SoR federation |
| **Context Graph federation** | **No** — separate HTTP Graph Delegate (Phase 2) | Neighbor hydration ≠ query search |
| **V_Link** | **Partial** — search finds linkable entities; linking is separate | Search delegate for picker only |
| **Activity** | **No** — separate ingest API | Write path |

Search Delegate is the **canonical discovery on-ramp** for partner entities entering the intelligence stack. It is not the only partner contract long-term.

---

## 15. Related documents

| Document | Scope |
|----------|-------|
| [SEARCH_DELEGATE_SECURITY_MODEL.md](./SEARCH_DELEGATE_SECURITY_MODEL.md) | JWT, threats, controls |
| [SEARCH_DELEGATE_RESULT_CONTRACT.md](./SEARCH_DELEGATE_RESULT_CONTRACT.md) | Field contract + normalization |
| [SEARCH_DELEGATE_REGISTRATION_MODEL.md](./SEARCH_DELEGATE_REGISTRATION_MODEL.md) | Manifest + cert + hybrid model |
| [SEARCH_DELEGATE_GCP_DEPLOYMENT_MODEL.md](./SEARCH_DELEGATE_GCP_DEPLOYMENT_MODEL.md) | Cloud Run deployment |
| [PARTNER_SEARCH_PILOT_RECOMMENDATION.md](./PARTNER_SEARCH_PILOT_RECOMMENDATION.md) | Pilot module selection |
| [SEARCH_DELEGATE_RUNTIME_FOUNDATION.md](./SEARCH_DELEGATE_RUNTIME_FOUNDATION.md) | Phase 1B-B implementation |
| [MARKETPLACE_PHASE_1B_B_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_B_CLOSEOUT.md) | Phase 1B-B acceptance |

---

**Last updated:** 2026-06-24 (Phase 1B-B implementation note)
