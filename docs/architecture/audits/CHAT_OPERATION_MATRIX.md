# Chat Operation Matrix

**Module id:** `chat`  
**Status:** Phase 1F — HTTP + AI executor service-owned (trash/Global Trash Phase 2)  
**Last updated:** 2026-05-31  
**Related:** [`CHAT_CONSTITUTIONAL_AUDIT.md`](./CHAT_CONSTITUTIONAL_AUDIT.md), [`FILE_HUB_OPERATION_MATRIX.md`](./FILE_HUB_OPERATION_MATRIX.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant with Platform Standards + File Hub patterns |
| **P** | Partial — works but wrong layer or incomplete side effects |
| **N** | Non-compliant or missing |
| **—** | Not applicable |

**Columns:** PE = Policy Engine; RT = Realtime

---

## Permission model (current)

- **Authorization:** `conversationParticipant` row with `isActive: true` (inline Prisma in controller/socket/trash).
- **Dashboard context:** `validateConversationDashboardAccess` on create (business/household/institution membership).
- **Policy Engine:** Pilot on `sendMessage` via `chatPolicyDual` + `CHAT_MESSAGE_CREATE`; reads use `chatVisibilityService` + membership.
- **Target:** Full PE on all mutations; trash via `chatTrashService` (Phase 2).

---

## Master operation matrix

| Operation | Entry point | Controller | Service | PE | Activity | Event | Notification | RT | AI access | Notes |
|-----------|-------------|------------|---------|-----|----------|-------|--------------|----|-----------|-------|
| **List conversations** | `GET /api/chat/conversations` | `getConversations` | `chatVisibilityService` | N | N | N | N | — | `chatVisibilityService` (AI) | `trashedAt: null`; participant scope |
| **Get conversation** | `GET /api/chat/conversations/:id` | `getConversation` | `chatVisibilityService` | N | N | N | N | — | History query | Membership + trashed filter |
| **Create conversation** | `POST /api/chat/conversations` | `createConversation` | `chatConversationService` | N | P | N | N | — | `create_conversation` via `chatAIActionService` | Activity on create; no domain event yet |
| **Search users (chat)** | `GET /api/chat/users/search` | `searchUsersForChat` | `chatUserSearchService` | N | N | N | N | — | — | Invite lookup + connection status |
| **List messages** | `GET /api/chat/conversations/:id/messages` | `getMessages` | `chatVisibilityService` | N | N | N | N | — | History endpoint | Pagination; attachments URL via `chatAttachmentService` |
| **Send message** | `POST /api/chat/conversations/:id/messages` | `createMessage` | `chatMessageService` | P | P | P | P | P | `send_message` via `chatAIActionService` | PE pilot + Drive attachment validation; adapters 1D/1F |
| **Edit message** | — | — | — | — | — | — | — | — | — | **No HTTP API** |
| **Delete message (soft)** | `POST /api/trash/items` type `message` | — (`trashController`) | `chatTrashService` | N | P | N | N | P | — | `deletedAt`; handler delegate; not in Global Trash list UI |
| **React to message** | `POST /api/chat/messages/:id/reactions` | `addReaction` | `chatMessageService` | N | P | N | P | P | — | HTTP + socket both → `toggleReaction` (1D) |
| **Mark message read** | `POST /api/chat/messages/:id/read` | `markAsRead` | `chatMessageService` | N | P | N | N | P | — | HTTP + socket → `markAsRead`; RT on create |
| **List threads** | `GET /api/chat/conversations/:id/threads` | `getThreads` | `chatThreadService` | N | N | N | N | — | — | Participant gate |
| **Create thread** | `POST /api/chat/conversations/:id/threads` | `createThread` | `chatThreadService` | N | P | N | N | — | — | Activity on create; inline via `ensureThreadForReply` |
| **Thread reply** | `POST .../messages` with `threadId` / `replyToId` | `createMessage` | `chatMessageService` | P | P | P | P | P | — | Same as send message |
| **Mention user** | Embedded in message body | `createMessage` | `chatMessageService` | P | P | P | P | P | — | `chatNotificationService.notifyNewMessage` |
| **Upload attachment** | `POST .../messages` with `fileIds` | `createMessage` | `chatMessageService` | P | P | P | P | P | — | `chatAttachmentService` + Drive PE read validation |
| **Archive conversation** | — | — | — | — | — | — | — | — | — | **Not implemented** |
| **Trash conversation** | `POST /api/trash/items` type `conversation` | — (`trashController`) | `chatTrashService` | N | P | N | N | — | — | Global Trash handler; `trashedAt` |
| **Restore conversation** | `POST /api/trash/restore/:id` | — (`trashController`) | `chatTrashService` | N | P | N | N | — | — | Handler restore |
| **Permanent delete conversation** | Global trash delete | — (`trashController`) | `chatTrashService` | N | P | N | N | — | — | Handler permanent delete; V_Link lifecycle Phase 3+ |
| **Invite member** | — | — | — | — | — | — | — | — | — | **Only at create** (`participantIds`); no add-member API |
| **Remove member** | — | — | — | — | — | — | — | — | — | **Not implemented** (deactivate participant) |
| **Leave conversation** | Socket `leave_conversation` | — | `chatSocketService` | N | N | N | N | P | — | Socket room only |
| **Join conversation room** | Socket `join_conversation` | — | `chatSocketService` | N | N | N | N | P | — | Membership verified |
| **Socket-only message broadcast** | Socket `new_message` | — | `chatSocketService` | N | N | N | N | P | — | Broadcast only; **does not create** DB message |
| **Socket reaction** | Socket `message_reaction` | — | `chatMessageService` | N | P | N | P | P | — | Delegates to `toggleReaction` (1D) |
| **Socket mark read** | Socket `mark_read` | — | `chatMessageService` | N | P | N | N | P | — | Delegates to `markAsRead` (1D) |
| **Typing indicators** | Socket typing events | — | `chatSocketService` | N | N | N | N | P | — | Ephemeral |
| **Chat analytics** | `GET /api/chat/analytics` | `getChatAnalytics` | `chatAnalyticsService` | N | N | N | N | — | — | Participant-scoped aggregates |
| **Federated search (messages)** | Search API | — (`searchController`) | — | N | N | N | N | — | — | `moduleId: 'chat'` provider |
| **Federated search (conversations)** | Search API | — (`searchController`) | — | N | N | N | N | — | — | Same |
| **AI recent context** | `GET /api/chat/ai/context/recent` | `chatAIContextController` | `chatVisibilityService` | N | N | N | N | — | Twin provider | No controller Prisma (1C) |
| **AI unread context** | `GET /api/chat/ai/context/unread` | `chatAIContextController` | `chatVisibilityService` | N | N | N | N | — | Twin provider | No controller Prisma (1C) |
| **AI conversation history** | `GET /api/chat/ai/query/history` | `chatAIContextController` | `chatVisibilityService` | N | N | N | N | — | Twin provider | No controller Prisma (1C) |
| **V_Link resolve conversation** | V_Link API | — | `vlinkEntityResolverService` | N | N | N | N | — | — | `CHAT_CONVERSATION`; checks `trashedAt` |
| **Drive realtime fan-out** | Drive mutations | — | `chatSocketService.broadcastDriveEvent` | — | — | — | — | P | — | Cross-module; not chat domain |

---

## Compliance summary by operation class

| Class | Count (approx.) | C | P | N |
|-------|-----------------|---|---|---|
| HTTP read | 5 | 0 | 5 | 0 |
| HTTP write | 6 | 0 | 6 | 0 |
| Trash (platform controller) | 3 | 0 | 1 | 2 |
| Socket | 6 | 0 | 6 | 0 |
| AI | 5 | 0 | 3 | 2 |
| **Total inventoried** | **25** | **0** | **8** | **17** |

---

## Target state (post–Phase 1–5)

After modernization, each **HTTP write** and **trash** row should show:

- **Service** = named `chat*Service`
- **PE** = `chatPolicyDual` / `authorize()`
- **Activity** = `chatActivityService` → `emitModuleActivityEvent`
- **Event** = registered `chat.*` types from services
- **Notification** = `chatNotificationService`
- **RT** = `chatRealtimeService` → `chatSocketService`

Global Trash operations route through `registerGlobalTrashModuleHandler('chat')` delegating to `chatTrashService` (Phase 2 complete).

---

## Event coverage (current vs target)

| Action | Current event | Target event (proposed) |
|--------|---------------|-------------------------|
| Send message | `chat.message.sent` | `chat.message.sent` (keep) |
| Create conversation | — | `chat.conversation.created` |
| Trash conversation | — | `chat.conversation.trashed` |
| Restore conversation | — | `chat.conversation.restored` |
| Delete message | — | `chat.message.deleted` |
| Add reaction | — | `chat.message.reacted` |
| Create thread | — | `chat.thread.created` |

---

## Notification coverage

| Type | Emitted today | In manifest metadata |
|------|---------------|------------------------|
| `chat_message` | ✅ | ❌ |
| `chat_mention` | ✅ | ❌ |
| `chat_reaction` | ✅ | ❌ |

---

## Realtime coverage

| Operation | Socket event | Membership check |
|-----------|--------------|-------------------|
| Send message (HTTP) | `broadcastMessage` / room emit | ✅ (before persist) |
| Reaction (HTTP) | `message_reaction` | ✅ |
| Reaction (socket only) | `message_reaction` | ✅ |
| Typing | `user_typing` | ✅ |

---

## Phase 0 gaps (P0 for Phase 1 planning)

1. Consolidate HTTP + socket write paths into services (eliminate duplicate reaction/read).
2. Register chat Global Trash handler; move logic out of `trashController` switch cases.
3. Add `chatNotificationService`; remove inline notification blocks from controller.
4. Add `chatVisibilityService` for list/get/search/AI reads.
5. Implement `chatPolicyDual` and PE actions.
6. Extend domain event registry + emitters for conversation/thread/trash.
7. Fix `ActionExecutor` to call services, not controllers.
8. Add manifest `notifications[]` and `entities[]`.
9. Validate `fileIds` on send via `driveVisibilityService` / PE.

---

## Document maintenance

Update this matrix when:

- New routes are added or removed
- Operations move from controller to services (mark row **C**)
- Phase completes (reference PR in changelog)

---

*End of Chat Operation Matrix — Phase 0.*
