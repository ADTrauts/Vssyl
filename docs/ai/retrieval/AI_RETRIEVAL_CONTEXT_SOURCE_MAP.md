# AI Retrieval — Context Source Map

**Program:** AI Retrieval Adapter — Phase 0A  
**Date:** 2026-06-23  
**Status:** Entity × source × permission map

---

## 1. Map legend

| Category | Meaning |
|----------|---------|
| **A — Independent** | Must remain outside Search |
| **B — Search-aligned** | Should use Unified Search discovery delegate |
| **C — Provider summary** | Curated list/stats via context providers |
| **D — Hybrid** | Provider default + Search on query intent |

---

## 2. Entity source matrix

| Entity type | Primary AI source | Search provider | Visibility service | Category | Permission |
|-------------|-------------------|-----------------|------------------|----------|------------|
| **Files** | `recent_files` provider | drive | `searchAccessibleDriveFiles` | **D** | file:read dual |
| **Folders** | — (no AI provider) | drive | `searchAccessibleDriveFolders` | **B** | file:read dual |
| **Chat messages** | `recent_conversations` | chat | `searchAccessibleChat` | **D** | chat:message.read |
| **Conversations** | chat providers | chat | participant scope | **C** | chat:conversation.read |
| **Calendar events** | `upcoming` / `today` | calendar | `searchEvents` | **D** | calendar:event.read |
| **Tasks** | `upcoming` / `overdue` / `overview` | todo | `searchAccessibleTasks` | **D** | todo:task.read |
| **Note pages** | `recent_notes` / `pinned` | notes | `searchAccessiblePages` | **D** | notes:page.read |
| **V_Links** | vlink pipeline + provider | vlink | `searchVLinksForUser` | **D** | vlink:read |
| **Place listings** | place providers + `search_places` tool | place | `searchListingsForUser` | **D** | place:listing.read |
| **Dashboards** | dashboard providers | dashboard | dashboard Prisma | **C** | dashboard:read |
| **Users (member)** | — | member | member visibility | **B** | profile read |
| **HR employees** | hr providers | — | hr services | **C** | hr:employee.read |
| **Shifts/schedules** | scheduling providers | — | scheduling services | **C** | scheduling:shift.read |
| **Workforce broadcasts** | workforce providers | — | WC services | **C** | workforce:communication.read |
| **Notebook links** | notebook grounded context | partial | link hydration | **C** | per target module |
| **Activity records** | activity feed | — | platformActivityQuery | **A** | feed scope |
| **User memory facts** | MemoryRetrievalService | — | userMemoryFact | **A** | user |
| **User preferences** | PreferenceResolver | — | settings | **A** | user |
| **AI session context** | `/api/ai/context` CRUD | — | userAIContext | **A** | user |
| **Graph relationships** | graph bundle service | — | read adapters | **C** | adapter PE |
| **Tags** | on-entity in providers | tag index (future) | tagIndexService | **D** | facet only |
| **Domain events** | signal only | — | — | **A** | no payload inject |
| **Platform entities** | manifest metadata | — | registry | **A** | resolver |
| **Runtime diagnostics** | pipeline trace | — | admin | **A** | admin |
| **Location** | geolocation | — | IP service | **A** | N/A |

---

## 3. Source assembly order (twin)

Per [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md):

```
1. UserMemoryFact          (A)
2. Persisted V_Link        (D)
3. Module AI providers     (C/D)
4. Operational links       (C)
5. Search / index hydrate  (B) ← NOT WIRED
6. Domain event signal     (A)
7. Entity linking inference (ephemeral)
```

---

## 4. Context provider registry map

| Provider id | Module | Endpoint | Pipeline sources |
|-------------|--------|----------|------------------|
| `drive.recent_files` | drive | `/api/drive/ai/context/recent` | `drive_files` |
| `drive.storage_overview` | drive | `/api/drive/ai/context/storage` | `module_context` |
| `chat.recent_conversations` | chat | `/api/chat/ai/context/recent` | `recent_conversations` |
| `chat.unread_messages` | chat | `/api/chat/ai/context/unread` | `module_context` |
| `calendar.upcoming_events` | calendar | `/api/calendar/ai/context/upcoming` | `calendar` |
| `calendar.today_events` | calendar | `/api/calendar/ai/context/today` | `calendar` |
| `todo.task_overview` | todo | `/api/todo/ai/context/overview` | `module_context` |
| `todo.upcoming_tasks` | todo | `/api/todo/ai/context/upcoming` | `module_context` |
| `todo.overdue_tasks` | todo | `/api/todo/ai/context/overdue` | `module_context` |
| `notes.recent_notes` | notes | `/api/notes/ai/context/recent` | — |
| `vlink.recent_vlinks` | vlink | `/api/vlinks/ai/context/recent` | `vlink` |
| `place.place_discoveries` | place | `/api/place/ai/context/discoveries` | `vssyl_place` |

*Full list: 35+ providers — see registerBuiltInModules.ts*

---

## 5. Inputs / outputs contract

| Source type | Typical inputs | Typical output shape |
|-------------|----------------|----------------------|
| Context provider | userId, dashboardId, businessId, query | `{ context, metadata }` |
| Grounding prepass | userMessage, catalog, scope | `moduleContextsPatch`, `contextRetrieved[]` |
| Memory | query, userId, token budget | `RetrievedMemoryFact[]` |
| V_Link pipeline | query signals, userId | containers + public codes |
| Graph bundle | query signals, tenant | edges + hydrated targets |
| Search (future) | query, filters.context | `SearchResult[]` |

---

## 6. Tenant context propagation

| Source | dashboardId | businessId | householdId |
|--------|:-----------:|:----------:|:-------------:|
| Context providers | query param | query param | partial |
| Grounding | input scope | input scope | input scope |
| Search (target) | filters.context | filters.context | filters.context |
| Memory | — | — | — |

**Gap:** AI orchestrator and Search use **compatible but separate** scope carriers — adapter must normalize.

---

**Last updated:** 2026-06-23
