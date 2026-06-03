# Notebook Backend Architecture

**Phase:** 0.75  
**Parent:** [NOTEBOOK_TECHNICAL_ARCHITECTURE.md](./NOTEBOOK_TECHNICAL_ARCHITECTURE.md)  
**Date:** 2026-06-01

---

## 1. Existing Notes assessment (KEEP / WRAP / DEPRECATE / REPLACE)

### 1.1 Controllers

| Artifact | Path | Disposition | Phase | Notes |
|----------|------|-------------|-------|-------|
| `notesController` | `server/src/controllers/notesController.ts` | **KEEP** → extract Phase 2 | 1: unchanged | **WRAP** via existing `/api/notes` from Notebook facade |
| `notesFolderController` | `server/src/controllers/notesFolderController.ts` | **KEEP** → `notesFolderService` | 2 | |
| `notesShareController` | `server/src/controllers/notesShareController.ts` | **KEEP** → `notesShareService` | 2 | |
| `notesAIContextController` | `server/src/controllers/notesAIContextController.ts` | **KEEP** → delegate from notebook AI | 4 | Fix `deletedAt` → `trashedAt` in hygiene |
| `notebookSummaryController` | *planned* | **New** | 1 | Read-only; optional |
| `notebookFacadeController` | *planned* | **New** | 1 | No Prisma |

### 1.2 Routes

| Route | Disposition | Phase |
|-------|-------------|-------|
| `server/src/routes/notes.ts` → `/api/notes` | **KEEP** | 1+ |
| `server/src/routes/notebook.ts` → `/api/notebook` | **New** (read-only subset) | 1 optional |
| `index.ts` mount | Add notebook router | 1 |

**REPLACE (product):** Twin/docs refer to “Notebook pages”; HTTP path stays `/api/notes` until alias Phase 7.

### 1.3 Models (Prisma)

| Model | Table | Disposition |
|-------|-------|-------------|
| `Note` | `notes` | **KEEP** — product alias **Page** |
| `NoteFolder` | `note_folders` | **KEEP** |
| `NoteShare` | `note_shares` | **KEEP** |
| `pageType` / `pageMetadata` | — | **Deferred** schema — Phase 1 **tags** `type:meeting` |
| `NotebookLink` | `notebook_links` | **New** Phase 3B — [NOTEBOOK_LINK_SCHEMA_DESIGN.md](./NOTEBOOK_LINK_SCHEMA_DESIGN.md) |
| `Section` | — | **New** Phase 7+ (schema gate) |

### 1.4 Startup / manifest

| Artifact | Disposition |
|----------|-------------|
| `seedNotesModule.ts` | **KEEP** — required dependency for Notebook |
| `seedNotebookModule.ts` | **New** Phase 1 |
| `registerBuiltInModules` `notes` block | **KEEP** |
| `registerBuiltInModules` `notebook` block | **New** Phase 1 |
| `builtInModuleManifests` `notes` | **KEEP**; deprecate user-facing claims Phase 7 |
| `builtInModuleManifests` `notebook` | **New** — truthful capabilities |

### 1.5 Cross-cutting (Notes today)

| Concern | Current | Disposition |
|---------|---------|-------------|
| **Search** | Query param on `getNotes` | **KEEP** Phase 1; **WRAP** in `notebookSearchService` Phase 5 |
| **Sharing** | `notesShareController` | **KEEP** |
| **Trash** | Controller sets `trashedAt`; no Global Trash handler | **KEEP** behavior Phase 1; **notesTrashService** Phase 2 |
| **AI** | `notesAIContextController` | **KEEP**; notebook delegates Phase 4–6 |
| **Activity** | Sparse `emitModuleActivityEvent` in controller | **KEEP** → `notesActivityService` Phase 2 |
| **Policy** | `evaluateModuleMutationPolicyDual` + `NOTE_*` | **KEEP** → `notesPolicyDual` Phase 2 |
| **V_Link** | `VLinkEntityType.NOTE` resolver | **KEEP**; register `notebook:page` entity Phase 7 |

### 1.6 Tests

| Test | Disposition |
|------|-------------|
| `notes-folder-context.integration.test.ts` | **KEEP** |
| Notebook contract tests | **New** Phase 1 (summary); Phase 7 (full) |

---

## 2. Target backend topology

