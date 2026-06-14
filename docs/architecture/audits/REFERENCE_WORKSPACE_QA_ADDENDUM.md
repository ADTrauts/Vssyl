# Reference Workspace QA Addendum (Wave 2E)

**Status:** Evidence addendum — adjudication layer  
**Date:** 2026-06-14  
**Parent:** [REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md](./REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md)  
**Matrix:** [PLATFORM_MANUAL_QA_MATRIX.md](../../ux/PLATFORM_MANUAL_QA_MATRIX.md) Part 2H

> **No certification level changes. No WS-L2 award. No registration.**

---

## 1. Purpose

Record **human adjudication** of automated Part 2H results where:

- Playwright selectors mismatch PlatformShell markup (`PlatformDashboardTab` vs `role="tab"`)
- Onboarding modals block tab clicks
- Semantic HTML expectations differ from PlatformShell implementation (`<header>` vs styled divs)

Automated runner: `qa-evidence/reference-workspace/run-part2h-qa.mjs`

---

## 2. Adjudication table

| Case | Automated | Final | Rationale |
|------|-----------|-------|-----------|
| RWS-07 | FAIL | **PASS** | RWS-20 confirms module → dashboard return on same session; automation failed tab selector only |
| RWS-11 | FAIL | **PASS** | R1 capture `RWS-11-personal-work-tab-D-light.png` shows Work embed; R2 failed on modal intercept |
| RWS-14 | FAIL | **KNOWN-PWF** | PLC-03 PASS (same account) proves Place tab embed; automation did not activate Place tab |
| RWS-16 | BLOCKED | **FAIL (P0)** | Confirmed 404 at segment URL; reclassified from BLOCKED — route missing, not env |
| RWS-23 | FAIL | **PASS** | Screenshot shows business left nav + rails; PlatformShell omits semantic `<header>` |
| RWS-27 | KNOWN-PWF | **KNOWN-PWF** | Global trash PASS; notifications accessed via sidebar module `/notifications`, not header bell — document platform pattern |

**Unchanged:** All other rows retain automated PASS / KNOWN-PWF.

---

## 3. New finding — RWS-F1

| ID | Finding | Severity | Source | Blocks |
|----|---------|----------|--------|--------|
| **RWS-F1** | Business Place publisher segment URL 404 (`/workspace/place`) while `?module=place` hub path works | **P0** | RWS-16 | WS-L2 certification (product); not L2-B3 process |

**Contract conflict:**

- [CROSS_SURFACE_TRANSITIONS.md](../CROSS_SURFACE_TRANSITIONS.md) §6 — segment `/business/:id/workspace/place`
- [businessWorkspaceContracts.ts](../../web/src/lib/businessWorkspaceContracts.ts) — `segment: 'place'`, `switchMounted: true`
- **Repo:** No `web/src/app/business/[id]/workspace/place/page.tsx` (hub null deferral pattern used by drive/chat/calendar)

**Recommended disposition (governance):** Business Workspace **1E** hygiene — add null deferral segment page **or** amend contract to hub+`resolveBusinessWorkspaceModule` canonical (align with PLC-04 evidence).

---

## 4. L2-B3 closure rationale

| WS-L2 assessment intent (L2-B3) | 2E outcome |
|----------------------------------|------------|
| Cross-workspace transition QA **not performed** | ✅ **Performed** — 27-case matrix |
| Evidence for B-F5 / combined gap 75% | ✅ Screenshots + JSON |
| Zero defects required | ❌ Not required for **process** closure |

**Verdict:** L2-B3 **closed** as a **process gate**. RWS-F1 is a **certification finding**, not a reopen of L2-B3.

---

## 5. WS-L2 readiness impact (governance estimate)

| Dimension | Pre-2E | Post-2E |
|-----------|--------|---------|
| D-7 Cross-surface transition | 75% | **82%** |
| Combined WS-L2 | 85% | **~87%** |

*Estimate only — no formal WS-L2 reassessment issued in 2E.*

---

## 6. Cross-reference updates

| Document | Update |
|----------|--------|
| `REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md` | Post-2E L2-B3 closed note |
| `REFERENCE_WORKSPACE_CHARTER_REVIEW.md` | Wave 2E status |
| `PLATFORM_MANUAL_QA_MATRIX.md` | Part 2H results filled |
| `REFERENCE_MODULE_CATALOG.md` | Combined program QA row |

---

## 7. Re-run triggers

Re-execute Part 2H when:

1. Business Place segment page lands (RWS-F1 fix)
2. PlatformShell header/tab markup changes
3. Cross-surface navigation contract changes
4. Pre-WS-L2 certification review sign-off

---

*Last updated: 2026-06-14*
