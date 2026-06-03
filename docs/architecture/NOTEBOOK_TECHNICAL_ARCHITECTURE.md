# Notebook Technical Architecture

**Phase:** 0.75 — Technical architecture + implementation planning  
**Date:** 2026-06-01  
**Status:** Blueprint (pre-implementation) — **no schema, routes, or services approved for coding yet**  
**Product approval:** ✅ Phase 0.5 | **Implementation:** ❌ Not started  

**Product specs:** [NOTEBOOK_WORKSPACE_ARCHITECTURE.md](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md), [NOTEBOOK_PAGE_TYPES.md](./NOTEBOOK_PAGE_TYPES.md), [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md), [NOTEBOOK_AI_STRATEGY.md](./NOTEBOOK_AI_STRATEGY.md), [NOTEBOOK_NAVIGATION_MODEL.md](./NOTEBOOK_NAVIGATION_MODEL.md), [NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md](./NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md)

**Implementation detail:**

| Layer | Document |
|-------|----------|
| Backend | [NOTEBOOK_BACKEND_ARCHITECTURE.md](./NOTEBOOK_BACKEND_ARCHITECTURE.md) |
| Frontend | [NOTEBOOK_FRONTEND_ARCHITECTURE.md](./NOTEBOOK_FRONTEND_ARCHITECTURE.md) |
| Widgets | [NOTEBOOK_WIDGET_ARCHITECTURE.md](./NOTEBOOK_WIDGET_ARCHITECTURE.md) |
| Plan & phases | [NOTEBOOK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_IMPLEMENTATION_PLAN.md) |
| Certification | [NOTEBOOK_CERTIFICATION_STRATEGY.md](./NOTEBOOK_CERTIFICATION_STRATEGY.md) |

**Reference modules (patterns only — do not modify):** File Hub #1, Chat #2, Calendar #3, Todo #4.

---

## Executive summary

Notebook is a **composition module** (`moduleId: notebook`): product shell + orchestration over **existing domains**. Pages remain the **Notes** bounded context (`Note` table, `/api/notes`) until a governed schema phase. Tasks remain **Todo** (`/api/todo`, `todo*Service`).

| Principle | Rule |
|-----------|------|
| No Todo architecture changes | Task mutations only via Todo certified paths |
| No schema in Phase 1 | Tags/metadata conventions only |
| Services appear in phases | Phase 1 = facade + frontend; document-domain services Phase 2+ |
| Relationships | **B: NotebookLink + V_Link** (see §4) |
| Certification | Notebook Level 3 after Phase 6–7; Todo #4 unchanged |

**Phase 1 build first:** Notebook shell (routes, layout, sidebar, landing) wrapping `NotesModule` + `TaskList` embed + promote-to-task → Todo API + `notebook` manifest/widget — **zero new Prisma, zero `todo*Service` edits**.

---

## Part 1 — Notes survivability assessment

Full tables: [NOTEBOOK_BACKEND_ARCHITECTURE.md](./NOTEBOOK_BACKEND_ARCHITECTURE.md) §1, [NOTEBOOK_FRONTEND_ARCHITECTURE.md](./NOTEBOOK_FRONTEND_ARCHITECTURE.md) §1.

### Summary

| Verdict | Count | Meaning |
|---------|-------|---------|
| **WRAP** | Majority | Used inside Notebook UI/API unchanged Phase 1 |
| **KEEP** | Domain persistence | `Note`, routes, controllers until Phase 2 extraction |
| **DEPRECATE** | Product surface | Standalone `/notes` nav, `NotesWidget`, `notes` workspace case (phased) |
| **REPLACE** | Naming/product only | User-facing “Note” → “Page”; module id `notes` → hidden behind `notebook` |

**~85% of Notes code survives Phase 1** as-is. Replacement is **product shell**, not delete Notes domain.

---

## Part 2 — Notebook service architecture

### 2.1 Services that **must** exist (by phase)

Not all listed names ship at once. **Avoid duplicating Todo/Calendar/Drive/Chat.**

