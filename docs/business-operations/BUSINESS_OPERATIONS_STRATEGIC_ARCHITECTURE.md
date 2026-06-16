# Business Operations Strategic Architecture

**Phase:** Business Operations Phase 0D — Strategic Architecture Program  
**Status:** **Canonical Business Operations constitution**  
**Last updated:** 2026-06-14  
**Amended:** 2026-06-14 — Workforce Communications maturity (see [WORKFORCE_COMMUNICATIONS_CONSTITUTIONAL_CLARIFICATION.md](./WORKFORCE_COMMUNICATIONS_CONSTITUTIONAL_CLARIFICATION.md))  
**Synthesized from:** Phases 0A (Scheduling), 0B (HR + Identity), 0C (Workforce Communications) — no repository re-audit  
**Authority hierarchy:**

| Layer | Document |
|-------|----------|
| Capability ownership | [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md) |
| Workforce identity | [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md) |
| Communications boundary | [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md) |
| Audience architecture | [WORKFORCE_AUDIENCE_ARCHITECTURE.md](./WORKFORCE_AUDIENCE_ARCHITECTURE.md) |

**Related:** [BUSINESS_OPERATIONS_DOMAIN_MODEL.md](./BUSINESS_OPERATIONS_DOMAIN_MODEL.md), [BUSINESS_OPERATIONS_EXECUTIVE_SUMMARY.md](./BUSINESS_OPERATIONS_EXECUTIVE_SUMMARY.md)

---

## What is Business Operations?

**Business Operations** is the workforce operations program within Vssyl's business workspace: the coordinated set of **content domains** that answer who works here, how employment is tracked, when people should work, how the workforce is coordinated, how outcomes are measured, and how intelligence assists — connected by **shared platform services** without merging codebases.

It is **not** a single monolithic module. It is **Model C — Hybrid Workforce Operations Architecture:**

> **Independent domains + shared platform services**

Validated by Phases 0A–0C: Scheduling and HR are separate modules with distinct schemas; org-chart identity is mandatory shared foundation; Workforce Communications is **partially present (Phase 1)** via Business Front Page announcements while the dedicated module remains absent; platform Notifications, Activity, Realtime, and constitutional services connect domains.

---

## Mission

Enable businesses to **plan**, **track**, **coordinate**, and **understand** their workforce through:

1. **Canonical identity** — one answer to "who is an employee here?"
2. **Clear domain ownership** — planning vs lifecycle vs coordination vs measurement
3. **Explicit integration contracts** — shared bridges, not silent overlap
4. **Platform-aligned modules** — constitutional services consumed consistently
5. **Honest capability posture** — surrogates and false positives labeled, not mistaken for products

---

## Scope

### In scope (Business Operations pillars)

| Pillar | Role |
|--------|------|
| **Org Chart** | Workforce Identity |
| **HR** | Workforce Lifecycle |
| **Scheduling** | Workforce Planning |
| **Workforce Communications** | Workforce Coordination — **PARTIALLY PRESENT (Phase 1)** via Business Front Page announcements; **target:** full domain (module NOT PRESENT) |
| **Analytics** | Workforce Measurement |
| **AI** | Workforce Intelligence |

### Adjacent (integrated, not BO content owners)

| Adjacent domain | Relationship |
|-----------------|----------------|
| **Calendar** | Time containers — events, recurrence, reminders; sync target for HR/Scheduling |
| **Chat** | Collaboration messaging — not workforce coordination owner |
| **Business Workspace** | Operational shell (WS-L1 hubs) |
| **Business module** | Membership, invites, front-page CMS (Phase 1 Workforce Communications implementation host) |
| **Notifications** | Platform delivery — not communications content |

### Out of scope for this constitution

- Personal dashboard / non-business modules
- Third-party marketplace module internals
- Implementation waves or certification awards

---

## Architecture model — Model C validation

### Models considered (Phase 0A evidence)

| Model | Description | Verdict |
|-------|-------------|---------|
| **A** | Three independent modules only | **Partial** — modules exist separately but cannot operate without shared identity |
| **B** | Single Workforce Operations platform | **Premature** — comms pillar missing; codebases intentionally separate |
| **C** | Independent domains + shared integration layer | **Validated** — repository and discovery alignment |

### Why Model C

| Evidence source | Finding |
|-----------------|---------|
| Phase 0A | Scheduling + HR standalone; `hrScheduleService`, `EmployeePosition`, socket hub as bridges |
| Phase 0B | Org chart owns identity; HR extends; no merge proposed |
| Phase 0C | Comms NOT PRESENT; Chat/Notifications are adjacent; false positives documented |
| Boundary analysis | ~14 Scheduling-owned, ~16 HR-owned, 0 Comms-owned, 12 Shared, 8 Platform |

**Conclusion:** Business Operations is a **program constitution** over **independent modules** plus **platform services** — not a code merge and not a fictional unified product today.

---

## Canonical architecture

