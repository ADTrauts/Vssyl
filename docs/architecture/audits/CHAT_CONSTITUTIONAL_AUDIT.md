# Chat Constitutional Audit

**Module id:** `chat`  
**Audit date:** 2026-05-31  
**Phase:** Wave 1 — Phase 0 (audit only; no code changes)  
**Auditors:** Platform governance (repository evidence)

**Authorities:**

- Constitutional: [`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)
- Implementation patterns: [`MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)
- Reference module: File Hub (`drive`) — Level 4

**Companion:** [`CHAT_OPERATION_MATRIX.md`](./CHAT_OPERATION_MATRIX.md)

---

## Executive summary

Chat is **functionally mature** (realtime, notifications, AI context, federated search, partial V_Link resolver) but **architecturally Legacy (Level 0)** per [`CERTIFICATION_LEDGER.md`](../CERTIFICATION_LEDGER.md). The module violates §16 service boundaries: a single ~1,663-line controller holds ~41 direct Prisma calls, owns notifications/events/activity, and duplicates logic with `chatSocketService`. Global Trash is **partial**: UI and `trashController` soft-trash conversations/messages via inline Prisma, but **no** `registerGlobalTrashModuleHandler` for `chat`. Policy Engine is **not** used; membership checks are inline only.

**Recommendation:** Proceed with Wave 1 Chat modernization (Phase 1 service extraction). Chat remains the correct Wave 1 target due to cross-cutting realtime/notification/trash surface area.

**Reference Module #2 verdict:** **Possible** — strong realtime and notification product fit, but not ready until service boundaries, PE, trash handler, and AI routing match File Hub.

---

## 1. Current architecture

### 1.1 Controllers

| File | Lines (approx.) | Role |
|------|-----------------|------|
| `server/src/controllers/chatController.ts` | ~1,663 | All HTTP mutations and reads for conversations, messages, threads, reactions, read receipts, user search, analytics |
| `server/src/controllers/chatAIContextController.ts` | ~334 | AI context providers (`/api/chat/ai/context/*`, `/api/chat/ai/query/history`) — direct Prisma |

**Exported HTTP handlers (`chatController.ts`):** `searchUsersForChat`, `getConversations`, `getConversation`, `createConversation`, `getMessages`, `createMessage`, `addReaction`, `markAsRead`, `getThreads`, `createThread`, `getChatAnalytics`.

### 1.2 Routes

`server/src/routes/chat.ts` — mounted at `/api/chat`:

| Method | Path | Handler |
|--------|------|---------|
| GET | `/conversations` | `getConversations` |
| GET | `/conversations/:id` | `getConversation` |
| POST | `/conversations` | `createConversation` |
| GET | `/conversations/:conversationId/messages` | `getMessages` |
| POST | `/conversations/:conversationId/messages` | `createMessage` |
| POST | `/messages/:messageId/reactions` | `addReaction` |
| POST | `/messages/:messageId/read` | `markAsRead` |
| GET | `/conversations/:conversationId/threads` | `getThreads` |
| POST | `/conversations/:conversationId/threads` | `createThread` |
| GET | `/users/search` | `searchUsersForChat` |
| GET | `/analytics` | `getChatAnalytics` |
| GET | `/ai/context/recent` | `getRecentConversationsContext` |
| GET | `/ai/context/unread` | `getUnreadMessagesContext` |
| GET | `/ai/query/history` | `getConversationHistory` |

**Not exposed via HTTP (gap):** archive/delete/restore conversation; edit/delete message API (client uses Global Trash); invite/remove participant endpoints; dedicated mention API.

### 1.3 Services

| File | Role |
|------|------|
| `server/src/services/chatSocketService.ts` | Socket.IO transport: rooms, typing, `new_message` broadcast, reaction/read persistence on socket path, drive event broadcast helper |
| `server/src/services/todoChatIntegrationService.ts` | Cross-module todo↔chat (not core chat domain) |

**Missing (File Hub target):** `chatConversationService`, `chatMessageService`, `chatThreadService`, `chatPermissionService`, `chatVisibilityService`, `chatAttachmentService`, `chatActivityService`, `chatNotificationService`, `chatRealtimeService`, `chatDeleteService`.

### 1.4 Socket systems

- Entry: `chatSocketService` (singleton via `getChatSocketService()`).
- Membership guards: `assertActiveConversationMember`, `assertMessageConversationMember`, `joinConversationIfMember`.
- Events: `join_conversation`, `leave_conversation`, `new_message`, `message_reaction`, `mark_read`, typing, business/schedule rooms, `broadcastDriveEvent`.
- **Drift:** Socket `handleNewMessage` updates `lastMessageAt` and broadcasts but does **not** create messages (HTTP `createMessage` is canonical persist path). Socket `handleMessageReaction` / `handleMarkAsRead` **do** write Prisma — parallel to HTTP handlers.

### 1.5 Notification systems

