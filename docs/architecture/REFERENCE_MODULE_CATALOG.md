# Reference Module Catalog

**Status:** Living guide (2026-06-01)  
**Purpose:** Single map of **what to copy from which reference module** when modernizing built-in modules.  
**Authorities:** [CERTIFICATION_LEDGER.md](./CERTIFICATION_LEDGER.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md), [MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)

---

## Reference modules at a glance

| # | Module | Level | Role | Primary audit |
|---|--------|-------|------|----------------|
| 1 | **File Hub** (`drive`) | 4 — Reference Implementation | Trash, visibility, PE, V_Link, entities, manifest truth | [FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md](./audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md) |
| 2 | **Chat** (`chat`) | 3 — Certified | Realtime, AI routing, notifications, thin controllers | [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) |
| 3 | **Calendar** (`calendar`) | 3 — Certified | Scheduler, reminders, recurrence, time-based reads | [CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md) |

**Rule:** Copy **patterns**, not file names blindly. Every module still needs its own constitutional audit and operation matrix before implementation.

---

## File Hub — Reference Module #1 (Level 4)

**Copy for:** Any module with user data, deletes, sharing, search, or cross-module links.

| Pattern | What to copy | Key artifacts |
|---------|--------------|-----------------|
| Canonical service boundaries | One service per mutation domain; no Prisma in controllers | `driveDeleteService`, `driveUploadService`, `driveVisibilityService` |
| Global Trash | `trashedAt` + `*TrashService` + `registerGlobalTrashHandlers` | [GLOBAL_TRASH.md](./GLOBAL_TRASH.md) |
| Permission-aware visibility | Central list/read/search; tenant scope | `driveVisibilityService`, `listAccessible*` |
| Owned / shared / Policy Engine reads | `*PolicyDual` + post-query or pre-check filter | `drivePolicyDual`, `authorize()` |
| V_Link access + lifecycle | Membership ≠ content; unlink on permanent delete | `driveVlinkAccessService`, `driveVlinkLifecycleService` |
| Platform Entity registration | `register*PlatformEntities` + manifest `entities[]` | `platformEntityRegistry.ts` |
| Manifest truth | Capabilities match runtime; no aspirational types | `builtInModuleManifests.ts` |
| Domain events | Registered types; emit from services after success | `driveDomainEventService`, registry |
| Module activity | `emitModuleActivityEvent` on writes | `driveActivityService` |
| Notifications | `*NotificationService` + manifest metadata | `driveNotificationService` |
| Lifecycle correctness | `authorize → execute → activity → domain → notify → realtime` | Operation matrix **C** rows |

**Do not copy:** File-specific storage (GCS), folder tree semantics, enterprise drive parity — unless the target module is file-like.

---

## Chat — Reference Module #2 (Level 3)

**Copy for:** Collaboration, messaging, realtime UX, AI actions on conversational data.

| Pattern | What to copy | Key artifacts |
|---------|--------------|-----------------|
| Realtime collaboration | Adapter owns socket fan-out; controller/socket thin | `chatRealtimeService` |
| AI → service routing | `ActionExecutor` calls `*AIActionService`, not controllers | `chatAIActionService` |
| Socket → service routing | Mutations on socket paths delegate to services | `chatMessageService`, `chatSocketService` |
| Notification adapters | Payload shaping + manifest types | `chatNotificationService` |
| Activity adapters | Normalized actions per write | `chatActivityService` |
| Domain event ownership | `chatDomainEventService`; no controller emit | Registry + service emitters |
| Thin controller collapse | Zero Prisma; contract tests | `chatController.contract.test.ts` |
| Message/conversation visibility | Participant scope + `trashedAt: null` + PE read | `chatVisibilityService` |
| V_Link content-access separation | V_Link membership does not grant content | `chatVlinkAccessService` |
| Global Trash (conversation) | Handler + `chatTrashService` | Phase 2 doc |

**Do not copy:** Conversation/message model specifics, thread enum without entity registration.

---

## Calendar — Reference Module #3 (Level 3)

**Copy for:** Time-based data, schedules, reminders, recurrence, availability.

