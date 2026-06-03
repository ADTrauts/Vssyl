# Notebook Widget Architecture

**Phase:** 0.75  
**Parent:** [NOTEBOOK_FRONTEND_ARCHITECTURE.md](./NOTEBOOK_FRONTEND_ARCHITECTURE.md)  
**Date:** 2026-06-01

---

## Principles

1. **Dashboard widgets** are read-only or single-action entry points — not full modules.
2. **Domain data** always fetched from owning module APIs (notes, todo, calendar, drive).
3. **Notebook widgets** compose; they do not duplicate Todo/File Hub widget logic.
4. **Permissions:** widget render requires dashboard context + module install.

---

## Primary widget: `notebook` (Phase 1)

Replaces `notes` widget over time.

| Field | Value |
|-------|-------|
| **id** | `notebook` |
| **moduleId** | `notebook` |
| **category** | `productivity` |
| **Component** | `NotebookDashboardWidget.tsx` |
| **Data sources** | `GET /api/notes?...` (recent 1), `GET /api/todo` (due today count) |
| **Optional** | `GET /api/notebook/summary` |
| **Permissions** | `notebook:read` or implicit if `notes`+`todo` installed |
| **Actions** | Open Notebook; New meeting page; New task |

### Layout (card)

```
┌─────────────────────────────┐
│ Notebook                    │
│ Last: "Leadership Mar 4"  → │
│ 3 tasks due today           │
│ [+ Meeting page] [Tasks]    │
└─────────────────────────────┘
```

---

## Context rail widgets (in-module, not dashboard)

Used inside `NotebookEditorLayout` / `NotebookContextRail`.

| Widget | Phase | Owner data | API | Permissions |
|--------|-------|------------|-----|-------------|
| **TasksPanel** | 1 | Todo | `/api/todo` | todo read |
| **LinkedTasksPanel** | 3 | Notebook + Todo | `/api/notebook/links`, `/api/todo` | notebook + todo |
| **FilesPanel** | 5 | File Hub | Drive list + links | drive read |
| **MeetingPanel** | 4 | Calendar | event by id | calendar read |
| **CalendarMini** | 5+ | Calendar | today events | calendar read |
| **AISummaryPanel** | 6 | Notebook | `/api/notebook/ai/...` | notebook read |
| **ActivityPanel** | 3 | Platform activity | filtered feed | dashboard read |

**Naming:** Suffix `Panel` — distinguish from dashboard `Widget`.

---

## Reusable dashboard widgets (relationship to other modules)

| Widget | Use in Notebook? | Verdict |
|--------|------------------|---------|
| `notes` (existing) | — | **DEPRECATE** → `notebook` |
| `quicknotes` | Scratchpad | **KEEP separate** — not Notebook |
| Todo-specific dashboard widget | If exists | **Do not duplicate** — Notebook widget includes due count |
| Calendar widget | — | **Link out** to Calendar module, not embed in notebook widget |
| Drive recent files | Phase 5 | Optional **FilesPanel** in editor only |

---

## Widget registry entries (target)

```typescript
// Design-only — widgetRegistry.ts Phase 1
notebook: {
  id: 'notebook',
  name: 'Notebook',
  description: 'Recent pages and tasks due today',
  icon: 'notebook', // map to FileText or custom
  category: 'productivity',
  moduleId: 'notebook',
  defaultSize: { w: 4, h: 2 },
  component: 'NotebookDashboardWidget',
}
```

---

## Data fetching pattern

```typescript
// Pattern: parallel fetch, fail soft per source
const [page, tasks] = await Promise.all([
  getNotes({ dashboardId, limit: 1, sort: 'updatedAt' }),
  getTasks({ dashboardId, dueBefore: endOfToday, limit: 5 }),
]);
```

**No merged backend required** Phase 1 if client composes.

---

## Permission matrix

| Surface | notes | todo | notebook | drive | calendar |
|---------|-------|------|----------|-------|----------|
| Dashboard `notebook` widget | read | read | read | — | — |
| TasksPanel | — | read/write | — | — | — |
| FilesPanel | — | — | — | read | — |
| MeetingPanel | — | — | — | — | read |

**Business context:** pass `businessId` on all fetches.

---

## Realtime (deferred)

| Widget | Realtime Phase |
|--------|----------------|
| TasksPanel | Todo `todoRealtimeService` existing — subscribe in TaskList |
| Page editor | None Phase 1–6 |
| ActivityPanel | Platform feed — Phase 3+ |

---

## File paths (planned)

```
web/src/components/
  notebook/widgets/
    NotebookDashboardWidget.tsx
  notebook/panels/
    NotebookTasksPanel.tsx
    NotebookLinkedTasksPanel.tsx      # Phase 3
    NotebookFilesPanel.tsx            # Phase 5
    NotebookMeetingPanel.tsx          # Phase 4
    NotebookAISummaryPanel.tsx        # Phase 6
    NotebookActivityPanel.tsx         # Phase 3
```

---

*Implementation checklist: [NOTEBOOK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_IMPLEMENTATION_PLAN.md).*
