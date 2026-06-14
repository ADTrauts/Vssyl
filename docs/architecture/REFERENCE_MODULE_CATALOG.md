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
| 4 | **Todo** (`todo`) | 3 — Certified | Task lifecycle, assignment, work management, calendar/file links | [TODO_LEVEL3_CERTIFICATION_REVIEW.md](./audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md) |
| 5 | **Place** (`place`) | 3 — Certified | External graph, directory, discovery, commerce routing, dual-surface | [PLACE_REFERENCE_COUNCIL_REVIEW.md](./audits/PLACE_REFERENCE_COUNCIL_REVIEW.md), [PLACE_PATTERN_GUIDE.md](./PLACE_PATTERN_GUIDE.md) |
| — | **Notebook** (`notebook`) | 3 — Certified (composition) | Operational links, workspace intelligence, grounded AI orchestration — **not Reference #5** | [NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md](./audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md) |

**Rule:** Copy **patterns**, not file names blindly. Every module still needs its own constitutional audit and operation matrix before implementation.

### UX Reference Modules (independent track)

UX reference slots live under `docs/ux/audits/` per [`REFERENCE_MODULE_PROGRAM.md`](../ux/REFERENCE_MODULE_PROGRAM.md). **Not the same numbering as architecture Reference Modules above.**

| UX slot | Module | Status | Registration |
|---------|--------|--------|--------------|
| **#1** | Drive / File Hub | **Approved with Findings** | [`REFERENCE_MODULE_DRIVE.md`](../ux/audits/REFERENCE_MODULE_DRIVE.md) |
| **#2** | Notifications | **Approved with Findings** | [`REFERENCE_MODULE_NOTIFICATIONS.md`](../ux/audits/REFERENCE_MODULE_NOTIFICATIONS.md) |
| **#3** | Todo | **Approved with Findings** | [`REFERENCE_MODULE_TODO.md`](../ux/audits/REFERENCE_MODULE_TODO.md) |
| **#4** | AI Experience (`ai` / AI Chat) | **Approved with Findings** | [`REFERENCE_MODULE_AI.md`](../ux/audits/REFERENCE_MODULE_AI.md) |
| **#5** | Calendar | **Approved with Findings** | [`REFERENCE_MODULE_CALENDAR.md`](../ux/audits/REFERENCE_MODULE_CALENDAR.md) |
| **#6** *(expansion — vacant)* | Place *(primary candidate)* | **Eligible With Findings** — not registered | Wave 6C review: [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md) |

**Clarification:** Architecture **Reference Module #5** = **Place** (external graph). UX **Reference #5** = **Calendar** (scheduling/time-grid UX). UX **Reference #2** = **Notifications** (management-page inbox UX) — **not** Architecture **Reference Module #2** (Chat). UX **Reference #3** = **Todo** (task workspace / multi-view UX) — **not** a separate architecture slot (Todo is also Architecture **Reference Module #4**). UX **Reference #4** = **AI Experience** (twin/chat workspace UX) — **registered** 2026-06-03 — independent of AI Platform architecture certification. Calendar is Architecture **Reference Module #3** (Level 3 code). **UX #6** is expansion tier — baseline #1–#5 frozen per Wave 6C.

### UX pattern standards (Wave 6A)

**Authoritative pattern registry:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../ux/UX_REFERENCE_PATTERN_CATALOG.md) — **56** `UX-PAT-*` standards extracted from UX references #1–#5.

