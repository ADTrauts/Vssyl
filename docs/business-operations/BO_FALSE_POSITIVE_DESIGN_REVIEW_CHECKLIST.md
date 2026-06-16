# Business Operations FALSE POSITIVE Design Review Checklist

**Program:** CO-06 — FALSE POSITIVE Governance  
**Status:** Authoritative review gate for Business Operations implementation  
**Last updated:** 2026-06-14  
**Constitution:** [BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md](./BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md) § FALSE POSITIVE GOVERNANCE  
**Boundaries:** [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md), [WORKFORCE_COMMUNICATIONS_CONSTITUTIONAL_CLARIFICATION.md](./WORKFORCE_COMMUNICATIONS_CONSTITUTIONAL_CLARIFICATION.md)

---

## Purpose

Institutionalize approved constitutional distinctions so delivery, workflow, collaboration, and synchronization features are **not** misclassified as **Workforce Communications** during Stage 1 and subsequent BO modernization.

---

## Binding distinctions (non-negotiable)

| Distinction | Meaning |
|-------------|---------|
| **Chat ≠ Workforce Communications** | Participant-scoped conversation ≠ org-chart audience broadcast |
| **Notifications ≠ Workforce Communications** | C2 Notifier delivery ≠ campaign content, audience, ack lifecycle |
| **Workflow Notifications ≠ Workforce Communications** | `hr_*` / `scheduling_*` alerts ≠ broadcast/compliance campaigns |
| **Realtime Events ≠ Workforce Communications** | `schedule:*` socket sync ≠ authored operational messages |

---

## Three-system model

| System | Role | Owns |
|--------|------|------|
| **Chat** | Conversation | People-to-people messaging, threads, read receipts |
| **Workforce Communications** | Broadcast | Org-chart audience messaging, ack lifecycle, campaign audit (module NOT PRESENT — Phase 1 partial via front page only) |
| **Notifications** | Delivery | Persist, group, route alerts emitted by domains |

---

## Design review checklist

Use before approving any BO feature spec, UX label, or implementation PR.

### Step 1 — Lifecycle test

Does the feature implement the **full Workforce Communications lifecycle**?

| Stage | Question | Required for WC? |
|-------|----------|------------------|
| **Author** | Who creates operational message content? | Yes |
| **Audience** | Is audience resolved via org-chart (department, position, tier)? | Yes |
| **Delivery** | How does the message reach recipients? | Yes |
| **Read** | Is read state tracked per audience member? | Yes |
| **Ack** | Is acknowledgment/compliance required and recorded? | Yes (when applicable) |
| **Audit** | Is campaign/message lifecycle auditable? | Yes |

**Rule:** If any stage is absent **or** owned by another domain per the table below, the feature is **not** Workforce Communications.

### Step 2 — Owner classification

| Question | Pass criteria |
|----------|---------------|
| Who owns the **content**? | WC for broadcasts; Chat for threads; Business CMS for front-page; HR/Scheduling for workflow copy |
| Who owns the **audience**? | WC (future) via org-chart; Chat uses participant list; Notifications do not select audience |
| Who owns **delivery**? | Platform Notifications (C2 Notifier) — never content |
| Who owns **realtime transport**? | Platform socket hub — never message authoring |

### Step 3 — FALSE POSITIVE screen

| Smell | Likely mislabel | Correct classification |
|-------|-----------------|----------------------|
| Feature described as "shift comms" but only emits socket events | Workforce Communications | Scheduling realtime sync |
| Feature adds `hr_*` notification type | Workforce Communications | HR workflow notification → Platform delivery |
| Feature uses Notification Center as authoring UI | Workforce Communications | Reject — NC is inbox only |
| Feature adds Chat CHANNEL for dept broadcasts | Workforce Communications | Chat label only — not WC substitute |
| Feature treats front-page announcements as emergency system | Workforce Communications | Business CMS Phase 1 seed — incomplete WC |
| Feature conflates read receipts with compliance ack campaigns | Workforce Communications | Chat read state ≠ WC ack |

### Step 4 — Stage gate

| Gate | Block if violated |
|------|-------------------|
| No Chat substitute for WC broadcasts | Implementing dept-wide messaging in Chat as WC replacement |
| No NC as comms authoring | Building campaign composer in Notification Center |
| No socket-as-comms-product | Marketing `schedule:published` as shift messaging product |
| No front-page as complete WC | Treating `companyAnnouncements` as emergency/compliance system |

---

## PR review checklist

Apply to every BO-related pull request (Scheduling, HR, Business, Platform cross-cutting).

- [ ] PR title/description does not label the change as "Workforce Communications" unless CO-11 (Stage 3) scope
- [ ] New notification types classified as **workflow** (`hr_*`, `scheduling_*`) or **broadcast** (`workforce_*` — Stage 3 only)
- [ ] Socket events documented as **UI synchronization**, not operational messaging
- [ ] Chat changes do not add org-chart audience selection
- [ ] Notification emitters use `NotificationService.createNotification` — no parallel "comms inbox"
- [ ] Front-page changes do not claim emergency alert or compliance ack completeness
- [ ] Design review checklist (Steps 1–4) completed and linked in PR description
- [ ] No new routes/manifests named `workforce-comms` or equivalent without Stage 3 authorization

