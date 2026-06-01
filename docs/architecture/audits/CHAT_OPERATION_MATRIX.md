# Chat Operation Matrix

**Module id:** `chat`  
**Status:** Wave 1 complete — Level 3 Certified ([CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./CHAT_LEVEL3_CERTIFICATION_REVIEW.md))  
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
- **Policy Engine:** `chatPolicyDual` on mutations, trash, and reads (incl. browse/list/search/AI via `conversationPassesReadPolicy`).
- **Trash:** `chatTrashService` + Global Trash handler (conversation + message types).

---

## Master operation matrix

| Operation | Entry point | Controller | Service | PE | Activity | Event | Notification | RT | AI access | Notes |
|-----------|-------------|------------|---------|-----|----------|-------|--------------|----|-----------|-------|
| **List conversations** | `GET /api/chat/conversations` | `getConversations` | `chatVisibilityService` | C | N | N | N | — | `chatVisibilityService` (AI) | Participant + PE post-filter (Phase 5) |
| **Get conversation** | `GET /api/chat/conversations/:id` | `getConversation` | `chatVisibilityService` | C | N | N | N | — | History query | PE read + trashed filter |
| **Create conversation** | `POST /api/chat/conversations` | `createConversation` | `chatConversationService` | C | C | C | N | — | `create_conversation` via `chatAIActionService` | PE + activity + domain event |
| **Search users (chat)** | `GET /api/chat/users/search` | `searchUsersForChat` | `chatUserSearchService` | N | N | N | N | — | — | Invite lookup + connection status |
| **List messages** | `GET /api/chat/conversations/:id/messages` | `getMessages` | `chatVisibilityService` | C | N | N | N | — | History endpoint | PE read + pagination |
| **Send message** | `POST /api/chat/conversations/:id/messages` | `createMessage` | `chatMessageService` | C | C | C | C | C | `send_message` via `chatAIActionService` | Full adapter stack |
| **Edit message** | — | — | — | — | — | — | — | — | — | **No HTTP API** |
| **Delete message (soft)** | `POST /api/trash/items` type `message` | — (`trashController`) | `chatTrashService` | C | C | C | N | P | — | `deletedAt`; not in Global Trash list UI |
| **React to message** | `POST /api/chat/messages/:id/reactions` | `addReaction` | `chatMessageService` | C | C | C | C | C | — | Domain event on add only |
| **Mark message read** | `POST /api/chat/messages/:id/read` | `markAsRead` | `chatMessageService` | C | C | C | N | C | — | Domain event on new receipt |
| **List threads** | `GET /api/chat/conversations/:id/threads` | `getThreads` | `chatThreadService` | C | N | N | N | — | — | PE read (Phase 5) |
| **Create thread** | `POST /api/chat/conversations/:id/threads` | `createThread` | `chatThreadService` | C | C | N | N | — | — | Activity; thread domain event deferred |
| **Thread reply** | `POST .../messages` with `threadId` / `replyToId` | `createMessage` | `chatMessageService` | P | P | P | P | P | — | Same as send message |
| **Mention user** | Embedded in message body | `createMessage` | `chatMessageService` | P | P | P | P | P | — | `chatNotificationService.notifyNewMessage` |
| **Upload attachment** | `POST .../messages` with `fileIds` | `createMessage` | `chatMessageService` | P | P | P | P | P | — | `chatAttachmentService` + Drive PE read validation |
| **Archive conversation** | — | — | — | — | — | — | — | — | — | **Not implemented** |
| **Trash conversation** | `POST /api/trash/items` type `conversation` | — (`trashController`) | `chatTrashService` | C | C | C | N | — | — | Global Trash handler |
| **Restore conversation** | `POST /api/trash/restore/:id` | — (`trashController`) | `chatTrashService` | C | C | C | N | — | — | Handler restore |
| **Permanent delete conversation** | Global trash delete | — (`trashController`) | `chatTrashService` | C | C | C | N | — | — | V_Link lifecycle unlink |
| **Invite member** | — | — | — | — | — | — | — | — | — | **Only at create** (`participantIds`); no add-member API |
| **Remove member** | — | — | — | — | — | — | — | — | — | **Not implemented** (deactivate participant) |
| **Leave conversation** | Socket `leave_conversation` | — | `chatSocketService` | N | N | N | N | P | — | Socket room only |
| **Join conversation room** | Socket `join_conversation` | — | `chatSocketService` | N | N | N | N | P | — | Membership verified |
| **Socket-only message broadcast** | Socket `new_message` | — | `chatSocketService` | N | N | N | N | P | — | Broadcast only; **does not create** DB message |
| **Socket reaction** | Socket `message_reaction` | — | `chatMessageService` | N | P | N | P | P | — | Delegates to `toggleReaction` (1D) |
| **Socket mark read** | Socket `mark_read` | — | `chatMessageService` | N | P | N | N | P | — | Delegates to `markAsRead` (1D) |
| **Typing indicators** | Socket typing events | — | `chatSocketService` | N | N | N | N | P | — | Ephemeral |
| **Chat analytics** | `GET /api/chat/analytics` | `getChatAnalytics` | `chatAnalyticsService` | N | N | N | N | — | — | Participant-scoped aggregates |
| **Federated search (messages)** | Search API | — (`searchController`) | `searchAccessibleChat` | C | N | N | N | — | — | PE per conversation in results |
| **Federated search (conversations)** | Search API | — (`searchController`) | `searchAccessibleChat` | C | N | N | N | — | — | Same |
| **AI recent context** | `GET /api/chat/ai/context/recent` | `chatAIContextController` | `chatVisibilityService` | C | N | N | N | — | Twin provider | PE filter (Phase 5) |
| **AI unread context** | `GET /api/chat/ai/context/unread` | `chatAIContextController` | `chatVisibilityService` | C | N | N | N | — | Twin provider | PE filter (Phase 5) |
| **AI conversation history** | `GET /api/chat/ai/query/history` | `chatAIContextController` | `chatVisibilityService` | C | N | N | N | — | Twin provider | PE read (Phase 5) |
| **V_Link resolve conversation** | V_Link API | — | `chatVlinkAccessService` | C | N | N | N | — | — | Participant + PE; trashed/deleted restricted |

