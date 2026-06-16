# Workforce Communications Architecture Audit

**Phase:** Business Operations Phase 0C — Discovery only  
**Status:** Reality assessment (not certified)  
**Last updated:** 2026-06-14  
**References:** Chat L3, Notifications UX Reference #2 — comparison only  
**Related:** [WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md](./WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md), [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md)

---

## Executive summary

There is **no Workforce Communications module** to certify. This audit assesses **surrogate surfaces** and the **architectural posture** required for a future domain against platform standards.

| Layer | Headline |
|-------|----------|
| **Dedicated module** | NOT PRESENT — no models, routes, services, manifest, hub |
| **Surrogate surfaces** | Front page (LOW), Chat (HIGH for collaboration), Notifications (MEDIUM delivery), HR notifs (MEDIUM workflow), scheduling sockets (MEDIUM sync) |
| **Audience targeting** | FAIL for workforce comms — identity anchors exist but no comms consumer |
| **Constitutional** | N/A for non-existent module; gaps documented for future planning |

**Overall:** Workforce Communications architecture is **NOT PRESENT**. Surrogate infrastructure is **fragmented** with **false-positive risk** (see boundary analysis).

---

## Status legend

| Status | Meaning |
|--------|---------|
| **PASS** | Meets reference pattern for assessed scope |
| **PASS WITH FINDINGS** | Largely present; documented gaps |
| **FAIL** | Material gap |
| **NOT PRESENT** | No implementation |
| **UNKNOWN** | Insufficient evidence |

---

## Dimension audit — dedicated Workforce Communications module

| Dimension | Status | Findings | Evidence |
|-----------|--------|----------|----------|
| **Models** | NOT PRESENT | No campaign, broadcast, audience, ack, or emergency models | Grep: no workforce comms module |
| **Routes / controllers** | NOT PRESENT | No API surface | — |
| **Services** | NOT PRESENT | No comms service layer | — |
| **Frontend / hub** | NOT PRESENT | No workspace landing | `BusinessWorkspaceContent.tsx` — no comms case |
| **Manifest / registration** | NOT PRESENT | Not in `builtInModuleManifests.ts` | — |
| **Permissions / RBAC** | NOT PRESENT | — | — |
| **Policy Engine** | NOT PRESENT | — | — |
| **Activity / audit** | NOT PRESENT | No campaign audit trail | — |
| **AI context** | NOT PRESENT | — | — |
| **Tests** | NOT PRESENT | — | — |

---

## Dimension audit — surrogate surfaces

### Front-page announcements subsystem

| Dimension | Status | Findings | Evidence |
|-----------|--------|----------|----------|
| **Storage** | PASS WITH FINDINGS | `companyAnnouncements` JSON on `BusinessFrontPageConfig` | `front-page.prisma` |
| **Authoring API** | PASS WITH FINDINGS | `businessFrontPageService` update path | `businessFrontPageService.ts` |
| **Audience targeting** | FAIL | Announcements are business-wide; no dept/EP targeting on content | `FrontPageContentEditor.tsx` — no audience fields on announcement objects |
| **Delivery** | PASS WITH FINDINGS | Render on front page + widget | `BusinessFrontPage.tsx`, `AnnouncementsWidget.tsx` |
| **Notification fan-out** | NOT PRESENT | No `createNotification` on publish | Grep |
| **Read / ack** | NOT PRESENT | No tracking | — |
| **Audit** | NOT PRESENT | No campaign history | — |

### Chat integration (boundary only — not re-certifying Chat)

| Dimension | Status | Findings | Evidence |
|-----------|--------|----------|----------|
| **Conversation model** | PASS | `Conversation`, `Message`, `ConversationParticipant` | `conversations.prisma` |
| **Tenant scoping** | PASS WITH FINDINGS | `dashboardId` on conversation — not dept-scoped | `conversations.prisma` L9–10 |
| **CHANNEL type** | PASS WITH FINDINGS | Enum exists; **no distinct server semantics** vs GROUP; UI creates DIRECT/GROUP only | `chatTypes.ts`; `ChatLeftPanel.tsx` L91 |
| **Read receipts** | PASS WITH FINDINGS | `ReadReceipt` per message — Chat scope only | `chatMessageService.ts` |
| **Workforce broadcast** | NOT PRESENT | Participant model — not org-chart audience | Boundary doc |

### Notifications integration (delivery infrastructure)

| Dimension | Status | Findings | Evidence |
|-----------|--------|----------|----------|
| **Persistence** | PASS | `Notification` model | `user.prisma` |
| **Delivery channels** | PASS WITH FINDINGS | `NotificationDelivery` model exists; limited runtime use | `user.prisma` L206+ |
| **C2 Notifier role** | PASS | `NotificationService.createNotification` — delivery only | [AUTOMATION_CONSUMER_BOUNDARY.md](../architecture/AUTOMATION_CONSUMER_BOUNDARY.md) |
| **HR workflow types** | PASS WITH FINDINGS | 8 emitted; manifest gap | `hrController`, `builtInModuleManifests.ts` hr case |
| **Scheduling types** | NOT PRESENT | Zero `scheduling_*` emitters | [SCHEDULING_ARCHITECTURE_AUDIT.md](./SCHEDULING_ARCHITECTURE_AUDIT.md) |
| **Comms types** | NOT PRESENT | No `workforce_*` / `comms_*` | Grep |

### Scheduling realtime (excluded from comms — documented as sync)

