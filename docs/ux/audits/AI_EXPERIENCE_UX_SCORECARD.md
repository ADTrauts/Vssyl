# AI Experience UX Scorecard (Wave 5H-AI-L1L2-D certified)

**Status:** **5H-AI-L1L2-D certified** — UX-L1 + UX-L2 + UX-L3 CwF awarded  
**Date:** 2026-06-03  
**Review:** [`AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md`](./AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md)  
**Prior:** 5H-AI-UX-D post-QA (**10 PASS / 1 PWF / 0 FAIL** pre AI-9 reclassification)  
**Module family:** AI Experience (`ai`, `ai-chat`, embedded twin surfaces)  
**Benchmark:** Drive / File Hub — Reference UX Module #1  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md) (Wave 5A)  
**Audit:** [`AI_EXPERIENCE_UX_AUDIT_2026.md`](./AI_EXPERIENCE_UX_AUDIT_2026.md)

---

## Scope reviewed

| Area | Paths |
|------|-------|
| Chat workspace | `web/src/components/ai/AIChatWorkspace.tsx` |
| Embedded entry | `web/src/components/ai/AIChatModule.tsx` |
| Routes | `web/src/app/ai-chat/*`, `web/src/app/ai/*` |
| Business AI route | `web/src/app/business/[id]/workspace/ai/page.tsx` (user-facing subset) |
| Side panels / explain | `WorkspaceAIDrawer.tsx`, `AIResponseExplainDrawer.tsx` |
| Attachments | `AIFileUpload.tsx` (via workspace) |
| Provider / model | `AIProviderModelPicker.tsx` |
| Global entry (in family) | `web/src/components/header/AIChatDropdown.tsx` |
| Dashboard widget (in family) | `web/src/components/widgets/AIWidget.tsx` |

**Out of scope:** AI Platform governance, ActionExecutor, admin AI console, pipeline diagnostics.

---

## Category results (5H-AI-L1L2-D authoritative)

| # | Category | Rating | Rationale |
|---|----------|--------|-----------|
| 1 | **Interaction Consistency** | **PASS** | Part 2F §2–3: delete confirm, menus, drag-to-trash **PASS**. |
| 2 | **Layout Consistency** | **PASS** | `AIChatPageShell` + `PageHeader` QA-verified (AI-01/02); **AI-9** non-scorecard debt. |
| 3 | **Navigation** | **PASS** | Part 2F §1: AI-01–05 **PASS** (AI-06 BLOCKED — account). |
| 4 | **Accessibility** | **PASS** | Part 2F §5: AI-18–20 **PASS**; **R-AI-3** keyboard help deferred. |
| 5 | **Mobile** | **PASS** | Part 2F §4: AI-15, AI-17 **PASS**; **R-AI-2** AI-16 BLOCKED. |
| 6 | **Cross-Module Integration** | **PASS** | Drive attach, global trash, identity bridge. |
| 7 | **Error Handling** | **PASS** | Toast + inline error banners. |
| 8 | **Empty States** | **PASS** | Part 2F §6: AI-21, AI-22 **PASS**. |
| 9 | **Loading States** | **PASS** | Spinners, streaming, thinking indicator. |
| 10 | **Discoverability** | **PASS** | AI-05 **PASS**; widget parity AI-09 (code). |
| 11 | **Workflow Completion** | **PASS** | Destructive + menu flows **PASS** (AI-07–14). |

### 5H-AI-UX-D post-QA (historical)

| # | Category | Rating |
|---|----------|--------|
| 1–11 | (see 5H-D) | 10–11 PASS / 1 PWF (cat 2) / 0 FAIL |

### 5H-AI-UX-C projected (historical)

| # | Category | Rating |
|---|----------|--------|
| 1 | Interaction Consistency | PASS |
| 2 | Layout Consistency | PWF |
| 3 | Navigation | PASS |
| 4–5, 10 | Accessibility / Mobile / Discoverability | PWF |
| 6–9, 11 | (see 5H-C closeout) | PASS |

### 5H-AI-UX-B projected (historical)

| # | Category | Rating |
|---|----------|--------|
| 1 | Interaction Consistency | PASS |
| 2 | Layout Consistency | PWF |
| 3 | Navigation | PWF |
| 4–5 | Accessibility / Mobile | PWF |
| 6–9, 11 | (see 5H-B closeout) | PASS |
| 10 | Discoverability | PWF |

---

## Category results (5H-AI-UX-B projected — superseded)

