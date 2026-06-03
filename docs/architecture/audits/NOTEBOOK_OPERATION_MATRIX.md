# Notebook Operation Matrix

**Module id:** `notebook` (+ `notes` page domain)  
**Status:** Phase 7 audit (2026-06-02) — **not certified**  
**Related:** [NOTEBOOK_CONSTITUTIONAL_AUDIT.md](./NOTEBOOK_CONSTITUTIONAL_AUDIT.md), [NOTEBOOK_CERTIFICATION_READINESS_REVIEW.md](./NOTEBOOK_CERTIFICATION_READINESS_REVIEW.md), [NOTEBOOK_CERTIFICATION_STRATEGY.md](../NOTEBOOK_CERTIFICATION_STRATEGY.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — correct layer, side effects on success |
| **P** | Partial — works; wrong layer, incomplete pipeline, or delegated dependency gap |
| **N** | Non-compliant or missing |
| **—** | Not applicable |

**Owner:** `NB` = Notebook-owned · `Notes` = Notes/Page domain · `Todo` / `Cal` / `Drive` = certified reference modules

**Columns:** PE = Policy Engine · Activity = module activity · Event = domain event · RT = realtime · AI = platform AI executor path

---

## Master operation matrix

| Operation | Owner | Service | Controller | PE | Visibility | Activity | Event | Notification | RT | AI | Trash | V_Link | Notes |
| --------- | ----- | ------- | ---------- | -- | ---------- | -------- | ----- | ------------ | -- | -- | ----- | ------ | ----- |
| **Open Notebook home** | NB | `notebookWorkspaceContextService` | `notebookWorkspaceContextController` | P | C | N | N | N | — | — | — | — | Client `NotebookHome` |
| **Workspace context API** | NB | `notebookWorkspaceContextService` | `getWorkspaceContext` | P | C | N | N | N | — | — | — | — | Aggregates Notes/Todo/Cal/Drive |
| **Workspace insights API** | NB | `notebookWorkspaceContextService` | `getWorkspaceInsights` | P | C | N | N | N | — | — | — | — | Rule-based only |
| **List pages** | Notes | `notesVisibilityService` | `notesController.getNotes` | P | C | N | N | N | — | — | — | P | UI via Notebook shell |
| **Create page** | Notes | `notesPageService` | `notesController.createNote` | P | — | P | P | N | — | — | — | — | |
| **Edit page** | Notes | `notesPageService` | `notesController.updateNote` | P | — | P | P | N | — | — | — | — | |
| **Get page by id** | Notes | `notesVisibilityService` | `notesController.getNoteById` | P | C | N | N | N | — | — | — | — | |
| **Trash page (API)** | Notes | `notesTrashService` | `notesController.deleteNote` | P | — | P | P | N | — | — | P | — | Soft `trashedAt` |
| **Restore page (Global Trash)** | Notes | `notesTrashService` | `trashController` | P | — | P | P | N | — | — | P | — | `moduleId: notes` |
| **Permanent delete page** | Notes | `notesTrashService` | `trashController` | P | — | P | P | N | — | — | P | P | NOTE V_Link lifecycle TBD |
| **Share page** | Notes | `notesShareService` | `notesShareController` | P | — | P | P | P | — | — | — | — | `notes_shared` |
| **Revoke share** | Notes | `notesShareService` | `notesShareController` | P | — | N | N | N | — | — | — | — | |
| **Folders CRUD** | Notes | — | `notesFolderController` | N | — | N | N | N | — | — | — | — | Legacy controller layer |
| **Page context API** | NB | `notebookContextService` | `notebookContextController` | P | C | N | N | N | — | — | — | — | Phase 5.5 |
| **List page links** | NB | `notebookLinkVisibilityService` | `notebookLinkController` | C | C | N | N | N | — | — | — | — | Hydrates targets |
| **Create page link** | NB | `notebookLinkService` | `notebookLinkController` | C | C | C | C | N | — | — | — | — | Idempotent create |
| **Archive/unlink** | NB | `notebookLinkService` | `notebookLinkController` | C | C | C | C | N | — | — | — | — | `archivedAt` not trash |
| **Entity backlinks** | NB | `notebookLinkService` | `notebookLinkController` | P | P | N | N | N | — | — | — | — | TASK + CALENDAR_EVENT only |
| **Link task (UI/API)** | NB | `notebookLinkService` | `notebookLinkController` | C | C | C | C | N | — | — | — | — | Target via `todoVisibilityService` |
| **Unlink task** | NB | `notebookLinkService` | `notebookLinkController` | C | — | C | C | N | — | — | — | — | |
| **Link file** | NB | `notebookLinkService` | `notebookLinkController` | C | C | C | C | N | — | — | — | — | `validateAccessibleFileIds` |
| **Unlink file** | NB | `notebookLinkService` | `notebookLinkController` | C | — | C | C | N | — | — | — | — | |
| **Link calendar event** | NB | `notebookLinkService` | `notebookLinkController` | C | C | C | C | N | — | — | — | — | AGENDA relationship |
| **Unlink calendar event** | NB | `notebookLinkService` | `notebookLinkController` | C | — | C | C | N | — | — | — | — | |
| **Link chat / place** | NB | — | — | — | — | — | — | — | — | — | — | — | **Deferred** fail closed |
| **Promote selected text to task** | Todo | `todoAIActionService` / task create | Client + `/api/todo` | P | C | P | P | P | — | P | — | — | Then optional NB link |
| **Summarize page** | NB | `notebookAIActionService` | `notebookAIController` | P | C | N | N | N | — | P | — | — | Read-only LLM |
| **Extract action items** | NB | `notebookAIActionService` | `notebookAIController` | P | C | N | N | N | — | P | — | — | Propose only |
| **Confirm action items** | NB + Todo | `notebookAIActionService` → `aiCreateTask` + link | `postConfirmActionItems` | P | C | P | P | N | — | P | — | — | User confirm required |
| **Meeting recap** | NB | `notebookAIActionService` | `notebookAIController` | P | C | N | N | N | — | P | — | — | |
| **Suggest links** | NB | `notebookAIActionService` | `notebookAIController` | P | C | N | N | N | — | P | — | — | Read-only suggestions |
| **View linked tasks** | NB | `notebookLinkVisibilityService` | — (embedded) | C | C | N | N | N | — | — | — | — | Panel hydration |
| **View linked files** | NB | `notebookLinkVisibilityService` + Drive | — | C | C | N | N | N | — | — | — | — | FILE hydration |
| **View linked events** | NB | `notebookLinkVisibilityService` | — | C | P | N | N | N | — | — | — | — | Some `prisma.event` |
| **Widget load** | NB | `notebookWorkspaceContextService` (client) | — | P | C | N | N | N | — | — | — | — | `NotebookWidget` |
| **Redirect `/notes` → `/notebook`** | NB | — | Next.js page | — | — | — | — | — | — | — | — | — | Legacy sunset |
| **Meeting template page** | NB + Notes | `notesPageService` + tags | Client | P | — | P | P | N | — | — | — | — | `type:meeting` tag |
| **Calendar EventDrawer → Notebook** | NB | Client navigation | `EventDrawer` | — | — | — | — | — | — | — | — | — | Phase 4 UX |
| **Notes AI context recent/pinned** | Notes | `notesVisibilityService` | `notesAIContextController` | P | C | N | N | N | — | P | — | — | Delegated providers |
| **ActionExecutor notebook ops** | NB | — | — | — | — | — | — | — | — | N | — | — | Blocker for L3 AI gate |
| **toolExecutor notebook ops** | NB | — | — | — | — | — | — | — | — | N | — | — | Blocker for L3 AI gate |

---

## Manifest truth rows

| Surface | Claim | Runtime | Verdict |
|---------|-------|---------|---------|
| `notebook` capabilities.trash | omitted | Page trash via `notes` handler | **C** |
| `notebook` capabilities.vlink | omitted | NOTE resolver under `notes` entity | **C** (until `notebook:page` registered) |
| `notebook` operationalLinks | true | `notebook_links` API | **C** |
| `notebook` entities[] | omitted | No false entity claim | **C** |
| `notes` trash | true | `registerGlobalTrashHandlers('notes')` | **C** |
| `notes` routes label | Notebook | User-facing `/notebook` | **C** |
| `coreModuleRegistry` notes | disabled | Hidden from picker | **C** |
| `coreModuleRegistry` notebook | active | Primary module | **C** |

---

## Operation count summary (certification-time)

| Class | Rows | C | P | N |
|-------|------|---|---|---|
| Notebook composition / context / workspace | 6 | 2 | 4 | 0 |
| Notes page lifecycle | 10 | 0 | 8 | 2 |
| NotebookLink | 10 | 8 | 2 | 0 |
| AI (HTTP) | 5 | 0 | 5 | 0 |
| AI (platform executor) | 2 | 0 | 0 | 2 |
| UX / widget / redirect | 5 | 1 | 4 | 0 |
| **Total inventoried** | **~38** | **11** | **23** | **4** |

---

## Certification impact

| Area | Blocker for L3 sign-off? | Rationale |
|------|--------------------------|-----------|
| `notebook:page` entity registration | **Yes** | Ledger gate #6 |
| ActionExecutor / toolExecutor twins | **Yes** | Ledger gate #11 for `ai: true` |
| Link visibility direct Prisma | **No** (P1) | Tighten to calendar visibility service |
| Notes folder/share legacy | **No** (P1) | Sub-domain Level 2 acceptable |
| Realtime | **No** | Truthfully omitted |
| Activity facade | **No** (P1) | Document partial if link + page paths emit |
| Notebook notifications manifest | **No** (P1) | Inherit `notes_shared` until notebook types added |

---

## Target state (post-certification blockers)

Mirror Todo #4 composition bar:

- **Entity:** `registerNotebookPlatformEntities` → `notebook:page` + manifest `entities[]`
- **AI:** `notebookAIActionService` registered in `ActionExecutor` + tools
- **Visibility:** Zero cross-module `prisma.*` in notebook services (calendar/file reads via visibility only)
- **Trash UX:** Document `notes` module id in Global Trash for pages; optional alias filter `notebook`
- **Review doc:** `NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md` after blocker burn-down

---

*Phase 7 audit only — no code changes.*
