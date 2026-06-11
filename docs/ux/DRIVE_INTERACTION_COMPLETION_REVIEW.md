# Drive Interaction Completion Review (Wave 3B-0)

**Status:** **3B program complete — interaction certified (Approved with Findings)**  
**Date:** 2026-06-03 (certified 3B-6)  
**Mode:** Inventory + certification evidence — [`audits/DRIVE_INTERACTION_CERTIFICATION.md`](./audits/DRIVE_INTERACTION_CERTIFICATION.md)  
**Prerequisites:**
- ConfirmModal Batch 1–2 — [`audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md)
- Menu standardization — [`audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md`](./audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md) (3A-3)
- Layout shells — `WorkspaceSplitLayout` (3C-2), `PlatformShell` (3C-4F)

**Goal:** Determine remaining Drive / File Hub **interaction debt** before the module can be certified as the platform **Reference UX Module** (UX-L3).

---

## 1. Executive Summary

Drive is **Reference UX Module #1** for interaction, menus (3A-3), and workspace layout (3C-2) — **Approved with Findings** (3B-6). Human QA matrix and Wave 5 numeric scorecard remain recommended follow-ups.

| Area | Status | Blocker severity |
|------|--------|------------------|
| Soft-delete (all paths) | **Certified** (2B + 3B-2/3B-5) | — |
| Permanent purge + per-item delete | **Certified** (3B-1, 3B-3) | — |
| Drag-to-trash parity | **Certified** (3B-2) | — |
| HTML5 drop confirm | **Certified** (3B-5) | — |
| Trash restore flows | **No confirm** (acceptable) | Low |
| Context menus | **Certified** (3A-3) | — |
| Folder create | **Certified** (3B-4 + 3B-4b) | — |
| Keyboard Delete | **Certified** (3B-5) | — |
| Manual QA sign-off | **Matrix ready** (D-10) | Process |
| Version / restore UI | **Not implemented** | Advisory |

**Verdict:** **3B interaction certification complete.** See [`audits/DRIVE_INTERACTION_CERTIFICATION.md`](./audits/DRIVE_INTERACTION_CERTIFICATION.md) and [`audits/DRIVE_REFERENCE_UX_SCORECARD.md`](./audits/DRIVE_REFERENCE_UX_SCORECARD.md).

---

## 2. Scope Reviewed

| Path | Role |
|------|------|
| `web/src/components/modules/DriveModule.tsx` | Primary File Hub workspace (~2760 LOC) |
| `web/src/components/drive/DrivePageContent.tsx` | Personal route DnD shell + sidebar wiring |
| `web/src/components/drive/DriveModuleWrapper.tsx` | Business lazy-load (standard vs enterprise) |
| `web/src/components/drive/DriveDetailsPanel.tsx` | Right-rail details + actions |
| `web/src/components/drive/enterprise/EnhancedDriveModule.tsx` | Business enterprise drive variant |
| `web/src/app/drive/starred/page.tsx` | Pinned/starred route |
| `web/src/app/drive/trash/page.tsx` | Module-scoped trash view |
| `web/src/app/drive/shared/page.tsx` | Shared-with-me route |
| `web/src/app/drive/recent/page.tsx` | Recent activity route |
| `web/src/app/drive/DriveSidebar.tsx` | Sidebar + `DropdownMenu` “New” |
| `web/src/components/GlobalTrashBin.tsx` | Platform trash overlay (cross-module) |

**Related (documented, out of 3B-0 file list):** `DriveSearch.tsx` (orphan), `ShareModal` usage, `GlobalTrashContext`.

---

## 3. Structural Inventory

| Region | Implementation | Shared primitive? | Notes |
|--------|----------------|-------------------|-------|
| Platform shell | `DashboardLayout` → `PlatformShell` | Yes (3C-4) | Drive routes use dashboard layout |
| Workspace split | `WorkspaceSplitLayout` | Yes (3C-2) | Sidebar \| main \| optional details |
| Main grid/list | `DriveModule` / route pages | Module-specific | Good a11y labels on items |
| Context menus | `ContextMenu` + builders | Yes (3A-3) | `DriveModule`, `starred/page` |
| Filter panel | `Popover` | Yes (3A-3) | `DriveModule` only |
| Sidebar “New” | `DropdownMenu` | Yes (3A-3) | `DriveSidebar` |
| Details panel | `DriveDetailsPanel` | Module-specific | Action buttons delegate up |
| Global trash | `GlobalTrashBin` + dnd-kit drop target | Platform overlay | Affects all modules |
| Trash page | `drive/trash/page.tsx` | Module route | HTML5 drop + inline actions |
| Bulk bar | `DriveModule` selection toolbar | Inline | ConfirmModal for bulk soft-delete |

---

## 4. ConfirmModal Inventory

### 4.1 Completed (Batch 2B — soft delete)

| Surface | File | Flow | Pattern |
|---------|------|------|---------|
| Single move-to-trash | `DriveModule.tsx` | Menu, toolbar, details `onDelete`, bulk bar | `pendingItemToTrash` + `ConfirmModal` |
| Bulk move-to-trash | `DriveModule.tsx` | Selection bar “Delete” | `pendingBulkItemsToTrash` + `ConfirmModal` |
| Single move-to-trash | `starred/page.tsx` | Context menu Delete | `ConfirmModal` |
| Bulk move-to-trash | `EnhancedDriveModule.tsx` | Enterprise selection delete | `ConfirmModal` |

### 4.2 Native `confirm()` / `window.confirm()` — empty-trash purge (resolved 3B-1)

| # | File | Status |
|---|------|--------|
| 1 | `web/src/app/drive/trash/page.tsx` empty-all | **Done** — [`audits/DRIVE_PERMANENT_PURGE_BATCH3A_CLOSEOUT.md`](./audits/DRIVE_PERMANENT_PURGE_BATCH3A_CLOSEOUT.md) |
| 2 | `web/src/components/GlobalTrashBin.tsx` empty-all | **Done** — same closeout |

**Drive-cluster empty-trash native confirm count:** **0**.

### 4.3 Per-item permanent delete (resolved 3B-3)

| # | File | Status |
|---|------|--------|
| 1 | `web/src/app/drive/trash/page.tsx` per-item delete forever | **Done** — [`audits/DRIVE_PERMANENT_DELETE_PER_ITEM_BATCH3B3_CLOSEOUT.md`](./audits/DRIVE_PERMANENT_DELETE_PER_ITEM_BATCH3B3_CLOSEOUT.md) |
| 2 | `web/src/components/GlobalTrashBin.tsx` per-item delete | **Done** — same closeout |

**Drive-cluster per-item permanent delete without confirm:** **0**.

### 4.3b Remaining trash interaction without confirm

| Surface | Action | Risk |
|---------|--------|------|
| `drive/trash/page.tsx` | HTML5 drop → `trashItem` (re-trash already trashed / edge cases) | Medium |

### 4.4 Restore flows (no confirm — acceptable)

| Surface | Action | Confirm? | Notes |
|---------|--------|----------|-------|
| `drive/trash/page.tsx` | `handleRestore` | No | Reversible — OK per interaction standards |
| `GlobalTrashBin.tsx` | `handleRestore` | No | Reversible — OK |

### 4.5 Folder create `prompt()` (resolved 3B-4)

| # | Files | Status |
|---|-------|--------|
| 7 | `DriveModule`, `DrivePageContent`, `starred`, `trash`, `shared`, `recent`, `EnhancedDriveModule` | **Done** — [`audits/DRIVE_FOLDER_CREATE_MODAL_BATCH3B4_CLOSEOUT.md`](./audits/DRIVE_FOLDER_CREATE_MODAL_BATCH3B4_CLOSEOUT.md) |

**Scoped Drive `prompt('Enter folder name:')` count:** **0**.

**Business workspace parity (3B-4b):** `BusinessWorkspaceContent.tsx` — **Done** — [`audits/DRIVE_FOLDER_CREATE_BUSINESS_PARITY_BATCH3B4B_CLOSEOUT.md`](./audits/DRIVE_FOLDER_CREATE_BUSINESS_PARITY_BATCH3B4B_CLOSEOUT.md). **0** known Drive folder-create `prompt()` calls remain.

---

## 5. Drag & Drop Inventory

### 5.1 Architecture

- **Internal moves:** `@dnd-kit` via parent `DndContext` (`DrivePageContent`, `starred/page`).
- **Global trash:** `useDroppable({ id: 'global-trash-bin' })` on `GlobalTrashBin`.
- **Trash page:** Native HTML5 `onDrop` with `application/json` payload (sidebar / legacy paths).
- **File upload:** Separate HTML5 drag-over on main pane (`DriveModule`).

### 5.2 Drag-to-trash behavior matrix

| Source | Drop target | Confirm before trash? | Parity with menu delete? |
|--------|-------------|----------------------|--------------------------|
| `DriveModule` `handleDragEnd` | `global-trash-bin` | **Yes** — `requestMoveToTrash` (3B-2) | **Yes** |
| `starred/page` `handleDragEnd` | `global-trash-bin` | **Yes** — calls `requestMoveToTrash` | **Yes** |
| `GlobalTrashBin` HTML5 `onDrop` | Bin button | **Yes** — ConfirmModal (3B-5) | N/A (cross-module) |
| `drive/trash/page` HTML5 `onDrop` | Main pane | **Yes** — ConfirmModal (3B-5) | N/A (trash view context) |

~~**Critical gap (NB-2 from Batch 2):** `DriveModule` drag-to-trash bypasses ConfirmModal.~~ **Resolved (3B-2)** — [`audits/DRIVE_DRAG_TO_TRASH_PARITY_BATCH3B2_CLOSEOUT.md`](./audits/DRIVE_DRAG_TO_TRASH_PARITY_BATCH3B2_CLOSEOUT.md).

### 5.3 Bulk drag

- **Not implemented.** Multi-select + drag moves **one** dnd-kit active item only.
- Bulk delete uses selection bar + `ConfirmModal` (soft delete) — **correct**.
- **Gap:** No “drag selection to trash” — low priority unless product requests.

### 5.4 Confirmation consistency recommendation

| Policy option | Description |
|---------------|-------------|
| **A (recommended)** | All soft-delete paths (menu, keyboard, drag, bulk) route through `requestMoveToTrash` / `pendingBulkItemsToTrash` |
| **B** | Drag exempt with toast-only undo (not implemented today) — **do not adopt** without undo API |

---

## 6. Trash Flow Inventory

| Flow | `drive/trash/page` | `GlobalTrashBin` | `DriveModule` |
|------|-------------------|------------------|---------------|
| Soft-delete (move to trash) | Drop only | dnd-kit + HTML5 | Menu, bulk, drag (ConfirmModal on drag — 3B-2) |
| Restore | Inline button, no confirm | Icon button, no confirm | N/A (listens `itemRestored` event) |
| Permanent delete (single) | **ConfirmModal** (3B-3) | **ConfirmModal** (3B-3) | N/A |
| Empty / purge all | **ConfirmModal** (3B-1) | **ConfirmModal** (3B-1) | N/A |
| Bulk restore | **Not present** | **Not present** | N/A |
| Retention copy | “30 days” shown | “30 days” footer | Toast on soft-delete |

**Trash page oddity:** Sidebar on trash route still exposes “New folder” via `prompt()` — confusing UX on a trash view (medium hygiene).

---

## 7. Details Panel Inventory

**File:** `web/src/components/drive/DriveDetailsPanel.tsx`

| Action | Implementation | Confirm? |
|--------|----------------|----------|
| Download | `onDownload` callback | No |
| Share | `onShare` callback | No |
| Rename | `onRename` callback | No |
| Move | `onMove` callback | No |
| Delete | `onDelete` → `requestMoveToTrash` in parent | **Yes** (via parent `ConfirmModal`) |
| Ask AI | `onAskAI` | No |
| V_Link | `openConnectModal` | No |
| Activity / History | Read-only list | N/A |
| **Version actions** | **Not present** | Enterprise showcase mentions versioning — **not wired** |

**Restore:** Not applicable on details panel (active items only).

---

## 8. Context Menu Inventory

Per [`DRIVE_MENU_REFERENCE_CLOSEOUT.md`](./audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md) — **PASS WITH FINDINGS**.

| Surface | Primitive | Status |
|---------|-----------|--------|
| `DriveModule.tsx` right-click | `ContextMenu` | ✅ Certified |
| `starred/page.tsx` right-click | `ContextMenu` | ✅ Certified |
| `DriveSidebar.tsx` “New” | `DropdownMenu` | ✅ Certified |
| `DriveModule.tsx` filters | `Popover` | ✅ Certified |

### Exceptions (documented)

| Exception | Location | Disposition |
|-----------|----------|-------------|
| `DriveSearch.tsx` orphan | 0 consumers | Defer until wired |
| `EnhancedDriveModule` overflow | Stub removed in 3A-3 | No menu until product spec |
| `starred/page.tsx` share stub | Inline `fixed` div | Modal archetype debt — not menu scope |
| Icon quick actions on cards | `DriveModule` hover buttons | Intentional — not menus |

**3B-0 finding:** No new menu primitive violations in scoped Drive files.

---

## 9. Accessibility Inventory

| Topic | Evidence | Gap severity |
|-------|----------|--------------|
| Item grid labels | `aria-label`, `aria-selected` on drive items | **Good** |
| View toggles | `aria-pressed` on grid/list | **Good** |
| Context menu | Shared `ContextMenu` focus trap (3A-2) | **Good** — manual QA pending |
| Keyboard shortcuts help | Modal documents Delete key | **Gap** — no `keydown` handler found in `DriveModule` for Delete/Backspace |
| Focus return after confirm | `ConfirmModal` focus trap | **Unverified** in manual QA |
| Drag alternatives | dnd-kit `KeyboardSensor` configured on parent | Partial — trash drop may be pointer-only |
| Trash bin panel | Portal overlay; icon-only action buttons | Medium — `title` only, weak labels |
| Reduced motion | Not audited on drive drag animations | Low |

---

## 10. Severity Ranking

| ID | Issue | Severity | User impact | Effort |
|----|-------|----------|-------------|--------|
| ~~**D-1**~~ | ~~Permanent purge uses native `confirm` (2 sites)~~ | **Resolved (3B-1)** | — | — |
| ~~**D-2**~~ | ~~Per-item permanent delete without confirm (trash page + GlobalTrashBin)~~ | **Resolved (3B-3)** | — | — |
| ~~**D-3**~~ | ~~`DriveModule` drag-to-trash skips ConfirmModal~~ | **Resolved (3B-2)** | — | — |
| ~~**D-4**~~ | ~~`starred` vs `DriveModule` drag-to-trash policy split~~ | **Resolved (3B-2)** | — | — |
| ~~**D-5**~~ | ~~`prompt()` folder create (7 sites)~~ | **Resolved (3B-4)** | — | — |
| ~~**D-6**~~ | ~~Keyboard Delete documented but not wired~~ | **Resolved (3B-5)** | — | — |
| ~~**D-7**~~ | ~~Trash page / GlobalTrashBin HTML5 drop without confirm~~ | **Resolved (3B-5)** | — | — |
| **D-8** | `starred/page` share modal stub | **P3** | Feature incomplete — not interaction contract | Separate feature wave |
| **D-9** | No file version / restore UI in details panel | **P3** | Enterprise roadmap only | Large |
| **D-10** | Manual QA not recorded for Drive confirms / drag | **Matrix ready (3B-5)** | Awaiting human sign-off (3B-6) | Process |

---

## 11. Required Implementation Waves (3B program)

| Wave | Name | Scope | Depends on |
|------|------|-------|------------|
| **3B-1** | **ConfirmModal Batch 3A — Permanent purge** | `drive/trash/page.tsx` empty-all; `GlobalTrashBin.tsx` empty-all | **Done** ✅ — [`audits/DRIVE_PERMANENT_PURGE_BATCH3A_CLOSEOUT.md`](./audits/DRIVE_PERMANENT_PURGE_BATCH3A_CLOSEOUT.md) |
| **3B-2** | **Drive soft-delete parity** | Route `DriveModule` drag-to-trash through `requestMoveToTrash` | **Done** ✅ — [`audits/DRIVE_DRAG_TO_TRASH_PARITY_BATCH3B2_CLOSEOUT.md`](./audits/DRIVE_DRAG_TO_TRASH_PARITY_BATCH3B2_CLOSEOUT.md) |
| **3B-3** | **Permanent delete confirms** | Per-item delete forever on trash page + GlobalTrashBin | **Done** ✅ — [`audits/DRIVE_PERMANENT_DELETE_PER_ITEM_BATCH3B3_CLOSEOUT.md`](./audits/DRIVE_PERMANENT_DELETE_PER_ITEM_BATCH3B3_CLOSEOUT.md) |
| **3B-4** | **Folder create modal** | Replace 7× `prompt()` with shared create-folder dialog | **Done** ✅ — [`audits/DRIVE_FOLDER_CREATE_MODAL_BATCH3B4_CLOSEOUT.md`](./audits/DRIVE_FOLDER_CREATE_MODAL_BATCH3B4_CLOSEOUT.md) |
| **3B-5** | **Drive keyboard + a11y pass** | Wire Delete key; trash bin labels; HTML5 drop confirm; QA matrix | **Done** ✅ — [`audits/DRIVE_KEYBOARD_A11Y_BATCH3B5_CLOSEOUT.md`](./audits/DRIVE_KEYBOARD_A11Y_BATCH3B5_CLOSEOUT.md) |
| **3B-6** | **Drive interaction certification** | Audit + scorecard + Reference UX #1 decision | **Done** ✅ — [`audits/DRIVE_INTERACTION_CERTIFICATION.md`](./audits/DRIVE_INTERACTION_CERTIFICATION.md) |
| **Wave 5** | **Formal UX-L3 audit** | [`UX_AUDIT_TEMPLATE.md`](./UX_AUDIT_TEMPLATE.md) + scorecard | 3B-6 PASS |

**Out of 3B scope (explicit):** Calendar binary-choice confirms (platform), ShareModal rewrite, enterprise versioning UI, `DriveSearch` wiring.

---

## 12. Should Batch 3 ConfirmModal Purge Occur First?

**Yes — recommend 3B-1 (Batch 3A) first.**

| Rationale | Detail |
|-----------|--------|
| Bounded scope | Exactly **2** call sites already inventoried and classified |
| Highest severity | Permanent data loss; native browser UI breaks platform contract |
| Planned dependency | Batch 2B explicitly excluded these; copy review flagged in Batch 2 closeout |
| Independent of drag parity | Purge migration does not require dnd-kit changes |
| Unblocks certification narrative | “Drive trash cluster” cannot close until purge is on `ConfirmModal` |

**Sequence:** **3B-1 → 3B-3 → 3B-2 → 3B-4 → 3B-5 → 3B-6**

- **3B-3** immediately after **3B-1** reuses destructive copy patterns for per-item permanent delete.
- **3B-2** (drag parity) can ship in parallel with **3B-1** if staffed, but purge should not wait on drag work.

---

## 13. Can Drive Become a Fully Certified Reference UX Module?

| Criterion | Today | After 3B |
|-----------|-------|----------|
| Menu primitives (3A-3) | ✅ Reference for menus | ✅ |
| Layout shell (3C-2) | ✅ Reference for workspace split | ✅ |
| Soft-delete confirms (2B) | ✅ | ✅ |
| Permanent delete contract | ✅ Empty + per-item (3B-1, 3B-3) | ✅ |
| Interaction consistency | ✅ Certified (3B-6) | ✅ Reference bar |
| Formal UX-L3 scorecard | ❌ Not run | Requires Wave 5 audit |

**Answer:** **Yes — Reference UX Module #1 (Approved with Findings).** Interaction certification complete (3B-6). Drive is the canonical reference for confirms, trash flows, folder create modal, menus, and workspace split. **Wave 5** numeric UX-L3 scorecard and human QA matrix execution are recommended but not certification blockers.

**Post-3B interaction assessment:** **Reference-quality** for platform interaction contracts.

---

## 14. Recommended Implementation Order

1. **3B-1** — Batch 3A permanent purge (`ConfirmModal`, 2 sites) + copy review  
2. ~~**3B-3**~~ — Per-item permanent delete confirms — **done**  
3. ~~**3B-2**~~ — `DriveModule` drag-to-trash → `requestMoveToTrash` — **done**  
4. ~~**3B-4**~~ — Folder create modal — **done**  
5. ~~**3B-5**~~ — Keyboard Delete + trash a11y + HTML5 drop confirm — **done**  
6. ~~**3B-6**~~ — Interaction certification — **done**  
7. **Human QA** — Execute [`DRIVE_INTERACTION_MANUAL_QA_MATRIX.md`](./audits/DRIVE_INTERACTION_MANUAL_QA_MATRIX.md)  
8. **Wave 5** — Full numeric UX-L3 scorecard audit (optional gate)  

---

## 15. Duplication Matrix (interaction-specific)

| Pattern | Duplicated across | Consolidation target |
|---------|-------------------|----------------------|
| Empty trash confirm | `drive/trash`, `GlobalTrashBin` | Shared `confirmPermanentPurge` helper or hook (optional) |
| Folder create `prompt` | 7 files | `CreateFolderModal` + single hook |
| Drag-to-trash | `DriveModule`, `starred`, `GlobalTrashBin`, `trash/page` | Policy doc + shared `requestTrash` entry points |
| Trash list UI | `drive/trash`, `GlobalTrashBin` | Future — not required for 3B certification |

---

## 16. Related Documents

| Doc | Relevance |
|-----|-----------|
| [`CONFIRMMODAL_BATCH2_PLAN.md`](./CONFIRMMODAL_BATCH2_PLAN.md) | Batch 3A purge scope |
| [`audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md`](./audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md) | Menu certification (complete) |
| [`INTERACTION_STANDARDS.md`](./INTERACTION_STANDARDS.md) | Destructive / bulk confirm rules |
| [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md) | UX-L3 gate |
| [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md) | Wave 3B slot |

---

**Last updated:** 2026-06-03  
**Next wave:** **Human QA sign-off** + **Wave 5** numeric UX-L3 audit (program choice)
