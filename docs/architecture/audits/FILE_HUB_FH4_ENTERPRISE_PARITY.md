# Enterprise Capability Parity Matrix (FH-4 / P0-E1)

**Date:** 2026-05-31  
**Components:** `DriveModule` vs `EnhancedDriveModule` vs declared manifest capabilities

---

## Declared capabilities (manifest / registry)

`vlink`, `realtime`, `trash`, `search`, `notifications`, `preview`, `ai`, `businessWorkspace`

---

## Parity matrix

| Capability | Standard `DriveModule` | `EnhancedDriveModule` (before FH-4) | After FH-4 |
|------------|------------------------|-------------------------------------|------------|
| **V_Link** | `VLinkIndicator`, `VLinkCornerMarker`, sidebar drop | None | Indicators on grid/list items |
| **Realtime** | `useDriveWebSocket` → reload on all drive events | Manual `refreshTrigger` only | `useDriveWebSocket` wired |
| **Bulk delete** | `useGlobalTrash().trashItem` batch | Toast "not implemented" | Global Trash batch delete |
| **Trash** | Global Trash integration | No trash path | Bulk trash via Global Trash |
| **Share/unshare** | Share modals + API | AdvancedSharingModal | Unchanged (already present) |
| **Upload** | POST `/api/drive/files` | Same | Same |
| **Browse API** | Permission-aware lists | Same API | Same |

---

## Remaining enterprise gaps (P2)

| Gap | Notes |
|-----|-------|
| `DriveDetailsPanel` | Enterprise module lacks full details / activity panel |
| Drag-and-drop / DnD kit | Enterprise grid lacks move/reorder parity |
| Star/pin UI | Enterprise maps `starred: false` statically |
| Bulk move/download | Still partial in enterprise bulk bar |

**FH-4 success criterion met:** V_Link, realtime, and bulk delete parity closed without enterprise UI redesign.
