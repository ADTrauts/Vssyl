# Modal Standardization Closeout (Wave 2A-3)

**Status:** Closed — certification complete  
**Date:** 2026-06-03  
**Reviewer:** Engineering UX review (codebase evidence; manual QA not re-run in this pass)  
**Scope:** Canonical `Modal` shell (2A-1) + five custom-shell migrations (2A-2.1–2A-2.5)  
**Out of scope:** `ShareModal`, `ConfirmModal`, `window.confirm`, drawers, popovers, unmigrated `<Modal>` consumers

**Related:** [`MODAL_STANDARDIZATION_REVIEW.md`](../MODAL_STANDARDIZATION_REVIEW.md), [`WAVE2A2_CUSTOM_MODAL_MIGRATION_PLAN.md`](../WAVE2A2_CUSTOM_MODAL_MIGRATION_PLAN.md)

---

## 1. Scope reviewed

### Canonical shell (Wave 2A-1)

| File | Lines (approx) | Role |
|------|----------------|------|
| `shared/src/components/Modal.tsx` | 145 | Portal overlay, tokenized panel, header/close, focus open/return |

### Migrated consumers (Wave 2A-2)

| # | File | Size | Footer pattern |
|---|------|------|----------------|
| 2A-2.1 | `shared/src/components/ShareLinkModal.tsx` | `medium` | Done + canonical X |
| 2A-2.2 | `web/src/components/vlink/VLinkShareModal.tsx` | `large` | Invite (primary); X only |
| 2A-2.3 | `web/src/components/modules/DriveModule.tsx` (shortcuts block) | `medium` | Close (primary) + X |
| 2A-2.4 | `web/src/components/ModuleManagementModal.tsx` | `xlarge` | Done + X |
| 2A-2.5 | `web/src/components/DashboardBuildOutModal.tsx` | `xlarge` | Cancel + Continue / Skip + X |

### Ecosystem context (not re-certified line-by-line)

- **~60+** additional files compose `<Modal>` from `shared/components` (inherit 2A-1 shell automatically).
- **`ShareModal.tsx`** remains a **custom** `fixed inset-0 z-50` overlay (~668 lines) — largest modal outlier.
- **`window.confirm`:** 25+ usages — unchanged.

---

## 2. Findings summary

| Category | Count | Severity mix |
|----------|-------|----------------|
| Accessibility | 6 | 0 Blocking, 3 Non-Blocking, 3 Advisory |
| UX consistency | 5 | 0 Blocking, 4 Non-Blocking, 1 Advisory |
| Token compliance (shell) | 0 gaps | Shell fully on `v.*` |
| Token compliance (domain body) | Many raw classes | Technical debt (acceptable for 2A) |
| Platform outliers | 2 | ShareModal shell; `confirm()` |

---

## 3. Accessibility assessment

### Current state (evidence: `Modal.tsx`)

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Escape key | **Pass** | `keydown` listener; `closeOnEscape` default `true` |
| Backdrop click | **Pass** | `onClick` on overlay; `event.target === event.currentTarget` |
| Initial focus | **Pass** | `closeButtonRef.focus()` via `requestAnimationFrame` on open |
| Focus return | **Pass** | Restores `previousFocusRef` on close if node still in DOM |
| `role="dialog"` | **Pass** | On portal overlay |
| `aria-modal="true"` | **Pass** | On portal overlay |
| `aria-labelledby` | **Partial** | Set when `title` provided; **undefined** when no title |
| Close control label | **Pass** | `aria-label="Close modal"` + `sr-only` |

All five migrated consumers supply `title` → labelled dialogs in reviewed set.

### Remaining gaps

| Gap | Classification | Rationale |
|-----|----------------|-----------|
| **No focus trap** (Tab can leave dialog) | **Non-Blocking** | No `focus-trap` lib in repo; common gap; blocks WCAG “modal” ideal but not shell adoption |
| **Initial focus always on X** | **Non-Blocking** | Forms (VLink invite, ShareLink copy) require extra Tab; acceptable for help/share flows |
| **No `aria-describedby`** for body/disclaimer | **Advisory** | Amber disclaimers and instructions not linked; screen readers still read DOM order |
| **Dialog `role` on scrollable overlay** | **Advisory** | Overlay scrolls (`overflow-y-auto`); rare edge case for very tall viewports |
| **Header scrolls with panel content** | **Non-Blocking** | Title/close live inside `overflow-y-auto` panel — long content scrolls header away |
| **Dual dismiss (X + Done/Close)** | **Advisory** | Not a11y failure; redundant tab stops in ShareLink / Drive shortcuts |