| Service | Phase | Exists? | Role |
|---------|-------|---------|------|
| `notebookSummaryService` | 1 | New (optional) | Read-only: recent pages + due task counts |
| `notebookFacadeController` | 1 | New | Thin HTTP; calls summary + delegates |
| **`notesPageService`** | 2 | Extract from `notesController` | Page CRUD (Notes domain) |
| **`notesFolderService`** | 2 | Extract from `notesFolderController` | Folders |
| **`notesShareService`** | 2 | Extract from `notesShareController` | Share + notification |
| **`notesVisibilityService`** | 2 | New | List/get/search scoped reads |
| **`notesPolicyDual`** | 2 | New | Read + mutation dual |
| **`notesTrashService`** | 2 | New | Global Trash handler for `note` |
| **`notesActivityService`** | 2 | Extract emits | Module activity adapter |
| `notebookLinkService` | 3 | New | Operational page↔entity links |
| `notebookTemplateService` | 3 | New | Template catalog (static → DB) |
| `notebookSearchService` | 5 | New | Federated page + task search facade |
| `notebookAIContextService` | 4 | New | Read providers (delegate notes/todo) |
| `notebookAIActionService` | 6 | New | Orchestrate writes → domain AI services |
| `notebookActivityService` | 3 | New | Facade `moduleId: notebook` metadata |
| `notebookNotificationService` | 3 | Thin | Wrap `notes_shared` + future types |
| `notebookRealtimeService` | 7+ | Optional | Only if live co-editing product-required |

### 2.2 Services that should **not** exist (duplication traps)

| Rejected name | Why | Use instead |
|---------------|-----|-------------|
| `notebookPageService` (mutations) | Duplicates Notes domain | `notesPageService` |
| `notebookTaskService` | Violates Todo #4 | `todoTaskService` |
| `notebookCalendarService` | Duplicates Calendar | Calendar services + links |
| `notebookFileService` | Duplicates File Hub | Drive APIs + links |
| `notebookChatService` | Duplicates Chat | Chat APIs + links |
| `notebookWorkspaceService` | Vague | `notebookSummaryService` (read) + layout is frontend |

---

## Part 3 — Data ownership

| Entity / data | Owner module | Table / API | Notebook role |
|---------------|--------------|-------------|---------------|
| **Page** (Note row) | **Notes** (`notes`) | `notes`, `/api/notes` | Primary UX surface |
| **PageFolder** | Notes | `note_folders` | Nav tree |
| **PageShare** | Notes | `note_shares` | Document ACL |
| **Page metadata** (`pageType`) | Notes (Phase 1: tags) | `tags` / future JSON | Filtering |
| **Section blocks** | Notes (Phase 7+ schema) | TBD `notebook_sections` | Block editor |
| **Template catalog** | Notebook product | Phase 3 table or static | Create-page flows |
| **NotebookLink** | Notebook | Phase 3 `notebook_links` | Operational edges |
| **Task** | **Todo** | `tasks`, `/api/todo` | Embed + promote |
| **TaskProject** | Todo | `task_projects` | Project view filter |
| **TaskFileLink / TaskEventLink** | Todo | todo tables | Task-centric links |
| **File** | **File Hub** | Drive | Link/embed only |
| **Calendar event** | **Calendar** | Calendar API | Link/embed only |
| **Conversation** | **Chat** | Chat API | Link only |
| **Place listing** | **Place** | Place API | Link only |
| **V_Link** | **Platform** | `vlinks` | User-curated graph |
| **Workspace summary** | Notebook (derived) | No table Phase 1 | Aggregated read |

---

## Part 4 — Relationship architecture

**Recommendation: B — NotebookLink + V_Link** (unchanged from [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md)).

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **A. Pure V_Link** | Single graph | Wrong semantics (membership≠work); no `linkRole`; Todo links orphaned | ❌ |
| **B. NotebookLink + V_Link** | Operational vs social split; matches Todo #4 + File Hub #1 | Two systems to document | ✅ |
| **C. Todo links only** | Reuses `TaskFileLink` | No page-centric index; meeting→tasks awkward | ❌ Phase 1 only |

**Phase 1:** Deep links (URLs). **Phase 3:** `notebookLinkService` + table (schema gate).

---

## Part 5–7 — UI, widgets, AI

See dedicated docs:

- [NOTEBOOK_FRONTEND_ARCHITECTURE.md](./NOTEBOOK_FRONTEND_ARCHITECTURE.md)
- [NOTEBOOK_WIDGET_ARCHITECTURE.md](./NOTEBOOK_WIDGET_ARCHITECTURE.md)
- [NOTEBOOK_BACKEND_ARCHITECTURE.md](./NOTEBOOK_BACKEND_ARCHITECTURE.md) §AI

