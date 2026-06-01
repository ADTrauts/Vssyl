# Chat Global Trash Compliance (Phase 2)

**Module id:** `chat`  
**Last updated:** 2026-05-31  
**Status:** Implemented  
**Pattern:** [MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md](../../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md) — Pattern 5

---

## Message lifecycle recommendation

| Entity | Soft-delete field | Global Trash UI | Rationale |
|--------|-------------------|-----------------|-----------|
| **Conversation** | `trashedAt` | **Yes** — first-class Global Trash item | Aligns with platform trash model; users expect whole threads in trash |
| **Message** | `deletedAt` | **No** — not listed in Global Trash hub | Keeps product simple; message delete/restore stays in Chat module via `chatTrashService` and in-conversation UX |

**Do not migrate messages to `trashedAt` in Phase 2.** A schema migration could unify fields later (Phase 2+ / compliance hardening) but is not required for Global Trash certification.

**Visibility:** `chatVisibilityService` excludes `trashedAt` conversations from browse/search/AI context. Restored conversations (`trashedAt: null`) reappear in lists.

**V_Link (Phase 3):** `unlinkChatConversationFromAllVLinks` runs in `permanentlyDeleteConversation` before DB delete; emits `vlink.entity.unlinked` per link.

---

## Handler registration

Registered in `server/src/startup/registerGlobalTrashHandlers.ts` at server boot (`server/src/index.ts`).

```text
moduleId: chat
moduleName: Chat
supportedTypes: ['conversation', 'message']
```

| Handler method | Delegates to |
|----------------|--------------|
| `softTrash` | `softTrashChatItem` |
| `restore` | `restoreChatItem` |
| `permanentDelete` | `permanentlyDeleteChatItem` |
| `emptyModuleTrash` | `emptyChatTrash` |
| `listTrashed` | `listTrashedConversationsForGlobalTrash` (conversations only) |

---

## Service surface (`chatTrashService.ts`)

- `softTrashConversation` / `restoreConversation` / `permanentlyDeleteConversation`
- `softTrashMessage` / `restoreMessage` / `permanentlyDeleteMessage`
- Activity via `chatActivityService` (`conversation_trashed`, `conversation_restored`, `conversation_deleted`, `message_*`)

`chatConversationService.trashConversation` / `restoreConversationFromTrashService` delegate for future HTTP routes.

---

## Controller cleanup

`trashController.ts` no longer contains inline Prisma for chat conversation/message trash, restore, permanent delete, or list. Delegates to `getGlobalTrashModuleHandler('chat')` (same pattern as Drive).

Messages removed from **global trash list** aggregation; still support trash/restore/delete via handler when `type: 'message'` is sent from Chat UI.

---

## Certification impact

| Requirement | Status |
|-------------|--------|
| `chatTrashService` exists | Done |
| Handler registered | Done |
| No inline chat trash in `trashController` | Done |
| Service-owned lifecycle + activity | Done |
| Tests | Done |

**Remaining before Level 3:** full Policy Engine on trash mutations, manifest notification metadata, domain events for trash/restore, `chatVlinkLifecycleService`, Level 3 certification checklist sign-off.