| # | Category | Rating | Rationale |
|---|----------|--------|-----------|
| 1 | **Interaction Consistency** | **PASS** | Unified delete via `ConfirmModal`; functional `DropdownMenu` on all variants; embedded duplicate removed (**AI-1–3** resolved). |
| 2 | **Layout Consistency** | **PASS WITH FINDINGS** | `/ai-chat`: `PageHeader`, `PageToolbar`, `WorkspaceSplitLayout` via `AIChatPageShell`. `/ai`: `PageHeader` + tab exception doc (**AI-4**, **AI-5**). Monolith size remains (**AI-9**). |
| 3 | **Navigation** | **PASS WITH FINDINGS** | Cross-links unchanged; business hub gap (**AI-12**) open. |
| 4 | **Accessibility** | **PASS WITH FINDINGS** | Icon actions labeled (**AI-8**); keyboard shortcuts help still absent. |
| 5 | **Mobile** | **PASS WITH FINDINGS** | Calendar 3C-7B sheet in `AIChatPageShell` (**AI-6**); no 375px QA evidence (**AI-10**). |
| 6 | **Cross-Module Integration** | **PASS** | Unchanged — Drive, trash, identity bridge. |
| 7 | **Error Handling** | **PASS** | Unchanged. |
| 8 | **Empty States** | **PASS** | `AIChatEmptyState` + shared `EmptyState` (**AI-7**). |
| 9 | **Loading States** | **PASS** | Unchanged. |
| 10 | **Discoverability** | **PASS WITH FINDINGS** | Page controls intact; embedded `provider: 'auto'` by design. |
| 11 | **Workflow Completion** | **PASS** | Safe destructive flows on all variants. |

### 5H-AI-UX-A baseline (historical)

| # | Category | Rating |
|---|----------|--------|
| 1 | Interaction Consistency | PWF |
| 2 | Layout Consistency | **FAIL** |
| 3 | Navigation | PWF |
| 4 | Accessibility | PWF |
| 5 | Mobile | **FAIL** |
| 6–11 | (see audit) | 3 PASS / 4 PWF |

---

## Category results (5H-AI-UX-A authoritative — superseded for ratings)

| # | Category | Rating | Rationale |
|---|----------|--------|-----------|
| 1 | **Interaction Consistency** | **PASS WITH FINDINGS** | Page variant: `DropdownMenu` + `ConfirmModal` → `trashItem` on conversation delete (3A-4A). Drag-to-trash on page sidebar. **Findings:** embedded variant direct delete without confirm (**AI-1**); `embeddedMoreMenuId` stub — overflow menu non-functional (**AI-2**). |
| 2 | **Layout Consistency** | **FAIL** | Bespoke `h-full flex` sidebar + main in `AIChatWorkspace` (~3045 LOC). No `WorkspaceSplitLayout`, `PageHeader`, or `PlatformShell` on `/ai-chat` (3C-5 deferred). `/ai` identity uses `container mx-auto` + `Tabs` — separate archetype (**AI-4**, **AI-5**). |
| 3 | **Navigation** | **PASS WITH FINDINGS** | `/ai-chat`, `/ai`, header `AIChatDropdown`, dashboard `AIWidget`, business `AIWidget` — cross-linked but fragmented. No unified hub landing in business workspace switch (**AI-12**, **AI-14**). |
| 4 | **Accessibility** | **PASS WITH FINDINGS** | Page header menu `aria-label="Conversation options"`. `WorkspaceAIDrawer` dialog labels. **Gaps:** embedded pin/delete/MoreVertical without `aria-label` (**AI-8**); no keyboard shortcuts help. |
| 5 | **Mobile** | **FAIL** | Embedded layout uses fixed `w-80` sidebar; page variant no collapsible mobile sheet. No 375px certification evidence (**AI-6**). |
| 6 | **Cross-Module Integration** | **PASS** | Drive attach/upload/save; `trashItem` global trash (`ai_conversation`); `/ai` identity bridge; business `WorkspaceAIDrawer` policy digest. |
| 7 | **Error Handling** | **PASS** | Extensive `toast.error` on twin, upload, voice, trash, rename; inline `authError` / `conversationError` banners. |
| 8 | **Empty States** | **PASS WITH FINDINGS** | Intentional inline empty UI + CTAs in workspace and `/ai`. Not shared `EmptyState` primitive (**AI-7**). |
| 9 | **Loading States** | **PASS** | Conversation/message spinners; `AIThinkingIndicator`; streaming state; suggestion load. |
| 10 | **Discoverability** | **PASS WITH FINDINGS** | Page: provider/model picker, explain drawer, suggestions strip. Embedded: `provider: 'auto'` only; dead overflow (**AI-2**, **AI-3**). |
| 11 | **Workflow Completion** | **PASS WITH FINDINGS** | Page: send → stream → attach → archive/pin/delete completable. Embedded: delete unsafe; overflow menu dead-end (**AI-1**, **AI-2**). |

---

## Summary metrics

| Metric | 5H-AI-UX-A | 5H-B | 5H-C | 5H-D | **5H-L1L2-D** |
|--------|------------|------|------|------|----------------|
| **PASS** | 3 | 7 | 8 | 10–11 | **11** |
| **PASS WITH FINDINGS** | 6 | 4 | 3 | 1 | **0** |
| **FAIL** | 2 | 0 | 0 | 0 | **0** |

---

## Certification levels (awarded)

