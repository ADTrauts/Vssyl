# Chat Level 3 Certification Review

**Module id:** `chat`  
**Date:** 2026-05-31  
**Phase:** Wave 1 Phase 5 — Certification closeout  
**Benchmark:** File Hub (`drive`) — [FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md](./FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md)  
**Authorities:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

## Executive summary

Chat Wave 1 modernization satisfies **Level 3 — Certified** against the constitutional checklist and File Hub pattern catalog. Remaining gaps are **documented partials** (socket transport PE, message `deletedAt` field, message/thread platform entities) that do not block certification and mirror acceptable File Hub partials (activity read migration, workspace hub).

**Reference Module #2:** Chat is designated **Reference Module #2 (Level 3)** for pattern adoption by Calendar/Todo/Notes. It is **not** Level 4 Reference Implementation; File Hub remains the sole Level 4 authority until a Chat reference review receives architecture council sign-off.

---

## Level 3 gate review

| Gate | Status | Evidence |
|------|--------|----------|
| **Canonical Service Boundaries** | 🟢 | `chatConversationService`, `chatMessageService`, `chatThreadService`, `chatTrashService`, `chatVisibilityService`, `chatAttachmentService`, `chatAIActionService`, adapters (`chatActivityService`, `chatNotificationService`, `chatRealtimeService`, `chatDomainEventService`) |
| **Thin Controllers** | 🟢 | `chatController.ts` — zero Prisma; contract test `chatController.contract.test.ts` |
| **Policy Engine** | 🟢 | `chatPolicyDual` + `policyEngine` chat actions on mutations, trash, reads (incl. browse/list/search/AI Phase 5) |
| **Global Trash** | 🟢 | `chatTrashService`; `registerGlobalTrashHandlers` `moduleId: 'chat'`; conversations in Global Trash UI |
| **Visibility Services** | 🟢 | `chatVisibilityService` — list/get/messages/search/AI; participant scope + `trashedAt: null` + PE read filter |
| **Domain Events** | 🟢 | Registered `chat.conversation.*`, `chat.message.*`; service-owned via `chatDomainEventService` |
| **Module Activity** | 🟢 | `chatActivityService` on all meaningful writes (see activity matrix below) |
| **Notifications** | 🟢 | `chatNotificationService`; manifest `chat_message`, `chat_mention`, `chat_reaction` |
| **Realtime** | 🟢 | `chatRealtimeService`; socket delegates reaction/read to `chatMessageService` |
| **AI Compliance** | 🟢 | `chatAIActionService`; `ActionExecutor` → services; AI context via `chatVisibilityService` |
| **Platform Entity Registration** | 🟢 | `registerChatPlatformEntities` — `chat:conversation` |
| **V_Link Participation** | 🟢 | `chatVlinkAccessService` + `chatVlinkLifecycleService`; manifest `vlink: true` (conversation only) |
| **Manifest Truthfulness** | 🟢 | Capabilities match runtime; no aspirational notification/entity types |
| **Tests** | 🟢 | Service, PE, trash, visibility, V_Link, manifest, domain event, controller contract suites |
| **Documentation** | 🟢 | Constitutional audit, operation matrix, global trash phase doc, this review |

**Certification decision:** **Level 3 Certified** (2026-05-31)

---

## Constitutional / pattern violations (residual)

| Item | Severity | Status | Notes |
|------|----------|--------|-------|
| Message soft-delete uses `deletedAt` not `trashedAt` | Low | 🟡 Accepted | Documented in [CHAT_GLOBAL_TRASH_PHASE2.md](./CHAT_GLOBAL_TRASH_PHASE2.md); not in Global Trash hub |
| Socket join/leave/typing without PE | Low | 🟡 Accepted | Membership verified; ephemeral transport; writes delegate to services |
| `CHAT_THREAD` enum without platform entity | Low | 🟡 Deferred | No linkable thread adapter |
| Message platform entity | Low | 🟡 Deferred | In-chat lifecycle only |
| Thread domain event | Low | 🟡 Deferred | Activity only; thread is sub-resource |
| Federated search in `searchController` | Low | 🟡 | Provider calls `searchAccessibleChat` (visibility-owned) |
| No dedicated `ChatWorkspaceLanding.tsx` hub | Low | 🟡 | Same class as File Hub P3 WS-R1 partial |

No **🔴** blockers remain for Level 3.

---

## Browse / list Policy Engine (Phase 5)

| Surface | PE enforcement | Trashed exclusion | Deleted fail-closed |
|---------|----------------|-------------------|---------------------|
| `listAccessibleConversations` | Post-query `filterConversationsByReadPolicy` | `trashedAt: null` in WHERE | Row absent after delete |
| `getConversationIfAccessible` | `CHAT_CONVERSATION_READ` dual | `activeParticipantFilter` | 404 / null |
| `listAccessibleMessages` | PE + participant | `deletedAt: null` on messages | N/A |
| `searchAccessibleChat` | PE per result conversation | Query filters trashed | Skipped if policy denies |
| `getRecentForAI` / `getUnreadForAI` | Post-query PE filter | Participant + trashed filter | Filtered out |
| `getHistoryForAI` | PE + participant | Message `deletedAt: null` | 403 if PE denies |
| `listThreads` | `CHAT_CONVERSATION_READ` dual | Via conversation access | 403 if denied |

