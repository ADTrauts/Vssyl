# Place UX Batch 6B-Place-UX-C Closeout

**Status:** **Complete** — engineering remediation; no certification award  
**Date:** 2026-06-03  
**Wave:** **6B-Place-UX-C** — consumer shell, mobile sheets, layout consolidation, EmptyState  
**Baseline:** [`PLACE_UX_BASELINE_AUDIT.md`](./PLACE_UX_BASELINE_AUDIT.md) (6B-Place-UX-A)  
**Prior:** [`PLACE_UX_BATCH_B_CLOSEOUT.md`](./PLACE_UX_BATCH_B_CLOSEOUT.md) (6B-Place-UX-B)  
**Patterns:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md) — MOB-001, EMP-001, WS consumer shell

> **Engineering only.** No certification, no Reference UX #6 designation, no QA execution.

---

## Executive summary

| Metric | 6B-B (prior) | 6B-C (projected) |
|--------|--------------|------------------|
| **PASS / PWF / FAIL** | 3 / 7 / 1 | **5 / 6 / 0** |
| **UX-L1 readiness** | 62% | **78%** |
| **UX-L2 readiness** | 45% | **68%** |
| **UX-L3 readiness** | 18% | **28%** |
| **Pattern reuse** | 48% | **58%** |
| **`pnpm type-check`** | PASS | **PASS** |

**Resolved:** **P-3**, **P-7** (engineering), **P-10**. **Materially improved:** **P-5**, **P-11**, **P-12**.

---

## 1. Findings resolved

| ID | Finding | Resolution |
|----|---------|------------|
| **P-3** | Consumer inline-style shell | **`PlacePageShell`** — canonical Tailwind shell; desktop tab bar + utility links; dark-mode tokens; aligns with Calendar/AI/Todo workspace chrome |
| **P-7** | No mobile sheet / 375px | **MOB-001** left nav sheet (`PlacePageShell`) + right category filter sheet (`PlaceExplore`); backdrop + Escape + selection closes; aria labels; no body-scroll lock |
| **P-10** | Duplicate `place/page.tsx` vs `PlaceContent` | **`PlaceConsumerExperience`** — single rendering path; `PlaceContent` = `PlaceProvider` + embedded experience; `/place/page.tsx` thin wrapper |
| **P-5** | Custom empty states | **`PlaceEmptyStates.tsx`** — shared `EmptyState` on graph, explore search/suggestions, meetings, feed, insights, profile no-listing; listing links helper text |
| **P-11** | Dark mode consumer gap | Shell, explore, graph container, privacy overlay — `dark:` classes; toggle track contrast |
| **P-12** | Graph / nav a11y | Tab `role`/`aria-selected`; sheet labels; privacy `role="dialog"` + `aria-modal`; profile panel close `aria-label`; toggle `aria-pressed` |

---

## 2. Files modified

| File | Change |
|------|--------|
| `web/src/components/place/PlacePageShell.tsx` | **Rewritten** — MOB-001 mobile nav sheet; desktop tab bar; dark mode |
| `web/src/components/place/PlaceConsumerExperience.tsx` | **New** — canonical consumer experience |
| `web/src/components/place/PlaceContent.tsx` | Thin embed: `PlaceProvider` + `PlaceConsumerExperience` |
| `web/src/app/place/page.tsx` | Thin route wrapper |
| `web/src/components/place/PlaceEmptyStates.tsx` | **New** — shared EmptyState wrappers |
| `web/src/components/place/PlaceExplore.tsx` | Mobile filter sheet; EmptyState; Tailwind section headers |
| `web/src/components/place/PlaceGraph.tsx` | `PlaceGraphEmptyState`; dark container |
| `web/src/components/place/PlaceMeetings.tsx` | `PlaceMeetingsEmptyState` |
| `web/src/components/place/PlaceActivityFeed.tsx` | `PlaceFeedEmptyState` |
| `web/src/components/place/PlaceAnalyticsDashboard.tsx` | `PlaceInsightsEmptyState` |
| `web/src/components/place/BusinessProfilePanel.tsx` | `PlaceProfileNoListingEmptyState`; close `aria-label` |
| `web/src/components/place/HouseholdProfilePanel.tsx` | Close `aria-label` |
| `web/src/components/place/PlaceListingEditor.tsx` | `PlaceListingLinksEmptyState` when no links |
| `web/src/components/place/PlacePrivacySettings.tsx` | `role="dialog"`, `aria-modal`, Escape, backdrop, close button |

---

## 3. Mobile sheet coverage inventory (MOB-001)

| Surface | Pattern | Backdrop | Escape | Selection closes | aria-label | 375px QA |
|---------|---------|----------|--------|------------------|------------|----------|
| Consumer tab navigation | Left overlay sheet (`PlacePageShell`) | ✅ | ✅ | ✅ | ✅ Open/Close nav | ❌ Not executed |
| Explore category filters | Right overlay sheet (`PlaceExplore`) | ✅ | ✅ | ✅ | ✅ Open/Close filters | ❌ Not executed |
| Privacy settings | Centered dialog + backdrop (`PlacePrivacySettings`) | ✅ | ✅ | N/A | ✅ Close privacy | ❌ Not executed |
| Graph zoom/pan controls | ReactFlow `Controls` (built-in) | N/A | N/A | N/A | Partial | ❌ Not executed |
| Publisher hub navigation | Responsive `PageHeader` / toolbar (desktop-first) | N/A | N/A | N/A | Partial | ❌ Not executed |

