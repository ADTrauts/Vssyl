# Platform Certification Gap Analysis (Wave 5F)

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Analysis only — no source changes, no certification upgrades  
**Program:** UX Modernization Wave 5F  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md), [`UX_CERTIFICATION_STANDARD.md`](./UX_CERTIFICATION_STANDARD.md), [`REFERENCE_MODULE_PROGRAM.md`](./REFERENCE_MODULE_PROGRAM.md)

---

## 1. Executive summary

After Drive Reference UX #1, Chat 5B.3, Notifications 5C.2, Todo 5D.4, and Calendar 3C-7D, the platform has **two modules at UX-L2** (Notifications, Calendar), **three at UX-L1 CwF** (Chat, Todo, Drive reference track), and **zero modules at UX-L3** on the 11-category platform scorecard.

**Fastest L2 upgrade:** **Todo** — one PASS category short (8/11).  
**Highest ROI:** **Calendar** — already L2 CwF with only 2 PWF; Reference UX #5 slot; E-14 QA unlocks L3 path.  
**Best Reference UX #2 candidate:** **Notifications** — L2 CwF, cross-module hub, 9 PASS today.  
**Best Reference UX #5 candidate:** **Calendar** — program-designated slot; post-3C-7 modernization complete.  
**Deprioritize for near-term certification:** **Chat** — three PASS categories short of L2; product gaps (C-5, C-6) dominate.

---

## 2. Platform certification table

| Module | Current level | PASS / PWF / FAIL | Next possible level | Blocking findings | Est. effort |
|--------|---------------|-------------------|---------------------|-------------------|-------------|
| **Drive** | **Reference UX #1** (Approved with Findings); UX-L3 interaction (3B-6); 8-cat ref scorecard **3 PASS / 5 PWF** | 11-cat platform scorecard **not run** | Platform **UX-L3** formal (11-cat) | F-1 manual QA unsigned; F-5/F-6 a11y; F-8 mobile QA; no Wave 5A 11-cat artifact | **Medium** (QA sign-off + doc re-score) |
| **Chat** | **UX-L1 CwF** | **6 / 5 / 0** | **UX-L2 CwF** | 3 PASS short; C-5 search stub; C-6 pin/archive/mute; C-8 QA; C-9 hub naming | **Large** |
| **Notifications** | **UX-L1 CwF** + **UX-L2 CwF** | **9 / 4 / 0** | **UX-L3 CwF** | Cat 4 PWF (N-6 QA, N-7 aria); N-2 feed errors; N-5 mobile sidebar | **Medium** |
| **Todo** | **UX-L1 CwF** | **8 / 3 / 0** | **UX-L2 CwF** | 1 PASS short; T-8 EmptyState primitive; T-9 aria; T-11 QA; T-7 mobile width | **Small** |
| **Calendar** | **UX-L1 Certified** + **UX-L2 CwF** | **9 / 2 / 0** | **UX-L3 CwF** | Cat 4 PWF (E-14 QA); cat 5 PWF (E-14 mobile sign-off) | **Medium** |

---

## 3. Eleven-category matrix (5E baseline → 5E.3/5D.4/5C.2/5B.3 → post-program)

### Drive (Reference track — 11-cat inferred, not formally scored)

| # | Category | Reference 8-cat (3B-6) | Inferred 11-cat | Notes |
|---|----------|------------------------|-----------------|-------|
| 1 | Interaction | PASS WITH FINDINGS | **PASS** | 3B interaction certification |
| 2 | Layout | PASS | **PASS** | 3C-2 full rollout |
| 3 | Navigation | PASS | **PASS** | All routes + business |
| 4 | Accessibility | PASS WITH FINDINGS | **PWF** | F-5/F-6; no WCAG audit |
| 5 | Mobile | PASS WITH FINDINGS | **PWF** | F-8 QA unsigned |
| 6 | Cross-Module | PASS WITH FINDINGS | **PWF** | Scheduling drop exception |
| 7 | Error Handling | — | **PASS** | Toast on primary paths |
| 8 | Empty States | — | **PASS** | Shared primitive |
| 9 | Loading | — | **PASS** | Spinner/skeleton |
| 10 | Discoverability | — | **PASS** | Strong toolbar/nav |
| 11 | Workflow | — | **PASS** | Full CRUD journeys |

