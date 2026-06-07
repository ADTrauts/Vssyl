# Drive Reference Menu Rollout Plan (Wave 3A-3)

**Status:** 3A-3.1a–3A-3.3 + 3A-3.1b complete (2026-06-03); 3A-3.6 ready for ACT  
**Mode:** ACT in progress — Drive menu surfaces migrated; FileContextMenu hygiene next  
**Prerequisite:** Wave 3A-2 primitive hardening — [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](./CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md) §3A-2  
**Architecture:** Option A — `ContextMenu` / `Popover` / `DropdownMenu` layering (§11)

---

## Executive summary

Drive / File Hub is the **Reference UX Module** for menu standardization. Within the scoped files, **five distinct floating UI patterns** exist; only **three require migration** in 3A-3. Two are **non-menu** (leave as-is). One file (**`FileContextMenu.tsx`**) is an **orphan** safe to delete in a hygiene pass after migrations.

| Metric | Count |
|--------|------:|
| Menus / floating panels inventoried | **7** |
| **ContextMenu** migrations | **2** (DriveModule, starred) |
| **DropdownMenu** migrations | **1** (DriveSidebar “New”) |
| **Popover** migrations | **1** (DriveModule filter panel) |
| **Leave as-is** (non-menu) | **2** (Modal shortcuts; inline enterprise filters) |
| **Delete** (orphan) | **1** (`FileContextMenu.tsx`) |
| **Defer / stub** | **2** (EnhancedDriveModule overflow; DriveSearch orphan) |

**Recommended ACT order:** 3A-3.1a → 3A-3.2 → 3A-3.3 → 3A-3.1b → 3A-3.4 (hygiene) → 3A-3.5 (optional stub wire).

---

## 1. Drive menu inventory

> **Path note:** `FileContextMenu` lives at `web/src/components/FileContextMenu.tsx` (not under `drive/`). User scope listed `web/src/components/drive/FileContextMenu.tsx` — **file not found** at that path.

| # | Menu / panel | Location | Current implementation | Trigger type | Recommended primitive | Disposition |
|---|--------------|----------|------------------------|--------------|----------------------|-------------|
| 1 | **File/folder context menu** | `DriveModule.tsx` ~L2447–2455 | Shared `ContextMenu` + `buildDriveContextMenuItems()` | Right-click (`onContextMenu` → `{x,y}`) | **ContextMenu** | **Done (3A-3.1a)** |
| 2 | **Toolbar filter panel** | `DriveModule.tsx` ~L2118–2175 | Shared `Popover` + form controls; `panelLabel="Drive filters"` | Filter button (`showFilterMenu`) | **Popover** | **Done (3A-3.1b)** |
| 3 | **Keyboard shortcuts help** | `DriveModule.tsx` ~L2714+ | Shared `Modal` | Toolbar button | — | **Leave as-is** |
| 4 | **File/folder context menu** | `starred/page.tsx` ~L838–846 | Shared `ContextMenu` + `buildStarredContextMenuItems()` | Right-click | **ContextMenu** | **Done (3A-3.2)** |
| 5 | **“New” create menu** | `DriveSidebar.tsx` ~L595–616 | Shared `DropdownMenu` + `newMenuItems` | “New” button click | **DropdownMenu** | **Done (3A-3.3)** |
| 6 | **Search results panel** | `DriveSearch.tsx` ~L147–180 | Inline `absolute` autocomplete list | Input focus + query ≥2 chars | **Popover** | **Defer** (orphan component) |
| 7 | **Row overflow (stub)** | `EnhancedDriveModule.tsx` ~L935–941 | `MoreVertical` `Button`; **no menu rendered** | Click (no-op) | **DropdownMenu** | **Defer** (stub until menu spec) |

### Non-inventory (adjacent, out of 3A-3 menu scope)

| Surface | Location | Notes |
|---------|----------|-------|
| Share / ShareLink modals | `DriveModule.tsx` | Modal archetype — Wave 2A certified |
| ConfirmModal trash | `DriveModule.tsx`, `EnhancedDriveModule.tsx` | Wave 2B — not menu |
| Enterprise inline filters | `EnhancedDriveModule.tsx` ~L746–795 | Native `<select>` in toolbar — not floating |
| Card hover quick actions | `DriveModule.tsx` ~L404+ | Icon buttons on hover — not a menu |

---

## 2. Activation model review

### ContextMenu — use when

