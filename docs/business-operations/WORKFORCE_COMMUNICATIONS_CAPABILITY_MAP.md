# Workforce Communications Capability Map

**Phase:** Business Operations Phase 0C — Executive synthesis  
**Audience:** Stakeholders (5–10 minute read)  
**Last updated:** 2026-06-14  
**Status:** Discovery synthesis — not certification  
**Drill-down:** Linked audit documents; no conclusions beyond their evidence.

| Document | Answers |
|----------|---------|
| [WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md](./WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md) | Per-capability detail |
| [WORKFORCE_COMMUNICATIONS_ARCHITECTURE_AUDIT.md](./WORKFORCE_COMMUNICATIONS_ARCHITECTURE_AUDIT.md) | Architectural gates |
| [WORKFORCE_COMMUNICATIONS_UX_AUDIT.md](./WORKFORCE_COMMUNICATIONS_UX_AUDIT.md) | Surrogate UX |
| [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md) | **Chat vs Comms vs Notifications** |
| [WORKFORCE_AUDIENCE_ARCHITECTURE.md](./WORKFORCE_AUDIENCE_ARCHITECTURE.md) | **Audience anchors** |
| [WORKFORCE_COMMUNICATIONS_STRATEGIC_POSITIONING.md](./WORKFORCE_COMMUNICATIONS_STRATEGIC_POSITIONING.md) | Future domain model |
| [BUSINESS_OPERATIONS_PHASE_0C_CLOSEOUT.md](./BUSINESS_OPERATIONS_PHASE_0C_CLOSEOUT.md) | Phase closeout |

**Cross-phase authority:** [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md) (ownership), [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md) (identity), [HR_CAPABILITY_MAP.md](./HR_CAPABILITY_MAP.md) (workforce baseline)

---

# Executive Summary

## Does Workforce Communications exist?

**No.** There is no `workforce_communications` module, no dedicated models or routes, and no business workspace hub. Phase 0A's **NOT PRESENT** conclusion is **validated**.

## What exists instead (surrogates)

| Surface | What it actually is |
|---------|---------------------|
| Front-page `companyAnnouncements` | Business branding CMS — closest broadcast surrogate |
| Chat | Collaboration messaging (DM/GROUP/CHANNEL label) |
| Notification Center | **Delivery infrastructure** — not comms content |
| HR `hr_*` notifications | **Workflow alerts** — PTO, onboarding, attendance |
| Scheduling `schedule:*` sockets | **UI synchronization** — not shift messaging product |

## One-sentence boundaries

- **Chat ≠ Workforce Communications**
- **Notifications ≠ Workforce Communications**
- **Workflow notifications ≠ Workforce Communications**
- **Realtime events ≠ Workforce Communications**

Detail: [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md)

## Audience (one sentence)

Future comms must **consume** org-chart `EmployeePosition` + `Department` — **no** comms module consumes them today.

Detail: [WORKFORCE_AUDIENCE_ARCHITECTURE.md](./WORKFORCE_AUDIENCE_ARCHITECTURE.md)

---

# Capability Inventory

**Maturity:** HIGH · MEDIUM · LOW · NOT PRESENT · UNKNOWN

| Capability | Current State | Current Owner | Maturity | Notes |
|------------|---------------|---------------|----------|-------|
| **Dedicated module** | NOT PRESENT | — | NOT PRESENT | No grep matches |
| **Company announcements** | Front-page JSON | Business CMS | LOW | No dept audience on content |
| **Department broadcasts** | NOT PRESENT | — | NOT PRESENT | — |
| **Emergency alerts** | NOT PRESENT | — | NOT PRESENT | `urgent` CMS priority ≠ emergency system |
| **Workforce broadcasts** | NOT PRESENT | — | NOT PRESENT | — |
| **Shift operational messaging** | Socket sync only | Scheduling + platform | MEDIUM | False positive risk |
| **Coverage messaging** | AI context only | Scheduling | LOW | No workflow |
| **Chat DM/GROUP** | Full implementation | Chat | HIGH | Collaboration |
| **Chat CHANNEL** | Enum only | Chat | LOW | No distinct dept semantics |
| **Chat read receipts** | Per message | Chat | MEDIUM | Not operational workforce |
| **Notification delivery** | `NotificationService` | Platform | MEDIUM | C2 Notifier |
| **HR workflow notifications** | 8 types emitted | HR → Platform | MEDIUM | Manifest gap |
| **Scheduling notifications** | NOT PRESENT | — | NOT PRESENT | Zero `scheduling_*` |
| **Operational acknowledgements** | NOT PRESENT | — | NOT PRESENT | — |
| **Campaign audit trail** | NOT PRESENT | — | NOT PRESENT | — |
| **Dept audience on messages** | NOT PRESENT | — | NOT PRESENT | Widget dept filter ≠ content |
| **AI comms authoring** | NOT PRESENT | — | NOT PRESENT | — |

