# Wave 2A-2 — Custom Modal Shell Migration Plan

**Status:** Wave 2A-2 custom-shell migration **complete** (2A-2.1–2.5)  
**Date:** 2026-06-03  
**Prerequisite:** Wave 2A-1 complete — [`shared/src/components/Modal.tsx`](../../shared/src/components/Modal.tsx) tokenized shell  
**Parent review:** [`MODAL_STANDARDIZATION_REVIEW.md`](./MODAL_STANDARDIZATION_REVIEW.md)

---

## Scope

Migrate **overlay shell only** for five candidates onto shared `Modal`. Domain markup, API props, and business logic stay unchanged unless noted.

**Out of scope (unchanged):** `ShareModal`, `ConfirmModal`, `window.confirm`, drawers, popovers, module page refactors beyond listed files.

---

## Canonical shell reference (2A-1)

| Capability | `Modal` behavior |
|------------|------------------|
| Portal | `document.body` |
| Z-index | `9999` overlay / `10000` panel (was `z-50` on custom shells) |
| Open prop | `open` (not `isOpen`) |
| Overlay | `bg-black/50`, backdrop click, Escape |
| Header | Optional `title` + always-visible close (X) |
| Sizes | `small` \| `medium` \| `large` \| `xlarge` (`max-w-sm` … `max-w-5xl`) |
| Layout | `items-start` + scrollable panel (`max-h-[calc(100vh-4rem)]`) |
| A11y | `role="dialog"`, `aria-modal`, `aria-labelledby` when `title` set; initial focus + focus return on close |

**Gaps for large candidates:** No `subtitle`, `footer`, or `hideClose` props. Footers and subtitles live in `children`. Duplicate close controls (X + footer button) are acceptable short-term or footer-only actions can remain while header X is canonical.

---

## Recommended migration order

| Order | File | Rationale |
|-------|------|-----------|
| **1** | `shared/.../ShareLinkModal.tsx` | **Done (2A-2.1)** — composes canonical `Modal` |
| **2** | `web/.../vlink/VLinkShareModal.tsx` | **Done (2A-2.2)** — composes canonical `Modal` |
| **3** | `web/.../modules/DriveModule.tsx` (shortcuts block) | **Done (2A-2.3)** — composes canonical `Modal` |
| **4** | `web/.../ModuleManagementModal.tsx` | **Done (2A-2.4)** — composes canonical `Modal` |
| **5** | `web/.../DashboardBuildOutModal.tsx` | **Done (2A-2.5)** — composes canonical `Modal` |

**Do not reorder ShareModal or add ConfirmModal in this wave.**

---

## Candidate 1 — `ShareLinkModal.tsx`

**Path:** `shared/src/components/ShareLinkModal.tsx`  
**Consumers:** `web/src/components/modules/DriveModule.tsx`, `web/src/app/drive/starred/page.tsx`  
**Public API:** `isOpen`, `onClose`, `itemName`, `itemType`, `shareLink`, `email` — **unchanged**

### Current shell pattern

- Early return `if (!isOpen) return null` (no portal).
- Outer: `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`.
- Inner: `bg-white dark:bg-slate-900 rounded-lg max-w-md shadow-xl`.
- Custom header: `border-b p-4`, title h2, Heroicons close (no Escape listener on document).
- Body: `p-6`; footer: `border-t p-4 bg-gray-50` + Done `Button`.
- **No** `role="dialog"` / `aria-modal` on overlay.

### Shared `Modal` compatibility

| Aspect | Compatible? | Notes |
|--------|-------------|-------|
| Size | **Yes** | `size="medium"` (`max-w-md`) |
| Title | **Yes** | `title="Share Link Generated"` |
| Footer in children | **Yes** | Keep Done + bordered footer inside `children` |
| Dual close | **Yes** | Remove custom header close; keep Modal X + Done |
| Portal / z-index | **Behavior change** | Portal + higher z-index |
| Vertical align | **Minor visual** | Custom centered (`items-center`); Modal `items-start` + `py-v-5` |

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Z-index stacking vs Drive UI | Low | Modal `z-[9999]` typically improves stacking |
| Double padding vs old header/footer | Low | Use `border-t border-v-border` footer; optional `-mx-v-6` only if needed |
| Dark mode tokens vs `dark:bg-slate-900` | Low | Shell uses `v-surface`; inner informational blues stay for now |
| No Escape before | Low | Gain Escape + focus return (improvement) |
| Shared imports `Modal` from same package | Low | `import { Modal } from './Modal'` |

### Exact migration approach

1. `import { Modal } from './Modal'` (and keep `Button`).
2. Replace outer/inner overlay `div`s with:
   ```tsx
   <Modal open={isOpen} onClose={onClose} title="Share Link Generated" size="medium">
     {/* existing body sections without duplicate h2/close */}
     {/* footer block unchanged structurally */}
   </Modal>
   ```
3. Remove custom header row (h2 + X); rely on `title` + Modal close.
4. Remove early-return shell; keep `if (!isOpen)` optional — `Modal` handles `open={false}`.
5. **Do not** change `ShareLinkModalProps` or consumer call sites.

