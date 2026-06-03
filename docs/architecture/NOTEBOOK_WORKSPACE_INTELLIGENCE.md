# Notebook Workspace Intelligence

**Phase:** 6.5  
**Date:** 2026-06-02  
**Status:** Implemented  

**Purpose:** Workspace-level read aggregation for Notebook Home — answer “what is happening across my workspace right now?” without AI generation.

---

## Ownership boundaries

| Data | Owner | Notebook access |
|------|--------|-----------------|
| Pages | **Notes** | `notesVisibilityService.listPages` |
| Tasks | **Todo** | `todoVisibilityService` (`listAccessibleTasks`, `listOverdueTasks`, `listDueSoonTasks`) |
| Calendar events | **Calendar** | `calendarVisibilityService.listEventsInRange` |
| Drive files | **File Hub** | `driveVisibilityService.listAccessibleDriveFilesForBrowse`, `fetchAccessibleActiveFiles` |
| Operational links | **Notebook** | `prisma.notebookLink` (Notebook-owned table only) |
| Page read for links | **Notes** | `notesPermissionService.findReadablePage` |
| Dashboard scope | **Todo** | `resolveDashboardScopeForRead` (fail closed) |

Notebook **does not** own tasks, files, or events. It composes certified visibility reads into `NotebookWorkspaceContext`.

---

## Canonical API

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/notebook/workspace/context?dashboardId=&businessId=` | `NotebookWorkspaceContext` |
| GET | `/api/notebook/workspace/insights?...` | `{ workspaceInsights, suggestedFocus }` |

Controllers: `notebookWorkspaceContextController` — no Prisma.

---

## DTO (`notebookWorkspaceContextTypes.ts`)

- **Pages:** `recentPages`, `pinnedPages`, `favoritePages` (pinned = favorites)
- **Tasks:** `openTasks`, `overdueTasks`, `dueSoonTasks`
- **Meetings:** `upcomingMeetings` (14-day window), `recentMeetingPages` (pages with `AGENDA` links)
- **Files:** `recentFiles` (linked files + drive browse, deduped)
- **Activity:** `activitySummary` (recent link actions on dashboard)
- **Insights:** `workspaceInsights` + `suggestedFocus` (rule-based, no LLM)

---

## Insight rules (no AI)

| Type | Severity | Trigger |
|------|----------|---------|
| `overdue_tasks` | warning | overdue count > 0 |
| `tasks_due_today` | info | open tasks due today |
| `meetings_today` | info | events starting today |
| `open_tasks` | info | non-done task count |
| `pages_without_tasks` | info | recent pages with no TASK links |
| `meetings_unresolved_actions` | warning | AGENDA meeting pages without TASK links |
| `recently_edited_pages` | info | pages updated in last 7 days |

`suggestedFocus` derives human-readable lines from the above (max 5).

---

## Future consumers

### AI (Phase 6+)

Twin or `notebookAIContextService` may call `getWorkspaceContext` for dashboard-wide grounding before page-specific `getPageContext`.

### Dashboards / widgets

Workspace snapshot suitable for business workspace landing cards and cross-module “focus” widgets.

### Search

Denormalized titles from pages/tasks/meetings in context — no new index in this phase.

---

## Related docs

- [NOTEBOOK_CONTEXT_ARCHITECTURE.md](./NOTEBOOK_CONTEXT_ARCHITECTURE.md) — page-level context
- [NOTEBOOK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_IMPLEMENTATION_PLAN.md)
- [NOTEBOOK_FRONTEND_ARCHITECTURE.md](./NOTEBOOK_FRONTEND_ARCHITECTURE.md)