---

## Platform entity registration (Phase 4)

| Entity | Registry | Manifest | V_Link enum | Notes |
|--------|----------|----------|-------------|-------|
| `conversation` | ✅ `chat:conversation` | ✅ | `CHAT_CONVERSATION` | Trash + search + activity target |
| `message` | ❌ deferred | ❌ | — | In-chat lifecycle only (`deletedAt`); no V_Link resolver |
| `thread` | ❌ deferred | ❌ | `CHAT_THREAD` enum exists | No access adapter; do not link until implemented |
| **Drive realtime fan-out** | Drive mutations | — | `chatSocketService.broadcastDriveEvent` | — | — | — | — | P | — | Cross-module; not chat domain |

---

## Compliance summary by operation class

| Class | Count (approx.) | C | P | N |
|-------|-----------------|---|---|---|
| HTTP read | 5 | 5 | 0 | 0 |
| HTTP write | 6 | 6 | 0 | 0 |
| Trash (platform controller) | 3 | 3 | 0 | 0 |
| Socket | 6 | 0 | 6 | 0 |
| AI | 5 | 4 | 1 | 0 |
| **Total inventoried** | **25** | **18** | **7** | **0** |

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

## Event coverage (Wave 1 Phase 3)

| Action | Domain event | Emit site |
|--------|--------------|-----------|
| Send message | `chat.message.sent` | `chatMessageService` |
| Create conversation | `chat.conversation.created` | `chatConversationService` |
| Trash conversation | `chat.conversation.trashed` | `chatTrashService` |
| Restore conversation | `chat.conversation.restored` | `chatTrashService` |
| Permanent delete conversation | `chat.conversation.permanentlyDeleted` | `chatTrashService` |
| Trash message | `chat.message.deleted` (soft) | `chatTrashService` |
| Restore message | `chat.message.restored` | `chatTrashService` |
| Permanent delete message | `chat.message.permanentlyDeleted` | `chatTrashService` |
| Add reaction | `chat.message.reactionAdded` | `chatMessageService` |
| Mark read (new receipt) | `chat.message.read` | `chatMessageService` |

---

## Notification coverage

| Type | Emitted today | In manifest metadata |
|------|---------------|------------------------|
| `chat_message` | ✅ | ✅ |
| `chat_mention` | ✅ | ✅ |
| `chat_reaction` | ✅ | ✅ |

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

*End of Chat Operation Matrix — Level 3 Certified (Wave 1).*