Implementation: `conversationPassesReadPolicy`, `filterConversationsByReadPolicy` in `chatVisibilityService.ts`.

Tests: `chatVisibilityService.test.ts` (list filter, policy deny).

---

## Activity vs domain event coverage

| Operation | Module activity | Domain event | Notes |
|-----------|---------------|--------------|-------|
| Create conversation | ✅ `conversation_created` | ✅ `chat.conversation.created` | |
| Trash conversation | ✅ `conversation_trashed` | ✅ `chat.conversation.trashed` | |
| Restore conversation | ✅ `conversation_restored` | ✅ `chat.conversation.restored` | |
| Permanent delete conversation | ✅ `conversation_deleted` | ✅ `chat.conversation.permanentlyDeleted` | |
| Send message | ✅ `message` | ✅ `chat.message.sent` | |
| Trash message | ✅ `message_trashed` | ✅ `chat.message.deleted` | soft |
| Restore message | ✅ `message_restored` | ✅ `chat.message.restored` | |
| Permanent delete message | ✅ `message_deleted` | ✅ `chat.message.permanentlyDeleted` | parentId fixed Phase 5 |
| Add reaction | ✅ `react` | ✅ `chat.message.reactionAdded` | remove = `unreact`, no domain event |
| Mark read (new) | ✅ `read` | ✅ `chat.message.read` | idempotent skip if receipt exists |
| Create thread | ✅ `thread_created` | ❌ deferred | Activity sufficient for feed |
| Socket-only broadcast | — | — | No DB mutation |

No duplicate emissions; domain events exclude message body per contract.

---

## Manifest & capability review

| Capability | Declared | Runtime truth | Verdict |
|------------|----------|---------------|---------|
| `read` | ✅ | Visibility + participant scope | 🟢 |
| `write` | ✅ | Services own mutations | 🟢 |
| `ai` | ✅ | Context providers + `chatAIActionService` | 🟢 |
| `vlink` | ✅ | `CHAT_CONVERSATION` only via `chatVlinkAccessService` | 🟢 |
| `trash` | ✅ | Global Trash + in-chat message trash | 🟢 |
| `realtime` | ✅ | Socket + `chatRealtimeService` | 🟢 |
| `notifications` | ✅ | Three types in manifest + adapter | 🟢 |
| `search` | ✅ | `searchAccessibleChat` | 🟢 |
| `businessWorkspace` | ✅ | `BusinessWorkspaceContent` case `chat` | 🟢 |
| `globalActivity` | ✅ | `chatActivityService` writes | 🟢 |

**entities[]:** `conversation` only — aligned with registry and resolver.

**Removed / not added:** `chat_thread_reply`, `chat_conversation_invite`, `message`, `thread` entities (not implemented).

---

## Reference Module #2 assessment

| Area | Status | Notes |
|------|--------|-------|
| Service Architecture | 🟢 | File Hub naming and ordering |
| Realtime Architecture | 🟢 | Adapter + thin socket delegation |
| Notifications | 🟢 | Adapter + manifest |
| AI Compliance | 🟢 | No controller Prisma on AI paths |
| Policy Engine | 🟢 | Dual on writes + reads |
| Global Trash | 🟢 | Handler + service |
| V_Link | 🟢 | Access + lifecycle (conversation) |
| Platform Entities | 🟢 | Conversation registered |
| Manifest Truthfulness | 🟢 | Phase 4–5 verified |
| Certification Readiness | 🟢 | Level 3 |

**Decision:** **Reference Module #2 (Level 3)** — use Chat as the second module pattern source after File Hub. **Not** Level 4 until a dedicated reference implementation review and council approval (File Hub template).

---

## Remaining punch-list (post–Level 3, non-blocking)

1. Optional `chat.thread.created` domain event if cross-module subscribers need it.
2. Platform-wide activity **read** path migration (shared with File Hub).
3. `ChatWorkspaceLanding.tsx` hub (module-development checklist).
4. Message `deletedAt` → `trashedAt` unification (future schema phase).
5. Level 4 promotion: `CHAT_REFERENCE_IMPLEMENTATION_REVIEW.md` + council.

---

## Recommended next module

**Calendar** (Wave 2) — reuse Chat patterns for PE, trash handler, visibility, and manifest entities after Wave 1 sign-off. Do not start until this review is merged/acknowledged.

---

## Evidence links

- [CHAT_CONSTITUTIONAL_AUDIT.md](./CHAT_CONSTITUTIONAL_AUDIT.md)
- [CHAT_OPERATION_MATRIX.md](./CHAT_OPERATION_MATRIX.md)
- [CHAT_GLOBAL_TRASH_PHASE2.md](./CHAT_GLOBAL_TRASH_PHASE2.md)
- [CHAT_SERVICE_EXTRACTION_PLAN.md](./CHAT_SERVICE_EXTRACTION_PLAN.md)
- [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

*End of Chat Level 3 Certification Review.*
