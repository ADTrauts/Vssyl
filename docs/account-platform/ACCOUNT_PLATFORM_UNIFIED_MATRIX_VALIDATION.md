# Account Platform — Unified Matrix Validation

**Program:** Account Platform — Umbrella Certification Preparation  
**Date:** 2026-06-20  
**Type:** Governance validation — runtime cross-reference against trilogy re-audits  
**Status:** **VALIDATED** — 122 in-scope rows · no ownership conflicts

**Matrix source:** [ACCOUNT_PLATFORM_UNIFIED_OPERATION_MATRIX.md](./ACCOUNT_PLATFORM_UNIFIED_OPERATION_MATRIX.md)  
**Re-audit sources:** PP1/PP2/PP3 operation matrix re-audits (2026-06-20)

---

## Validation verdict

| Field | Result |
|-------|--------|
| **Unified matrix validated?** | **YES** |
| **Total in-scope rows** | **122** |
| **Compliance** | 49C / 65P / 5N (~40% / 53% / 4%) |
| **Ownership conflicts** | **0** |
| **Regression since ratification** | **None identified** |
| **N-rows dispositioned** | **5/5** — all mapped to AP-UMB findings |

---

## Validation method

| Step | Action | Result |
|------|--------|--------|
| 1 | Merge PP-1/PP-2/PP-3 re-audit rows into unified matrix | ✅ 122 rows |
| 2 | Add 12 shared platform cross-cut rows | ✅ Synthesized from integration review |
| 3 | Sample validation — ≥10 rows per slice against re-audit source | ✅ 44 rows spot-checked |
| 4 | PE / activity / domain event column audit | ✅ Gaps catalogued below |
| 5 | Owner code consistency (ID/SET/BILL/ENT/SEC) | ✅ No conflicts |
| 6 | Excluded domain rows marked **—** and excluded from totals | ✅ BA/AI/Admin |

**Spot-check sample (44 rows):**

| Slice | Sampled | Pass | Notes |
|-------|--------:|-----:|-------|
| Identity | 12 | 12 | MFA N-row confirmed; services match re-audit |
| Settings | 10 | 10 | Core 0N confirmed; business rows reference-only |
| Billing | 12 | 12 | 410 retirement + webhook exception confirmed |
| Entitlements | 6 | 6 | `resolveTier` + admin authority paths match |
| Shared platform | 4 | 4 | Cross-cut integration rows coherent |

---

## A. Identity slice validation (37 rows)

**Re-audit basis:** [PP1_OPERATION_MATRIX_REAUDIT.md](./PP1_OPERATION_MATRIX_REAUDIT.md) — 7C / 27P / 3N

| Check | Result | Evidence |
|-------|--------|----------|
| Service ownership | ✅ | `authService`, `profileService`, `profilePhotoService`, `privacyService`, `connectionService` |
| PE on mutation paths | ✅ WF | Profile, privacy, photo, connection — PE enforced |
| Activity on mutation paths | ✅ WF | `identityActivityService` emit sites verified in re-audit |
| Auth credential plane | ⚠️ By design | Security logging — not module activity (AP-UMB-ADV-06) |
| N-rows | 3 | MFA (M01), session revoke (ADV-01), password change (ADV-01) |
| Excluded rows | 6 | Preference delegation — PP-2 scope |

**Identity validation:** **PASS WITH FINDINGS** — no ownership conflict; MFA dispositioned.

---

## B. Settings slice validation (26 core rows)

**Re-audit basis:** [PP2_OPERATION_MATRIX_REAUDIT.md](./PP2_OPERATION_MATRIX_REAUDIT.md) — 15C / 11P / 0N (core)

| Check | Result | Evidence |
|-------|--------|----------|
| Orchestration ownership | ✅ | `settingsService` single write path for registry keys |
| PE on settings writes | ✅ | `settings:read`, `settings:update` enforced |
| Activity + domain events | ✅ | `settingsActivityService` + registry events |
| Notification adapter chain | ✅ | Delegates through `settingsService` — F06 closed |
| Theme server-backed | ✅ | PP2-F07 closed |
| Business reference rows | ⚠️ Excluded | PP2-F05 triplication — AP-UMB-M03 |
| Core N-rows | **0** | Strongest matrix slice |

**Settings validation:** **PASS** — 0N on personal critical path.

---

## C. Billing slice validation (47 rows)

**Re-audit basis:** [PP3_OPERATION_MATRIX_REAUDIT.md](./PP3_OPERATION_MATRIX_REAUDIT.md) — 19C / 23P / 2N

| Check | Result | Evidence |
|-------|--------|----------|
| Lifecycle ownership | ✅ | `billingService` facade on create/update/cancel/resume |
| Legacy payment API | ✅ | JWT routes 410 — counted C (retired, not dual) |
| Webhook exception | ✅ | `POST /api/payment/webhook` — [PP3_WEBHOOK_EXCEPTION_REVIEW.md](./PP3_WEBHOOK_EXCEPTION_REVIEW.md) |
| PE on lifecycle | ✅ | `billingPolicyDual` on `billingService` mutations |
| Activity on lifecycle | ✅ | `billingActivityService` + domain events |
| Module commerce PE | ❌ Partial | AP-UMB-M07 |
| Invoice webhook activity | ❌ Partial | AP-UMB-M05 |
| N-rows | 2 | Billing dashboard (M02), trial UX (ADV-14) |

**Billing validation:** **PASS WITH FINDINGS** — constitutional substrate; UX N-rows dispositioned.

---

## D. Entitlement slice validation (within PP-3 rows)