### Screen reader edge cases (Advisory)

- Migrated modals without footer: VLinkShare ends on Invite — logical reading order OK.
- `select` in VLinkShareModal lacks associated `<label>` (pre-existing).
- ShareLink read-only `input` has visual label only — pre-existing.

---

## 4. Token compliance assessment

### Modal shell (`Modal.tsx`)

| Token family | Used | Classes / utility |
|--------------|------|-------------------|
| **v-color** | Yes | `bg-v-surface`, `border-v-border`, `text-v-text-primary`, `text-v-text-secondary` |
| **v-radius** | Yes | `rounded-v-modal`, `rounded-v-button` |
| **v-shadow** | Yes | `shadow-v-modal` |
| **v-space** | Yes | `p-v-6`, `py-v-5`, `mx-v-4`, `my-v-8`, `mb-v-4`, `mt-v-2`, `gap-v-2`, `p-v-1` |
| **v-focus-ring** | Yes | Close button |

| Item | Classification |
|------|----------------|
| Scrim `bg-black/50` | **Acceptable** — aligned with `LoadingOverlay`; no `--v-overlay-scrim` token yet |
| Hardcoded `z-[9999]` / `z-[10000]` | **Acceptable** — stacking contract; document in interaction standards |
| SVG stroke icon | **Acceptable** — decorative + `aria-hidden` |

### Migrated consumer bodies

| Pattern | Examples | Classification |
|---------|----------|----------------|
| `gray-*`, `slate-*`, `blue-*`, `amber-*` | ShareLink, VLink, Drive, dashboard modals | **Technical debt** — domain/content styling; not shell |
| Footer bleed `-mx-v-6 px-v-6` | ShareLink, ModuleManagement, DashboardBuildOut | **Acceptable** — compositional pattern on tokenized shell |
| Raw `border rounded` on VLink `<select>` | VLinkShareModal | **Migration candidate** — use shared Select when exists |

**Shell verdict:** Token compliance **met** for canonical foundation. Body token migration is a **later wave**, not a 2A blocker.

---

## 5. UX consistency assessment

### Header consistency

| Aspect | Finding |
|--------|---------|
| Title placement | **Consistent** — all five use `title` prop; `h2#modal-title` from shell |
| Close placement | **Consistent** — top-right X in all cases |
| Subtitle | **Consistent pattern** — ModuleManagement + DashboardBuildOut use first child `<p>` with `-mt-v-2 mb-v-4` |
| Header icon | **Inconsistent** — Drive shortcuts only: `Keyboard` icon in body (acceptable per migration plan) |

### Footer consistency

| Modal | Footer | Notes |
|-------|--------|-------|
| ShareLinkModal | Done (secondary) | Full-bleed gray footer bar |
| VLinkShareModal | None | Primary action Invite in body |
| Drive shortcuts | Close (primary, full width) | Border-t, not full-bleed |
| ModuleManagementModal | Done + installed count | Full-bleed bar (matches ShareLink) |
| DashboardBuildOutModal | Cancel + Continue / Skip | Full-bleed bar; view-dependent actions |

**Finding (Non-Blocking):** No shared `ModalFooter` primitive — footers are ad hoc in `children`. Acceptable for foundation; standardize when adding `ConfirmModal`.

### Sizing consistency

| Size | Consumers (reviewed) | Max width |
|------|----------------------|-----------|
| `medium` | ShareLinkModal, Drive shortcuts | `max-w-md` (448px) |
| `large` | VLinkShareModal | `max-w-lg` (512px) |
| `xlarge` | ModuleManagement, DashboardBuildOut | `max-w-5xl` (1024px) |

**Finding (Non-Blocking):** `xlarge` is wider than legacy `max-w-4xl` (896px) — accepted in 2A-2; visual QA on dense grids recommended.

### Scroll behavior

| Pattern | Where | Finding |
|---------|-------|---------|
| Panel scroll | `Modal` panel `overflow-y-auto` + `max-h-[calc(100vh-4rem)]` | Entire panel including header scrolls |
| Inner scroll | xlarge modals `max-h-[min(60vh,32rem)]` on body wrapper | **Nested scroll** with panel — works but **Non-Blocking** polish debt |
| Footer persistence | ShareLink / xlarge use `-mb-v-6` footer outside inner scroll | Footer **mostly** persists; xlarge footer below inner scroll region — **Pass** for reviewed layouts |

