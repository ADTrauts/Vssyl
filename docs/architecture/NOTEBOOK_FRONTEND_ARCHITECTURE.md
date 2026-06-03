# Notebook Frontend Architecture

**Phase:** 0.75 (implementation through 6.5)  
**Parent:** [NOTEBOOK_TECHNICAL_ARCHITECTURE.md](./NOTEBOOK_TECHNICAL_ARCHITECTURE.md)  
**Date:** 2026-06-01  
**Certification audit (Phase 7):** [NOTEBOOK_OPERATION_MATRIX.md](./audits/NOTEBOOK_OPERATION_MATRIX.md) — Home/workspace ops inventoried

---

## 1. Existing Notes frontend (KEEP / WRAP / DEPRECATE / REPLACE)

| Artifact | Path | Disposition | Phase |
|----------|------|-------------|-------|
| `NotesModule.tsx` | `web/src/components/notes/NotesModule.tsx` | **WRAP** → `PageEditor` re-export | 1 |
| `web/src/api/notes.ts` | API client | **KEEP** | 1+ |
| `web/src/app/notes/page.tsx` | Personal route | **DEPRECATE** → redirect `/notebook` | 1.1 |
| `web/src/app/notes/layout.tsx` | Layout | **DEPRECATE** | 1.1 |
| `web/src/app/business/.../workspace/notes/page.tsx` | Business route | **REPLACE** with `/workspace/notebook` | 1 |
| `NotesWidget.tsx` | Dashboard widget | **DEPRECATE** → `NotebookWidget` | 1 |
| `QuickNotesWidget.tsx` | Utility scratchpad | **KEEP** separate | — not Notebook domain |
| `BusinessWorkspaceContent` `case 'notes'` | Switch | **DEPRECATE** → `case 'notebook'` | 1 |
| `moduleIcons.ts` `notes` | Icon | **KEEP** for legacy; add `notebook` | 1 |
| `coreModuleRegistry` `notes` | Runtime | **KEEP** dependency; add `notebook` | 1 |
| `widgetRegistry` `notes` | Widget | **DEPRECATE** | 1 |

**Survival rate Phase 1:** `NotesModule` + `api/notes.ts` unchanged internally; shell is new.

---

## 2. Route map

| Route | Component | Phase |
|-------|-----------|-------|
| `/notebook` | `NotebookHomePage` | 1 |
| `/notebook/page/[id]` | `NotebookPageRoute` → shell + `PageEditor` | 1 |
| `/notebook/templates` | `NotebookTemplatesPage` | 1 |
| `/notebook/shared` | `NotebookSharedPage` (filter) | 1 |
| `/notebook/trash` | `NotebookTrashPage` | 1 |
| `/notebook/tasks` | `NotebookTasksPage` (full `TaskList`) | 1 optional |
| `/business/[id]/workspace/notebook` | `NotebookWorkspaceLanding` + shell | 1 |
| `/business/[id]/workspace/notebook/page/[id]` | Page editor | 1 |

**Legacy redirects (Phase 1.1):**

- `/notes` → `/notebook`
- `/business/.../workspace/notes` → `.../notebook`

---

## 3. Layout structure

```
NotebookLayout (client)
├── NotebookSidebar
├── NotebookMain
│   ├── [list views] NotebookPageList | NotebookHome | ...
│   └── [editor] NotebookEditorLayout
│       ├── PageEditor (wraps NotesModule)
│       └── NotebookContextRail (Phase 1: collapsible Tasks panel)
└── (mobile) NotebookBottomNav
```

### `NotebookLayout` responsibilities

- Load `dashboardId` / `businessId` from context (same as NotesModule)
- Sidebar nav state (`activeView`: home | recent | favorites | ...)
- **Do not** duplicate Notes data fetching — delegate to children

---

## 4. Component tree (Phase 1)

```
components/notebook/
  NotebookShell.tsx              # Layout + outlet
  NotebookSidebar.tsx            # Nav items
  NotebookHome.tsx               # Pinned + recent + due tasks teaser
  NotebookPageList.tsx           # Filtered lists (meetings = tag filter)
  NotebookTemplatesGallery.tsx   # Static templates (move from NotesModule constants)
  NotebookWorkspaceLanding.tsx   # Business hub cards
  NotebookEditorLayout.tsx       # Editor + right rail
  NotebookTasksPanel.tsx         # Embeds TaskList + QuickTaskInput
  NotebookPromoteToTask.tsx      # Selection → POST /api/todo
  PageEditor.tsx                 # thin wrapper: <NotesModule embedded mode />
  index.ts
```

### Embed mode for `NotesModule` (Phase 1 refactor plan)

Props (design — implement Phase 1):

```typescript
interface PageEditorProps {
  pageId?: string;
  dashboardId?: string;
  businessId?: string | null;
  embedded?: boolean;      // hide duplicate chrome
  onPageCreated?: (id: string) => void;
}
```

