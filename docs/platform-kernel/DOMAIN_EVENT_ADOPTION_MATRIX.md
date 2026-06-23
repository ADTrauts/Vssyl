# Domain Event Adoption Matrix

**Program:** Platform Kernel — Wave 2 Package 2  
**Date:** 2026-06-23  
**Status:** Adoption audit — **governance only**

**Registry:** 180 types in `server/src/events/domainEventRegistry.ts`  
**Module facades:** 13 `*DomainEventService.ts` files + platform `domainEventEmitters.ts` + `vlinkDomainEventEmitters.ts`

---

## 1. Module adoption summary

| Module | Facade | Emission | Subscriber consumption | Gap severity |
|--------|:------:|:--------:|:----------------------:|:------------:|
| **Chat** | ✅ `chatDomainEventService` | ✅ Strong | AI (message), socket, webhooks | Low |
| **Calendar** | ✅ `calendarDomainEventService` | ✅ Strong | AI (event created), dashboard bootstrap | Low |
| **Drive** | ⚡ Platform emitters | ✅ Strong | Notification (share), AI (upload) | Low — document delegation |
| **Dashboard** | ✅ `dashboardDomainEventService` | ✅ Strong | Bootstrap subscribers | Low |
| **Account Platform** | ✅ billing + entitlement + settings emit | ✅ Partial | Webhooks, module install notifications | Low |
| **Place** | ✅ `placeDomainEventService` | ✅ Broad catalog | Webhooks; no AI/notification mapping | Medium — consumer gap |
| **Todo** | ✅ `todoDomainEventService` | ✅ Strong | Webhooks | Low |
| **Notebook** | ✅ `notebookLinkDomainEventService` | ✅ Moderate | Webhooks | Low |
| **HR** | ❌ **Missing** | ❌ Activity only | None | **Critical** |
| **Scheduling** | ✅ `schedulingDomainEventService` | ✅ Strong | Webhooks | Low — dual activity+DE |
| **Analytics** | ❌ Intentional | ❌ Activity only | None | Low — by design |
| **Admin Portal** | N/A (platform admin) | ❌ No emits | Consumes admin metrics | N/A |

**Additional domain facades (Business Ops):** `workforceDomainEventService`, `orgChartDomainEventService`, `approvalHierarchyDomainEventService`, `notesDomainEventService`.

---

## 2. Per-module detail

### Chat

| Item | Status |
|------|--------|
| Facade | `server/src/services/chatDomainEventService.ts` |
| Emit paths | `chatMessageService`, `chatConversationService`, `chatTrashService` |
| Activity parallel | `chatActivityService.ts` — feed-visible actions |
| Domain events | Conversations, messages, reactions, read receipts |
| Tests | `chatDomainEvents.test.ts`, service tests |
| Gap | Notification mapping for chat events (future DE-3) |

### Calendar

| Item | Status |
|------|--------|
| Facade | `calendarDomainEventService.ts` |
| Emit paths | `calendarEventService`, `calendarTrashService`, `calendarReminderService`, attendees |
| Activity parallel | `calendarActivityService.ts` |
| AI consumption | `CALENDAR_EVENT_CREATED` only |
| Gap | RSVP/reminder events not in AI consumer (acceptable) |

### Drive

| Item | Status |
|------|--------|
| Facade | **Delegated** — `domainEventEmitters.ts` called from `driveUploadService`, `driveDeleteService`, `fileController`, `folderController`, `driveFileShareService` |
| Recommendation | Add `driveDomainEventService.ts` thin wrapper in DE-2 for symmetry (optional) |
| Activity parallel | `driveDeleteService`, uploads, share — dual emit where required |
| Gap | No module-named facade file (organizational, not functional) |

### Dashboard

| Item | Status |
|------|--------|
| Facade | `dashboardDomainEventService.ts` |
| Key events | `DASHBOARD_TAB_CREATED` → bootstrap subscribers |
| Activity parallel | `dashboardActivityService.ts` |
| Gap | None material for L2 |

### Account Platform

| Item | Status |
|------|--------|
| Facades | `billingDomainEventService`, `entitlementDomainEventService`, `settingsActivityService` (inline emit) |
| Activity parallel | `billingActivityService`, `entitlementActivityService`, `identityActivityService` |
| Gap | Settings paths emit domain events — verify all preference keys covered in DE-2 audit |

### Place

