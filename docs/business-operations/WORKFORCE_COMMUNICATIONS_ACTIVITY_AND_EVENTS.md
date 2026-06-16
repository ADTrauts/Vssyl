# Workforce Communications Activity and Events

**Program:** Workforce Communications Engineering Blueprint  
**Module id:** `workforce_comms`  
**Last updated:** 2026-06-14  
**Authorities:** [DOMAIN_EVENTS.md](../architecture/DOMAIN_EVENTS.md), `moduleSpecs.md`, Scheduling remediation pattern

---

## 1. Dual emission model

| Layer | Purpose | Consumer |
|-------|---------|----------|
| **Module activity** | User-visible feed, global activity | Activity log, workspace |
| **Domain events** | Platform event bus, automation, analytics | Domain event subscribers |

Emit **only after** authorized successful mutations — never on failure.

---

## 2. Module activity taxonomy

Service: `workforceActivityService.ts`  
Pattern: `emitModuleActivityEvent` via `record*` helpers (mirror `schedulingActivityService.ts`).

| Action | `targetType` | When | Metadata (allowed) |
|--------|--------------|------|-------------------|
| `workforce_communication_created` | `communication` | Draft create | `communicationType`, `priority` |
| `workforce_communication_updated` | `communication` | Draft update | `status` |
| `workforce_communication_scheduled` | `communication` | Schedule set | `scheduledAt` |
| `workforce_communication_published` | `communication` | Publish | `audienceType`, `recipientCount`, `requiresAck` |
| `workforce_communication_cancelled` | `communication` | Cancel | — |
| `workforce_communication_expired` | `communication` | Expiry job | — |
| `workforce_communication_trashed` | `communication` | Soft trash | — |
| `workforce_communication_restored` | `communication` | Restore | — |
| `workforce_communication_purged` | `communication` | Permanent delete | — |
| `workforce_read_recorded` | `communication` | User read | `source` |
| `workforce_ack_completed` | `communication` | User ack | — |
| `workforce_campaign_created` | `campaign` | Campaign create | — |
| `workforce_campaign_completed` | `campaign` | Campaign complete | `communicationCount` |
| `workforce_campaign_trashed` | `campaign` | Trash | — |
| `workforce_attachment_added` | `attachment` | Attach file | `attachmentId` |
| `workforce_bridge_created` | `communication` | Bridge from schedule/HR | `sourceModuleId`, `bridgeKind` |

### Envelope fields

```typescript
{
  actorUserId,
  businessId,
  action: 'workforce_communication_published',
  targetType: 'communication',
  targetId: communicationId,
  parentType?: 'campaign',
  parentId?: campaignId,
  metadata: { /* no body, no PII emails */ }
}
```

---

## 3. Domain event taxonomy

Service: `workforceDomainEventService.ts`  
Registry: `domainEventRegistry.ts`  
Emitters: `domainEventEmitters.ts`

### Event types

| Constant | Type string | Entity | Action |
|----------|-------------|--------|--------|
| `WORKFORCE_COMMUNICATION_CREATED` | `workforce.communication.created` | `WorkforceCommunication` | create |
| `WORKFORCE_COMMUNICATION_UPDATED` | `workforce.communication.updated` | `WorkforceCommunication` | update |
| `WORKFORCE_COMMUNICATION_SCHEDULED` | `workforce.communication.scheduled` | `WorkforceCommunication` | schedule |
| `WORKFORCE_COMMUNICATION_PUBLISHED` | `workforce.communication.published` | `WorkforceCommunication` | publish |
| `WORKFORCE_COMMUNICATION_CANCELLED` | `workforce.communication.cancelled` | `WorkforceCommunication` | cancel |
| `WORKFORCE_COMMUNICATION_EXPIRED` | `workforce.communication.expired` | `WorkforceCommunication` | expire |
| `WORKFORCE_COMMUNICATION_TRASHED` | `workforce.communication.trashed` | `WorkforceCommunication` | trash |
| `WORKFORCE_COMMUNICATION_RESTORED` | `workforce.communication.restored` | `WorkforceCommunication` | restore |
| `WORKFORCE_COMMUNICATION_PERMANENTLY_DELETED` | `workforce.communication.permanentlyDeleted` | `WorkforceCommunication` | purge |
| `WORKFORCE_READ_RECORDED` | `workforce.read.recorded` | `WorkforceReadReceipt` | read |
| `WORKFORCE_ACK_COMPLETED` | `workforce.ack.completed` | `WorkforceAcknowledgement` | ack |
| `WORKFORCE_CAMPAIGN_CREATED` | `workforce.campaign.created` | `WorkforceCampaign` | create |
| `WORKFORCE_CAMPAIGN_COMPLETED` | `workforce.campaign.completed` | `WorkforceCampaign` | complete |
| `WORKFORCE_CAMPAIGN_TRASHED` | `workforce.campaign.trashed` | `WorkforceCampaign` | trash |

### Metadata contract (disallowed: `body`, `title`, `email`, `content`)

**Published event example:**

```json
{
  "moduleId": "workforce_comms",
  "communicationType": "DEPARTMENT_BROADCAST",
  "audienceType": "DEPARTMENT",
  "recipientCount": 142,
  "requiresAck": true,
  "priority": "HIGH"
}
```

---

## 4. Emission sites

| Service function | Activity | Domain event |
|------------------|----------|--------------|
| `createCommunicationDraft` | created | created |
| `updateCommunicationDraft` | updated | updated |
| `scheduleCommunication` | scheduled | scheduled |
| `publishCommunication` | published | published |
| `cancelCommunication` | cancelled | cancelled |
| `recordRead` | read_recorded | read.recorded |
| `acknowledgeCommunication` | ack_completed | ack.completed |
| `softTrashCommunication` | trashed | trashed |
| `restoreCommunication` | restored | restored |
| `purgeCommunication` | purged | permanentlyDeleted |
| `createCampaign` | campaign_created | campaign.created |
| `completeCampaign` | campaign_completed | campaign.completed |

---

## 5. Audit model

| Audit need | Mechanism |
|------------|-----------|
| Who published what to whom | `WorkforceAudienceResolution` snapshot + activity `published` |
| Who acknowledged | `WorkforceAcknowledgement` rows + `workforce_ack_completed` |
| Who read | `WorkforceReadReceipt` rows |
| Notification delivery | `WorkforceDeliveryLog` |
| Immutable publish record | Resolution rows never updated after publish |

**Compliance export:** `workforceReportingService.exportComplianceReport(communicationId)` — CSV of ack status per resolved user.

**Not a separate audit table in Phase A** — composite of resolution + ack + activity + domain events sufficient for L3 bar.

---

## 6. Tests

| File | Coverage |
|------|----------|
| `workforceActivityService.test.ts` | Envelope shape |
| `workforceDomainEvents.test.ts` | No body/title in metadata |
| `workforceCommunicationService.test.ts` | Publish emits activity + event |

---

## 7. Comparison to Chat / Scheduling

| Module | Activity prefix | Domain prefix |
|--------|-----------------|---------------|
| Chat | `chat_*` / module actions | `chat.*` |
| Scheduling | `scheduling_*` | `scheduling.*` |
| WC | `workforce_*` | `workforce.*` |

---

## Related

- [WORKFORCE_COMMUNICATIONS_SERVICE_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_SERVICE_ARCHITECTURE.md)
- [WORKFORCE_COMMUNICATIONS_NOTIFICATION_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_NOTIFICATION_ARCHITECTURE.md)
