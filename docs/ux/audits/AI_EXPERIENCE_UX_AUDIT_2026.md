# AI Experience UX Audit (Wave 5H-AI-UX-A)

**Status:** **Complete** — audit and baseline only  
**Date:** 2026-06-12  
**Module family:** AI Experience (`ai`, `ai-chat`, embedded twin)  
**Wave:** **5H-AI-UX-A**  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md), [`UX_CONSTITUTION.md`](../UX_CONSTITUTION.md)  
**Benchmarks:** [`REFERENCE_MODULE_DRIVE.md`](./REFERENCE_MODULE_DRIVE.md), [`REFERENCE_MODULE_NOTIFICATIONS.md`](./REFERENCE_MODULE_NOTIFICATIONS.md), [`REFERENCE_MODULE_TODO.md`](./REFERENCE_MODULE_TODO.md), [`REFERENCE_MODULE_CALENDAR.md`](./REFERENCE_MODULE_CALENDAR.md)

> **Audit only.** No engineering, no certification awards, no AI Platform certification changes.

---

## Executive summary

| Metric | Value |
|--------|-------|
| **PASS / PWF / FAIL** | **3 / 6 / 2** |
| **UX-L1 readiness** | **42%** |
| **UX-L2 readiness** | **28%** |
| **UX-L3 readiness** | **15%** |
| **Reference UX #4** | **Deferred** (reserved holder — **Conditional Yes**) |
| **P1 findings** | **3** (AI-1, AI-2, AI-3) |

**Headline:** AI Experience has **strong error handling, loading, and Drive/trash integration** on the **page** `/ai-chat` variant, but **fails layout and mobile bars** versus registered references. **Embedded** `AIChatModule` has **interaction safety gaps** (direct delete, dead overflow menu) that mirror pre-5B Chat. **3C-5** consolidated code; **layout and certification waves were explicitly deferred**.

---

## 1. Scope and surface inventory

### 1.1 Primary workspace (`AIChatWorkspace`)

| Variant | Entry | Layout | Interaction highlights |
|---------|-------|--------|------------------------|
| **page** | `/ai-chat` → `variant="page"` | Custom flex sidebar + main | `ConfirmModal` delete; `DropdownMenu`; streaming; provider picker; explain drawer |
| **embedded** | `AIChatModule` | Fixed `w-80` sidebar + main | **Direct delete**; **stub MoreVertical**; non-streaming twin; `provider: 'auto'` |

**Evidence:** [`AI_CHAT_DEDUPLICATION_CLOSEOUT.md`](./AI_CHAT_DEDUPLICATION_CLOSEOUT.md); `AIChatWorkspace.tsx` lines 1637–1830 (embedded branch).

### 1.2 AI Identity control center (`/ai`)

| Tab | Component | User-facing purpose |
|-----|-----------|---------------------|
| Identity | `AIIdentityHome` | Twin snapshot |
| Learning | `AILearningHub` | Learning events |
| Suggestions | `AmbientSuggestionsView` | Ambient suggestions |
| Memory | `AIMemoriesView` + `CustomContext` | Memory + custom context |
| Behavior | `AIBehaviorHub` | Personality / autonomy |
| More | `ProviderSettings`, `AutonomousActions`, `AIIntelligenceHub` | Provider + insights |

**Layout:** `container mx-auto p-6` + shared `Tabs` — **management-adjacent**, not workspace split (**AI-5**).

### 1.3 Auxiliary surfaces (in family)

| Surface | Path | Notes |
|---------|------|-------|
| `AIChatDropdown` | Platform header | Portal panel; `ConfirmModal` + `DropdownMenu` per 3A-4A |
| `AIWidget` | Dashboard / business workspace | Compact widget — different UX model (**AI-13**) |
| `WorkspaceAIDrawer` | Business chat header | Policy digest; good `aria-modal` |
| `AIResponseExplainDrawer` | Page workspace | Explainability — discoverability strength |
| Business route | `/business/.../workspace/ai` | `BusinessAIControlCenter` — admin-leaning; out of deep audit |

### 1.4 Prior waves (relevant)