- **Creation:** `NotificationService.handleNotification` inline in `chatController` (`createMessage`, `addReaction`) — types `chat_message`, `chat_mention`, `chat_reaction`.
- **Discovery:** Types mapped in `web/src/app/notifications/page.tsx` and `notificationGroupingService.ts`.
- **Manifest:** `builtInModuleManifests.ts` case `chat` sets `notifications: true` but **no** `notifications[]` metadata block (unlike `drive`).

### 1.6 AI integrations

| Surface | Path | Issue |
|---------|------|-------|
| Context providers | `chatAIContextController.ts` | Direct Prisma; no `chatVisibilityService` |
| Twin registration | `registerBuiltInModules.ts` | Rich `ModuleAIContext` + provider endpoints |
| Action executor | `ActionExecutor.executeChatAction` | Imports `createMessage` / `createConversation` from **controller** via mock req/res (`any`) — violates Pattern 12 |

### 1.7 Activity systems

- `emitModuleActivityEvent` in controller: `createMessage` (`message`), `addReaction` (`react`/`unreact`), `markAsRead` (`read`).
- **Gaps:** `createConversation`, `createThread`, trash operations — no normalized activity.

### 1.8 Domain events

- Registry: `chat.message.sent` only (`domainEventRegistry.ts`).
- Emitter: `emitChatMessageSentEvent` from `createMessage` only.
- **Gaps:** conversation created, thread created, reaction, read, trash, restore.

### 1.9 Trash handling

| Layer | Behavior |
|-------|----------|
| Schema | `Conversation.trashedAt`; `Message.deletedAt` (not `trashedAt`) |
| UI | `ChatLeftPanel`, `ChatMainPanel` call `useGlobalTrash().trashItem` with `moduleId: 'chat'` |
| API | `trashController.trashItem` — inline Prisma for `conversation` / `message` types (no module handler) |
| Handler registry | **Not registered** in `registerGlobalTrashHandlers.ts` (drive only) |
| List | `trashController` list includes chat conversations/messages via direct queries |

### 1.10 Manifest declarations

`builtInModuleManifests.ts` case `chat`:

- Permissions: `chat:read`, `chat:write`
- Capabilities: `read`, `write`, `ai`, `trash`, `realtime`, `notifications`, `search`, `businessWorkspace`, `globalActivity`
- Routes: `/chat`
- **Missing:** `entities[]`, `notifications[]`

### 1.11 Platform entities

- **Not registered** in `platformEntityRegistry.ts`.
- V_Link resolver: `VLinkEntityType.CHAT_CONVERSATION` in `vlinkEntityResolverService.ts` (membership + `trashedAt: null`).

### 1.12 Other integrations

- **Search:** `searchController` — chat message and conversation providers (`moduleId: 'chat'`).
- **Business workspace:** `BusinessWorkspaceContent.tsx` case `'chat'`.
- **Tests:** `server/src/routes/__tests__/chat-create-conversation.integration.test.ts`, `chatCalendarDomainEvents.test.ts`, AI context tests.

---

## 2. Constitutional compliance review

| Area | Status | Evidence / notes |
|------|--------|------------------|
| **Module Contract** (§3) | 🔴 | Order violated: controller emits activity/events/notifications alongside Prisma; not service-owned |
| **Policy Engine** (§4) | 🔴 | No `chatPolicyDual`; participant `findFirst` only |
| **Global Trash** (§7) | 🟡 | `trashedAt` on conversation; trash via `trashController` inline Prisma; no module handler; messages use `deletedAt` |
| **V_Link** (§5) | 🟡 | Resolver for `CHAT_CONVERSATION` only; no lifecycle service; manifest implies broader vlink pending |
| **Notifications** (§3) | 🟡 | Central service used; no adapter; manifest metadata missing |
| **Domain Events** (§8) | 🟡 | Single event type; controller-emitted |
| **Module Activity** (§3) | 🟡 | Partial writes on 3 operations only |
| **Scheduler** (§22) | 🟢 | No chat-specific cron identified (N/A for core chat) |
| **AI Compliance** (§6) | 🔴 | Context Prisma-direct; executor calls controller |
| **Platform Entities** (§21) | 🔴 | No registry descriptors |
| **Capability truthfulness** (§19) | 🟡 | `trash`/`search`/`globalActivity` partially true; `vlink` incomplete vs resolver |

**Overall constitutional compliance:** **Low** (Level 0)

---

## 3. File Hub pattern review (Patterns 1–15)

| Pattern | Status | Gap |
|---------|--------|-----|
| **1 Canonical service boundary** | 🔴 | No domain services; controller owns pipeline |
| **2 Thin controllers** | 🔴 | ~1,663 lines; ~41 `prisma.` calls |
| **3 Canonical delete lifecycle** | 🔴 | Trash in `trashController`; no `chatDeleteService`; no PE/activity/events on trash |
| **4 Visibility service** | 🔴 | Lists/reads use raw Prisma + participant check |
| **5 Global Trash pattern** | 🔴 | No handler registration; split message `deletedAt` vs conversation `trashedAt` |
| **6 Notification adapter** | 🔴 | Inline `NotificationService` in controller |
| **7 Domain events** | 🔴 | One event; controller emission |
| **8 Module activity** | 🟡 | Three actions only; controller-owned |
| **9 Realtime pattern** | 🟡 | Socket service mixes transport + Prisma writes |
| **10 Policy Engine** | 🔴 | No PolicyDual |
| **11 V_Link pattern** | 🟡 | Resolver only; no access/lifecycle services |
| **12 AI compliance** | 🔴 | Executor → controller; AI context → Prisma |
| **13 Platform entity** | 🔴 | Not registered |
| **14 Capability matrix** | 🟡 | Incomplete manifest blocks |
| **15 Certification process** | 🟡 | Phase 0 audit complete; not certified |

