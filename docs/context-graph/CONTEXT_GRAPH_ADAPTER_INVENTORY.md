# Context Graph — Adapter Inventory

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0B — Constitutional architecture  
**Date:** 2026-06-18  
**Status:** Readiness matrix — no implementation

**Legend:** ✅ Ready · ⚠️ Partial · ❌ Missing · 🔜 Planned (Phase 1+)

---

## Summary

| Adapter domain | Readiness | Entity types | Priority |
|----------------|-----------|--------------|----------|
| V_Link | ✅ | container + 18 attachments | P0 |
| File Hub (drive) | ✅ | file, folder | P0 |
| Calendar | ✅ | event | P0 |
| Chat | ⚠️ | conversation (thread deferred) | P1 |
| Todo | ✅ | task | P0 |
| Notes | ⚠️ | page (inline resolver) | P1 |
| Notebook | ⚠️ | page + NotebookLink edges | P1 |
| Place | ✅ | listing, meeting | P2 |
| HR | ✅ | 4 HR entity types | P2 |
| Scheduling | ✅ | schedule, shift, swap_request | P2 |
| Workforce Communications | ✅ | communication, campaign | P2 |
| Business Administration | ⚠️ | org + approval (no graph adapter) | P2 |
| Admin Portal | ⚠️ | config only — not entity graph | P3 |
| AI Memory | ⚠️ | adjacent — not edge adapter | P1 |
| Tags Index | ❌ | derived facet | P3 |

---

## 1. V_Link

| Field | Value |
|-------|-------|
| **Readiness** | ✅ **Ready** (association substrate) |
| **Entity types** | Container + 25 `VLinkEntityType` enum (18 active) |
| **Ownership** | Platform — `prisma/modules/platform/vlink.prisma` |
| **Permissions source** | `vlinkPermissionService`, `*VlinkAccessService` |
| **Existing services** | `vlinkService`, `vlinkEntityResolverService`, `vlinkPipelineContextService` |
| **Edge types** | `vlink.attachment`, `vlink.nest`, `vlink.member` |
| **Known gaps** | No federation orchestrator wrapper; NOTE partial; CHAT_THREAD deferred; no realtime |

---

## 2. File Hub (drive)

| Field | Value |
|-------|-------|
| **Readiness** | ✅ **Ready** |
| **Entity types** | `file`, `folder` |
| **Ownership** | Drive module — `prisma/modules/drive/files.prisma` |
| **Permissions source** | `driveVlinkAccessService`, `driveVisibilityService`, PE |
| **Existing services** | `driveVlinkAccessService`, `driveVlinkLifecycleService` |
| **Edge types** | `vlink.attachment`, `drive.containment`, `drive.permission` |
| **Known gaps** | Folder search partial; no dedicated graph adapter interface |

---

## 3. Calendar

| Field | Value |
|-------|-------|
| **Readiness** | ✅ **Ready** |
| **Entity types** | `event` |
| **Ownership** | Calendar module |
| **Permissions source** | `calendarVlinkAccessService`, calendar PE |
| **Existing services** | `calendarVlinkAccessService`, `calendarVlinkLifecycleService` |
| **Edge types** | `vlink.attachment`, `calendar.participation`, `calendar.membership` |
| **Known gaps** | No `listEdgesFrom` adapter; attendee edges via module provider only |

---

## 4. Chat

| Field | Value |
|-------|-------|
| **Readiness** | ⚠️ **Partial** |
| **Entity types** | `conversation` (✅); `CHAT_THREAD` (❌ deferred) |
| **Ownership** | Chat module |
| **Permissions source** | `chatVlinkAccessService`, socket membership assert |
| **Existing services** | `chatVlinkAccessService`, `chatVlinkLifecycleService` |
| **Edge types** | `vlink.attachment`, `chat.membership`, `chat.attachment` |
| **Known gaps** | Thread type undeclared; hub UI partial; message nodes lightweight only |

---

## 5. Tasks / Todo

| Field | Value |
|-------|-------|
| **Readiness** | ✅ **Ready** |
| **Entity types** | `task` |
| **Ownership** | Todo module |
| **Permissions source** | `todoVlinkAccessService`, `todoVisibilityService` |
| **Existing services** | `todoVlinkAccessService`, `todoVlinkLifecycleService` |
| **Edge types** | `vlink.attachment`, `todo.dependency`, `todo.file_link`, `todo.event_link` |
| **Known gaps** | Operational links not in federation orchestrator; module-local tags |

---

## 6. Notes

| Field | Value |
|-------|-------|
| **Readiness** | ⚠️ **Partial** |
| **Entity types** | `page` (notes) |
| **Ownership** | Notes module |
| **Permissions source** | Inline resolver in `vlinkEntityResolverService` — **no dedicated service** |
| **Existing services** | Resolver case only |
| **Edge types** | `vlink.attachment` |
| **Known gaps** | **CG-F-002** — no `notesVlinkAccessService`; no lifecycle unlink; manifest not declared |

---

## 7. Notebook

| Field | Value |
|-------|-------|
| **Readiness** | ⚠️ **Partial** |
| **Entity types** | `page` (notebook) |
| **Ownership** | Notebook module — `NotebookLink` |
| **Permissions source** | `notebookLinkService` + target module hydrate |
| **Existing services** | Notebook link service (operational) |
| **Edge types** | `notebook.link` |
| **Known gaps** | No Context Graph adapter registration; shares NOTE type alias |