```
Business Operations (Model C)
│
├── Org Chart              → Workforce Identity
├── HR                     → Workforce Lifecycle
├── Scheduling             → Workforce Planning
├── Workforce Communications → Workforce Coordination (PARTIALLY PRESENT — Phase 1: Business Front Page)
├── Analytics              → Workforce Measurement
└── AI                     → Workforce Intelligence

Platform services (shared):
  Notifications · Activity · Realtime · Policy Engine
  V-Link · Global Trash · Audit · Search · AI Infrastructure
```

---

## Architecture principles

1. **Identity before domain data** — All workforce modules consume `EmployeePosition`; none duplicate placement authority ([WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md)).
2. **Planning vs tracking split** — Scheduling owns future shifts; HR owns past attendance and PTO ([WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md)).
3. **Coordination is a distinct pillar** — Operational messaging is not Chat, Notifications, or socket sync ([CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md)).
4. **Delivery ≠ content** — Notifications is C2 Notifier; domains author events and messages.
5. **Authorize → execute → emit** — Successful actions emit normalized activity; failed/unauthorized actions do not (platform contract).
6. **Tenant scope everywhere** — `businessId`, `dashboardId`, and org-chart anchors on every persisted path.
7. **Hybrid integration** — Shared bridges (`hrScheduleService`, identity stack) are **contracts**, not ownership transfers.
8. **No surrogate confusion** — FALSE POSITIVE GOVERNANCE (below) is binding for modernization.

---

## Ownership principles

| Principle | Rule |
|-----------|------|
| **Single writer per entity** | Org chart writes EP; HR writes EHP; Scheduling writes shifts |
| **Read-only identity consumption** | HR and Scheduling read org chart; they do not own structure CRUD |
| **Shared = explicit contract** | PTO conflict reads, attendance stubs, calendar sync — documented integrators |
| **Platform = cross-cutting** | Notifications, Activity, PE, Trash — never absorbed into one BO module |
| **Future comms consumes identity** | Audience resolver reads EP + Department; does not create parallel roster |
| **No re-litigation** | Ownership settled in 0A–0C; amend only via explicit program revision + new evidence |

---

## Integration principles

1. **Direction matters** — Identity flows org chart → domains; calendar events flow HR/Scheduling → Calendar via bridge.
2. **Source of truth is explicit** — Each integration names SoT (see [BUSINESS_OPERATIONS_INTEGRATION_ARCHITECTURE.md](./BUSINESS_OPERATIONS_INTEGRATION_ARCHITECTURE.md)).
3. **Events ≠ campaigns** — Workflow notifications and socket broadcasts are integration outputs, not workforce comms.
4. **Bridges are named and owned** — `hrScheduleService` ambiguity must be resolved in prerequisites — not silently inherited.
5. **Adjacent domains stay adjacent** — Chat and Calendar integrate; they are not BO pillars.

---

## Domain principles

| Domain | Governs | Must never absorb |
|--------|---------|-------------------|
| Org Chart | Who is placed where | PTO, shifts, broadcasts |
| HR | Employment lifecycle metadata | Org CRUD, shift planning |
| Scheduling | When people should work | PTO policy, attendance records |
| Workforce Communications | Operational coordination | Chat threads, notification transport |
| Analytics | Derived measurement | Source domain data |
| AI | Context and actions per module | Domain entity ownership |

---

## Current state summary (discovery synthesis)

| Pillar | Maturity | Headline |
|--------|----------|----------|
| Org Chart | MEDIUM | Identity anchor exists; import bypass and lifecycle asymmetry risks |
| HR | MEDIUM | Core lifecycle; constitutional debt; monolithic controller |
| Scheduling | MEDIUM | Core planning; manager 501 stubs; no notifications |
| Workforce Communications | PARTIALLY PRESENT (Phase 1) | Business Front Page announcements (LOW); module NOT PRESENT; boundaries in 0C |
| Analytics | LOW–MEDIUM | HR dashboards; scheduling server analytics 501 |
| AI | MEDIUM | Per-module context/actions; no cross-BO orchestration |

**Platform services:** Partially adopted — Notifications and Realtime used; Activity, PE, V_Link, Global Trash largely absent in BO modules.

---

## Target state summary (architectural intent)

Business Operations reaches **constitutional completeness** when:

1. All six pillars have clear module or platform homes with workspace hubs where applicable
2. Workforce Communications exists as coordination pillar consuming org-chart audiences
3. BO modules emit normalized activity and notification types with manifest metadata
4. Policy Engine governs authorization for manager/admin write paths
5. Shared bridges (`hrScheduleService`) have documented neutral contracts
6. FALSE POSITIVE GOVERNANCE is enforced in design reviews

**Not a delivery commitment** — architectural north star from discovery.

---

## Final architecture recommendation

**Adopt Model C as the Business Operations constitution:**

