# Context Graph — Current State Inventory

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0A — Discovery and reality assessment  
**Date:** 2026-06-18  
**Status:** Discovery artifact — no implementation

---

## Scope

Quantified inventory of **V_Link** and adjacent relationship infrastructure as the starting point for Context Graph architecture. Counts verified against repository state on 2026-06-18.

**Authoritative references:**

- [V_LINK.md](../architecture/V_LINK.md)
- [PLATFORM_ENTITY_MODEL.md](../architecture/PLATFORM_ENTITY_MODEL.md)
- [RELATIONSHIP_FRAMEWORK_INDEX.md](../architecture/RELATIONSHIP_FRAMEWORK_INDEX.md)
- [memory-bank/vlinkProductContext.md](../../memory-bank/vlinkProductContext.md)

---

## 1. V_Link Prisma layer

| Category | Count | Location |
|----------|------:|----------|
| **Models** | **5** | `prisma/modules/platform/vlink.prisma` |
| **Enums** | **8** | Same file |
| **Migrations (vlink-specific)** | **4** | `prisma/migrations/*vlink*` |

### Models

| Model | Role |
|-------|------|
| `VLink` | Scoped, nestable association **container** |
| `VLinkMember` | Container membership (OWNER / EDITOR / VIEWER) |
| `VLinkEntity` | Polymorphic attachment edge (container → module entity) |
| `VLinkSuggestion` | AI/system suggested links (approval-gated) |
| `VLinkActivity` | Container-scoped activity log |

### Enums

`VLinkScope`, `VLinkStatus`, `VLinkMemberRole`, `VLinkEntityType` (25 values), `VLinkEntityRelationType`, `VLinkEntitySource`, `VLinkSuggestionStatus`, `VLinkSuggestionSource`

---

## 2. V_Link API surface

| Category | Count | Location |
|----------|------:|----------|
| **Route file** | **1** | `server/src/routes/vlinks.ts` |
| **HTTP endpoints** | **23** | `/api/vlinks/*` |
| **Controller handlers** | **22** | `server/src/controllers/vlinkController.ts` |
| **AI context handler** | **1** | `server/src/controllers/vlinkAIContextController.ts` |
| **Client API module** | **1** | `web/src/api/vlinks.ts` |

### Endpoint inventory

| Method | Path | Handler |
|--------|------|---------|
| GET | `/search` | Search vlinks |
| GET | `/suggestions` | List suggestions |
| POST | `/suggestions` | Create suggestion |
| POST | `/suggestions/:id/accept` | Accept suggestion |
| POST | `/suggestions/:id/reject` | Reject suggestion |
| GET | `/entity/:entityType/:entityId` | Entity → vlinks |
| GET | `/ai/context/recent` | AI context provider |
| GET | `/` | List vlinks |
| POST | `/` | Create vlink |
| PATCH | `/:id` | Update vlink |
| DELETE | `/:id` | Delete vlink |
| POST | `/:id/archive` | Archive |
| POST | `/:id/restore` | Restore |
| POST | `/:id/ownership/transfer` | Transfer ownership |
| GET | `/:id/members` | List members |
| POST | `/:id/members` | Invite member |
| PATCH | `/:id/members/:memberId` | Update member |
| DELETE | `/:id/members/:memberId` | Remove member |
| GET | `/:id/entities` | List attachments |
| POST | `/:id/entities` | Link entity |
| DELETE | `/:id/entities/:entityLinkId` | Unlink entity |
| GET | `/:id/activity` | List activity |
| GET | `/:idOrCode` | Get by id or public code |

---

## 3. V_Link services

| Category | Count | Notes |
|----------|------:|-------|
| **Core platform services** | **4** | Permission, resolver, CRUD, public code |
| **Module access services** | **8** | drive, calendar, chat, todo, place, hr, scheduling, workforce |
| **Module lifecycle services** | **8** | Soft-unlink on permanent delete |
| **Total production services** | **20** | Excludes tests |
| **Test files touching vlink** | **61** | `server/src/**` test files |

### Core platform services

| Service | Path |
|---------|------|
| `vlinkService` | `server/src/services/vlinkService.ts` |
| `vlinkPermissionService` | `server/src/services/vlinkPermissionService.ts` |
| `vlinkEntityResolverService` | `server/src/services/vlinkEntityResolverService.ts` |
| `vlinkPublicCodeService` | `server/src/services/vlinkPublicCodeService.ts` |

### Module integration services

