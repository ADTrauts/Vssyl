# Account Platform — Umbrella Findings Strategy

**Program:** Account Platform — Umbrella Certification Planning  
**Date:** 2026-06-20  
**Status:** Authoritative findings disposition for umbrella certification  
**Register prefix:** `AP-UMB-*`

**Source aggregation:** [ACCOUNT_PLATFORM_SHARED_FINDINGS_REVIEW.md](./ACCOUNT_PLATFORM_SHARED_FINDINGS_REVIEW.md)

---

## Strategy purpose

Define how findings are **classified**, **aggregated**, **treated on certificate**, and **managed through umbrella evaluation and ratification** — without reopening closed sub-domain findings.

---

## Classification taxonomy

| Class | Definition | Blocks eval? | Blocks L3 WF? | Blocks plain L3? | Certificate treatment |
|-------|------------|:------------:|:-------------:|:----------------:|----------------------|
| **Blocking** | Prevents safe operation or violates constitutional non-negotiable | **Yes** | **Yes** | **Yes** | Must close before cert |
| **Major** | Material gap; functional workaround exists | No | No | **Yes** | **WITH FINDINGS** — tracked |
| **Advisory** | Hygiene, docs, non-critical UX | No | No | No | **Track-only** |
| **Accepted WITH FINDINGS** | Known gap with explicit waiver/exception | No | No | Partial | **Documented waiver** |
| **Closed** | Remediated or confirmed at sub-domain eval | No | No | No | **Frozen** — no reopen |

---

## Current register summary

| Class | Count | IDs |
|-------|------:|-----|
| **Blocking** | **0** | — |
| **Major** | **7** | AP-UMB-M01–M07 |
| **Advisory** | **18** | AP-UMB-ADV-01–18 |
| **Accepted WITH FINDINGS** | **2** | AP-UMB-ACC-01, AP-UMB-ACC-02 |
| **Closed (sub-domain)** | **~23** | PP1/PP2/PP3 closed — frozen |

---

## Blocking findings — **NONE**

| Check | Result |
|-------|--------|
| Open sub-domain blockers | **0** |
| Cross-cut blockers surfaced at progress review | **0** |
| Regression since ratification | **None identified** |

**Umbrella evaluation may proceed** once governance prerequisites met (binder + authorization).

---

## Major findings — WITH FINDINGS on certificate

| ID | Source | Description | Owner | Cross-cut | Plain L3 blocker? |
|----|--------|-------------|-------|-----------|:-----------------:|
| **AP-UMB-M01** | PP1-F03 | MFA not implemented | PP-1 Security | Security → All | **Yes** |
| **AP-UMB-M02** | PP3-F08 | Modal-only billing UX | PP-3 / UX | Settings ↔ Billing | **Yes** |
| **AP-UMB-M03** | PP2-F05 | Business settings triplication | BA | Settings ↔ BA | **Yes** |
| **AP-UMB-M04** | PP3-F02 | Tier enum vocabulary drift | PP-3 Entitlement | Entitlement → All | **Yes** |
| **AP-UMB-M05** | PP3-F05 | Invoice webhook activity gap | PP-3 Billing | Audit | Partial |
| **AP-UMB-M06** | PP1-F04 | Photo multer in controller | PP-1 Identity | G3 boundary | **Yes** |
| **AP-UMB-M07** | PP3-EVAL-F01 | Module commerce PE gap | PP-3 Billing | AuthZ | Partial |

### Treatment rules for majors

| Rule | Description |
|------|-------------|
| **No individual waivers** | Majors tracked on certificate — not waived at umbrella unless remediation charter closes |
| **BA-owned majors** | AP-UMB-M03 tracked on umbrella cert; remediation owned by BA program |
| **Cross-cut elevation** | Majors affecting ≥2 slices listed in certificate cross-cut section |
| **Post-cert obligation** | Recommended 90-day hygiene plan — not mandatory for cert retention |
| **Promotion path** | Close all 7 majors for plain L3 consideration |

---

## Advisory findings — track-only

