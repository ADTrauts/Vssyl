# Notebook Product Architecture Review

**Initiative:** NOTEBOOK (Notes + Todo consolidation evaluation)  
**Date:** 2026-06-01  
**Mode:** Analysis only — no implementation  
**Status:** Active product/architecture decision record  

**Authorities reviewed:**

- [`REFERENCE_MODULE_CATALOG.md`](./REFERENCE_MODULE_CATALOG.md)
- [`CERTIFICATION_LEDGER.md`](./CERTIFICATION_LEDGER.md)
- [`../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md`](../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md)
- [`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)
- [`../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)
- Certified module reviews: File Hub, Chat, Calendar, Todo (Level 3/4)

**Companion docs:**

- [`NOTEBOOK_DOMAIN_MODEL.md`](./NOTEBOOK_DOMAIN_MODEL.md)
- [`NOTEBOOK_MIGRATION_STRATEGY.md`](./NOTEBOOK_MIGRATION_STRATEGY.md)
- **Phase 0.5 (definitive product architecture):** [`NOTEBOOK_WORKSPACE_ARCHITECTURE.md`](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md), [`NOTEBOOK_PAGE_TYPES.md`](./NOTEBOOK_PAGE_TYPES.md), [`NOTEBOOK_NAVIGATION_MODEL.md`](./NOTEBOOK_NAVIGATION_MODEL.md), [`NOTEBOOK_RELATIONSHIP_MODEL.md`](./NOTEBOOK_RELATIONSHIP_MODEL.md), [`NOTEBOOK_AI_STRATEGY.md`](./NOTEBOOK_AI_STRATEGY.md), [`NOTEBOOK_HEALTHCARE_USE_CASES.md`](./NOTEBOOK_HEALTHCARE_USE_CASES.md), [`NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md`](./NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md)
- **Phase 0.75 (technical blueprint):** [`NOTEBOOK_TECHNICAL_ARCHITECTURE.md`](./NOTEBOOK_TECHNICAL_ARCHITECTURE.md), [`NOTEBOOK_BACKEND_ARCHITECTURE.md`](./NOTEBOOK_BACKEND_ARCHITECTURE.md), [`NOTEBOOK_FRONTEND_ARCHITECTURE.md`](./NOTEBOOK_FRONTEND_ARCHITECTURE.md), [`NOTEBOOK_WIDGET_ARCHITECTURE.md`](./NOTEBOOK_WIDGET_ARCHITECTURE.md), [`NOTEBOOK_IMPLEMENTATION_PLAN.md`](./NOTEBOOK_IMPLEMENTATION_PLAN.md), [`NOTEBOOK_CERTIFICATION_STRATEGY.md`](./NOTEBOOK_CERTIFICATION_STRATEGY.md)

---

## Executive summary

| Question | Answer |
|----------|--------|
| Does Notes exist as a first-class module today? | **Yes** — `notes` built-in with schema, API, UI, manifest, partial AI. |
| Notes maturity | **B — Partial module** (Level 1 Stabilizing; not certification-ready). |
| Is separate Notes modernization the right next wave? | **No** — product direction favors a unified **Notebook** experience. |
| Should Todo Reference Module #4 be invalidated? | **No** — preserve `todo` domain, services, and certification as implementation authority for tasks. |
| **Final recommendation** | **B — Replace Notes modernization wave with Notebook initiative** (UI/product first; backend domains stay separate until a governed merge phase). |

**Hard stops (this phase):** No Notes Phase 1B, no `notes*Service` extraction, no Notes certification, no Todo architecture changes, no Place wave.

---

## Part 1 — Notes inventory

### 1.1 Classification

| Class | Definition | Notes today |
|-------|------------|-------------|
| **A. Mature module** | Level 3+ certified; canonical services; platform systems complete | **No** |
| **B. Partial module** | Shipped product surface; incomplete platform contract | **Yes** |
| **C. Lightweight feature set** | Stubs, widgets only, no durable domain | **No** — exceeds widget-only |

**Maturity scorecard (2026-06-01 repo):**

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Constitutional compliance | **Low** | Ledger Level 1; inline Prisma in controllers |
| File Hub compliance | **Low** | No `notes*Service`, no trash handler, no visibility service |
| Product completeness | **Medium** | Full CRUD UI, folders, share, templates in UI |
| Certification readiness | **Not ready** | No constitutional audit, operation matrix, or extraction plan |