**Minimal change strategy:** Wrap without refactor first; peel chrome in Phase 1.1.

---

## 5. Todo integration (frontend only)

| Component | Source | Disposition |
|-----------|--------|-------------|
| `TaskList` | `web/src/components/todo/TaskList.tsx` | **WRAP** in `NotebookTasksPanel` |
| `QuickTaskInput` | `web/src/components/todo/QuickTaskInput.tsx` | **WRAP** |
| `TaskForm` / `TaskDetail` | todo/ | **KEEP** — open in rail modal |
| `TodoModule.tsx` | Full module | **Do not embed whole module** — too heavy |

**API:** `web/src/api/todo.ts` (or existing todo client) — **unchanged**.

**Promote to task flow:**

1. User selects markdown checklist line or text in `PageEditor`.
2. `NotebookPromoteToTask` opens `TaskForm` prefilled.
3. `POST /api/todo` — standard path.
4. `POST /api/notebook/pages/:pageId/links` (`ACTION_SOURCE`); Phase 4 adds `calendarEventId` in metadata when page has linked event.

---

## 6. Right context rail (phased)

| Panel | Phase | Data source |
|-------|-------|-------------|
| **Tasks** | 1 | `/api/todo` |
| **Linked events (meeting)** | 4 ✅ | `/api/notebook/pages/:id/links?targetType=CALENDAR_EVENT` + `calendarAPI.searchEvents` |
| **Linked tasks** | 3 ✅ | `/api/notebook/pages/:id/links?targetType=TASK` |
| **Files** | ✅ Phase 5 | `NotebookLinkedFilesPanel` + `DriveFilePicker`; open `/drive?file=…`, download `/api/drive/files/:id/download` |
| **AI** | ✅ Phase 6 | `NotebookAIPanel` → `/api/notebook/pages/:pageId/ai/*` |
| **Home / workspace** | ✅ Phase 6.5 | `NotebookHome` → `/api/notebook/workspace/context` |
| **Activity** | 3 | Activity feed filter |

Phase 1: **Tasks panel only** (toggle).

---

## 7. State management

| State | Location | Notes |
|-------|----------|-------|
| Active page id | URL `[id]` | Source of truth |
| Sidebar view | URL query `?view=recent` or React state | Prefer query for shareable nav |
| Dashboard scope | `DashboardContext` | Existing |
| Page list cache | Component `useState` + fetch | No global store Phase 1 |
| Task list | `TaskList` internal | Unchanged |

**Avoid** new Zustand/Context for Notebook until Phase 3 complexity.

---

## 8. API clients

| Client | Path | Phase |
|--------|------|-------|
| `web/src/api/notes.ts` | `/api/notes` | **KEEP** |
| `web/src/api/notebook.ts` | `/api/notebook/summary` | 1 optional |
| `web/src/api/todo.ts` | `/api/todo` | **KEEP** |
| `web/src/api/notebookLinks.ts` | `/api/notebook/links` | 3 |

---

## 9. Module platform integration

| Requirement | Implementation |
|-------------|----------------|
| `NotebookWorkspaceLanding.tsx` | `components/notebook/NotebookWorkspaceLanding.tsx` |
| `BusinessWorkspaceContent` | `case 'notebook':` |
| `BrandedWorkDashboard` | `getModuleIcon('notebook')`, `getModuleName` |
| `widgetRegistry` | `notebook` entry |
| `registerBuiltInModules` | Server-side AI — not frontend |

---

## 10. Folder structure (target)

```
web/src/
  app/
    notebook/
      layout.tsx                 # NotebookLayout
      page.tsx                   # Home
      page/[id]/page.tsx
      templates/page.tsx
      shared/page.tsx
      trash/page.tsx
      tasks/page.tsx             # optional
    business/[id]/workspace/
      notebook/
        page.tsx                 # Landing
        page/[id]/page.tsx
  components/
    notebook/                    # NEW (see §4)
    notes/
      NotesModule.tsx            # KEEP, wrapped
    todo/                        # KEEP, embed subsets
  api/
    notes.ts                     # KEEP
    notebook.ts                  # NEW Phase 1
```

---

## 11. Accessibility & UX constraints

- Sidebar keyboard nav
- Page editor retains markdown contrast rules (`ui-standards.mdc`)
- Tasks panel: reachable without losing editor focus (split view desktop)
- Mobile: bottom nav per [NOTEBOOK_NAVIGATION_MODEL.md](./NOTEBOOK_NAVIGATION_MODEL.md)

---

*Widgets: [NOTEBOOK_WIDGET_ARCHITECTURE.md](./NOTEBOOK_WIDGET_ARCHITECTURE.md). Plan: [NOTEBOOK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_IMPLEMENTATION_PLAN.md).*
