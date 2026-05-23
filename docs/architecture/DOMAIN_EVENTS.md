# Domain events vs module activity events

Server-side emission **only after successful mutations**. Failed or unauthorized requests must **not** emit.

**Agent rules:** `domain-events.mdc`, `module-interoperability.mdc`

## When to use `emitModuleActivityEvent`

Use **`emitModuleActivityEvent`** (`server/src/services/moduleActivityService.ts`) when the action belongs to the **module interoperability contract**:

- Specific **`moduleId`**
- User-visible activity in dashboard feed aggregation
- Normalized envelope (actor, target, parent, context, visibility) per `memory-bank/moduleSpecs.md`

Effects:

- Persists **`operation: 'module_activity_event'`**
- Triggers **`activity:feed:refresh`** on the actor’s socket

Prefer for **first-party module** actions that must appear alongside Drive/Chat normalized activity.

## When to use `emitDomainEvent`

Use **`emitDomainEvent`** (`server/src/events/emitDomainEvent.ts`) for **cross-cutting platform facts** that should fan out without coupling call sites to every consumer (activity log, sockets, future notifications, analytics, AI memory).

Call **`registerDomainEventSubscribers()`** once at startup (`server/src/index.ts` after Socket.IO init). Registration is **idempotent**.

Effects:

- Persists **`operation: 'domain_event_recorded'`** (distinct from module activity)
- Runs in-process subscribers (see below)
- Broadcasts **`platform:domain_event`** to the **actor only**

Use typed helpers in **`server/src/events/domainEventEmitters.ts`** and constants from **`DOMAIN_EVENT_TYPES`** in **`server/src/events/domainEventRegistry.ts`** — do not use raw string literals for registered types at emit sites.

`emitDomainEvent` and `buildTypedDomainEventInput` run **`sanitizeDomainEventMetadata`** (global + per-contract disallowed keys) before publish.

## Taxonomy registry (DE-Q1)

| Constant | Type string | entityType | action | Adopted |
|----------|-------------|------------|--------|---------|
| `USER_PREFERENCE_UPDATED` | `user.preference.updated` | UserPreference | update | Yes — `userController` |
| `MODULE_INSTALLED` | `module.installed` | ModuleInstallation | install | Yes — `moduleProvisionController.installModule` |
| `MODULE_UNINSTALLED` | `module.uninstalled` | ModuleInstallation | uninstall | Yes — `moduleProvisionController.uninstallModule` |
| `BUSINESS_MEMBER_ADDED` | `business.member.added` | BusinessMember | add | Yes — `businessController.acceptInvitation` |
| `MODULE_ENABLED` / `MODULE_DISABLED` | `module.enabled` / `module.disabled` | ModuleInstallation | enable / disable | Yes — `moduleProvisionController.configureModule` when `enabled` toggles |
| `BUSINESS_MEMBER_REMOVED` | `business.member.removed` | BusinessMember | remove | Yes — `businessController.removeBusinessMember`, `memberController.removeEmployee` |
| `BUSINESS_UPDATED` | `business.updated` | Business | update | Yes — `businessController.updateBusiness`, `uploadLogo`, `removeLogo` |
| `FILE_UPLOADED` | `file.uploaded` | File | create | Yes — `fileController.uploadFile` (after `prisma.file.create`) |
| `FILE_DELETED` | `file.deleted` | File | delete | Yes — `fileController.deleteFile` (after soft-delete) |
| `FILE_SHARED` | `file.shared` | File | share | Yes — `fileController.grantFilePermission` |
| `FOLDER_SHARED` | `folder.shared` | Folder | share | Yes — `folderPermissionController.grantFolderPermission` |
| `CHAT_MESSAGE_SENT` | `chat.message.sent` | Message | send | Yes — `chatController.createMessage` (after `prisma.message.create`) |
| `CALENDAR_EVENT_CREATED` | `calendar.event.created` | CalendarEvent | create | Yes — `calendarController.createEvent` (after `prisma.event.create`) |
| `FILE_MOVED`, `FOLDER_CREATED` | see registry | per contract | per contract | Deferred |

Full contracts (version, description, `recommendedMetadataFields`, `disallowedMetadataFields`) live in **`DOMAIN_EVENT_CONTRACTS`**.

### Adoption guidance

1. Add or extend a contract in `domainEventRegistry.ts` before emitting a new type.
2. Add a small helper in `domainEventEmitters.ts` when the path will be reused.
3. Call the helper **only after** DB mutation succeeds and authorization passes.
4. Keep **`emitModuleActivityEvent`** for feed-visible module actions; domain events are platform/audit/realtime foundation.
5. Do not put secrets, tokens, raw preference values, or large config blobs in `metadata`.

## Subscriber map (current)

| Subscriber | File | Role |
|------------|------|------|
| activity | `subscribers/activityDomainEventSubscriber.ts` | Record to activity log path |
| socket | `subscribers/socketDomainEventSubscriber.ts` | `platform:domain_event` to actor |
| notification_placeholder | `subscribers/notificationDomainEventSubscriber.ts` | Debug placeholder |
| analytics_placeholder | `subscribers/analyticsDomainEventSubscriber.ts` | Debug placeholder |
| **ai_event_consumer** | `ai/consumers/AIEventConsumer.ts` | Learning stubs + ambient suggestion signals (`domain_event`); no auto-exec |

