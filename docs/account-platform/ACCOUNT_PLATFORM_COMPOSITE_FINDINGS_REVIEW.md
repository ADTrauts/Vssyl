# Account Platform — Composite Findings Review

**Program:** Account Platform — Umbrella Certification Preparation  
**Date:** 2026-06-20  
**Type:** Aggregated findings disposition — evaluation packet  
**Outcome:** **0 blocking · 7 major · 18 advisory · 2 accepted · ~23 closed (frozen)**

**Strategy:** [ACCOUNT_PLATFORM_UMBRELLA_FINDINGS_STRATEGY.md](./ACCOUNT_PLATFORM_UMBRELLA_FINDINGS_STRATEGY.md)  
**Sources:** PP1/PP2/PP3 findings reviews · AP-UMB register from progress review

---

## Aggregation summary

| Class | PP-1 open | PP-2 open | PP-3 open | Umbrella roll-up | **Total** |
|-------|----------:|----------:|----------:|-----------------:|----------:|
| **Blocking** | 0 | 0 | 0 | 0 | **0** |
| **Major** | 2 | 1 | 4 | 0 dedup | **7** |
| **Advisory** | 7 | 5 | 7 | 1 dedup | **18** |
| **Accepted WF** | 0 | 0 | 2 | 0 | **2** |
| **Closed** | 6 | 11 | 6 | — | **~23** |

**Dedup applied:** PP1-F10 + PP2-F13 → single AP-UMB-ADV-02.

---

## Blocking findings — **NONE**

| Sub-program historical blockers | Status |
|--------------------------------|--------|
| PP1-F01, F02, F05, F06 | Closed — frozen |
| PP2-F01, F02, F03 | Closed — frozen |
| PP3-F01, F03 | Closed — frozen |

**Evaluation blockers:** **0** — packet ready for authorization review.

---

## Major findings — WITH FINDINGS on certificate

| ID | Source | Description | Cross-cut | Blocks eval? | Blocks L3 WF? | Blocks plain L3? |
|----|--------|-------------|-----------|:------------:|:-------------:|:----------------:|
| **AP-UMB-M01** | PP1-F03 | MFA not implemented | Security → All | No | No† | **Yes** |
| **AP-UMB-M02** | PP3-F08 | Modal-only billing UX | Settings ↔ Billing | No | No | **Yes** |
| **AP-UMB-M03** | PP2-F05 | Business settings triplication | Settings ↔ BA | No | No | **Yes** |
| **AP-UMB-M04** | PP3-F02 | Tier enum vocabulary drift | Entitlement | No | No‡ | **Yes** |
| **AP-UMB-M05** | PP3-F05 | Invoice webhook activity gap | Billing audit | No | No | Partial |
| **AP-UMB-M06** | PP1-F04 | Photo multer in controller | Identity G3 | No | No | **Yes** |
| **AP-UMB-M07** | PP3-EVAL-F01 | Module commerce PE gap | Billing authZ | No | No | Partial |

† Dispositioned — [PP1_MFA_DISPOSITION_REVIEW.md](./PP1_MFA_DISPOSITION_REVIEW.md)  
‡ Waived partial — `normalizeTier()` → AP-UMB-ACC-01

### Sub-domain major mapping

| Sub-domain ID | Umbrella ID | Eval disposition |
|---------------|-------------|------------------|
| PP1-F03 | AP-UMB-M01 | WITH FINDINGS — MFA deferred |
| PP1-F04 | AP-UMB-M06 | WITH FINDINGS — partial |
| PP2-F05 | AP-UMB-M03 | WITH FINDINGS — BA-owned |
| PP3-F02 | AP-UMB-M04 / ACC-01 | Partial waived |
| PP3-F05 | AP-UMB-M05 | WITH FINDINGS — partial |
| PP3-F07 | AP-UMB-ADV-12 | Downgraded to advisory at umbrella (by design) |
| PP3-F08 | AP-UMB-M02 | WITH FINDINGS — open major |
| PP3-EVAL-F01 | AP-UMB-M07 | WITH FINDINGS — eval-surfaced |

---

## Advisory findings — track-only (18)