| Criterion | Drive evidence |
|-----------|----------------|
| Right-click / pointer-position | `DriveModule` `handleContextMenu` → `clientX/clientY`; `starred/page` same |
| File/folder canvas interactions | Grid + list item `onContextMenu` handlers (4 bindings each file) |

**Drive candidates:** #1 DriveModule context menu, #4 starred context menu.

**Post-migration:** Build `ContextMenuItem[]` from domain handlers; pass `anchorPoint`; use `menuLabel` with item name; trash row uses `destructive: true`.

### DropdownMenu — use when

| Criterion | Drive evidence |
|-----------|----------------|
| Overflow / action button menus | `EnhancedDriveModule` `MoreVertical` (stub) |
| Toolbar action list from button | `DriveSidebar` “New” → folder / file / folder upload |

**Drive candidates:** #5 DriveSidebar “New” (ready now). #7 EnhancedDriveModule (defer until action list defined).

**Not DropdownMenu:** Filter panel (#2) — contains form controls, not action list.

### Popover — use when

| Criterion | Drive evidence |
|-----------|----------------|
| Search / autocomplete panels | `DriveSearch` results list |
| Filter / form floating panels | `DriveModule` filter panel (selects + checkbox) |
| Rich non-menu floating UI | N/A in scoped files today |

**Drive candidates:** #2 DriveModule filter → **Popover** with custom `content` (form JSX). #6 DriveSearch → **Popover** or dedicated combobox when component is wired.

### Ambiguous cases

| Case | Resolution |
|------|------------|
| **DriveModule filter panel** labeled `role="menu"` | **Popover** — form content; remove `role="menu"` on migration; use `aria-haspopup="dialog"` or `role="region"` on Popover panel |
| **DriveSearch result rows** look like menu items | **Not DropdownMenu** — navigational autocomplete; Popover/combobox pattern |
| **AvatarContextMenu** (out of scope) | Uses coordinate `ContextMenu` today — **3A-4** → `DropdownMenu` |
| **starred share modal** (custom overlay) | Not menu — separate Modal migration track |

---

## 3. FileContextMenu evaluation

| Question | Answer | Evidence |
|----------|--------|----------|
| **Still used?** | **No** | `rg FileContextMenu` → only `FileContextMenu.tsx` itself + docs |
| **`createFileActions` used?** | **No** | Exported helper; zero imports in `web/` or `server/` |
| **Can delete?** | **Yes** (after 3A-3.1/3A-3.2) | No runtime consumers; docs reference as orphan |
| **Absorb into ContextMenu?** | **Yes** | `createFileActions` logic maps 1:1 to `ContextMenuItem[]`; destructive flag already exists on shared type |

**Disposition:** Delete `web/src/components/FileContextMenu.tsx` in **3A-3.6 hygiene** (or bundled with 3A-3.2 if starred migration proves item builder). Do **not** delete before DriveModule/starred use shared `ContextMenu`.

**Optional retain:** Extract `buildDriveContextMenuItems(item, callbacks)` helper into `web/src/lib/drive/` or inline in DriveModule — **not** a separate component shell.

---

## 4. Migration groups

### 3A-3.1 — DriveModule (`web/src/components/modules/DriveModule.tsx`)

| Field | Value |
|-------|-------|
| **Scope** | File/folder right-click menu (primary); filter panel (secondary sub-step) |
| **Recommended primitive** | **ContextMenu** (context); **Popover** (filter) |
| **Risk** | **Medium–High** — largest file (~2.8k lines); many action handlers; V_Link, chat, AI, trash flows |
| **Complexity** | **High** — 10+ menu items; conditional file/folder branches; `ConfirmModal` on trash |
| **QA surface** | Right-click grid + list; folder vs file actions; pin; share; download; V_Link; discuss; AI; delete → ConfirmModal; outside-click + Escape via shared primitive |

**Suggested split:**

| Sub-step | Work | Primitive |
|----------|------|-----------|
| **3A-3.1a** | Replace inline context menu with `ContextMenu` + `ContextMenuItem[]` builder | ContextMenu |
| **3A-3.1b** | Replace filter `absolute` panel with `Popover` wrapping form content | Popover |

**3A-3.1a complete:** Inline context menu JSX removed; duplicate document `click` dismiss removed; `buildDriveContextMenuItems()` local helper added; `ContextMenu` renders at pointer anchor.

**3A-3.1b complete:** Inline filter `absolute` panel removed; `filterMenuRef` + outside-click `useEffect` removed; `Popover` with `panelLabel="Drive filters"`; `role="menu"` removed from filter surface.

---

### 3A-3.2 — Starred (`web/src/app/drive/starred/page.tsx`)

| Field | Value |
|-------|-------|
| **Scope** | Right-click context menu only |
| **Recommended primitive** | **ContextMenu** |
| **Risk** | **Low–Medium** — smaller subset of DriveModule actions |
| **Complexity** | **Medium** — missing V_Link / Discuss / Preview/Open parity with DriveModule (product decision: align items or keep starred subset) |
| **QA surface** | Starred grid/list right-click; pin; share; download; AI; delete; dismiss behavior change (`mouseLeave` → shared outside-click + Escape) |

**3A-3.2 complete:** Inline context menu removed; `onMouseLeave` dismiss removed; `buildStarredContextMenuItems()` preserves starred subset (Pin, Share, Download/AI file-only, Delete). Dismiss now via shared outside-click + Escape.

---

### 3A-3.3 — DriveSidebar (`web/src/app/drive/DriveSidebar.tsx`)

| Field | Value |
|-------|-------|
| **Scope** | “New” dropdown (New folder, File upload, Folder upload) |
| **Recommended primitive** | **DropdownMenu** |
| **Risk** | **Medium** — inline `styles` object; dark mode via hex; used on 6+ routes |
| **Complexity** | **Medium** — replace styles with tokens; map `dropdownItems` → `ContextMenuItem[]`; controlled `open` state |
| **QA surface** | All Drive routes using sidebar: personal, starred, trash, shared, recent, business workspace; upload + new folder callbacks |

**3A-3.3 complete:** Inline `absolute` dropdown removed; `styles.dropdown` / `dropdownItem` removed; `dropdownRef` outside-click effect removed; `newMenuItems` → `DropdownMenu` with `aria-expanded` / Escape / outside-click via shared primitive.

---

### 3A-3.4 — DriveSearch (`web/src/components/DriveSearch.tsx`)

| Field | Value |
|-------|-------|
| **Scope** | Search results autocomplete panel |
| **Recommended primitive** | **Popover** (or future SearchBox primitive) |
| **Risk** | **Low** — **no current consumers** (`rg import DriveSearch` → zero) |
| **Complexity** | **Low** — isolated component |
| **QA surface** | N/A until wired into Drive UI |

**Recommendation:** **Defer** to post–3A-3 certification or SearchBox consolidation wave (Tier 3). If migrated in 3A-3.4, use **Popover** for results panel — **not** DropdownMenu.

---

### 3A-3.5 — EnhancedDriveModule (`web/src/components/drive/enterprise/EnhancedDriveModule.tsx`)

| Field | Value |
|-------|-------|
| **Scope** | `MoreVertical` stub only — no menu implementation |
| **Recommended primitive** | **DropdownMenu** (when product defines actions) |
| **Risk** | **Low** today (no menu) |
| **Complexity** | **High** if full parity with DriveModule + enterprise actions required |
| **QA surface** | Business enterprise drive via `DriveModuleWrapper` |

**Recommendation:** **Defer** wiring until action list is specified. Optional 3A-3.5 ACT: add right-click `ContextMenu` parity with DriveModule for enterprise rows (no overflow menu yet). Overflow stub remains until actions defined.

**Not in scope:** Inline classification/type `<select>` filters — leave as-is (toolbar form controls).

---

### 3A-3.6 — Hygiene (planning)

| Action | File |
|--------|------|
| Delete orphan | `web/src/components/FileContextMenu.tsx` |
| Remove unused import | `MoreVertical` in `DriveModule.tsx` (imported, unused) |

---

## 5. Accessibility review (current gaps — do not fix in PLAN)

### DriveModule

| Criterion | Context menu | Filter panel |
|-----------|--------------|--------------|
| Keyboard support | **Missing** (inline buttons; no arrow nav) | Partial (native selects) |
| ARIA | Partial — `role="menu"` / `menuitem` / per-item `aria-label` | **Incorrect** — `role="menu"` on form panel |
| Focus return | **Missing** | N/A |
| Escape | **Missing** (inline menu) | **Missing** |
| Dismiss | Document `click` listener (L917–924) | `mousedown` outside `filterMenuRef` |
| Token compliance | Legacy Tailwind | Legacy Tailwind |

**After migration:** ContextMenu provides Escape + outside-click + partial keyboard; filter via Popover gains Escape + outside-click.

### starred/page.tsx

| Criterion | Status |
|-----------|--------|
| Keyboard | **Missing** |
| ARIA | **Missing** — no `role="menu"` |
| Escape | **Missing** |
| Dismiss | **`onMouseLeave` only** — inconsistent with DriveModule |
| Destructive | `text-red-600` only — no `destructive` item flag |

### DriveSidebar

| Criterion | Status |
|-----------|--------|
| Keyboard | **Missing** |
| ARIA | **Missing** — no `aria-expanded` on “New” |
| Escape | **Missing** |
| Dismiss | `mousedown` outside |
| Tokens | **Missing** — inline style objects |

### DriveSearch

| Criterion | Status |
|-----------|--------|
| Combobox pattern | **Missing** — plain input + results list |
| Escape | **Missing** |
| Dismiss | `mousedown` outside only |

### EnhancedDriveModule

| Criterion | Status |
|-----------|--------|
| Overflow button | No `aria-haspopup`; no menu |

---

## 6. Drive Reference Menu Certification

Success criteria for **Drive Reference Menu Certification** (3A-3 closeout / pre–3A-4):

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | **No duplicate menu shells** | Zero inline `fixed`/`absolute` action menus in scoped Drive files (except Popover content slots) |
| 2 | **Canonical primitives only** | Context menus → `ContextMenu`; “New” → `DropdownMenu`; filter panel → `Popover` |
| 3 | **Token compliance** | Migrated surfaces use `v-*` tokens via shared primitives (no `bg-white dark:bg-slate-900` menu shells) |
| 4 | **Accessibility baseline** | Shared primitive a11y inherited; filter panel no longer `role="menu"`; sidebar trigger has `aria-expanded` |
| 5 | **Dark mode** | Manual QA on DriveModule + starred + sidebar in light/dark |
| 6 | **Type-check clean** | `pnpm type-check` after each ACT sub-step |
| 7 | **Orphan removed** | `FileContextMenu.tsx` deleted |
| 8 | **Behavior parity** | Trash still flows through `ConfirmModal`; no regression on V_Link / share / download |
| 9 | **Documented reference** | This plan + closeout doc `audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md` (3A-3 end) |

**Not required for 3A-3 certification:** EnhancedDriveModule overflow implementation; DriveSearch wiring; platform (AI/Chat) rollout.

---

## 7. Recommended ACT sequence

| Order | ID | File | Primitive | Priority |
|-------|-----|------|-----------|----------|
| 1 | **3A-3.1a** | `DriveModule.tsx` | ContextMenu | **P0** — reference implementation |
| 2 | **3A-3.2** | `starred/page.tsx` | ContextMenu | **P0** — duplicate removal |
| 3 | **3A-3.3** | `DriveSidebar.tsx` | DropdownMenu | **P1** |
| 4 | **3A-3.1b** | `DriveModule.tsx` | Popover (filter) | **P1** — same file, separate ACT |
| 5 | **3A-3.6** | `FileContextMenu.tsx` | Delete | **P1** — hygiene |
| 6 | **3A-3.4** | `DriveSearch.tsx` | Popover | **P2** — orphan |
| 7 | **3A-3.5** | `EnhancedDriveModule.tsx` | DropdownMenu / ContextMenu | **P3** — product-dependent |

---

## 8. 3A-3.1 DriveModule readiness

| Gate | Status |
|------|--------|
| `ContextMenu` hardened (3A-2) | **Yes** |
| `ContextMenuItem` supports `destructive`, `divider`, `heading` | **Yes** |
| Item list extractable without API break | **Yes** |
| ConfirmModal trash path unchanged | **Yes** — menu `onClick` still calls `requestMoveToTrash` |
| Filter panel can wait (3A-3.1b) | **Yes** |
| **3A-3.1a ready for ACT?** | **Done** — `DriveModule.tsx` context menu → `ContextMenu` |
| **3A-3.2 ready for ACT?** | **Done** — `starred/page.tsx` → `ContextMenu` |
| **3A-3.3 ready for ACT?** | **Done** — `DriveSidebar.tsx` “New” → `DropdownMenu` |
| **3A-3.1b ready for ACT?** | **Done** — `DriveModule.tsx` filter panel → `Popover` |
| **3A-3.6 ready for ACT?** | **Yes** — delete `FileContextMenu.tsx` orphan |

**3A-3.1b closeout:** `pnpm type-check` PASS; zero `role="menu"` in `DriveModule.tsx`; context menu unchanged; manual QA **pending**.

---

## Related

- [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](./CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md)
- [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md)
- [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md)

**Last updated:** 2026-06-03 (3A-3.1a–3A-3.3 + 3A-3.1b ACT complete)
