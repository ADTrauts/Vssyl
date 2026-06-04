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

## Todo — Reference Module #4 (Level 3)

**Copy for:** Task/work-item modules, assignment flows, operational satellites, cross-module links.

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

---

## Module guidance — which references to weight

| Target module | Primary references | Secondary | Unique teachable angle |
|---------------|-------------------|-----------|------------------------|
| **Todo** | *(certified — see Reference #4 above)* | — | — |
| **Notes** | *(paused 2026-06-01 — see Notebook initiative)* | — | Superseded by Notebook product track |
| **Notebook** | Todo (#4), File Hub (#1), Calendar (#3) | Chat (#2) AI facade patterns | Composition + NotebookLink; Phase 7 audit complete — **not L3 certified** |
| **Place** | File Hub (entities, V_Link), Chat (visibility) | Calendar (scheduling links), Notebook (listing embed) | **Reference Module #5** — external graph, directory, routing (2026-06-02) |
| **Dashboard** | File Hub (manifest, activity), Chat (realtime widgets) | — | Widget registry, composition (not full module CRUD) |
| **Analytics** | File Hub (activity vs analytics separation) | — | Read-only / derived metrics; often N/A trash |
| **Business Workspace** | Notebook (composition), File Hub (manifest) | [WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](./WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md) | **Platform shell** — hub switch, navigation, runtime bridge; **not** Reference #6 ([Wave 0 audit](./audits/BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md)) |

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
| Calendar | [CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md) | [CALENDAR_SERVICE_EXTRACTION_PLAN.md](./audits/CALENDAR_SERVICE_EXTRACTION_PLAN.md) |
| Todo (Phase 0) | [TODO_LEVEL3_CERTIFICATION_REVIEW.md](./audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md) | [TODO_CONSTITUTIONAL_AUDIT.md](./audits/TODO_CONSTITUTIONAL_AUDIT.md) |
| Notebook (L3) | [NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md](./audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md) | [NOTEBOOK_CONSTITUTIONAL_AUDIT.md](./audits/NOTEBOOK_CONSTITUTIONAL_AUDIT.md), [NOTEBOOK_OPERATION_MATRIX.md](./audits/NOTEBOOK_OPERATION_MATRIX.md) |
| Place (Reference #5) | [PLACE_REFERENCE_COUNCIL_REVIEW.md](./audits/PLACE_REFERENCE_COUNCIL_REVIEW.md) | [PLACE_PATTERN_GUIDE.md](./PLACE_PATTERN_GUIDE.md), [PLACE_COMMERCE_BOUNDARY.md](./PLACE_COMMERCE_BOUNDARY.md), [PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md](./audits/PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md) |
| AI Platform (cross-cutting) | [AI_PLATFORM_CERTIFICATION_STRATEGY.md](./AI_PLATFORM_CERTIFICATION_STRATEGY.md) | [AI_PLATFORM_CONSTITUTION.md](./AI_PLATFORM_CONSTITUTION.md), [AI_PLATFORM_OPERATION_MATRIX.md](./AI_PLATFORM_OPERATION_MATRIX.md), [audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md](./audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md) |

---

### Business Workspace — platform shell (Wave 0, 2026-06-04)

**Not** a reference module candidate for slot **#6**. Copy orchestration patterns from platform docs, not from File Hub trash/V_Link stacks.

| Pattern | Status | Key artifacts |
|---------|--------|----------------|
| Module mount switch | ✅ | `BusinessWorkspaceContent.tsx` (authoritative) |
| Navigation single source | ✅ | `businessWorkspaceNavigation.ts` |
| Runtime scope | 🟡 | `BusinessLayoutRuntimeShell`, `WorkspaceRuntimeScopeBridge` |
| Installed-module filter | 🟡 | `BusinessConfigurationContext`, `DashboardLayoutWrapper` |
| Hub standardization | 🔴 | Dead `*WorkspaceLanding` for HR/Scheduling/Notebook; Place wired |
| Stub product UI | 🔴 | dashboard/analytics/members widgets — wrong layer |

**Evidence:** [BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md](./audits/BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md), [BUSINESS_WORKSPACE_OPERATION_MATRIX.md](./audits/BUSINESS_WORKSPACE_OPERATION_MATRIX.md). **Reference #6:** **No** — Dashboard or future product module is a better sixth-slot candidate than the shell.

---

*Last updated: 2026-06-04 (AI Platform Wave G0 + Business Workspace Wave 0)*