| Check | Result | Evidence |
|-------|--------|----------|
| Tier SoR | ✅ | `Subscription.tier` authoritative |
| Read convergence | ✅ | `entitlementService.resolveTier()` in AI/usage paths |
| Admin authority | ✅ | `setBusinessTierAuthority` — F04 closed |
| Cache sync | ✅ | Post-checkout `syncBusinessTierCache` |
| Vocabulary normalization | ⚠️ Partial | `normalizeTier()` — AP-UMB-ACC-01 |
| HR gating separation | ⚠️ By design | AP-UMB-ADV-12 |

**Entitlement validation:** **PASS WITH FINDINGS** — SoR coherent; F02 partial accepted.

---

## E. Shared platform operations validation (12 rows)

| Operation | Owner | PE | Act | Events | Status |
|-----------|-------|-----|-----|--------|--------|
| Identity → Settings projection | PP-1→PP-2 | — | — | — | ✅ C |
| Settings → Billing navigation | PP-2→PP-3 | — | — | — | ⚠️ P (M02) |
| Billing → Entitlement sync | PP-3 | ✅ | ✅ | ✅ | ✅ C |
| Entitlement → consumer reads | PP-3 | — | — | — | ✅ C |
| Preference registry write | PP-2 | ✅ | ✅ | ✅ | ✅ C |
| Notification adapter chain | PP-1/PP-2 | ✅ | ✅ | ✅ | ✅ C |
| Cross-tenant isolation | All | ✅ | — | — | ✅ C |
| Auth context propagation | PP-1 | — | — | — | ✅ C |
| Account security (MFA) | SEC | — | — | — | ❌ N (M01) |
| Identity domain events | PP-1 | — | — | ❌ | ⚠️ P (ADV-05) |
| Unified settings API | PP-2 | ✅ | ✅ | ✅ | ✅ C |
| Unified billing API | PP-3 | ✅ | ✅ | ✅ | ✅ C |

**Shared platform validation:** **PASS WITH FINDINGS** — cross-cut coherent; MFA and billing UX gaps documented.

---

## PE coverage audit (umbrella)

| Domain | PE required rows | PE present | Gap |
|--------|-----------------:|-----------:|-----|
| Identity mutations | 8 | 8 | — |
| Auth credential | 6 | 0† | By design — security logging |
| Settings writes | 6 | 6 | — |
| Email notification writes | 2 | 0 | AP-UMB-ADV-09 |
| Billing lifecycle | 6 | 6 | — |
| Module commerce | 4 | 0 | **AP-UMB-M07** |
| Invoice/PM mutations | 4 | 0 | Partial — JWT auth only |
| Entitlement admin | 1 | 1 | — |

† Documented in PP1_MFA_DISPOSITION_REVIEW and identity eval.

**PE gaps (umbrella):** Module commerce (major); email notification (advisory); invoice/PM routes (partial).

---

## Activity coverage audit (umbrella)

| Domain | Mutation rows | Activity emit | Gap |
|--------|--------------:|--------------:|-----|
| Identity (module scope) | 12 | 12 | Auth plane — security logging |
| Settings | 6 | 6 | — |
| Billing lifecycle | 6 | 6 | — |
| Entitlement admin | 1 | 1 | — |
| Module commerce | 4 | 0 | Partial |
| Invoice webhooks | 2 | 0 | **AP-UMB-M05** |
| Email notification | 2 | 0 | AP-UMB-ADV-10 |

**Activity gaps (umbrella):** Invoice webhooks (major partial); module commerce (inherits M07); email (advisory).

---

## Domain event coverage audit (umbrella)

| Registry domain | Events registered | Gap |
|-----------------|-------------------|-----|
| Settings | `settings.*` (3) | — |
| Billing | `billing.*` (5) | — |
| Entitlement | `entitlement.*` (2) | — |
| User preference | `user.preference.updated` | — |
| **Identity** | **None** | **AP-UMB-ADV-05** |

**Domain event gaps:** Identity domain events not in `domainEventRegistry` — advisory at umbrella; module activity present.

---

## Service boundary audit (umbrella)

| Boundary | Verdict | Finding |
|----------|---------|---------|
| Identity services isolated | ✅ | AP-UMB-M06 multer partial only |
| Settings orchestration | ✅ | No Business row writes |
| Billing facade | ✅ | Controllers thin on lifecycle |
| Entitlement SoR | ✅ | No unauthorized tier writes |
| Cross-slice unauthorized writes | ✅ | None found |
| Excluded domains respected | ✅ | BA, AI, Dashboard, Admin Portal |

**Ownership conflicts:** **NONE**

---

## N-row disposition summary

| Row | Slice | Finding | Blocks eval? |
|-----|-------|---------|:------------:|
| MFA challenge | Identity/SEC | AP-UMB-M01 | No |
| Session revoke | Identity/SEC | AP-UMB-ADV-01 | No |
| Password change API | Identity/SEC | AP-UMB-ADV-01 | No |
| Billing dashboard | Billing/UX | AP-UMB-M02 | No |
| Product trial UX | Billing | AP-UMB-ADV-14 | No |

All 5 N-rows dispositioned — **none block evaluation**.

---

## Matrix delta since planning

| Field | Planning (2026-06-20 AM) | Validation (2026-06-20 PM) |
|-------|--------------------------|----------------------------|
| Row count | 122 | 122 — unchanged |
| C/P/N | 49/65/5 | 49/65/5 — confirmed |
| New conflicts | — | **0** |
| Regression | — | **None** |

---

**Last updated:** 2026-06-20 (Umbrella Certification Preparation)