```
┌─────────────────────────────────────────────────────────────┐
│  HTTP: /api/notebook/*  (Phase 1: read-only summary)        │
│  notebookSummaryController → notebookSummaryService          │
└───────────────────────────┬─────────────────────────────────┘
                            │ composes (no cross-domain writes)
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ /api/notes    │   │ /api/todo     │   │ /api/vlinks   │
│ notes*        │   │ todo*         │   │ vlinkService  │
│ (Notes domain)│   │ (Todo #4)     │   │ (Platform)    │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │
        │ Phase 3           │ unchanged
        ▼                   │
┌───────────────┐           │
│ notebookLink  │───────────┘ (creates tasks via todoAIActionService)
│ Service       │
└───────────────┘
```

---

## 3. Service catalog (authoritative)

### Phase 1 — Facade only

| Service | Responsibility | Prisma? |
|---------|----------------|---------|
| `notebookSummaryService` | `recentPages(limit)`, `dueTaskCount(dashboardId)` by calling existing list endpoints internally or shared read helpers | **No** direct Prisma preferred — call `notes`/`todo` visibility when available; Phase 1 may use controlled internal imports documented in audit |
| `notebookFacadeController` | `GET /summary`, health | No |

**Constraint:** If summary service must read DB Phase 1, use **read-only** queries duplicated minimally OR HTTP internal — prefer refactor in Phase 2 to `notesVisibilityService` + `todoVisibilityService`.

### Phase 2 — Notes domain extraction (Notebook track, not “Notes module cert”)

| Service | Replaces |
|---------|----------|
| `notesPageService` | `notesController` CRUD |
| `notesFolderService` | `notesFolderController` |
| `notesShareService` | `notesShareController` + notification |
| `notesVisibilityService` | Inline where clauses |
| `notesPolicyDual` | Ad-hoc mutation dual |
| `notesTrashService` | Delete + Global Trash registration |
| `notesActivityService` | Controller emits |
| `notesAIContextService` | `notesAIContextController` reads |

Controllers become thin — pattern from Chat #2 / File Hub #1.

### Phase 3 — NotebookLink layer (3B complete 2026-06-02)

| Service | Responsibility |
|---------|----------------|
| `notebookLinkService` | Create, archive, getById; tenant scope; idempotent create |
| `notebookLinkPermissionService` | Page write + target read; PE `notebook:link:*` |
| `notebookLinkVisibilityService` | List/filter; hydrate embed DTOs via Notes/Todo/Drive/Calendar |
| `notebookLinkActivityService` | `linked_*_to_page`, `unlinked_from_page` |
| `notebookLinkDomainEventService` | `notebook.link.created`, `notebook.link.archived` |
| `notebookTemplateService` | Deferred — templates → `notesPageService` |
| `notebookActivityService` | Deferred facade aggregate — link activity in 3B via link services |

### Phase 6.5 — Workspace intelligence

| Service | Responsibility |
|---------|----------------|
| `notebookWorkspaceContextService` | `getWorkspaceContext` / `getWorkspaceInsights`; rule-based insight cards; no LLM |
| `notebookContextService` | `getPageContext` (page-level aggregation) |

### Phase 4–6 — AI

| Service | Responsibility |
|---------|----------------|
| `notebookAIContextService` | Aggregate providers; proxy to notes + todo context |
| `notebookAIActionService` | `extract_tasks` → `todoAIActionService`; `summarize_page` → read-only LLM path |

### Phase 5 — Search

| Service | Responsibility |
|---------|----------------|
| `notebookSearchService` | Federate `notesVisibilityService` + `todoVisibilityService` search |

### Phase 7+ — Optional

| Service | When |
|---------|------|
| `notebookNotificationService` | New notification types beyond `notes_shared` |
| `notebookRealtimeService` | Live page presence — only if product mandates |

---

## 4. API surface (target)

### Phase 1

| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | `/api/notebook/summary` | `notebookSummaryController` | Optional |
| *all mutations* | `/api/notes/*` | existing | **UNCHANGED** |
| *all task ops* | `/api/todo/*` | existing | **UNCHANGED** |

