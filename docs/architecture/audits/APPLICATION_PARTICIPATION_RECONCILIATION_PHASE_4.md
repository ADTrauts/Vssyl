# Application Participation Reconciliation — Phase 4

**Program:** Platform Participation Reconciliation  
**Phase:** 4 — Targeted reconciliation  
**Date:** 2026-09-08  
**Status:** Historical closeout — **not** architecture authority  
**Baseline:** `948bdb66520f7052fe33f5b4ffa21b35379533ea`

---

## 1. Scope

Surgical alignment with Phases 3A–3C contracts:

1. Remove independent frontend capability authoring  
2. Do **not** add `resolveModuleCapabilities()` without a runtime consumer  
3. Align Platform Entity Registry `supportsSearch` for confirmed searchable BO entities  

Out of scope: Dashboard, Analytics, realtime, PE, external connectors, partner SPA.

---

## 2. Baseline

HEAD / origin/main: `948bdb66520f7052fe33f5b4ffa21b35379533ea`  
Prior evidence: Phase 3C runtime verification audit.

---

## 3. Capability projection decision

**Chosen: removed** (Option 1).

**Why:** Exhaustive FE search reconfirmed no runtime/presentation consumer of `ModuleDefinition.capabilities` for core modules. Arrays were PRESENTATION_ONLY / unused and drifted from BE (including invented `admin`). Removing authoring eliminates duplicate truth without needing a derived sync path.

**Kept:** optional `capabilities?: ModuleCapability[]` on the type for a future derived projection if a real FE consumer appears. Core registry no longer authors values.

---

## 4. Capability resolver

**Needed:** NO  
**Implemented:** NO  

**Why:** No runtime path required resolving builder → DB → FE. Startup `reconcileBuiltInManifest` already projects to `Module.manifest`. Adoption/partner paths read builder or partner helpers. Adding `resolveModuleCapabilities()` would be a dead abstraction.

Remains an architectural utility target only.

---

## 5. Entity metadata corrections

| Module | Entity | Before | After |
|--------|--------|--------|-------|
| scheduling | schedule | `supportsSearch: false` | `true` |
| scheduling | shift | `supportsSearch: false` | `true` |
| scheduling | swap_request | `false` | `false` (unchanged; not searched) |
| hr | employee_profile | `false` | `true` |
| hr | time_off_request | `false` | `true` |
| hr | onboarding_journey | `false` | `true` |
| hr | attendance_exception | `false` | `false` (unchanged; not searched) |
| workforce_comms | communication | `false` | `true` |
| workforce_comms | campaign | `false` | `true` |

SearchProvider readiness remains the Unified Search runtime gate. **Runtime Search behavior unchanged.**

Analogous trash/V_Link/preview hygiene from Phase 3C: **left documented**, not expanded.

---

## 6. Tests

| Command | Result |
|---------|--------|
| `pnpm --filter vssyl-web exec vitest run src/runtime/__tests__/moduleRegistry.test.ts src/runtime/__tests__/moduleRegistry.workforce.test.ts` | **PASS** (13) |
| `pnpm --filter vssyl-server exec vitest run` platformEntityRegistry scheduling/hr/workforce + searchProviderRegistry + scheduling/hr manifests | **PASS** (16) |
| `pnpm --filter vssyl-web type-check` | **PASS** |
| `pnpm --filter vssyl-server type-check` | **PASS** |
| `pnpm security:secrets` | **PASS** |
| `pnpm verify:ci` | **SKIPPED** (narrow change; type-check + targeted tests sufficient) |

---

## 7. Remaining intentional/transitional gaps

- `resolveModuleCapabilities()` — no justified consumer  
- Scheduling realtime non-claim + hub usage — intentional  
- PE dual incomplete — transitional AuthZ migration  
- External-system reference adapter — future product  
- Partner SPA completeness — future product  
- Dashboard/Analytics — no change per Phase 3C  

---

**Last updated:** 2026-09-08