---

## 8. Place

| Field | Value |
|-------|-------|
| **Readiness** | ✅ **Ready** |
| **Entity types** | `listing`, `meeting` |
| **Ownership** | Place module |
| **Permissions source** | `placeVlinkAccessService` |
| **Existing services** | `placeVlinkAccessService`, `placeVlinkLifecycleService` |
| **Edge types** | `vlink.attachment`, `place.follow` |
| **Known gaps** | Search partial; listing tags module-local |

---

## 9. HR

| Field | Value |
|-------|-------|
| **Readiness** | ✅ **Ready** (V_Link path) |
| **Entity types** | `employee_profile`, `time_off_request`, `attendance_exception`, `onboarding_journey` |
| **Ownership** | HR module |
| **Permissions source** | `hrVlinkAccessService`, HR PE |
| **Existing services** | `hrVlinkAccessService`, `hrVlinkLifecycleService` |
| **Edge types** | `vlink.attachment` |
| **Known gaps** | No HR operational link adapter for graph; BO boundary docs only |

---

## 10. Scheduling

| Field | Value |
|-------|-------|
| **Readiness** | ✅ **Ready** |
| **Entity types** | `schedule`, `shift`, `swap_request` |
| **Ownership** | Scheduling module |
| **Permissions source** | `schedulingVlinkAccessService` |
| **Existing services** | `schedulingVlinkAccessService`, `schedulingVlinkLifecycleService` |
| **Edge types** | `vlink.attachment` |
| **Known gaps** | No shift dependency graph adapter |

---

## 11. Workforce Communications

| Field | Value |
|-------|-------|
| **Readiness** | ✅ **Ready** |
| **Entity types** | `communication`, `campaign` |
| **Ownership** | Workforce comms module |
| **Permissions source** | `workforceVlinkAccessService` |
| **Existing services** | `workforceVlinkAccessService`, `workforceVlinkLifecycleService` |
| **Edge types** | `vlink.attachment` |
| **Known gaps** | Audience resolution not exposed as graph edges |

---

## 12. Business Administration

| Field | Value |
|-------|-------|
| **Readiness** | ⚠️ **Partial** |
| **Entity types** | `position`, `employee_position`, `organizational_tier`, `approval_hierarchy` |
| **Ownership** | Business module / BA platform (L3 certified) |
| **Permissions source** | Org chart PE, business member checks, `approvalHierarchyService` |
| **Existing services** | Org chart services, `approvalHierarchyService` — **no graph adapters** |
| **Edge types** | `business.employee_position`, `business.approval_hierarchy` (planned) |
| **Known gaps** | **CG-F-003** — no read adapters; org chart ≠ V_Link; approval orthogonal |

---

## 13. Admin Portal

| Field | Value |
|-------|-------|
| **Readiness** | ⚠️ **Partial** (config consumer — not entity graph) |
| **Entity types** | Pipeline catalog, context source config |
| **Ownership** | Admin Portal (L3 certified) |
| **Permissions source** | Admin role matrix |
| **Existing services** | Pipeline catalog, grounding rules reconcile |
| **Edge types** | N/A — governs **enablement** of `vlink` source |
| **Known gaps** | No graph diagnostic UI; impersonation policy for admin projection TBD |

---

## 14. AI Memory

| Field | Value |
|-------|-------|
| **Readiness** | ⚠️ **Adjacent** — not graph edge adapter |
| **Entity types** | `UserMemoryFact`, `UserAIContext` |
| **Ownership** | AI module |
| **Permissions source** | User scope + `MemoryRetrievalService` |
| **Existing services** | `MemoryRetrievalService`, pipeline memory prepass |
| **Edge types** | **None** — memory is precedence layer 1 |
| **Known gaps** | **CG-F-004** — no bundle provenance for memory; no formal AI bundle format |

---

## 15. Tags Index

| Field | Value |
|-------|-------|
| **Readiness** | ❌ **Missing** |
| **Entity types** | N/A — returns entity descriptors with tag metadata |
| **Ownership** | Platform derived (future) — **not SoR** |
| **Permissions source** | Module PE on hydrate of matched entities |
| **Existing services** | None |
| **Edge types** | **None** — tags are node metadata |
| **Known gaps** | **CG-F-005** — no index schema, no facet API, no event ingestion |

---

## 16. Adapter implementation priority (Phase 1)

| Priority | Adapters | Rationale |
|----------|----------|-----------|
| **P0** | V_Link orchestrator wrapper, drive, calendar, todo | Highest AI + hub traffic |
| **P1** | Notes (remediate), notebook links, chat, AI memory provenance | Close resolver debt + operational edges |
| **P2** | Place, HR, scheduling, workforce, BA org/approval | Business module completeness |
| **P3** | Tags index, admin diagnostic | Derived + admin surfaces |

---

## 17. Adapter contract compliance checklist

- [ ] Implements `ContextGraphModuleAdapter` interface (Phase 1A)
- [ ] No cross-module Prisma joins
- [ ] Batch hydrate ≤ 25 refs
- [ ] Returns `restrictedPlaceholder` on deny
- [ ] Registered in adapter registry
- [ ] Integration tests for PE boundaries
- [ ] Documented in PLATFORM_ENTITY_MODEL truth table

---

**Last updated:** 2026-06-18
