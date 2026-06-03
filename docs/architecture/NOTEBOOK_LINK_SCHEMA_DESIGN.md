# NotebookLink — Schema Design (Phase 3A)

**Status:** Design approved for Phase 3B schema gate  
**Parent:** [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md)  
**Date:** 2026-06-01  
**Phase:** 3A (design only — no Prisma migration in this phase)

---

## 1. Purpose vs V_Link

| Dimension | **NotebookLink** | **V_Link** |
|-----------|------------------|------------|
| **Job** | Operational edges for **page-centric work** (agenda, evidence, spawned tasks) | User-curated **platform graph** for discovery and AI relationship context |
| **Owner** | Notebook product (`moduleId: notebook`) | Platform (`vlink` module / Tier 0) |
| **Persistence** | `notebook_links` (Phase 3B) | `vlinks` |
| **Grants access?** | **No** — link row is an index; target reads use domain visibility | **No** — membership does not grant content access |
| **Mutates target domain?** | **No** — create task/event/file still goes through Todo/Calendar/Drive/Chat/Place APIs | **No** |
| **Replaces Todo `TaskFileLink` / `TaskEventLink`?** | **No** — task-centric links stay in Todo | N/A |
| **User approval for AI?** | N/A (operational CRUD by authorized user) | AI suggestions require user approval |

**Boundary rule:** Creating a NotebookLink never creates, updates, or deletes a V_Link. A user may separately add a V_Link between the same entities for AI/discovery; that path uses `vlinkService` and resolver checks — not NotebookLink writes.

---

## 2. Design principles

1. **Additive only** — new table; no changes to `notes`, `tasks`, `TaskFileLink`, `TaskEventLink`, or `vlinks`.
2. **Tenant-scoped** — every row carries `dashboardId` and optional `businessId` aligned with the anchor page context.
3. **Polymorphic endpoints** — `sourceType` / `sourceId` / `targetType` / `targetId` (not a `pageId`-only column) so backlinks and future `TASK → PAGE` queries are first-class.
4. **Canonical storage for page-initiated links** — Phase 3B writes normalize to `sourceType = PAGE`, `sourceId = note.id`, `targetType = <external>`, `direction = OUTBOUND` unless explicitly inverted for system backfill.
5. **Soft remove** — `archivedAt` (not Global Trash); links are product metadata, not user “documents.”
6. **No FK to foreign modules** — validate `sourceId` / `targetId` at service layer via domain visibility services (Notes, Todo, Drive, Calendar, Chat, Place).

---

## 3. Proposed Prisma model

**Module file (recommended):** `prisma/modules/notebook/notebook.prisma`  
**Table map:** `notebook_links`

```prisma
enum NotebookLinkEntityType {
  PAGE
  TASK
  FILE
  CALENDAR_EVENT
  CHAT_CONVERSATION
  PLACE_LISTING
}

enum NotebookLinkRelationshipType {
  REFERENCE      // generic citation
  ACTION_SOURCE  // task spawned from / tracked on page
  AGENDA         // meeting page ↔ event
  EVIDENCE       // supporting file / artifact
  EMBED          // UI embed card (read-only surface)
}

enum NotebookLinkDirection {
  OUTBOUND   // source → target (default page → X)
  INBOUND    // rare explicit reverse index
  BIDIRECTIONAL // display/query treats edge as undirected
}

model NotebookLink {
  id               String                      @id @default(uuid())
  dashboardId      String
  businessId       String?

  sourceType       NotebookLinkEntityType
  sourceId         String
  targetType       NotebookLinkEntityType
  targetId         String

  relationshipType NotebookLinkRelationshipType @default(REFERENCE)
  direction        NotebookLinkDirection        @default(OUTBOUND)

  createdById      String
  metadata         Json?

  createdAt        DateTime                    @default(now())
  updatedAt        DateTime                    @updatedAt
  archivedAt       DateTime?

  @@unique([dashboardId, sourceType, sourceId, targetType, targetId, relationshipType])
  @@index([dashboardId, sourceType, sourceId, archivedAt])
  @@index([dashboardId, targetType, targetId, archivedAt])
  @@index([dashboardId, sourceType, sourceId, targetType, archivedAt])
  @@index([dashboardId, targetType, targetId, sourceType, archivedAt])
  @@map("notebook_links")
}
```

### Field rationale

| Field | Notes |
|-------|--------|
| `id` | UUID primary key |
| `dashboardId` | Required tenant scope (personal: user dashboard; business: business dashboard) |
| `businessId` | Nullable; set when link created in business workspace context |
| `sourceType` / `sourceId` | One endpoint of the edge |
| `targetType` / `targetId` | Other endpoint |
| `relationshipType` | Semantic role (replaces earlier draft name `linkRole`) |
| `direction` | Query/display hint; storage still normalized for page APIs |
| `createdById` | Actor for activity + audit |
| `metadata` | Optional JSON: `{ "label", "snippet", "promotedFromBlockId" }` — no secrets |
| `archivedAt` | Soft delete; list queries filter `archivedAt: null` |
| **No** `deletedAt` | Avoid confusion with Global Trash (`trashedAt` on Note/Task/File) |
| **No** `pageId` column | Use `sourceType = PAGE` + `sourceId` (or target when INBOUND) |