| Dimension | Status | Findings | Evidence |
|-----------|--------|----------|----------|
| **Transport** | PASS WITH FINDINGS | `chatSocketService` shared hub — not Chat-domain-only | `chatSocketService.ts` L724+ |
| **Events** | PASS WITH FINDINGS | `schedule:shift:created/updated/deleted`, `schedule:published` | `useSchedulingWebSocket.ts` |
| **Membership** | PASS WITH FINDINGS | `join_schedule` with membership check | Phase 0A scheduling audit |
| **As workforce comms** | FAIL | No message content, audience, ack — UI invalidation only | Boundary analysis |

### Audience targeting (workforce communications intent)

| Dimension | Status | Findings | Evidence |
|-----------|--------|----------|----------|
| **EmployeePosition anchor** | PASS (exists) | Org chart provides anchor | [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md) |
| **Department anchor** | PASS (exists) | Org chart `Department` | `org-chart.prisma` |
| **Comms consumer** | NOT PRESENT | No module resolves EP/Dept → message audience | — |
| **Widget visibility** | PASS WITH FINDINGS | `visibleToDepartments` on **widgets**, not announcements | `businessFrontPageService.getVisibleWidgets` |

### Emergency / broadcast / acknowledgement

| Dimension | Status | Findings | Evidence |
|-----------|--------|----------|----------|
| **Emergency alerts** | NOT PRESENT | No workforce alert routes/models | Grep: no app implementation |
| **Department broadcasts** | NOT PRESENT | No models | — |
| **Required reading / compliance ack** | NOT PRESENT | — | — |
| **Workforce read receipts** | NOT PRESENT | Chat receipts ≠ operational | `ReadReceipt` is message-scoped |

### AI (communications)

| Dimension | Status | Findings | Evidence |
|-----------|--------|----------|----------|
| **Comms AI context** | NOT PRESENT | — | — |
| **Chat analytics** | PASS WITH FINDINGS | `chatAnalyticsService` — collaboration metrics | Not workforce comms |

### Tests

| Dimension | Status | Findings | Evidence |
|-----------|--------|----------|----------|
| **Workforce comms tests** | NOT PRESENT | — | — |
| **Front-page tests** | UNKNOWN | Archive session notes only | `docs/archive/session-summaries/` |

---

## Reference comparison (boundary context only)

### vs Chat (L3 Reference)

| Pattern | Chat | Workforce Comms (required) | Delta |
|---------|------|---------------------------|-------|
| Participant-scoped messaging | ✓ | N/A — comms needs org audience | **NOT PRESENT** |
| Read receipts | ✓ message-level | Operational campaign ack | **NOT PRESENT** |
| Dept/business fan-out | ✗ | Required for broadcasts | **NOT PRESENT** |
| Activity + manifest | ✓ | Required for future module | **NOT PRESENT** |

### vs Notifications (Reference #2)

| Pattern | Notifications | Workforce Comms | Delta |
|---------|---------------|-----------------|-------|
| Delivery fan-out | ✓ C2 Notifier | Should **consume** not replace | Surrogate only |
| Content authoring | ✗ | Required | **NOT PRESENT** |
| Audience resolution | ✗ per event | Required | **NOT PRESENT** |

---

## Constitutional gaps (future Workforce Communications module)

When a comms domain is created, Phase 0A/0B patterns predict these gates:

| Gap | Current surrogate state | Future requirement |
|-----|-------------------------|-------------------|
| Module registration | NOT PRESENT | `seed*` + manifest with `notifications`, `aiContext` |
| Normalized activity | NOT PRESENT in BO modules | `emitModuleActivityEvent` on successful sends |
| Policy Engine | NOT PRESENT | Author/send authorization by role + audience |
| V_Link | NOT PRESENT | Link campaigns to shifts, policies, docs |
| Global Trash | NOT PRESENT | Soft-delete campaigns/messages |
| Notification types | No `workforce_*` | Emit via platform; manifest metadata |
| Realtime | Socket hub exists | Optional campaign delivery — distinct from scheduling sync |
| Tests | NOT PRESENT | Tenant isolation for audience resolution |

---

## Platform capability matrix (workforce comms row — projected)

| Capability | Status today | Notes |
|------------|--------------|-------|
| ai | NOT PRESENT | — |
| vlink | NOT PRESENT | — |
| trash | NOT PRESENT | — |
| realtime | NOT PRESENT (dedicated) | Shared socket exists |
| notifications | NOT PRESENT (emitter) | Platform delivery available |
| businessWorkspace | NOT PRESENT | — |
| globalActivity | NOT PRESENT | — |

---

## Evidence index

| Area | Paths |
|------|-------|
| Module absence | Repo-wide grep |
| Front page | `prisma/modules/business/front-page.prisma`, `businessFrontPageService.ts` |
| Chat | `prisma/modules/chat/`, `server/src/services/chat/` |
| Notifications | `server/src/services/notificationService.ts`, `builtInModuleManifests.ts` |
| Scheduling socket | `chatSocketService.ts`, `useSchedulingWebSocket.ts` |
| HR notifs | `HR_OPERATION_MATRIX.md` notification table |
| Platform standards | `docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` |
| Notifier boundary | `docs/architecture/AUTOMATION_CONSUMER_BOUNDARY.md` |

---

## Certification statement

**No certification awarded.** Phase 0C is discovery only. Dedicated Workforce Communications module: **NOT PRESENT**.
