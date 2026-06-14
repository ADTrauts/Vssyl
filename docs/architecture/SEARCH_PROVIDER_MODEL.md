# Search Provider Model

**Program:** Vssyl Relationship Framework  
**Phase:** 2B — Relationship search constitutional architecture  
**Status:** Canonical source of truth  
**Date:** 2026-06-14  
**Architecture:** [RELATIONSHIP_SEARCH_ARCHITECTURE.md](./RELATIONSHIP_SEARCH_ARCHITECTURE.md)  
**Ownership:** [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md)

> **Scope:** Defines **SearchProvider** types, authority split, and result responsibility. Prevents duplicated ownership between search and relationship SoR. **No** API or registry implementation in this phase.

---

## Provider model summary

A **SearchProvider** is a **read delegate** bound to exactly one **search authority domain**. It translates `(query, userId, filters, tenant context)` into `SearchResult[]` after the domain's **permission authority** approves each hit.

```typescript
// Constitutional interface (existing shared type — reference only)
interface SearchProvider {
  moduleId: string;           // Authority domain id — not always a marketplace module
  moduleName: string;         // Display label
  search: (query, userId, filters?) => Promise<SearchResult[]>;
  getSuggestions?: (query, userId) => Promise<string[]>;
}
```

**SearchProvider does not:**

- Create/update/delete entities, tags, or relationships  
- Define permission rules (delegates to visibility / PE)  
- Own data indexed from another module's SoR  

---

## Authority columns (how to read this matrix)

| Column | Meaning |
|--------|---------|
| **System of record** | Where truth lives for searchable content |
| **Search authority** | Who implements the provider query |
| **Permission authority** | Who decides if a hit is visible |
| **Result responsibility** | Who is accountable if a wrong hit leaks or a valid hit is missing |

**Duplication guard:** If search authority ≠ SoR module, search authority may only **read** via published visibility APIs — never duplicate storage.

---

## Platform providers

### V_Link

| Field | Value |
|-------|-------|
| **Provider type** | Platform container (V_Link Search) |
| **`moduleId`** | `vlink` |
| **System of record** | `VLink`, `VLinkMember`, `VLinkEntity` — `vlinkService` |
| **Search authority** | Platform — `searchVLinksForUser` |
| **Permission authority** | `vlinkPermissionService` (membership); attachments **not** searched here |
| **Result responsibility** | Platform search team + V_Link owners |
| **Returns** | Container metadata: title, publicCode, scope, hub URL |
| **Does not return** | Attachment body text, restricted entity titles |
| **Relationship class** | Association (container) + Membership |

### Member (identity)

| Field | Value |
|-------|-------|
| **Provider type** | Identity / navigation |
| **`moduleId`** | `member` |
| **System of record** | `User`, `BusinessMember`, `Relationship` (connection) |
| **Search authority** | Platform — member search in `searchController` |
| **Permission authority** | Shared org / accepted connection visibility builder |
| **Result responsibility** | Platform |
| **Returns** | User profile navigation hits |
| **Note** | Connection **relationship** gates visibility — not a separate edge hit type |

### Dashboard

| Field | Value |
|-------|-------|
| **Provider type** | Workspace navigation |
| **`moduleId`** | `dashboard` |
| **System of record** | `Dashboard`, widgets |
| **Search authority** | Platform |
| **Permission authority** | Dashboard owner / member rules |
| **Result responsibility** | Platform workspace |

---

## Module entity providers

### Drive (File Hub)

| Field | Value |
|-------|-------|
| **Provider type** | Entity Search |
| **`moduleId`** | `drive` |
| **System of record** | `File`, `Folder` |
| **Search authority** | File Hub — `driveSearchProvider` → `driveVisibilityService` |
| **Permission authority** | `driveVisibilityService` + PE FILE_* |
| **Result responsibility** | File Hub module owners |
| **Returns** | Files, folders user can access |
| **Relationship-informed filters** | Shared-with-me, mime category — still **entity** hits |
| **Tags** | Not in v1 provider; future tag facet via host row or Tag Index |
| **V_Link** | Separate provider; Drive shows indicator in hub only |

### Chat

| Field | Value |
|-------|-------|
| **Provider type** | Entity Search |
| **`moduleId`** | `chat` |
| **System of record** | `Conversation`, `Message` |
| **Search authority** | Chat — `chatSearchProvider` → `chatVisibilityService` |
| **Permission authority** | `chatVisibilityService` (participant scope) |
| **Result responsibility** | Chat module owners |
| **Returns** | Conversations, messages (participant-scoped) |
| **Tags** | **Forbidden** structured tags v1 — hashtags remain message content only |
| **Trash** | Trashed conversations excluded |

### Calendar

| Field | Value |
|-------|-------|
| **Provider type** | Entity Search |
| **`moduleId`** | `calendar` |
| **System of record** | `Event`, `Calendar` |
| **Search authority** | Calendar module (module-local today; global registry **pending**) | 
| **Permission authority** | Calendar PE + `calendarVlinkAccessService` for V_Link attach |
| **Result responsibility** | Calendar module owners |
| **Returns** | Events, calendars user can view |
| **Relationship classes in query** | Participation (attendee), membership — filter only |
| **Global registry** | ⏳ Not yet registered in `searchController` |

### Todo

