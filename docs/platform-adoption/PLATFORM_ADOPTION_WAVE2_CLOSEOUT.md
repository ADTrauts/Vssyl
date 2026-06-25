# Platform Adoption — Wave 2 Closeout

**Program:** Platform Capability Adoption  
**Wave:** 2 — Platform Discoverability (Search Everywhere)  
**Date:** 2026-06-25  
**Status:** **Complete**

---

## 1. Wave objective

Make HR, Scheduling, Workforce Communications, and Notebook **first-class discoverable citizens** by adopting the existing Unified Search architecture — without redesigning Search, AI Retrieval, or Context Graph.

---

## 2. Deliverables

| Deliverable | Status |
|-------------|--------|
| `hrVisibilityService.searchAccessibleHrEntities` | ✅ |
| `schedulingVisibilityService.searchAccessibleScheduling` | ✅ |
| `workforceVisibilityService.searchAccessibleWorkforceComms` | ✅ |
| Notebook provider (`notebook` module id) | ✅ |
| Registry providers (hr, scheduling, workforce_comms, notebook) | ✅ |
| Manifest `capabilities.search` + entity flags | ✅ |
| Search suggestions for new modules | ✅ |
| Visibility + registry + cross-module tests | ✅ |
| AI Retrieval participation verified | ✅ |
| Context Graph via retrieval bridge (no new adapters) | ✅ |
| PLATFORM_DISCOVERABILITY.md | ✅ |
| SEARCH_PROVIDER_ADOPTION.md | ✅ |
| DISCOVERABILITY_PARITY_MATRIX.md | ✅ |
| Adoption matrix / scorecard / wave plan updates | ✅ |

---

## 3. Code changes summary

| Area | Change |
|------|--------|
| `hrVisibilityService.ts` | **New** — employees, time-off, onboarding search |
| `schedulingVisibilityService.ts` | **New** — schedules, shifts search |
| `workforceVisibilityService.ts` | **New** — published comms, campaigns search |
| `searchProviderRegistry.ts` | +4 providers; `MANIFEST_SEARCH_MODULE_IDS` expanded |
| `builtInModuleManifests.ts` | `search: true` + `supportsSearch` for Wave 2 modules |
| `searchCapabilityService.ts` | Suggestions for notebook, hr, scheduling, workforce_comms |

---

## 4. Acceptance criteria

| Criterion | Met |
|-----------|-----|
| HR participates in Unified Search | ✅ |
| Scheduling participates in Unified Search | ✅ |
| Workforce Comms participates in Unified Search | ✅ |
| Notebook participates where appropriate | ✅ |
| AI Retrieval auto-discovers new entities | ✅ |
| Context Graph consumes search evidence without new adapters | ✅ |
| Platform Controller reflects adoption (manifest parity) | ✅ |
| Tests pass | ✅ |
| Documentation updated | ✅ |

---

## 5. Adoption impact

| Metric | Before Wave 2 | After Wave 2 |
|--------|---------------|--------------|
| Built-in search providers (ready) | 9 | **13** |
| BO modules with search | 0 / 3 | **3 / 3** |
| Notebook global search | Partial (notes alias) | **Full** (`notebook` provider) |
| Unified Search Full rate (BO modules) | 0% | **100%** |
| Weighted portfolio adoption (est.) | 74 | **~79** |

---

## 6. Deferred to Wave 3+

| Item | Wave |
|------|------|
| AI retrieval search delegate for list-only modules | Wave 3 |
| HR/scheduling visibility-bounded AI context reads | Wave 3 |
| Platform Controller adoption health dashboard | Wave 5 |
| Analytics search provider | Future |

---

## 7. Next wave

**Wave 3 — Smarter AI Discovery:** Wire query-driven AI intents through the retrieval adapter so list providers are not the primary discovery path for "find …" questions.

See [PLATFORM_ADOPTION_WAVE_PLAN.md](./PLATFORM_ADOPTION_WAVE_PLAN.md).

**Last updated:** 2026-06-25
