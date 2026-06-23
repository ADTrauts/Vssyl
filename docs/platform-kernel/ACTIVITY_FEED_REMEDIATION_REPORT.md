# Activity Feed Remediation Report

**Program:** Platform Kernel Wave 3 — Package 1  
**Date:** 2026-06-22  
**Status:** **Complete (P0)**

---

## Problem (pre-P0)

`GET /api/activity-feed` (`activityFeedController`) aggregated **five parallel sources**:

| Source | Table | Issue |
|--------|-------|-------|
| Drive legacy | `Activity` | ACT-R1 violation |
| Chat surrogate | `Message` | SoR substitute |
| Calendar surrogate | `Event` | SoR substitute |
| Todo surrogate | `Task` | SoR substitute |
| Partial normalized | `Log` (drive/chat only) | Incomplete federation |

---

## Remediation

### Controller (thin)

```text
authenticateJWT → validate dashboardId ownership → getFeedForUser() → toActivityFeedItem() → JSON
```

| Removed | Replaced with |
|---------|---------------|
| `prisma.activity.findMany` | — |
| `prisma.message.findMany` | — |
| `prisma.event.findMany` | — |
| `prisma.task.findMany` | — |
| Partial `Log` query (drive/chat) | Full `module_activity_event` federation |

### Source of truth

- **Single store:** `Log.operation = 'module_activity_event'`
- **Scope:** `userId` + optional `context.dashboardId` filter
- **Mapping:** `platformActivityFeedMapper.toActivityFeedItem`

---

## API compatibility

| Field | Status |
|-------|--------|
| Route | `GET /api/activity-feed` — unchanged |
| Query params | `limit`, `dashboardId` — unchanged |
| Response shape | `{ activities: ActivityFeedItem[] }` — preserved |
| Item fields | `id`, `type`, `action`, `description`, `module`, `createdAt`, `user`, `metadata` — preserved |

### Behavioral changes (honesty corrections)

| Change | Reason |
|--------|--------|
| Feed items from all modules with normalized events | Was limited to SoR proxies + partial Log |
| No message body previews | Envelope-only — constitutional metadata rule |
| Items require normalized envelope | Invalid/partial log rows excluded |

---

## Frontend impact

| Consumer | Path | Action |
|----------|------|--------|
| `ActivityFeedWidget.tsx` | `/api/activity-feed?dashboardId=…` | No change required |
| `DashboardClient.tsx` | Embeds widget | No change required |

---

## Tests

| Test | Result |
|------|--------|
| `activityFeedController.test.ts` | Pass — delegates to query service |
| `activity-feed-dashboard.integration.test.ts` | Pass — 404/200 scoping |

---

## Exit criteria

- [x] No `Activity` / `Message` / `Event` / `Task` reads in feed controller
- [x] Single canonical query path
- [x] Dashboard ownership validation preserved
- [x] Integration tests pass

**Last updated:** 2026-06-22