| Pattern | What to copy | Key artifacts |
|---------|--------------|-----------------|
| Scheduler → service ownership | Cron calls module scheduler only | `platformCronJobs` → `calendarSchedulerService` |
| Reminder lifecycle | Dispatch in module service; not raw cron Prisma | `calendarReminderService` |
| Recurrence ownership | RRULE expansion isolated | `calendarRecurrenceService` |
| Availability / free-busy reads | Visibility-owned range queries | `calendarVisibilityService` |
| Time-based notifications | Reminder type in manifest + adapter | `calendar_reminder` |
| Event lifecycle | Trash/restore/permanent + domain events | `calendarTrashService` |
| ICS isolation | Import/export in dedicated service | `calendarIcsService` |
| AI calendar actions | `calendarAIActionService` + visibility AI helpers | Phase 1F |
| Calendar event V_Link / entity | Single conservative entity (`event`) | `calendarVlinkAccessService`, `registerCalendarPlatformEntities` |
| Policy dual on reads | Post-query filter on list/search | `evaluateCalendarPolicyDual` |

**Do not copy:** Calendar attendee RSVP model, ICS timezone edge cases as generic patterns — document module-specifically.

---

## Module guidance — which references to weight

| Target module | Primary references | Secondary | Unique teachable angle |
|---------------|-------------------|-----------|------------------------|
| **Todo** | File Hub (trash, V_Link, visibility, entities), Calendar (due dates, recurrence, reminders), Chat (AI, activity) | Chat (light realtime if added) | Task lifecycle, assignment, operational work management |
| **Notes** | File Hub (trash, V_Link, visibility), Chat (AI context, thin controller) | Calendar (low) | Document entity, sharing, soft delete |
| **Place** | File Hub (entities, V_Link), Chat (visibility) | Calendar (scheduling links) | Location/meeting linkage, map context |
| **Dashboard** | File Hub (manifest, activity), Chat (realtime widgets) | — | Widget registry, composition (not full module CRUD) |
| **Analytics** | File Hub (activity vs analytics separation) | — | Read-only / derived metrics; often N/A trash |
| **Business Workspace** | All three (composition only) | — | Hub switch, module landing pattern; not a data module |

### Todo (next wave) — recommended copy order

1. **File Hub** — `todoTrashService`, Global Trash handler, `todoVisibilityService`, `todoVlinkAccessService`, platform entity `todo:task`.
2. **Calendar** — `todoReminderService`, `todoSchedulerService`, `todoRecurrenceService` (extend existing), due-date notification path.
3. **Chat** — `todoAIActionService`, `todoActivityService`, `todoDomainEventService`, `todoNotificationService` (if in-app alerts added).
4. **Chat + File Hub** — `todoAttachmentService` if attachments stay (storage via `storageService`).

---

## Phase 0 deliverables (every module wave)

Before Phase 1 implementation, produce:

1. `{MODULE}_CONSTITUTIONAL_AUDIT.md`
2. `{MODULE}_OPERATION_MATRIX.md`
3. `{MODULE}_SERVICE_EXTRACTION_PLAN.md`
4. Ledger + roadmap index updates

Use this catalog when filling **“reference module pattern to copy”** columns in the extraction plan.

---

## Evidence links

| Module | Certification | Extraction / trash / V_Link |
|--------|---------------|---------------------------|
| File Hub | [FILE_HUB_MATURITY_ASSESSMENT.md](./audits/FILE_HUB_MATURITY_ASSESSMENT.md) | [FILE_HUB_OPERATION_MATRIX.md](./audits/FILE_HUB_OPERATION_MATRIX.md) |
| Chat | [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) | [CHAT_SERVICE_EXTRACTION_PLAN.md](./audits/CHAT_SERVICE_EXTRACTION_PLAN.md) |
| Calendar | [CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md) | [CALENDAR_SERVICE_EXTRACTION_PLAN.md](./audits/CALENDAR_SERVICE_EXTRACTION_PLAN.md) |
| Todo (Phase 0) | — | [TODO_CONSTITUTIONAL_AUDIT.md](./audits/TODO_CONSTITUTIONAL_AUDIT.md) |

---

*Last updated: 2026-06-01*