---

## Architectural smell catalog

| ID | Smell | Example from BO findings | Correct owner |
|----|-------|--------------------------|---------------|
| FP-01 | **Socket sync labeled as comms** | `schedule:shift:updated`, `schedule:published` used for UI refresh | Scheduling + Platform Realtime |
| FP-02 | **Workflow alert labeled as broadcast** | `hr_attendance_exception_resolved` described as "workforce message" | HR workflow → Notifications |
| FP-03 | **Chat CHANNEL as dept broadcast** | CHANNEL enum treated as org-wide operational channel | Chat (label only) |
| FP-04 | **Notification Center as composer** | Building "send announcement" in `/notifications` | Reject — use future WC or Business CMS |
| FP-05 | **Front-page as WC domain** | `companyAnnouncements` marketed as complete comms module | Business front-page CMS (Phase 1 partial) |
| FP-06 | **Read receipt as compliance ack** | Chat `ReadReceipt` conflated with policy acknowledgment | Chat vs future WC ack |
| FP-07 | **Urgent priority as emergency system** | Announcement `priority: urgent` as EAP substitute | Business CMS display metadata |
| FP-08 | **Scheduling notification as shift chat** | `scheduling_schedule_published` framed as messaging product | Scheduling workflow notification |
| FP-09 | **Identity/audience in Chat** | Resolving dept audience inside chat routes | Org chart / future WC audience resolver |
| FP-10 | **Trash handler as comms archive** | Global trash item type "comms message" for non-WC entities | Domain-specific trash (CO-04) |

---

## Governed surfaces (approved classifications)

| Surface | Classification | Owner | WC? |
|---------|----------------|-------|-----|
| Chat DIRECT / GROUP | Conversation | Chat | No |
| Chat CHANNEL type | Conversation label | Chat | No |
| Chat `ReadReceipt` | Message read state | Chat | No |
| `chat_*` notifications | Conversation alerts | Chat → Notifications | No |
| Notification Center UI | Delivery inbox | Platform | No |
| `hr_*` notifications | Workflow alerts | HR → Notifications | No |
| `scheduling_*` notifications (planned) | Workflow alerts | Scheduling → Notifications | No |
| `schedule:shift:*`, `schedule:published` sockets | UI synchronization | Scheduling + Realtime | No |
| Front-page `companyAnnouncements` | Phase 1 broadcast seed | Business CMS | Partial — not full WC |
| Workforce Communications module | Broadcast domain | WC (NOT PRESENT) | Yes — Stage 3 |

---

## Examples from Business Operations findings

### Example 1 — Scheduling publish socket

**Finding:** Scheduling emits `schedule:published` on publish for connected clients to refresh UI.

**Wrong label:** "Shift communications delivered to employees."

**Correct label:** Realtime UI synchronization event. Operational notification (if any) is a separate `scheduling_schedule_published` workflow alert via CO-02 — not WC.

### Example 2 — HR attendance notification

**Finding:** `hr_attendance_exception_resolved` notifies manager when exception clears.

**Wrong label:** "Workforce operational message to management."

**Correct label:** HR workflow notification. No audience resolver, no ack campaign, no WC audit trail.

### Example 3 — Front-page announcements

**Finding:** Business workspace front page displays `companyAnnouncements` from CMS.

**Wrong label:** "Workforce Communications Phase 1 complete."

**Correct label:** Phase 1 partial broadcast seed. Missing org-chart audience resolution, ack lifecycle, and module certification. See constitutional clarification.

### Example 4 — Chat CHANNEL

**Finding:** API accepts `CHANNEL` conversation type.

**Wrong label:** "Department broadcast channel — WC substitute."

**Correct label:** Chat conversation label with participant-scoped semantics. Not org-chart audience messaging.

---

## Adoption and enforcement

| Checkpoint | When | Action |
|------------|------|--------|
| Feature spec | Before implementation | Complete Steps 1–4 |
| BO PR review | Every PR | PR checklist above |
| CO-02 work | Track 3 | Classify each new notification type (workflow vs broadcast) |
| Stage 1 verification | Track 4 | Surrogate labeling audit |

**Exception path:** Explicit program revision superseding constitution — not available in Stage 1.

---

## References

- [FALSE_POSITIVE_GOVERNANCE_IMPLEMENTATION_PLAN.md](./FALSE_POSITIVE_GOVERNANCE_IMPLEMENTATION_PLAN.md)
- [STAGE_1_ENGINEERING_BLUEPRINT.md](./STAGE_1_ENGINEERING_BLUEPRINT.md)
- [BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md](./BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md) — CO-06 / G01
