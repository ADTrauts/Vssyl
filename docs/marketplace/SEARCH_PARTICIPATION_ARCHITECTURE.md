# Search Participation — Architecture

**Program:** Marketplace & Module Ecosystem — Phase 1A  
**Date:** 2026-06-23  
**Status:** Architecture recommendation — **no implementation**  
**Authority:** [SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md](../search/SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md) (M-01–M-05), [SEARCH_CONSTITUTION.md](../search/SEARCH_CONSTITUTION.md)

---

## 1. Participation readiness

| Metric | Value |
|--------|-------|
| **Readiness level** | **2 — Architecturally Ready** |
| **Partner can register today?** | **No** |
| **First-party providers** | 9 (ready) |
| **Marketplace providers** | 0 |

---

## 2. Current state

### Runtime

| Component | Path | Behavior |
|-----------|------|----------|
| Orchestrator | `searchCapabilityService.executeGlobalSearch` | Fan-out to registered providers |
| Registry | `searchProviderRegistry.ts` | **Static** `RegisteredSearchProvider[]` |
| PE gate | `searchPolicyDual.ts` | `search:read` before fan-out |
| API | `POST /api/search` | Auth JWT + orchestrator |
| Types | `shared/types/search.ts` | `SearchProvider`, `RegisteredSearchProvider`, `SearchResult` |

First-party providers implement `search()` via in-process visibility services (`searchAccessibleDrive*`, `searchAccessibleTasks`, etc.).

### Marketplace

| Requirement | Status |
|-------------|--------|
| M-01 Compatible `SearchProvider` shape | Documented |
| M-02 Manifest loader at runtime | **Not implemented** |
| M-03 Visibility in partner boundary | Documented |
| M-04 Certification search section | Partial (structural) |
| M-05 HTTP delegate for iframe/bundle modules | Documented |

Until M-02 ships, marketplace modules are **Search Planned** — must **not** claim `capabilities.search: true`.

---

## 3. Blockers

| ID | Blocker | Type |
|----|---------|------|
| **SP-B01** | No dynamic provider registry loaded from marketplace | Architecture |
| **SP-B02** | R-01 requires compile-time registry entry | Compliance |
| **SP-B03** | No platform→partner search delegate contract | Contract |
| **SP-B04** | No auth token forwarding standard for delegate calls | Security |
| **SP-B05** | Certification does not validate delegate URL reachability | Governance |
| **SP-B06** | `assertManifestSearchProviderParity` only covers built-ins | Test gap |

---

## 4. Recommended model: HTTP Search Delegate

### 4.1 Architecture

```
User query
    → POST /api/search
    → evaluateSearchPolicyDual (search:read)
    → resolveProviders(static + dynamic)
    → for each provider:
         if in-process: visibility service (existing)
         if partner:   HTTP POST to manifest.searchDelegate.url
    → merge + rank SearchResult[]
```

### 4.2 Manifest extension (proposed)

```json
{
  "capabilities": { "search": true },
  "searchDelegate": {
    "url": "https://partner.example.com/vssyl/search",
    "version": "1",
    "entityTypes": ["inventory_item", "warehouse"],
    "supportedContexts": ["personal", "business"],
    "timeoutMs": 3000,
    "maxResults": 10
  }
}
```

Loaded from **current published** `ModuleVersion.manifestSnapshot` at `ModuleRegistrySyncService.syncModule`.

### 4.3 Delegate request (platform → partner)

```typescript
interface PartnerSearchRequest {
  query: string;
  userId: string;
  context: {
    dashboardId?: string;
    businessId?: string;
    householdId?: string;
  };
  filters?: SearchFilters;
  moduleId: string;
}
```

**Auth:** Platform-signed JWT (same pattern as AI context providers) — `Authorization: Bearer <platform_jwt>` with claims: `sub`, `dashboardId`, `businessId`, `moduleId`, `aud: vssyl-search-delegate`.

### 4.4 Delegate response

Must return `SearchResult[]` conforming to `shared/types/search.ts`:

- `moduleId`, `moduleName`, `url` (deep link — personal or business workspace)
- `permissions: [{ type: 'read', granted: true }]` only for authorized hits
- `relevanceScore` optional (platform may re-rank)
- **Must not** return hits for entities user cannot read

