# PP-2 — Post-Foundation Review

**Program:** Account Platform — Post-Foundation Certification Readiness Reassessment  
**Date:** 2026-06-20  
**Type:** Governance review only — no implementation  
**Baseline:** [PP2_IMPLEMENTATION_REPORT.md](./PP2_IMPLEMENTATION_REPORT.md) · [PP2_PHASE1_ARCHITECTURE.md](./PP2_PHASE1_ARCHITECTURE.md)

---

## Scope

Reassess PP-2 Settings Platform after completion of:

- PP-1 Phase 1 (identity substrate)
- PP-2 Phase 1 (Settings Platform Foundation)
- PP-3 Packages 1–2 (tier resolver available for gated settings UI; billing tab IA still deferred)

---

## Foundation artifacts (verified)

| Service / artifact | Status |
|------------------|--------|
| `settingsService` | ✅ Single platform entry point |
| `preferenceRegistry` | ✅ Authoritative key contract |
| `settingsNavigationContract` | ✅ IA metadata |
| `settingsActivityService` | ✅ Module activity + domain events |
| Canonical `/api/settings` | ✅ Bulk, sections, preferences CRUD |
| `useUserSettings` contract fix | ✅ `/api/settings` |
| Theme persistence foundation | ✅ Partial — registry + write sync; load hydration deferred |
| Policy Engine (`settings:read`, `settings:update`) | ✅ |
| Tests | ✅ 14 passing |

**Explicitly not delivered (by design):** Hub consolidation, notification adapter, theme hydration on load, billing tab IA.

---

## Findings register (PP2-F01 through PP2-F09)

| ID | Severity | Finding | Status | Evidence / remaining gap |
|----|----------|---------|--------|--------------------------|
| **PP2-F01** | Blocking | No Settings Platform capability / `settingsService` | **Closed** | `settingsService.ts` |
| **PP2-F02** | Blocking | `/settings` API contract missing | **Closed** | `/api/settings` mounted; `useUserSettings` fixed |
| **PP2-F03** | Blocking | No preference key registry | **Closed** | `preferenceRegistry.ts` |
| **PP2-F04** | Major | 16 fragmented hubs — no canonical IA | **Open** | G9; Package 2 scope |
| **PP2-F05** | Major | Business settings triplication | **Open** | G5, G9; Package 2 scope |
| **PP2-F06** | Major | Triple notification write path | **Open** | G2, G3; Package 2 adapter |
| **PP2-F07** | Major | Theme localStorage only | **Partial** | Server KV + write sync; no load hydration |
| **PP2-F08** | Major | Privacy outside settings hub | **Open** | G9; nav contract only |
| **PP2-F09** | Major | Notification writes bypass preference service | **Open** | G2, G3; Package 2 adapter |

### Related advisories (F10–F13)

| ID | Status |
|----|--------|
| PP2-F10 | Open — Avatar duplicate "Settings" menu labels |
| PP2-F11 | Open — Profile settings preferences tab stale |
| PP2-F12 | Open — HR settings page 404 link |
| PP2-F13 | Open — Misleading business 2FA UI |

---

## G1–G9 readiness estimate

| Gate | Pre Phase 1 (0B-2) | Post foundation | Notes |
|------|-------------------|-----------------|-------|
| G1 Authorization | 1 | **3** | `settings:read` / `settings:update` on self |
| G2 Auditability | 1 | **3** | `settingsActivityService` + domain events |
| G3 Service boundaries | 1 | **3** | `settingsService` orchestrates; notification controllers still inline |
| G4 API coherence | 1 | **2** | Canonical `/api/settings`; ~22 families remain |
| G5 Ownership | 1 | **2** | Registry enforces keys; BA/NOTIF/AI families not converged |
| G6 Test evidence | 1 | **2** | 14 tests; not operation-matrix complete |
| G7 Documentation | 2 | **3** | Architecture, registry, API, events, reports |
| G8 Production safety | 2 | **2** | Functional; theme drift risk on new devices |
| G9 UX consistency | 1 | **1** | 16 hubs unchanged |
| **Total** | **~10/27 (~37%)** | **~21/27 (~78%)** | |

*Foundation closes constitutional substrate; IA/adapter work remains for L3 evaluation.*

---

## PP-2 readiness determination

| Dimension | Status |
|-----------|--------|
| Phase 1 foundation charter | ✅ Complete |
| Blocking findings (F01–F03) | ✅ All closed |
| Substrate for PP-3 billing tab IA | ⚠️ Partial — nav contract exists; hub not consolidated |
| L3 WITH FINDINGS candidate | **No** — F04–F09 majors open |
| Plain L3 candidate | **No** |
| Package 2 required before PP-3 client migration? | **No** — soft IA dependency only |

---

## Remaining PP-2 work (not authorized)

| Package 2 item | Priority | Findings closed |
|--------------|----------|-----------------|
| Notification preference adapter | High | F06, F09, PP1-F07 |
| Theme hydration on app load | Medium | F07 completion |
| Personal hub IA consolidation | High | F04, F08 |
| Business settings deduplication | Medium | F05 |

---

**Last updated:** 2026-06-20 (Post-Foundation Reassessment)
