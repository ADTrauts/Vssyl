# Platform Kernel — Reality Assessment

**Program:** Platform Kernel Modernization — Wave 1 Discovery & Constitutional Audit  
**Date:** 2026-06-22  
**Authority:** [PLATFORM_PORTFOLIO_REFRESH_2026_5.md](../platform-portfolio/PLATFORM_PORTFOLIO_REFRESH_2026_5.md); [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)  
**Status:** Discovery only — **no implementation, no certification, no ledger changes**

**Scope:** Platform Activity Infrastructure + Domain Events Infrastructure. Scheduler, Search, Realtime, Analytics Phase 2, AI L3 — **out of scope**.

---

## 1. Executive summary

The Platform Kernel is **not a single runtime** — it is two related platform capabilities that share persistence (`Log` table) and fan-out patterns but serve different constitutional roles:

| Capability | Constitutional role | Storage | Maturity |
|------------|---------------------|---------|----------|
| **Platform Activity** | Immutable user-visible action record (module interoperability envelope) | `Log.operation = module_activity_event` | **L1** |
| **Domain Events** | Cross-cutting platform facts for fan-out (notifications, AI, webhooks, sockets) | `Log.operation = domain_event_recorded` + in-process bus | **L1–L2 hybrid** |
| **Combined Platform Kernel** | Audit honesty + event orchestration substrate | Shared `Log` + `chatSocketService` | **L1** |

**Writers are ahead of readers.** L3 modules emit normalized activity and typed domain events on success paths, but **read surfaces still bypass the kernel** — querying legacy `Activity` rows, module SoR tables (`Message`, `Task`, `Event`), and partial `Log` scans. This is **ACT-R1**, the portfolio's highest architectural debt.

**Domain Events registry is mature** (~180 typed contracts in `domainEventRegistry.ts`) but **orchestration is immature**: in-process bus only, two stub subscribers, no replay, HR module lacks domain-event emission layer.

---

## 2. Kernel inventory summary

### Platform Activity

| Layer | Count / location |
|-------|------------------|
| **Canonical writer** | `moduleActivityService.emitModuleActivityEvent` |
| **Module activity adapters** | **18** `*ActivityService.ts` files |
| **Activity taxonomies** | `businessActivityTaxonomy.ts`, `workforceCommsActivityTaxonomy.ts` |
| **Read APIs** | `activityFeedController`, `placeVisibilityService.getActivityFeed`, `fileController`/`folderController` history, `analyticsCapabilityService` |
| **Legacy store** | `prisma.activity` (Drive-era table) — **still written/read on some paths** |
| **Realtime consumer** | `activity:feed:refresh` via `chatSocketService` |

### Domain Events

| Layer | Count / location |
|-------|------------------|
| **Registry types** | **~180** `DOMAIN_EVENT_TYPES` with contracts |
| **Typed emitters** | `domainEventEmitters.ts`, `vlinkDomainEventEmitters.ts` |
| **Module domain-event services** | **13** `*DomainEventService.ts` files |
| **Bus** | `domainEventBus.ts` (in-process `EventEmitter`) |
| **Subscribers** | **9** registered (2 stubs) |
| **Persistence subscriber** | `activityDomainEventSubscriber` → `domain_event_recorded` |
| **Replay** | **None** — fire-and-forget in-process |

---

## 3. Dual-write persistence model (current reality)

```
Mutation success
  ├─ emitModuleActivityEvent → Log (module_activity_event) → socket activity:feed:refresh
  └─ emitDomainEvent → in-process bus
        ├─ activity subscriber → Log (domain_event_recorded)
        ├─ socket → platform:domain_event (actor only)
        ├─ notification → NotificationService (subset of types)
        ├─ AI → userLearningSignalService stub (6 types)
        ├─ webhooks → webhookSubscriptionService
        ├─ search_index_stub (no-op debug log)
        ├─ workflow_router_stub (no-op debug log)
        ├─ calendar_dashboard_bootstrap
        └─ workspace_dashboard_seed
```

**Observation:** Activity and domain events are **not unified** — a single user action may produce **two Log rows** with different operations and shapes. Readers that do not query both (or normalized module activity only) produce **incomplete feeds**.

---

## 4. ACT-R1 — legacy read path inventory

| Consumer | Legacy sources | Risk |
|----------|----------------|------|
| `activityFeedController` | `prisma.activity`, `Message`, `Event`, `Task`, partial `Log` (drive/chat only) | **Critical** — canonical dashboard feed |
| `analyticsCapabilityService` | `prisma.activity` for personal analytics (AN-M2) | **High** — certified capability |
| `CrossModuleContextEngine` | `prisma.activity` | **High** — AI grounding |
| `DigitalLifeTwinService` | `prisma.activity` | **High** — AI trust |
| `fileController` / `folderController` | `prisma.activity` + `Log` merge | Medium — module-local history |
| `placeVisibilityService` | `Log` module_activity_event (place module) | **Good** — normalized read pattern |
| `ai-context-debug` | `prisma.activity` | Low — debug only |

**Legacy write remnants:** `driveDeleteService` deletes `prisma.activity` rows on file purge; File Hub primarily uses normalized activity on upload paths (FH-6 closure documented).

---

## 5. Domain Events gaps

