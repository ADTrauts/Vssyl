# PP-1 — Status Review (Foundation Checkpoint)

**Program:** Account Platform — PP-1 / PP-3 Foundation Checkpoint  
**Date:** 2026-06-20  
**Status:** Governance review only — no implementation

**Baseline:** [PP1_PHASE1_ARCHITECTURE.md](./PP1_PHASE1_ARCHITECTURE.md) · Phase 0B-1 audit findings

---

## Phase 1 completion posture

PP-1 **Phase 1 (Identity Foundation)** is **complete** per implementation charter exit criteria:

| Deliverable | Status |
|-------------|--------|
| `authService` | ✅ Implemented |
| `profileService` | ✅ Implemented |
| `profilePhotoService` | ✅ Implemented |
| `privacyService` | ✅ Implemented |
| `connectionService` | ✅ Implemented |
| `identityActivityService` | ✅ Implemented |
| `userPreferenceService` expansion | ✅ Implemented (validation, PE, domain events, prefix helpers) |
| Auth/profile routes extracted from `index.ts` | ✅ |
| Policy Engine on identity writes | ✅ |
| Normalized activity on profile/privacy/photo/connection | ✅ |
| Tests (unit + partial integration) | ✅ Partial — not full matrix coverage |

**Scope note:** Phase 1 delivered **beyond** the original modernization-sequence Phase 1 scope (which listed privacy/connections as PP-1 remainder). Council-authorized implementation consolidated these into Phase 1.

---

## Findings register (post Phase 1)

### Closed (major)

| ID | Finding | Closure evidence |
|----|---------|------------------|
| **PP1-F01** | No `profileService` | `server/src/services/account/profileService.ts`; routes delegate |
| **PP1-F02** | Auth routes inline in `index.ts` | `routes/auth.ts` + `authController.ts`; mount at `/api/auth` |
| **PP1-F05** | Connection mutations without PE | `connectionService` + `connection:*` policy actions |
| **PP1-F06** | Privacy updates without PE/activity | `privacyService` + PE + `identityActivityService` |

### Partially closed (major)

| ID | Finding | Remaining gap |
|----|---------|---------------|
| **PP1-F04** | Photo logic in controller only | `profilePhotoService` exists; `profilePhotoController` still owns multer/storage wiring (acceptable transitional) |

### Open (major)

| ID | Finding | PP-2 blocker? |
|----|---------|---------------|
| **PP1-F03** | MFA not implemented | **No** — deferred by charter; security UX not Settings substrate |

### Open (advisory)

| ID | Finding | Notes |
|----|---------|-------|
| PP1-F07 | Notification pref fragmentation | **PP-2 scope** — unified write adapter |
| PP1-F08 | No session management UX | Post-PP-2 / security wave |
| PP1-F09 | Legacy photo URL dual fields | Low risk |
| PP1-F10 | Misleading 2FA UI (business) | UX hygiene — not PP-2 gate |
| PP1-F11 | No Global Trash handler for photos | PP-1 remainder |
| PP1-F12 | `useUserSettings` `/settings` drift | **PP-2 primary deliverable** |

---

## Remaining blockers (PP-1 → PP-2)

| Blocker | Status |
|---------|--------|
| Service extraction before PP-2 | **None** — hard substrate delivered |
| `profileService` for settings hub | **Met** |
| `privacyService` for settings hub | **Met** |
| `userPreferenceService` + PE/events | **Met** (registry **completion** is PP-2 work) |
| Full PP-1 L3 certification | **Not required** to start PP-2 |

**Conclusion:** No PP-1 **hard** blockers remain for PP-2 authorization.

---

## Remaining majors (PP-1 program)

| Count | Items |
|-------|-------|
| **1 open major** | PP1-F03 (MFA) |
| **1 partial major** | PP1-F04 (photo controller thinning) |

These are **PP-1 remainder / 1B cleanup** candidates — not sequencing blockers for PP-2 per [ACCOUNT_PLATFORM_DEPENDENCY_MODEL.md](./ACCOUNT_PLATFORM_DEPENDENCY_MODEL.md).

---

## PP-2 dependencies still unmet by PP-1

| PP-2 hard dependency | PP-1 status |
|----------------------|-------------|
| `profileService` | ✅ Met |
| `privacyService` | ✅ Met |
| Preference registry **substrate** (`userPreferenceService`) | ✅ Met |
| Domain events on preference writes | ✅ Met |
| Full preference **registry catalog** | ❌ **PP-2 implements** — not a PP-1 exit criterion |
| `/api/settings` bulk API | ❌ **PP-2 implements** |
| `settingsService` | ❌ **PP-2 implements** |

---

## G1–G9 estimate (post Phase 1)

| Gate | Pre Phase 1 | Post Phase 1 | Notes |
|------|------------|--------------|-------|
| G1 Authorization | 1 | **3** | PE on profile, privacy, photo, connection, preference |
| G2 Auditability | 1 | **3** | Activity + preference domain events |
| G3 Service boundaries | 1 | **3** | Account services extracted |
| G4 API coherence | 2 | **2** | Namespaces still fragmented; `/settings` absent |
| G5 Ownership | 1 | **3** | PP-1 ownership model + runtime alignment |
| G6 Test evidence | 1 | **2** | Unit + partial integration; not matrix-complete |
| G7 Documentation | 2 | **3** | Phase 1 architecture + checkpoint docs |
| G8 Production safety | 2 | **2** | MFA still missing |
| G9 UX consistency | 2 | **2** | Privacy path split; settings hub fragmented |
| **Total** | **~12/27 (~44%)** | **~21/27 (~78%)** | **L3 WITH FINDINGS candidate** post matrix re-audit |

*Estimate for governance planning — not evaluator-certified.*

---

## Recommended PP-1 remainder (optional parallel)

| Item | Priority | Blocks PP-2? |
|------|----------|--------------|
| Thin `profilePhotoController` (multer only) | Medium | No |
| Extract connection read/list from `memberController` | Low | No |
| MFA implementation | High (security) | No |
| Photo Global Trash handler | Medium | No |
| Full auth route integration test suite | Medium | No |
| Operation matrix re-audit | High (pre-cert) | No |

---

**Last updated:** 2026-06-20 (Foundation Checkpoint)
