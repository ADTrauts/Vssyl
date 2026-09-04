# Chat Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Architecture:** Chat Level 3 certification review, Platform Standards, Global Trash, File Hub product context

---

## Purpose

Chat is Vssyl’s **communication application** for people and teams: conversations and messages that stay tied to personal and business operating contexts, with access that does not require abandoning the current page.

Primary personas include individual users, team members, and business admins. Guest/external participation may exist via roles; a full guest journey is not defined as an invariant here.

## User Value

- Talk and collaborate without switching to a disconnected messenger
- Keep personal and business conversations in the right context
- Continue a conversation while working in File Hub, Calendar, To-Do, or other applications
- Share files from File Hub inside the conversation
- Stay aware of activity through notifications without treating Chat as a generic notification inbox

## Core Product Model

Durable user-facing concepts:

- **Conversations** (spaces for ongoing communication)
- **Messages**
- **Replies / nesting** where the current UX supports threading of replies
- **Presence / typing** indicators
- **Reactions**
- **Search** across conversations and messages (within authorized scope)
- **Roles** in a conversation (e.g. owner/admin/member/guest-style participation)
- **File sharing** via File Hub
- **Notifications** for attention-worthy Chat events
- **Soft deletion / recovery** with honest semantics (below)

### Always-available chat

Chat provides **always-available chat**: a floating or docked experience over the authenticated app shell so users can continue conversations without leaving their current application.

- It is hidden on auth/unauthenticated flows as required by the shell.
- Exact surfaces where it must or must not appear beyond that are an open product decision.
- Dashboard may also host a Chat **widget** as a projection; that widget is not a substitute for always-available chat.

### Threads

- **Current user-facing UX:** reply/nesting style conversation structure.
- Typed categories such as topic / project / decision / documentation may exist in data/API form, but they are **not currently established as the user-facing thread taxonomy**.

### Trash and deletion

- **Conversations** participate in Global Trash–style recovery when trashed at the conversation level.
- **Messages** use in-conversation soft deletion; message deletion is not the same product gesture as trashing an entire conversation.
- Product language should not claim identical trash semantics for messages and conversations.

### Enterprise overlays

Deeper governance surfaces (classification, retention, moderation, encryption-related UI, and similar) may appear as **gated enterprise overlays**. Presence of a panel or gate is capability intent—not proof that every enterprise feature is complete or production-hardened.

## Context Behavior

- **Personal:** Conversations belong to the user’s personal dashboard/context.
- **Business:** Chat is available in business context (including workspace module placement and business-scoped conversations). Always-available chat can switch among personal-first and business contexts where the shell supports tabs/unread.
- Guests/external collaborators may participate where roles allow; a full guest onboarding journey is not defined here as an invariant.
- **Household:** Not currently defined as a product invariant for Chat in this document.

## Key Relationships

- **File Hub:** Attachments and shared files use File Hub as the file system of record.
- **Dashboard:** Optional Chat widget; shell hosts always-available chat.
- **Notifications:** User-facing attention for Chat events; not a replacement for the conversation itself.
- **Activity:** System/historical record of what happened; distinct from notifications.
- **AI / Digital Life Twin:** May use Chat context and actions only through normal Chat authority.
- **V_Link:** Conversations may participate in relationships; link membership alone does not grant conversation content access.
- **Marketplace bots/plugins:** Not established as shipped Chat product.

## Product Invariants

- Entering another application should not require losing access to ongoing Chat via always-available chat (when the user is in an authenticated shell where Chat is enabled).
- Personal and business conversations remain context-scoped; Chat must not mix private contexts without authorized participation.
- File attachments remain File Hub resources, not a second Chat-only file store.
- Chat is the system of record for conversations/messages; widgets and AI are consumers, not competing stores.

## Boundaries

Chat does **not** own:

- File storage architecture (File Hub / platform storage)
- Platform notification delivery infrastructure (beyond Chat event types)
- Workforce Scheduling or To-Do task lifecycle
- Marketplace bot marketplace as a Chat subsystem
- End-to-end encryption or collaborative document editing as claimed complete products

## Open Product Decisions

1. Whether typed thread categories become a future user-facing taxonomy.
2. Exact always-on / global Chat visibility policy across all authenticated surfaces.
3. Depth of guest/external collaborator product journey.
4. Which enterprise governance overlays are first-class product vs experimental gates.

## Canonical References

- [`docs/architecture/audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md`](../docs/architecture/audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md)
- [`docs/architecture/REFERENCE_MODULE_CATALOG.md`](../docs/architecture/REFERENCE_MODULE_CATALOG.md) — Reference Module #2
- [`docs/architecture/WORKSPACE_ROUTING_CONTRACT.md`](../docs/architecture/WORKSPACE_ROUTING_CONTRACT.md)
- [`memory-bank/driveProductContext.md`](./driveProductContext.md) — File Hub
- Global Trash / V_Link via [`docs/architecture/VSSYL_ARCHITECTURE_INDEX.md`](../docs/architecture/VSSYL_ARCHITECTURE_INDEX.md)
