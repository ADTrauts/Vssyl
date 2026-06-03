# NotebookLink — Access Rules (Phase 3A)

**Status:** Design  
**Parent:** [NOTEBOOK_LINK_SCHEMA_DESIGN.md](./NOTEBOOK_LINK_SCHEMA_DESIGN.md)  
**Date:** 2026-06-01

---

## 1. Core invariants

1. **V_Link membership never grants access** to read or write link endpoints or embedded target payloads.
2. **NotebookLink row does not grant access** — authorization always re-checks Notes/Todo/Drive/Calendar/Chat/Place visibility at read and write time.
3. **Order of operations:** `authorize → execute → emit activity → domain event` (failed/unauthorized → no emit).
4. **Tenant scope:** `dashboardId` / `businessId` on the link must match the anchor page’s authorized context.
5. **NotebookLink does not mutate target domains** — linking does not assign tasks, RSVP events, upload files, or post chat messages.

---

## 2. Permission model (Phase 3B)

### Platform permissions (manifest)

Notebook facade already declares delegated permissions:

- `notes:read`, `notes:write`
- `todo:read`, `todo:write`

**Phase 3B:** Add explicit policy actions (register in `policyActions.ts`):

| Action | Meaning |
|--------|---------|
| `notebook:link:read` | List links for pages user can read |
| `notebook:link:write` | Create / archive links |

**Enforcement:** `notebookLinkPermissionService` calls Policy Engine where configured; falls back to composed domain checks (same pattern as `notesPolicyDual` / `todoPolicyDual`).

### Effective rules (always evaluate domain services)

Even when PE allows `notebook:link:write`, **both** endpoints must pass domain visibility below.

---

## 3. Create link — by target type

### 3.1 PAGE → TASK

| Check | Service |
|-------|---------|
| User can **write** anchor page | `notesPermissionService` / `notesVisibilityService` (editor or owner) |
| User can **read** task | `todoVisibilityService` |
| Task not trashed (or allow link to trashed with warning — **deny create** in 3B) | Todo |
| Same `dashboardId` / business context | Compare page context vs task `dashboardId` / `businessId` |

**Does not require** task write. Assigning/completing task remains Todo UI only.

**Promote-to-task:** Create task via `todoTaskService` (existing API) **then** create link with `relationshipType = ACTION_SOURCE` in same user flow; link create still requires page write + task read.

### 3.2 PAGE → FILE

| Check | Service |
|-------|---------|
| User can **write** page | Notes |
| User can **read** file | `driveVisibilityService` / `validateAccessibleFileIds` (same as `todoIntegrationLinkService`) |

**Does not require** Drive write on link create (reference only).

### 3.3 PAGE → CALENDAR_EVENT

| Check | Service |
|-------|---------|
| User can **write** page | Notes |
| User can **read** event | Calendar member role (pattern from `todoIntegrationLinkService.userCanAccessCalendarEvent`) |

**Does not** create or update event. RSVP/attendees — Calendar only.

### 3.4 PAGE → CHAT_CONVERSATION

| Check | Service |
|-------|---------|
| User can **write** page | Notes |
| User can **read** conversation | `chatVisibilityService` (or equivalent membership check) |

Phase 3B API may **accept** this type; UI deferred.

### 3.5 PAGE → PLACE_LISTING

| Check | Service |
|-------|---------|
| User can **write** page | Notes |
| User can **read** listing | Place module visibility (business listing access / published listing rules) |

Phase 3B API may **accept**; UI deferred.

### 3.6 TASK → PAGE (backlink / task-centric create)

| Check | Service |
|-------|---------|
| User can **read/write** task per Todo rules | `todoPermissionService` |
| User can **read** page | `notesVisibilityService` |

Storage: normalize to `sourceType = PAGE`, `targetType = TASK` when created from page UI; from task UI (future) allow `sourceType = TASK` if product requires — **Phase 3B: page routes only** (normalization in service).

---

## 4. Read link / list links

| Operation | Rules |
|-----------|--------|
| `GET .../pages/:pageId/links` | User can **read** page; return only links where page is endpoint; for each link, include `target` embed only if user still passes target visibility |
| `GET .../entities/:type/:id/links` | User can **read** anchor entity; filter links where user can read **both** endpoints |
| Backlinks on task | User can read task; filter to pages user can read |

**Hidden targets:** Omit from list or return `{ id, targetType, targetId, visibility: 'denied' }` — **Phase 3B recommendation:** omit denied targets from list (no ID leakage across tenants).

---

## 5. Delete / archive link

| Check | Notes |
|-------|--------|
| User can **write** page **or** user is `createdById` | Prefer **page write** as primary gate |
| Link `dashboardId` matches authorized context | Required |
| Operation | Set `archivedAt` (soft); no Global Trash |

**Does not** delete task, file, event, conversation, or listing.

---

## 6. V_Link interaction matrix

| Scenario | NotebookLink | V_Link |
|----------|----------------|--------|
| User has V_Link to task, no Todo read | No embed | AI may mention relationship; no task body |
| User has Todo read, no V_Link | Embed works | No AI graph edge |
| User creates NotebookLink | Operational index only | Does not auto-create V_Link |
| AI suggests link | Future: suggest → user confirms → NotebookLink create | Optional separate “add to graph” flow |

---

## 7. Shared page viewers

| Viewer role on page | Create link | See linked task details |
|-----------------------|-------------|-------------------------|
| Read-only share | ❌ | ✅ if Todo visibility allows read |
| Editor share | ✅ | ✅ per Todo rules |
| Viewer tries to complete linked task | ❌ (Todo UI / PE) | — |

---

## 8. Business vs personal context

| Rule | Detail |
|------|--------|
| Personal page | `businessId` null on link row |
| Business page | `businessId` required on link row |
| Cross-context link | **Deny** — e.g. business page → personal-only task without business scope |

Validate against `Note.dashboardId` / `Note.businessId` at create time.

---

## 9. Service responsibilities (access layer)

| Service | Access responsibility |
|---------|----------------------|
| `notebookLinkPermissionService` | PE actions; compose page write + target read rules; archive authorize |
| `notebookLinkVisibilityService` | List/filter links; resolve embed payloads via domain services; strip inaccessible targets |
| `notebookLinkService` | CRUD orchestration; calls permission + visibility; no Prisma in controller |

---

## 10. Phase 3B minimal enforcement scope

| Target type | Enforce in 3B |
|-------------|---------------|
| TASK | ✅ |
| FILE | ✅ |
| CALENDAR_EVENT | ✅ |
| CHAT_CONVERSATION | Stub deny or full check if Chat visibility helper exists |
| PLACE_LISTING | Stub deny or Place read check if helper exists |

**Recommendation:** Implement TASK + FILE + CALENDAR_EVENT checks; return `501` or `400` for CHAT/PLACE until visibility helpers are wired (or accept but hide in UI).

---

*API contracts: [NOTEBOOK_LINK_API_DESIGN.md](./NOTEBOOK_LINK_API_DESIGN.md).*