**Overall File Hub compliance:** **Low**

### Missing services (summary)

- All nine planned `chat*Service` modules from modernization roadmap.
- `chatPolicyDual.ts`.
- Global Trash handler registration.

### Missing lifecycles

- Service-owned soft trash / restore / permanent delete with activity, events, notifications, realtime, V_Link.
- Conversation create → domain event + activity.
- Message delete/edit (if product-required) via service.

### Missing adapters

- `chatNotificationService`, `chatRealtimeService`, `chatActivityService`, `chatVlinkAccessService`, `chatVlinkLifecycleService`.

### Missing registrations

- `registerGlobalTrashModuleHandler({ moduleId: 'chat' })`.
- `platformEntityRegistry` entries for conversation/message.
- Manifest `notifications[]` and `entities[]`.

---

## 4. Architectural drift

| Drift item | Severity | Location |
|------------|----------|----------|
| Fat controller | **Critical** | `chatController.ts` |
| Direct Prisma in controller | **Critical** | All mutation/read paths |
| Duplicate reaction/read paths | **High** | HTTP `addReaction` / `markAsRead` vs socket handlers |
| Trash bypasses module services | **High** | `trashController.ts` cases `conversation`, `message` |
| AI executor → controller | **High** | `ActionExecutor.executeChatAction` |
| AI context unscoped reads | **Medium** | `chatAIContextController.ts` (no visibility service) |
| No PE enforcement | **High** | All routes |
| Manifest capability lies | **Medium** | `trash`/`vlink` vs implementation |
| `createConversation` no activity/event | **Medium** | Missing audit trail |
| File attachment URLs built in controller | **Low** | `BACKEND_URL` concat in `createMessage` |
| `getChatAnalytics` separate auth path | **Low** | Email lookup vs `getUserFromRequest` elsewhere |

---

## 5. Reference module assessment (Reference Module #2?)

| Area | Status | Notes |
|------|--------|-------|
| Service boundaries | 🔴 | Primary blocker |
| Realtime | 🟢 | Strong socket membership model |
| Notifications | 🟡 | Works; needs adapter + manifest |
| Policy Engine | 🔴 | Not started |
| Global Trash | 🟡 | Partial platform integration |
| V_Link | 🟡 | Resolver exists; no lifecycle |
| Platform entities | 🔴 | Not registered |
| Domain events | 🔴 | Minimal taxonomy |
| AI compliance | 🔴 | Executor anti-pattern |
| Certification readiness | 🔴 | Level 0 |

### Conclusion

**Possible** (not **Strong Candidate** yet).

Chat could become Reference Module #2 **after** Wave 1 modernization because it exercises realtime, notifications, mentions, threads, cross-module file attachments, and V_Link conversations — patterns other modules need. It is **not Ready** today: controller mass and trash/PE gaps block certification.

File Hub remains the sole Level 4 module until Chat reaches Level 3 with documented parity to Patterns 1–15.

---

## 6. Phase 0 exit criteria

| Criterion | Met |
|-----------|-----|
| Architecture inventory complete | ✅ |
| Constitutional review complete | ✅ |
| File Hub pattern review (1–15) | ✅ |
| Operation matrix published | ✅ ([`CHAT_OPERATION_MATRIX.md`](./CHAT_OPERATION_MATRIX.md)) |
| Ledger wave 1 → audit | ✅ (update ledger manually on merge) |
| No code changes | ✅ |

**Phase 1A authorized:** Service extraction **design** — [`CHAT_SERVICE_EXTRACTION_PLAN.md`](./CHAT_SERVICE_EXTRACTION_PLAN.md).

**Phase 1B+ authorized after plan approval:** Canonical service **implementation** per extraction waves in plan.

---

## Appendix — Key file index

| Path |
|------|
| `server/src/controllers/chatController.ts` |
| `server/src/controllers/chatAIContextController.ts` |
| `server/src/routes/chat.ts` |
| `server/src/services/chatSocketService.ts` |
| `server/src/controllers/trashController.ts` (chat cases) |
| `server/src/services/vlinkEntityResolverService.ts` |
| `server/src/startup/builtInModuleManifests.ts` |
| `server/src/ai/core/ActionExecutor.ts` |
| `prisma/modules/chat/conversations.prisma` |
| `web/src/app/chat/ChatLeftPanel.tsx`, `ChatMainPanel.tsx` |
