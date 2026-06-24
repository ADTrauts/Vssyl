# Marketplace & Module Ecosystem — Phase 1B-A Executive Summary

**Program:** Marketplace & Module Ecosystem  
**Phase:** 1B-A — Search Delegate Architecture & Partner Pilot  
**Date:** 2026-06-23  
**Status:** Architecture complete — **runtime implemented in Phase 1B-B** ([MARKETPLACE_PHASE_1B_B_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_B_CLOSEOUT.md))

**Prior phases:** [MARKETPLACE_PHASE_0A_EXECUTIVE_SUMMARY.md](./MARKETPLACE_PHASE_0A_EXECUTIVE_SUMMARY.md), [MARKETPLACE_PHASE_1A_EXECUTIVE_SUMMARY.md](./MARKETPLACE_PHASE_1A_EXECUTIVE_SUMMARY.md)

---

## 1. Bottom line

Phase 1B-A defines **M-02 HTTP Search Delegate** as the secure on-ramp for partner modules to join the **Vssyl intelligence stack** at the discovery layer — without redesigning Unified Search, AI Retrieval, or Context Graph.

Partners expose a **HTTPS POST endpoint**. The platform issues a **short-lived Search Delegate JWT**, normalizes responses to `SearchResult[]`, and merges into existing orchestration. **AI Retrieval** and **Context Graph inference** inherit participation automatically via `mapSearchResultsToEvidence` — no changes to those systems in this phase.

**Search participation readiness:** **Level 3 — Pilot Ready** (Phase 1B-B complete).

---

## 2. Architecture recommendation

### Flow

```
Partner Module → HTTP Search Delegate → searchCapabilityService → Unified Search
                                                      ↓ (unchanged)
                                              AI Retrieval evidence
                                                      ↓ (unchanged, flag-gated)
                                              Context Graph inference
```

### Key design decisions (locked for implementation)

| Decision | Choice |
|----------|--------|
| HTTP method | POST JSON |
| Contract version | v1 |
| Auth | Platform-signed JWT, 60s TTL, `aud: vssyl:search-delegate:v1` |
| Platform PE | `search:read` before delegate call |
| Failure mode | Empty results for failed partner; global search continues |
| Timeout | 2500 ms default, 3000 ms hard cap |
| Result contract | Normalized to `SearchResult` — see result contract doc |
| Registry | In-memory dynamic registry + static first-party |
| Feature flag | `PARTNER_SEARCH_DELEGATE_ENABLED` + pilot allowlist |

**Do not rebuild:** `searchCapabilityService`, `POST /api/search`, first-party providers.

---

## 3. Security recommendation

| Control | Purpose |
|---------|---------|
| PE `search:read` gate | Prevent policy bypass |
| Fixed HTTPS delegate URL at publish | Prevent SSRF |
| Short-lived JWT with distinct `aud` | Prevent token reuse |
| Response normalization + schema validation | Prevent injection |
| moduleId pinning on results | Prevent impersonation |
| Install gate (recommended) | Entitlement alignment |
| Admin Test Lab probe | Pre-approval validation |
| Circuit breaker + timeout | DoS resilience |

**Adequate for curated Asset Management pilot. Not open-ecosystem ready without continuous monitoring.**

Full model: [SEARCH_DELEGATE_SECURITY_MODEL.md](./SEARCH_DELEGATE_SECURITY_MODEL.md)

---

## 4. Registration recommendation

**Hybrid (Option D):**

| Layer | Mechanism |
|-------|-----------|
| **Declaration** | Manifest `capabilities.search` + `searchDelegate` |
| **Activation** | Certification validator + admin approve + `ModuleRegistrySyncService` |
| **First-party** | Static registry unchanged |

Only **current PUBLISHED** version with scan PASSED and certification pass/warn registers a delegate.

Full model: [SEARCH_DELEGATE_REGISTRATION_MODEL.md](./SEARCH_DELEGATE_REGISTRATION_MODEL.md)

