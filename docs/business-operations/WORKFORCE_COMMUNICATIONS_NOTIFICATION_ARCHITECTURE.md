# Workforce Communications Notification Architecture

**Program:** Workforce Communications Engineering Blueprint  
**Module id:** `workforce_comms`  
**Last updated:** 2026-06-14  
**Boundary:** WC authors and emits; **NotificationService delivers** — per [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md)

---

## 1. Delivery model

```
publishCommunication (authorized)
    → workforceAudienceService.resolveAudienceForPublish()
    → workforceNotificationService.notifyCommunicationPublished()
        → NotificationService.createNotification() per userId (batched)
    → workforceDeliveryLog rows
```

**WC never:**

- Renders Notification Center UI
- Owns push/email transport implementation
- Replaces `hr_*` or `scheduling_*` workflow notifications

---

## 2. Notification types (manifest)

Register in `builtInModuleManifests.ts` `case 'workforce_comms'`:

| Type | When emitted | Recipient |
|------|--------------|-----------|
| `workforce_communication_published` | Publish success | All resolved audience |
| `workforce_ack_required` | Publish when `requiresAck=true` | Same (emphasis metadata) |
| `workforce_ack_reminder` | Scheduled job — future | Users without ack |
| `workforce_campaign_completed` | Campaign marked complete | Campaign author + admins |

**Prefix:** `workforce_` per establishment requirements (CO-02 pattern).

---

## 3. workforceNotificationService contract

Mirror `schedulingNotificationService.ts`:

```typescript
// Conceptual API
notifyCommunicationPublished(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  title: string;
  summary?: string;
  priority: WorkforcePriority;
  requiresAck: boolean;
  recipientUserIds: string[];
}): Promise<void>
```

### Implementation rules

1. Deduplicate `recipientUserIds`
2. Respect user notification preferences / DND (platform handles)
3. Never include full `body` in notification payload — title + summary + link only
4. Log each attempt in `WorkforceDeliveryLog`
5. Catch per-user failures — do not fail entire publish

---

## 4. Notification payload metadata

| Field | Included | Notes |
|-------|----------|-------|
| `communicationId` | Yes | Deep link |
| `businessId` | Yes | Tenant |
| `communicationType` | Yes | Routing |
| `priority` | Yes | Display |
| `requiresAck` | Yes | CTA variant |
| `campaignId` | Optional | Grouping |
| `body` | **No** | Security / size |
| `audienceSpec` | **No** | Internal |

---

## 5. Workflow integration

### Publish flow

| Step | Owner |
|------|-------|
| 1. Author clicks Publish | UI |
| 2. PE `workforce:communication.publish` | Platform |
| 3. Resolve audience | WC |
| 4. Persist published state | WC |
| 5. Activity + domain event | WC |
| 6. Notification fan-out | WC → Platform |
| 7. User sees in-app notification | Platform NC |
| 8. User opens deep link | WC detail page |
| 9. Read + ack recorded | WC |

### Ack reminder flow (future)

| Step | Owner |
|------|-------|
| Platform job scheduler | Queries pending acks |
| WC service | Returns users without ack past threshold |
| WC notification service | Emits `workforce_ack_reminder` |

---

## 6. Cross-module notification boundaries

| Source | Notification types | Relationship to WC |
|--------|-------------------|-------------------|
| HR | `hr_*` | **Separate** — workflow alerts; WC may link via V-Link |
| Scheduling | `scheduling_*` | **Separate** — shift/schedule alerts; WC `SCHEDULE_NOTICE` is broadcast content |
| Chat | `chat_*` | **Separate** — message alerts |
| WC | `workforce_*` | **Owned emitters** |

### Schedule publish dual pattern

When business enables "schedule publish broadcast":

1. Scheduling emits `scheduling_schedule_published` (existing) — **unchanged**
2. WC bridge creates/publishes `SCHEDULE_NOTICE` communication — **additive**
3. WC emits `workforce_communication_published` to audience

Users may receive **two** notifications — different purposes (actionable shift vs organizational message). Document in operation matrix.

---

## 7. Channel model

| Channel | Phase | Owner |
|---------|-------|-------|
| In-app | A | Platform NotificationService |
| Email | Future | Platform |
| Push | Future | Platform |
| SMS | Future | Platform + WC escalation hook |

WC sets `channel` intent in `WorkforceDeliveryLog`; platform selects actual delivery.

---

## 8. Frontend notification metadata

Update per `docs/guides/NOTIFICATION_METADATA_GUIDE.md`:

| File | Change |
|------|--------|
| `web/src/app/notifications/page.tsx` | Icon, label, route for `workforce_*` |
| `web/src/api/notifications.ts` | Type union extension |

---

## 9. Grouping and priority

- **Grouping key:** `communicationId` — multiple delivery channels collapse in NC
- **Priority mapping:**

| WC priority | Notification priority |
|-------------|----------------------|
| LOW | low |
| NORMAL | normal |
| HIGH | high |
| URGENT | urgent (in-app) — **not** emergency override until Phase D |

---

## 10. Failure handling

| Failure | Behavior |
|---------|----------|
| Single user notify fails | Log FAILED; continue others |
| All notify fails | Publish still succeeds; admin sees delivery warning in report |
| Partial audience resolution | Block publish — zero recipients invalid |

---

## Related

- [WORKFORCE_COMMUNICATIONS_ACTIVITY_AND_EVENTS.md](./WORKFORCE_COMMUNICATIONS_ACTIVITY_AND_EVENTS.md)
- [WORKFORCE_COMMUNICATIONS_SERVICE_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_SERVICE_ARCHITECTURE.md)
