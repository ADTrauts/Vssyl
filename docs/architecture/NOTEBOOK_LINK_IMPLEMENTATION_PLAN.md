# NotebookLink — Implementation Plan (Phase 3B)

**Status:** Phase 3B complete (2026-06-02); Phase 3C validation (2026-06-02)  
**Date:** 2026-06-01 (implemented 2026-06-02)  
**Design docs:** [NOTEBOOK_LINK_SCHEMA_DESIGN.md](./NOTEBOOK_LINK_SCHEMA_DESIGN.md), [NOTEBOOK_LINK_API_DESIGN.md](./NOTEBOOK_LINK_API_DESIGN.md), [NOTEBOOK_LINK_ACCESS_RULES.md](./NOTEBOOK_LINK_ACCESS_RULES.md)

---

## Phase 3A deliverables (this pass)

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | NotebookLink vs V_Link purpose | ✅ |
| 2 | Schema proposal | ✅ |
| 3 | Access rules | ✅ |
| 4 | Service design | ✅ §2 below |
| 5 | REST API design | ✅ |
| 6 | UI integration plan | ✅ §4 below |
| 7 | Events / activity | ✅ §5 below |
| 8 | Additive migration plan | ✅ |
| 9 | Manifest impact | ✅ §6 below |
| 10 | Phase 3B scope explicit | ✅ §3 below |

---

## 1. Recommendation: proceed with Phase 3B schema?

**Yes — proceed with Phase 3B schema implementation** after explicit user **`ACT`** for 3B, because:

1. Phase 2 Notes hardening is complete (visibility, trash, domain events, platform entity `page`).
2. NotebookLink is the **first justified Notebook-owned persistence** — operational links cannot be modeled in V_Link or Todo alone without violating page-centric UX.
3. Design is **additive** — no Todo/Notes/V_Link schema or behavior changes.
4. Phase 1 MLVP already has promote-to-task and task panel — persistence removes markdown/deep-link hacks.
5. Risk is bounded: single table, three REST endpoints, five services, minimal right-rail UI.

**Gate before coding:** User types **`ACT`** for Phase 3B (schema + services + routes + UI).

---

## 2. Service design (Phase 3B)

**Location:** `server/src/services/notebook/` (new folder, mirror `notes/` / `todo/`)

| Service | Required 3B? | Responsibility |
|---------|----------------|----------------|
| `notebookLinkService` | ✅ | Create, archive, getById; normalize PAGE→X; tenant scope; idempotent create; orchestrate permission + visibility |
| `notebookLinkPermissionService` | ✅ | PE + composed checks (page write, target read); map to `NotebookLinkError` |
| `notebookLinkVisibilityService` | ✅ | List links for page; hydrate `target` DTOs via `notesVisibilityService`, `todoVisibilityService`, Drive, Calendar |
| `notebookLinkActivityService` | ✅ | `emitModuleActivityEvent` for link create/archive |
| `notebookLinkDomainEventService` | ✅ | `notebook.link.created`, `notebook.link.archived` |
| `notebookLinkPresentationService` | ❌ defer | Shared DTO mappers if visibility service grows — inline in visibility for 3B |
| `notebookActivityService` (facade) | ❌ defer | Optional aggregate facade events — use link-specific activity in 3B |

**Anti-patterns:**

- No Prisma in `notebookLinkController`
- No task/file/event mutations inside link services
- No auto V_Link creation

### `notebookLinkService` flow

```
createPageLink(user, pageId, dto)
  → notebookLinkPermissionService.assertCanCreatePageLink(...)
  → notebookLinkVisibilityService.assertTargetVisible(...)
  → prisma.notebookLink.create (or find unique)
  → notebookLinkActivityService.emitLinked(...)
  → notebookLinkDomainEventService.emitCreated(...)
```

---

## 3. Phase 3B implementation scope (explicit)

### In scope

| Layer | Work |
|-------|------|
| **Schema** | `notebook_links` + enums per schema design |
| **Services** | Five services listed above |
| **Controller + routes** | 3 endpoints |
| **Policy** | `notebook:link:read`, `notebook:link:write` in `policyActions.ts` |
| **Domain events** | Register `notebook.link.created`, `notebook.link.archived` |
| **Tests** | Service + controller contract tests |
| **UI** | Page detail right rail: Linked Tasks, Linked Files, Linked Events |
| **Promote-to-task** | After task create, POST link `ACTION_SOURCE` |
| **Manifest** | `operationalLinks: true` metadata (see §6) |

### Out of scope (3B)

| Item | Phase |
|------|-------|
| Backlinks API | 4+ |
| Chat / Place link UI | 4+ |
| `notebookAIContextService` link provider | 6 |
| V_Link auto-suggest | 6+ |
| Global Trash for links | Never (use `archivedAt`) |
| Migrate Todo `TaskFileLink` | Never |
| `PATCH` link update | 4+ |
| `notebookTemplateService` | Separate phase |

---

## 4. UI integration plan

### Minimal Phase 3B (recommended)

**Component:** extend page route `web/src/app/notebook/page/[pageId]/` layout

