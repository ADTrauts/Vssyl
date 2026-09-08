# Application Participation Contract — Phase 3B

**Program:** Platform Participation Reconciliation  
**Phase:** 3B — Semantic Contract Extension  
**Date:** 2026-09-08  
**Status:** Historical evidence / closeout — **not** architecture authority  
**Baseline commit:** `84e3eacfb2209b52ae068dea4296996146222299`

> Prefer canonical owners in [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](../ARCHITECTURE_SOURCE_OF_TRUTH.md). This audit records what Phase 3B decided and deferred.

---

## 1. Scope

Architecture **contract semantics** only for:

1. Capability authority, vocabulary, claim, projection, resolution  
2. Entity metadata consistency (esp. Search)  
3. Realtime architecture ownership and participation  
4. External-system interoperability (minimal conceptual contract)  
5. Authorization vs visibility vs presentation / role-aware boundary  

**Out of scope:** product code, schemas, manifests, FE capability arrays, connectors, OAuth, realtime services, PE rollout, role-aware UX design.

---

## 2. Baseline

| Item | Value |
|------|-------|
| HEAD / origin/main at start | `84e3eacfb2209b52ae068dea4296996146222299` |
| Prior phase | 3A — composition reference + SoT reconciliation |
| Composition doc | [`APPLICATION_PARTICIPATION_COMPOSITION.md`](../APPLICATION_PARTICIPATION_COMPOSITION.md) |

---

## 3. Decisions applied

| # | Decision | Applied as |
|---|----------|------------|
| 1 | One capability authority (manifest); projections derive | Platform Standards §19.1–19.4 |
| 2 | Realtime layers distinct; claim ≠ hub usage | [`REALTIME.md`](../REALTIME.md); Scheduling non-claim preserved |
| 3 | Dashboard remains bespoke projections | Unchanged widget contract; no DashboardProvider |
| 4 | Minimal external-system interop contract | [`EXTERNAL_SYSTEM_INTEROPERABILITY.md`](../EXTERNAL_SYSTEM_INTEROPERABILITY.md) |
| 5 | Partner completeness = core + claimed capabilities | Restated in Platform Standards §19.1 |

No Participation Engine / Context Fabric / Data 360 / Semantic Engine created.

---

## 4. Canonical owners after Phase 3B

| Concern | Owner after 3B |
|---------|----------------|
| Capability model | `VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` §19 |
| Entity metadata consistency | `PLATFORM_ENTITY_MODEL.md` (+ SearchProvider model for inclusion) |
| Realtime semantics | **`REALTIME.md`** (TBD removed) |
| External-system interoperability | **`EXTERNAL_SYSTEM_INTEROPERABILITY.md`** |
| Authorization vs presentation | `POLICY_ENGINE.md` |
| Composition / navigation | `APPLICATION_PARTICIPATION_COMPOSITION.md` (unchanged ownership role) |

---

## 5. Capability semantics

- Canonical source: backend/shared Module/Application manifest  
- Persisted `Module.manifest`: runtime projection  
- FE arrays: presentation projection; must not redefine truth  
- Vocabulary from `BuiltInManifestCapabilities`  
- Claim = contract conformance  
- Resolution: transitional documented direction; `resolveModuleCapabilities()` not implemented  

---

## 6. Entity metadata semantics

- Search **runtime gate** = ready SearchProvider  
- `supportsSearch` = descriptive intent metadata  
- Consistency table documented; Scheduling registry drift **not** fixed  

Analogous descriptive consistency for trash / V_Link fields noted without new flags.

---

## 7. Realtime semantics

- Architecture owner: `REALTIME.md`  
- Current transport implementation: Chat / `chatSocketService`  
- Claim = certified adapter participation  
- Scheduling = transport usage without claim (unchanged)  

---

## 8. External-system interoperability semantics

- Owner: `EXTERNAL_SYSTEM_INTEROPERABILITY.md`  
- External SoR preserved; connect-before-replace  
- Read/action, provenance, failure, disconnect, tenant isolation, capability opt-in  
- Partner module ≠ external system  
- **Implementation added: NONE**  

---

## 9. Authorization vs presentation boundary

- AuthZ = PE / server  
- Visibility = domain read filtering  
- Presentation = UI/workspace gating  
- Role-aware experience acknowledged as broader than permissions; UX design deferred  

---

## 10. Remaining implementation drift

| Drift | Notes |
|-------|-------|
| FE vs BE capability arrays | Representation debt until sync/derive/remove |
| `resolveModuleCapabilities()` | Documented target only |
| Scheduling `supportsSearch` registry `false` vs ready provider | Metadata drift |
| Scheduling no `realtime` claim while hub traffic may exist | Intentional |
| Domain-local external adapters | Not yet aligned to new interop contract (no rewrite required yet) |
| PE partial rollout | Unchanged |

---

## 11. Runtime verification required

Suggested Phase 3C checks (no code changes in 3B):

1. RV — Capability: sample built-in manifests vs FE registry drift inventory  
2. RV — Search: Scheduling SearchProvider readiness vs registry `supportsSearch`  
3. RV — Realtime: File Hub / Chat claim + adapter paths; Scheduling non-claim + hub usage  
4. RV — AuthZ: confirm BCC / module visibility never used as server AuthZ on a sample mutation  
5. RV — Interop: inventory any domain-local external integrations against new contract (documentation only)  
6. RV — Dashboard: confirm no DashboardProvider registry introduced  

---

## 12. Phase 3C readiness

**READY** — remaining work is small, concrete, and verifiable (implementation targets + runtime verification). Architecture semantics for the five Phase 3B areas are defined under existing or newly assigned owners without a new participation subsystem.

---

**Last updated:** 2026-09-08
