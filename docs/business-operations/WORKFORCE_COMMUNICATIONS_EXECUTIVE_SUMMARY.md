# Workforce Communications Executive Summary

**Program:** Workforce Communications Engineering Blueprint  
**Date:** 2026-06-14  
**Status:** Blueprint complete — ready for implementation program  
**Audience:** Engineering leadership, architecture council, product

---

## What we are building

**Workforce Communications** (`workforce_comms`) as a **first-class Vssyl module** — a broadcast system where organizations message **resolved workforce audiences** through the full lifecycle:

**Author → Audience → Delivery → Read → Ack → Audit**

Today, only **Phase 1** exists: Business Front Page `companyAnnouncements` JSON (implicit business-wide, render-only, no ack, no notifications). This blueprint defines the exact architecture to evolve that seed into a complete domain **without reopening** Chat, Notifications, identity, or audience decisions.

---

## Primary answer

Engineering builds a **standalone Business Operations module** peer to Scheduling and HR:

| Layer | Decision |
|-------|----------|
| **Module id** | `workforce_comms` |
| **Placement** | Dedicated hub in Business Workspace (not nested under Front Page) |
| **Identity** | Consumes org-chart `EmployeePosition` + `Department` — no parallel roster |
| **Delivery** | Emits `workforce_*` to platform NotificationService |
| **Controllers** | Thin — zero Prisma (Scheduling/HR pattern) |
| **Phase 1 migration** | Import `companyAnnouncements` → `WorkforceCommunication` rows |

---

## Capability summary

| Capability | In blueprint |
|------------|--------------|
| Announcements, dept broadcasts, leadership messages | Phase A–F |
| Audience targeting | Org-chart resolver |
| Notification fan-out | `workforceNotificationService` |
| Acknowledgements + read tracking | WC-owned (not Chat) |
| Schedule / HR broadcast bridges | Phase G (additive to existing domain notifs) |
| Campaign reporting | Phase G |
| Emergency alerts | Evaluate in Phase G — not `priority: urgent` alone |
| SMS / email campaigns | Future |

---

## Architecture at a glance

```
Workforce Communications Module
├── Data: Communication, Campaign, Audience, Resolution, Ack, ReadReceipt
├── Services: 15+ canonical services (communication, audience, notify, activity, trash, vlink)
├── API: /api/workforce-comms (admin + employee + AI context)
├── UI: Workspace hub, composer, feed, ack — Front Page widget becomes consumer
└── Platform: PE, Activity, Domain Events, V-Link, Global Trash, Manifest
```

**72 files** scoped in [WORKFORCE_COMMUNICATIONS_FILE_TARGET_MATRIX.md](./WORKFORCE_COMMUNICATIONS_FILE_TARGET_MATRIX.md).

---

## Build sequence

| Phase | Focus |
|-------|-------|
| **A** | Data model |
| **B** | Core services |
| **C** | Routes + Policy Engine |
| **D** | Activity + notifications + domain events |
| **E** | V-Link + Trash |
| **F** | UI + hub + front-page cutover |
| **G** | Reporting + Scheduling/HR bridges |

Detail: [WORKFORCE_COMMUNICATIONS_EXECUTION_ROADMAP.md](./WORKFORCE_COMMUNICATIONS_EXECUTION_ROADMAP.md).

---

## Boundaries preserved

| System | Role |
|--------|------|
| **Chat** | Conversation — not broadcasts |
| **Notifications** | Delivery — not content |
| **HR** | Lifecycle + `hr_*` workflow alerts |
| **Scheduling** | Planning + `scheduling_*` alerts |
| **Org chart** | Identity authority |

---

## Deliverables (this program)

| # | Document |
|---|----------|
| 1 | [WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md](./WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md) |
| 2 | [WORKFORCE_COMMUNICATIONS_DATA_MODEL.md](./WORKFORCE_COMMUNICATIONS_DATA_MODEL.md) |
| 3 | [WORKFORCE_COMMUNICATIONS_SERVICE_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_SERVICE_ARCHITECTURE.md) |
| 4 | [WORKFORCE_COMMUNICATIONS_ROUTE_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_ROUTE_ARCHITECTURE.md) |
| 5 | [WORKFORCE_COMMUNICATIONS_UI_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_UI_ARCHITECTURE.md) |
| 6 | [WORKFORCE_COMMUNICATIONS_NOTIFICATION_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_NOTIFICATION_ARCHITECTURE.md) |
| 7 | [WORKFORCE_COMMUNICATIONS_ACTIVITY_AND_EVENTS.md](./WORKFORCE_COMMUNICATIONS_ACTIVITY_AND_EVENTS.md) |
| 8 | [WORKFORCE_COMMUNICATIONS_VLINK_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_VLINK_ARCHITECTURE.md) |
| 9 | [WORKFORCE_COMMUNICATIONS_FILE_TARGET_MATRIX.md](./WORKFORCE_COMMUNICATIONS_FILE_TARGET_MATRIX.md) |
| 10 | [WORKFORCE_COMMUNICATIONS_EXECUTION_ROADMAP.md](./WORKFORCE_COMMUNICATIONS_EXECUTION_ROADMAP.md) |
| 11 | [WORKFORCE_COMMUNICATIONS_EXECUTIVE_SUMMARY.md](./WORKFORCE_COMMUNICATIONS_EXECUTIVE_SUMMARY.md) (this document) |

---

## Next step

Approve blueprint → launch **Workforce Communications Implementation Program** starting Phase A (data model migration).

**No code in this program. No certification. Implementation is a separate ACT program.**

---

## Document authority

Canonical engineering specification for Workforce Communications module build. Does not amend Phase 0C boundary documents or constitutional classification.
