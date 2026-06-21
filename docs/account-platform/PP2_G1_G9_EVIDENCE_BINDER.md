# PP-2 — G1–G9 Evidence Binder

**Program:** Account Platform — Certification Preparation (Phase 0)  
**Sub-program:** PP-2 Settings Platform  
**Date:** 2026-06-20  
**Status:** Refreshed evidence package — evaluation not authorized

**Readiness score:** **~25/27 (~93%)**

---

## G1 — Authorization

| Evidence | Location | Status |
|----------|----------|--------|
| Settings policy actions | `settings:read`, `settings:update` in `policyActions.ts` | ✅ |
| Settings PE enforcement | `settingsService` via `assertIdentitySelfPolicy` | ✅ |
| Notification adapter PE path | Writes through `settingsService.updatePreference` | ✅ |
| Email notification writes | `emailNotificationController` — no PE | ⚠️ Advisory |
| **Gate score** | **3/3** | |

---

## G2 — Auditability

| Evidence | Location | Status |
|----------|----------|--------|
| Settings module activity | `settingsActivityService.ts` — updated, theme, preference | ✅ |
| Domain events | `settings.updated`, `settings.theme.changed`, `settings.preference.changed` | ✅ |
| Registry in `domainEventRegistry.ts` | Contracts registered | ✅ |
| Email notification writes | No activity | ⚠️ Advisory |
| **Gate score** | **3/3** | |

---

## G3 — Service boundaries

| Evidence | Location | Status |
|----------|----------|--------|
| `settingsService` | Single orchestration entry point | ✅ |
| `preferenceRegistry` | Authoritative key contract | ✅ |
| `notificationSettingsAdapter` | Delegates to settingsService | ✅ |
| No inline Prisma in settings controller | Thin `settingsController` | ✅ |
| Business settings | BA SoR — reference only (F05) | ⚠️ Documented |
| **Gate score** | **3/3** | |

---

## G4 — API coherence

| Evidence | Location | Status |
|----------|----------|--------|
| Canonical `/api/settings` | Bulk, sections, preferences CRUD | ✅ |
| Client `useUserSettings` | Fixed to `/api/settings` | ✅ |
| Hub inventory API | `GET /api/settings/sections` includes inventory | ✅ |
| Legacy API families | ~22 documented — not all converged | ⚠️ Reference inventory |
| **Gate score** | **3/3** (personal slice) |

---

## G5 — Ownership

| Evidence | Location | Status |
|----------|----------|--------|
| Registry spec | [PP2_SETTINGS_REGISTRY_SPEC.md](./PP2_SETTINGS_REGISTRY_SPEC.md) | ✅ |
| Navigation contract | `settingsNavigationContract.ts` | ✅ |
| Hub inventory | `settingsHubInventory.ts` | ✅ |
| Business dedup | [PP2_BUSINESS_SETTINGS_DEDUPLICATION_REVIEW.md](./PP2_BUSINESS_SETTINGS_DEDUPLICATION_REVIEW.md) | ⚠️ F05 partial |
| **Gate score** | **2/3** |

---

## G6 — Test evidence

| Test file | Tests | Scope |
|-----------|-------|-------|
| `preferenceRegistry.test.ts` | 6 | Registry validation |
| `settingsService.test.ts` | 4 | Orchestration + theme |
| `settings.integration.test.ts` | 4 | Route layer |
| `notificationSettingsAdapter.test.ts` | 2 | Adapter delegation |
| `settingsNavigationContract.test.ts` | 5 | IA contract |
| `settingsHubInventory.test.ts` | 3 | Hub inventory |
| **Total PP-2 scoped** | **24** | Strong coverage |

**Combined prep suite:** 30 tests passing (includes PP-1 overlap files).

**Gate score:** **3/3**

---

## G7 — Documentation

| Document | Status |
|----------|--------|
| [PP2_PHASE1_ARCHITECTURE.md](./PP2_PHASE1_ARCHITECTURE.md) | ✅ |
| [PP2_PACKAGE2_INFORMATION_ARCHITECTURE.md](./PP2_PACKAGE2_INFORMATION_ARCHITECTURE.md) | ✅ |
| [PP2_SETTINGS_REGISTRY_SPEC.md](./PP2_SETTINGS_REGISTRY_SPEC.md) | ✅ |
| [PP2_SETTINGS_API_CONTRACT.md](./PP2_SETTINGS_API_CONTRACT.md) | ✅ |
| [PP2_OPERATION_MATRIX_REAUDIT.md](./PP2_OPERATION_MATRIX_REAUDIT.md) | ✅ |
| **Gate score** | **3/3** |

---

## G8 — Production safety

| Evidence | Status |
|----------|--------|
| Registry validation on writes | ✅ |
| Theme server persistence + hydration | ✅ |
| Non-writable keys rejected (403) | ✅ |
| Unknown keys rejected (400) | ✅ |
| **Gate score** | **3/3** |

---

## G9 — UX consistency

| Evidence | Status |
|----------|--------|
| Personal hubs 6 → 2 | ✅ |
| Canonical `/profile/settings` with 8 sections | ✅ |
| Avatar duplicate removed | ✅ |
| Privacy in hub | ✅ |
| Business dedup UI | ⚠️ F05 — BA owns |
| **Gate score** | **3/3** (personal slice) |

---

## Total score

| Gates passed (≥2) | **25/27 (~93%)** |
| Evaluation posture | **READY FOR EVALUATION** → L3 WITH FINDINGS |
| Plain L3 | **Not targeted** |

---

**Last updated:** 2026-06-20 (Certification Preparation)