---

## 6. Open debt

| ID | Item | Priority | Blocks ConfirmModal? |
|----|------|----------|----------------------|
| D1 | `ShareModal.tsx` custom shell | High | No (parallel track) |
| D2 | Focus trap in shell or ConfirmModal | Medium | Should be in ConfirmModal **implementation**, not planning |
| D3 | `window.confirm` replacement (25+) | Medium | After ConfirmModal exists |
| D4 | `ModalFooter` / subtitle slot API | Low | Optional |
| D5 | Overlay scrim token (`--v-overlay-scrim`) | Low | No |
| D6 | Domain body `v.*` token migration in modals | Low | No |
| D7 | Manual QA sign-off for 2A-2.1–2A-2.5 | Medium | Product verification pending |
| D8 | Unmigrated `<Modal>` consumers regression spot-check | Low | Sample LoginModal, BillingModal, CancelSubscription |

---

## 7. Certification decision

```text
PASS WITH FINDINGS
```

### Evidence for pass

1. **Single canonical shell** — `Modal.tsx` is portal-based, tokenized, and used by all five former custom overlays.
2. **No remaining custom centered overlays** in the 2A-2 scope (verified via migration completion).
3. **Core interaction contract** — Escape, backdrop, scroll lock, labelled dialogs (when titled), initial focus + focus return.
4. **Type-check / build:shared** passed in each 2A-2 implementation pass.
5. **API stability** — Migrated components preserved public props; ~60 inherited consumers unchanged.

### Why not unconditional PASS

- **`ShareModal`** still duplicates overlay mechanics (platform-visible Drive share surface).
- **Focus trap absent** — material for destructive ConfirmModal flows.
- **Footer/header patterns** not API-level — compositional drift possible.
- **Manual QA** for 2A-2 migrations not documented in this closeout (pending product sign-off per D7).

### Why not FAIL

- 2A-1/2A-2 goals met: shell modernization + planned custom-shell elimination.
- Outliers were explicitly deferred and are documented.
- Gaps are addressable without reopening shell architecture.

---

## 8. Recommendation

### Certified foundation statement

The Vssyl **modal shell** (`shared/src/components/Modal.tsx`) is approved as the **canonical centered-overlay foundation** for new and migrated dialogs. New centered dialogs **must** compose `Modal`; do not add new `fixed inset-0` shells.

### Recommended next UX wave (choose one)

```text
Option A — ConfirmModal planning
```

| Option | Fit | Why not now |
|--------|-----|-------------|
| **A — ConfirmModal planning** | **Selected** | Natural gate before `confirm()` replacement; destructive flows need a designed primitive; planning can require focus trap in spec without shell rework |
| B — Focus-trap accessibility work | Defer | Belongs in ConfirmModal + optional 2A-1b shell spike; trap alone does not unblock product flows |
| C — ShareModal migration | Defer | Large domain surface; parallel after ConfirmModal plan approved |
| D — ContextMenu / Popover wave | Defer | Tier 1 sibling wave; orthogonal to modal closeout |

### Suggested sequence after Option A

1. **Plan + implement `ConfirmModal`** (compose `Modal`; include focus trap; `destructive` variant).
2. **Pilot** on `CancelSubscriptionModal` or impersonate confirm UI.
3. **2A-1b (optional):** Shell-level focus trap for all `Modal` instances.
4. **ShareModal** shell compose (2A-6).
5. **Gradual `confirm()` replacement** with ConfirmModal.

---

## Appendix — Blocking / Non-Blocking / Advisory register

### Blocking

*None identified for modal foundation certification.*

### Non-Blocking

1. No focus trap in canonical shell.  
2. Initial focus fixed on close button.  
3. Header/title scrolls with long panel content.  
4. Nested scroll on `xlarge` dashboard modals.  
5. `xlarge` width vs legacy `max-w-4xl`.  
6. Ad hoc footer patterns (no `ModalFooter` API).

### Advisory

1. No `aria-describedby` for disclaimer blocks.  
2. Dual dismiss controls (X + Done/Close).  
3. VLink `select` / ShareLink input labelling.  
4. `ShareModal` and raw body colors remain technical debt.

---

**Last updated:** 2026-06-03