### Uniqueness

**`@@unique([dashboardId, sourceType, sourceId, targetType, targetId, relationshipType])`**

- Prevents duplicate operational edges in the same tenant.
- Same page + task allowed with different `relationshipType` (e.g. `REFERENCE` + `ACTION_SOURCE`).
- Idempotent POST returns existing row (200/409 policy — see API design).

**Phase 3B optional:** application-level normalization so `(PAGE→TASK)` and `(TASK→PAGE)` are not both stored unless product requires bidirectional rows.

### Indexes (query patterns)

| Query | Index |
|-------|--------|
| Page detail — all links from page | `[dashboardId, sourceType, sourceId, archivedAt]` |
| Backlinks — pages pointing at entity | `[dashboardId, targetType, targetId, archivedAt]` |
| Page detail filtered by target kind (tasks only) | `[dashboardId, sourceType, sourceId, targetType, archivedAt]` |
| Task → linked pages | `[dashboardId, targetType, targetId, sourceType, archivedAt]` where `targetType = TASK` |
| Calendar meeting page lookup | Same as backlinks with `targetType = CALENDAR_EVENT` |
| File-linked pages | Backlinks index with `targetType = FILE` |

---

## 4. Supported entity types (closed set)

| Enum | Maps to | ID refers to |
|------|---------|----------------|
| `PAGE` | Notes module | `Note.id` |
| `TASK` | Todo module | `Task.id` |
| `FILE` | File Hub (Drive) | Drive file id |
| `CALENDAR_EVENT` | Calendar | `Event.id` |
| `CHAT_CONVERSATION` | Chat | Conversation/thread id (match Chat API) |
| `PLACE_LISTING` | Place | `BusinessPlaceListing.id` |

**Do not add** in Phase 3B: `FOLDER`, `PROJECT`, `VLINK`, `USER`, `ANALYTICS_EVENT`.

---

## 5. Relationship type usage (Phase 3B)

| Type | Phase 3B | Example |
|------|----------|---------|
| `REFERENCE` | ✅ default | User linked existing task |
| `ACTION_SOURCE` | ✅ | Promote-to-task flow |
| `AGENDA` | ✅ (if event links in 3B UI) | Meeting notes page ↔ event |
| `EVIDENCE` | Optional | File as supporting doc |
| `EMBED` | Defer | Distinct embed lifecycle — use when embed cards ship |

---

## 6. Lifecycle on target trash / delete

| Target state | NotebookLink behavior (Phase 3B) |
|--------------|----------------------------------|
| Page trashed (`Note.trashedAt`) | Hide links in list; deny new links; allow archive of link rows |
| Task trashed | Link remains; embed shows “Task in trash” via Todo visibility |
| File trashed | Embed shows trash state via Drive |
| Event deleted | Archive link on read failure or lazy job (Phase 3B: hide in list if not visible) |
| Target permanently deleted | Archive link row (`archivedAt = now()`) on next failed visibility resolve |

**No cascade FK** — orphan links are acceptable short-term; visibility layer filters them out.

---

## 7. Migration / compatibility

| Action | Phase 3B |
|--------|----------|
| Create `notebook_links` table | ✅ |
| Backfill from Todo `TaskFileLink` / `TaskEventLink` | ❌ |
| Backfill from markdown URLs in notes | ❌ (future optional script) |
| Modify Todo schema | ❌ |
| Modify Notes schema | ❌ |
| Modify V_Link | ❌ |

---

## 8. Phase 3B schema gate checklist

- [ ] Add `prisma/modules/notebook/notebook.prisma` + merge in schema build
- [ ] Migration `add_notebook_links`
- [ ] `pnpm prisma:generate` + server type-check
- [ ] No changes to `todo.prisma`, `notes.prisma`, `vlink.prisma`

---

## 9. Open questions (resolve in 3B ACT)

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | Store both directions for TASK↔PAGE? | **No** — single canonical `PAGE → TASK` row |
| 2 | `metadata` size cap? | 4 KB JSON; validate in service |
| 3 | Business link on personal page? | Deny — `businessId` must match page context |

---

*API: [NOTEBOOK_LINK_API_DESIGN.md](./NOTEBOOK_LINK_API_DESIGN.md). Access: [NOTEBOOK_LINK_ACCESS_RULES.md](./NOTEBOOK_LINK_ACCESS_RULES.md). Implementation: [NOTEBOOK_LINK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_LINK_IMPLEMENTATION_PLAN.md).*
