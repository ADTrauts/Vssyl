# Domain events vs module activity events

Short reference for server-side emission after **successful** mutations only. Failed requests must not emit.

## When to use `emitModuleActivityEvent`

Use **`emitModuleActivityEvent`** (`server/src/services/moduleActivityService.ts`) when the action belongs to the **module interoperability contract**: a specific **`moduleId`**, user-visible activity in the dashboard feed aggregation, and the existing normalized envelope (actor, target, parent, context, visibility).

It:

- Persists a log row with **`operation: 'module_activity_event'`** (feed and tooling expect this shape).
- Triggers **`activity:feed:refresh`** on the actor’s socket so clients can reload the activity feed.

Prefer this for **first-party module** actions that should appear consistently alongside Drive/Chat normalized activity (see `memory-bank/moduleSpecs.md` and module development rules).

## When to use `emitDomainEvent`

Use **`emitDomainEvent`** (`server/src/events/emitDomainEvent.ts`) for **cross-cutting platform facts** that should fan out without coupling call sites to Prisma logs, sockets, or future consumers (notifications, analytics, AI memory). Call **`registerDomainEventSubscribers()`** once at startup (already wired in `server/src/index.ts` after Socket.IO init).

It:

- Persists a separate log row with **`operation: 'domain_event_recorded'`** (distinct from `module_activity_event`).
- Runs **placeholder** subscribers for notifications and analytics (`logger.debug` today — no recipient wiring yet).
- Broadcasts a **platform-level** socket event (see below).

Use explicit **`metadata`** (e.g. `moduleId` when relevant); avoid putting secrets or large payloads in events. Emit **only after** the mutation succeeds (same rule as module activity).

## Coexistence

You may use **both** on the same code path if a single user action is both a **module-certified activity** and a **platform domain event**—but avoid duplicate semantics; prefer **one** primary emission unless product requires both feeds.

## Socket: `platform:domain_event`

**Event name:** `platform:domain_event`  
**Delivery:** `broadcastToUser(actorUserId, ...)` — only the **actor** receives the payload (same pattern as other user-scoped realtime updates).

**Payload** (fields omitted when not set on the domain event):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Domain event id (e.g. `evt_…`) |
| `type` | string | Event type (caller-defined, e.g. `user.preference.updated`) |
| `action` | string | Verb (e.g. `update`, `create`) |
| `entityType` | string | Domain entity name |
| `entityId` | string | Entity identifier |
| `dashboardId` | string \| undefined | Dashboard scope when provided |
| `businessId` | string \| undefined | Business scope when provided |
| `householdId` | string \| undefined | Household scope when provided |
| `createdAt` | string | ISO 8601 timestamp |

**Not** included on the wire: full `metadata` (use logs or future APIs if clients need detail). Extend the subscriber intentionally if a stable client contract requires more fields.

**Implementation:** `server/src/events/subscribers/socketDomainEventSubscriber.ts`.