| Field | Value |
|-------|-------|
| **Provider type** | Entity Search (+ tag facet in-module) |
| **`moduleId`** | `todo` / `tasks` |
| **System of record** | `Task`, junctions: `TaskDependency`, `TaskFileLink`, `TaskEventLink` |
| **Search authority** | Todo module — `todoVisibilityService` |
| **Permission authority** | `todoVisibilityService` + PE |
| **Result responsibility** | Todo module owners |
| **Returns** | Tasks (entity hits) |
| **Tag Search** | In-module filter on `Task.tags[]` — recommended |
| **Relationship Search** | TaskFileLink / dependencies — future adapter or module panel, not Drive provider |
| **Global registry** | ⏳ Not yet registered |

### Notes (Notebook)

| Field | Value |
|-------|-------|
| **Provider type** | Entity Search (+ tag facet in-module) |
| **`moduleId`** | `notes` |
| **System of record** | `Note`, `NoteShare`, `NotebookLink` |
| **Search authority** | Notes — `notesVisibilityService` |
| **Permission authority** | `notesVisibilityService` + share grants |
| **Result responsibility** | Notebook module owners |
| **Returns** | Notes/pages (entity hits) |
| **Tag Search** | In-module `Note.tags[]` — recommended |
| **Relationship Search** | `NotebookLink` — operational; hydrate via Pattern C, not V_Link provider |
| **Global registry** | ⏳ Not yet registered |

### Place

| Field | Value |
|-------|-------|
| **Provider type** | Entity Search (public catalog facet) |
| **`moduleId`** | `place` |
| **System of record** | `BusinessPlaceListing`, `PlaceCommunity`, follows in `BusinessFollow` |
| **Search authority** | Place — `placeSearchProvider` → `placeVisibilityService.searchListings` |
| **Permission authority** | `placeVisibilityService` + publish/visibility rules |
| **Result responsibility** | Place module owners |
| **Returns** | Listings (primary global search surface) |
| **Tag Search** | Listing/community `tags[]` — facet in module + future Tag Index |
| **Relationship Search** | Follows — discovery/analytics; not listing title search |

### Business (org / HR-adjacent)

| Field | Value |
|-------|-------|
| **Provider type** | Entity + identity (split surfaces) |
| **`moduleId`** | `business` |
| **System of record** | `Business`, `BusinessMember`, org entities |
| **Search authority** | Business module + platform member search overlap |
| **Permission authority** | Business PE, ADMIN roles |
| **Result responsibility** | Business module + platform for member overlap |
| **Returns** | Org navigation, colleagues (where not covered by `member` provider) |
| **Note** | HR module (future) may register separate provider — must not duplicate member SoR |

---

## Provider type taxonomy

| Type | Description | Examples |
|------|-------------|----------|
| **T1 — Entity** | Openable module records | drive, chat, todo, notes, calendar, place |
| **T2 — Container** | V_Link hubs | vlink |
| **T3 — Identity / workspace** | Users, dashboards | member, dashboard |
| **T4 — Tag facet reader** | Derived index lookup → entity keys | future `tag` logical reader |
| **T5 — Relationship adapter** | Edge lists with hydrate | future notebook/todo/share adapters |

Only **T1–T3** belong in global SearchProvider registry v1. **T4–T5** are Phase 2C+ extensions documented here to prevent scope creep into wrong type.

---

## Registration contract (governance)

When a module adds global search:

| Requirement | Detail |
|-------------|--------|
| Manifest | `capabilities.search: true` |
| Visibility | All hits pass module visibility service |
| Tenant scope | `dashboardId` / `businessId` / `householdId` on every query |
| Trash | Exclude trashed by default |
| Result shape | `SearchResult` with deep link `url` |
| Ownership | Module owns result responsibility for its entities |
| No cross-module Prisma | Hydrate foreign targets via owning module API |
| Certification | Module operation matrix search row updated |

---

## Responsibility matrix (summary)

| Module | SoR | Search authority | Permission authority | Wrong-hit owner |
|--------|-----|------------------|--------------------|-----------------|
| Drive | File Hub | File Hub provider | driveVisibilityService | File Hub |
| Chat | Chat | Chat provider | chatVisibilityService | Chat |
| Calendar | Calendar | Calendar (local/global) | Calendar PE | Calendar |
| Todo | Todo | Todo | todoVisibilityService | Todo |
| Notes | Notes | Notes | notesVisibilityService | Notes |
| Place | Place | Place provider | placeVisibilityService | Place |
| Business | Business | Business / member | Business PE | Business / Platform |
| V_Link | Platform | Platform vlink provider | vlinkPermissionService | Platform V_Link |

---

## Anti-patterns

| Anti-pattern | Correct owner |
|--------------|---------------|
| Drive provider searches `Task` rows | Todo provider |
| V_Link provider returns file body snippets | Drive provider after resolver |
| Global tag table with write path | Module host `tags[]` |
| Chat provider indexes `#hashtag` as tag SoR | Forbidden v1 per TAG_STRATEGY |
| Duplicate member search in HR and platform | Single visibility builder, shared or delegated |
| SearchProvider mutates `VLinkEntity` on click | Hub navigation only |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_SEARCH_ARCHITECTURE.md](./RELATIONSHIP_SEARCH_ARCHITECTURE.md) | Federation overview |
| [SEARCH_PERMISSION_MODEL.md](./SEARCH_PERMISSION_MODEL.md) | Hit visibility rules |
| [TAG_INDEX_CONTRACT.md](./TAG_INDEX_CONTRACT.md) | Tag facet reader rules |
| [PLATFORM_ENTITY_MODEL.md](./PLATFORM_ENTITY_MODEL.md) | Entity registration checklist |

**Last updated:** 2026-06-14