| Wave | Contribution | UX debt retained |
|------|--------------|------------------|
| **3A-4A** | `DropdownMenu` on conversation menus + pickers | QA unsigned (**AI-11**) |
| **3C-5** | Single `AIChatWorkspace` | Layout shell **not** adopted |

---

## 2. Eleven-category audit

### Category 1 — Interaction Consistency → **PASS WITH FINDINGS**

| Check | Page | Embedded | Reference bar |
|-------|------|----------|---------------|
| Conversation delete | `ConfirmModal` → `trashItem` | Direct `trashItem` (**AI-1**) | Todo/Calendar: confirm all paths |
| Conversation menu | `DropdownMenu` + `buildConversationMenuItems` | `MoreVertical` stub (**AI-2**) | 3A-4A certified |
| Drag-to-trash | `handleDragStart` → global bin | Not on embedded list | Drive/Todo pattern |
| Pin / archive | Menu + header actions | Header buttons | Consistent on both |
| Native dialogs | **0** | **0** | ✅ |

**Rating:** **PWF** — page path meets Drive 3B bar; embedded path does not.

### Category 2 — Layout Consistency → **FAIL**

| Check | Result |
|-------|--------|
| `WorkspaceSplitLayout` on `/ai-chat` | **Absent** (**AI-4**) |
| `PageHeader` + `PageToolbar` | **Absent** |
| `PlatformShell` / `DashboardLayout` wrapper only | Layout via `ai-chat/layout.tsx` → `DashboardLayout` — shell inherited, **workspace chrome bespoke** |
| `/ai` identity | Separate `container` + `Tabs` archetype (**AI-5**) |
| Monolith size | ~3045 LOC (**AI-9**) |

**Reference comparison:**

| Module | Shell |
|--------|-------|
| Todo #3 | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` |
| Calendar #5 | `CalendarPageShell` |
| Notifications #2 | `PageHeader` + `PageToolbar` |
| **AI Experience** | **Custom flex columns** |

**Rating:** **FAIL** — violates [`UX_CONSTITUTION.md`](../UX_CONSTITUTION.md) Rule 3 (approved layout pattern) on primary chat route.

### Category 3 — Navigation → **PASS WITH FINDINGS**

| Entry | Target |
|-------|--------|
| `/ai-chat` | Full workspace |
| `/ai` | Identity/settings; "Open chat" → `/ai-chat` |
| Header `AIChatDropdown` | Overlay chat |
| Dashboard `AIWidget` | Widget |
| Business workspace `case 'ai'` | `AIWidget` not full module (**AI-14**) |

**Rating:** **PWF** — journeys exist but **no single hub pattern** like `TodoWorkspaceLanding` (**AI-12**).

### Category 4 — Accessibility → **PASS WITH FINDINGS**

| Check | Result |
|-------|--------|
| `aria-label="Conversation options"` | Page header menu ✅ |
| `WorkspaceAIDrawer` | `aria-modal`, `aria-labelledby` ✅ |
| Embedded icon buttons | No labels (**AI-8**) |
| Keyboard shortcuts help | **Absent** |
| Rename inline | Enter/Escape only |

**Rating:** **PWF** — baseline labels on page; embedded sparse.

### Category 5 — Mobile → **FAIL**

| Check | Result |
|-------|--------|
| Embedded `w-80` sidebar | Fixed width — crowds 375px viewport (**AI-6**) |
| Page sidebar | No collapsible sheet (Calendar 3C-7B pattern) |
| Manual 375px QA | **None** |

**Rating:** **FAIL** — no responsive certification evidence; structural fixed sidebar.

### Category 6 — Cross-Module Integration → **PASS**

| Integration | Evidence |
|-------------|----------|
| **Drive** | Attach, upload, save generated/edited images, `fileIds` URL pre-attach |
| **Global Trash** | `trashItem` type `ai_conversation`, moduleId `ai-chat` |
| **AI Identity** | Link `/ai` for memory/behavior/provider |
| **Business** | `WorkspaceAIDrawer` policy digest |
| **Suggestions** | Accept/dismiss ambient suggestions in sidebar |

**Rating:** **PASS** — strongest category; exceeds Chat 5B.3 cross-module at audit time.