### 1.2 Controllers

| File | Lines (approx.) | Responsibility |
|------|-----------------|---------------|
| `server/src/controllers/notesController.ts` | ~429 | List/get/create/update/delete; inline Prisma; `trashedAt` soft delete; `emitModuleActivityEvent` on create/update/delete; `evaluateModuleMutationPolicyDual` on mutations |
| `server/src/controllers/notesFolderController.ts` | ~296 | Folder CRUD |
| `server/src/controllers/notesShareController.ts` | ~219 | Share/revoke/list shares; `notes_shared` notification |
| `server/src/controllers/notesAIContextController.ts` | ~184 | `GET /ai/context/recent`, `GET /ai/context/pinned` |

**No dedicated `server/src/services/notes*.ts` layer.**

### 1.3 Routes

`server/src/routes/notes.ts` → mounted `app.use('/api/notes', notesRouter)` in `server/src/index.ts`.

| Method | Path | Handler |
|--------|------|---------|
| GET | `/ai/context/recent` | `notesAIContextController` |
| GET | `/ai/context/pinned` | `notesAIContextController` |
| GET/POST/PUT/DELETE | `/folders`, `/folders/:id` | `notesFolderController` |
| GET | `/` | `getNotes` (search, tag, pinned, folderId, sharedWithMe) |
| GET/POST/PUT/DELETE | `/:id`, `/:id/share`, `/:id/shares` | CRUD + share |

**Tests:** `server/src/routes/__tests__/notes-folder-context.integration.test.ts` (tenant isolation on folders).

### 1.4 Services

**None** module-specific. Cross-cutting usage only:

- `moduleActivityService` — activity on note writes
- `moduleMutationPolicyDual` + `POLICY_ACTIONS.NOTE_*` — mutation policy
- `taskDashboardBinding` — dashboard/business alignment assert
- `vlinkEntityResolverService` — `VLinkEntityType.NOTE` resolve (read-only path)

### 1.5 Prisma models and database tables

**Module schema:** `prisma/modules/notes/notes.prisma`

| Model | Table | Key fields |
|-------|-------|------------|
| `NoteFolder` | `note_folders` | `dashboardId`, `businessId`, `parentId`, nested folders |
| `Note` | `notes` | `title`, `content` (markdown/plain string), `tags[]`, `pinned`, `folderId`, `trashedAt`, deprecated `deletedAt` |
| `NoteShare` | `note_shares` | `role` viewer/editor, per-user share |

**Migrations:** `20260310110926_add_notes_module`, `20260311001125_add_note_folders`, `20260311001822_add_note_shares`, `20260628120000_notes_trashed_at`.

**No** link tables to Task, Drive, Calendar, or Chat from Notes schema.

### 1.6 Frontend pages and UI components

| Asset | Path | Role |
|-------|------|------|
| Personal page | `web/src/app/notes/page.tsx` | `/notes` |
| Business page | `web/src/app/business/[id]/workspace/notes/page.tsx` | Workspace route |
| Main UI | `web/src/components/notes/NotesModule.tsx` (~719 lines) | List + editor; markdown preview; templates (meeting, standup, project brief); folders; share modal |
| API client | `web/src/api/notes.ts` | Native `fetch` to `/api/notes` |
| Widget | `web/src/components/widgets/NotesWidget.tsx` | Dashboard widget |
| Utility widget | `web/src/components/widgets/QuickNotesWidget.tsx` | Scratchpad — **not** Notes module domain |
| Workspace switch | `BusinessWorkspaceContent.tsx` `case 'notes'` | Renders `NotesModule` |
| Icons | `web/src/config/moduleIcons.ts`, `coreModuleRegistry.ts`, `widgetRegistry.ts` | Module id `notes` |

**Gaps vs module-development hub pattern:** No `NotesWorkspaceLanding.tsx`; no `BrandedWorkDashboard` icon/name entry for `notes`.

### 1.7 AI integrations