**AI:** `notebookAIActionService` orchestrates; **never** Prisma task/file/event writes in Notebook layer.

---

## Part 8 — Migration sequence (corrected)

User-proposed order adjusted so **Todo embed ships in Phase 1** (MLVP).

| Phase | Name | Backend | Frontend |
|-------|------|---------|----------|
| **1** | Shell + compose | Facade manifest, optional `notebookSummaryService` | Layout, sidebar, wrap Notes + TaskList, promote-to-task |
| **2** | Notes domain hygiene | Extract `notes*Service`, trash handler, visibility, PE | Refactor `NotesModule` → `PageEditor`; API unchanged |
| **3** | NotebookLink + Todo UX | `notebookLinkService` + schema gate | Task embeds, linked tasks panel |
| **4** | Calendar integration | Link to events; read Calendar visibility | Event chip, “open meeting page” |
| **5** | File Hub integration | File link validation via Drive | File picker embed, Drive chips |
| **6** | AI orchestration | `notebookAIContextService`, `notebookAIActionService` | Summarize, extract tasks |
| **7** | Certification | Audits, tests, manifest truth | Workspace landing polish |

Detail: [NOTEBOOK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_IMPLEMENTATION_PLAN.md).

---

## Part 9 — Certification

Notebook targets **Level 3** as a **composition module**; Reference modules #1–4 **remain** authoritative for their domains.

Gates: [NOTEBOOK_CERTIFICATION_STRATEGY.md](./NOTEBOOK_CERTIFICATION_STRATEGY.md).

---

## Part 10 — Exact Phase 1 implementation scope

**Build first (authorized when implementation ACT granted):**

### Backend (minimal)

1. Add `notebook` to `BUILT_IN_MODULE_IDS` (planning doc only until ACT).
2. `seedNotebookModule.ts` — manifest: `dependencies: ['notes','todo']`, capabilities truthful (**no `trash: true`** until handler).
3. `registerBuiltInModules.ts` — `notebook` AI context (keywords; delegate to notes/todo provider URLs).
4. `builtInModuleManifests.ts` — `case 'notebook'`.
5. Optional: `routes/notebook.ts` + `notebookSummaryController.ts` + `notebookSummaryService.ts` — **read-only** aggregation.
6. **Do not** add `routes/notebook.ts` mutations; **do not** touch `notes.ts`, `todo*`.

### Frontend (core)

1. `web/src/app/notebook/` — layout + page routes per [NOTEBOOK_FRONTEND_ARCHITECTURE.md](./NOTEBOOK_FRONTEND_ARCHITECTURE.md).
2. `web/src/components/notebook/` — `NotebookShell`, `NotebookSidebar`, `NotebookHome`, `NotebookWorkspaceLanding`.
3. Wrap `NotesModule` as `PageEditor` mode inside shell.
4. `NotebookTasksPanel` — embed `TaskList` + `QuickTaskInput` + **PromoteToTaskButton**.
5. `BusinessWorkspaceContent` `case 'notebook'`; `BrandedWorkDashboard` icon/name.
6. `web/src/api/notebook.ts` — summary fetch only (optional).
7. `widgetRegistry` — `notebook` widget.
8. Redirect or alias: `/notes` → `/notebook` (optional Phase 1.1).

### Explicitly not Phase 1

- Any Prisma migration
- `notebookLinkService`, `notesPageService` extraction
- `notebookAIActionService`
- Calendar/File/Chat embeds
- Deprecating `notes` module install record

**Success metric:** Leadership meeting workflow in [NOTEBOOK_HEALTHCARE_USE_CASES.md](./NOTEBOOK_HEALTHCARE_USE_CASES.md) §1 using only Phase 1 deliverables (template + manual promote-to-task).

---

## Document maintenance

| Trigger | Update |
|---------|--------|
| Schema approved | Backend arch + plan Phase gates |
| Phase 1 ACT | Implementation plan checklist |
| Todo/Notes code drift | Re-run Part 1 survivability table |

---

*Last updated: 2026-06-01 — Phase 0.75 complete.*
