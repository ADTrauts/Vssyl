# Platform Kernel — Ownership Model

**Program:** Platform Kernel Modernization — Wave 1  
**Date:** 2026-06-22  
**Status:** Discovery charter — no implementation

---

## 1. Purpose

Define **who owns what** across Platform Activity and Domain Events so module teams, platform engineering, and certification reviewers share a single boundary model.

---

## 2. Capability classification

| Capability id | Class | Product name | Ledger row |
|---------------|-------|--------------|------------|
| `platform_activity` | **Platform Capability** | Platform Activity Infrastructure | **None** (L1 uncertified) |
| `domain_events` | **Platform Capability** | Domain Events Infrastructure | **None** (L1 uncertified) |
| `platform_kernel` | **Composite program** | Platform Kernel (Activity + Events) | N/A — program umbrella |

**Not product modules.** Kernel capabilities do not have workspace `moduleId` landing pages or manifests.

---

## 3. Ownership matrix

### Platform Activity

| Concern | Owner | Delegates to |
|---------|-------|--------------|
| Envelope contract | Platform Engineering | `moduleSpecs.md` |
| Canonical write API | Platform Engineering | `moduleActivityService.ts` |
| Module write adapters | **Module owners** | `*ActivityService.ts` per module |
| Activity type catalogs | **Module owners** | Per-module activity models |
| Platform read federation | **Unassigned (gap)** | Should be Platform Engineering |
| `GET /api/activity-feed` | Platform Engineering (today: legacy controller) | `activityFeedController.ts` |
| Realtime refresh event | Platform Engineering | `activity:feed:refresh` |
| Legacy `Activity` table | Platform Engineering (deprecation) | Drive-era schema |

### Domain Events

| Concern | Owner | Delegates to |
|---------|-------|--------------|
| Type registry + contracts | Platform Engineering | `domainEventRegistry.ts` |
| Bus + subscriber registration | Platform Engineering | `domainEventBus`, `registerDomainEventSubscribers` |
| Canonical emit API | Platform Engineering | `emitDomainEvent.ts` |
| Typed emit helpers | Platform Engineering + modules | `domainEventEmitters.ts`, `*DomainEventService.ts` |
| Module event adoption | **Module owners** | Must use registry types on mutations |
| Notification fan-out | Notifications capability | `notificationDomainEventSubscriber` |
| AI fan-out | AI Platform | `AIEventConsumer` |
| Webhook fan-out | Platform / integrations | `webhookDomainEventSubscriber` |
| Search index fan-out | **Unassigned (stub)** | Future Search program |
| Workflow fan-out | **Unassigned (stub)** | Future automation program |

---

## 4. Write path ownership (constitutional)

```
authorize (Policy Engine — module/controller)
  → execute (module service)
  → emitModuleActivityEvent (module *ActivityService)     ← module owns catalog
  → emitDomainEvent (module *DomainEventService)           ← module owns adoption
  → subscribers (platform-owned consumers)
```

**Rule:** Never emit on failed or unauthorized paths (`module-interoperability.mdc`).

---

## 5. Read path ownership (current vs target)

### Current (fragmented)

| Reader | Owner today | Source of truth used |
|--------|-------------|----------------------|
| Activity feed API | Platform (legacy) | Multi-source SoR + partial Log |
| Place feed | Place module | Normalized Log ✓ |
| Analytics personal | Analytics capability | Legacy Activity ✗ |
| AI context | AI Platform | Legacy Activity ✗ |
| File history | Drive module | Activity + Log merge |

### Target (charter — not implemented)

| Reader | Owner | Source of truth |
|--------|-------|-----------------|
| **Platform activity read service** | Platform Engineering | `Log` where `operation = module_activity_event` |
| Module-local feeds | Module owners | Delegate to platform read with module filter |
| Analytics projections | Analytics capability | Derived from platform read — not SoR |
| AI context | AI Platform | Platform read + domain event log — not `Activity` table |

---

## 6. Activity vs Domain Events — relationship

| Dimension | Platform Activity | Domain Events |
|-----------|-------------------|---------------|
| **Purpose** | User/module audit trail; feed aggregation | Platform fan-out facts |
| **Envelope** | moduleSpecs normalized shape | `DomainEvent` typed record |
| **Persistence op** | `module_activity_event` | `domain_event_recorded` |
| **Typical consumer** | Feeds, analytics (should), UX | Notifications, AI, webhooks, sockets |
| **Overlap** | Both may fire on same mutation | Intentional dual-write |
| **Separation rule** | Activity = what happened for feeds | Events = what platform must react to |

**Anti-pattern:** Using domain event log as substitute for module activity on module-owned actions.

**Anti-pattern:** Querying module SoR tables (messages, tasks) as activity feed — duplicates kernel.

---

## 7. Dependency ownership (cross-cutting)

| Dependent | Depends on kernel for | Owner of integration |
|-----------|----------------------|----------------------|
| **Policy Engine** | Pre-emit authorization | PE team — not kernel |
| **AI Platform** | Learning signals, context | AI team consumes domain events; must migrate Activity reads |
| **Analytics Capability** | Personal activity derivation (AN-M2) | Analytics team — must use platform read |
| **Dashboard** | Feed widget data | Dashboard module — consumes platform read API |
| **Account Platform** | PP activity + settings/billing events | AP module adapters (correct pattern) |
| **Business Operations** | HR/scheduling/workforce events | BO modules — HR domain events gap |
| **Notifications** | Domain-event subscriber | Notifications service |
| **Reference Workspace** | Shell does not own kernel | WS consumes feeds |

---

## 8. Third-party / marketplace modules

Per `module-interoperability.mdc`, partners use the **same contract**:

- Emit via platform APIs (hosted modules: postMessage or server callbacks per pipeline).
- Register activity actions in manifest metadata (future kernel registry).
- Domain event types: platform-assigned or module-prefixed with registry review.

**Today:** Built-in modules only — marketplace kernel ownership follows third-party rulebook; not audited in Wave 1.

---

## 9. Governance roles

| Role | Responsibility |
|------|----------------|
| **Platform Kernel program lead** | Cross-capability charters, read federation, subscriber honesty |
| **Module owners** | Adapter completeness, adoption vs operation matrix |
| **Architecture council** | L2/L3 certification votes (future waves) |
| **Certification reviewer** | G2 auditability — ACT-R1 blocking for kernel L2 |

---

## 10. Ownership violations summary (remediation owners)

| Violation | Remediation owner |
|-----------|-------------------|
| ACT-R1 legacy reads | Platform Engineering (read service) |
| AN-M2 analytics Activity reads | Analytics capability owner |
| AI legacy Activity reads | AI Platform owner |
| HR domain-event gap | HR / BO module owner |
| Stub subscribers | Platform Engineering |
| Unowned platform read federation | Platform Engineering |

---

## Related

- [PLATFORM_KERNEL_REALITY_ASSESSMENT.md](./PLATFORM_KERNEL_REALITY_ASSESSMENT.md)
- [PLATFORM_KERNEL_CERTIFICATION_READINESS.md](./PLATFORM_KERNEL_CERTIFICATION_READINESS.md)

**Last updated:** 2026-06-22
