# Place UX Batch 6B-Place-UX-D Closeout

**Status:** **Complete** — engineering remediation; no certification award  
**Date:** 2026-06-03  
**Wave:** **6B-Place-UX-D** — trash lifecycle, error handling, dark mode, graph a11y, QA matrix prep  
**Prior:** [`PLACE_UX_BATCH_C_CLOSEOUT.md`](./PLACE_UX_BATCH_C_CLOSEOUT.md)  
**Patterns:** XMOD-001 trash, N-2 error feedback, A11Y graph keyboard nav, DES-001 confirm trash

> **Engineering only.** No certification, no QA execution, no Reference UX #6.

---

## Executive summary

| Metric | 6B-C (prior) | 6B-D (projected) |
|--------|--------------|------------------|
| **PASS / PWF / FAIL** | 5 / 6 / 0 | **7 / 4 / 0** |
| **UX-L1 readiness** | 78% | **86%** |
| **UX-L2 readiness** | 68% | **82%** |
| **UX-L3 readiness** | 28% | **38%** |
| **Pattern reuse** | 58% | **68%** |
| **QA matrix rows (Place)** | 0 | **27** |
| **`pnpm type-check`** | PASS | **PASS** |

**Resolved:** **P-6**, **P-9**, **P-11** (engineering), **P-12** (partial). **Prepared:** **P-13**.

---

## 1. Findings resolved

| ID | Finding | Resolution |
|----|---------|------------|
| **P-6** | Global trash UI not wired | Meetings → `trashItem` + ConfirmModal; listing editor danger zone; `GlobalTrashBin` icons for `listing`/`meeting`; `placeItemTrashed` / `itemRestored` refresh hooks; server `listMeetingsForUser` excludes `trashedAt` |
| **P-9** | Silent error catches | `placeUxFeedback.ts` toast helpers; user-visible errors + inline retry on feed/analytics/meetings; privacy toggle failures surfaced |
| **P-11** | Dark mode inline styles | `PlaceDiscoveryCard` Tailwind tokens; `BusinessNode` token classes; graph dark minimap/controls; category chip accent colors remain dynamic (**exception**) |
| **P-12** | Graph a11y | Keyboard node list panel; `aria-describedby` instructions; graph canvas/minimap/control labels; business nodes retain `aria-label` + `tabIndex` |
| **P-13** | No QA matrix | **Part 2G** — 27 executable rows in [`PLATFORM_MANUAL_QA_MATRIX.md`](../PLATFORM_MANUAL_QA_MATRIX.md) |

---

## 2. Files modified

| File | Change |
|------|--------|
| `web/src/components/place/placeUxFeedback.ts` | **New** — toast error/success helpers |
| `web/src/components/place/PlaceDiscoveryCard.tsx` | **New** — token-based explore cards |
| `web/src/components/place/PlaceMeetings.tsx` | Global trash for meetings; error handling |
| `web/src/components/place/PlaceListingEditor.tsx` | Listing trash danger zone; error toasts |
| `web/src/components/place/PlaceExplore.tsx` | `PlaceDiscoveryCard`; error toasts |
| `web/src/components/place/PlaceGraph.tsx` | Keyboard node list; dark/a11y |
| `web/src/components/place/nodes/BusinessNode.tsx` | Tailwind + a11y |
| `web/src/components/place/PlaceActivityFeed.tsx` | Error toast + retry |
| `web/src/components/place/PlaceAnalyticsDashboard.tsx` | Error toast + retry |
| `web/src/components/place/PlacePrivacySettings.tsx` | Error toasts |
| `web/src/components/place/PlaceConsumerExperience.tsx` | Trash/restore refresh |
| `web/src/components/place/PlaceWorkspaceLanding.tsx` | Listing trash/restore refresh |
| `web/src/contexts/GlobalTrashContext.tsx` | `listing` / `meeting` types |
| `web/src/components/GlobalTrashBin.tsx` | Place icons + `placeItemTrashed` event |
| `server/src/services/place/placeVisibilityService.ts` | Exclude trashed meetings from list |
| `docs/ux/PLATFORM_MANUAL_QA_MATRIX.md` | **Part 2G** Place section |

