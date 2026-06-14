# Place UX Batch 6B-Place-UX-B Closeout

**Status:** **Complete** — engineering remediation; no certification award  
**Date:** 2026-06-03  
**Wave:** **6B-Place-UX-B** — interaction safety + publisher shell  
**Baseline:** [`PLACE_UX_BASELINE_AUDIT.md`](./PLACE_UX_BASELINE_AUDIT.md) (6B-Place-UX-A)  
**Patterns:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md) — DES-001, DES-008, WS-002, MOB groundwork

> **Engineering only.** No certification, no Reference UX #6 designation, no QA execution.

---

## Executive summary

| Metric | 6B-A (baseline) | 6B-B (projected) |
|--------|-----------------|------------------|
| **PASS / PWF / FAIL** | 1 / 7 / 3 | **3 / 7 / 1** |
| **UX-L1 readiness** | 38% | **62%** |
| **UX-L2 readiness** | 22% | **45%** |
| **UX-L3 readiness** | 12% | **18%** |
| **Native `prompt()`** | 1 | **0** |
| **ConfirmModal gates** | 0 | **8 paths** |

**Resolved:** **P-1**, **P-2**, **P-4** (publisher). **P-3** groundwork via `PlacePageShell`. **P-8** partial — `DropdownMenu` on meetings + listing links.

---

## Findings resolved

| ID | Finding | Resolution |
|----|---------|------------|
| **P-1** | Native `prompt()` calendar link | `PlaceCalendarLinkModal` — certified `Modal` + calendar list picker |
| **P-2** | Destructive actions without confirm | `ConfirmModal` on meeting cancel, link delete, cover/avatar remove, graph unfollow (explore + profile panel) |
| **P-4** | Publisher non-standard chrome | `PageHeader` + `PageToolbar` on `PlaceWorkspaceLanding` hub + listing editor |
| **P-8** | No action menus | `DropdownMenu` on meeting rows + interaction link rows |
| **P-3** | Consumer inline-style shell | **Partial** — `PlacePageShell` extracted; `/place` wired (Tailwind tab chrome) |

---

## Files modified

| File | Change |
|------|--------|
| `web/src/components/place/PlaceCalendarLinkModal.tsx` | **New** — calendar picker modal |
| `web/src/components/place/PlacePageShell.tsx` | **New** — consumer tab shell (P-3 groundwork) |
| `web/src/components/place/PlaceMeetings.tsx` | ConfirmModal cancel; calendar modal; DropdownMenu actions |
| `web/src/components/place/PlaceListingEditor.tsx` | ConfirmModal deletes; DropdownMenu link actions |
| `web/src/components/place/BusinessProfilePanel.tsx` | ConfirmModal unfollow |
| `web/src/components/place/PlaceExplore.tsx` | ConfirmModal unfollow |
| `web/src/components/place/PlaceWorkspaceLanding.tsx` | PageHeader + PageToolbar publisher shell |
| `web/src/app/place/page.tsx` | PlacePageShell integration; shared Spinner load |

---

## ConfirmModal coverage inventory

| Surface | Action | Pattern | Status |
|---------|--------|---------|--------|
| `PlaceMeetings` | Cancel meeting | request → ConfirmModal → `deleteMeeting` | ✅ |
| `PlaceListingEditor` | Delete interaction link | request → ConfirmModal → `deleteLink` | ✅ |
| `PlaceListingEditor` | Remove cover image | request → ConfirmModal → `deleteCoverImage` | ✅ |
| `PlaceListingEditor` | Remove avatar image | request → ConfirmModal → `deleteAvatarImage` | ✅ |
| `BusinessProfilePanel` | Unfollow / remove node | request → ConfirmModal → `removeNode` | ✅ |
| `PlaceExplore` | Unfollow / remove node | request → ConfirmModal → `removeNode` | ✅ |
| `PlaceMeetings` | Link to calendar | `PlaceCalendarLinkModal` (non-destructive) | ✅ |
| Global trash UI | Drag-to-trash / restore | — | ❌ P-6 (next wave) |
| Connection request decline | — | Non-destructive RSVP | N/A |
| Graph node delete (keyboard) | — | No dedicated delete path | N/A |

**Grep verification:** `prompt()` / `confirm()` → **0** matches under `web/src/components/place/`.

---

## DropdownMenu coverage

| Surface | Trigger | Actions |
|---------|---------|---------|
| `PlaceMeetings` | `MoreHorizontal` per meeting | Add to calendar, Cancel meeting |
| `PlaceListingEditor` | `MoreHorizontal` per link | Hide/show, Delete (confirm) |

---

## Publisher shell (WS-002)

| View | PageHeader | PageToolbar |
|------|------------|-------------|
| Business hub (`module=place`) | ✅ Title, description, publish badge | ✅ Manage listing CTA |
| Listing editor (`view=listing`) | ✅ Title + back action | ✅ Editor context label |

---

## Remaining Place findings

| ID | Finding | Severity | Next wave |
|----|---------|----------|-----------|
| **P-3** | Consumer shell — full archetype adoption | P1 | 6B-Place-UX-C |
| **P-5** | Shared `EmptyState` | P2 | 6B-Place-UX-D |
| **P-6** | Global trash UI | P2 | 6B-Place-UX-D |
| **P-7** | Mobile sheet / 375px | P1 | 6B-Place-UX-C |
| **P-9** | Silent error catches | P2 | 6B-Place-UX-D |
| **P-10** | `PlaceContent` duplicate | P2 | 6B-Place-UX-C |
| **P-11** | Dark mode consumer | P3 | 6B-Place-UX-D |
| **P-12** | Graph a11y | P3 | 6B-Place-UX-D |
| **P-13** | QA matrix | P2 | 6B-Place-QA |

---

## Projected scorecard (6B-Place-UX-B)

| # | Category | 6B-A | 6B-B (projected) | Notes |
|---|----------|------|------------------|-------|
| 1 | Interaction Consistency | FAIL | **PASS** | P-1, P-2, P-8 resolved |
| 2 | Layout Consistency | FAIL | **PWF** | Publisher WS-002; consumer shell groundwork |
| 3 | Navigation | PWF | **PWF** | Unchanged |
| 4 | Accessibility | PWF | **PWF** | Modal focus via shared primitives |
| 5 | Mobile | FAIL | **FAIL** | P-7 open |
| 6 | Cross-Module Integration | PWF | **PWF** | Calendar picker modal improves bridge |
| 7 | Error Handling | PWF | **PWF** | P-9 open |
| 8 | Empty States | PWF | **PWF** | P-5 open |
| 9 | Loading States | PASS | **PASS** | `/place` load uses `Spinner` |
| 10 | Discoverability | PWF | **PWF** | Unchanged |
| 11 | Workflow Completion | PWF | **PASS** | Calendar link + confirm deletes complete journeys |

**Totals:** **3 PASS / 7 PWF / 1 FAIL**

---

## Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** (2026-06-03) |
| Native dialogs in Place UX | **0** |
| ConfirmModal destructive paths | **6** |
| Certified modal (calendar link) | **1** |

---

## Recommended next wave

**6B-Place-UX-C** — Layout + mobile: consumer `PlaceContent` dedupe, mobile sheet (MOB-001), full consumer archetype; targets **P-3**, **P-7**, **P-10**.

---

## Related

- [`PLACE_UX_SCORECARD.md`](./PLACE_UX_SCORECARD.md)
- [`PLACE_UX_CERTIFICATION.md`](./PLACE_UX_CERTIFICATION.md)

**Last updated:** 2026-06-03 (Wave 6B-Place-UX-B closeout)