### Phase 3B

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/notebook/pages/:pageId/links` | `getPageLinks` → `notebookLinkService` |
| POST | `/api/notebook/pages/:pageId/links` | `createPageLink` |
| DELETE | `/api/notebook/links/:linkId` | `archiveNotebookLink` |

See [NOTEBOOK_LINK_API_DESIGN.md](./NOTEBOOK_LINK_API_DESIGN.md). Optional backlinks/entity routes deferred.

**Phase 3C:** Archived links are restored on re-create (same unique key); page permission errors surface as `NotesServiceError` through controller mapping.

### Phase 6.5 — Workspace intelligence

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/notebook/workspace/context` | `notebookWorkspaceContextController` → `notebookWorkspaceContextService` |
| GET | `/api/notebook/workspace/insights` | Same service; insights-only slice |

See [NOTEBOOK_WORKSPACE_INTELLIGENCE.md](./NOTEBOOK_WORKSPACE_INTELLIGENCE.md). No Prisma in controller; aggregation via Notes/Todo/Calendar/Drive visibility + `notebookLink` reads.

### Phase 4–6

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/notebook/pages/:pageId/context` | `notebookContextController` → `notebookContextService` |
| GET | `/api/notebook/ai/context/*` | `notebookAIContextController` |
| POST | `/api/notebook/pages/:pageId/ai/*` | `notebookAIController` → `notebookAIActionService` |

**No `/api/notebook/pages`** until explicit migration — pages stay `/api/notes`.

---

## 5. AI orchestration (backend)

| Action | Entry | Executes |
|--------|-------|----------|
| `summarize_page` | `notebookAIActionService` | Read `notesVisibilityService` → LLM |
| `extract_tasks` | `notebookAIActionService` | Parse → `todoAIActionService.createTask` |
| `suggest_links` | `notebookAIActionService` | Read-only suggestions |
| `create_task` | **Forbidden** in notebook | Client calls `/api/todo` or `todoAIActionService` |
| `list_tasks` | Twin | `/api/todo/ai/context` — not notebook |

---

## 6. Permissions

| Permission | Phase | Owner |
|------------|-------|-------|
| `notebook:read` | 1 | Facade manifest |
| `notebook:write` | 1 | Implies notes+todo write via UI — delegate checks |
| `notes:*` | existing | Notes mutations |
| `todo:*` | existing | Task mutations |

**Policy:** Phase 1 UI checks both module installs; Phase 2+ `notebookPolicyDual` may wrap pre-checks (read-only composition).

---

## 7. V_Link (backend)

| Item | Phase |
|------|-------|
| Keep `NOTE` resolver | 1+ |
| `registerNotebookPlatformEntities` → `notebook:page` → `NOTE` | 7 |
| `notebookVlinkAccessService` | **Do not create** — use notes page access + existing resolver |
| User-initiated V_Link create | Platform `vlinkService` — not NotebookLink |

---

## 8. Global Trash

| Domain | Handler | Phase |
|--------|---------|-------|
| Page | `notesTrashService` + register `moduleId: notes`, type `note` | 2 |
| Task | `todoTrashService` (exists) | — |

Notebook manifest **`trash: false`** (facade); **`notes`** manifest declares **`trash: true`** with Global Trash handler registered (Phase 2).

---

## 9. File paths (planned, not created)

```
server/src/
  controllers/
    notebookSummaryController.ts      # Phase 1
    notebookLinkController.ts       # Phase 3
    notebookAIContextController.ts  # Phase 4
    notebookAIActionController.ts   # Phase 6
    notesController.ts              # KEEP → thin Phase 2
  routes/
    notebook.ts                     # Phase 1
    notes.ts                        # KEEP
  services/
    notebook/
      notebookSummaryService.ts
      notebookLinkService.ts
      notebookAIContextService.ts
      notebookAIActionService.ts
      notebookActivityService.ts
      notebookSearchService.ts
      notebookTemplateService.ts
    notes/                          # Phase 2 extraction
      notesPageService.ts
      notesFolderService.ts
      notesShareService.ts
      notesVisibilityService.ts
      notesTrashService.ts
      notesPolicyDual.ts
      notesActivityService.ts
      notesAIContextService.ts
  startup/
    seedNotebookModule.ts
    registerNotebookPlatformEntities.ts  # Phase 7
```

---

*Cross-ref: [NOTEBOOK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_IMPLEMENTATION_PLAN.md), [NOTEBOOK_CERTIFICATION_STRATEGY.md](./NOTEBOOK_CERTIFICATION_STRATEGY.md).*