---

## 5. Result contract recommendation

Partner returns `PartnerSearchResultItem[]`; platform normalizes to strict `SearchResult` per `shared/types/search.ts`.

**Critical fields:** `id`, `title`, `type`, `url`, `permissions[read.granted=true]`

**Downstream compatibility:** Existing `mapSearchResultToEvidence` and Context Graph bridge eligibility rules apply without modification.

Full contract: [SEARCH_DELEGATE_RESULT_CONTRACT.md](./SEARCH_DELEGATE_RESULT_CONTRACT.md)

---

## 6. Pilot recommendation

| Item | Choice |
|------|--------|
| **Vertical** | **Asset Management** |
| **moduleId** | `vssyl-pilot-assets` |
| **Scope** | Business-only, read-only, entity type `asset` |
| **Pricing** | Free (avoids business billing blocker) |
| **Hosting** | Internal sandbox partner service first → design partner for cert sign-off |

**Defer:** CRM, Property, Healthcare, Manufacturing for pilot.

Full plan: [PARTNER_SEARCH_PILOT_RECOMMENDATION.md](./PARTNER_SEARCH_PILOT_RECOMMENDATION.md)

---

## 7. GCP deployment

Search delegate proxy runs **inside existing `vssyl-server` Cloud Run** — no new services, databases, or GCS buckets.

Partner delegate typically runs on **partner Cloud Run** (external to Vssyl project).

Full model: [SEARCH_DELEGATE_GCP_DEPLOYMENT_MODEL.md](./SEARCH_DELEGATE_GCP_DEPLOYMENT_MODEL.md)

---

## 8. Platform impact assessment

| System | Modified? | How partner participates |
|--------|-----------|--------------------------|
| **Unified Search** | Yes — registry merge + proxy | Direct |
| **AI Retrieval** | **No** | Inherits via `executeGlobalSearch` |
| **Context Graph inference** | **No** (1B-A) | Inherits via evidence mapper |
| **V_Link** | **No** | Future: search finds entities for picker |
| **Activity** | **No** | Separate future API |
| **Marketplace certification** | Yes — validator + Test Lab | Gate before publish |
| **ModuleRegistrySyncService** | Yes — sync hook | Load/unload delegates |

---

## 9. Strategic answer

**Should Search Delegate become the standard entry point for partner intelligence integrations?**

**Yes — for read-path discovery.**

| Future integration | Via Search Delegate? |
|--------------------|---------------------|
| AI Retrieval discovery | **Yes** — primary path |
| Context Graph inference | **Yes** — read inference only |
| Context Graph SoR federation | **No** — separate Graph Delegate (Phase 2) |
| V_Link create/link | **No** — separate V_Link proxy |
| Activity publish | **No** — separate ingest API |

Search Delegate is the **canonical discovery on-ramp**, not the only partner contract.

---

## 10. Search participation readiness

| Level | Definition | Status |
|-------|------------|--------|
| 0 | Unsupported | — |
| 1 | First Party Only | ✅ Before 1B-A |
| 2 | Architecture Defined | ✅ **After 1B-A** |
| 3 | Pilot Ready | ❌ Implementation |
| 4 | Certified Partner Capability | ❌ Post-pilot |

**Blockers to Level 3:** Registry, proxy, normalizer, sync hook, validator, Test Lab, feature flag.

---

## 11. Implementation roadmap (recommended — not authorized)

### Sprint 1 — Core proxy (2 weeks)

- [ ] `PartnerSearchDelegateRegistration` types in `shared/`
- [ ] `partnerSearchDelegateRegistry.ts`
- [ ] `searchDelegateJwtService.ts`
- [ ] `partnerSearchDelegateProxy.ts`
- [ ] `partnerSearchResultNormalizer.ts`
- [ ] `buildPartnerSearchProvider.ts`
- [ ] Merge in `getReadySearchProviders()`
- [ ] Feature flag + module allowlist
- [ ] Unit tests: normalizer, JWT, proxy mock