| Gap | Detail |
|-----|--------|
| **Stub subscribers** | `search_index_stub`, `workflow_router_stub` — registered but no-op |
| **HR module** | `hrActivityService` exists; **no `hrDomainEventService`** |
| **Identity module** | Activity via `identityActivityService`; domain events not module-wrapped |
| **Adoption vs registry** | Registry defines ~180 types; not all L3 mutation paths emit for every catalogued type |
| **No out-of-process replay** | Bus loss on crash; subscribers synchronous from emit call chain |
| **Duplicate persistence semantics** | `domain_event_recorded` vs `module_activity_event` — readers must know both |

---

## 6. Cross-cutting dependencies

| Dependent system | Activity dependency | Domain Events dependency |
|------------------|--------------------|-----------------------------|
| **Policy Engine** | Indirect — activity does not gate writes | No PE on emit paths (mutation already authorized) |
| **AI Platform** | Legacy `prisma.activity` reads in context engines | `AIEventConsumer` — 6 types only; learning stub |
| **Analytics Capability** | AN-M2 — personal analytics from `Activity` table | No materialization pipeline (Phase 2 N/A) |
| **Dashboard** | Feed API uses legacy multi-source pattern | Tab/widget domain events; dashboard activity service |
| **Account Platform** | PP-1/2/3 activity services | Settings, billing, entitlement domain events |
| **Business Operations** | HR, scheduling, workforce, org chart activity | Scheduling, workforce, org chart, approval domain events; **HR events gap** |
| **Notifications** | Not activity-driven | Domain-event subscriber — FILE_SHARED, BUSINESS_MEMBER_ADDED, MODULE_INSTALLED subset |
| **Webhooks** | — | Full event delivery via `webhookDomainEventSubscriber` |

---

## 7. Maturity assessment

| Surface | Level | Rationale |
|---------|-------|-----------|
| **Platform Activity** | **L1** | Canonical writer exists; reads fragmented; ACT-R1 undermines G2 |
| **Domain Events** | **L1–L2** | Registry/contracts **L2**; bus/subscribers/replay **L1** |
| **Combined Platform Kernel** | **L1** | Limited by read honesty and stub orchestration |

---

## 8. Certification risks (kernel-specific)

| ID | Risk | Tier |
|----|------|------|
| **PK-R1** | ACT-R1 legacy reads on certified surfaces | **High** |
| **PK-R2** | Dual Log operations without read federation contract | **High** |
| **PK-R3** | Stub subscribers registered as production consumers | **Medium** |
| **PK-R4** | HR / identity domain-event emission gap | **Medium** |
| **PK-R5** | Analytics personal path derives from legacy Activity (AN-M2) | **Medium** |
| **PK-R6** | AI context reads legacy Activity alongside domain events | **Medium** |
| **PK-R7** | No platform operation matrix for kernel HTTP reads | **Medium** |

---

## 9. What is working (strengths)

1. **Normalized write path** — `emitModuleActivityEvent` implements moduleSpecs envelope; widely adopted by L3 modules.
2. **Domain event registry** — 180 typed contracts with metadata sanitization; `buildTypedDomainEventInput` enforces shape.
3. **Module adapter pattern** — per-module `*ActivityService` / `*DomainEventService` keeps controllers thin on certified modules.
4. **Subscriber error isolation** — `runSubscriber` catches failures; mutations not rolled back.
5. **Place feed** — `placeVisibilityService` demonstrates correct normalized `Log` read pattern.
6. **Test coverage** — domain event registry, bus, and module event tests exist (partial G6).

---

## 10. Discovery completeness

| Area | Status |
|------|--------|
| Activity writers | **Complete** |
| Activity readers | **Complete** |
| Domain event registry | **Complete** |
| Domain event subscribers | **Complete** |
| Cross-cutting deps | **Complete** |
| HR / identity gaps | **Identified** |

**Verdict:** Discovery is **sufficient** to proceed — option **D (Discovery incomplete)** is **rejected**.

---

## 11. Recommended program shape

**Formal recommendation: C — Joint Platform Kernel program** with **Activity-first sequencing** (Package 1 = read contract + ACT-R1; Package 2 = domain event subscriber hardening + adoption audit).

See [PLATFORM_KERNEL_EXECUTIVE_SUMMARY.md](./PLATFORM_KERNEL_EXECUTIVE_SUMMARY.md) for decision options and required questions.

---

## Deliverables index

| Document | Purpose |
|----------|---------|
| This file | Master reality map |
| [PLATFORM_ACTIVITY_AUDIT.md](./PLATFORM_ACTIVITY_AUDIT.md) | Activity deep audit |
| [DOMAIN_EVENTS_AUDIT.md](./DOMAIN_EVENTS_AUDIT.md) | Domain Events deep audit |
| [PLATFORM_KERNEL_OWNERSHIP_MODEL.md](./PLATFORM_KERNEL_OWNERSHIP_MODEL.md) | Ownership and boundaries |
| [PLATFORM_KERNEL_CERTIFICATION_READINESS.md](./PLATFORM_KERNEL_CERTIFICATION_READINESS.md) | L2/L3 readiness |
| [PLATFORM_KERNEL_EXECUTIVE_SUMMARY.md](./PLATFORM_KERNEL_EXECUTIVE_SUMMARY.md) | Executive brief |

---

## Stop condition

- Discovery **complete**
- No implementation, certification, council, ledger, or modernization packages

**Last updated:** 2026-06-22