| Module | Access | Lifecycle |
|--------|--------|-----------|
| drive | `driveVlinkAccessService` | `driveVlinkLifecycleService` |
| calendar | `calendarVlinkAccessService` | `calendarVlinkLifecycleService` |
| chat | `chatVlinkAccessService` | `chatVlinkLifecycleService` |
| todo | `todoVlinkAccessService` | `todoVlinkLifecycleService` |
| place | `place/placeVlinkAccessService` | `place/placeVlinkLifecycleService` |
| hr | `hrVlinkAccessService` | `hrVlinkLifecycleService` |
| scheduling | `schedulingVlinkAccessService` | `schedulingVlinkLifecycleService` |
| workforce_comms | `workforceVlinkAccessService` | `workforceVlinkLifecycleService` |

---

## 4. V_Link UI components

| Category | Count | Location |
|----------|------:|----------|
| **Dedicated vlink components** | **7** | `web/src/components/vlink/` |
| **App routes / pages** | **3** | `/vlink`, `/vlink/[id]`, business workspace mount |
| **Cross-module integration surfaces** | **~15** | Drive, Calendar, org-chart, workforce, layout, registry |

### Dedicated components

`VLinkModule`, `VLinkDetailView`, `VLinkCard`, `VLinkConnectModal`, `VLinkShareModal`, `VLinkIndicator`, `VLinkSidebarButton`

### Supporting client infrastructure

`web/src/contexts/VLinkDragContext.tsx`, `web/src/app/vlink/layout.tsx`, `web/src/app/business/[id]/workspace/vlink/page.tsx`

---

## 5. Domain events

| Category | Count | Location |
|----------|------:|----------|
| **Event types** | **14** | `server/src/events/domainEventRegistry.ts` |
| **Emitter functions** | **14** | `server/src/events/vlinkDomainEventEmitters.ts` |

| Event type | Semantic |
|------------|----------|
| `vlink.created` | Container created |
| `vlink.updated` | Metadata updated |
| `vlink.archived` | Archived |
| `vlink.deleted` | Soft deleted |
| `vlink.restored` | Restored from archive |
| `vlink.member.added` | Member invited |
| `vlink.member.updated` | Role changed |
| `vlink.member.removed` | Member removed |
| `vlink.ownership.transferred` | Owner changed |
| `vlink.entity.linked` | Entity attached |
| `vlink.entity.unlinked` | Entity detached |
| `vlink.suggestion.created` | AI/system suggestion |
| `vlink.suggestion.accepted` | Suggestion approved |
| `vlink.suggestion.rejected` | Suggestion rejected |

---

## 6. Activity integration

| Category | Count | Mechanism |
|----------|------:|-----------|
| **Dedicated activity model** | **1** | `VLinkActivity` (container-scoped) |
| **Activity API** | **1** | `GET /api/vlinks/:id/activity` |
| **Module activity feed integration** | **0** | V_Link does not emit normalized `emitModuleActivityEvent` rows today |

V_Link activity is **container-local** (`vlink_activities` table), not federated into the platform module activity envelope.

---

## 7. AI integration

| Category | Count | Location |
|----------|------:|----------|
| **Pipeline context service** | **1** | `server/src/ai/context/vlinkPipelineContextService.ts` |
| **Entity linking merge** | **1** | `server/src/ai/context/entityLinking.ts` |
| **Built-in module registration** | **1** | `registerBuiltInModules.ts` — module id `vlink` |
| **Context providers** | **1** | `recent_vlinks` → `/api/vlinks/ai/context/recent` |
| **Pipeline catalog source** | **1** | id `vlink` — "V_Link Relationships" |
| **Dedicated AI tests** | **6** | Pipeline + entity linking test files |

### AI pipeline position

Per [AI_PLATFORM_OVERVIEW.md](../architecture/AI_PLATFORM_OVERVIEW.md): V_Link grounding runs **after** module context fetch, **before** entity linking merge and assembly.

---

## 8. Realtime integration

| Category | Count | Finding |
|----------|------:|---------|
| **V_Link-specific WebSocket events** | **0** | No matches in `chatSocketService` or socket layer |
| **V_Link push refresh** | **0** | Pull-based API model |
| **Domain event consumers (realtime fan-out)** | **0** | Events emitted; no vlink index/cache invalidation consumer |

**Assessment:** Realtime is **not** a first-class V_Link capability today. Users refresh via HTTP; modules with their own realtime (chat) are independent.

---

## 9. Platform entity registry

