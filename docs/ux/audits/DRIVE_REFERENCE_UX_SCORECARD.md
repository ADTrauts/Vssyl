# Drive / File Hub Reference UX Scorecard (Wave 3B-6)

**Status:** Certification audit complete  
**Date:** 2026-06-03  
**Module:** Drive / File Hub (`moduleId: drive`)  
**Evidence:** Code audit 3B-1–3B-5 + 3A-3 menu + 3C-2 layout closeouts  
**Human QA:** Matrix published — sign-off pending ([`DRIVE_INTERACTION_MANUAL_QA_MATRIX.md`](./DRIVE_INTERACTION_MANUAL_QA_MATRIX.md))

---

## Rating scale

| Rating | Meaning |
|--------|---------|
| **PASS** | Meets reference bar for this category |
| **PASS WITH FINDINGS** | Reference-eligible; documented exceptions or pending human verification |
| **FAIL** | Blocks reference designation |

---

## Category results

| # | Category | Rating | Score rationale |
|---|----------|--------|-----------------|
| 1 | **Interaction consistency** | **PASS WITH FINDINGS** | Soft-delete, permanent-delete, folder-create, and drag paths unified on ConfirmModal / `DriveCreateFolderModal` across primary surfaces. **Findings:** `EnhancedDriveModule` supports bulk delete only (no per-item context menu — 3A-3.5); starred share flow remains stub (D-8). |
| 2 | **Navigation consistency** | **PASS** | All active Drive routes use `WorkspaceSplitLayout` + `DriveSidebar` (`DrivePageContent`, starred, shared, recent, trash, business `case 'drive'`). Breadcrumbs/folder nav consistent in `DriveModule`. |
| 3 | **Confirmation safety** | **PASS** | Zero `prompt()` / native `confirm()` in Drive cluster. Soft-delete gated on menu, details, bulk, keyboard, dnd-kit drag, HTML5 drop (GlobalTrashBin + trash page). Permanent delete gated on empty-trash + per-item forever. |
| 4 | **Layout consistency** | **PASS** | `WorkspaceSplitLayout` certified rollout (3C-2). Business drive branch matches personal shell. `DriveModule` inner split for details panel. |
| 5 | **Menu consistency** | **PASS WITH FINDINGS** | `DriveModule` + `starred` → `ContextMenu`; filter → `Popover`; sidebar New → `DropdownMenu` (3A-3). **Findings:** `shared` / `recent` routes have no item context menus (read-oriented routes); `DriveSearch.tsx` orphan unmigrated. |
| 6 | **Accessibility baseline** | **PASS WITH FINDINGS** | Delete key wired (3B-5); GlobalTrashBin + trash drop zone `aria-label` / focus rings (3B-5). **Findings:** Trash page per-item restore/delete buttons use `title` only; keyboard help modal documents Ctrl+N / Ctrl+K / arrows but only **Delete** is implemented; human WCAG pass not recorded. |
| 7 | **Cross-module integration** | **PASS WITH FINDINGS** | `GlobalTrashBin` integrates dnd-kit + HTML5 drop with confirm; `driveItemTrashed` events; trash API scoping. **Findings:** Scheduling HTML5 drop uses hard-delete event (documented exception); cross-module drop confirm added 3B-5. |
| 8 | **Mobile readiness** | **PASS WITH FINDINGS** | Layout primitives are responsive-capable; touch drag uses dnd-kit pointer sensor. **Findings:** No dedicated mobile Drive QA recorded; 375px matrix rows not human-signed. |

---

## Summary

| Metric | Value |
|--------|-------|
| Categories PASS | 3 |
| Categories PASS WITH FINDINGS | 5 |
| Categories FAIL | 0 |
| Native confirm/prompt in Drive cluster | **0** |
| Folder-create `prompt()` in Drive experiences | **0** |

---

## Reference designation input

**Interaction + confirmation contract:** Meets reference bar.  
**Full UX-L3 numeric scorecard (Wave 5):** Not run — separate program.  
**Human QA gate:** Matrix ready; execution pending.

---

## Related

- [`DRIVE_INTERACTION_CERTIFICATION.md`](./DRIVE_INTERACTION_CERTIFICATION.md)
- [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md) — numeric 0–5 model (Wave 5)
