# Account Platform — Shared Findings Review

**Program:** Account Platform — Umbrella Progress Review  
**Date:** 2026-06-20  
**Type:** Aggregated findings disposition — umbrella lens  
**Outcome:** **0 umbrella blockers · 7 umbrella majors · ~18 advisories**

**Sources:**

- [PP1_FINDINGS_REVIEW.md](./PP1_FINDINGS_REVIEW.md)
- [PP2_FINDINGS_REVIEW.md](./PP2_FINDINGS_REVIEW.md)
- [PP3_FINDINGS_REVIEW.md](./PP3_FINDINGS_REVIEW.md)

---

## Aggregation summary

| Class | PP-1 open | PP-2 open | PP-3 open | **Umbrella unique** | **Total umbrella** |
|-------|----------:|----------:|----------:|--------------------:|-------------------:|
| **Blocking** | 0 | 0 | 0 | 0 | **0** |
| **Major** | 2 | 1 partial | 3 WF | 0 deduped | **7** |
| **Advisory** | ~7 | ~5 | ~7 | 0 deduped | **~18** |
| **Closed** | ~6 | ~11 | ~6 | — | **~23 confirmed** |

**Dedup note:** PP1-F10 (business 2FA UI) and PP2-F13 (misleading business 2FA) overlap — counted once as **AP-UMB-ADV-02** at umbrella level.

---

## Umbrella blockers — **NONE**

No finding blocks umbrella **evaluation planning** or **L3 WITH FINDINGS** certification at composite level.

| Sub-program blockers at eval | Status |
|------------------------------|--------|
| PP1-F01, F02, F05, F06 | Closed |
| PP2-F01, F02, F03 | Closed |
| PP3-F01, F03 | Closed |

**Umbrella evaluation blockers:** **0** (after planning prep complete).

---

## Umbrella majors (cross-cutting register)

| Umbrella ID | Source | Description | Cross-cut | Blocks umbrella L3 WF? | Blocks plain L3? |
|-------------|--------|-------------|-----------|-------------------------|------------------|
| **AP-UMB-M01** | PP1-F03 | MFA not implemented | Security | No — dispositioned | **Yes** |
| **AP-UMB-M02** | PP3-F08 | Modal-only billing UX | Settings ↔ Billing | No | **Yes** |
| **AP-UMB-M03** | PP2-F05 | Business settings triplication | Settings ↔ BA | No — BA-owned | **Yes** |
| **AP-UMB-M04** | PP3-F02 | Tier enum vocabulary drift | Entitlement | No — waived partial | **Yes** |
| **AP-UMB-M05** | PP3-F05 | Invoice webhook activity gap | Billing audit | No | Partial |
| **AP-UMB-M06** | PP1-F04 | Photo multer in controller | Identity boundary | No | **Yes** |
| **AP-UMB-M07** | PP3-EVAL-F01 | Module commerce PE gap | Billing authZ | No | Partial |

### Major detail — AP-UMB-M01 (MFA)

| Field | Value |
|-------|-------|
| **Source** | PP1-F03 |
| **Disposition** | [PP1_MFA_DISPOSITION_REVIEW.md](./PP1_MFA_DISPOSITION_REVIEW.md) |
| **Umbrella impact** | Cross-cutting security gap; compensating controls (Admin Portal) |
| **Certificate treatment** | WITH FINDINGS on PP-1; rolls up to umbrella |
| **Remediation** | PP-1 Phase 1B MFA charter |

### Major detail — AP-UMB-M02 (Billing UX)

| Field | Value |
|-------|-------|
| **Source** | PP3-F08 |
| **Umbrella impact** | Primary composite G9 weakness; settings→billing IA incomplete |
| **Certificate treatment** | WITH FINDINGS |
| **Remediation** | Optional PP-3 UX charter or umbrella UX pass |

### Major detail — AP-UMB-M03 (Business dedup)

| Field | Value |
|-------|-------|
| **Source** | PP2-F05 |
| **Owner** | Business Administration |
| **Umbrella impact** | Cross-domain settings surface duplication |
| **Certificate treatment** | WITH FINDINGS — BA-owned |
| **Remediation** | BA charter |

---

## Umbrella advisories (aggregated)