### Validation

- Drive: share to non-user email → link modal opens, copy, Done, Escape, backdrop.
- `drive/starred`: same path.
- Dark mode spot-check.

---

## Candidate 2 — `VLinkShareModal.tsx`

**Path:** `web/src/components/vlink/VLinkShareModal.tsx`  
**Consumer:** `web/src/components/vlink/VLinkDetailView.tsx`  
**Public API:** `open`, `onClose`, `token`, `vlinkId` — **unchanged**

### Current shell pattern

- `if (!open) return null`.
- Outer: `fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4`.
- Inner: `bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4`.
- Inline `h2` title; no overlay click handler; no ARIA dialog roles.
- Footer: secondary `Close` button (redundant with potential header close).

### Shared `Modal` compatibility

| Aspect | Compatible? | Notes |
|--------|-------------|-------|
| Prop name | **Yes** | Already uses `open` |
| Size | **Yes** | `size="large"` (`max-w-lg`) |
| Title | **Yes** | Move h2 to `title="Share V_Link"` |
| Async content | **Yes** | Spinner/list unchanged in `children` |
| Scrim opacity | **Minor** | `bg-black/40` → Modal `bg-black/50` |

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Invite flow while modal open | Low | No change to effects |
| Duplicate Close button | Low | Remove footer Close; keep Modal X only, or keep footer for explicit affordance |
| `Input` focus vs Modal initial focus on X | Low | Accept focus on close first; tab to invite field (document in QA) |
| Toast errors unchanged | None | — |

### Exact migration approach

1. `import { Modal } from 'shared/components'`.
2. Wrap return in `<Modal open={open} onClose={onClose} title="Share V_Link" size="large">`.
3. Move amber disclaimer + member list + invite row into `children` (no outer `p-6` wrapper — Modal supplies padding).
4. Remove outer two `div`s and inline `h2`.
5. Remove footer `Close` **or** keep as secondary — recommend **remove** to avoid triple dismiss (X only).

### Validation

- V_Link detail → Share → load members, invite, Escape, backdrop close.

---

## Candidate 3 — Drive keyboard shortcuts (`DriveModule.tsx`)

**Path:** `web/src/components/modules/DriveModule.tsx` (~lines 2698–2788)  
**State:** `showKeyboardShortcutsHelp`  
**Consumers:** Self-contained in Drive module only

### Current shell pattern

- Conditional JSX block (not a separate component).
- Outer: `fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center`, `onClick` closes, `role="dialog"`, `aria-modal`, `aria-labelledby`.
- Inner: `stopPropagation`, `max-w-md`, custom header (Keyboard icon + h2 + X), body sections, footer `Button` Close.
- Escape: documented in help text only; overlay click closes.

### Shared `Modal` compatibility

| Aspect | Compatible? | Notes |
|--------|-------------|-------|
| Inline replacement | **Yes** | Import `Modal` from `shared/components` (already imports Share modals) |
| Title / a11y | **Yes** | `title="Keyboard Shortcuts"` restores `aria-labelledby` via Modal |
| Icon in header | **Partial** | `title` is string-only; icon left-of-title not supported — drop icon or use `headerActions` (icon right) |
| Footer Close | **Yes** | Keep full-width primary Close in `children` + Modal X |
| Touch large file | **Medium** | Edit only trailing JSX block; no logic changes |

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Merge conflicts on `DriveModule.tsx` | Medium | Single hunk; avoid formatting whole file |
| Header icon removal | Low | Document in QA; optional `headerActions={<Keyboard />}` (right side) |
| Regression on share modals in same file | Low | Do not edit ShareLinkModal usage in same PR hunk |
| Focus lands on X not Close button | Low | Expected Modal behavior |

### Exact migration approach

1. Add `Modal` to existing `shared/components` import line.
2. Replace `{showKeyboardShortcutsHelp && ( <div...> )}` with:
   ```tsx
   <Modal
     open={showKeyboardShortcutsHelp}
     onClose={() => setShowKeyboardShortcutsHelp(false)}
     title="Keyboard Shortcuts"
     size="medium"
   >
     {/* existing body div content without outer shell/header duplicate */}
   </Modal>
   ```
3. Remove inner overlay `div`, duplicate h2/close row (keep kbd help content + footer Button).
4. **Do not** extract to new file in 2A-2 (minimize scope).

### Validation

- Drive → open keyboard shortcuts help → read content, Close, X, Escape, backdrop.

---

## Candidate 4 — `ModuleManagementModal.tsx`

**Path:** `web/src/components/ModuleManagementModal.tsx`  
**Consumer:** `web/src/app/dashboard/DashboardClient.tsx`  
**Public API:** `isOpen`, `onClose`, `dashboard`, `onDashboardUpdate` — **unchanged**

### Current shell pattern