**Formal 11-cat re-score recommended** — do not treat inferred ratings as authoritative.

### Chat (5B.3 authoritative)

| # | Category | 5B initial | 5B.3 | Δ |
|---|----------|------------|------|---|
| 1 | Interaction | FAIL | **PASS** | ↑ |
| 2 | Layout | PWF | **PASS** | ↑ |
| 3 | Navigation | PASS | **PASS** | — |
| 4 | Accessibility | PWF | PWF | — |
| 5 | Mobile | PWF | PWF | — |
| 6 | Cross-Module | PWF | PWF | — |
| 7 | Error Handling | PWF | **PASS** | ↑ |
| 8 | Empty States | PWF | PWF | — |
| 9 | Loading | PASS | **PASS** | — |
| 10 | Discoverability | PWF | PWF | — |
| 11 | Workflow | FAIL | **PASS** | ↑ |

### Notifications (5C.2 authoritative)

| # | Category | 5C | 5C.2 | Δ |
|---|----------|-----|------|---|
| 1 | Interaction | PWF | **PASS** | ↑ |
| 2 | Layout | PASS | **PASS** | — |
| 3 | Navigation | PASS | **PASS** | — |
| 4 | Accessibility | PWF | PWF | — |
| 5 | Mobile | PWF | PWF | — |
| 6 | Cross-Module | PASS | **PASS** | — |
| 7 | Error Handling | PWF | PWF | — |
| 8 | Empty States | PWF | PWF | — |
| 9 | Loading | PASS | **PASS** | — |
| 10 | Discoverability | PASS | **PASS** | — |
| 11 | Workflow | PWF | **PASS** | ↑ |

### Todo (5D.4 authoritative)

| # | Category | 5D | 5D.4 | Δ |
|---|----------|-----|------|---|
| 1 | Interaction | FAIL | **PASS** | ↑ |
| 2 | Layout | PWF | **PASS** | ↑ |
| 3 | Navigation | PWF | **PASS** | ↑ |
| 4 | Accessibility | PWF | PWF | — |
| 5 | Mobile | PWF | PWF | — |
| 6 | Cross-Module | PASS | **PASS** | — |
| 7 | Error Handling | PASS | **PASS** | — |
| 8 | Empty States | PWF | PWF | — |
| 9 | Loading | PASS | **PASS** | — |
| 10 | Discoverability | PWF | **PASS** | ↑ |
| 11 | Workflow | FAIL | **PASS** | ↑ |

### Calendar (3C-7D authoritative)

| # | Category | 5E | 5E.3 | 3C-7D | Δ (5E.3→7D) |
|---|----------|-----|------|-------|-------------|
| 1 | Interaction | FAIL | **PASS** | **PASS** | — |
| 2 | Layout | PWF | PWF | **PASS** | ↑ |
| 3 | Navigation | PWF | PWF | **PASS** | ↑ |
| 4 | Accessibility | PWF | PWF | PWF | — |
| 5 | Mobile | PWF | PWF | PWF | — |
| 6 | Cross-Module | PASS | **PASS** | **PASS** | — |
| 7 | Error Handling | PWF | **PASS** | **PASS** | — |
| 8 | Empty States | PWF | PWF | **PASS** | ↑ |
| 9 | Loading | PASS | **PASS** | **PASS** | — |
| 10 | Discoverability | PWF | **PASS** | **PASS** | — |
| 11 | Workflow | FAIL | **PASS** | **PASS** | — |

---

## 4. Per-module gap detail

### Drive — Reference UX #1

