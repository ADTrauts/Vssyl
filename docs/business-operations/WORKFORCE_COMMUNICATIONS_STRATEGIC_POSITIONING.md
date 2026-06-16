# Workforce Communications Strategic Positioning

**Phase:** Business Operations Phase 0C — Discovery only  
**Last updated:** 2026-06-14  
**Related:** [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md), [WORKFORCE_AUDIENCE_ARCHITECTURE.md](./WORKFORCE_AUDIENCE_ARCHITECTURE.md), [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md)

---

## What Workforce Communications is today (confirmed facts)

| Question | Answer | Evidence |
|----------|--------|----------|
| Module exists? | **No** | Zero `workforce_communications` matches; no routes/models/hub |
| Any owner module? | **No** — fragmented surrogates | Front page CMS, Chat, Notifications delivery, HR workflow alerts, scheduling sockets |
| Phase 0A conclusion valid? | **Yes** | Communications-owned rows = 0 in boundary doc |
| Identity for future domain? | Consume `EmployeePosition` + `Department` | [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md) |

**Workforce Communications is NOT PRESENT.** Operational coordination messaging is **unowned** in the product architecture today.

---

## Module model evaluation

| Model | Verdict | Evidence |
|-------|---------|----------|
| **Standalone module** | **Recommended (future)** | Distinct audience model, lifecycle, and capabilities vs Chat; aligns with Hybrid Model C (0A) |
| **Chat extension** | **Reject** | Participant audience; no dept broadcast; no ack campaigns; CHANNEL is label only |
| **Notifications-only** | **Reject** | C2 Notifier is delivery — no content/audience authoring |
| **Platform capability only** | **Partial** | Delivery + socket transport exist; **content domain missing** |
| **Front-page extension** | **Reject as sole solution** | No audience, ack, audit; wrong product surface (branding CMS) |
| **Hybrid domain** | **Strongest fit** | Standalone comms content domain + platform Notifier + org-chart audience resolver + optional realtime |

---

## What Workforce Communications should own (discovery recommendation — not implementation)

### Should own (target)

1. **Workforce coordination messaging** — operational content distinct from collaboration chat
2. **Audience specification and resolution** — dept, role, hierarchy, business-wide via org chart
3. **Broadcast campaigns** — author, schedule, expire, audit
4. **Emergency / crisis alerts** — override paths, escalation (when built)
5. **Compliance / policy acknowledgements** — required reading with tracked ack
6. **Schedule operational messaging** — publish notifications, coverage gaps (content layer — distinct from UI socket sync)
7. **Campaign lifecycle** — author → audience → delivery → read → ack → audit
8. **AI context** for comms campaigns and reach analytics (when module exists)

### Should not own

| Capability | Owner |
|------------|-------|
| User accounts | Platform |
| Org structure / `EmployeePosition` CRUD | Org chart |
| PTO, attendance, employment lifecycle | HR |
| Shift planning, availability, swaps | Scheduling |
| Calendar events, recurrence, reminders | Calendar |
| Chat DMs, group threads, message read receipts | Chat |
| Notification transport (persist, push, email) | Platform Notifications |
| Socket.IO transport hub | Platform (`chatSocketService`) |
| Employee identity | Org chart |

---

## Relationship to adjacent domains

### Chat

- **Collaboration** — peer messaging with participant lists
- Workforce Communications may **optionally** bridge to Chat (e.g. "discuss this announcement") but must not **be** Chat
- See [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md)

### Notifications

- Workforce Communications **authors content** and **emits** `workforce_*` or `comms_*` types (future)
- Notifications **delivers** to resolved `userId` set
- Workflow `hr_*` notifications remain HR-owned events — not comms campaigns

### Scheduling

- Scheduling **owns** planning events (publish, shift change)
- Workforce Communications may **subscribe** to publish/coverage events to generate **operational messages**
- Scheduling sockets remain **UI sync** — not comms ownership

### HR

- HR **owns** workflow notifications (PTO approved, onboarding task)
- HR onboarding Chat deep-link remains collaboration — not comms domain
- Comms does not own employment records

### Front-page CMS

- **Surrogate** for static company news today
- Target: migrate or integrate announcement **content** into comms domain with proper audience — or keep branding-only content separate from operational messaging (open product question for Phase 0D)

---

## Future role in Business Operations (Hybrid Model C)

Per [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md) § Strategic model:

```
Business Operations (Hybrid)
├── Org Chart        → Identity (anchor)
├── HR               → Lifecycle
├── Scheduling       → Planning
├── Workforce Comms  → Coordination (target pillar)
├── Analytics        → Measurement
└── AI               → Intelligence

Platform services: Notifications, Activity, Realtime, PE, V-Link, Trash
```

Workforce Communications fills the **coordination** gap identified in Phase 0A — the missing pillar between planning (Scheduling), lifecycle (HR), and collaboration (Chat).

---

## Capability gap → target owner

| Capability | Current | Target owner |
|------------|---------|--------------|
| Workforce broadcasts | NOT PRESENT / front-page surrogate | Workforce Communications |
| Emergency alerts | NOT PRESENT | Workforce Communications |
| Dept operational messaging | NOT PRESENT | Workforce Communications |
| Compliance acknowledgements | NOT PRESENT | Workforce Communications |
| Shift operational messaging | Socket sync only | Workforce Communications (content) + Scheduling (events) |
| Coverage communication | AI context only | Workforce Communications + Scheduling |
| Operational read receipts | NOT PRESENT | Workforce Communications |
| Delivery | Platform Notifications | Platform (unchanged) |
| Collaboration messaging | Chat | Chat (unchanged) |

---

## Open questions (for Phase 0D — not resolved in 0C)

1. Migrate `companyAnnouncements` into comms module vs keep branding CMS separate?
2. Module id: `workforce_comms` vs `workforce-communications`?
3. Required notification types taxonomy: `workforce_broadcast`, `workforce_emergency`, `workforce_ack_required`?
4. Realtime: dedicated comms events vs notification-only delivery for v1?
5. Relationship to Calendar reminders for scheduled message delivery?

---

## Risks if positioning is ignored

1. **Chat absorbs broadcasts** — wrong audience model, no compliance ack
2. **Notifications mistaken for comms product** — delivery without content domain
3. **Scheduling sockets mistaken for shift messaging** — silent UI updates, no audit
4. **Front-page urgent priority mistaken for emergency system** — safety/compliance risk
5. **Parallel employee roster** for audiences — violates identity architecture

Mitigation: [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md) § FALSE POSITIVES.

---

## Evidence index

| Topic | Document / path |
|-------|-----------------|
| NOT PRESENT | Repo grep; boundary doc Communications section |
| Model C | `WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md` |
| Identity consumption | `WORKFORCE_IDENTITY_ARCHITECTURE.md` |
| Boundaries | `CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md` |
| Audience | `WORKFORCE_AUDIENCE_ARCHITECTURE.md` |
| HR/scheduling baselines | `HR_CAPABILITY_MAP.md`, Phase 0A closeout |

---

## Certification statement

**No certification awarded.** Strategic positioning is discovery recommendation only — not implementation mandate.
