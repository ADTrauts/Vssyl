# Reference Module Registration — Drive / File Hub

**Registration type:** Reference UX Module **#1**  
**Status:** **Approved with Findings**  
**Date registered:** 2026-06-03  
**moduleId:** `drive`  
**User-facing name:** File Hub

---

## Registration summary

| Field | Value |
|-------|-------|
| **Decision** | Approved with Findings |
| **UX level** | UX-L3 interaction + L2 layout/menus (reference bar) |
| **Benchmark role** | Primary copy target for workspace module UX |
| **Architecture note** | Also Reference Implementation #1 for code — see architecture audits |

---

## Why Drive qualified

Drive exercises the largest share of platform UX patterns in one module:

| Pattern | Drive implementation |
|---------|---------------------|
| Workspace layout | `WorkspaceSplitLayout` on all active routes + business branch |
| Context menus | `ContextMenu` on file/folder items |
| Filter / panels | `Popover` |
| Sidebar actions | `DropdownMenu` (“New”) |
| Soft delete | `ConfirmModal` on menu, details, bulk, keyboard, drag, HTML5 drop |
| Permanent delete | `ConfirmModal` empty-trash + per-item forever |
| Folder create | `DriveCreateFolderModal` (8 surfaces, 0 `prompt()`) |
| Global trash | dnd-kit + platform bin integration |
| Details panel | Secondary workspace column |
| Empty / loading | `EmptyState`, `Spinner`, `LoadingOverlay` patterns |

**Interaction debt from 3B-0 (D-1–D-7) is resolved** in code audit (3B-6).

---

## Waves that contributed

| Wave | Contribution | Closeout |
|------|--------------|----------|
| **2A/2B** | ConfirmModal standardization (soft delete) | `CONFIRMMODAL_BATCH2B_CLOSEOUT.md` |
| **3A-3** | Menu reference certification | `DRIVE_MENU_REFERENCE_CLOSEOUT.md` |
| **3C-2** | `WorkspaceSplitLayout` rollout | Roadmap 3C-2 |
| **3B-1** | Empty-trash ConfirmModal | `DRIVE_PERMANENT_PURGE_BATCH3A_CLOSEOUT.md` |
| **3B-3** | Per-item permanent delete confirm | `DRIVE_PERMANENT_DELETE_PER_ITEM_BATCH3B3_CLOSEOUT.md` |
| **3B-2** | Drag-to-trash parity | `DRIVE_DRAG_TO_TRASH_PARITY_BATCH3B2_CLOSEOUT.md` |
| **3B-4** | Folder create modal (7 sites) | `DRIVE_FOLDER_CREATE_MODAL_BATCH3B4_CLOSEOUT.md` |
| **3B-4b** | Business workspace folder parity | `DRIVE_FOLDER_CREATE_BUSINESS_PARITY_BATCH3B4B_CLOSEOUT.md` |
| **3B-5** | Keyboard Delete + trash a11y + HTML5 drop confirm | `DRIVE_KEYBOARD_A11Y_BATCH3B5_CLOSEOUT.md` |
| **3B-6** | Interaction certification | `DRIVE_INTERACTION_CERTIFICATION.md` |
| **5A** | Platform scorecard framework (Drive = benchmark) | `UX_CERTIFICATION_STANDARD.md` |

---

## Scorecard summary (3B-6 / pre-5A module audit)

| Category | Rating |
|----------|--------|
| Interaction consistency | PASS WITH FINDINGS |
| Navigation consistency | PASS |
| Confirmation safety | PASS |
| Layout consistency | PASS |
| Menu consistency | PASS WITH FINDINGS |
| Accessibility baseline | PASS WITH FINDINGS |
| Cross-module integration | PASS WITH FINDINGS |
| Mobile readiness | PASS WITH FINDINGS |

Full detail: [`DRIVE_REFERENCE_UX_SCORECARD.md`](./DRIVE_REFERENCE_UX_SCORECARD.md)

**Wave 5A:** Re-score against 11-category platform scorecard when next module certification begins.

---

## Known findings (carry-forward)

| ID | Finding | Severity | Blocks reference? |
|----|---------|----------|-------------------|
| F-1 | Manual QA matrix not human-signed | Process | No |
| F-2 | Starred share modal stub | Product | No |
| F-3 | No file version / restore UI | Product | No |
| F-4 | `EnhancedDriveModule` bulk-only delete (no context menu) | Advisory | No |
| F-5 | Keyboard help documents unimplemented shortcuts (Ctrl+N, Ctrl+K, arrows) | Docs/a11y | No |
| F-6 | Trash page restore/delete icon buttons lack `aria-label` | A11y | No |
| F-7 | `DriveSearch.tsx` orphan | Hygiene | No |
| F-8 | Mobile 375px QA not recorded | QA | No |

---

## Copy targets for other modules

When certifying another module, copy Drive patterns for:

| Need | Drive reference |
|------|-----------------|
| Move to trash | `requestMoveToTrash` + `ConfirmModal` (`DriveModule.tsx`) |
| Bulk delete | `requestBulkMoveToTrash` pattern |
| Permanent purge | `pendingEmptyTrash` + `ConfirmModal` |
| Create folder / named entity | `DriveCreateFolderModal` |
| Workspace chrome | `DrivePageContent` + `WorkspaceSplitLayout` |
| Business hub | `PlaceWorkspaceLanding` pattern + Drive business branch |
| Right-click actions | `buildDriveContextMenuItems` + `ContextMenu` |
| Sidebar New menu | `DriveSidebar` + `DropdownMenu` |

---

## Future recertification requirements

Re-register or re-audit when:

1. New destructive flows ship without ConfirmModal
2. `WorkspaceSplitLayout` removed from primary Drive routes
3. Native `prompt()`/`confirm()` reintroduced
4. Global trash contract changes for drive items
5. Major mobile-only Drive redesign

**Recommended cadence:** Annual or after any Wave 3B-class interaction program on Drive.

---

## Related registrations

| Type | Drive status |
|------|--------------|
| Reference UX #1 | **This document** |
| Reference Architecture | Strong candidate / file hub code reference |
| Reference Workspace | N/A (product module) |
| Reference AI | Partial (AI context providers exist; not AI reference) |
| Reference Calendar | N/A |

---

## Related

- [`DRIVE_INTERACTION_CERTIFICATION.md`](./DRIVE_INTERACTION_CERTIFICATION.md)
- [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md)
- [`UX_CERTIFICATION_STANDARD.md`](../UX_CERTIFICATION_STANDARD.md)

**Last updated:** 2026-06-03 (Wave 5A registration)