| Present | Missing / partial |
|---------|-------------------|
| `registerBuiltInModules.ts` — full `ModuleAIContext` (keywords, `create_note`/`update_note`/`delete_note`/`list_notes` actions declared) | `notesAIActionService` |
| `notesAIContextController` — recent/pinned (bounded reads) | `ActionExecutor` / `toolExecutor` routes for note writes |
| `moduleContextProviderSelection.ts` — selects `recent_notes` / `pinned_notes` | Autonomous note mutations |
| | AI context queries still filter `deletedAt: null` in places — drift vs `trashedAt` |

### 1.8 Search integration

| Type | Status |
|------|--------|
| **Module-local** | `GET /api/notes?search=` — case-insensitive `contains` on `title` and `content` |
| **Platform unified search (§24)** | **Not integrated** — no Notes index subscriber |
| **Full-text / dedicated index** | **Not implemented** (documented as post-MVP in memory-bank plans) |

### 1.9 V_Link integration

| Layer | Status |
|-------|--------|
| Enum | `VLinkEntityType.NOTE` in `vlink.prisma` |
| Resolver | `vlinkEntityResolverService` — title + URL `/notes?note={id}` |
| Platform entity registry | **Not registered** |
| `notesVlinkAccessService` / lifecycle | **Missing** |
| Manifest `vlink: true` | **Not declared** (manifest claims trash/notifications without full handlers) |

### 1.10 Trash integration

| Item | Status |
|------|--------|
| Field | `Note.trashedAt` ✅ |
| API delete | Controller sets `trashedAt` (module-local soft delete) |
| Global Trash handler | **Not registered** in `registerGlobalTrashHandlers.ts` |
| Restore / permanent delete via `trashController` | **Not wired** |
| Manifest `trash: true` | **Aspirational** — capability lie per roadmap §5.4 |

### 1.11 Sharing and collaboration

| Feature | Status |
|---------|--------|
| Per-user share (viewer/editor) | ✅ `NoteShare` + `notesShareController` |
| `notes_shared` notification | ✅ on share |
| Realtime co-editing | ❌ |
| Comments on notes | ❌ |
| Version history | ❌ |
| Conflict resolution | ❌ |

### 1.12 Attachments and versioning

| Feature | Status |
|---------|--------|
| Note attachments | ❌ (Todo has `TaskAttachment` + Drive links; Notes has none) |
| Linked files on notes | ❌ |
| Version history | ❌ |
| Content diff / restore prior version | ❌ |

**Todo contrast (certified):** `todoAttachmentService`, `todoIntegrationLinkService` (Drive + Calendar), `TaskComment`, subtasks, recurrence, assignment, Global Trash handler, 28 `todo*Service` files.

---

## Part 2 — Product analysis

### 2.1 Option A — Notes + Todo as separate modules

**Strengths**

- **Preserves Reference Module #4** without reinterpretation — Todo patterns remain the task-lifecycle authority.
- Clear mental model for power users: “tasks” vs “documents.”
- Independent certification waves — Notes could reach Level 3 on File Hub patterns without touching Todo.
- Smaller blast radius for marketplace manifests (`notes` vs `todo` permissions already distinct).
- Mobile can ship focused task inbox vs reading/editor modes separately.

**Weaknesses**

- **Workflow fracture:** Meeting notes with action items require two modules, two sidebars, two AI context namespaces.
- **Duplicate primitives:** Tags, folders/projects, search, trash, share models diverge (Note folders vs Task projects; markdown checklists in notes vs real tasks).
- **Cross-linking friction:** No `Note ↔ Task` link schema; users duplicate checklist markdown (`- [ ]`) in Notes templates while Todo owns real task state.
- **AI fragmentation:** Twin must choose `notes` vs `todo` modules; action extraction from prose is unnatural.
- **Navigation cost:** Business workspace already switches `notes` and `todo` as separate cases — cognitive load for “work hub.”
- **Modernization waste:** Investing in full Notes certification (services, trash, V_Link, entities) **before** product consolidation may be throwaway schema/UI work.

### 2.2 Option B — Notebook single module

**Strengths**