- **Preserve** independent Scheduling, HR, and future Workforce Communications modules
- **Preserve** org chart as identity authority
- **Invest** in platform service alignment (Activity, Notifications manifest, PE, Trash, V_Link) across BO modules
- **Evolve** Workforce Communications from Phase 1 (Business Front Page) to full coordination pillar — standalone domain, not Chat extension
- **Govern** surrogates via FALSE POSITIVE GOVERNANCE
- **Sequence** modernization via [BUSINESS_OPERATIONS_MODERNIZATION_PREREQUISITES.md](./BUSINESS_OPERATIONS_MODERNIZATION_PREREQUISITES.md) — prerequisites only, no waves here

---

# FALSE POSITIVE GOVERNANCE

**Status:** Constitutional guidance for Business Operations modernization and design review.  
**Source:** [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md) § FALSE POSITIVES (Phase 0C); front-page row amended per [WORKFORCE_COMMUNICATIONS_CONSTITUTIONAL_CLARIFICATION.md](./WORKFORCE_COMMUNICATIONS_CONSTITUTIONAL_CLARIFICATION.md).

### Purpose

Prevent delivery, workflow, collaboration, and synchronization features from being classified as **Workforce Communications** products. Misclassification causes wrong ownership, missing audience/ack capabilities, and unsafe emergency UX.

### Binding distinctions

| Statement | Meaning |
|-----------|---------|
| **Chat ≠ Workforce Communications** | Participant-scoped collaboration ≠ org-chart audience operational messaging |
| **Notifications ≠ Workforce Communications** | C2 Notifier delivery ≠ campaign content, audience, ack lifecycle |
| **Workflow Notifications ≠ Workforce Communications** | `hr_*` (and future domain) alerts ≠ broadcast/compliance campaigns |
| **Realtime Events ≠ Workforce Communications** | `schedule:*` socket sync ≠ authored shift operational messages |

### Governed false positives (minimum set)

| Surface | Classification | Owner |
|---------|----------------|-------|
| Chat CHANNEL type | Conversation label | Chat |
| Scheduling `schedule:shift:*`, `schedule:published` | UI synchronization | Scheduling + platform Realtime |
| Notification Center | Delivery inbox | Platform Notifications |
| HR `hr_*` notifications | Workflow alerts | HR → Platform |
| Front-page `companyAnnouncements` | Phase 1 Workforce Communications (broadcast seed) — **not** Chat; incomplete domain | Business front-page CMS |
| Chat `ReadReceipt` | Message read state | Chat |
| Announcement `priority: urgent` | Display metadata | Business CMS — **not** emergency system |

### Design review rule

Before labeling any feature "workforce communications," verify the full lifecycle: **Author → Audience (org-chart) → Delivery → Read → Ack → Audit**. If any step is absent or owned by another domain per table above, the feature is **not** Workforce Communications.

### Front Page and Workforce Communications

Business Front Page announcements are the **Phase 1 seed implementation** of the Workforce Communications **broadcast system**. They implement organization-to-audience messaging (admin author → workforce viewers) and are **not** equivalent to Chat (conversation system). Phase 1 does **not** satisfy the full broadcast lifecycle; evolution to full domain is required.

### Modernization gate

No BO modernization program may:

1. Implement broadcasts inside Chat as substitute for Workforce Communications
2. Treat Notification Center as comms authoring surface
3. Treat scheduling socket events as shift messaging product
4. Treat front-page Phase 1 as sufficient emergency alert system or complete Workforce Communications domain

**Exception path:** Explicit program revision superseding this constitution.

---

## Document hierarchy and supersession

```
Discovery (0A–0C)          →  evidence and boundaries
Strategic (0D)             →  this document + executive summary
Implementation (future)    →  must align with 0D; cannot override ownership docs without revision
```

| Need | Read first |
|------|------------|
| 5-minute overview | [BUSINESS_OPERATIONS_EXECUTIVE_SUMMARY.md](./BUSINESS_OPERATIONS_EXECUTIVE_SUMMARY.md) |
| Per-domain detail | [BUSINESS_OPERATIONS_DOMAIN_MODEL.md](./BUSINESS_OPERATIONS_DOMAIN_MODEL.md) |
| Integrations | [BUSINESS_OPERATIONS_INTEGRATION_ARCHITECTURE.md](./BUSINESS_OPERATIONS_INTEGRATION_ARCHITECTURE.md) |
| Platform services | [BUSINESS_OPERATIONS_PLATFORM_SERVICES.md](./BUSINESS_OPERATIONS_PLATFORM_SERVICES.md) |
| Capability roadmap | [BUSINESS_OPERATIONS_CAPABILITY_TARGET_STATE.md](./BUSINESS_OPERATIONS_CAPABILITY_TARGET_STATE.md) |
| Prerequisites | [BUSINESS_OPERATIONS_MODERNIZATION_PREREQUISITES.md](./BUSINESS_OPERATIONS_MODERNIZATION_PREREQUISITES.md) |

---

## Certification statement

**No certification awarded.** Phase 0D is strategic documentation only. This document is the **Business Operations constitution** until explicitly revised.