### Category 7 — Error Handling → **PASS**

Extensive `toast.error` on twin failures, uploads, voice, trash, rename, suggestions. Inline `authError` / `conversationError` recovery banners.

**Rating:** **PASS** — matches Notifications 5G N-2 remediation standard on primary paths.

### Category 8 — Empty States → **PASS WITH FINDINGS**

Custom inline empty UI with Brain/MessageSquare icons + CTAs (`Start New Conversation`). Not shared `EmptyState` (**AI-7**).

**Rating:** **PWF** — intentional; Todo T-8 pattern not adopted.

### Category 9 — Loading States → **PASS**

`Spinner` on conversations/messages; `AIThinkingIndicator`; streaming partial render; embedded full-page load gate.

**Rating:** **PASS**.

### Category 10 — Discoverability → **PASS WITH FINDINGS**

Page: `AIProviderModelPicker`, explain drawer, suggestions, learning notice. Embedded: reduced chrome; dead overflow (**AI-2**).

**Rating:** **PWF**.

### Category 11 — Workflow Completion → **PASS WITH FINDINGS**

Page: complete send/stream/attach/delete/archive journey. Embedded: unsafe delete + menu dead-end (**AI-1**, **AI-2**).

**Rating:** **PWF**.

---

## 3. Authoritative scorecard totals

| # | Category | Rating |
|---|----------|--------|
| 1 | Interaction Consistency | **PWF** |
| 2 | Layout Consistency | **FAIL** |
| 3 | Navigation | **PWF** |
| 4 | Accessibility | **PWF** |
| 5 | Mobile | **FAIL** |
| 6 | Cross-Module Integration | **PASS** |
| 7 | Error Handling | **PASS** |
| 8 | Empty States | **PWF** |
| 9 | Loading States | **PASS** |
| 10 | Discoverability | **PWF** |
| 11 | Workflow Completion | **PWF** |

| Metric | Count |
|--------|------:|
| **PASS** | **3** |
| **PWF** | **6** |
| **FAIL** | **2** |

---

## 4. Readiness percentages

### 4.1 Methodology

Weighted model aligned with [`CHAT_UX_MODERNIZATION_REASSESSMENT.md`](./CHAT_UX_MODERNIZATION_REASSESSMENT.md) and [`TODO_UX_L3_READINESS_REVIEW.md`](./TODO_UX_L3_READINESS_REVIEW.md).

### 4.2 UX-L1 readiness: **42%**

| Factor | Weight | Score | Weighted |
|--------|--------|-------|----------|
| PASS toward L1 bar (3/8) | 35% | 3.75 | 13.1 |
| L1-gated cats 1,3,4,7 clear | 25% | 10.0 | 25.0 |
| P1 findings open (3) | 20% | 4.0 | 8.0 |
| Interaction page path strong | 20% | 7.0 | 14.0 |
| **Subtotal** | | | **60.1** → **adjusted 42%** |

*Adjustment:* −18 for **2 FAIL** categories and **zero QA** — first-audit penalty.

### 4.3 UX-L2 readiness: **28%**

| Factor | Weight | Notes |
|--------|--------|-------|
| PASS toward L2 (3/9) | 30% | 33% raw |
| FAIL in cats 2+5 | 25% | **Blocks L2 rules** |
| Layout/menu debt | 25% | Behind all registered refs |
| No QA matrix | 20% | **0%** |

### 4.4 UX-L3 readiness: **15%**

L2 unmet; core quartet includes cat **2 FAIL**; cat **5 FAIL**; process gate AI-10 open. Below Chat reassessment L3 (28%) due to layout FAIL.

---

## 5. Full findings register