Subscriber failures are logged; they do not roll back the mutation.

## AI consumption (Phase 4A)

`AIEventConsumer` subscribes via `registerDomainEventSubscribers()` and records **idempotent learning stubs** (`LEARNING_SIGNAL_TYPES.DOMAIN_EVENT`) for:

| Domain event | Source module | Notes |
|--------------|---------------|--------|
| `file.uploaded` | drive | Correlation rule `document_upload_v1` + learning stub (Phase 5B) |
| `chat.message.sent` | chat | No message body in event metadata |
| `calendar.event.created` | calendar | Schedule metadata only (no title/description) |
| `module.installed` / `module.enabled` / `module.disabled` | platform | Enable/disable via `PUT /modules/:id/configure` `{ enabled: boolean }` |

**Phase 5B (Ambient contextual assistance):** `SuggestionCorrelationService` records `AISuggestionSignal` rows and evaluates registered rules (`suggestionRules.ts`). `SuggestionRankingService` applies confidence + frequency caps before `ambientSuggestionService` creates `AISuggestion` rows. Processing is **async** from the AI consumer (`scheduleProcessDomainEvent`) so emit sites are not blocked.

The AI consumer **never** calls `emitModuleActivityEvent` and **never** executes autonomous actions.

### Payload schemas (safe metadata)

**`chat.message.sent`**

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `moduleId` | string | yes | Always `chat` |
| `conversationId` | string | yes | Conversation id |
| `threadId` | string | no | When message is in a thread |
| `attachmentCount` | number | no | Count of attached file ids |
| `hasAttachments` | boolean | no | Derived from count |

**`calendar.event.created`**

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `moduleId` | string | yes | Always `calendar` |
| `calendarId` | string | yes | Target calendar |
| `allDay` | boolean | no | All-day flag |
| `startAt` / `endAt` | ISO string | yes | Event window |

**`module.enabled` / `module.disabled`**

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `moduleId` | string | yes | Module id |
| `installationId` | string | yes | Installation row id |
| `installScope` | `personal` \| `business` | yes | Scope |
| `businessId` | string | no | When business-scoped |

## Coexistence

You may use **both** on one code path when the action is both a **module-certified activity** and a **platform domain fact**—but avoid duplicate semantics. Prefer **one primary** emission unless product requires both feeds.

Example (valid): module file share → `emitModuleActivityEvent` for feed; optional `emitDomainEvent` for platform analytics pipeline with different `type`.

Example (avoid): two emissions with the same user-visible meaning in feed and domain log.

## Socket: `platform:domain_event`

**Delivery:** `broadcastToUser(actorUserId, ...)` — actor only.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Domain event id (e.g. `evt_…`) |
| `type` | string | Caller-defined (e.g. `user.preference.updated`) |
| `action` | string | Verb |
| `entityType` | string | Domain entity |
| `entityId` | string | Entity id |
| `dashboardId` | string \| undefined | Scope |
| `businessId` | string \| undefined | Scope |
| `householdId` | string \| undefined | Scope |
| `createdAt` | string | ISO 8601 |

**Not** on the wire: full `metadata`. Extend subscribers deliberately if clients need a stable contract.

**Implementation:** `server/src/events/subscribers/socketDomainEventSubscriber.ts`

## Anti-patterns

- Emitting before DB commit succeeds or before authorization passes.
- Using domain events as a substitute for **module certification** activity when the feed must show the action.
- Storing **analytics aggregates** in domain event payloads instead of derived tables.
- Registering subscribers multiple times (use `registerDomainEventSubscribers` only).
- Broadcasting domain events to rooms without membership proof (socket subscriber is actor-scoped by design).

## Review checklist

- [ ] `authorize → execute → emit` order preserved
- [ ] Correct emitter chosen (module activity vs domain)
- [ ] Tenant ids on event match authorized scope
- [ ] Emit site uses `DOMAIN_EVENT_TYPES` / `domainEventEmitters` helper (not raw type string)
- [ ] Metadata passes sanitization (no disallowed fields)
- [ ] Tests updated (`domainEventRegistry.test.ts`, `domainEventBus.test.ts`, `moduleInstallDomainEvent.test.ts`, `driveDomainEvents.test.ts`)

### Drive adoption (DE-D1, PE-D2)

Emit **only after** DB success and authorization. Safe metadata only: `fileId`, `folderId`, `targetFolderId`, `fileType`, `sizeBytes`, `shareRole`, `recipientUserId`, `softDelete`, `dashboardId` — never file contents, signed URLs, storage paths, or tokens.

| Event | Emit site | Safe metadata |
|-------|-----------|---------------|
| `file.uploaded` | `uploadFile` | `folderId`, `fileType`, `fileName`, `sizeBytes`, `dashboardId` |
| `file.deleted` | `deleteFile` | `folderId`, `softDelete` |
| `file.shared` | `grantFilePermission` | `recipientUserId`, `shareRole` (`read` / `write` / `read_write`) |
| `folder.shared` | `grantFolderPermission` | `recipientUserId`, `shareRole` |

`emitModuleActivityEvent` remains on these paths for module feed visibility.

**Last updated:** 2026-05-21 (Phase 4A — chat/calendar/module enable-disable adoption + AI consumer)
