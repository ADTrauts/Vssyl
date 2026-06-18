# BA-1A Activity Architecture

**Phase:** BA-1A — Architecture & Activity Foundation  
**Status:** Implemented  
**Finding addressed:** BA-F-001

## Purpose

Establish the normalized activity layer for Business Administration (`business_admin`, `org_chart` module IDs) before service extraction (BA-1B) or certification review (BA-2).

## Pattern alignment

Business Administration activity follows the same contract as Scheduling and HR:

```
authorize → execute → emitModuleActivityEvent → (optional) domain event → (optional) realtime broadcast
```

**Reference implementations:**

| Module | Activity service | Domain events |
|--------|------------------|---------------|
| Scheduling | `server/src/services/schedulingActivityService.ts` | `schedulingDomainEventService.ts` |
| HR | `server/src/services/hrActivityService.ts` | (module-specific) |
| Business Admin | `server/src/services/business/businessActivityService.ts` | `domainEventEmitters.ts` + `orgChartDomainEventService.ts` |

## Services

### `businessActivityService.ts`

Module ID: `business_admin`

| Function | Trigger |
|----------|---------|
| `recordBusinessCreated` | `POST /api/business` |
| `recordBusinessUpdated` | `PATCH /api/business/:id` |
| `recordBusinessBrandingUpdated` | Logo upload/remove |
| `recordBusinessMemberInvited` | Member invitation |
| `recordBusinessMemberJoined` | Invitation accept |
| `recordBusinessMemberUpdated` | Member role update |
| `recordBusinessMemberRemoved` | Member removal |

Each function:

1. Resolves `dashboardId` via `ensureBusinessDashboardForUser`
2. Persists normalized activity via `emitModuleActivityEvent`
3. Emits domain events where applicable
4. Broadcasts `business:config:updated` for client cache invalidation

### `orgChartActivityService.ts`

Module ID: `org_chart`

Covers tiers, departments, positions, employee assignments, permission sets, and default structure initialization. Emits org-structure config broadcasts on every write.

## Activity envelope

Uses the platform normalized envelope from `moduleActivityService`:

- `actor.userId`
- `action` (canonical string from `businessActivityTaxonomy.ts`)
- `target.type` / `target.id`
- `context.businessId`, `context.dashboardId`, `context.moduleId`
- `visibility.scope` = `business`

## Realtime foundation

`businessConfigRealtimeService.ts` broadcasts `business:config:updated` to `business_{businessId}` via `chatSocketService.broadcastBusinessConfigUpdated`. Safe no-op when socket service is uninitialized (tests, batch).

## AI grounding extension point

Activity metadata uses field names only (no EIN, logo URLs, permission payloads). Future AI context providers can subscribe to:

- `prisma.log` activity feed (`activity:feed:refresh`)
- Domain event bus (`subscribeDomainEvents`)
- `business:config:updated` socket events

## Out of scope (BA-1A)

- Service extraction (BA-1B)
- Policy Engine expansion (BA-1C)
- Notification types (future BA package)
- Location/station mutations (Business Operations / Scheduling)

## Related documents

- [BA_1A_ACTIVITY_TAXONOMY.md](./BA_1A_ACTIVITY_TAXONOMY.md)
- [BA_1A_DOMAIN_EVENT_CATALOG.md](./BA_1A_DOMAIN_EVENT_CATALOG.md)
- [BA_1A_CONFIG_SYNC_CONTRACT.md](./BA_1A_CONFIG_SYNC_CONTRACT.md)
