# NotebookLink — API Design (Phase 3A)

**Status:** Design  
**Parent:** [NOTEBOOK_LINK_SCHEMA_DESIGN.md](./NOTEBOOK_LINK_SCHEMA_DESIGN.md)  
**Date:** 2026-06-01

---

## 1. API placement

| Surface | Owner | Phase 3B |
|---------|-------|----------|
| Page CRUD | `/api/notes/*` | Unchanged |
| Task CRUD | `/api/todo/*` | Unchanged |
| **NotebookLink** | `/api/notebook/*` | **New** — first Notebook-owned mutation API |
| V_Link | `/api/vlinks/*` | Unchanged |

**Routing:** Express router `notebookLinkRoutes.ts` → `notebookLinkController` (thin) → services.

**Proxy:** Next.js `/api/[...slug]` forwards to backend (no bypass).

---

## 2. Phase 3B minimal REST surface

### Required (3B)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/notebook/pages/:pageId/links` | List links for page (anchor `PAGE`) |
| `POST` | `/api/notebook/pages/:pageId/links` | Create link from page |
| `DELETE` | `/api/notebook/links/:linkId` | Archive link (`archivedAt`) |

### Deferred (3B+)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/notebook/backlinks` | Query `?targetType=&targetId=` |
| `GET` | `/api/notebook/entities/:entityType/:entityId/links` | Generic backlink / entity-centric list |
| `PATCH` | `/api/notebook/links/:linkId` | Update `relationshipType` / `metadata` |

---

## 3. Request / response shapes

### 3.1 List page links

**`GET /api/notebook/pages/:pageId/links`**

Query params (optional):

| Param | Type | Description |
|-------|------|-------------|
| `targetType` | enum | Filter: `TASK`, `FILE`, `CALENDAR_EVENT`, … |
| `relationshipType` | enum | Filter single role |
| `includeArchived` | boolean | Default `false` |

**Response 200:**

```json
{
  "pageId": "uuid",
  "links": [
    {
      "id": "uuid",
      "sourceType": "PAGE",
      "sourceId": "uuid",
      "targetType": "TASK",
      "targetId": "uuid",
      "relationshipType": "ACTION_SOURCE",
      "direction": "OUTBOUND",
      "createdById": "uuid",
      "metadata": {},
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601",
      "target": {
        "kind": "task",
        "id": "uuid",
        "title": "…",
        "status": "…",
        "dueDate": null
      }
    }
  ]
}
```

`target` populated by `notebookLinkVisibilityService` (delegates to Todo/Drive/Calendar). Omitted if user loses access.

**Errors:** `401`, `403`, `404` (page not found or not visible).

---

### 3.2 Create page link

**`POST /api/notebook/pages/:pageId/links`**

**Body:**

```json
{
  "targetType": "TASK",
  "targetId": "uuid",
  "relationshipType": "REFERENCE",
  "metadata": {}
}
```

**Server normalization:**

- `sourceType = PAGE`, `sourceId = :pageId`
- `direction = OUTBOUND`
- `dashboardId` / `businessId` from page context
- `createdById = req.user.id`

**Response 201:** link object (same shape as list item).

**Idempotent duplicate:** If unique constraint hit, return **200** with existing row (preferred) or **409** with `existingLinkId` — pick one in 3B implementation (recommend **200**).

**Errors:** `400` validation, `403` permission, `404` page/target not found, `422` context mismatch.

---

### 3.3 Archive link

**`DELETE /api/notebook/links/:linkId`**

**Response 204** or **200** `{ "archived": true }`.

Sets `archivedAt`; does not hard-delete row in 3B.

**Errors:** `403`, `404`.

---

## 4. Auth and context headers

Same as Notes/Todo:

- JWT / session via `req.user`
- `dashboardId` from query or body where required for business workspace
- Validate `typeof` query params (no blind casts)

---

## 5. Controller contract (thin)

```typescript
// notebookLinkController.ts — no Prisma
export async function getPageLinks(req, res);
export async function createPageLink(req, res);
export async function archiveNotebookLink(req, res);
```

Map service errors:

| Service error | HTTP |
|---------------|------|
| `not_found` | 404 |
| `forbidden` | 403 |
| `invalid` | 400 |
| `conflict` | 409 (if not using idempotent 200) |

---

## 6. Client integration (web)

**New file:** `web/src/api/notebookLinks.ts`

```typescript
// fetch('/api/notebook/pages/${pageId}/links', { headers: authHeaders(token) })
```

**Page editor:** `NotebookPageDetail` right rail calls list + create + archive.

**Promote-to-task:** Existing `POST /api/todo/...` then `POST .../pages/:pageId/links` with `ACTION_SOURCE`.

**Do not** route link mutations through `/api/notes`.

---

## 7. Domain events (API boundary)

Emitted **after** successful persist (see implementation plan):

| Event | When |
|-------|------|
| `notebook.link.created` | POST success |
| `notebook.link.archived` | DELETE success |

Register in `domainEventRegistry.ts` Phase 3B.

---

## 8. Activity feed (normalized)

| Activity verb | When |
|---------------|------|
| `linked_task_to_page` | TASK link created |
| `linked_file_to_page` | FILE link created |
| `linked_event_to_page` | CALENDAR_EVENT link created |
| `unlinked_from_page` | Link archived |

`moduleId: notebook`, metadata: `{ pageId, targetType, targetId, relationshipType }`.

---

## 9. AI / twin

Phase 3B: **no** new AI context routes required.

Future: `notebookAIContextService` may include link summaries by calling `notebookLinkVisibilityService` read-only.

Twin must **not** create links without same permission path as REST.

---

## 10. Optional endpoints (spec only — not 3B)

### Backlinks

**`GET /api/notebook/backlinks?targetType=TASK&targetId=...`**

Returns pages linking to entity. Used by Todo detail “Linked pages” (Phase 4+).

### Entity-centric

**`GET /api/notebook/entities/:entityType/:entityId/links`**

Validates `entityType` against `NotebookLinkEntityType` enum.

---

## 11. Testing contract (Phase 3B)

| Test file | Covers |
|-----------|--------|
| `notebookLinkService.test.ts` | Auth matrix, idempotent create, archive |
| `notebookLinkController.contract.test.ts` | HTTP mapping, no Prisma in controller |
| `notebookLinkVisibilityService.test.ts` | Strips denied targets |

---

*Implementation sequencing: [NOTEBOOK_LINK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_LINK_IMPLEMENTATION_PLAN.md).*
