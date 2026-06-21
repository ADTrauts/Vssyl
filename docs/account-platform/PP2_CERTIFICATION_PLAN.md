# PP-2 — Certification Plan

**Program:** Account Platform — Certification Planning Charter  
**Sub-program:** PP-2 Settings Platform  
**Date:** 2026-06-20  
**Status:** Planning only — evaluation not authorized

---

## Readiness score

| Metric | Value |
|--------|-------|
| **G1–G9 estimate** | **~25/27 (~93%)** |
| **Certification posture** | **READY FOR EVALUATION** → L3 WITH FINDINGS |
| **Plain L3** | **Not targeted** |
| **Strongest sub-domain** | **Yes — highest readiness in Account Platform trilogy** |

---

## Evaluation prerequisites

| # | Prerequisite | Status |
|---|--------------|--------|
| 1 | PP-2 Phase 1 + Package 2 complete | ✅ |
| 2 | PP-1 foundation (HARD dependency) | ✅ |
| 3 | Operation matrix re-audit (PP-2 rows) | ⏳ Required |
| 4 | G1–G9 evidence binder assembled | ⏳ Required |
| 5 | Hub inventory + consolidation matrix published | ✅ |
| 6 | 24+ settings tests passing | ✅ |
| 7 | Council evaluation authorization vote | ⏳ Separate |

**Does not require:** PP-3 client migration, business settings deduplication, email_* full convergence.

---

## Remaining findings

### Majors (F01–F09)

| ID | Status | Evaluation disposition |
|----|--------|------------------------|
| PP2-F01 | Closed | — |
| PP2-F02 | Closed | — |
| PP2-F03 | Closed | — |
| PP2-F04 | Closed | Personal hubs 6→2 |
| **PP2-F05** | **Partial** | **WITH FINDINGS** — BA owns business dedup |
| PP2-F06 | Closed | Notification adapter |
| PP2-F07 | Closed | Theme hydration |
| PP2-F08 | Closed | Privacy in settings hub |
| PP2-F09 | Closed | Notification adapter |

### Advisories

| ID | Disposition |
|----|-------------|
| PP2-F10 | Closed |
| PP2-F11 | Closed |
| PP2-F12 | WITH FINDINGS — HR settings 404 link |
| PP2-F13 | WITH FINDINGS — misleading business 2FA UI (BA) |

---

## Findings that block evaluation vs certification

| Finding | Blocks evaluation? | Blocks plain L3 certification? |
|---------|-------------------|-------------------------------|
| PP2-F05 partial | **No** | Yes (plain L3) |
| email_* path convergence | No | Partial (advisory) |
| Business dedup UI | No | WITH FINDINGS only |

---

## Likely certification outcome

| Outcome | Probability | Conditions |
|---------|-------------|------------|
| **L3 WITH FINDINGS** | **Very high** | Strongest evidence package in trilogy |
| Plain L3 | Low | Requires F05 BA dedup + email adapter |
| NOT CERTIFIABLE | Very low | Only if matrix re-audit reveals regressions |

**Expected findings at evaluation:** 1–2 WITH FINDINGS (F05 business dedup reference; optional email_* advisory).

---

## Required evidence (G1–G9 binder)

| Gate | Evidence required |
|------|-------------------|
| G1 | `settings:read`, `settings:update` PE; notification adapter PE path |
| G2 | `settingsActivityService` + domain events (`settings.*`) |
| G3 | `settingsService` orchestration diagram; adapter delegation |
| G4 | `/api/settings` contract; hub inventory; legacy family inventory |
| G5 | Registry spec + ownership model + navigation contract |
| G6 | 24 test results; integration test inventory |
| G7 | Package 1 + Package 2 architecture docs |
| G8 | Theme hydration flow; registry validation |
| G9 | Consolidated hub screenshots/IA; before/after hub count |

---

## Evaluation timing

| Milestone | Earliest |
|-----------|----------|
| Evaluation packet ready | After matrix re-audit |
| Evaluation execution | **Parallel with PP-1** |
| Likely first to **certify** (L3 WITH FINDINGS) | **Yes** — strongest score |

---

**Last updated:** 2026-06-20 (Certification Planning Charter)