---

## 3. Trash lifecycle coverage inventory

| Entity | Move to trash | Restore | Permanent delete | UI entry | Global bin | Exception |
|--------|---------------|---------|------------------|----------|------------|-----------|
| Meeting (`meeting`) | ✅ `trashItem` | ✅ GlobalTrashBin | ✅ ConfirmModal | Meetings `DropdownMenu` | ✅ 🏪/📍 icons | Cancel status path deprecated for creator removal |
| Listing (`listing`) | ✅ `trashItem` | ✅ GlobalTrashBin | ✅ ConfirmModal | Listing editor danger zone | ✅ | Publisher admin only |
| Interaction link | ❌ | — | Hard delete | Editor ConfirmModal | — | **Certified exception** — sub-entity, not global trash |
| Graph node (unfollow) | ❌ | — | `removeNode` | Explore/profile ConfirmModal | — | **Certified exception** — relationship edge, not trash entity |
| Cover/avatar image | ❌ | — | Asset remove | ConfirmModal | — | **Certified exception** — media field, not entity |

---

## 4. Error-handling coverage inventory

| Surface | Before | After | Pattern |
|---------|--------|-------|---------|
| `PlaceMeetings` load/create/rsvp/trash/calendar | Silent | Toast + inline retry (load) | N-2 / AI error |
| `PlaceExplore` search/suggestions/dismiss | Silent | Toast | N-2 |
| `PlaceActivityFeed` | Silent | Toast + inline retry | N-2 |
| `PlaceAnalyticsDashboard` | Silent | Toast + inline retry + export toast | N-2 |
| `PlacePrivacySettings` | Silent | Toast | N-2 |
| `PlaceListingEditor` load/save/links | Partial inline | Toast + inline message | N-2 |
| `BusinessProfilePanel` load | Inline text | Unchanged (already visible) | — |
| Dismiss suggestion network offline | — | Toast only (no retry) | **Exception** — low severity |

---

## 5. QA matrix row count

**27 rows** in Part 2G (`PLC-01`–`PLC-27`) covering consumer, publisher, graph, meetings, calendar, mobile, dark mode, trash, accessibility, empty/error.

**Execution:** Not run — Wave **6B-Place-QA** next.

---

## 6. Remaining Place findings

| ID | Status |
|----|--------|
| **P-7** | Engineering done; **375px QA not executed** |
| **P-12** | ReactFlow canvas keyboard traversal partial; focus return from sheets open |
| **P-11** | `PlaceOnboarding`, `UserNode`/`HouseholdNode` inline styles; category dynamic colors |
| **P-13** | Matrix published; **execution open** |
| **Reference UX #6** | Deferred |

---

## 7. Projected scorecard (6B-D)

| # | Category | 6B-C | 6B-D |
|---|----------|------|------|
| 1 | Interaction Consistency | PASS | **PASS** |
| 2 | Layout Consistency | PASS | **PASS** |
| 3 | Navigation | PWF | **PWF** |
| 4 | Accessibility | PWF | **PWF** |
| 5 | Mobile | PWF | **PWF** |
| 6 | Cross-Module Integration | PWF | **PASS** |
| 7 | Error Handling | PWF | **PASS** |
| 8 | Empty States | PASS | **PASS** |
| 9 | Loading States | PASS | **PASS** |
| 10 | Discoverability | PWF | **PWF** |
| 11 | Workflow Completion | PASS | **PASS** |

**Totals:** **7 PASS / 4 PWF / 0 FAIL**

---

## 8. Readiness

| Level | 6B-D |
|-------|------|
| **UX-L1** | **86%** (7/11 PASS; need ≥8 for certification) |
| **UX-L2** | **82%** |
| **UX-L3** | **38%** |

---

## 9. Recommended next wave

**6B-Place-QA** — execute Part 2G matrix (375px, trash restore, dark mode, graph a11y evidence) → first certification review gate.

Then **6B-Place-UX-E** (optional polish): `PlaceOnboarding` Tailwind migration, `UserNode`/`HouseholdNode` tokens, graph focus trap certification.

---

**Last updated:** 2026-06-03 (Wave 6B-Place-UX-D complete)