- **Unified work surface:** One hub for thinking (notes) and doing (tasks/checklists).
- **Natural workflows:** Meeting note → extracted action items; project brief → linked tasks; daily note → checklist + narrative.
- **Single AI context:** “What am I working on?” spans prose and tasks; action extraction from note body is a first-class product feature.
- **Search UX:** One index scope for “my work artifacts” (with phased backend federation).
- **Mobile:** One tab/screen hierarchy: Notebook → pages/sections → tasks inline.
- **Knowledge management trajectory:** Sections, templates, linked files/events/conversations fit one information architecture.

**Weaknesses**

- **Large product scope:** Notebook is a superset — risk of multi-year “super-module” if backend merge is rushed.
- **Certification complexity:** New `notebook` module id cannot inherit Todo Level 3 without re-audit; merge could regress certified patterns.
- **Migration risk:** Users with installed `notes` + `todo` modules, widgets (`notes`, `quicknotes`), and permissions need provisioning story.
- **Third-party contract:** Marketplace modules targeting `todo` or `notes` need compatibility layer or deprecation period.
- **Performance:** Unified list/search across note bodies + task metadata is heavier than separate optimized lists.

### 2.3 Comparison matrix

| Criterion | Separate (A) | Notebook (B) |
|-----------|--------------|--------------|
| User workflow (capture → act) | Weak — context switch | Strong — same surface |
| Navigation complexity | Higher (2 modules) | Lower (1 hub, optional deep links) |
| Cross-linking | Manual / duplicate markdown | Native links (when modeled) |
| Mobile UX | Two apps-in-app | One notebook stream |
| Desktop UX | Two sidebars | Unified tree/sections |
| Search | Two indices / two APIs | Federated or unified index (later) |
| AI experience | Split providers | Unified context + extraction |
| Future collaboration | Note co-edit vs task assign — disjoint | Shared page/section membership model possible |
| Knowledge management | Notes-only | Notes + task context on same page |
| Project management | Todo projects | Notebook project = section + task board |
| Platform modernization cost | Notes full wave + maintain Todo | Notebook shell first; defer Notes cert; **reuse Todo services** |

### 2.4 Product verdict (Part 2)

**Notebook (Option B) is the better long-term architecture** for Vssyl’s “personal + business work hub” positioning, **provided** implementation follows a **facade-first, domain-separated** migration (see Part 4) so Todo certification and services are not destroyed.

Separate modules remain valid as **backend bounded contexts** (`notes` domain, `todo` domain) even when the **product module id** becomes `notebook`.

---

## Part 3 — Notebook domain model (design only)

See [`NOTEBOOK_DOMAIN_MODEL.md`](./NOTEBOOK_DOMAIN_MODEL.md) for entity diagrams and tables. Summary:

### 3.1 Product concepts

| Concept | Description | Initial owner |
|---------|-------------|---------------|
| **Notebook** | Top-level container per dashboard/tenant (personal or business) | New (facade) — may map 1:1 to dashboard initially |
| **Page** | Primary document surface (replaces standalone “Note” in UX) | Evolves from `Note` |
| **Section** | Ordered block within a page (text, checklist, task embed, file embed) | **New** — not in schema today |
| **Task** | Action item with status, assignee, due date | **Stays Todo domain** (`Task`) |
| **Checklist** | Lightweight items — either markdown in section **or** linked subtasks | Hybrid: UI checklist → optional Task promotion |
| **Template** | Page blueprint | UI templates today (`NotesModule` constants) → persisted later |

### 3.2 What stays Todo-specific

- `Task` lifecycle (status, priority, assignee, due dates, snooze)
- `TaskDependency`, `TaskTimeLog`, `TaskWatcher`, business assignment notifications
- `todoTrashService`, Global Trash handler for `task`
- `todoCalendarBridgeService`, `todoIntegrationLinkService` (Drive/Calendar)
- Recurrence (RRULE), projects (`TaskProject`), subtasks
- `todoAIActionService`, `todo:task` platform entity, V_Link `TASK`/`TODO`

### 3.3 What stays Note-specific (until merged)

- Long-form `content` body storage (markdown/rich text evolution)
- `NoteFolder` hierarchy (may rename to `PageFolder` or map under Notebook)
- `NoteShare` document-level sharing (distinct from task assignee model)
- Pinning, tags on prose documents

### 3.4 What becomes shared (Notebook layer)