- Outer: `fixed inset-0 bg-black bg-opacity-50 z-50 p-4`, centered.
- Inner: `max-w-4xl max-h-[90vh] overflow-hidden`, white/slate panel.
- Custom header: title + **subtitle** + X (no `aria-*` on shell).
- Scroll body: `p-6 overflow-y-auto max-h-[calc(90vh-140px)]`.
- Sticky-style footer: `border-t px-6 py-4` + Done.

### Shared `Modal` compatibility

| Aspect | Compatible? | Notes |
|--------|-------------|-------|
| Size | **Yes** | `size="xlarge"` (`max-w-5xl` ≈ 1024px; was `max-w-4xl` 896px) — **slight width increase** |
| Subtitle | **Via children** | First child: `<p className="text-sm text-v-text-secondary mb-v-4">…dashboard.name…</p>` |
| Scroll region | **Yes** | Wrap search + grids in `div` with `max-h-[min(60vh,32rem)] overflow-y-auto` |
| Footer | **Yes** | Last child with `border-t border-v-border pt-v-4 mt-v-4` |
| Header close | **Replace** | Remove lucide X; Modal close only |

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Width 4xl → 5xl | Low | Accept or override with `className` on child wrapper `max-w-4xl mx-auto` inside Modal |
| Double vertical scroll (Modal + inner) | Medium | Tune inner `max-h`; avoid `overflow-hidden` on duplicate wrappers |
| Mock module data unchanged | None | Out of scope |
| Install/uninstall during modal | Low | Retest action buttons |

### Exact migration approach

1. `import { Modal } from 'shared/components'`.
2. `return (<Modal open={isOpen} onClose={onClose} title="Manage Dashboard Modules" size="xlarge"> … </Modal>)`.
3. Subtitle as first child paragraph.
4. Move search + module grids into scrollable wrapper.
5. Footer Done block as final child; remove outer shell `div`s and header X.
6. Map `isOpen` → `open={isOpen}` on Modal only (prop name internal).

### Validation

- Dashboard → manage modules → search, install, remove, Done, Escape.

---

## Candidate 5 — `DashboardBuildOutModal.tsx`

**Path:** `web/src/components/DashboardBuildOutModal.tsx`  
**Consumers:** `DashboardClient.tsx`, `business/[id]/profile/page.tsx`, `business/.../workspace/modules/page.tsx`  
**Public API:** `isOpen`, `onClose`, `onComplete`, `dashboardName`, `businessId?`, `scope?` — **unchanged**

### Current shell pattern

- Same structural pattern as ModuleManagementModal (4xl, 90vh, header subtitle, scroll body, footer actions).
- Footer: **Cancel**, conditional **Continue**, **Skip Module Selection** — must remain.

### Shared `Modal` compatibility

| Aspect | Compatible? | Notes |
|--------|-------------|-------|
| Size / subtitle / scroll | Same as #4 | `size="xlarge"`, subtitle in children |
| Multi-button footer | **Yes** | Footer stays in `children`; not a Modal API change |
| Quick-setup vs custom views | **Yes** | Internal state unchanged |

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Three consumer pages | Medium | Smoke all three entry paths |
| Footer primary actions | Low | Do not remove Cancel/Continue/Skip |
| `onComplete` flows | Medium | Retest quick-setup + custom selection + skip |
| Same 4xl vs 5xl width | Low | Same as #4 |

### Exact migration approach

1. Same as ModuleManagementModal shell swap.
2. `title="Build Out Your Dashboard"`.
3. Subtitle references `dashboardName`.
4. Preserve footer `div` with all three button paths.
5. Remove duplicate header close.

### Validation

- Personal dashboard create/build-out flow.
- Business profile + workspace modules pages.
- Quick setup, custom selection, skip, cancel.

---

## Cross-cutting migration rules (ACT)

1. **Shell swap only** — no token migration of domain blues/grays inside body unless incidental.
2. **Preserve public props** — map `isOpen` → `open` internally only.
3. **No `Modal` API changes** in 2A-2 unless blockers found; if `title: ReactNode` or `panelClassName` needed, document as 2A-2b spike before ACT.
4. **One PR order** following table above (or one PR per candidate for easier rollback).
5. **Tests:** Manual smoke per validation section; `pnpm type-check` after each file.
6. **Post-wave:** Update [`MODAL_STANDARDIZATION_REVIEW.md`](./MODAL_STANDARDIZATION_REVIEW.md) inventory flags (custom shell → N).

---

## Deferred (not 2A-2)

| Item | Wave |
|------|------|
| `ShareModal.tsx` compose | 2A-6+ |
| `ConfirmModal` | 2A-4 |
| `window.confirm` replacement | 2B+ |
| Modal focus trap | 2A-1b+ |
| Optional `hideClose` / `footer` slot on `Modal` | Only if 2A-2 QA blocks |

---

## Wave 2A-2 readiness checklist (pre-ACT)

- [x] 2A-1 `Modal.tsx` merged / on branch
- [ ] Product sign-off on `xlarge` vs former `max-w-4xl` width
- [ ] Decide ShareLinkModal / VLink footer: remove redundant Close or keep
- [ ] Drive QA owner for shortcuts + share link regression

**Last updated:** 2026-06-03
