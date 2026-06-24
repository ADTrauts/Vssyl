# Partner Activity — Notification Boundary

**Program:** Marketplace & Module Ecosystem — Phase 1B-E  
**Date:** 2026-06-24  
**Status:** Policy specification — **no implementation, no notification redesign**

---

## 1. Principle

**Partner activity ingest is activity-only by default.** Notifications are a separate, platform-gated fan-out — not an automatic consequence of ingest.

This mirrors first-party behavior today: `emitModuleActivityEvent` does **not** auto-create notifications. Domain events use an explicit whitelist in `notificationDomainEventSubscriber`.

---

## 2. Current platform boundaries

| Path | Creates notification? |
|------|----------------------|
| `emitModuleActivityEvent` | ❌ No |
| `emitDomainEvent` → mapped types | ✅ Whitelist only (`file.shared`, `business.member.added`, `module.installed`, …) |
| Module direct `NotificationService.createNotification` | ✅ In-process, first-party |
| Partner module | ❌ No inbound notification API |

---

## 3. When partner activity should create notifications

### Phase 1 (pilot): **Never auto-create**

All partner-ingested events are **feed + audit visibility only**. Users see activity in the unified feed if visibility scope permits — no push/in-app notification.

### Phase 2+ (curated): Platform-owned mapping only

Notifications may be created only when **all** conditions hold:

| Gate | Requirement |
|------|-------------|
| G1 | Event normalized and persisted via ingest service |
| G2 | Action appears on **platform notification allowlist** (not partner-declared) |
| G3 | Module has `notifications` manifest entry for type |
| G4 | User preference / mute rules pass |
| G5 | Actor ≠ recipient (no self-notify unless product rule) |
| G6 | Tenant scope validated |

**Example allowlist candidates (future, not pilot):**

| Activity action | Notification type | Notes |
|-----------------|-------------------|-------|
| `assign` on `work_order` | `partner_work_order_assigned` | Requires manifest + preference |
| `complete` on `work_order` | `partner_work_order_completed` | Manager recipients only |

Partners **cannot** supply arbitrary notification types or recipient lists in ingest payload.

---

## 4. What must remain activity-only

| Category | Rationale |
|----------|-----------|
| CRUD on non-assigned entities | Noise; feed sufficient |
| `update` without assignment change | Low signal |
| Bulk/sync events | Rate + notification spam |
| Analytics-style actions | Not user-facing signals |
| Self-actions by actor | No notification |
| Unmapped action types | Default deny |

---

## 5. User preference checks

When notification mapping is enabled (Phase 2+):

| Check | Source |
|-------|--------|
| Global notification settings | User preferences |
| Module mute | Per-module notification settings |
| Business notification policy | Business admin rules (if exists) |
| Channel eligibility | Email/push/in-app flags |

Ingest payload must **not** include `notifyUserIds` — platform resolves recipients from entity relationships or fixed mapping rules.

---

## 6. Partner manifest role

```json
{
  "notifications": [
    {
      "type": "partner_work_order_assigned",
      "displayName": "Work order assigned",
      "description": "When a work order is assigned to you",
      "defaultEnabled": true
    }
  ]
}
```

Manifest declares **discoverable types** for preferences UI. It does **not** grant permission to fire notifications on every ingest.

---

## 7. Anti-patterns (forbidden)

| Pattern | Why forbidden |
|---------|---------------|
| Partner sends `notification` block in ingest | Spam / impersonation vector |
| Auto-notify on all partner activity | Feed pollution → notification pollution |
| Partner domain event → notification subscriber | Unvetted types |
| Activity → notification without allowlist | Violates platform gate |

---

## 8. Policy summary

| Question | Answer |
|----------|--------|
| Pilot notifications? | **No** — activity-only |
| Who owns notification mapping? | **Platform** only |
| Partner declares types? | Manifest metadata for preferences — not emit authority |
| Preference checks required? | **Yes** when mapping enabled |
| Redesign notifications? | **Out of scope** for 1B-E |

---

## 9. Recommended rollout

```
Phase 1B-F: Activity ingest → feed only
Phase 2:    Platform allowlist (1–2 high-signal actions)
Phase 3:    Preference UI for partner notification types
Phase 4:    Recipient resolution from entity graph (optional)
```

---

**Last updated:** 2026-06-24
