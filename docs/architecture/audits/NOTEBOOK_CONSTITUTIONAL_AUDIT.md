# Notebook Constitutional Audit

**Module id:** `notebook` (product) + `notes` (page domain dependency)  
**Phase:** **7 — Audit & governance** (2026-06-02)  
**Certification status:** **Level 3 Certified** (2026-06-02) — see [NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md](./NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md)  
**Date:** 2026-06-02  
**Benchmarks:** [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) — File Hub #1, Chat #2, Calendar #3, Todo #4  
**Related:** [NOTEBOOK_CERTIFICATION_STRATEGY.md](../NOTEBOOK_CERTIFICATION_STRATEGY.md), [NOTEBOOK_OPERATION_MATRIX.md](./NOTEBOOK_OPERATION_MATRIX.md), [NOTEBOOK_CERTIFICATION_READINESS_REVIEW.md](./NOTEBOOK_CERTIFICATION_READINESS_REVIEW.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

## 1. Inventory

### 1.1 Classification key

| Class | Meaning |
|-------|---------|
| **Notebook-owned** | Product surface, composition, or `NotebookLink` persistence |
| **Delegated — certified module** | Todo, Calendar, Drive/File Hub, Chat, Place |
| **Delegated — Notes/Page domain** | `Note` CRUD, folders, shares, page trash |
| **Deferred** | Planned; fail-closed or not shipped |

### 1.2 Frontend routes

| Route | Class | Notes |
|-------|-------|-------|
| `/notebook` | Notebook-owned | Home → workspace context |
| `/notebook/page/[pageId]` | Notebook-owned UI | Data via `/api/notes` + `/api/notebook` |
| `/business/[id]/workspace/notebook` | Notebook-owned | Business workspace hub |
| `/business/[id]/workspace/notebook/page/[pageId]` | Notebook-owned | Same composition |
| `/notes` → `/notebook` | Deferred sunset | Legacy redirect |
| `/business/.../workspace/notes` → notebook | Deferred sunset | Business redirect |

### 1.3 Backend routes

| Prefix | Class | Controller(s) |
|--------|-------|---------------|
| `GET/POST/PUT/DELETE /api/notes/*` | Delegated — Notes | `notesController`, `notesFolderController`, `notesShareController`, `notesAIContextController` |
| `GET /api/notebook/workspace/context` | Notebook-owned | `notebookWorkspaceContextController` |
| `GET /api/notebook/workspace/insights` | Notebook-owned | `notebookWorkspaceContextController` |
| `GET /api/notebook/pages/:pageId/context` | Notebook-owned | `notebookContextController` |
| `GET/POST /api/notebook/pages/:pageId/links` | Notebook-owned | `notebookLinkController` |
| `DELETE /api/notebook/links/:linkId` | Notebook-owned | `notebookLinkController` |
| `GET /api/notebook/entities/:type/:id/links` | Notebook-owned | Backlinks (partial entity types) |
| `POST /api/notebook/pages/:pageId/ai/*` | Notebook-owned | `notebookAIController` |

### 1.4 Services

| Service | Class | Role |
|---------|-------|------|
| `notebookLinkService` | Notebook-owned | CRUD on `NotebookLink` |
| `notebookLinkPermissionService` | Notebook-owned | Page + target read; PE on link |
| `notebookLinkVisibilityService` | Notebook-owned | Hydrate embeds; **some direct `prisma.event`** |
| `notebookLinkActivityService` | Notebook-owned | Link activity |
| `notebookLinkDomainEventService` | Notebook-owned | `notebook.link.*` |
| `notebookPolicyDual` | Notebook-owned | `notebook:link:*` |
| `notebookContextService` | Notebook-owned | Page context aggregation |
| `notebookWorkspaceContextService` | Notebook-owned | Dashboard snapshot + insights |
| `notebookAIContextService` | Notebook-owned | Grounded AI read bundle |
| `notebookAIActionService` | Notebook-owned | LLM orchestration; writes delegate |
| `notebookAIPromptBuilder` / `notebookAICompletion` | Notebook-owned | Prompt + completion |
| `notesPageService` | Delegated — Notes | Page mutations |
| `notesVisibilityService` | Delegated — Notes | Page reads |
| `notesTrashService` | Delegated — Notes | Global Trash handler `moduleId: notes` |
| `notesPolicyDual` | Delegated — Notes | `NOTE_*` PE |
| `notesActivityService` | Delegated — Notes | Page activity |
| `notesDomainEventService` | Delegated — Notes | `notes.*` events |
| `notesShareService` | Delegated — Notes | Shares |
| `notesNotificationService` | Delegated — Notes | `notes_shared` |
| `todoVisibilityService` / `todoAIActionService` | Delegated — Todo #4 | Tasks in context + AI create |
| `calendarVisibilityService` | Delegated — Calendar #3 | Events in context |
| `driveVisibilityService` | Delegated — File Hub #1 | File browse + link validation |
| `notebookActivityService` | **Deferred** | Facade aggregate not implemented |
| `notebookSearchService` | **Deferred** | Federated search |

### 1.5 Controllers

| Controller | Prisma in handler? | Class |
|------------|-------------------|-------|
| `notebookLinkController` | No | Notebook-owned |
| `notebookContextController` | No | Notebook-owned |
| `notebookWorkspaceContextController` | No | Notebook-owned |
| `notebookAIController` | No | Notebook-owned |
| `notesController` | No (delegates `notesPageService` / `notesTrashService`) | Delegated — Notes |
| `notesFolderController` | Partial legacy | Delegated — Notes |
| `notesShareController` | Partial legacy | Delegated — Notes |

### 1.6 Prisma models

| Model | Table | Class |
|-------|-------|-------|
| `Note` | `notes` | Delegated — Notes/Page domain |
| `NoteFolder` | `note_folders` | Delegated — Notes |
| `NoteShare` | `note_shares` | Delegated — Notes |
| `NotebookLink` | `notebook_links` | **Notebook-owned** (additive) |

No Notebook-owned task, file, or calendar tables.

### 1.7 Manifests & registration

| Artifact | Class | Notes |
|----------|-------|-------|
| `builtInModuleManifests` case `notebook` | Notebook-owned | `operationalLinks: true`; **no** `trash` / `vlink` |
| `builtInModuleManifests` case `notes` | Delegated — Notes | `trash: true`, entities `page`, routes label Notebook |
| `registerBuiltInModules` `notebook` | Notebook-owned | AI context providers |
| `registerBuiltInModules` `notes` | Delegated — Notes | Legacy AI actions |
| `registerGlobalTrashHandlers` `notes` | Delegated — Notes | Pages in Global Trash |
| `registerPlatformEntities` | Delegated — Notes | `moduleId: notes`, `vlinkEntityType: NOTE` — **not** `notebook:page` |
| `seedNotebookModule` | Notebook-owned | Depends on `notes` + `todo` |
| `coreModuleRegistry` `notebook` | Notebook-owned | User-facing |
| `coreModuleRegistry` `notes` | Deferred | `status: 'disabled'` |
| `widgetRegistry` `notebook` | Notebook-owned | `NotebookWidget` |

### 1.8 Widgets

| Widget | Class | Data source |
|--------|-------|-------------|
| `NotebookWidget` | Notebook-owned | Client `/api/notebook/workspace/context` or pages list |

### 1.9 AI surfaces

| Surface | Class |
|---------|-------|
| `/api/notebook/pages/:pageId/ai/*` | Notebook-owned |
| `/api/notes/ai/context/*` | Delegated — Notes |
| `registerBuiltInModules` notebook providers | Notebook-owned |
| `ActionExecutor` / `toolExecutor` notebook ops | **Deferred** — no twin registration |

### 1.10 NotebookLink domain

| Concern | Status |
|---------|--------|
| Schema | Additive `notebook_links` only |
| V_Link replacement | **No** — operational links parallel to V_Link |
| Target types live | TASK, FILE, CALENDAR_EVENT |
| CHAT_CONVERSATION, PLACE_LISTING | **Deferred** — fail closed 400 |
| PAGE self-link | Fail closed |

### 1.11 Cross-module dependencies

| Module | Notebook uses | Notebook must not |
|--------|---------------|-------------------|
| Notes | Page CRUD, trash, visibility, shares | Re-own `Note` schema |
| Todo #4 | Visibility, `aiCreateTask`, promote | Own task tables / alter task services |
| Calendar #3 | `listEventsInRange`, event access | Own event CRUD |
| File Hub #1 | `validateAccessibleFileIds`, browse | Own file storage |
| Chat #2 | — (links deferred) | Message writes |
| Place | — (links deferred) | Listing ownership |

### 1.12 Tests (notebook-focused)

| Area | Files (approx.) |
|------|-----------------|
| Link service / permission / visibility / activity | 5+ unit + integration |
| Context + workspace | 2 service + 2 controller contract |
| AI action + context | 3 service + 2 controller contract |
| Notes domain | `notesPageService`, `notesTrashService`, `notesPolicyDual`, `notesController.contract` |
| Manifest / trash handler | `builtInModuleManifests.notebook`, `registerGlobalTrashHandlers.notes` |
| Domain events | `notebookDomainEvents`, `notesDomainEvents` |
| Frontend | `notebookPaths`, `notebookWorkspace`, `notebookAI`, `notebookFileLinks`, `notebookMeetingPage` |

**Estimated notebook+notes test files:** ~25 server + ~5 web.

---

## 2. Constitutional compliance scorecard

| Standard | Status | Evidence |
| -------- | ------ | -------- |
| **Canonical Services** | 🟡 | Notebook link/context/AI/workspace services exist; page writes in `notes*Service`; no `notebookActivityService` facade |
| **Thin Controllers** | 🟢 | All `notebook*Controller` delegate; `notesController` delegates core CRUD/trash |
| **Policy Engine** | 🟡 | `notebookPolicyDual` on links; `notesPolicyDual` on pages; not all delegated reads PE-wrapped |
| **Global Trash** | 🟡 | Pages: `notesTrashService` + handler (`moduleId: notes`); **Notebook manifest omits `trash: true`** (truthful) |
| **Visibility Services** | 🟢 | Composition reads via `notesVisibilityService`, `todoVisibilityService`, `calendarVisibilityService`, `driveVisibilityService` |
| **Domain Events** | 🟡 | `notebook.link.created/archived` registered; notes page events partial |
| **Module Activity** | 🟡 | Link writes emit; page writes via `notesActivityService`; no unified notebook facade |
| **Notifications** | 🟡 | `notes_shared` via notes; **no notebook manifest notification types** |
| **Realtime** | 🟢 | **N/A** — not claimed; manifest omits `realtime` |
| **Platform Entity Registration** | 🟢 | **`notebook:page` registered** (Phase 7+); `notes:page` retained for storage/trash |
| **V_Link** | 🟡 | NOTE resolver exists; Notebook manifest **does not** claim `vlink: true` |
| **Capability Matrix** | 🟢 | `operationalLinks: true`; no false trash/vlink on `notebook` |
| **AI Compliance** | 🟢 | HTTP + ActionExecutor + toolExecutor → `notebookAI*Service`; confirm rejected on executor path |
| **Scheduler Integration** | 🟢 | **N/A** — no notebook cron |
| **Documentation** | 🟢 | NOTEBOOK_* architecture set + this audit |
| **Tests** | 🟡 | Strong link/context/AI coverage; gaps on full L3 sign-off matrix |

**Overall:** **High** for a **composition module** — **Level 3 Certified** per [NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md](./NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md) (2026-06-02).

---

## 3. Reference module comparison

| Pattern | File Hub #1 | Chat #2 | Calendar #3 | Todo #4 | Notebook |
|---------|-------------|---------|-------------|---------|----------|
| Owned persistence | Files | Messages | Events | Tasks | **NotebookLink only** |
| Trash service + handler | ✅ | ✅ | ✅ | ✅ | **Notes handler** (dependency) |
| Visibility for reads | ✅ | ✅ | ✅ | ✅ | ✅ (delegated) |
| Policy dual | ✅ | ✅ | ✅ | ✅ | 🟡 link + notes |
| Domain events | ✅ | ✅ | ✅ | ✅ | 🟡 link + partial notes |
| Activity on writes | ✅ | ✅ | ✅ | ✅ | 🟡 |
| AI → services | ✅ | ✅ | ✅ | ✅ | 🟡 HTTP only |
| V_Link + entity | ✅ | ✅ | ✅ | ✅ | 🔴 notebook entity |
| Thin controller | ✅ | ✅ | ✅ | 🟡 | 🟢 notebook; notes improved |
| Realtime | — | ✅ | partial | ✅ | N/A (truthful) |

---

## 4. Manifest truth audit (summary)

| Check | Result |
|-------|--------|
| Notebook `trash: false` / omitted | ✅ Truthful — page trash via `notes` handler |
| Notebook `vlink: false` / omitted | ✅ Truthful — no `vlink: true` |
| Notebook `operationalLinks: true` | ✅ Matches `NotebookLink` runtime |
| Notebook false entity claim | ✅ No `entities[]` until registration |
| Notes `trash: true` | ✅ Handler registered (`notesTrashService`) |
| Notes routes → `/notebook` label | ✅ Product routing truth |
| Notes hidden in `coreModuleRegistry` | ✅ `status: 'disabled'` |
| Notebook user-facing | ✅ Primary productivity module |

See [NOTEBOOK_OPERATION_MATRIX.md](./NOTEBOOK_OPERATION_MATRIX.md) § Manifest rows.

---

## 5. AI compliance audit (summary)

| Check | Result |
|-------|--------|
| No Prisma in `notebookAIController` | ✅ |
| No mock req/res in AI paths | ✅ |
| Reads grounded on `notebookContextService` / `loadGroundedAIContext` | ✅ |
| Writes → `todoAIActionService` + `notebookLinkService` | ✅ |
| Confirm before task create (`action-items/confirm`) | ✅ |
| Restricted context not exposed in prompts | ✅ (warnings array) |
| ActionExecutor / toolExecutor twins | 🔴 **Missing** |

---

## 6. NotebookLink audit (summary)

| Check | Result |
|-------|--------|
| Schema additive only | ✅ |
| Does not replace V_Link | ✅ |
| Permissions fail closed | ✅ PE + target visibility |
| TASK / FILE / CALENDAR_EVENT | ✅ |
| CHAT / PLACE | ✅ fail closed |
| Activity + domain events on link lifecycle | ✅ |
| Cross-module ownership | 🟡 `notebookLinkVisibilityService` uses `prisma.event` for hydration — prefer calendar visibility only |

---

## 7. Architectural drift (top issues)

1. **Platform entity** — Product is `notebook` but entity registration remains `notes` / `NOTE` only.
2. **AI platform twins** — Autonomous paths cannot invoke notebook operations without new executor registration.
3. **Activity facade** — No `notebookActivityService`; cross-surface feed aggregation incomplete.
4. **Link visibility Prisma** — Residual direct `prisma.event` / `prisma.file` in permission/visibility helpers.
5. **Notes folder/share controllers** — May retain legacy patterns vs full service extraction.
6. **Dual module AI context** — `notes` and `notebook` both registered; risk of duplicate provider selection.
7. **Global Trash UX** — Trash module id is `notes`, not `notebook` — document for users/docs.
8. **Backlinks** — Limited entity types for `/entities/:type/:id/links`.

---

## 8. Certification readiness (audit conclusion)

| Question | Answer |
|----------|--------|
| Ready for **Level 3 certification review**? | **Yes** — evidence package complete enough for formal review |
| Ready to **certify** (ledger Level 3)? | **Yes** — certified 2026-06-02 |
| Reference Module #5? | **No** — **Place** remains primary #5 candidate |
| Start Place initiative? | **When product prioritizes Wave 3** |

**Certified in Phase 8.** Post-cert hygiene: NB-H1–H7 in Level 3 review §10.

---

## 9. Appendix: key file index

| Area | Paths |
|------|-------|
| Notebook routes | `server/src/routes/notebook.ts` |
| Notes routes | `server/src/routes/notes.ts` |
| Notebook controllers | `server/src/controllers/notebook*.ts` |
| Notebook services | `server/src/services/notebook/*` |
| Notes services | `server/src/services/notes/*` |
| Schema | `prisma/modules/notebook/notebook.prisma`, `Note` in notes module |
| Manifest | `server/src/startup/builtInModuleManifests.ts`, `registerBuiltInModules.ts` |
| Trash | `registerGlobalTrashHandlers.ts`, `notesTrashService.ts` |
| Frontend | `web/src/components/notebook/*`, `web/src/app/notebook/*` |
| Tests | `server/src/services/__tests__/notebook*.ts`, `server/src/controllers/__tests__/notebook*.ts` |

---

**Audit completed:** Notebook Phase 7 deliverable. **No runtime code changes in Phase 7.**
