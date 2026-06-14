# Place Module UX Scorecard (Wave 6B-Place-UX-A)

**Status:** **6B-Place-Certification-Review authoritative** (2026-06-14)  
**Date:** 2026-06-03 (baseline) · 2026-06-14 (certification review)  
**Module:** Place (`place`)  
**Benchmark:** Wave 6A UX Reference patterns — Drive #1 primary  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md) (Wave 5A)  
**Audit:** [`PLACE_UX_BASELINE_AUDIT.md`](./PLACE_UX_BASELINE_AUDIT.md)  
**Remediation:** [`PLACE_UX_BATCH_B_CLOSEOUT.md`](./PLACE_UX_BATCH_B_CLOSEOUT.md) · [`PLACE_UX_BATCH_C_CLOSEOUT.md`](./PLACE_UX_BATCH_C_CLOSEOUT.md) · [`PLACE_UX_BATCH_D_CLOSEOUT.md`](./PLACE_UX_BATCH_D_CLOSEOUT.md)  
**QA:** [`PLACE_QA_EXECUTION_REPORT_2026.md`](./PLACE_QA_EXECUTION_REPORT_2026.md) · [`PLACE_QA_ADDENDUM_2026.md`](./PLACE_QA_ADDENDUM_2026.md)  
**Certification review:** [`PLACE_UX_CERTIFICATION_REVIEW.md`](./PLACE_UX_CERTIFICATION_REVIEW.md)

> **UX-L1 / L2 / L3 Certified** (2026-06-14). Reference UX #6 **not designated**.

---

## Scope reviewed

| Area | Paths |
|------|-------|
| Consumer home | `web/src/app/place/page.tsx`, `PlaceConsumerExperience.tsx`, `PlaceContent.tsx` |
| Shell | `PlacePageShell.tsx` |
| Graph + panels | `PlaceGraph.tsx`, `BusinessProfilePanel.tsx`, `HouseholdProfilePanel.tsx` |
| Discovery | `PlaceExplore.tsx`, `PlaceOnboarding.tsx` |
| Meetings / feed / analytics | `PlaceMeetings.tsx`, `PlaceActivityFeed.tsx`, `PlaceAnalyticsDashboard.tsx` |
| Empty states | `PlaceEmptyStates.tsx` |
| Transactions | `web/src/app/place/transactions/page.tsx` |
| Privacy overlay | `PlacePrivacySettings.tsx` |
| Publisher hub | `PlaceWorkspaceLanding.tsx`, `PlaceListingEditor.tsx` |
| Integrations | `BusinessWorkspaceContent.tsx`, `DashboardLayoutInner.tsx`, manifest, trash handler |

---

## Category results

### 6B-Place-UX-A (baseline — authoritative for pre-remediation)

| # | Category | Rating | Rationale |
|---|----------|--------|-----------|
| 1 | **Interaction Consistency** | **FAIL** | Native `prompt()` (**P-1**); deletes without `ConfirmModal` (**P-2**). |
| 2 | **Layout Consistency** | **FAIL** | Consumer inline shell (**P-3**); no `PageHeader`/`PageToolbar` (**P-4**). |
| 3 | **Navigation** | **PASS WITH FINDINGS** | Hub + deep links; duplicate page/embed (**P-10**). |
| 4 | **Accessibility** | **PASS WITH FINDINGS** | Tab roles; graph/dark gaps (**P-11**, **P-12**). |
| 5 | **Mobile** | **FAIL** | No 3C-7B sheet (**P-7**). |
| 6 | **Cross-Module Integration** | **PASS WITH FINDINGS** | NTF/realtime/AI ✅; trash UI missing (**P-6**). |
| 7 | **Error Handling** | **PASS WITH FINDINGS** | Silent catch (**P-9**). |
| 8 | **Empty States** | **PASS WITH FINDINGS** | Custom inline (**P-5**). |
| 9 | **Loading States** | **PASS** | `Spinner` on sub-views. |
| 10 | **Discoverability** | **PASS WITH FINDINGS** | Tab nav + onboarding. |
| 11 | **Workflow Completion** | **PASS WITH FINDINGS** | Calendar link + delete friction. |