| Rail section | Data | Actions |
|--------------|------|---------|
| **Linked Tasks** | `GET .../pages/:id/links?targetType=TASK` | Link existing (picker), unlink, open task; promote-to-task adds row |
| **Linked Files** | `?targetType=FILE` | Link via Drive picker pattern (from Todo), unlink |
| **Linked Events** | `?targetType=CALENDAR_EVENT` | Link existing event id / picker, unlink |

**Defer:** Chat, Place sections (API may reject until wired).

**Read-only task fields** on page — status chips poll Todo API or reuse `NotebookTasksPanel` data.

### Files to add/touch (3B ACT)

| File | Change |
|------|--------|
| `web/src/components/notebook/NotebookLinkedTasksPanel.tsx` | New |
| `web/src/components/notebook/NotebookLinkedFilesPanel.tsx` | New |
| `web/src/components/notebook/NotebookLinkedEventsPanel.tsx` | New |
| `web/src/components/notebook/NotebookPageLinksRail.tsx` | Compose sections |
| `web/src/api/notebookLinks.ts` | Client |
| Page detail layout | Insert right rail |

---

## 5. Domain events and activity (minimal taxonomy)

### Domain events (register Phase 3B)

| Event | Payload keys |
|-------|----------------|
| `notebook.link.created` | `linkId`, `pageId`, `targetType`, `targetId`, `relationshipType`, `dashboardId`, `businessId?` |
| `notebook.link.archived` | `linkId`, `pageId`, `targetType`, `targetId` |

**Do not add** in 3B: `notebook.page.linkedToTask` (redundant with `notebook.link.created` + activity verb).

### Activity verbs

| Verb | `targetType` |
|------|----------------|
| `linked_task_to_page` | TASK |
| `linked_file_to_page` | FILE |
| `linked_event_to_page` | CALENDAR_EVENT |
| `unlinked_from_page` | any |

`moduleId: notebook`.

---

## 6. Manifest and platform entity impact

### Phase 3B manifest (`builtInModuleManifests` case `notebook`)

| Field | Phase 3B change |
|-------|-----------------|
| `entities[]` | **Wait** — continue using **notes** entity `page` for page resolution |
| `vlink` | **Do not claim** — notes `NOTE` resolver exists; Notebook cert is Phase 7 |
| `trash` | **Do not claim** — pages use notes trash |
| `search` | **Wait** |
| `globalActivity` | **Wait** |
| **Custom capability** | Add `operationalLinks: true` in manifest capabilities object **if** schema supports arbitrary metadata; else document in architecture only until manifest schema extended |

### Platform entity registry

**Do not** register `notebook:link` as V_Link entity in 3B.

Optional Phase 7: `registerNotebookPlatformEntities` for certification audit only.

### Notifications

**None** in 3B — linking is not a notification-worthy event unless product requests later.

---

## 7. Implementation sequence (3B ACT)

| Step | Days (est.) | Task |
|------|-------------|------|
| 1 | 0.5 | Prisma module + migration |
| 2 | 1 | `notebookLink*Service` + errors/types |
| 3 | 0.5 | Controller + routes + policy actions |
| 4 | 0.5 | Domain events + activity |
| 5 | 1 | Tests |
| 6 | 1.5 | UI rail + client API |
| 7 | 0.5 | Promote-to-task wiring + smoke |

**Total:** ~5–6 dev days.

---

## 8. Acceptance criteria (Phase 3B complete)

- [x] `notebook_links` migration added; no Todo/Notes schema diff
- [x] Create/list/archive links authorized per access rules doc
- [x] V_Link unchanged; no auto-create
- [x] Activity + domain events on success only
- [x] Page right rail shows tasks, files, events
- [x] Promote-to-task creates `ACTION_SOURCE` link
- [x] Server tsc + 14 targeted vitest tests pass

---

## Phase 3C — Validation (2026-06-02)

| Check | Result |
|-------|--------|
| `pnpm prisma:generate` | ✅ |
| `pnpm prisma:migrate:deploy` | ⚠️ Blocked locally — Postgres `@14` service error / `localhost:5432` unreachable; migration SQL committed at `20260601130000_add_notebook_links` |
| Server / web `tsc` | ✅ |
| NotebookLink unit tests | ✅ 23 tests |
| DB integration (`RUN_NOTEBOOK_LINK_DB_TESTS=1`) | Optional — `notebookLink.integration.test.ts` |

**Bugs fixed in 3C:**

1. **Re-link after archive** — `createPageLink` restores `archivedAt: null` on existing unique row instead of hitting DB unique violation.
2. **Permission HTTP mapping** — `notebookLinkController` maps `NotesServiceError` (page write/read deny) to correct 403/404.

**Manual browser smoke:** Requires `JWT_SECRET`, running Postgres with migration applied, `pnpm dev`. Flows: promote-to-task → Linked Tasks; link/unlink/re-link by task ID; file/event ID link deny/list.

---

## 9. Phase 4+ handoff

| Phase | Builds on NotebookLink |
|-------|----------------------|
| **4 Calendar** | Meeting panel, `AGENDA` UX polish, calendar picker |
| **5 File Hub** | Evidence role, embed cards |
| **6 AI** | `suggest_links`, context provider |
| **7 Cert** | Manifest truth, operation matrix, optional `entities[]` for notebook |

---

*Parent plan: [NOTEBOOK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_IMPLEMENTATION_PLAN.md).*
