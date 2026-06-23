# Domain Event Adoption Reassessment

**Program:** PK-W3-DE-2  
**Date:** 2026-06-23  
**Status:** Post-implementation reassessment

---

## 1. Adoption summary

| Category | Pre DE-2 | Post DE-2 |
|----------|----------|-----------|
| Certified modules with facade | 9/10 | **10/10** |
| Certified modules emitting domain events | 9/10 | **10/10** |
| HR activity-only gap | **Open** | **Closed** |
| Registry HR types | 0 | **12** |

---

## 2. Module participation matrix (updated)

| Module | Facade | Activity | Domain events |
|--------|--------|:--------:|:-------------:|
| chat | ✅ | ✅ | ✅ |
| calendar | ✅ | ✅ | ✅ |
| drive | ✅ delegated | ✅ | ✅ |
| dashboard | ✅ | ✅ | ✅ |
| account | ✅ | ✅ | ✅ |
| place | ✅ | ✅ | ✅ |
| todo | ✅ | ✅ | ✅ |
| notebook | ✅ | ✅ | ✅ |
| hr | ✅ **new** | ✅ | ✅ **new** |
| scheduling | ✅ | ✅ | ✅ |
| workforce_comms | ✅ | ✅ | ✅ |
| orgchart | ✅ | ✅ | ✅ |
| approval_hierarchy | ✅ | ✅ | ✅ |
| analytics | — | ✅ | ❌ exempt |
| admin_portal | — | ❌ | ❌ exempt |

---

## 3. Cross-cutting consumer impact

HR domain events now fan out through existing subscribers:

| Subscriber | HR impact |
|------------|-----------|
| activity | `domain_event_recorded` audit rows |
| socket | Actor realtime |
| webhooks | Subscription delivery eligible |
| notification | Not yet mapped (DE-3 optional) |
| AI consumer | Not yet mapped (DE-3 optional) |

---

## 4. Remaining adoption work (non-blocking)

| Item | Priority | Package |
|------|----------|---------|
| Notification mapping for HR events | P2 | DE-3 |
| AI consumer HR types | P3 | AI program |
| Registry orphan audit | P2 | Hygiene |
| `driveDomainEventService` wrapper | P3 | Organizational |

---

## 5. Constitutional alignment

HR now follows the module interoperability contract:

**authorize → execute → emit module activity → emit domain event → notify/realtime**

Dual emission order preserved in `hrActivityService` (activity first, then domain event).

---

**Last updated:** 2026-06-23
