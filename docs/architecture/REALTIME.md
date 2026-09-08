# Realtime

**Program:** Platform Participation Reconciliation — Phase 3B  
**Date:** 2026-09-08  
**Status:** Active — canonical architecture owner for realtime **semantics and participation**  
**Owner:** Platform architecture  
**Source of Truth for:** Realtime delivery semantics; application `realtime` capability participation contract; distinction between transport ownership, transport usage, and certified claims  
**Not Source of Truth for:** Domain mutation ownership; Chat messaging product rules; domain events bus; presence product intent (see Memory Bank)

> **This document is not a runtime subsystem.** It does not replace `chatSocketService`, invent a new event bus, or become a state store. It defines architecture semantics so applications can participate safely.

**Constitutional companions:** [`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §19 · Pattern 14 in [`../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)  
**Composition:** [`APPLICATION_PARTICIPATION_COMPOSITION.md`](./APPLICATION_PARTICIPATION_COMPOSITION.md)  
**Product language:** Realtime = near-immediate delivery of state changes; transport/update behavior — not SoR ([Product Definition](../product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md))

---

## Purpose

Define what “realtime” means in Vssyl architecture, who owns which layer, and what an application must satisfy to claim `capabilities.realtime: true`.

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Semantics of near-immediate delivery | Implementing a new transport |
| Transport vs participation vs capability claim | Changing Chat or Scheduling code |
| Certified realtime participation contract | Making Socket.IO permanent product identity |
| Failure isolation from domain SoR | Presence product UX (Memory Bank) |

---

## Architecture

### A. What realtime is

**Realtime** is near-immediate delivery of state or event **projections** to authorized clients after authoritative domain state changes (or for ephemeral UX signals such as typing).

Realtime is **transport / update behavior only**. It is **never** a system of record. Clients must not treat a socket payload as authority to mutate domain state.

### B. Layered ownership (do not collapse)

| Layer | Meaning | Current reality |
|-------|---------|-----------------|
| **Platform architecture owner** | This document — semantics and participation contract | Canonical as of Phase 3B |
| **Current transport implementation owner** | Chat Socket.IO hub (`chatSocketService` and related wiring) | Implementation host for shared WebSocket transport today |
| **Transport consumer** | Any application/service that publishes or subscribes via the shared hub | e.g. File Hub, Calendar, Scheduling schedule events |
| **Application realtime adapter** | Module-owned fan-out helper that maps domain mutations → scoped transport events | e.g. `driveRealtimeService`, `chatRealtimeService`, `calendarRealtimeService` |
| **Certified capability claim** | Manifest `capabilities.realtime: true` | Means conformance with §D below |

**Chat owns the current Socket.IO hub implementation ≠ Chat owns every module’s domain realtime semantics ≠ every socket user claims `realtime`.**

### C. Transport usage without a claim

An application **MAY** use the shared realtime transport without claiming `realtime: true`.

Using transport means live delivery is attempted for some events. It does **not** mean the module has completed certified realtime participation (adapter boundaries, naming, audience safety, certification evidence).

**Canonical example — Scheduling:** may emit schedule-related events on the shared Chat hub while **intentionally omitting** `capabilities.realtime` until a certified scheduling realtime adapter exists. **Do not change Scheduling manifests or behavior in Phase 3B.**

### D. Application realtime participation (`realtime: true`)

Grounded in File Hub / Chat patterns and Pattern 14. Claiming `realtime: true` means the application conforms to:

1. **Authoritative mutation first** — domain state changes through canonical services (authorize → execute → persist) before realtime publication of that change.
2. **Publication follows success** — realtime fan-out occurs after successful authoritative state change (ephemeral signals such as typing are exempt from “mutation first”).
3. **Tenant / context scope preserved** — events carry and respect `userId` / `businessId` / `dashboardId` (as applicable); no cross-tenant fan-out.
4. **Authorized audience** — room join and emit targets are membership-/permission-proven; transport participation does not grant content access.
5. **Module-owned adapter** — a dedicated realtime adapter (or equivalent clear boundary) owns event naming and fan-out; controllers/sockets stay thin.
6. **Projection, not mutation** — clients receive updates/projections; receiving an event is not authority to write the SoR.
7. **Delivery failure isolation** — failed or delayed realtime delivery does **not** invalidate successful domain state.
8. **No mutation authority from transport** — socket paths that mutate must still delegate to canonical services with AuthZ (Chat pattern).

Do not invent requirements beyond these semantics unless a module’s own certification checklist adds module-specific constraints.

### E. Transport replacement

Socket.IO and Chat-as-hub are **current implementation choices**, not permanent product identity. If transport infrastructure changes, application participation semantics in §D remain the contract; adapters rebind to the new transport without redefining domain ownership.

### F. Relationship to other contracts

| Concern | Owner |
|---------|-------|
| Domain events (cross-cutting bus) | [`DOMAIN_EVENTS.md`](./DOMAIN_EVENTS.md) — distinct from realtime fan-out |
| Module activity | Platform Standards / activity model |
| Notifications | Notification guide — attention, not live sync |
| Capability claim truthfulness | Platform Standards §19 + Pattern 14 |

---

## Responsibilities

| Layer | Owner | Must / must not |
|-------|-------|-----------------|
| Architecture semantics | This document | Must define claim vs usage; must not own domain data |
| Shared hub (today) | Chat / `chatSocketService` | Must verify membership before join; must not become every module’s SoR |
| Module adapters | Owning application | Must preserve AuthZ/tenant scope; must not mutate via transport alone |
| Capability declaration | Module manifest | Must claim `realtime` only when §D is satisfied |

---

## Reference Implementation

| Pattern | Artifacts |
|---------|-----------|
| Transport hub | `server/src/services/chatSocketService.ts` (and related) |
| Chat adapter | `chatRealtimeService` |
| File Hub adapter | `driveRealtimeService` → hub broadcast |
| Calendar / Todo adapters | `calendarRealtimeService`, `todoRealtimeService` |
| Intentional non-claim | Scheduling: hub usage without `realtime: true` |

---

## Source of Truth

This document is SoT for realtime **architecture semantics and participation**. Implementation details of Chat messaging remain under Chat certification / operation matrix docs.

---

## Certification Status

Realtime as a **platform capability document**: Active (Phase 3B). Per-module `realtime` claims remain subject to Pattern 14 and module certification evidence.

**Last updated:** 2026-09-08