| Umbrella ID | Source(s) | Description | Owner |
|-------------|-----------|-------------|-------|
| AP-UMB-ADV-01 | PP1-F08 | Session revoke / password change UX | PP-1 |
| AP-UMB-ADV-02 | PP1-F10, PP2-F13 | Misleading business 2FA UI | BA |
| AP-UMB-ADV-03 | PP1-F09 | Legacy photo URL fields on User | Identity |
| AP-UMB-ADV-04 | PP1-F11 | Global Trash for profile photos | Identity |
| AP-UMB-ADV-05 | PP1-EVAL-A01 | No identity domain events in registry | Identity |
| AP-UMB-ADV-06 | PP1-EVAL-A02 | Auth security logging vs module activity | By design |
| AP-UMB-ADV-07 | PP1-EVAL-A03 | Member read inline Prisma | Read layer |
| AP-UMB-ADV-08 | PP2-F12 | HR settings 404 link | HR |
| AP-UMB-ADV-09 | PP2-EVAL-A01 | Email notification PE gap | Notifications |
| AP-UMB-ADV-10 | PP2-EVAL-A02 | Email notification activity gap | Notifications |
| AP-UMB-ADV-11 | PP2-EVAL-A03 | Legacy API inventory (~22 families) | Settings backlog |
| AP-UMB-ADV-12 | PP3-F07 | HR gating matrix separation | By design |
| AP-UMB-ADV-13 | PP3-F09 | Orphan `featureGatingService.simplified.ts` | Billing hygiene |
| AP-UMB-ADV-14 | PP3-F10 | No product trial UX | Product |
| AP-UMB-ADV-15 | PP3-F11 | `standard` vs `pro` vocabulary | F02 overlap |
| AP-UMB-ADV-16 | PP3-F13 | AI query balance boundary docs | Billing + AI |
| AP-UMB-ADV-17 | PP3-EVAL-F02 | Checkout E2E test gap | Test hygiene |
| AP-UMB-ADV-18 | PP3-F14 | Global Trash exception for billing records | Documented |

**G6/G9 gate hygiene:** PP-1 test depth, PP-3 G9 sub-score — tracked as advisory themes, not separate IDs.

---

## Sub-program findings — closed at umbrella (confirmed)

| ID | Sub-program | Description | Umbrella confirmation |
|----|-------------|-------------|----------------------|
| PP1-F01 | PP-1 | No profileService | ✅ Closed |
| PP1-F02 | PP-1 | Auth inline index.ts | ✅ Closed |
| PP1-F05 | PP-1 | Connection PE | ✅ Closed |
| PP1-F06 | PP-1 | Privacy PE/activity | ✅ Closed |
| PP1-F07 | PP-1 | Notification drift | ✅ Closed (PP-2) |
| PP1-F12 | PP-1 | Settings hub duplicate | ✅ Closed (PP-2) |
| PP2-F01–F04 | PP-2 | Settings platform foundation | ✅ Closed |
| PP2-F06–F11 | PP-2 | Notification, theme, privacy, bypass | ✅ Closed |
| PP3-F01 | PP-3 | Entitlement service | ✅ Closed |
| PP3-F03 | PP-3 | Dual API drift | ✅ Closed |
| PP3-F04 | PP-3 | Admin authority path | ✅ Closed |
| PP3-F06 | PP-3 | billingService | ✅ Closed |
| PP3-F12 | PP-3 | payment.ts wrapper | ✅ Closed |

**No reopen** at umbrella progress review.

---

## Findings blocker matrix — umbrella lens

| Finding | Blocks eval planning? | Blocks umbrella eval? | Blocks umbrella L3 WF? | Blocks plain L3? |
|---------|----------------------|----------------------|------------------------|------------------|
| AP-UMB-M01 (MFA) | No | No | No | **Yes** |
| AP-UMB-M02 (billing UX) | No | No | No | **Yes** |
| AP-UMB-M03 (business dedup) | No | No | No | **Yes** |
| AP-UMB-M04 (tier vocab) | No | No | No | **Yes** |
| AP-UMB-M05 (invoice activity) | No | No | No | Partial |
| AP-UMB-M06 (photo controller) | No | No | No | **Yes** |
| AP-UMB-M07 (module PE) | No | No | No | Partial |
| All advisories | No | No | No | No |

---

## Certificate treatment — umbrella recommendation

| Class | Treatment at umbrella cert |
|-------|---------------------------|
| **Majors (7)** | **Tracked WITH FINDINGS** on composite certificate |
| **Advisories (~18)** | **Track-only** — no individual waivers |
| **Waivers** | AP-UMB-M04 (tier vocab) — boundary `normalizeTier()` accepted |
| **Exceptions** | AP-UMB-ADV-18 (F14 billing trash) — documented |
| **Deferrals** | AP-UMB-M02 remediation — optional UX charter, not waived |

**Projected open findings on umbrella certificate:** **~25 tracked** (7 majors + ~18 advisories, with 1 dedup).

---

## Promotion path to plain L3 (umbrella)

| Must close | Finding |
|------------|---------|
| Security | AP-UMB-M01 (MFA) |
| UX | AP-UMB-M02 (billing dashboard) |
| Ownership | AP-UMB-M03 (business dedup), AP-UMB-M04 (tier migration) |
| Boundary | AP-UMB-M06 (photo controller) |
| Audit | AP-UMB-M05, AP-UMB-M07 |
| Gates | G9≥2 at umbrella composite; G6 integration depth |

**Plain L3 not in horizon** — consistent with trilogy ratification posture and certification planning charter.

---

**Last updated:** 2026-06-20 (Umbrella Progress Review)