| Archetype | Primary UX reference | Pattern doc |
|-----------|---------------------|-------------|
| File / entity browser | Drive #1 | [`patterns/WORKSPACE_PATTERNS.md`](../ux/patterns/WORKSPACE_PATTERNS.md) |
| Inbox / feed | Notifications #2 | [`patterns/CROSS_MODULE_INTEGRATION_PATTERNS.md`](../ux/patterns/CROSS_MODULE_INTEGRATION_PATTERNS.md) |
| Task / work management | Todo #3 | WORKSPACE + NAVIGATION |
| AI / twin workspace | AI Experience #4 | [`patterns/AI_EXPERIENCE_PATTERNS.md`](../ux/patterns/AI_EXPERIENCE_PATTERNS.md) |
| Scheduling / time-grid | Calendar #5 | WORKSPACE + MOBILE |
| Graph / dual-surface / discovery | Place *(future #6)* | Wave 6D extraction — [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md) |

**Closeout:** [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](../ux/UX_REFERENCE_PROGRAM_CLOSEOUT.md) · **Expansion review:** [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md)

---

## AI Platform — cross-cutting (Wave G0, 2026-06-04)

**Not** a reference module slot. Module AI compliance copies **from** References #1–2 below; the platform layer is governed by **constitutional docs** (not module Level 3 gates).

| Pattern | Copy from | Platform artifact |
|---------|-----------|-------------------|
| AI writes → canonical service | Chat #2, Todo #4 | `*AIActionService` + `ActionExecutor` / `toolExecutor` |
| AI reads → visibility service | File Hub #1 | Context provider HTTP → thin controller |
| Read-only external AI | Place #5 | `placeAIActionService` |
| Composition AI | Notebook (L3) | Reuse notes/todo providers |
| Twin pipeline / diagnostics | Platform constitution | `DigitalLifeTwinCore`, [AI_PLATFORM_OPERATION_MATRIX.md](./AI_PLATFORM_OPERATION_MATRIX.md) |

**Constitutional authority:** [AI_PLATFORM_CONSTITUTION.md](./AI_PLATFORM_CONSTITUTION.md), [AI_PLATFORM_BOUNDARY_MODEL.md](./AI_PLATFORM_BOUNDARY_MODEL.md), [AI_PLATFORM_CERTIFICATION_STRATEGY.md](./AI_PLATFORM_CERTIFICATION_STRATEGY.md) (levels 0–4).

**Evidence / audits:** [AI_PLATFORM_CONSTITUTIONAL_AUDIT.md](./audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md), [AI_TOOL_ACTION_COMPLIANCE_MATRIX.md](./audits/AI_TOOL_ACTION_COMPLIANCE_MATRIX.md), [AI_CONTEXT_PROVIDER_MATRIX.md](./audits/AI_CONTEXT_PROVIDER_MATRIX.md). **Do not duplicate** certified module extraction work in platform waves.

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

## Notifications — UX Reference #2 (management inbox)

**Copy for:** Platform inbox feeds, management-page modules, cross-module notification routing, bulk feed actions. **UX surfaces only** — [`REFERENCE_MODULE_NOTIFICATIONS.md`](../ux/audits/REFERENCE_MODULE_NOTIFICATIONS.md).

| Pattern | What to copy | Key artifacts |
|---------|--------------|-----------------|
| Management page shell | `PageHeader` + `PageToolbar` on feed route | `web/src/app/notifications/page.tsx` |
| Row action menu | `NotificationActionsMenu` → `DropdownMenu` | 3A-4B closeout |
| Bulk + per-row delete confirm | `ConfirmModal` gates | 5C.1 closeout |
| Mobile category sidebar | Collapsible sheet (Calendar 3C-7B pattern) | 5G N-5 |
| Cross-module deep links | Metadata-driven routing per module type | Feed row click handlers |
| Quick actions | `NotificationQuickActions` from manifest metadata | `builtInModuleManifests` `notifications[]` |
| Feed error toasts | `showNotificationActionError()` | 5G N-2 |
| Keyboard feed shortcuts | `j`/`k`/`Space`/`Escape` | NTF-11/12 QA evidence |

**Do not copy:** Notification payload schemas per module (module-specific); settings sub-route chrome until N-3 migrated.

---

## Chat — Reference Module #2 (Level 3 · Architecture)

**Copy for:** Collaboration, messaging, realtime **code**, AI actions on conversational data. **Not** UX Reference #2 (Rejected at 5B.3).

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

## Calendar — Reference Module #3 (Level 3) · UX Reference #5

**Copy for:** Time-based data, schedules, reminders, recurrence, availability. **UX surfaces:** also **Reference UX #5** — scheduling/time-grid interaction patterns ([`REFERENCE_MODULE_CALENDAR.md`](../ux/audits/REFERENCE_MODULE_CALENDAR.md)).

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

## Todo — Reference Module #4 (Level 3) · Reference UX #3

**Copy for:** Task/work-item modules, assignment flows, operational satellites, cross-module links. **UX surfaces:** also **Reference UX #3** — workspace-split task / list-board-calendar patterns ([`REFERENCE_MODULE_TODO.md`](../ux/audits/REFERENCE_MODULE_TODO.md)).

| Pattern | What to copy | Key artifacts |
|---------|--------------|-----------------|
| Core task lifecycle | Single write service + side-effect adapters | `todoTaskService`, `todoActivityService`, `todoDomainEventService` |
| Assignment fan-out | Notify + domain + realtime on assign change | `todoNotificationService`, assign hooks in `todoTaskService` |
| Global Trash (task) | `todoTrashService` + handler | [TODO_PHASE2_TRASH_ENTITY_VLINK.md](./audits/TODO_PHASE2_TRASH_ENTITY_VLINK.md) |
| Visibility + PE reads | Legacy scope + post-query filter | `todoVisibilityService`, `filterTasksByReadPolicy` |
| V_Link (task only) | Creator/assignee + PE; unlink on permanent delete | `todoVlinkAccessService`, `todoVlinkLifecycleService` |
| AI task actions | `todoAIActionService` — no controller imports | Phase 1F tests |
| Calendar/file bridges | Integration service; visibility on linked assets | `todoIntegrationLinkService`, `todoCalendarBridgeService` |
| Satellite extraction | One service per sub-domain; thin controller delegates | `todoCommentService`, `todoProjectService`, etc. |

**Do not copy:** Creator/assignee-only ACL as generic pattern for shared workspaces; subtask/comment models without entity registration; in-app due reminders until `todo_reminder_dispatch` exists.

---

## AI Experience — Reference UX #4

**Copy for:** Conversational AI / twin workspace modules, streaming chat UX, conversation lifecycle, embedded AI surfaces. **UX surfaces only** — [`REFERENCE_MODULE_AI.md`](../ux/audits/REFERENCE_MODULE_AI.md). **Not** AI Platform architecture certification.

| Pattern | What to copy | Key artifacts |
|---------|--------------|----------------|
| Twin workspace shell | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` | `AIChatPageShell.tsx` |
| Single chat engine | Page + embedded → `AIChatModule` → `AIChatWorkspace` | `AIChatModule.tsx`, `AIChatWorkspace.tsx` |
| Conversation delete confirm | `requestDeleteConversation` → `ConfirmModal` → `trashItem` | Unified delete path (5H-B) |
| Row + header menus | `DropdownMenu` on sidebar + chat header | 3A-4A + 5H-B |
| Drag-to-trash confirm | Sidebar drag → `GlobalTrashBin` → `ConfirmModal` | Drive 3B-6 class |
| Mobile conversations sheet | Calendar 3C-7B pattern | `AIChatPageShell.tsx` |
| Cross-route navigation | `aiExperienceNavigation.ts` + `AIExperienceNavLinks` | `/ai-chat` ↔ `/ai` |
| Business hub entry | `AIWorkspaceLanding` + workspace switch | `module-development.mdc` |
| Widget thin-wrapper | `AIWidget` → `AIChatModule` | 5H-C parity |
| Drive attachments | Composer upload/save bridge | `AIFileUpload.tsx` |
| Shared EmptyState | `AIChatEmptyState` wrapper | 5H-B |

**Do not copy:** Header `AIChatDropdown` as primary workspace (certified quick-access exception only); embedded `provider: 'auto'` as full picker substitute on page routes; platform twin pipeline internals as UX patterns.

**Evidence:** [`REFERENCE_MODULE_AI.md`](../ux/audits/REFERENCE_MODULE_AI.md). **Reference UX #4** registered (2026-06-03).

---

## Place — Reference Module #5 (Level 3)

**Copy for:** External graph modules, business directory surfaces, commerce routing, dual consumer/publisher UX.

| Pattern | What to copy | Key artifacts |
|---------|--------------|----------------|
| External personal graph | User-scoped Main Street; typed nodes | `placeService`, `PlaceNode`, `BusinessFollow` sync |
| Dual-surface module | Consumer `/place` + publisher workspace | `PlaceWorkspaceLanding`, scoped PE |
| Directory + verification gates | Published listing; EIN gate on discovery | `placeListingService`, `placeVisibilityService` |
| Commerce routing (not checkout) | Interaction links + click telemetry | [PLACE_COMMERCE_BOUNDARY.md](./PLACE_COMMERCE_BOUNDARY.md) |
| Connection mirror | Member Relationship + PlaceNode on accept | `placeConnectionService` |
| Meeting-at-place + Calendar delegate | Social meeting; event via Calendar service | `placeMeetingService.linkToCalendar` |
| Bounded community | Join/leave side effects; no Chat messages | `placeCommunityService` |
| Global Trash + V_Link | Listing + meeting entities | `placeTrashService`, `placeVlinkAccessService` |

**Do not copy:** Payment processing, PO/invoice workflows, vendor onboarding, public follower counts, Chat message persistence.

**Evidence:** [PLACE_PATTERN_GUIDE.md](./PLACE_PATTERN_GUIDE.md), [PLACE_COMMERCE_BOUNDARY.md](./PLACE_COMMERCE_BOUNDARY.md), [PLACE_REFERENCE_COUNCIL_REVIEW.md](./audits/PLACE_REFERENCE_COUNCIL_REVIEW.md). **Designated Reference Module #5** (Wave 4B, 2026-06-02).

### Place — UX certification (Wave 6B, 2026-06-14)

**Architecture #5 ≠ UX Reference #6.** Independent tracks. Place is **UX-L3 Certified** and **recommended primary candidate** for expansion-tier UX #6 — not registered.

| Metric | Value |
|--------|-------|
| Scorecard | **11 PASS / 0 PWF / 0 FAIL** |
| UX-L1 / L2 / L3 | **Certified** (strict L3) |
| QA matrix Part 2G | **27 PASS / 0 FAIL / 0 BLOCKED** |
| Reference UX #6 | **Eligible With Findings** — registration deferred |
| Reference Workspace | **Ineligible** (product module, not platform shell) |
| Wave 6C expansion review | **Approve governed expansion** — Place primary #6 candidate |

**Unique UX archetype (future Wave 6D patterns):** dual-surface consumer/publisher, React Flow neighborhood graph, explore/follow discovery, publisher listing editor, external commerce links, meeting-at-place + calendar bridge, transaction history privacy.

**Evidence:** [`PLACE_UX_CERTIFICATION_REVIEW.md`](../ux/audits/PLACE_UX_CERTIFICATION_REVIEW.md), [`PLACE_UX_SCORECARD.md`](../ux/audits/PLACE_UX_SCORECARD.md), [`PLACE_UX_CERTIFICATION.md`](../ux/audits/PLACE_UX_CERTIFICATION.md), [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md).

**Prior baseline (superseded):** [`PLACE_UX_BASELINE_AUDIT.md`](../ux/audits/PLACE_UX_BASELINE_AUDIT.md) — 1/7/3 pre-remediation.

---

## Module guidance — which references to weight

| Target module | Primary references | Secondary | Unique teachable angle |
|---------------|-------------------|-----------|------------------------|
| **Todo** | *(certified — see Reference #4 + UX #3 above)* | Calendar (#3 UX #5) calendar bridge | **Reference UX #3** — task workspace split |
| **Notes** | *(paused 2026-06-01 — see Notebook initiative)* | — | Superseded by Notebook product track |
| **Notebook** | Todo (#4), File Hub (#1), Calendar (#3) | Chat (#2) AI facade patterns | Composition + NotebookLink; Phase 7 audit complete — **not L3 certified** |
| **AI surfaces** | File Hub (#1) read providers | Notifications (#2) routing | **Reference UX #4** — twin/chat workspace |
| **Place** | **Self (future UX #6)** — graph/dual-surface; Drive #1 (confirm/trash/empty) | Calendar #5 (scheduling links), Todo UX #3 (hub chrome), File Hub (V_Link) | **Arch #5** + **UX-L3 Certified** — Ref UX **#6 Eligible CwF** (not registered) |
| **Inbox / feed modules** | **Notifications UX #2** | Drive #1 (workspace), Calendar #5 (time-grid) | Management-page archetype; cross-module routing hub |
| **Dashboard** | File Hub (manifest, activity), Chat (realtime widgets) | — | Widget registry, composition (not full module CRUD) |
| **Analytics** | File Hub (activity vs analytics separation) | — | Read-only / derived metrics; often N/A trash |
| **Business Workspace** | Notebook (composition), File Hub (manifest) | [WORKSPACE_ROUTING_CONTRACT.md](./WORKSPACE_ROUTING_CONTRACT.md) | **Platform shell** — segment navigation, CI drift tests; **not** Reference #6 ([Wave 1C closeout](./audits/BUSINESS_WORKSPACE_WAVE_1C_CLOSEOUT.md)) |

### Notebook — composition module (Phases 1–6.5 shipped; Phase 7 audit 2026-06-02)

Product module **`notebook`** composes Notes pages, Todo tasks, Calendar events, and File Hub files via **NotebookLink** (operational links, not V_Link replacement).

| Pattern | Status | Key artifacts |
|---------|--------|----------------|
| Composition reads | ✅ | `notebookContextService`, `notebookWorkspaceContextService` |
| Operational links | ✅ | `notebookLinkService`, PE `notebook:link:*` |
| AI orchestration | 🟢 | `notebookAIActionService` — HTTP + ActionExecutor + toolExecutor (read-only) |
| Page domain | Delegated | `notes*Service`, Global Trash `moduleId: notes` |
| Platform entity | 🟢 | `notebook:page` registered; `NOTEBOOK_PAGE_ENTITY_TYPE`; V_Link alias `NOTE` |
| Manifest truth | ✅ | `entities[]`, `operationalLinks`, no false `trash`/`vlink` on `notebook` |
| Certification | **Level 3 Certified** (2026-06-02) | Composition module; not Reference #5 — see review doc |

**Reference #5:** **Place** is **Reference Module #5** (**Level 3 Certified**, council Wave **4B**, 2026-06-02). Teachable patterns: [PLACE_PATTERN_GUIDE.md](./PLACE_PATTERN_GUIDE.md), commerce law: [PLACE_COMMERCE_BOUNDARY.md](./PLACE_COMMERCE_BOUNDARY.md), council record: [PLACE_REFERENCE_COUNCIL_REVIEW.md](./audits/PLACE_REFERENCE_COUNCIL_REVIEW.md). Notebook is L3 Certified composition module — **not** Reference #5.

### Notes — sub-domain (dependency)

Standalone Notes product cert is **superseded** by Notebook. **`notes`** remains installed for page persistence and trash handler. Copy order for remaining page-domain gaps:

1. **File Hub** — `notebook:page` entity registration (NB-P0-1).
2. **Chat** — ActionExecutor registration pattern for notebook AI.
3. **Todo (#4)** — task writes stay in `todoAIActionService` — never merge into notebook controllers.

---

## Phase 0 deliverables (every module wave)

Before Phase 1 implementation, produce:

1. `{MODULE}_CONSTITUTIONAL_AUDIT.md`
2. `{MODULE}_OPERATION_MATRIX.md`
3. `{MODULE}_SERVICE_EXTRACTION_PLAN.md` — Place: [PLACE_SERVICE_EXTRACTION_PLAN.md](./PLACE_SERVICE_EXTRACTION_PLAN.md) ✅
4. `{MODULE}_DOMAIN_MODEL.md` — Place: [PLACE_DOMAIN_MODEL.md](./PLACE_DOMAIN_MODEL.md) ✅ (Wave 1B gate)
5. Ledger + roadmap index updates

Use this catalog when filling **“reference module pattern to copy”** columns in the extraction plan.

---

## Evidence links

| Module | Certification | Extraction / trash / V_Link |
|--------|---------------|---------------------------|
| File Hub | [FILE_HUB_MATURITY_ASSESSMENT.md](./audits/FILE_HUB_MATURITY_ASSESSMENT.md) | [FILE_HUB_OPERATION_MATRIX.md](./audits/FILE_HUB_OPERATION_MATRIX.md) |
| Chat | [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) | [CHAT_SERVICE_EXTRACTION_PLAN.md](./audits/CHAT_SERVICE_EXTRACTION_PLAN.md) |
| Calendar (Arch #3 · UX #5) | [CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md), [REFERENCE_MODULE_CALENDAR.md](../ux/audits/REFERENCE_MODULE_CALENDAR.md) | [CALENDAR_SERVICE_EXTRACTION_PLAN.md](./audits/CALENDAR_SERVICE_EXTRACTION_PLAN.md) |
| Notifications (UX #2) | [NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md](../ux/audits/NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md), [REFERENCE_MODULE_NOTIFICATIONS.md](../ux/audits/REFERENCE_MODULE_NOTIFICATIONS.md) | 3A-4B / 3C-6 / 5C / 5G UX closeouts |
| Todo (Phase 0) | [TODO_LEVEL3_CERTIFICATION_REVIEW.md](./audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md) | [TODO_CONSTITUTIONAL_AUDIT.md](./audits/TODO_CONSTITUTIONAL_AUDIT.md) |
| Notebook (L3) | [NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md](./audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md) | [NOTEBOOK_CONSTITUTIONAL_AUDIT.md](./audits/NOTEBOOK_CONSTITUTIONAL_AUDIT.md), [NOTEBOOK_OPERATION_MATRIX.md](./audits/NOTEBOOK_OPERATION_MATRIX.md) |
| Place (Reference #5) | [PLACE_REFERENCE_COUNCIL_REVIEW.md](./audits/PLACE_REFERENCE_COUNCIL_REVIEW.md) | [PLACE_PATTERN_GUIDE.md](./PLACE_PATTERN_GUIDE.md), [PLACE_COMMERCE_BOUNDARY.md](./PLACE_COMMERCE_BOUNDARY.md), [PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md](./audits/PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md) |
| Reference Workspace | [REFERENCE_WORKSPACE_CHARTER_REVIEW.md](./audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md) | [REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md](./audits/REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md) |
| AI Platform (cross-cutting) | [AI_PLATFORM_CERTIFICATION_STRATEGY.md](./AI_PLATFORM_CERTIFICATION_STRATEGY.md) | [AI_PLATFORM_CONSTITUTION.md](./AI_PLATFORM_CONSTITUTION.md), [AI_PLATFORM_OPERATION_MATRIX.md](./AI_PLATFORM_OPERATION_MATRIX.md), [audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md](./audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md) |

---

### Personal Dashboard — platform shell (WS-L1 Certified with Findings, 2026-06-03)

**Reference Workspace co-surface** — dashboard archetype (widget grid + module routes). **WS-L1 Certified with Findings**.

| Pattern | Status | Key artifacts |
|---------|--------|----------------|
| WS-L1 certification | ✅ **Certified with Findings** | [PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md](./audits/PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md) |
| Routing contract | ✅ | [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](./PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) |
| Widget boundary | ✅ | [PERSONAL_DASHBOARD_WIDGET_CONTRACT.md](./PERSONAL_DASHBOARD_WIDGET_CONTRACT.md) |
| Cross-surface map | ✅ | [CROSS_SURFACE_TRANSITIONS.md](./CROSS_SURFACE_TRANSITIONS.md) |
| Context variants | ✅ | [PERSONAL_CONTEXT_VARIANTS.md](./PERSONAL_CONTEXT_VARIANTS.md) |
| Navigation enforcement | ✅ | `personalDashboardNavigation.ts` · `crossSurfaceNavigation.ts` |
| CI navigation tests | ✅ | 15 + 6 tests PASS |
| PlatformShell (personal) | ✅ | `DashboardLayoutInner` → 3C-4E |
| Registry drift CI | ✅ | `personalDashboardRegistryDrift.test.ts` (15 tests, Wave 2D) |
| Widget escalation in components | 🟡 Finding F-2 | Shell API ready; module interiors deferred |

**WS-L2 readiness:** **86%** (post-2D) — [PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md](./audits/PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md)

**Evidence:** [PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md](./audits/PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md), [PERSONAL_DASHBOARD_WAVE_2B_CLOSEOUT.md](./audits/PERSONAL_DASHBOARD_WAVE_2B_CLOSEOUT.md), [PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md](./audits/PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md), [PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md](./audits/PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md).

### Business Workspace — platform shell (WS-L1 Certified with Findings, 2026-06-14)

**Reference Workspace Program** — **not** UX slot #6, **not** architecture Reference #6. Inaugural **Reference Workspace** candidate — **WS-L1 Certified with Findings**.

| Pattern | Status | Key artifacts |
|---------|--------|----------------|
| WS-L1 certification | ✅ **Certified with Findings** | [BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md](./audits/BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md) |
| Module mount switch | ✅ | `BusinessWorkspaceContent.tsx` (authoritative) |
| Navigation single source | ✅ | `businessWorkspaceNavigation.ts` + `businessWorkspaceContracts.ts` |
| Segment URL canonical | ✅ | `buildBusinessWorkspaceModuleHref` — all mounted modules |
| CI drift enforcement | ✅ | `businessWorkspaceNavigation.test.ts`, `businessWorkspaceRegistryDrift.test.ts` |
| PlatformShell (business mode) | ✅ | `DashboardLayoutWrapper` → 3C-4F certified |
| Runtime scope | 🟡 Finding F-4 | `BusinessLayoutRuntimeShell`, `WorkspaceRuntimeScopeBridge` |
| Installed-module filter | 🟡 Finding F-4 | `BusinessConfigurationContext`, `DashboardLayoutWrapper` |
| Hub standardization | ✅ | Dead landings removed (1B); segment-page vs switch documented |
| Stub product UI | ✅ | **Removed** (Wave 1B) |
| Orphan segment pages | ✅ **Closed (1D)** | — |
| Route hygiene CI | ✅ | `businessWorkspaceRouteHygiene.test.ts` |

**WS-L2 readiness:** **88%** (post-1D) — [BUSINESS_WORKSPACE_WAVE_1D_CLOSEOUT.md](./audits/BUSINESS_WORKSPACE_WAVE_1D_CLOSEOUT.md)

**Canonical entries:** [WORKSPACE_ROUTING_CONTRACT.md](./WORKSPACE_ROUTING_CONTRACT.md) §5.

**Personal Dashboard shell:** `DashboardLayoutInner` — co-surface; **WS-L1 Certified with Findings** · **WS-L2 86%** (post-2D).

### Reference Workspace Program — combined (2026-06-03)

| Metric | Value |
|--------|-------|
| WS-L1 | Both co-surfaces certified |
| WS-L2 assessment | **~89% combined** (post-2F) — no certification |
| WS-L2 blockers | **0** (process) · findings RWS-F1, B-F3 remain |
| Cross-surface QA | ✅ Part 2H executed — [REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md](./audits/REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md) |
| Registration | Prep may begin; review blocked |

**Evidence:** [REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md](./audits/REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md) · [BUSINESS_WORKSPACE_WAVE_1D_CLOSEOUT.md](./audits/BUSINESS_WORKSPACE_WAVE_1D_CLOSEOUT.md) · [PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md](./audits/PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md)

**Evidence:** [BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md](./audits/BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md), [BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md](./audits/BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md), [BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md](./audits/BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md), [BUSINESS_WORKSPACE_WAVE_1C_CLOSEOUT.md](./audits/BUSINESS_WORKSPACE_WAVE_1C_CLOSEOUT.md), [BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md](./audits/BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md), [PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md](./audits/PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md), [PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md](./audits/PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md), [PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md](./audits/PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md), [REFERENCE_WORKSPACE_CHARTER_REVIEW.md](./audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md).

### Domain pattern annexes (Wave 6C — no numbered UX slots)

| Domain | Primary UX inheritance | Notes |
|--------|------------------------|-------|
| **HR** | Todo UX #3 + Drive UX #1 | Work management + entity browser annex |
| **Scheduling** | Calendar UX #5 | Time-grid already covered |
| **Marketplace (partner)** | Nearest built-in archetype + `moduleSpecs.md` | Partner pipeline doc — not UX slot |
| **Analytics** | Notifications UX #2 (feed/dashboard cards) | Annex when certification matures |
| **Business Workspace** | Reference Workspace track | Platform shell — not product `moduleId` |

---

*Last updated: 2026-06-03 (Personal Dashboard Wave 2D drift enforcement)*
