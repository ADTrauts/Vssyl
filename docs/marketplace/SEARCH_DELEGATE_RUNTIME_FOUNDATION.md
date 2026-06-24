# Search Delegate — Runtime Foundation

**Program:** Marketplace & Module Ecosystem — Phase 1B-B  
**Date:** 2026-06-24  
**Status:** **Implemented** (sandbox pilot; feature-flagged)  
**Authority:** [SEARCH_DELEGATE_ARCHITECTURE.md](./SEARCH_DELEGATE_ARCHITECTURE.md), [SEARCH_CONSTITUTION.md](../search/SEARCH_CONSTITUTION.md)

---

## 1. Purpose

Phase 1B-B implements the first **safe partner Search Delegate runtime path**: certified/sandbox modules can participate in Unified Search through the M-02 HTTP delegate architecture without changing `POST /api/search`, first-party providers, AI Retrieval, or Context Graph code.

---

## 2. Participation readiness

| Metric | Value |
|--------|-------|
| **Level** | **3 — Pilot Ready** |
| **Production rollout** | Not authorized (feature flag + allowlist) |
| **Pilot module** | `vssyl-pilot-assets` (internal sandbox delegate) |

---

## 3. Runtime components

| Component | Path | Role |
|-----------|------|------|
| Shared types | `shared/src/types/search-delegate.ts` | Contract, JWT audience, pilot constants |
| Manifest parser | `server/src/marketplace/searchDelegateManifest.ts` | Validate `searchDelegate` block |
| Feature flags | `server/src/marketplace/searchDelegateConfig.ts` | `PARTNER_SEARCH_DELEGATE_ENABLED`, allowlist |
| Registry | `server/src/marketplace/searchDelegateRegistry.ts` | In-memory delegate index |
| JWT issuer | `server/src/marketplace/searchDelegateJwt.ts` | 60s platform JWT, `aud: vssyl:search-delegate:v1` |
| Proxy | `server/src/marketplace/searchDelegateProxy.ts` | POST JSON v1, timeout, fail-open, circuit breaker |
| Normalizer | `server/src/marketplace/searchDelegateNormalizer.ts` | Strict `SearchResult[]` mapping |
| Provider builder | `server/src/marketplace/buildPartnerSearchProvider.ts` | `partner_http_delegate` provider |
| DB sync | `server/src/marketplace/syncPartnerSearchDelegates.ts` | Startup + per-module sync |
| Admin probe | `server/src/marketplace/searchDelegateProbe.ts` | Certification / sandbox validation |

---

## 4. Integration points

### Unified Search

`searchProviderRegistry.getReadySearchProviders()` and `getSearchProviderById()` merge enabled partner delegates from the registry alongside static first-party providers. Orchestration remains in `searchCapabilityService.executeGlobalSearch()`.

### Module lifecycle

- **Startup:** `syncAllPartnerSearchDelegatesFromDatabase()` in `server/src/index.ts`
- **Per-module:** `ModuleRegistrySyncService.syncModule()` calls `syncPartnerSearchDelegateForModuleId()` in a non-blocking `finally` block
- **Certification:** `moduleCertificationValidator` requires valid `searchDelegate` when `capabilities.search` is declared

### Policy Engine

Partner delegate search runs only after `evaluateSearchPolicyDual` passes in `executeGlobalSearch`. Delegate JWT is issued server-side; browser never calls partner endpoints directly.

---

## 5. Feature flags

| Variable | Default | Purpose |
|----------|---------|---------|
| `PARTNER_SEARCH_DELEGATE_ENABLED` | `false` | Master switch for partner delegate fan-out |
| `PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST` | `vssyl-pilot-assets` | Comma-separated pilot module IDs |

When disabled or not allowlisted, delegates remain registered for admin probe but return empty results at search time (fail-closed for exposure, fail-open for global search).

---

## 6. Failure modes

| Condition | Behavior |
|-----------|----------|
| Delegate HTTP error / timeout | Empty results for that provider; global search continues |
| Invalid partner response | Dropped items + structured diagnostics |
| Circuit open (5 failures / 60s) | Skip delegate until window resets |
| Wrong tenant context | No results (partner responsible; sandbox enforces `businessId`) |
| Unapproved / invalid manifest | Not registered |

---

## 7. Tests

`server/src/marketplace/__tests__/` — manifest, JWT, registry, normalizer, proxy, unified search integration (19 tests).

---

## 8. Related documents

| Document | Scope |
|----------|-------|
| [SEARCH_DELEGATE_SANDBOX_PILOT.md](./SEARCH_DELEGATE_SANDBOX_PILOT.md) | `vssyl-pilot-assets` pilot |
| [MARKETPLACE_PHASE_1B_B_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_B_CLOSEOUT.md) | Phase acceptance |
| [SEARCH_DELEGATE_SECURITY_MODEL.md](./SEARCH_DELEGATE_SECURITY_MODEL.md) | JWT and threat controls |

---

**Last updated:** 2026-06-24
