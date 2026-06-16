# Business Operations Platform Services

**Phase:** Business Operations Phase 0D — Strategic Architecture Program  
**Last updated:** 2026-06-14  
**Constitution:** [BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md](./BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md)  
**Platform reference:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)

---

## Purpose

Define **platform-owned capabilities** that Business Operations domains **consume** but **must not own**. Model C requires these services to remain shared so independent modules stay independent.

---

## Platform service inventory

| Service | Role in BO | Current BO adoption | Must remain platform |
|---------|------------|---------------------|----------------------|
| **Notifications** | C2 Notifier — deliver domain events to users | HR partial (8 types); Chat yes; Scheduling **none**; Comms **none** | **Yes** |
| **Activity** | Normalized `emitModuleActivityEvent` envelope | **NOT PRESENT** in HR, Scheduling | **Yes** |
| **Realtime** | Socket.IO transport hub (`chatSocketService`) | Scheduling sync; Chat messages | **Yes** |
| **Policy Engine** | Authorization for module actions | **NOT PRESENT** in BO modules | **Yes** |
| **V-Link** | Cross-module entity linking | **NOT PRESENT** in HR, Scheduling | **Yes** |
| **Global Trash** | Unified soft-delete lifecycle | **FAIL** — local `deletedAt` only | **Yes** |
| **Audit** | Compliance and activity trail | HR `auditLog` partial; not module activity | **Yes** |
| **Search** | Cross-entity discovery | Platform | **Yes** |
| **AI Infrastructure** | Context registry, `ActionExecutor`, routing | HR + Scheduling registered | **Yes** |

---

## Per-service definition

### Notifications

| Aspect | Detail |
|--------|--------|
| **Classification** | C2 Notifier — [AUTOMATION_CONSUMER_BOUNDARY.md](../architecture/AUTOMATION_CONSUMER_BOUNDARY.md) |
| **Owns** | Persist, group, snooze, DND, in-app/email/push fan-out, Notification Center UX |
| **Does not own** | Message authoring, audience selection, campaign lifecycle, compliance ack |
| **BO contract** | Domains emit `[module]_[event]` types after authorized success |
| **Current gaps** | No `scheduling_*`; no `workforce_*`; HR manifest block missing in seed |
| **FALSE POSITIVE** | Notifications ≠ Workforce Communications |

### Activity

| Aspect | Detail |
|--------|--------|
| **Owns** | Normalized module activity envelope schema and fan-out |
| **Does not own** | Domain business logic or entity storage |
| **BO contract** | `authorize → execute → emit` on success only |
| **Current gaps** | HR and Scheduling do not emit — constitutional debt |

### Realtime

| Aspect | Detail |
|--------|--------|
| **Owns** | Socket transport, room membership, broadcast mechanics |
| **Does not own** | Domain event semantics, message content, campaign authoring |
| **BO usage** | Scheduling `schedule:*` for UI sync; Chat for messages |
| **FALSE POSITIVE** | Realtime events ≠ Workforce Communications |

### Policy Engine

| Aspect | Detail |
|--------|--------|
| **Owns** | Authorization decisions for registered module actions |
| **Does not own** | Domain data or custom ad-hoc middleware duplication |
| **BO contract** | Replace legacy RBAC middleware over time |
| **Current gaps** | HR and Scheduling use custom middleware only |

### V-Link

| Aspect | Detail |
|--------|--------|
| **Owns** | Cross-module link resolution and lifecycle |
| **Does not own** | Module entity storage |
| **Current gaps** | HR and Scheduling not integrated per platform doc |

### Global Trash

| Aspect | Detail |
|--------|--------|
| **Owns** | `trashedAt` soft delete, trash controller, restore/purge |
| **Does not own** | Module-specific hard delete semantics |
| **Current gaps** | HR `deletedAt`; Scheduling hard delete |

### Audit

| Aspect | Detail |
|--------|--------|
| **Owns** | Platform audit patterns, activity-derived compliance views |
| **Does not own** | Domain entity CRUD (modules emit activity) |
| **Current** | HR employee audit logs — partial, not normalized activity |

### Search

| Aspect | Detail |
|--------|--------|
| **Owns** | Indexing and discovery infrastructure |
| **Does not own** | Module source records |

### AI Infrastructure

| Aspect | Detail |
|--------|--------|
| **Owns** | Provider registry, action routing, cross-module AI shell |
| **Does not own** | Domain context content — modules register `ModuleAIContext` |
| **BO usage** | Per-module providers and executors |

---

## What must remain platform-owned

These capabilities **must not** be absorbed into a single Business Operations module (including a hypothetical unified "Workforce Operations" codebase):

1. **User authentication identity** (`User`, sessions, JWT)
2. **Notification delivery transport** (`NotificationService`, push/email pipes)
3. **Socket.IO transport layer** (`chatSocketService` hub)
4. **Cross-tenant authorization infrastructure** (Policy Engine core)
5. **Global activity envelope schema** (module interoperability contract)
6. **Global Trash API** and trash controller
7. **V-Link resolver infrastructure**
8. **Platform search index**

**Rationale:** Model C breaks if any BO module becomes the de facto platform for delivery, auth, or trash — other modules and third-party partners lose interoperable contracts.

---

## What should never become domain-owned

| Capability | Why |
|------------|-----|
| Notification SMTP/push providers | Security and deliverability centralization |
| Socket room infrastructure | Multi-module transport |
| PE policy store | Cross-module authorization |
| Activity log schema | Interoperability and analytics foundation |
| User account lifecycle | Platform scope beyond business |
| Org-chart identity SoT | Already org chart / platform — HR must not absorb |
| Chat message store as "workforce inbox" | Wrong product — collaboration ≠ coordination |

---

## Shared bridges (not platform services)

These are **integration contracts** between domains — not platform services:

| Bridge | Notes |
|--------|-------|
| `hrScheduleService` | HR-named calendar sync — ownership to be formalized (prerequisite) |
| `EmployeePosition` identity stack | Org chart domain data consumed by modules |
| Manager scope queries (`reportsToId`) | Org chart graph used by HR and Scheduling permissions |

Bridges need **documented APIs** — they should not be mistaken for platform services or merged into one module silently.

---

## BO module → platform service matrix (current)

| Module | Notif | Activity | Realtime | PE | V-Link | Trash | AI |
|--------|-------|----------|----------|-----|--------|-------|-----|
| HR | ⚠️ partial | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Scheduling | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ✅ |
| Workforce Comms | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Org chart | — | — | — | — | — | — | — |

**Target:** All BO modules align with platform capability matrix per constitutional framework.

---

## Document authority

Platform standards remain authoritative in `docs/architecture/`. This document is the **Business Operations consumption view** of platform services under Model C.