| Item | Status |
|------|--------|
| Facade | `place/placeDomainEventService.ts` |
| Catalog | Large registry slice (listings, connections, meetings, community) |
| Activity parallel | `placeActivityService.ts` — heavy dual emission |
| Gap | No notification/AI mapping for place lifecycle (consumer expansion DE-3) |

### Todo

| Item | Status |
|------|--------|
| Facade | `todoDomainEventService.ts` |
| Tests | `todoDomainEvents.test.ts` |
| Activity parallel | `todoActivityService.ts` |
| Gap | Low |

### Notebook

| Item | Status |
|------|--------|
| Facade | `notebook/notebookLinkDomainEventService.ts` |
| Activity parallel | `notebookLinkActivityService.ts` |
| Gap | Low |

### HR ⚠️

| Item | Status |
|------|--------|
| Facade | **None** — `hrDomainEventService.ts` missing |
| Emission | **`emitModuleActivityEvent` only** via `hrActivityService.ts` |
| Registry | HR-related types may exist in registry — emit sites unverified |
| Impact | BO L3 CwF workforce lifecycle incomplete cross-cutting fan-out |
| **DE-2 action** | Create `hrDomainEventService`; wire critical mutations; add tests |

### Scheduling

| Item | Status |
|------|--------|
| Facade | `schedulingDomainEventService.ts` |
| Activity parallel | `schedulingActivityService.ts` — **both paths active** |
| Tests | `schedulingDomainEvents.test.ts` |
| Gap | None critical |

### Analytics

| Item | Status |
|------|--------|
| Facade | None |
| Emission | `analyticsActivityService.ts` — view telemetry only |
| Rationale | Analytics views are **module activity**, not cross-cutting domain facts |
| **Disposition** | **Exempt** from domain event facade requirement |

### Admin Portal

| Item | Status |
|------|--------|
| Role | Platform admin **consumer** — signup metrics, dashboard stats |
| Emission | None (not a product module) |
| **Disposition** | **Exempt**

---

## 3. Activity without domain events

| Module / service | Activity emission | Domain events | Disposition |
|------------------|-------------------|---------------|-------------|
| **HR** (`hrActivityService`) | All HR mutations | None | **Violation — DE-2** |
| **Analytics** (`analyticsActivityService`) | View events | None | **Exempt** |
| **Business** (`businessActivityService`) | Member/profile updates | Partial via controllers | **Audit** — align activity-only paths |
| **Identity** (`identityActivityService`) | Account identity actions | Via billing/entitlement elsewhere | **Audit** |
| **Workforce** (`workforceActivityService`) | Comms activity | `workforceDomainEventService` exists | OK — dual path |
| **Scheduling** (`schedulingActivityService`) | Manager actions | `schedulingDomainEventService` | OK — dual path |

---

## 4. Registry vs adoption gap

| Signal | Estimate | Risk |
|--------|----------|------|
| Registry types | 180 | — |
| Types with module tests | ~40–60 (spot-check) | Medium |
| Types with verified production emit | Subset — **full audit required DE-2** | High |
| V_Link types | 31 via `vlinkDomainEventEmitters.ts` | Owned by V_Link program |

**DE-2 deliverable:** CI or script comparing `DOMAIN_EVENT_TYPES` values to static emit-site references (registry adoption report).

---

## 5. Cross-domain consumer map

| Consumer | Modules touched | Maturity |
|----------|-----------------|----------|
| Activity log mirror | All emitted | L2 |
| Socket (actor) | All emitted | L2 |
| Notifications | Drive, Business, Platform | L1–L2 |
| AI learning | Drive, Chat, Calendar, Platform modules | L2 stub |
| Webhooks | Configurable — all types eligible | L2 |
| Dashboard bootstrap | Dashboard + Calendar | L2 |
| Workspace seed | Dashboard + Business | L2 |
| Search | **None** (stub) | L0 |
| Workflow | **None** (stub) | L0 |

---

## 6. Adoption priorities (DE-2)

| Priority | Module | Action |
|----------|--------|--------|
| **P0** | HR | Create facade + wire critical lifecycle emits |
| **P1** | Drive | Optional `driveDomainEventService` wrapper |
| **P1** | Business | Close activity-only paths without domain emit |
| **P2** | Place | Consumer mapping expansion (with DE-3) |
| **P3** | Registry | Orphan type audit + deprecate unused contracts |

---

**Last updated:** 2026-06-23