| ID | Finding | Severity | Category | Remediation wave |
|----|---------|----------|----------|------------------|
| **AI-1** | Embedded `handleDeleteConversation` bypasses `ConfirmModal` | **P1** | 1, 11 | **5H-AI-UX-B** |
| **AI-2** | `embeddedMoreMenuId` — `MoreVertical` renders no `DropdownMenu` | **P1** | 1, 10, 11 | **5H-AI-UX-B** |
| **AI-3** | Page vs embedded parity (confirm, menus, streaming, provider) | **P1** | 1, 3, 10 | **5H-AI-UX-B** |
| **AI-4** | `/ai-chat` lacks certified layout shell | **P2** | 2 | **5H-AI-UX-B** |
| **AI-5** | `/ai` identity bespoke tabs layout | **P2** | 2, 3 | Post-L2 optional |
| **AI-6** | Fixed `w-80` sidebar; no 375px mobile sheet | **P2** | 5 | **5H-AI-UX-C** |
| **AI-7** | Inline empty states vs shared `EmptyState` | **P2** | 8 | **5H-AI-UX-C** |
| **AI-8** | Missing `aria-label` on embedded icon actions | **P2** | 4 | **5H-AI-UX-C** |
| **AI-9** | `AIChatWorkspace` monolith (~3045 LOC) | **P2** | 2 | Defer split post-L2 |
| **AI-10** | No platform manual QA Part 2F | **P3** | Process | **5H-AI-UX-D** |
| **AI-11** | 3A-4A menu QA unsigned | **P3** | Process | **5H-AI-UX-D** |
| **AI-12** | Fragmented navigation across AI entry points | **P3** | 3 | Optional hub wave |
| **AI-13** | `AIChatDropdown` / `AIWidget` separate UX models | **P3** | 3, 10 | Long-term consolidation |
| **AI-14** | Business workspace `AIWidget` vs `AIChatModule` | **P3** | 3 | Product decision |
| **AI-15** | Drag-to-trash confirm parity undocumented | **P3** | 1 | **5H-AI-UX-D** QA |

---

## 6. Gap analysis vs Reference UX modules

### 6.1 Scorecard comparison

| Module | UX ref | PASS | PWF | FAIL | UX-L3 |
|--------|--------|------|-----|------|-------|
| **AI Experience** | #4 deferred | **3** | **6** | **2** | None |
| Todo | #3 | 11 | 0 | 0 | Certified |
| Notifications | #2 | 11 | 1 | 0 | CwF |
| Calendar | #5 | 11 | 0 | 0 | Certified |
| Chat (peer) | Rejected | 6 | 5 | 0 | None |

### 6.2 Pattern gaps

| Pattern | Drive #1 | Todo #3 | Notifications #2 | Calendar #5 | **AI Experience** |
|---------|----------|---------|------------------|-------------|-------------------|
| Layout shell | `WorkspaceSplitLayout` | ✅ | `PageHeader`+`Toolbar` | `CalendarPageShell` | **❌ Bespoke** |
| Delete confirm all surfaces | ✅ | ✅ | ✅ | ✅ | **❌ Embedded gap** |
| Shared `EmptyState` | Partial | ✅ | Partial | ✅ | **❌** |
| Mobile 375px QA | Partial | ✅ | ✅ | ✅ | **❌** |
| Manual QA matrix | F-1 | Part 2C | Part 2B | Part 2D | **❌ None** |
| Distinctive strength | Files/trash | Multi-view tasks | Inbox routing | Time-grid | **Twin/stream/attach/explain** |

**Teaching value today:** AI Experience is an **informal** copy target for **streaming twin UX**, **Drive attachment in chat**, and **explain drawer** — not registrable until layout/interaction/mobile parity.

---

## 7. Reference UX #4 readiness

| Criterion | Status |
|-----------|--------|
| Program reservation | ✅ [`REFERENCE_UX_4_STRATEGIC_REVIEW.md`](./REFERENCE_UX_4_STRATEGIC_REVIEW.md) |
| UX-L3 CwF minimum | ❌ |
| 11-category baseline | ✅ This audit |
| Distinct archetype | ✅ Only conversational AI workspace candidate |
| QA evidence | ❌ |

| Assessment | **Deferred** |
|------------|--------------|

**Not Eligible** today. **Not Rejected** — strategic reservation stands.

---

## 8. Recommended modernization roadmap

### Wave 5H-AI-UX-B — Interaction + layout (engineering)

