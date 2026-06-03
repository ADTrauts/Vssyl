# Notebook Domain Model (Design)

**Status:** Design only — not implemented  
**Parent:** [`NOTEBOOK_PRODUCT_ARCHITECTURE_REVIEW.md`](./NOTEBOOK_PRODUCT_ARCHITECTURE_REVIEW.md)  
**Date:** 2026-06-01

---

## Design principles

1. **Todo domain is authoritative for tasks** — do not fold `Task` into `Note` rows.
2. **Note domain is authoritative for long-form prose** — until a governed merge, `Note` table remains.
3. **Notebook is a composition boundary** — product module that aggregates pages, tasks, and links.
4. **Sections are the unification primitive** — ordered blocks on a page bridge prose and structured work.

---

## Conceptual hierarchy

```
Notebook (per dashboard / business context)
├── Page (≈ Note today)
│   ├── Section (NEW — block model)
│   │   ├── RichTextBlock
│   │   ├── ChecklistBlock (items → optional Task promotion)
│   │   ├── TaskEmbedBlock (reference Task by id)
│   │   ├── FileEmbedBlock (Drive file link)
│   │   ├── EventEmbedBlock (Calendar event link)
│   │   └── ConversationEmbedBlock (Chat thread link)
│   ├── Metadata: tags, pinned, folder
│   └── Shares (NoteShare model — document ACL)
├── Task (Todo domain — may appear embedded on pages)
├── Folder tree (NoteFolder → rename candidate: PageFolder)
└── Templates (UI → persisted Template catalog)
```

---

## Entity catalog

### New (Notebook product layer)

| Entity | Purpose | Persistence (future) |
|--------|---------|----------------------|
| `Notebook` | Logical container; 1:1 with dashboard context initially | Optional table or virtual (dashboardId) |
| `Page` | User-facing document | Maps to `Note` row Phase 1–2 |
| `Section` | Ordered content block | `notebook_sections` (Phase 2+) or JSON on Note |
| `NotebookLink` | Cross-entity edges (page↔task↔file↔event) | `notebook_links` or extend integration link pattern |
| `Template` | Reusable page structure | `notebook_templates` |

### Existing — remain Note-specific

| Current model | Future name | Keep |
|---------------|-------------|------|
| `Note` | `Page` (alias) | `title`, `content`, `tags`, `pinned`, `trashedAt` |
| `NoteFolder` | `PageFolder` | hierarchy, tenant scope |
| `NoteShare` | `PageShare` | viewer/editor roles |

### Existing — remain Todo-specific

| Model | Notebook relationship |
|-------|----------------------|
| `Task` | Embedded, linked, or created-from-page; full lifecycle in `todo*` services |
| `TaskProject` | Notebook “project” view filters tasks by `projectId` |
| `TaskSubtask` | Checklist promotion target |
| `TaskAttachment` / `TaskFileLink` / `TaskEventLink` | Pattern for `NotebookLink` |
| `TaskComment` | Task sidebar — not page comments (Phase 1) |
| `TaskDependency`, `TaskTimeLog`, `TaskWatcher` | Unchanged |

### Shared cross-cutting (platform)

| Concern | Model / service |
|---------|-----------------|
| Tenant scope | `dashboardId`, `businessId`, `householdId` (tasks only today) |
| Trash | `trashedAt` on Note + Task; Global Trash handlers per domain |
| V_Link | `notebook:page` (from `NOTE`), `todo:task` (existing) |
| Activity | `moduleId: 'notebook'` with metadata `{ domain: 'notes'|'todo', ... }` |

---

## Section block types (target schema)

```typescript
// Design-only — not in repo
type SectionBlock =
  | { type: 'richtext'; markdown: string }
  | { type: 'checklist'; items: { id: string; text: string; taskId?: string; done: boolean }[] }
  | { type: 'task_embed'; taskId: string }
  | { type: 'file_embed'; fileId: string }
  | { type: 'event_embed'; eventId: string }
  | { type: 'conversation_embed'; conversationId: string }
  | { type: 'place_embed'; placeId: string };
```

**Phase 1 shortcut:** Store meeting-template markdown in `Note.content`; parse checkboxes client-side; “Promote to task” calls existing Todo create API.

---

## Link model (NotebookLink)

Directed edges (design):

| From | To | Use case |
|------|-----|----------|
| `page` | `task` | Action items from meeting notes |
| `page` | `file` | Reference doc on project page |
| `page` | `event` | Meeting notes ↔ calendar event |
| `page` | `conversation` | Chat decision log |
| `page` | `place` | Site visit notes |
| `task` | `page` | Task “see full brief” |

**Implementation borrow:** `todoIntegrationLinkService` patterns + visibility checks on linked assets.

---

## AI domain responsibilities

| Capability | Owner |
|------------|-------|
| Summarize page | `notebookAIContextService` (reads Note/Page via visibility) |
| Extract action items | `notebookAIActionService` → creates tasks via `todoAIActionService` |
| Link suggestion | Cross-module context engine + NotebookLink write |
| Pinned/recent pages | Existing notes AI providers → renamed providers under `notebook` manifest |

---

## Module id and manifest (future)

| Phase | Product `moduleId` | Backend APIs |
|-------|-------------------|--------------|
| 1 | `notebook` (new) + keep `notes`, `todo` installed | `/api/notes`, `/api/todo` |
| 2 | `notebook` primary in workspace | + `/api/notebook/links` |
| 3 | Deprecate standalone `notes` in sidebar | Optional alias routes |

**Permissions (design):**

- `notebook:read`, `notebook:write` — facade
- Delegates to `notes:*` and `todo:*` until consolidation

---

## What not to merge

| Do not merge | Reason |
|--------------|--------|
| `Task` row into `Note` | Breaks Todo certification, assignment, recurrence |
| Task assignee into `NoteShare` | Different ACL semantics |
| Todo Global Trash handler | Keep `moduleId: 'todo'` |
| `todo*Service` files | Reference #4 artifacts |

---

*See migration phasing in [`NOTEBOOK_MIGRATION_STRATEGY.md`](./NOTEBOOK_MIGRATION_STRATEGY.md), implementation in [`NOTEBOOK_IMPLEMENTATION_PLAN.md`](./NOTEBOOK_IMPLEMENTATION_PLAN.md), backend detail in [`NOTEBOOK_BACKEND_ARCHITECTURE.md`](./NOTEBOOK_BACKEND_ARCHITECTURE.md).*
