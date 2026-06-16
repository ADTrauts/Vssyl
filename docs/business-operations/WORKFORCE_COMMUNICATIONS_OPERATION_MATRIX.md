# Workforce Communications Operation Matrix

**Phase:** Business Operations Phase G — Post-implementation  
**Status:** Operational (Level 3 certified with findings closed in Phase G)  
**Last updated:** 2026-06-14  
**Module id:** `workforce_comms`  
**Authority:** [WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md](./WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md)

---

## Executive summary

| Question | Answer |
|----------|--------|
| Does Workforce Communications exist as a module? | **Yes** — `workforce_comms` built-in module with Prisma models, routes, hub, manifest, and seed |
| Who owns workforce operational messaging? | **Workforce Communications** — broadcast, audience, ack, read tracking, campaigns |
| Who owns delivery transport? | **Platform** `NotificationService` (delivery only) |
| Who owns scheduling shift alerts? | **Scheduling** — `scheduling_*` notifications; optional WC bridge drafts |
| Who owns HR workflow alerts? | **HR** — `hr_*` notifications; optional WC bridge for broadcasts |
| Realtime in WC? | **No** — hub/feed polling; no socket layer in WC |

---

## Module identity

| Attribute | Status | Evidence |
|-----------|--------|----------|
| Module id | **Present** | `workforce_comms` in `builtInModuleIds.ts`, manifest, seed |
| Prisma models | **Present** | `WorkforceCommunication`, `WorkforceCampaign`, ack/read/bridge refs |
| API routes | **Present** | `/api/workforce-comms/*` — 32 routes incl. Phase G reporting |
| Workspace hub | **Present** | `BusinessWorkspaceContent` case + `WorkforceCommsWorkspaceLanding` |
| AI context | **Present** | `registerBuiltInModules.ts` providers: overview, reach |
| Global trash | **Present** | `workforceTrashService` + `registerGlobalTrashHandlers` |
| V-Link | **Present** | `WORKFORCE_COMMUNICATION`, `WORKFORCE_CAMPAIGN` entities |
| Policy Engine | **Present** | 8 actions incl. `workforce:report.read`, `workforce:bridge.manage` |

---

## Capability matrix

| Capability | Owner | Implementation | Maturity | Lifecycle |
|------------|-------|----------------|----------|-----------|
| Workforce broadcasts | WC | `workforceCommunicationService` publish path | HIGH | Author → Audience → Delivery → Read → Ack → Audit |
| Audience targeting | WC | `workforceAudienceService` org-chart resolver | HIGH | Full |
| Acknowledgements | WC | `workforceAcknowledgementService` | HIGH | Full |
| Read receipts | WC | `workforceReadReceiptService` | HIGH | Full |
| Campaigns | WC | `workforceCampaignService` | HIGH | Full |
| Reporting | WC | `workforceReportingService` + admin report routes | HIGH | Read/ack aggregates, trends |
| Scheduling bridge | WC (optional) | `workforceBridgeService.onSchedulePublished` etc. | MEDIUM | Draft only; Scheduling owns publish |
| HR bridge | WC (optional) | `onHrOnboardingCompleted`, policy/announcement hooks | MEDIUM | Draft only; HR owns source |
| Front-page widget | WC | `listFrontPageCommunications` + `AnnouncementsWidget` | HIGH | Read from WC API |
| In-app notifications | Platform | `workforceNotificationService` → `NotificationService` | HIGH | Delivery only |
| Activity log | Platform | `workforceActivityService` normalized envelope | HIGH | Immutable activity |
| Domain events | Platform | `workforceDomainEventService` + registry | HIGH | Cross-module fan-out |
| Emergency alerts | — | Not implemented (evaluate only) | NOT PRESENT | — |
| SMS / email campaigns | — | Future | NOT PRESENT | — |

---

## API surface (Phase G)

| Route | Policy action | Purpose |
|-------|---------------|---------|
| `GET /admin/reports/summary` | `workforce:report.read` | Business-wide metrics + publish trends |
| `GET /admin/reports/communications` | `workforce:report.read` | Per-communication reach/read/ack |
| `GET /admin/reports/campaigns` | `workforce:report.read` | Campaign aggregates |
| `GET /admin/reports/acknowledgements` | `workforce:report.read` | Ack compliance report |
| `GET /admin/bridge/templates` | `workforce:bridge.manage` | Bridge template catalog + config flags |
| `GET /ai/context/overview` | `workforce:communication.read` | AI bounded overview |
| `GET /ai/context/reach` | `workforce:report.read` | AI reach summary |

---

## Bridge configuration

Bridges are **opt-in** via `BusinessModuleInstallation.configured` JSON on `workforce_comms`:

```json
{
  "scheduling": {
    "onSchedulePublished": false,
    "onScheduleChanged": false,
    "openShiftCampaigns": false
  },
  "hr": {
    "onOnboardingCompleted": false,
    "onPolicyAcknowledgement": false,
    "onHrAnnouncement": false
  }
}
```

Default: **all false**. Scheduling/HR services call bridge hooks; failures are logged and do not block domain workflows.

---

## Notification types

| Type | Status | Emitter |
|------|--------|---------|
| `workforce_communication_published` | Live | `notifyCommunicationPublished` |
| `workforce_ack_required` | Live | `notifyCommunicationPublished` (requiresAck) |
| `workforce_campaign_completed` | Live | `notifyCampaignCompleted` |
| `workforce_ack_reminder` | Planned | Scheduled job (future) |

---

## Certification findings closure (Phase G)

| ID | Finding | Resolution |
|----|---------|------------|
| F-WC-001 | AI registration missing | `registerBuiltInModules.ts` workforce_comms block + providers |
| F-WC-002 | Notification discovery mappings | `notifications/page.tsx` + `api/notifications.ts` workforce mappings |
| F-WC-003 | Manifest `planned: true` on live types | Manifest + taxonomy updated; ack_reminder remains planned |
| F-WC-004 | AI routes lack Policy Engine | PE on `/ai/context/overview` and `/ai/context/reach` |
| F-WC-005 | Stale operation matrix | This document (post-implementation refresh) |

---

## Constitutional boundaries (unchanged)

| Boundary | Rule |
|----------|------|
| Chat | No WC broadcast in Chat; no Chat integration |
| Notifications | Delivery only; WC owns content and audience |
| Scheduling | Owns schedules/shifts; bridge creates optional WC drafts |
| HR | Owns onboarding/policy source; bridge distributes broadcasts |
| Realtime | No WC socket/realtime layer |

---

## Analytics foundation

Reporting derives from:

- `WorkforceCommunication` / `WorkforceCampaign` persisted state
- `WorkforceAudienceResolution`, `WorkforceReadReceipt`, `WorkforceAcknowledgement`
- Module activity log (`workforce_*` actions via `workforceActivityService`)
- Domain events (`workforce.communication.*`, `workforce.bridge.created`)

No parallel analytics pipeline or new event system.

---

## Related

- [WORKFORCE_COMMUNICATIONS_SERVICE_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_SERVICE_ARCHITECTURE.md)
- [WORKFORCE_COMMUNICATIONS_ROUTE_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_ROUTE_ARCHITECTURE.md)
- [WORKFORCE_COMMUNICATIONS_FILE_TARGET_MATRIX.md](./WORKFORCE_COMMUNICATIONS_FILE_TARGET_MATRIX.md)
