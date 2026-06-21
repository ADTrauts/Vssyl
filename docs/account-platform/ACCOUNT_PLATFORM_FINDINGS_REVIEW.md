# Account Platform — Findings Review (Certification Evaluation)

**Program:** Account Platform — Umbrella Certification Evaluation  
**Date:** 2026-06-20  
**Type:** Evaluator findings disposition — **no certification awarded**

---

## Summary

| Category | Count at evaluation |
|----------|---------------------|
| **Blocking (open)** | **0** |
| **Major (open/partial)** | **7** — AP-UMB-M01–M07 |
| **Advisory (open)** | **19** — ADV-01–18 + EVAL-F01 |
| **Accepted WITH FINDINGS** | **2** — ACC-01, ACC-02 |
| **Closed (frozen)** | **~23** — sub-domain — no reopen |
| **New eval findings** | **1** — AP-UMB-EVAL-F01 |

---

## AP-UMB major findings — disposition

| ID | Source | Description | Evaluator verdict | Blocks award? |
|----|--------|-------------|-------------------|:-------------:|
| **AP-UMB-M01** | PP1-F03 | MFA not implemented | ⚠️ **Open WITH FINDINGS** — disposition accepted | No |
| **AP-UMB-M02** | PP3-F08 | Modal-only billing UX | ⚠️ **Open WITH FINDINGS** | No |
| **AP-UMB-M03** | PP2-F05 | Business settings triplication | ⚠️ **Open WITH FINDINGS** — BA-owned | No |
| **AP-UMB-M04** | PP3-F02 | Tier enum vocabulary drift | ⚠️ **Partial** — ACC-01 waiver accepted | No |
| **AP-UMB-M05** | PP3-F05 | Invoice webhook activity gap | ⚠️ **Partial WITH FINDINGS** | No |
| **AP-UMB-M06** | PP1-F04 | Photo multer in controller | ⚠️ **Partial WITH FINDINGS** | No |
| **AP-UMB-M07** | PP3-EVAL-F01 | Module commerce PE gap | ⚠️ **Open WITH FINDINGS** | No |

*All majors block plain L3 only — not L3 WITH FINDINGS.*

---

## AP-UMB advisory findings — disposition

| ID | Description | Evaluator verdict |
|----|-------------|-------------------|
| AP-UMB-ADV-01 | Session revoke / password UX | Open — track-only |
| AP-UMB-ADV-02 | Misleading business 2FA UI | Open — track-only (deduped) |
| AP-UMB-ADV-03 | Legacy photo URL fields | Open — track-only |
| AP-UMB-ADV-04 | Global Trash profile photos | Open — track-only |
| AP-UMB-ADV-05 | No identity domain events | Open — track-only |
| AP-UMB-ADV-06 | Auth security logging vs activity | Open — by design |
| AP-UMB-ADV-07 | Member read inline Prisma | Open — track-only |
| AP-UMB-ADV-08 | HR settings 404 | Open — track-only |
| AP-UMB-ADV-09 | Email notification PE gap | Open — track-only |
| AP-UMB-ADV-10 | Email notification activity gap | Open — track-only |
| AP-UMB-ADV-11 | Legacy API inventory | Open — track-only |
| AP-UMB-ADV-12 | HR gating matrix separation | Open — by design |
| AP-UMB-ADV-13 | Orphan gating file | Open — track-only |
| AP-UMB-ADV-14 | No product trial UX | Open — track-only |
| AP-UMB-ADV-15 | `standard` vs `pro` vocabulary | Open — track-only |
| AP-UMB-ADV-16 | AI query balance boundary docs | Open — track-only |
| AP-UMB-ADV-17 | Checkout E2E test gap | Open — track-only |
| AP-UMB-ADV-18 | Billing Global Trash exception | Accepted exception |

---

## Accepted WITH FINDINGS

| ID | Description | Evaluator acceptance |
|----|-------------|---------------------|
| **AP-UMB-ACC-01** | Tier vocabulary — `normalizeTier()` boundary | ✅ Accepted pending migration |
| **AP-UMB-ACC-02** | Billing records Global Trash exception | ✅ Documented product exception |

---

## New evaluation findings

| ID | Severity | Finding | Gate | Remediation |
|----|----------|---------|------|-------------|
| **AP-UMB-EVAL-F01** | Advisory | No umbrella cross-slice integration test (identity→settings→billing flow) | G6 | Post-cert: optional integration test charter |

Within ≤3 new finding limit. No new blockers or majors surfaced at umbrella lens.

---

## Closed sub-domain findings — frozen

| Sub-program | Closed IDs | Evaluator action |
|-------------|------------|------------------|
| PP-1 | F01, F02, F05, F06, F07, F12 | **No reopen** |
| PP-2 | F01–F04, F06–F11 | **No reopen** |
| PP-3 | F01, F03, F04, F06, F12 | **No reopen** |

No regression evidence identified at umbrella evaluation.

---

## Findings blocker matrix

| Finding | Blocks award? | Blocks plain L3? |
|---------|:-------------:|:----------------:|
| All 7 majors | No | Yes (most) |
| All 19 advisories | No | No |
| Accepted (2) | No | Partial |
| Closed (~23) | No | No |

---

## Certificate projection (if ratified)

| Field | Projected value |
|-------|-----------------|
| Level | LEVEL 3 CERTIFIED WITH FINDINGS |
| Score | 22/27 |
| Majors on certificate | 7 |
| Advisories on certificate | 19 |
| Accepted on certificate | 2 |
| Total tracked | ~28 |

---

## Remediation (optional post-ratification)

| Priority | Finding | Theme |
|----------|---------|-------|
| P1 | M01, M02 | MFA · billing dashboard |
| P2 | M03, M04, M05, M07 | Dedup · tier · invoice · module PE |
| P3 | Advisories + EVAL-F01 | Hygiene · integration tests |

**Not required for L3 WITH FINDINGS retention.**

---

**Last updated:** 2026-06-20 (Umbrella Certification Evaluation)