| ID | Source(s) | Description | Owner |
|----|-----------|-------------|-------|
| AP-UMB-ADV-01 | PP1-F08 | Session revoke / password change UX | PP-1 |
| AP-UMB-ADV-02 | PP1-F10, PP2-F13 | Misleading business 2FA UI | BA |
| AP-UMB-ADV-03 | PP1-F09 | Legacy photo URL fields | Identity |
| AP-UMB-ADV-04 | PP1-F11 | Global Trash for profile photos | Identity |
| AP-UMB-ADV-05 | PP1-EVAL-A01 | No identity domain events in registry | Identity |
| AP-UMB-ADV-06 | PP1-EVAL-A02 | Auth security logging vs module activity | By design |
| AP-UMB-ADV-07 | PP1-EVAL-A03 | Member read inline Prisma | Read layer |
| AP-UMB-ADV-08 | PP2-F12 | HR settings 404 link | HR |
| AP-UMB-ADV-09 | PP2-EVAL-A01 | Email notification PE gap | Notifications |
| AP-UMB-ADV-10 | PP2-EVAL-A02 | Email notification activity gap | Notifications |
| AP-UMB-ADV-11 | PP2-EVAL-A03 | Legacy API inventory (~22 families) | Settings |
| AP-UMB-ADV-12 | PP3-F07 | HR gating matrix separation | By design |
| AP-UMB-ADV-13 | PP3-F09 | Orphan gating file | Billing hygiene |
| AP-UMB-ADV-14 | PP3-F10 | No product trial UX | Product |
| AP-UMB-ADV-15 | PP3-F11 | `standard` vs `pro` vocabulary | F02 overlap |
| AP-UMB-ADV-16 | PP3-F13 | AI query balance boundary docs | Billing + AI |
| AP-UMB-ADV-17 | PP3-EVAL-F02 | Checkout E2E test gap | Test hygiene |
| AP-UMB-ADV-18 | PP3-F14 | Billing records Global Trash exception | Documented |

**Advisory treatment:** Track-only on certificate — no individual waivers required.

---

## Accepted WITH FINDINGS

| ID | Source | Description | Waiver |
|----|--------|-------------|--------|
| **AP-UMB-ACC-01** | PP3-F02 partial | Tier vocabulary — `normalizeTier()` boundary | Accepted pending data migration |
| **AP-UMB-ACC-02** | PP3-F14 | Billing records Global Trash exception | Documented product exception |

---

## Closed findings — frozen (no reopen)

| Sub-program | Closed IDs | Confirmation |
|-------------|------------|--------------|
| **PP-1** | F01, F02, F05, F06, F07, F12 | Ratification confirmed |
| **PP-2** | F01–F04, F06–F11 | Ratification confirmed |
| **PP-3** | F01, F03, F04, F06, F12 | Ratification confirmed |

**Rule:** Closed findings cannot reopen at umbrella eval without regression evidence charter.

---

## Findings blocker matrix — evaluation lens

| Finding | Blocks eval auth? | Blocks eval execution? | Blocks L3 WF cert? | Blocks plain L3? |
|---------|:-----------------:|:----------------------:|:------------------:|:----------------:|
| All 7 majors | No | No | No | Yes (most) |
| All 18 advisories | No | No | No | No |
| Accepted (2) | No | No | No | Partial |
| Closed (~23) | No | No | No | No |

---

## Certificate projection

| Field | Projected value |
|-------|-----------------|
| Level | LEVEL 3 CERTIFIED WITH FINDINGS |
| Composite score | ~22/27 |
| Majors on certificate | 7 |
| Advisories on certificate | 18 |
| Accepted on certificate | 2 |
| Total tracked | ~27 |
| Plain L3 blockers listed | M01, M02, M03, M04, M06 + G9 |

---

## New findings at evaluation (rules)

| Rule | Limit |
|------|-------|
| Max new AP-UMB-EVAL-* | 3 |
| Severity | Major or advisory only |
| Blockers | Not permitted without regression evidence |
| Reopen closed | Requires separate charter |

---

## Hygiene backlog (post-cert, non-blocking)

| Priority | Finding | Theme |
|----------|---------|-------|
| P1 | AP-UMB-M01 | MFA implementation |
| P1 | AP-UMB-M02 | Billing dashboard UX |
| P2 | AP-UMB-M03 | BA settings dedup |
| P2 | AP-UMB-M04 | Tier enum migration |
| P2 | AP-UMB-M05, M07 | Audit + module PE |
| P3 | Advisories | Docs, tests, hygiene |

---

**Last updated:** 2026-06-20 (Umbrella Certification Preparation)