| Field | Value |
|-------|-------|
| **Artifacts** | [`REFERENCE_MODULE_DRIVE.md`](./audits/REFERENCE_MODULE_DRIVE.md), [`DRIVE_REFERENCE_UX_SCORECARD.md`](./audits/DRIVE_REFERENCE_UX_SCORECARD.md), [`DRIVE_INTERACTION_CERTIFICATION.md`](./audits/DRIVE_INTERACTION_CERTIFICATION.md) |
| **Open findings** | F-1 QA unsigned; F-2 share stub; F-4 enhanced module; F-5 keyboard help drift; F-6 trash aria; F-8 mobile QA |
| **Blocks next level** | Platform **11-category UX-L3** not formally scored; human QA gate |
| **Effort** | **Medium** — documentation re-score + QA execution (no major code expected) |

### Chat — UX-L1 CwF

| Field | Value |
|-------|-------|
| **Artifacts** | [`CHAT_UX_SCORECARD.md`](./audits/CHAT_UX_SCORECARD.md), [`CHAT_UX_RECERTIFICATION_2026.md`](./audits/CHAT_UX_RECERTIFICATION_2026.md) |
| **Open findings** | C-5 message search; C-6 conversation management; C-8 QA; C-9 hub landing pattern |
| **Blocks L2** | **3 PASS short** — cats 4, 5, 6, 8, 10 are PWF; need 3 upgrades to reach 9 PASS |
| **Blocks L3** | L2 prerequisite; cat 4 PWF; C-8 |
| **Effort** | **Large** — product features (C-5, C-6) or explicit deferral + multiple polish waves |

### Notifications — UX-L2 CwF

| Field | Value |
|-------|-------|
| **Artifacts** | [`NOTIFICATIONS_UX_SCORECARD.md`](./audits/NOTIFICATIONS_UX_SCORECARD.md), [`NOTIFICATIONS_UX_RECERTIFICATION_2026.md`](./audits/NOTIFICATIONS_UX_RECERTIFICATION_2026.md) |
| **Open findings** | N-2 feed error surfacing; N-3 settings chrome; N-4 local EmptyState; N-5 sidebar width; N-6 QA; N-7 aria; N-8 grouped delete affordance |
| **Blocks L3** | Cat **4** PWF (core quartet); N-6 manual QA |
| **Effort** | **Medium** — N-7/N-2 small code; N-5 responsive sidebar medium; QA process |

### Todo — UX-L1 CwF (one short of L2)

| Field | Value |
|-------|-------|
| **Artifacts** | [`TODO_UX_SCORECARD.md`](./audits/TODO_UX_SCORECARD.md), [`TODO_UX_RECERTIFICATION_2026_5D4.md`](./audits/TODO_UX_RECERTIFICATION_2026_5D4.md) |
| **Open findings** | T-6 board compact menu; T-7 detail width; T-8 local EmptyState; T-9 aria; T-10 drive unlink; T-11 QA; T-12 shortcuts |
| **Blocks L2** | **1 PASS short** — upgrade any of cats 4, 5, or 8 |
| **Blocks L3** | L2 + cat 4 PWF + T-11 |
| **Effort** | **Small** — T-8 shared `EmptyState` + T-9 `aria-label` likely sufficient for L2 CwF |

### Calendar — UX-L1 Certified + UX-L2 CwF

| Field | Value |
|-------|-------|
| **Artifacts** | [`CALENDAR_UX_SCORECARD.md`](./audits/CALENDAR_UX_SCORECARD.md), [`CALENDAR_UX_RECERTIFICATION_2026_3C7D.md`](./audits/CALENDAR_UX_RECERTIFICATION_2026_3C7D.md), 3C-7A/B/C closeouts |
| **Open findings** | **E-14** manual QA (primary); widget/enterprise shell exceptions |
| **Blocks L3** | Cat **4** PWF; E-14 unsigned |
| **Effort** | **Medium** — QA matrix execution; optional week-grid mobile verification |

---

## 5. Strategic determinations

### 1. Fastest module to upgrade

**Todo** — 8/11 PASS; one category upgrade (likely cat 8 via shared `EmptyState`) reaches L2 CwF. **Small** engineering effort.

