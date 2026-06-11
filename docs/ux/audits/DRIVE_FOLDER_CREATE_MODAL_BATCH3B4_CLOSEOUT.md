# Drive Folder Create Modal Closeout (Wave 3B-4)

**Status:** **Done**  
**Date:** 2026-06-03  
**Mode:** Implementation  
**Scope:** Replace 7× `prompt('Enter folder name:')` in scoped Drive files

---

## 1. Verdict

**PASS** — All 7 inventoried folder-create `prompt()` call sites migrated to shared `DriveCreateFolderModal`. `pnpm type-check` PASS. API calls run only on modal submit.

---

## 2. Shared component

| File | Role |
|------|------|
| `web/src/components/drive/DriveCreateFolderModal.tsx` | **Created** — single modal for all consumers |

### Props API

```ts
interface DriveCreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void | Promise<void>;
  loading?: boolean;
}
```

### Copy (consistent across surfaces)

| Field | Value |
|-------|-------|
| title | `New folder` |
| label | `Folder name` |
| placeholder | `Untitled folder` |
| confirm | `Create` (shows `Creating…` when loading) |
| cancel | `Cancel` |

**Legacy prompt text** was `Enter folder name:` — replaced with modal label/placeholder per UX spec (clearer, a11y-friendly).

---

## 3. Migrations (7 sites)

| # | File | Trigger | parentId / context preserved |
|---|------|---------|------------------------------|
| 1 | `DriveModule.tsx` | Toolbar + empty-state buttons | `uploadFolderId`, `effectiveDashboardId`, `loadFilesAndFolders`, toasts |
| 2 | `DrivePageContent.tsx` | Sidebar `onNewFolder` | `resolveDriveUploadFolderId`, `refreshTrigger` |
| 3 | `starred/page.tsx` | Sidebar `onNewFolder` | `parentId: null`, `currentDashboard` |
| 4 | `trash/page.tsx` | Sidebar `onNewFolder` | `parentId: null` |
| 5 | `shared/page.tsx` | Sidebar `onNewFolder` | `parentId: null` |
| 6 | `recent/page.tsx` | Sidebar `onNewFolder` | `parentId: null` |
| 7 | `EnhancedDriveModule.tsx` | Toolbar button | `currentFolder \|\| null`, enterprise reload + toasts |

### Per-site pattern

```txt
requestCreateFolder() → setCreateFolderOpen(true)
executeCreateFolder(name) → existing fetch POST /api/drive/folders → close on success
```

---

## 4. Pattern compliance

| Rule | Status |
|------|--------|
| No `prompt()` in scoped Drive files | ✅ |
| Create runs only on submit | ✅ |
| Cancel / Escape / backdrop → no create | ✅ `onClose` |
| Blank name rejected | ✅ submit disabled when `trim()` empty |
| Loading during create | ✅ `loading` prop disables inputs/buttons |
| No backend/API changes | ✅ |

---

## 5. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| `prompt(` in `web/src/app/drive/**` | **0** |
| `prompt(` in `web/src/components/drive/**` | **0** |
| `prompt(` in `DriveModule.tsx` | **0** |

---

## 6. Remaining prompt gaps (out of 3B-4 scope)

| File | Notes |
|------|-------|
| `web/src/components/business/BusinessWorkspaceContent.tsx` | Business drive sidebar `prompt()` — not in 3B-4 file list; candidate for follow-up |

---

## 7. Next wave

**3B-5** — Keyboard Delete + trash a11y pass. Do not start unless explicitly requested.