| Category | Count | Location |
|----------|------:|----------|
| **Registered modules** | **10** | `server/src/startup/registerPlatformEntities.ts` |
| **Registered entity type keys** | **17** | Across drive, chat, calendar, todo, notes, notebook, place, scheduling, hr, workforce_comms |

---

## 10. VLinkEntityType coverage

| Category | Count |
|----------|------:|
| **Enum values** | **25** |
| **Resolver implemented** | **~18** |
| **Lifecycle unlink implemented** | **~16** |
| **Manifest + hub UI aligned** | **~10** |
| **Placeholder / deferred** | **7** |

### Resolver status matrix

| VLinkEntityType | Resolver | Lifecycle |
|-----------------|----------|-----------|
| FILE, FOLDER | ✅ | ✅ |
| CALENDAR_EVENT | ✅ | ✅ |
| CHAT_CONVERSATION | ✅ | ✅ |
| TASK, TODO | ✅ | ✅ |
| PLACE_LISTING, PLACE_MEETING | ✅ | ✅ |
| SCHEDULE, SCHEDULE_SHIFT, SHIFT_SWAP_REQUEST | ✅ | ✅ |
| HR_* (4 types) | ✅ | ✅ |
| WORKFORCE_* (2 types) | ✅ | ✅ |
| NOTE | ⚠️ inline | ❌ |
| CHAT_THREAD | ❌ deferred | partial |
| DASHBOARD, WIDGET, USER, BUSINESS, HOUSEHOLD, MODULE_ENTITY | ❌ placeholder | — |

---

## 11. Adjacent relationship stores (not V_Link)

| Store | Models | Class | Cross-module |
|-------|--------|-------|--------------|
| `NotebookLink` | 1 | Operational association | ✅ |
| `TaskFileLink`, `TaskEventLink`, `TaskDependency` | 3 | Module operational | Partial |
| `FilePermission`, `FolderPermission` | 2 | Access grant | Module |
| `ManagerApprovalHierarchy` | 1 | Hierarchy (BA platform) | Business |
| Org chart (`EmployeePosition`, etc.) | 7 | Hierarchy / membership | Business |
| `UserMemoryFact`, `UserAIContext` | 2 | AI context | User-scoped |
| Module-local `tags[]` | ~6 modules | Tag metadata | Module-local |

---

## 12. Graph candidate node inventory

### Tier A — V_Link attachable (enum-defined)

**25** `VLinkEntityType` values (18 production-active, 7 deferred/placeholder).

### Tier B — Platform registry (linkable descriptors)

**17** registered keys: `file`, `folder`, `conversation`, `event`, `task`, `page` (×2 modules), `listing`, `meeting`, `schedule`, `shift`, `swap_request`, `employee_profile`, `time_off_request`, `attendance_exception`, `onboarding_journey`, `communication`, `campaign`.

### Tier C — Relationship-relevant entities (not yet V_Link types)

| Domain | Candidate types | Est. count |
|--------|-----------------|----------:|
| Chat | message, participant | 2 |
| Drive | permission grant | 1 |
| Todo | project, watcher, comment | 3 |
| Calendar | calendar, attendee, reminder | 3 |
| Business / org | employee, position, department, tier, permission set | 5 |
| Business admin | approval hierarchy edge | 1 |
| AI | memory fact, AI context row, conversation history | 3 |
| Place | follow, community member, place node | 3 |
| Notebook | notebook link endpoints (page types) | 1 |
| Platform | user, business, household, dashboard, widget | 5 |
| Automation | workflow definition, execution | 2 |

**Tier C estimate:** **~29** additional node categories.

### Total candidate node types today

| Tier | Count |
|------|------:|
| A (VLinkEntityType enum) | 25 |
| C (non-enum relationship entities) | ~29 |
| **Distinct graph-relevant categories** | **~45–50** |

*Note: Tier B is largely a subset of Tier A normalized keys; not double-counted in total.*

---

## 13. Summary counts

| Dimension | Count |
|-----------|------:|
| Prisma models (V_Link) | 5 |
| API endpoints | 23 |
| Production services | 20 |
| UI components (dedicated) | 7 |
| Domain event types | 14 |
| Activity integrations | 1 (container-local) |
| AI integration points | 4 (service, linking, provider, catalog) |
| Realtime integrations | 0 (vlink-specific) |
| Graph candidate node types | ~45–50 |
| Test files referencing vlink | 61 |

---

**Last updated:** 2026-06-18