### 6B-Place-UX-B (projected — post interaction safety)

| # | Category | Rating | Rationale |
|---|----------|--------|-----------|
| 1 | **Interaction Consistency** | **PASS** | `ConfirmModal` on all scoped destructive paths; 0 native dialogs. |
| 2 | **Layout Consistency** | **PASS WITH FINDINGS** | Publisher `PageHeader` + `PageToolbar`; consumer `PlacePageShell` groundwork. |
| 3 | **Navigation** | **PASS WITH FINDINGS** | Unchanged. |
| 4 | **Accessibility** | **PASS WITH FINDINGS** | Shared modal/menu primitives. |
| 5 | **Mobile** | **FAIL** | **P-7** open. |
| 6 | **Cross-Module Integration** | **PASS WITH FINDINGS** | Calendar picker modal. |
| 7 | **Error Handling** | **PASS WITH FINDINGS** | **P-9** open. |
| 8 | **Empty States** | **PASS WITH FINDINGS** | **P-5** open. |
| 9 | **Loading States** | **PASS** | `/place` gate uses `Spinner`. |
| 10 | **Discoverability** | **PASS WITH FINDINGS** | Unchanged. |
| 11 | **Workflow Completion** | **PASS** | Calendar link + confirmed deletes. |

### 6B-Place-UX-D (projected — post trash + errors + a11y)

| # | Category | Rating | Rationale |
|---|----------|--------|-----------|
| 1 | **Interaction Consistency** | **PASS** | Unchanged. |
| 2 | **Layout Consistency** | **PASS** | Unchanged. |
| 3 | **Navigation** | **PASS WITH FINDINGS** | Unchanged. |
| 4 | **Accessibility** | **PASS WITH FINDINGS** | Graph node list; canvas partial (**P-12**). |
| 5 | **Mobile** | **PASS WITH FINDINGS** | MOB-001 engineering; QA open (**P-7**). |
| 6 | **Cross-Module Integration** | **PASS** | Global trash + calendar modal (**P-6**). |
| 7 | **Error Handling** | **PASS** | Toast + retry (**P-9**). |
| 8 | **Empty States** | **PASS** | Unchanged. |
| 9 | **Loading States** | **PASS** | Unchanged. |
| 10 | **Discoverability** | **PASS WITH FINDINGS** | Unchanged. |
| 11 | **Workflow Completion** | **PASS** | Trash + calendar complete journeys. |

### 6B-Place-Certification-Review (authoritative — post Part 2G QA)

| # | Category | Rating | Rationale |
|---|----------|--------|-----------|
| 1 | **Interaction Consistency** | **PASS** | ConfirmModal trash/create; meetings menu (PLC-QA-02); PLC-05/10/11/14/15 QA |
| 2 | **Layout Consistency** | **PASS** | `PlacePageShell` + publisher `PageHeader`; PLC-01/03/04 QA |
| 3 | **Navigation** | **PASS** | Single consumer path; hub + tabs; PLC-01–03 QA |
| 4 | **Accessibility** | **PASS** | PLC-24 node list + PLC-25 privacy dialog; P-12 mitigated |
| 5 | **Mobile** | **PASS** | MOB-001 sheets; PLC-18/19/20 at 375px |
| 6 | **Cross-Module Integration** | **PASS** | Global trash + calendar + follow; PLC-08/10–17 QA |
| 7 | **Error Handling** | **PASS** | Toast + inline retry; PLC-27 QA |
| 8 | **Empty States** | **PASS** | `PlaceEmptyStates`; PLC-07/26 QA |
| 9 | **Loading States** | **PASS** | Spinner on sub-views; no regression |
| 10 | **Discoverability** | **PASS** | Tab bar + mobile nav; PLC-01/02/18 QA |
| 11 | **Workflow Completion** | **PASS** | Meeting + listing + calendar end-to-end; PLC-05–17/11/13 QA |

