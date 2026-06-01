# Chat Reference Implementation Review

**Date:** 2026-05-31  
**Phase:** Chat Wave 1 — Reference Module #2 designation  
**Module id:** `chat`  
**Certification:** **Level 3 — Certified** ([CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md))  
**Benchmark (Level 4):** [FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md](./audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md)

---

## Executive summary

Chat is the **second certified module modernization** on the Vssyl platform. Wave 1 transformed a ~1,663-line controller with inline Prisma, controller-owned side effects, and AI bypass paths into a **service-owned, constitutionally aligned** module at **Level 3**.

**File Hub (Reference Module #1, Level 4)** demonstrates storage-centric patterns: canonical delete lifecycle, file/folder visibility, share permissions, Global Trash, V_Link file/folder access, and upload/share domain events.

**Chat (Reference Module #2, Level 3)** demonstrates **realtime collaboration** patterns: conversation visibility, notification fan-out, transport abstraction, AI routing through services, collaboration trash lifecycle, and conversation-scoped V_Link — without claiming File Hub’s Level 4 governance maturity.

Chat **does not** replace File Hub as the constitutional authority. It extends the pattern catalog for modules where **transport and social signals** dominate (Calendar, future scheduling surfaces).

---

## Modernization timeline

| Phase | Focus | Status | Key deliverables |
|-------|--------|--------|------------------|
| **0** | Audit | ✅ | [CHAT_CONSTITUTIONAL_AUDIT.md](./audits/CHAT_CONSTITUTIONAL_AUDIT.md), [CHAT_OPERATION_MATRIX.md](./audits/CHAT_OPERATION_MATRIX.md) |
| **1A** | Service extraction design | ✅ | [CHAT_SERVICE_EXTRACTION_PLAN.md](./audits/CHAT_SERVICE_EXTRACTION_PLAN.md) |
| **1B** | Core domain services | ✅ | `chatConversationService`, `chatMessageService`, `chatThreadService`, `chatPermissionService` |
| **1C** | Visibility + attachments + Policy pilot | ✅ | `chatVisibilityService`, `chatAttachmentService`, `chatPolicyDual` (sendMessage pilot) |
| **1D** | Activity + notifications + realtime | ✅ | `chatActivityService`, `chatNotificationService`, `chatRealtimeService`, `chatDomainEventService` |
| **1E** | Controller collapse | ✅ | Zero Prisma in `chatController.ts`; `chatUserSearchService`, `chatAnalyticsService` |
| **1F** | AI migration | ✅ | `chatAIActionService`; `ActionExecutor` → services |
| **2** | Global Trash | ✅ | `chatTrashService`, handler registration ([CHAT_GLOBAL_TRASH_PHASE2.md](./audits/CHAT_GLOBAL_TRASH_PHASE2.md)) |
| **3** | PE + events + manifest + V_Link | ✅ | Full `chatPolicyDual`, domain events, notification metadata, `chatVlinkLifecycleService` |
| **4** | Platform entities | ✅ | `registerChatPlatformEntities`, manifest `entities[]`, `chatVlinkAccessService` |
| **5** | Level 3 certification | ✅ | Browse/list PE, activity audit, [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) |

---

## Architectural problems found (pre-modernization)

| Problem | Severity | Evidence |
|---------|----------|----------|
| **Oversized controller** | P0 | `chatController.ts` ~1,663 lines |
| **Prisma in controller** | P0 | ~41 `prisma.` calls in HTTP handlers |
| **AI calling controllers** | P0 | `ActionExecutor` imported `chatController` mutations |
| **Socket mutation paths** | P0 | Reaction/read duplicated in socket vs HTTP without shared service |
| **Missing service boundaries** | P0 | No `chat*Service` layer; notifications inline |
| **Fragmented trash lifecycle** | P1 | Inline Prisma in `trashController`; no module handler |
| **Partial Policy Engine** | P1 | Participant `findFirst` only; no `chatPolicyDual` |
| **Single domain event** | P1 | `chat.message.sent` only; controller-adjacent emission |
| **Manifest lies** | P1 | `notifications: true` without `notifications[]`; no `entities[]` |
| **V_Link without lifecycle** | P1 | Resolver only; dangling links on permanent delete |

---

## Architectural patterns established

Reusable for Calendar, Todo, Notes, and Place — see [MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md) (Chat patterns to be cross-linked in a future doc revision).

### Canonical service layer

- One service per concern: `chatMessageService`, `chatTrashService`, etc.
- Mutation order: legacy auth → **Policy Dual** → persist → activity → domain event → notification → realtime.

### Thin controller

- HTTP: parse, `req.user`, call service, map status.
- Contract test asserts no Prisma / no side-effect imports in controller.

### Visibility service

- `chatVisibilityService` owns list/get/messages/search/AI reads.
- Participant scope + `trashedAt: null` + **PE read filter** on browse paths (Phase 5).

### AI → service routing

- `chatAIActionService` for writes; AI context controllers delegate to visibility service.
- **Never** `ActionExecutor` → controller for domain mutations.

### Realtime adapter

- `chatRealtimeService` wraps `chatSocketService` broadcast; services own when to fan-out.

### Notification adapter

- `chatNotificationService` centralizes `chat_message`, `chat_mention`, `chat_reaction`.

### Activity adapter

- `chatActivityService` wraps `emitModuleActivityEvent` for feed-normalized actions.

### Policy Dual

- `chatPolicyDual` + `policyActions` chat namespace; fail-closed security denies; legacy participant checks retained during rollout.

### Global Trash participation

- `registerGlobalTrashModuleHandler({ moduleId: 'chat' })` → `chatTrashService`.
- Conversations in Global Trash hub; messages in-chat (`deletedAt` documented exception).

### Platform entity registration

- `registerChatPlatformEntities` — `chat:conversation` only.
- Manifest `entities[]` aligned with registry and V_Link enum.

### V_Link access model

- `chatVlinkAccessService`: participant + PE read; trashed/deleted fail closed; **V_Link membership ≠ content access**.
- `chatVlinkLifecycleService`: unlink on permanent conversation delete.

### Domain event ownership

- Emitters in `domainEventEmitters.ts`; **services** call `chatDomainEventService` — never controllers.

### Manifest truthfulness

- Capabilities, notifications, and entities match runtime; no aspirational types.

---

## Lessons learned

**Calendar should copy:**

1. Extract services **before** thinning controller — design doc (1A) prevents scope creep.
2. Unify HTTP + socket write paths through one service (`toggleReaction` / `markAsRead` model).
3. Global Trash handler early when `trash: true` is declared.
4. Notification adapter + manifest metadata in the same phase as runtime types.
5. PE dual on **reads** (browse/list/AI), not only mutations — Phase 5 lesson.
6. V_Link access service separate from resolver switch statement.
7. AI context Prisma moves to visibility service in the same wave as AI executor migration.

**Todo / Notes should copy:**

- Trash + activity + domain event triple on delete/restore.
- Platform entity registration only for linkable types with access adapters.

**Do not copy blindly:**

- Message `deletedAt` vs `trashedAt` split — Calendar should prefer unified `trashedAt` for events if Global Trash is first-class.

---

## Reference module assessment

### Why Chat qualifies as Reference Module #2

| Criterion | Met? |
|-----------|------|
| End-to-end Wave 1 modernization documented | ✅ |
| Reusable patterns for collaboration modules | ✅ |
| Level 3 certification checklist passed | ✅ |
| Operation matrix + constitutional audit maintained | ✅ |
| Tests for PE, trash, visibility, V_Link, manifest | ✅ |
| Second module to prove File Hub patterns generalize beyond storage | ✅ |

### Why Chat remains Level 3 (not Level 4)

| Level 4 requirement | Chat status |
|---------------------|-------------|
| Architecture council / explicit Level 4 sign-off | Not requested |
| Full operation matrix at **C** for all rows including socket | Socket rows **P** (transport-only PE) |
| Reference maturity score / FH-6-style review gate | Chat L3 review only |
| Platform extraction doc contribution | Patterns documented; not yet merged into pattern guide as Chat-specific sections |
| Zero P0 architectural blockers | ✅ |
| Parity with File Hub governance (deprecated route retirement, activity read migration) | Shared platform partials |

**Verdict:** **Reference Module #2 (Level 3 Certified)** — adopt Chat patterns for Calendar Wave 1; promote to Level 4 only after a dedicated council review and socket/entity debt retirement plan.

---

## Dimension assessment (summary)

| Dimension | Verdict |
|-----------|---------|
| Entity Model | **YES** (conversation) |
| Capability Matrix | **YES** |
| Policy Engine | **YES** (mutations + reads) |
| AI | **YES** |
| V_Link | **YES** (conversation scope) |
| Realtime | **YES** |
| Notifications | **YES** |
| Global Trash | **YES** |
| Domain Events | **YES** |
| Activity | **YES** (writes) |
| Workspace Integration | **PARTIAL** (no dedicated landing hub) |

**Score: 10 YES, 1 PARTIAL, 0 NO** (for Level 3 bar)

---

## Recommended next module

**Calendar** — highest overlap with Chat (notifications, realtime, V_Link `CALENDAR_EVENT`, trash, AI context). Use this document + File Hub delete/visibility templates for Wave 1.

---

## Evidence index

| Artifact | Path |
|----------|------|
| Level 3 certification | `docs/architecture/audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md` |
| Constitutional audit | `docs/architecture/audits/CHAT_CONSTITUTIONAL_AUDIT.md` |
| Operation matrix | `docs/architecture/audits/CHAT_OPERATION_MATRIX.md` |
| Ledger row | `docs/architecture/CERTIFICATION_LEDGER.md` |
| Services | `server/src/services/chat*.ts` |
| Policy | `server/src/auth/chatPolicyDual.ts` |
| Manifest | `server/src/startup/builtInModuleManifests.ts` (`case 'chat'`) |

---

*Chat Reference Implementation Review — Wave 1 complete.*