**Note:** No `document.body` overflow lock on sheets — content scrolls under backdrop per certified Calendar/Notifications pattern.

---

## 4. EmptyState coverage inventory

| Surface | Component | Shared `EmptyState` | Notes |
|---------|-----------|---------------------|-------|
| Empty graph (no nodes) | `PlaceGraphEmptyState` | ✅ | Page-level |
| Explore — search no results | `PlaceExploreSearchEmptyState` | ✅ | Page-level |
| Explore — no suggestions | `PlaceExploreSuggestionsEmptyState` | ✅ | Page-level |
| Explore — Near You subsection empty | Inline dashed message | ❌ | **Certified exception** — subsection within populated layout |
| Meetings — no active meetings | `PlaceMeetingsEmptyState` | ✅ | Page-level |
| Activity feed — no items | `PlaceFeedEmptyState` | ✅ | Page-level |
| Insights — no analytics | `PlaceInsightsEmptyState` | ✅ | Page-level |
| Business profile — no listing | `PlaceProfileNoListingEmptyState` | ✅ | Panel-level |
| Listing editor — no interaction links | `PlaceListingLinksEmptyState` | Partial | **Certified exception** — inline helper above add form |
| Empty relationships (graph) | Covered by `PlaceGraphEmptyState` | ✅ | No separate connection list empty |
| Transactions history | Not in wave scope | — | Unchanged |
| Onboarding | `PlaceOnboarding` wizard | — | Intentional guided flow |

---

## 5. Remaining Place findings

| ID | Finding | Severity | Status after 6B-C |
|----|---------|----------|-------------------|
| **P-6** | Global trash UI not wired | P2 | Open — 6B-Place-UX-D |
| **P-9** | Silent error catches | P2 | Open — 6B-Place-UX-D |
| **P-11** | Dark mode gaps (cards, suggestion cards inline styles) | P3 | Partial — explore cards still use inline category colors |
| **P-12** | Graph canvas a11y (keyboard node traversal, live regions) | P3 | Partial — panels improved; ReactFlow canvas open |
| **P-13** | No QA matrix rows | P2 | Open — 6B-Place-QA |
| **P-7** | 375px manual validation | P1 evidence | Engineering done; QA not executed |

---

## 6. Projected scorecard (6B-Place-UX-C)

| # | Category | 6B-B | 6B-C | Notes |
|---|----------|------|------|-------|
| 1 | Interaction Consistency | PASS | **PASS** | Unchanged (6B-B) |
| 2 | Layout Consistency | PWF | **PASS** | P-3, P-10 resolved |
| 3 | Navigation | PWF | **PWF** | Single path; deep links unchanged |
| 4 | Accessibility | PWF | **PWF** | P-12 partial remediation |
| 5 | Mobile | FAIL | **PWF** | MOB-001 sheets; no 375px QA evidence |
| 6 | Cross-Module Integration | PWF | **PWF** | Unchanged |
| 7 | Error Handling | PWF | **PWF** | P-9 open |
| 8 | Empty States | PWF | **PASS** | EMP-001 adopted; 2 certified exceptions |
| 9 | Loading States | PASS | **PASS** | Unchanged |
| 10 | Discoverability | PWF | **PWF** | Unchanged |
| 11 | Workflow Completion | PASS | **PASS** | Unchanged |

**Totals:** **5 PASS / 6 PWF / 0 FAIL**

---

## 7. Readiness

| Level | 6B-B | 6B-C | Gate note |
|-------|------|------|-----------|
| **UX-L1** | 62% | **78%** | Needs ≥8 PASS — projected **5** |
| **UX-L2** | 45% | **68%** | Mobile no longer FAIL; still PWF |
| **UX-L3** | 18% | **28%** | L2 prerequisite progress only |

**Certification:** **Not awarded** — engineering wave only.

---

## 8. Accessibility & dark mode — remediation log

| Area | Remediation | Remaining gap |
|------|-------------|---------------|
| Consumer tab bar | `role="tablist"`, `aria-selected`, `aria-label` on privacy | Mobile sheet focus trap not certified |
| Mobile sheets | Backdrop buttons labeled; Escape handlers | No focus return to trigger |
| Privacy overlay | `role="dialog"`, `aria-modal`, `aria-labelledby`, toggle `aria-pressed` | Focus trap via shared primitive not verified |
| Profile panels | Close button `aria-label` | Cover images `alt=""` empty |
| Explore cards | — | `SuggestionCard` / `ListingCard` still inline styles |
| Graph | Dark container background | Canvas not screen-reader navigable |

---

## 9. Recommended next wave

**6B-Place-UX-D** (polish + integration):

1. **P-6** — wire global trash UI for listing/meeting soft deletes  
2. **P-9** — user-visible error toasts on silent catches  
3. **P-12** — graph keyboard/live-region pass  
4. **P-11** — migrate explore suggestion cards to Tailwind tokens  
5. **P-7 / P-13** — 375px QA matrix execution (`6B-Place-QA`)

**Reference UX #6:** Remains **deferred** until UX-L3 CwF + dual-surface pattern extraction.

---

## Wave history

| Wave | Outcome |
|------|---------|
| **6B-Place-UX-A** | 1 / 7 / 3 — baseline |
| **6B-Place-UX-B** | 3 / 7 / 1 — interaction safety |
| **6B-Place-UX-C** | **5 / 6 / 0** — shell + mobile + EmptyState |

**Last updated:** 2026-06-03 (Wave 6B-Place-UX-C complete)