| Shared capability | Pattern source |
|-------------------|----------------|
| Tenant scoping (`dashboardId`, `businessId`) | Both domains today |
| Global Trash UX | File Hub + **Todo** (handler exists) + Notes field only |
| Unified search facade | Platform §24 — federated query |
| Link graph: page ↔ task ↔ file ↔ event ↔ conversation ↔ place | Todo `todoIntegrationLinkService` + new `notebookLinkService` |
| AI: summarize page, extract actions, link tasks | Chat AI routing + Todo executor |
| Activity feed normalization | `moduleId: 'notebook'` facade emitting sub-domain detail |
| Visibility reads | Todo `todoVisibilityService` + future `notesVisibilityService` behind facade |

### 3.5 Explicit non-goals (Notebook v1 design)

- OT/CRDT real-time co-editing
- Full version history store (activity + optional snapshots later)
- Replacing Todo Reference Module certification artifacts
- Big-bang schema merge of `notes` + `tasks` tables

---

## Part 4 — Migration strategy

See [`NOTEBOOK_MIGRATION_STRATEGY.md`](./NOTEBOOK_MIGRATION_STRATEGY.md). **Recommended: Option 1 → Option 3 (hybrid).**

| Option | Description | Risk | Todo cert impact |
|--------|-------------|------|------------------|
| **1 — Unified UI, separate backends** | Product module `notebook`; routes `/api/notes/*`, `/api/todo/*` unchanged; BFF/facade composes | **Lowest** | **None** — Reference #4 intact |
| **2 — Merge backend domains** | Single schema/service tree | **Highest** — re-certification, data migration | **Threatens** #4 unless carefully partitioned |
| **3 — Hybrid transition** | Phase 1 UI + links; Phase 2 shared link/activity; Phase 3 optional schema | **Medium** | **Preserves** #4 through Phase 2 |

**Recommendation:** **Option 3 starting with Option 1.**

1. **Phase 0 (now):** Architecture docs, roadmap reprioritization, freeze Notes modernization.
2. **Phase 1:** `Notebook` product shell — routes, workspace case, widget; embed `NotesModule` + Todo views; cross-link UX (deep links only).
3. **Phase 2:** `notebookLinkService` — associate pageId ↔ taskId ↔ fileId ↔ eventId; AI action extraction calls `todoAIActionService`.
4. **Phase 3 (optional, gated):** Manifest/module id consolidation; deprecate standalone `notes` sidebar entry; retain `todo` APIs for integrators.

**Do not:** Delete `tasks` table, remove `todo*Service`, or re-register Global Trash under a new handler until architecture council approves.

---

## Part 5 — Platform alignment

If Notebook is introduced as a **product module** (`notebook`), platform requirements apply to the **facade** and any **new** cross-cutting services — not by rewriting Todo internals.

| Platform requirement | Notebook need | Reuse from |
|---------------------|---------------|------------|
| **Global Trash** | Unified trash UX listing notes + tasks | File Hub pattern; **Todo handler ✅**; Notes needs handler OR trash via facade delegating to domains |
| **V_Link** | Page + task link types in resolver | File Hub lifecycle; **Todo** `todoVlinkAccessService`; Notes entity registration deferred or alias `NOTE` → `notebook:page` |
| **Platform Entities** | `notebook:page`, retain `todo:task` | Todo registration ✅; Notes register as page descriptor |
| **Activity** | Facade events with `subModule: notes|todo` | Todo `todoActivityService`; Notes emits today — consolidate in facade |
| **Notifications** | `notebook_*` types or namespace prefix | Todo `todo_assigned`; Notes `notes_shared` |
| **Realtime** | Page/task updates in notebook rooms | **Chat** `chatRealtimeService` pattern via Todo `todoRealtimeService` |
| **AI compliance** | Reads via visibility; writes via `todoAIActionService` + future `notebookAIActionService` | **Todo ✅**; Notes reads only until service extraction |
| **Policy Engine** | Facade authorize; delegate to `todoPolicyDual` / future `notesPolicyDual` | **Todo ✅** |
| **Visibility service** | Federated list API | **Todo** `todoVisibilityService`; Notes list stays controller until service exists |

**Notebook does not require a new Reference Implementation.** It should **compose** certified modules:

- **Task patterns → Todo (Reference #4)**
- **Trash / visibility / V_Link on documents → File Hub**
- **AI routing / thin facade controllers → Chat**
- **Time-based links → Calendar bridges via Todo**

---

## Part 6 — Certification impact

| Question | Recommendation |
|----------|----------------|
| Does Todo remain Reference Module #4? | **Yes.** Certification is about **task lifecycle implementation patterns**, not sidebar branding. |
| Does Notebook become a future Reference Module? | **Possible Level 3 target** only after its own audit — likely **Level 3 for composition/facade**, not replacing File Hub Level 4. Earliest candidate **Reference #5** only if Place/Dashboard deferred and Notebook reaches certified facade + link layer. |
| Is Notes modernization still necessary? | **Not as a standalone wave.** Notes gaps (trash handler, services, entities) should be addressed as **Notebook document-domain work** or **minimal hygiene** only if blocking Notebook Phase 1. |
| Is Notes certification replaced by Notebook certification? | **Yes, functionally** — product cert target becomes **Notebook**; **`notes` module id** may remain as internal bounded context without separate Level 3 product certification. |
| Ledger updates (when implementing later) | Add row: **Notebook** `notebook` — *Planned*; freeze **Notes** wave; keep **Todo** Level 3. |

**Certification principle:** Do not re-open Todo Wave 1–3. Any Notebook certification audit references Todo as **dependency** (composed system), similar to Business Workspace referencing multiple modules.

---

## Part 7 — UX recommendation (workflow-first)

### 7.1 Primary surfaces

**Notebook** opens to a **timeline or tree**: Recent pages, pinned pages, open tasks due soon (fed from Todo API).

### 7.2 Workflow stories

| Story | Experience |
|-------|------------|
| **Meeting note → action items** | User creates “Meeting notes” template page → highlights bullets → “Add as tasks” → tasks created via Todo API, linked inline on page with status chips |
| **Project note → linked tasks** | Project brief page sidebar shows linked tasks from projectId; drag task onto page as embed |
| **Daily note → checklist** | Daily page section with checklist blocks; unchecked items promotable to full tasks with due date |
| **Task → rich note content** | Task detail expands “Notes” tab — backed by linked page or `Task.description` for short form |
| **Calendar event → notebook page** | From event drawer: “Open notebook page” — link via `todoIntegrationLinkService` / new notebook link |
| **File → notebook page** | From Drive: “Attach to notebook page” — Drive file link on page section |

### 7.3 Navigation model

- **One** business workspace case: `notebook` (replaces separate `notes` + `todo` entries in hub over time).
- **Deep links** preserve `/api/todo/...` and `/api/notes/...` for bookmarks and V_Link during transition.
- **Widgets:** Single `notebook` widget (recent pages + due tasks); deprecate standalone `notes` widget gradually.

### 7.4 Mobile vs desktop

- **Mobile:** Single Notebook tab; swipe between “Pages” and “Tasks” sub-views; FAB creates page or task.
- **Desktop:** Three-pane — tree | page editor | task/comments sidebar.

---

## Final recommendation

### **B — Replace Notes modernization with Notebook initiative**

**Justification:**

1. **Notes is partial (B)** — shipping UI without platform certification; a full Notes wave duplicates effort Todo already solved for action items.
2. **Product direction** — user workflows (meeting notes → tasks, daily checklist → tasks) align with **Notebook**, not two modules.
3. **Risk management** — facade-first migration **preserves Todo Reference Module #4** and 28 certified services.
4. **Roadmap efficiency** — avoids certifying `notes` then deprecating its product surface; targets **Place** as Reference #5 candidate after Notebook Phase 1–2, not Notes Level 3.
5. **AI strategy** — unified context and action extraction require a single product boundary.

**Immediate actions (documentation / planning only):**

- [x] This review + domain model + migration strategy
- [x] Roadmap update — stop Notes wave; start Notebook planning track
- [ ] Product sign-off on Phase 1 scope (UI shell + deep links)
- [ ] Phase 0 Notebook constitutional audit **when** implementation approved (not now)

**Explicitly not doing:** Notes Phase 1B, `notes*Service` creation, Notes certification, Place modernization, code refactors.

---

*Last updated: 2026-06-01*