| ID | Source(s) | Description |
|----|-----------|-------------|
| AP-UMB-ADV-01 | PP1-F08 | Session revoke / password change UX |
| AP-UMB-ADV-02 | PP1-F10, PP2-F13 | Misleading business 2FA UI (deduped) |
| AP-UMB-ADV-03 | PP1-F09 | Legacy photo URL fields |
| AP-UMB-ADV-04 | PP1-F11 | Global Trash for profile photos |
| AP-UMB-ADV-05 | PP1-EVAL-A01 | No identity domain events in registry |
| AP-UMB-ADV-06 | PP1-EVAL-A02 | Auth security logging vs module activity |
| AP-UMB-ADV-07 | PP1-EVAL-A03 | Member read inline Prisma |
| AP-UMB-ADV-08 | PP2-F12 | HR settings 404 link |
| AP-UMB-ADV-09 | PP2-EVAL-A01 | Email notification PE gap |
| AP-UMB-ADV-10 | PP2-EVAL-A02 | Email notification activity gap |
| AP-UMB-ADV-11 | PP2-EVAL-A03 | Legacy API inventory (~22 families) |
| AP-UMB-ADV-12 | PP3-F07 | HR gating matrix separation |
| AP-UMB-ADV-13 | PP3-F09 | Orphan gating file |
| AP-UMB-ADV-14 | PP3-F10 | No product trial UX |
| AP-UMB-ADV-15 | PP3-F11 | `standard` vs `pro` vocabulary |
| AP-UMB-ADV-16 | PP3-F13 | AI query balance boundary docs |
| AP-UMB-ADV-17 | PP3-EVAL-F02 | Checkout E2E test gap |
| AP-UMB-ADV-18 | PP3-F14 | Global Trash exception for billing records |

### Advisory treatment rules

| Rule | Description |
|------|-------------|
| **Track-only** | Listed on certificate appendix; no waiver vote required |
| **No gate impact** | Advisories do not cap G1–G9 scores |
| **Dedup at aggregation** | Overlapping sub-domain advisories merged (ADV-02) |
| **Owner assignment** | Each advisory has named owner for hygiene backlog |

---

## Accepted WITH FINDINGS

| ID | Source | Description | Waiver rationale |
|----|--------|-------------|------------------|
| **AP-UMB-ACC-01** | PP3-F02 partial | Tier vocabulary — `normalizeTier()` boundary | Accepted boundary control pending data migration |
| **AP-UMB-ACC-02** | PP3-F14 | Billing records Global Trash exception | Documented product exception — billing invoices not user-trashable |

**Accepted findings** appear on certificate with explicit waiver notation. Do not count toward major count for L3 WF threshold (≤7 majors).

---

## Closed findings — frozen register

Sub-domain closed findings (PP1-F01/F02/F05/F06/F07/F12; PP2-F01–F04/F06–F11; PP3-F01/F03/F04/F06/F12) are **frozen**.

| Rule | Description |
|------|-------------|
| **No reopen** at umbrella eval without regression evidence |
| **Regression charter** required if evaluator observes closure invalidation |
| **Certificate reference** | Closed count noted; IDs not re-listed on umbrella cert body |

---

## New findings at umbrella evaluation

| Rule | Limit |
|------|-------|
| Maximum new findings | **3** (AP-UMB-EVAL-*) |
| Severity cap | Major or advisory only — **no new blockers** without regression |
| Gate impact | New majors may cap affected gate at 2 |
| Ratification | New findings dispositioned at umbrella ratification council |

---

## Certificate findings layout (projected)

```
Account Platform — LEVEL 3 CERTIFIED WITH FINDINGS
Composite: X/27

MAJORS (7):
  AP-UMB-M01 MFA
  AP-UMB-M02 Billing UX
  ...

ADVISORIES (18):
  AP-UMB-ADV-01 … ADV-18

ACCEPTED:
  AP-UMB-ACC-01 Tier normalizeTier()
  AP-UMB-ACC-02 Billing trash exception

PLAIN L3 BLOCKERS:
  M01, M02, M03, M04, M06 (+ G9)
```

**Projected tracked count:** ~27 items (7 majors + 18 advisories + 2 accepted).

---

## Findings lifecycle post-certification

| Phase | Action |
|-------|--------|
| At ratification | Disposition vote on any new AP-UMB-EVAL-* |
| 90-day hygiene | Recommended remediation themes — not mandatory |
| Plain L3 promotion | Separate vote after major closure |
| Sub-domain remediation | Updates sub-domain cert; triggers unified matrix re-merge |

---

**Last updated:** 2026-06-20 (Umbrella Certification Planning)