| Level | **5H-AI-L1L2-D** |
|-------|-------------------|
| **UX-L1 Certified** | **Awarded** |
| **UX-L2 Certified** | **Awarded** |
| **UX-L3 Certified with Findings** | **Awarded** (first AI L3) |
| **UX-L3 Certified** (strict) | Not met — **R-AI-3** keyboard help |
| **Reference UX #4** | **Approved with Findings** — registered |

---

## Level projections (5H-AI-UX-B — historical)

| Level | Projected | Blocker |
|-------|-----------|---------|
| **UX-L1 Certified** | **Not met** | 3/11 PASS (requires ≥8) |
| **UX-L1 Certified with Findings** | **Plausible post-5H-AI-UX-B** | 6 PWF documented; no FAIL in cats 1, 3, 4, 7 |
| **UX-L2 Certified with Findings** | **Not met** | FAIL cats **2**, **5**; 3 PASS (requires ≥9) |
| **UX-L3** | **Not met** | L2 prerequisite + QA gate |
| **Reference UX #4** | **Deferred** | Requires UX-L3 CwF minimum |

---

## Readiness percentages

| Target | 5H-AI-UX-A | 5H-B | 5H-C | 5H-D | **5H-L1L2-D** |
|--------|------------|------|------|------|----------------|
| **UX-L1 CwF** | 42% | 72% | 88% | 95% | **100%** (awarded) |
| **UX-L2 CwF** | 28% | 58% | 78% | 92% | **100%** (awarded) |
| **UX-L3 CwF** | 15% | 22% | 30% | 38% | **100%** (awarded CwF) |

---

## Open findings

| ID | Status | Summary |
|----|--------|---------|
| AI-1 | **Resolved (5H-B)** | Embedded delete uses `ConfirmModal` |
| AI-2 | **Resolved (5H-B)** | Functional conversation `DropdownMenu` |
| AI-3 | **Resolved (5H-B)** | Unified workspace layout path |
| AI-4 | **Resolved (5H-B)** | `WorkspaceSplitLayout` + page chrome on `/ai-chat` |
| AI-5 | **Resolved (5H-B)** | `PageHeader` on `/ai` + tab exception documented |
| AI-6 | **Resolved (5H-B)** | Mobile sheet pattern |
| AI-7 | **Resolved (5H-B)** | Shared `EmptyState` |
| AI-8 | **Resolved (5H-B)** | `aria-label` on icon actions |
| AI-9 | **Open (non-scorecard)** | Monolith debt — P3 maintainability; not PWF |
| AI-10 | **Resolved (5H-D)** | Part 2F executed |
| AI-11 | **Resolved (5H-D)** | Menu §3 PASS |
| AI-12 | **Resolved (5H-C)** | Canonical navigation model |
| AI-13 | **Resolved (5H-C)** | Widget → `AIChatModule` |
| AI-14 | **Resolved (5H-C)** | `AIWorkspaceLanding` in business hub |
| AI-15 | **Resolved (5H-D)** | Destructive §2 PASS |
| R-AI-1 | **Open** | AI-06 business hub BLOCKED |
| R-AI-2 | **Open** | AI-16 mobile row BLOCKED |
| R-AI-3 | **Open** | Keyboard shortcuts help — L3 CwF driver |
| R-AI-4 | **Open** | Dark mode not matrix-verified |

---

## Wave history

| Wave | Outcome |
|------|---------|
| 3A-4A | Menu primitives on pickers + conversation menus — [`AI_MENU_ROLLOUT_CLOSEOUT.md`](./AI_MENU_ROLLOUT_CLOSEOUT.md) |
| 3C-5 | `AIChatWorkspace` dedup — layout shell **deferred** — [`AI_CHAT_DEDUPLICATION_CLOSEOUT.md`](./AI_CHAT_DEDUPLICATION_CLOSEOUT.md) |
| **5H-AI-UX-A** | Initial formal audit |
| **5H-AI-L1L2-D** | UX-L1/L2/L3 CwF certification review — [`AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md`](./AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md) |
| **5H-AI-UX-D** | Part 2F QA execution — [`AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md`](./AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md) |
| **5H-AI-UX-C** | Navigation + widget parity + Part 2F prep — [`AI_EXPERIENCE_UX_BATCH5H_C_CLOSEOUT.md`](./AI_EXPERIENCE_UX_BATCH5H_C_CLOSEOUT.md) |
| **5H-AI-UX-B** | Interaction + layout + mobile + empty + a11y — [`AI_EXPERIENCE_UX_BATCH5H_B_CLOSEOUT.md`](./AI_EXPERIENCE_UX_BATCH5H_B_CLOSEOUT.md) |

---

## Related

- [`AI_EXPERIENCE_UX_CERTIFICATION.md`](./AI_EXPERIENCE_UX_CERTIFICATION.md)
- [`AI_EXPERIENCE_UX_AUDIT_2026.md`](./AI_EXPERIENCE_UX_AUDIT_2026.md)
- [`REFERENCE_UX_4_STRATEGIC_REVIEW.md`](./REFERENCE_UX_4_STRATEGIC_REVIEW.md)

**Last updated:** 2026-06-03 (Reference UX #4 registered — 5H-AI-Ref4-Registration)