### 4.5 Platform-side provider wrapper

Dynamic providers implement same `RegisteredSearchProvider` interface:

```typescript
{
  providerId: moduleId,
  moduleId,
  moduleName: manifest.name,
  readiness: 'ready',
  searchMethod: 'http_delegate',
  requiredPermission: 'search:read', // platform PE already enforced
  search: async (query, userId, filters) => proxyToPartnerDelegate(...)
}
```

Platform PE runs **before** delegate call. Partner enforces entity-level read on their SoR.

---

## 5. Required architectural changes

| # | Change | Effort | Phase |
|---|--------|--------|-------|
| 1 | `PartnerSearchDelegateRegistry` loaded at module sync | M | 1B |
| 2 | `proxyPartnerSearch()` with JWT, timeout, circuit breaker | M | 1B |
| 3 | Merge static + dynamic in `resolveProvidersForFilters` | S | 1B |
| 4 | Extend `moduleCertificationValidator` — searchDelegate required when `capabilities.search` | S | 1B |
| 5 | Admin Test Lab: search delegate probe | S | 1B |
| 6 | Deep link contract for business workspace embed | M | 1B–1C |
| 7 | Operation matrix row + CI contract tests | S | 1C |

**No changes to:** `POST /api/search` contract, PE model, first-party providers.

---

## 6. Certification requirements

Partner search participation requires **R-01–R-11** (adapted) + **M-01–M-05**:

| # | Requirement | Verification |
|---|-------------|--------------|
| **PS-01** | Declare `capabilities.search: true` + `searchDelegate` | Manifest + validator |
| **PS-02** | HTTPS delegate URL only | Validator |
| **PS-03** | `entityTypes` match manifest `entities[].supportsSearch` | Parity check |
| **PS-04** | Return normalized `SearchResult[]` | Contract test |
| **PS-05** | Tenant context honored from request | Integration test |
| **PS-06** | Deny cross-tenant hits (security test) | Platform QA + partner attestation |
| **PS-07** | Deep links resolve in workspace embed | Manual / E2E |
| **PS-08** | Timeout ≤ 3s; graceful empty on failure | Platform wrapper |
| **PS-09** | Trashed/deleted excluded | Partner delegate contract |
| **PS-10** | Pass admin search probe in Test Lab | Admin portal |

**Non-compliance:** Block `capabilities.search` claim; module remains Search Planned.

---

## 7. Security boundaries

| Threat | Control |
|--------|---------|
| **Malicious result injection** | Platform only calls APPROVED module delegates; JWT binds user+tenant |
| **Cross-tenant leakage** | JWT carries scoped ids; partner must enforce; platform samples in QA |
| **SSRF via delegate URL** | Delegate URL fixed at publish time; not user-controlled |
| **Delegate impersonation** | TLS + pinned moduleId in JWT aud |
| **Result flooding** | `maxResults` cap per provider |
| **Slowloris / DoS** | Timeout + circuit breaker; provider failure logged, omitted from merge |
| **PE bypass** | `search:read` evaluated on platform before any delegate call |

**Platform must not** pass partner delegate responses without normalizing to `SearchResult` and stripping unknown fields.

---

## 8. Downstream effects (why search first)

| Consumer | Effect when M-02 ships |
|----------|-------------------------|
| **Global search bar** | Partner hits appear in merged results |
| **AI Retrieval `discover()`** | `mapSearchResultsToEvidence` includes partner modules |
| **Context Graph retrieval bridge** | Inference nodes from partner evidence (provenance `inference`) |
| **Deep links** | Partner URLs in workspace embed |

---

## 9. Recommendation summary

| Question | Answer |
|----------|--------|
| Can partners register search providers today? | **No** |
| Architectural changes required? | **Yes** — dynamic registry + HTTP delegate proxy |
| Rebuild search? | **No** — extend orchestrator |
| Registration model | **Hybrid** — manifest declares; platform wraps as `RegisteredSearchProvider` |
| Target readiness | **Level 3** after Phase 1B implementation |

---

**Last updated:** 2026-06-23
