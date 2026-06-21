# PP-2 — Certification Evaluation

**Program:** Account Platform — PP-2 Settings Platform Certification Evaluation  
**Date:** 2026-06-20  
**Framework:** Platform Certification (G1–G9) — Account Platform sub-program  
**Council authorization:** [ACCOUNT_PLATFORM_EVALUATION_COUNCIL_DECISION.md](./ACCOUNT_PLATFORM_EVALUATION_COUNCIL_DECISION.md)  
**Baseline:** PP-2 Phase 1 + Package 2 complete; prep score ~93%

**Constraint:** Evaluation only — **no certification awarded** in this document; **no** ledger update; **no** council ratification.

---

## Evaluation outcome

| Decision | Result |
|----------|--------|
| **Certification status (recommended)** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Framework** | Account Platform G1–G9 (personal settings slice + orchestration layer) |
| **Blocking findings at evaluation** | **0** |
| **Evaluator confidence** | **High** — repository evidence confirms prep binder and re-audit assertions |
| **Final G1–G9 score** | **26/27 (~96%)** — see [PP2_CERTIFICATION_SCORECARD.md](./PP2_CERTIFICATION_SCORECARD.md) |

---

## 1. Scope

This evaluation assesses whether PP-2 Settings Platform qualifies for **Level 3 WITH FINDINGS** certification under the Account Platform trilogy charter.

**In scope (evaluated):**

- Personal settings orchestration (`settingsService`, `preferenceRegistry`)
- Canonical `/api/settings` API and client convergence
- Notification preference adapter alignment
- Theme hydration and appearance persistence
- Settings hub IA consolidation (Package 2)
- Policy Engine on settings writes
- Module activity + domain events for orchestrated writes

**Reference-only (documented, not blocking):**

- Business workspace settings triplication (BA SoR — PP2-F05)
- Module-specific settings surfaces (HR, Scheduling, etc.)
- Legacy API families (~22) not yet converged to `/api/settings`
- Email notification preference direct-Prisma path

**Out of scope:**

- PP-3 billing client migration
- PP-1 identity certification (separate eval)
- Umbrella composite certification

---

## 2. Gate evaluation

### G1 Authorization — **PASS**

| Evidence | Status |
|----------|--------|
| `settings:read`, `settings:update` in `policyActions.ts` | Verified |
| `settingsService` — `assertIdentitySelfPolicy` on read/update | Verified |
| `notificationSettingsAdapter` — writes via `settingsService.updatePreference` | Verified |
| Non-writable registry keys rejected (403) via `isWritableViaSettingsApi` | Verified |
| Privacy keys read-only projection — no settings write to Identity SoR | Verified |

**Advisory residual:** `emailNotificationController` writes without PE — outside personal settings critical path; documented PP2-EVAL-A01.

**Finding impact:** PP2-F01–F03, F06, F09 closed at evaluation.

---

### G2 Auditability — **PASS**

| Evidence | Status |
|----------|--------|
| `settingsActivityService.ts` — `settings.updated`, `theme.changed`, `preference.changed` | Verified |
| Domain events — `settings.updated`, `settings.theme.changed`, `settings.preference.changed` | Verified in `domainEventRegistry.ts` |
| Dual emit pattern (module activity + domain event) | Verified |
| Notification adapter path emits via `settingsService` activity chain | Verified |

**Advisory residual:** Email notification writes do not emit settings activity — PP2-EVAL-A02.

**Finding impact:** PP2-F06, F09 closed.

---

### G3 Service Boundaries — **PASS**

| Evidence | Status |
|----------|--------|
| `settingsService.ts` — single orchestration entry point | Verified |
| `preferenceRegistry.ts` — authoritative key contract | Verified |
| `notificationSettingsAdapter.ts` — delegates to settingsService | Verified |
| `settingsController.ts` — thin; no inline Prisma | Verified (116 LOC, service delegation only) |
| Business rows — Settings does not write `Business` entity | Verified per ownership model |

**Advisory residual:** Business dedup is IA reference scope (F05) — not a service boundary violation in personal slice.

**Finding impact:** PP2-F01–F03 closed.

---

### G4 API Coherence — **PASS**

| Evidence | Status |
|----------|--------|
| Canonical `/api/settings` — bulk GET/PUT, sections, preference CRUD | Verified |
| `GET /api/settings/sections` — hub inventory + navigation metadata | Verified |
| Client `useUserSettings` → `/api/settings` | Verified (Package 2) |
| Legacy `/api/user/preferences/:key` — registry-key delegation | Verified transitional |
| [PP2_SETTINGS_API_CONTRACT.md](./PP2_SETTINGS_API_CONTRACT.md) | Published |

**Advisory residual:** ~22 legacy API families documented in hub inventory — not converged; reference inventory only — PP2-EVAL-A03.

**Finding impact:** PP2-F02 closed.

---

### G5 Ownership — **PASS WITH FINDINGS**