---

# Architecture Diagram

```
                    ┌─────────────────────────────────────┐
                    │   Workforce Communications          │
                    │         NOT PRESENT                 │
                    └─────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
   ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
   │ Front Page   │           │    Chat      │           │ Notifications│
   │ CMS surrogate│           │ Collaboration│           │  Delivery    │
   └──────────────┘           └──────────────┘           └──────────────┘
          │                           │                           ▲
          │                           │                           │
          │                    ReadReceipt                         │
          │                    (message only)                      │
          │                                                        │
   ┌──────────────┐           ┌──────────────┐                     │
   │ HR hr_*     │──────────►│  Workflow    │─────────────────────┘
   │ emitters    │           │  alerts      │
   └──────────────┘           └──────────────┘

   ┌──────────────┐
   │ Scheduling   │──► schedule:* sockets ──► UI sync (NOT comms)
   └──────────────┘

   ┌──────────────┐
   │ Org Chart    │──► EmployeePosition + Department (audience anchors)
   └──────────────┘         ▲ no comms consumer today
```

---

# Ownership Summary

| Owner | Communications role |
|-------|---------------------|
| **Workforce Communications** (future) | Operational content, audience, ack, audit |
| **Chat** | Participant messaging |
| **Notifications** | Delivery pipe |
| **HR** | Workflow notification sources |
| **Scheduling** | Planning + socket UI sync |
| **Business front-page CMS** | Static announcements (surrogate) |
| **Org chart** | Identity for future audience resolution |

---

# FALSE POSITIVES (executive catalog)

| Looks like… | Actually is… |
|-------------|--------------|
| Chat CHANNEL | Conversation type label — not dept channel |
| `schedule:shift:*` "broadcast" | UI synchronization |
| Notification Center | Delivery inbox — not comms product |
| HR PTO/attendance notifications | Workflow alerts |
| Front-page announcements | Branding CMS — not workforce comms domain |
| Chat read receipts | Message read state — not compliance ack |
| `priority: urgent` on announcements | Display field — not emergency alert system |

Full analysis: [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md) § FALSE POSITIVES.

---

# Relationship to Workforce Operations trilogy

| Phase | Pillar | Status |
|-------|--------|--------|
| 0A | Scheduling — Planning | Complete |
| 0B | HR — Lifecycle + Identity architecture | Complete |
| **0C** | **Workforce Communications — Coordination** | **Complete (NOT PRESENT; boundaries defined)** |
| 0D | Strategic Architecture synthesis | Next |

**Authority hierarchy after 0C:**

```
Ownership:     WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md
Identity:      WORKFORCE_IDENTITY_ARCHITECTURE.md
Communications: CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md
                WORKFORCE_AUDIENCE_ARCHITECTURE.md
```

---

# Critical Gaps

| Gap | Confirmed |
|-----|-----------|
| Workforce Communications module | NOT PRESENT |
| Broadcasts (dept/business) | NOT PRESENT |
| Emergency alerts | NOT PRESENT |
| Operational acknowledgements | NOT PRESENT |
| Workforce read-receipt campaigns | NOT PRESENT |
| `scheduling_*` notifications | NOT PRESENT |
| `workforce_*` notification types | NOT PRESENT |
| Audience resolver consuming org chart | NOT PRESENT |
| Activity / PE / V_Link / Global Trash for comms | NOT PRESENT |

---

# Strategic Implications

## Future Workforce Communications role

Standalone **coordination pillar** in Hybrid Model C:

- Owns operational message content and audience
- Consumes org-chart identity — does not duplicate
- Emits to platform Notifications for delivery
- Distinct from Chat collaboration and scheduling UI sync

## What not to do

- Do not build broadcasts inside Chat
- Do not treat Notifications as the comms product
- Do not treat scheduling sockets as shift messaging
- Do not treat front-page CMS as sufficient workforce comms

---

# Readiness & Next Step

| Item | Status |
|------|--------|
| Phase 0C complete | Yes — 8 documents |
| Workforce comms understood | Yes — NOT PRESENT; surrogates mapped |
| Boundaries documented | Yes |
| Audience architecture established | Yes |
| Ready for implementation | No |
| Ready for planning | Yes — via Phase 0D |

**Recommended next step:** **Business Operations Phase 0D — Strategic Architecture Program**

Synthesize 0A + 0B + 0C into formal Business Operations constitution using the four authority documents above.

---

*Synthesized from Phase 0C audit documents only. Completes Workforce Operations discovery trilogy (Scheduling, HR, Communications).*