---

## Summary metrics

| Metric | 6B-A | 6B-B | 6B-C | 6B-D | **Cert review** |
|--------|------|------|------|------|-----------------|
| **PASS** | **1** | **3** | **5** | **7** | **11** |
| **PASS WITH FINDINGS** | **7** | **7** | **6** | **4** | **0** |
| **FAIL** | **3** | **1** | **0** | **0** | **0** |
| **UX-L1 readiness** | **38%** | **62%** | **78%** | **86%** | **100%** |
| **UX-L2 readiness** | **22%** | **45%** | **68%** | **82%** | **100%** |
| **UX-L3 readiness** | **12%** | **18%** | **28%** | **38%** | **100%** |
| **Pattern reuse score** | **32%** | **48%** | **58%** | **68%** | **78%** |

---

## Level awards

| Level | Decision |
|-------|----------|
| **UX-L1** | **Certified** ✅ (first award — 2026-06-14) |
| **UX-L2** | **Certified** ✅ (first award — 2026-06-14) |
| **UX-L3** | **Certified** ✅ (first award — 2026-06-14) |
| **Reference UX #6** | **Eligible With Findings** — not designated |
| **Reference Workspace** | **Ineligible** — product module |

**Review:** [`PLACE_UX_CERTIFICATION_REVIEW.md`](./PLACE_UX_CERTIFICATION_REVIEW.md)

---

## Remaining findings (non-scorecard)

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| **P-1** – **P-10** | Engineering findings | P1–P2 | **Resolved** (6B-B/C/D) |
| **P-11** | Dark mode | P3 | **Resolved**; certified exception — dynamic chip colors |
| **P-12** | Graph a11y | P3 | **Resolved**; P3 observation — canvas pan |
| **P-13** | QA matrix | P2 | **Resolved** — 27/27 PASS |
| **PLC-QA-*** | QA env/proxy/menu | P0–P1 | **Resolved/Fixed** (R2) |
| **QA-ENV-02** | `JWT_SECRET` in `.env` | P1 (env) | **Open** — workaround only |
| **Human sign-off** | Product/engineering | Process | **Open** |

---

## Pattern reuse (Wave 6A)

| Adoption | Patterns |
|----------|----------|
| **Full** | XMOD-001 trash, XMOD-002 notifications, XMOD-005 realtime, MOB-001, EMP-001, DES-001, DES-008, AI providers, manifest hub |
| **Partial** | NAV-001 hub, NAV-002 deep links, WS-002 publisher, EMP-003 onboarding |
| **Missing** | XMOD-008 (full cross-module search) |

**Score:** **78%** of applicable patterns (post certification review).

---

## Wave history

| Wave | Outcome |
|------|---------|
| **6B-Place-UX-A** | **1 PASS / 7 PWF / 3 FAIL** — baseline |
| **6B-Place-UX-B** | **3 PASS / 7 PWF / 1 FAIL** — [`PLACE_UX_BATCH_B_CLOSEOUT.md`](./PLACE_UX_BATCH_B_CLOSEOUT.md) |
| **6B-Place-UX-C** | **5 PASS / 6 PWF / 0 FAIL** — [`PLACE_UX_BATCH_C_CLOSEOUT.md`](./PLACE_UX_BATCH_C_CLOSEOUT.md) |
| **6B-Place-UX-D** | **7 PASS / 4 PWF / 0 FAIL** (projected) — [`PLACE_UX_BATCH_D_CLOSEOUT.md`](./PLACE_UX_BATCH_D_CLOSEOUT.md) |
| **6B-Place-QA + R2** | **27 PASS / 0 FAIL / 0 BLOCKED** — Part 2G |
| **6B-Place-Certification-Review** | **11 PASS / 0 PWF / 0 FAIL** — **UX-L1/L2/L3 Certified** |

**Next:** **6B-Place-Ref6-Prep** (registration artifact; no designation in prep wave).

**Last updated:** 2026-06-14 (Wave 6B-Place-Certification-Review)