| Evidence | Status |
|----------|--------|
| [PP2_SETTINGS_OWNERSHIP_MODEL.md](./PP2_SETTINGS_OWNERSHIP_MODEL.md) | Complete |
| Settings vs Identity — privacy read projection; Identity owns SoR | Verified |
| Settings vs Notifications — adapter orchestration; delivery owned by NOTIF | Verified |
| Settings vs AI — cross-link only; AI owns autonomy keys | Verified |
| Settings vs Billing — billing links in nav; PP-3 owns entitlements SoR | Verified |
| Settings vs Business — BA owns business rows; Settings indexes IA only | Verified |

**WITH FINDINGS residual:** PP2-F05 — business settings triplication documented; UI dedup deferred to BA. No ownership conflict; reference-scope finding only.

**Gate score:** 2/3 — acceptable for L3 WITH FINDINGS.

---

### G6 Test Evidence — **PASS**

| Test file | Tests | Status |
|-----------|-------|--------|
| `preferenceRegistry.test.ts` | 6 | ✅ Pass (eval run) |
| `settingsService.test.ts` | 4 | ✅ Pass |
| `settings.integration.test.ts` | 4 | ✅ Pass |
| `notificationSettingsAdapter.test.ts` | 2 | ✅ Pass |
| `settingsNavigationContract.test.ts` | 5 | ✅ Pass |
| `settingsHubInventory.test.ts` | 3 | ✅ Pass |
| **PP-2 core total** | **24** | ✅ All passing |

**Evaluator run (2026-06-20):** 24 core tests + 5 incidental matches in filter = 29 passed across 8 files.

**Coverage assessment:** Strong for orchestration, registry, adapter, nav contract, hub inventory, and route layer. No integration gap blocking certification.

---

### G7 Documentation — **PASS**

| Document | Status |
|----------|--------|
| [PP2_PHASE1_ARCHITECTURE.md](./PP2_PHASE1_ARCHITECTURE.md) | Complete |
| [PP2_PACKAGE2_INFORMATION_ARCHITECTURE.md](./PP2_PACKAGE2_INFORMATION_ARCHITECTURE.md) | Complete |
| [PP2_SETTINGS_REGISTRY_SPEC.md](./PP2_SETTINGS_REGISTRY_SPEC.md) | Complete |
| [PP2_SETTINGS_API_CONTRACT.md](./PP2_SETTINGS_API_CONTRACT.md) | Complete |
| [PP2_OPERATION_MATRIX_REAUDIT.md](./PP2_OPERATION_MATRIX_REAUDIT.md) | Complete |
| [PP2_PACKAGE2_IMPLEMENTATION_REPORT.md](./PP2_PACKAGE2_IMPLEMENTATION_REPORT.md) | Complete |
| [PP2_BUSINESS_SETTINGS_DEDUPLICATION_REVIEW.md](./PP2_BUSINESS_SETTINGS_DEDUPLICATION_REVIEW.md) | Complete |

Documentation set exceeds minimum bar for L3 evaluation.

---

### G8 Production Safety — **PASS**

| Evidence | Status |
|----------|--------|
| Registry validation on all writes (`validateRegistryValue`) | Verified |
| Unknown keys → 400; non-writable keys → 403 | Verified |
| Theme server persistence + client hydration (`settingsTheme.ts`, ThemeProvider) | Verified |
| Backward compatibility — legacy preference API delegates for registry keys | Verified |
| Bulk update partial failure handling via service errors | Verified |

No migration-safety blockers identified for personal settings slice.

---

### G9 UX Consistency — **PASS WITH FINDINGS**

| Evidence | Status |
|----------|--------|
| Personal hubs consolidated 6 → 2 | Verified |
| Canonical `/profile/settings` — 8 in-hub sections | Verified |
| Privacy tab in hub (`?tab=privacy`) | Verified — F08 closed |
| Theme hydration cross-session | Verified — F07 closed |
| Notification settings aligned via adapter | Verified — F06/F09 closed |
| Avatar duplicate settings entry removed | Verified — F11 closed |

**WITH FINDINGS residual:** Business workspace settings triplication (F05) and misleading 2FA UI (F13) — BA-owned; outside personal slice eval scope but recorded.

---

## 3. Operation matrix confirmation

Post-evaluation matrix posture (core PP-2 rows): **15C / 11P / 0N** — unchanged from re-audit. Evaluator confirms **0 non-compliant rows** in personal settings critical path.

---

## 4. Certification recommendation

| Recommendation | Rationale |
|----------------|-----------|
| **LEVEL 3 CERTIFIED WITH FINDINGS** | All G gates pass or pass-with-findings; 0 blockers; strongest Account Platform sub-domain |
| **Not plain L3** | PP2-F05 partial blocks plain L3 |
| **Not NOT CERTIFIABLE** | No regressions; evidence integrity confirmed |

**Expected WITH FINDINGS at ratification:** PP2-F05 (business dedup), PP2-EVAL-A01 (email PE), PP2-EVAL-A02 (email activity), PP2-EVAL-A03 (legacy API inventory), PP2-F12 (HR 404), PP2-F13 (business 2FA UI).

---

## 5. Explicit non-actions

| Action | Status |
|--------|--------|
| Certification awarded | ❌ Recommendation only |
| Ledger update | ❌ Not performed |
| Council ratification | ❌ Separate gate |
| Runtime changes | ❌ Not authorized |

---

**Last updated:** 2026-06-20 (Certification Evaluation)
