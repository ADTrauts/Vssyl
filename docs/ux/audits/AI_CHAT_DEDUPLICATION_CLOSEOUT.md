# AI Chat Workspace Deduplication Closeout (Wave 3C-5)

**Status:** **Done**  
**Date:** 2026-06-03  
**Mode:** Implementation + certification  
**Scope:** AI Chat only — no PlatformShell, WorkspaceSplitLayout, or other module changes

---

## 1. Verdict

**PASS** — Single workspace implementation with two thin entry points. `pnpm type-check` PASS. No behavior regressions intended; embedded variant preserves prior `AIChatModule` semantics (non-streaming twin, `provider: 'auto'`, simpler chrome).

---

## 2. Target Architecture (achieved)

```txt
web/src/app/ai-chat/page.tsx          → AIChatWorkspace variant="page"
web/src/components/ai/AIChatModule.tsx → AIChatWorkspace variant="embedded"
web/src/components/ai/AIChatWorkspace.tsx  ← single source of truth
```

---

## 3. Duplication Inventory

| Region | Page (`variant="page"`) | Embedded (`variant="embedded"`) | Shared in `AIChatWorkspace` |
|--------|-------------------------|----------------------------------|-----------------------------|
| Workspace structure | `h-full flex` sidebar + main | Same layout pattern | Yes — one component |
| Sidebar | Search, archive toggle, suggestions, DropdownMenu per conv | Search, archive toggle, pin/more buttons | Variant branch in render |
| Conversation list | Pinned + regular, rename, share, confirm trash | Pinned + recent, direct delete | Shared state + handlers |
| Header | Provider/model picker, workspace AI, explain | Pin / Archive / Delete buttons | Variant branch |
| Message panel | Full features (images, expenses, explain) | Core message rendering | Shared render path (embedded subset) |
| Input / composer | Attach, image gen, voice, provider | Attach + send only | Variant branch |
| Menus | `DropdownMenu`, `ConfirmModal` trash | Stub `MoreVertical` (pre-existing) | Page-only modals gated |
| Providers | `AIProviderModelPicker`, preferences | `provider: 'auto'` | Embedded twin path |
| Hooks / effects | URL `fileIds`, suggestions poll, model load | Dashboard prop overrides | Gated by `isEmbedded` |
| Loading | Inline sidebar spinner | Full-page spinner | Variant branch |
| Twin API | SSE streaming (`stream: true`) | `authenticatedApiCall` JSON | Branch in `handleAIQuery` |

### Classification

| Category | Items |
|----------|-------|
| **Shared** | Conversation CRUD, trash, file attach, message normalization, auto-scroll, drag-drop upload |
| **Page-only** | Streaming, provider/model picker, suggestions, learning notice, explain drawer, workspace AI drawer, image gen/edit, voice, URL pre-attach, confirm trash modal |
| **Embedded-only** | Prop-driven `dashboardId` / `dashboardType` / `dashboardName`; client-side archive filter; non-streaming twin |
| **Module-only (unchanged elsewhere)** | `AIChatDropdown`, `AIWidget` — out of 3C-5 scope |

---

## 4. Components Extracted

| Component | Path | Role |
|-----------|------|------|
| **AIChatWorkspace** | `web/src/components/ai/AIChatWorkspace.tsx` | Full workspace implementation |
| **AIChatModule** | `web/src/components/ai/AIChatModule.tsx` | Thin embedded entry (21 LOC) |
| **AIChatPage** | `web/src/app/ai-chat/page.tsx` | Thin route entry (7 LOC) |

Sub-component split (`AIChatSidebar`, `AIChatConversationPane`, `AIChatComposer`) **deferred** — variant branches inside `AIChatWorkspace` avoid over-engineering for this wave.

---

## 5. LOC Impact

| File | Before | After | Δ |
|------|-------:|------:|--:|
| `ai-chat/page.tsx` | ~2517 | 7 | −2510 |
| `AIChatModule.tsx` | ~1050 | 21 | −1029 |
| `AIChatWorkspace.tsx` | — | 3045 | +3045 |
| **Net (3 files)** | ~3567 | 3073 | **−494** |

Duplicated shell logic eliminated from entry points; consolidated workspace is ~528 LOC larger than former page alone due to embedded variant UI branch.

---

## 6. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| Duplicate workspace shell in entry points | **None** — both delegate to `AIChatWorkspace` |
| Broken imports | **None** |
| PlatformShell / WorkspaceSplitLayout touched | **No** |
| Manual UI QA | **Pending** (recommended: `/ai-chat` + embedded `AIChatModule` mount) |

---

## 7. Remaining AI Duplication (out of scope)

| Surface | Notes |
|---------|-------|
| `AIChatDropdown` | Separate overlay shell; shares `aiResponseHandler` only |
| `AIWidget` | Business/personal dashboard widget; different UX model |
| Embedded `MoreVertical` stub | Pre-existing hygiene debt — no menu renders |
| Page vs embedded visual parity | Intentional — embedded keeps simpler chrome |

---

## 8. Recommended Next Wave

**3C-6** — Notifications double chrome (`PageHeader` + remove duplicate global header) per [`LAYOUT_SHELL_STANDARDIZATION_REVIEW.md`](../LAYOUT_SHELL_STANDARDIZATION_REVIEW.md).

Alternative: **3B** ConfirmModal purge (43 confirms remaining per Batch 2 closeout).

**Do not start:** 3C-6 and 3B in parallel without explicit prioritization.
