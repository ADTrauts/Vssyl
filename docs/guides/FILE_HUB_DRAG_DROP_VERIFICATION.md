# File Hub drag/drop — manual verification (FH-1)

Targeted checks after internal-move vs external-upload separation.

## Upload target folder

| Step | Expected |
|------|----------|
| Open `/drive` at root, upload via sidebar or drop OS files | Files appear at root |
| Open a folder (sidebar or main grid), upload/drop | Files appear inside that folder only |
| Deep-link `?folder={id}`, upload without clicking into folder | Files land in linked folder |

## Internal move (dnd-kit)

| Step | Expected |
|------|----------|
| Drag file onto folder row in main grid | File disappears from current view; visible inside target folder |
| Drag folder onto another folder | Same; no upload overlay |
| Drag item to sidebar folder in FolderTree | Move succeeds; list refreshes |
| Drag item to “move to root” strip when inside a folder | Item moves to dashboard root |
| Drag item to Global Trash bin | Item trashed via Global Trash API |

## External upload overlay

| Step | Expected |
|------|----------|
| Drag OS files over File Hub | Blue “Drop files to upload” overlay |
| Drag File Hub file/folder over main area | **No** upload overlay; folder targets highlight on hover |

## Regression

- Star, share, trash context menu still work
- V_Link sidebar drop on folder rows still works
- Trash page drag-to-trash unchanged

Automated: `web/src/lib/__tests__/driveDragDrop.test.ts`