### Sprint 2 — Registration & cert (2 weeks)

- [ ] Extend `moduleCertificationValidator` for `searchDelegate`
- [ ] Extend `ModuleRegistrySyncService.syncModule`
- [ ] Admin Test Lab search probe UI
- [ ] `docs/test-modules/partner-search-delegate-v1.json` fixture
- [ ] Extend `searchProviderRegistry` parity tests

### Sprint 3 — Sandbox pilot (2 weeks)

- [ ] Internal sandbox partner Cloud Run service (simulated assets)
- [ ] Submit + approve `vssyl-pilot-assets` module
- [ ] Enable flag in staging
- [ ] Execute test plan T1–T8
- [ ] Verify retrieval evidence in dev (`discover()`)

### Sprint 4 — Certification & production (2 weeks)

- [ ] Design partner or promote sandbox to certified pilot
- [ ] Operation matrix row in `UNIFIED_SEARCH_OPERATION_MATRIX.md`
- [ ] Cloud Monitoring dashboards
- [ ] Production allowlist enable
- [ ] Phase 1B-A closeout doc

**Total estimate:** 6–8 weeks after authorization.

---

## 12. Certification requirements (rollup)

| ID | Requirement | Phase |
|----|-------------|-------|
| PS-01 | `capabilities.search` + `searchDelegate` | Sprint 2 |
| PS-02 | HTTPS URL only | Sprint 2 |
| PS-03 | entityTypes parity | Sprint 2 |
| PS-04 | Normalized SearchResult | Sprint 1 |
| PS-05 | Tenant context honored | Sprint 3 QA |
| PS-06 | Cross-tenant deny | Sprint 3 QA |
| PS-07 | Deep links resolve | Sprint 3 |
| PS-08 | Timeout / graceful fail | Sprint 1 |
| PS-09 | Trashed excluded | Partner contract |
| PS-10 | Test Lab probe pass | Sprint 2 |

Plus M-01–M-05 from [SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md](../search/SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md).

---

## 13. Explicit non-goals (Phase 1B-A / implementation sprint)

- ❌ AI Retrieval code changes
- ❌ Context Graph adapter implementation
- ❌ V_Link partner proxy
- ❌ Activity ingest API
- ❌ Marketplace UI redesign
- ❌ BusinessModuleSubscription fix (parallel track)
- ❌ Workspace embed (parallel track — deep links use `/modules/run` for pilot)
- ❌ npm SDK

---

## 14. Document index

| Document | Scope |
|----------|-------|
| [SEARCH_DELEGATE_ARCHITECTURE.md](./SEARCH_DELEGATE_ARCHITECTURE.md) | Complete system design |
| [SEARCH_DELEGATE_SECURITY_MODEL.md](./SEARCH_DELEGATE_SECURITY_MODEL.md) | JWT, threats, controls |
| [SEARCH_DELEGATE_RESULT_CONTRACT.md](./SEARCH_DELEGATE_RESULT_CONTRACT.md) | Field contract + normalization |
| [SEARCH_DELEGATE_REGISTRATION_MODEL.md](./SEARCH_DELEGATE_REGISTRATION_MODEL.md) | Hybrid registration |
| [SEARCH_DELEGATE_GCP_DEPLOYMENT_MODEL.md](./SEARCH_DELEGATE_GCP_DEPLOYMENT_MODEL.md) | Cloud Run deployment |
| [PARTNER_SEARCH_PILOT_RECOMMENDATION.md](./PARTNER_SEARCH_PILOT_RECOMMENDATION.md) | Asset Management pilot |

---

## 15. Decision requested

Approve Phase 1B-A architecture and authorize **implementation Sprint 1–2** (core proxy + registration/cert), OR request revision before coding.

---

**Last updated:** 2026-06-23
