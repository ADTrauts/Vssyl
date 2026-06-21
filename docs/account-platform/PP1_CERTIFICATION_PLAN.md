# PP-1 — Certification Plan

**Program:** Account Platform — Certification Planning Charter  
**Sub-program:** PP-1 Identity & Profile  
**Date:** 2026-06-20  
**Status:** Planning only — evaluation not authorized

---

## Readiness score

| Metric | Value |
|--------|-------|
| **G1–G9 estimate** | **~24/27 (~89%)** |
| **Certification posture** | **READY FOR EVALUATION** → L3 WITH FINDINGS |
| **Plain L3** | **Not targeted** |

---

## Evaluation prerequisites

| # | Prerequisite | Status |
|---|--------------|--------|
| 1 | PP-1 Phase 1 foundation complete | ✅ |
| 2 | Operation matrix re-audit (PP-1 rows) | ⏳ Required |
| 3 | G1–G9 evidence binder assembled | ⏳ Required |
| 4 | MFA disposition document (F03) | ⏳ Required |
| 5 | Integration test inventory published | ⏳ Partial — G6 gap |
| 6 | Council evaluation authorization vote | ⏳ Separate |

**Does not require:** PP-3 client migration, PP-2 completion (already done), ledger row.

---

## Remaining findings

### Majors (F01–F06)

| ID | Status | Evaluation disposition |
|----|--------|------------------------|
| PP1-F01 | Closed | — |
| PP1-F02 | Closed | — |
| **PP1-F03** | **Open** | **WITH FINDINGS** — MFA deferred; document G8 risk acceptance |
| PP1-F04 | Partial | **WITH FINDINGS** — multer in controller acceptable transitional |
| PP1-F05 | Closed | — |
| PP1-F06 | Closed | — |

### Advisories

| ID | Disposition |
|----|-------------|
| PP1-F07 | Partial — notification adapter (PP-2) closed write drift |
| PP1-F08 | WITH FINDINGS — session UX |
| PP1-F09 | WITH FINDINGS — legacy photo URL fields |
| PP1-F10 | WITH FINDINGS — misleading business 2FA UI (BA) |
| PP1-F11 | WITH FINDINGS — Global Trash photos |
| PP1-F12 | Closed (PP-2) |

---

## Findings that block evaluation vs certification

| Finding | Blocks evaluation? | Blocks plain L3 certification? |
|---------|-------------------|-------------------------------|
| PP1-F03 MFA | **No** (WITH FINDINGS path) | **Yes** |
| PP1-F04 partial | No | Yes (plain L3) |
| G6 partial tests | No — hygiene gap | Partial |

---

## Likely certification outcome

| Outcome | Probability | Conditions |
|---------|-------------|------------|
| **L3 WITH FINDINGS** | **High** | Standard path after prerequisites |
| Plain L3 | Low | Requires MFA + F04 closure + G6 expansion |
| NOT CERTIFIABLE | Very low | Only if matrix re-audit reveals regressions |

**Expected findings at evaluation:** 2–4 WITH FINDINGS items (MFA, photo controller, session UX, test coverage).

---

## Required evidence (G1–G9 binder)

| Gate | Evidence required |
|------|-------------------|
| G1 | Policy action matrix; PE on profile/privacy/photo/connection writes |
| G2 | `identityActivityService` samples; domain event registry entries |
| G3 | Service boundary diagram; no inline Prisma in `index.ts` for auth/profile |
| G4 | Route inventory: `/api/auth`, `/api/profile`, `/api/privacy`, `/api/member` |
| G5 | [PP1_IDENTITY_PROFILE_OWNERSHIP_MODEL.md](./PP1_IDENTITY_PROFILE_OWNERSHIP_MODEL.md) |
| G6 | Test file inventory; coverage gaps documented |
| G7 | Phase 1 architecture + operation matrix (re-audited) |
| G8 | MFA disposition document; security event logging |
| G9 | Settings hub integration for identity surfaces |

---

## Evaluation timing

| Milestone | Earliest |
|-----------|----------|
| Evaluation packet ready | After matrix re-audit (~2–4 weeks governance) |
| Evaluation execution | Parallel with PP-2 |
| Certification recommendation | Same window as PP-2 if parallel |

---

**Last updated:** 2026-06-20 (Certification Planning Charter)