| Task | Findings | Deliverable |
|------|----------|-------------|
| Wire embedded delete through `requestDeleteConversation` + `ConfirmModal` | AI-1 | Interaction parity |
| Implement embedded `DropdownMenu` using `buildConversationMenuItems` | AI-2 | Menu parity |
| Adopt `WorkspaceSplitLayout` (or document certified AI workspace exception) on `/ai-chat` | AI-4 | Layout FAIL → PWF/PASS |
| Align page/embedded destructive paths | AI-3 | Single contract |

**Effort:** **Medium — 5–8 days**  
**Projected scorecard:** **7–8 PASS / 3–4 PWF / 0–1 FAIL**

### Wave 5H-AI-UX-C — Mobile + polish (engineering)

| Task | Findings |
|------|----------|
| Collapsible mobile sidebar sheet (Calendar 3C-7B pattern) | AI-6 |
| Shared `EmptyState` for conversation/message zero states | AI-7 |
| `aria-label` on embedded pin/delete/menu triggers | AI-8 |

**Effort:** **Medium — 3–5 days**  
**Projected:** Cat **5** FAIL → PASS; cat **8** PWF → PASS

### Wave 5H-AI-UX-D — QA + certification review (process)

| Task | Findings |
|------|----------|
| Publish `PLATFORM_MANUAL_QA_MATRIX.md` **Part 2F — AI Experience** | AI-10 |
| Execute QA-EXEC + evidence folder | AI-10, AI-11, AI-15 |
| Documentation re-cert → projected **UX-L1 CwF** or **UX-L2 CwF** | — |
| Reference UX #4 registration prep (no award) | — |

**Effort:** **~4h QA + 0.5 day docs**  
**Prerequisite for UX-L3 and Reference #4**

### Sequencing

```txt
5H-AI-UX-A (this audit) ✅
    ↓
5H-AI-UX-B (interaction + layout)
    ↓
5H-AI-UX-C (mobile + a11y + empty) — may overlap late B
    ↓
5H-AI-UX-D (QA + cert review)
    ↓
Reference UX #4 registration review (future — not D)
```

**Parallel:** Chat **5H-Chat-L2** is independent; AI UX #4 path should **not** be deprioritized below Chat if slot reservation holds.

---

## 9. Strategic recommendation — UX #4 holder

| Outcome | Selected |
|---------|----------|
| **Yes** — remain reserved holder | |
| **No** — reassign slot | |
| **Conditional Yes** | ✅ **Selected** |

**Rationale:**

1. **Archetype uniqueness** — No registered reference covers twin/chat workspace (streaming, provider picker, explain, attachments).
2. **Audit confirms gaps are remediable** — Same class as Chat 5B.1–5B.2 + Todo 5D.3 (interaction + layout), not product backlog like Chat C-5/C-6.
3. **FAIL count (2)** is lower scope than Chat's initial layout+interaction spread once embedded path fixed.
4. **Place / Dashboard / Business Workspace** remain inferior fits per [`REFERENCE_UX_4_STRATEGIC_REVIEW.md`](./REFERENCE_UX_4_STRATEGIC_REVIEW.md).

**Condition:** Retain reservation **only if** **5H-AI-UX-B/C/D** complete within platform UX roadmap; otherwise revisit at **#6 Place** expansion.

---

## 10. Evidence index

| Artifact | Path |
|----------|------|
| Scorecard | [`AI_EXPERIENCE_UX_SCORECARD.md`](./AI_EXPERIENCE_UX_SCORECARD.md) |
| Certification record | [`AI_EXPERIENCE_UX_CERTIFICATION.md`](./AI_EXPERIENCE_UX_CERTIFICATION.md) |
| 3C-5 closeout | [`AI_CHAT_DEDUPLICATION_CLOSEOUT.md`](./AI_CHAT_DEDUPLICATION_CLOSEOUT.md) |
| 3A-4A menus | [`AI_MENU_ROLLOUT_CLOSEOUT.md`](./AI_MENU_ROLLOUT_CLOSEOUT.md) |
| UX #4 strategy | [`REFERENCE_UX_4_STRATEGIC_REVIEW.md`](./REFERENCE_UX_4_STRATEGIC_REVIEW.md) |

---

**Last updated:** 2026-06-12 (Wave 5H-AI-UX-A complete — audit only)
