# PP-2 — Foundation Status

**Program:** Account Platform — Foundation Checkpoint (post PP-1 / PP-2 / PP-3 Package 1)  
**Date:** 2026-06-20  
**Status:** Governance review only — no implementation

**Baseline:** [PP2_IMPLEMENTATION_REPORT.md](./PP2_IMPLEMENTATION_REPORT.md) · [PP2_PHASE1_ARCHITECTURE.md](./PP2_PHASE1_ARCHITECTURE.md)

---

## Foundation completion

PP-2 **Phase 1 (Settings Platform Foundation)** is **complete** per charter exit criteria.

| Artifact | Status |
|----------|--------|
| `settingsService` | ✅ Single platform entry point |
| `preferenceRegistry` | ✅ Authoritative key contract |
| `settingsNavigationContract` | ✅ IA metadata |
| `settingsActivityService` | ✅ Module activity + domain events |
| Canonical `/api/settings` | ✅ Bulk, sections, preferences CRUD |
| `useUserSettings` contract fix | ✅ `/api/settings` |
| Theme persistence foundation | ✅ Partial — registry + write path; hydration deferred |
| Policy Engine (`settings:read`, `settings:update`) | ✅ |
| Tests | ✅ 14 passing (registry, service, integration) |

**Explicitly not delivered (by design):** Hub consolidation, notification adapter, theme hydration on load, billing tab IA, certification.

---

## Findings register

### Closed (blocking)

| ID | Finding | Evidence |
|----|---------|----------|
| **PP2-F01** | No Settings Platform capability / `settingsService` | `settingsService.ts` |
| **PP2-F02** | `/settings` API contract missing | `/api/settings` mounted; `useUserSettings` fixed |
| **PP2-F03** | No preference key registry | `preferenceRegistry.ts` |

### Partially closed (major)

| ID | Finding | Remaining gap |
|----|---------|---------------|
| **PP2-F07** | Theme localStorage only | Server KV path + write sync; no load hydration |
| Ownership fragmentation | No runtime enforcement across 22 API families | Registry + nav contract document alignment only |

### Open (major — Package 2 scope)

| ID | Finding | Gate impact |
|----|---------|-------------|
| **PP2-F04** | 16 fragmented hubs — no canonical IA | G9 |
| **PP2-F05** | Business settings triplication | G5, G9 |
| **PP2-F06** | Triple notification write path | G2, G3 |
| **PP2-F08** | Privacy outside settings hub | G9 |
| **PP2-F09** | Notification writes bypass preference service | G2, G3 |

### Open (advisory)

| ID | Finding |
|----|---------|
| PP2-F10 | Avatar duplicate "Settings" menu labels |
| PP2-F11 | Profile settings preferences tab stale |
| PP2-F12 | HR settings page 404 link |
| PP2-F13 | Misleading business 2FA UI |

---

## G1–G9 readiness estimate

| Gate | Pre Phase 1 (0B-2) | Post Phase 1 | Notes |
|------|-------------------|--------------|-------|
| G1 Authorization | 1 | **3** | `settings:read` / `settings:update` on self |
| G2 Auditability | 1 | **3** | `settingsActivityService` + domain events |
| G3 Service boundaries | 1 | **3** | `settingsService` orchestrates; notification controllers still inline |
| G4 API coherence | 1 | **2** | Canonical `/api/settings`; ~22 families remain |
| G5 Ownership | 1 | **2** | Registry enforces keys; BA/NOTIF/AI families not converged |
| G6 Test evidence | 1 | **2** | 14 tests; not operation-matrix complete |
| G7 Documentation | 2 | **3** | Architecture, registry, API, events, report |
| G8 Production safety | 2 | **2** | Functional; theme drift risk on new devices |
| G9 UX consistency | 1 | **1** | 16 hubs unchanged |
| **Total** | **~10/27 (~37%)** | **~21/27 (~78%)** | Blocking findings closed; majors block full cert |

*Foundation closes constitutional substrate; IA/adapter work remains for L3 evaluation.*

---

## PP-2 readiness determination

| Dimension | Status |
|-----------|--------|
| **Foundation charter** | ✅ Complete |
| **Blocking findings (F01–F03)** | ✅ Closed |
| **Substrate for PP-3 billing tab IA** | ⚠️ Partial — nav contract exists; hub not consolidated |
| **L3 certification** | ❌ Not ready — F04–F09 majors open |
| **Package 2 required before PP-3 Package 2?** | **No** — backend billing work does not require hub consolidation |

---

## Remaining PP-2 work (not authorized)

| Package 2 item | Priority | Blocks PP-3 P2? |
|--------------|----------|-----------------|
| Notification preference adapter | High | No |
| Theme hydration on app load | Medium | No |
| Personal hub IA consolidation | High | No (soft IA for billing tab) |
| Business settings deduplication | Medium | No |

---

**Last updated:** 2026-06-20 (Foundation Reassessment)