### 2. Highest ROI module to upgrade

**Calendar** — already **UX-L2 CwF** with **2 PWF** (lowest PWF count among L2 modules); full 3C-7 modernization complete; Reference UX #5 designated in program docs; E-14 QA is the main unlock for L3.

### 3. Best candidate for Reference UX #2

**Notifications** — **9 PASS** today; cross-module routing hub; L2 CwF; strong management-page archetype. Chat **rejected** at 5B.3. Todo lacks distinctive benchmark breadth.

### 4. Best candidate for Reference UX #5 (Calendar)

**Calendar** — only eligible module for the program slot; 3C-7 program complete; needs **UX-L3 CwF** + registration doc + council before designation.

### 5. Chat vs Todo vs Calendar priority

| Priority | Module | Rationale |
|----------|--------|-----------|
| **1** | **Todo** | Fastest L2 win; completes workspace-module trio parity with Calendar |
| **2** | **Calendar** | L3 + Reference #5 path; modernization investment already sunk |
| **3** | **Notifications** | Parallel L3 track; hub module value |
| **4** | **Chat** | Largest PASS gap; product backlog (C-5, C-6) blocks efficient certification |

---

## 6. Ranked remediation roadmap

| Rank | Wave | Module | Goal | Effort | Type |
|------|------|--------|------|--------|------|
| 1 | **5G-Todo** | Todo | L2 CwF — `EmptyState` + a11y labels (T-8, T-9) | Small | Engineering |
| 2 | **5G-Todo-D** | Todo | Documentation re-cert after 5G-Todo | Small | Certification |
| 3 | **5G-QA** | Platform | Shared manual QA matrix execution (Drive F-1, Calendar E-14, Notifications N-6, Todo T-11, Chat C-8) | Medium | Process |
| 4 | **5G-Calendar-D** | Calendar | L3 CwF re-cert post E-14 sign-off | Small | Certification |
| 5 | **5G-Notifications** | Notifications | N-2 toast + N-7 aria + N-5 mobile sidebar | Medium | Engineering |
| 6 | **5G-Drive-D** | Drive | Formal 11-category platform scorecard | Small | Certification |
| 7 | **5H-Chat** | Chat | L2 path — EmptyState + hub landing + search deferral doc | Large | Engineering + product |

---

## 7. Recommended next waves

### Engineering

**Wave 5G-Todo** — Shared `EmptyState` migration + overflow `aria-label` (T-8, T-9). Lowest effort, clears L2 bar.

### Certification

**Wave 5G-Todo-D** — Todo UX re-certification after 5G-Todo implementation.  
**Parallel:** **Wave 5G-QA** — platform manual QA matrix (unblocks L3 for Calendar, Notifications, Drive).

### Reference Module

**Defer designation** until **UX-L3 CwF** on target module.  
**Calendar** → Reference UX #5 after L3 + `REFERENCE_MODULE_CALENDAR.md`.  
**Notifications** → strongest **Reference UX #2** alternate if Calendar L3 slips.

---

## 8. Platform snapshot

| Metric | Value |
|--------|-------|
| Modules with formal 11-cat scorecard | **4** (Chat, Notifications, Todo, Calendar) |
| Modules at UX-L2+ | **2** (Notifications, Calendar) |
| Modules at UX-L1 Certified (strict) | **1** (Calendar) |
| Reference UX registered | **1** (Drive #1) |
| Shared blocker across modules | **Manual QA matrix unsigned** (F-1, C-8, N-6, T-11, E-14) |
| Native dialog debt | **0** across all five modules |

---

## Related

- [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md)
- [`REFERENCE_MODULE_PROGRAM.md`](./REFERENCE_MODULE_PROGRAM.md)
- [`CALENDAR_LAYOUT_MODERNIZATION_PLAN.md`](./CALENDAR_LAYOUT_MODERNIZATION_PLAN.md)

**Last updated:** 2026-06-03 (Wave 5F — analysis only)
