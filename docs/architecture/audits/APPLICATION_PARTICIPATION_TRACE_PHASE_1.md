# Application Participation Trace — Phase 1

**Program:** Platform Participation Reconciliation  
**Phase:** 1 — Evidence-based vertical application participation trace  
**Date:** 2026-09-08  
**Status:** Non-authoritative evidence report — **NOT** an architecture source of truth  
**Auditor posture:** Discovery only. No implementation, redesign, normalization, or fixes.

---

## 1. Purpose and scope

This document answers, with repository evidence:

> **How does an application participate in Vssyl today?**

It traces four representative application types end-to-end through existing platform mechanisms so later phases can decide whether architecture needs strengthening, consolidation, or no change.

**Product principle under validation** (from *VSSYL Product Definition & Canonical Language Guide — Draft 2*, referenced by the Phase 1 brief; **file not found in this repository** at audit time):

> Applications own their domain truth, while Vssyl connects their meaning into a shared operational understanding of the person and organization. Shared platform capabilities should consume authorized application/integration contributions without becoming shadow systems of record or recreating domain business logic.

**In scope:** Static inspection of code, configs, migrations, tests, and canonical architecture docs for:

1. File Hub (`drive`)
2. Scheduling (`scheduling`)
3. Chat (`chat`)
4. Best available third-party / partner example (`vssyl-pilot-assets` + marketplace partner runtime)

**Out of scope:** Redesign, consolidation proposals, code changes, SoT edits, commits, deploys.

**Report placement rationale:** Preferred path `docs/architecture/reviews/` does **not** exist. Repository convention for non-authoritative module/platform audits is `docs/architecture/audits/` (see `ARCHITECTURE_SOURCE_OF_TRUTH.md` — audit closeouts are “Never edit for truth”). This report lives there to avoid creating a new architecture authority category.

---

## 2. Authority and sources inspected

### 2.1 Authority chain (startup)

| Priority | Source | Role in this audit |
|----------|--------|--------------------|
| 1 | GitHub repo (code / config / migrations / tests) | Implementation truth |
| 2 | `docs/VSSYL_SOURCE_OF_TRUTH.md` | Placement / hierarchy |
| 3 | `AGENTS.md` | Agent orientation (not architecture law) |
| 4 | `docs/architecture/VSSYL_ARCHITECTURE_INDEX.md` | Topic → owning doc |
| 5 | `docs/architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md` | Ownership matrix |
| 6 | Constitutional / domain docs below | Declared architecture |
| 7 | `memory-bank/*ProductContext.md`, `moduleSpecs.md` | Product intent / interop contract (may lag) |
| 8 | Prior audits under `docs/architecture/audits/` | Historical / certification evidence |

### 2.2 Canonical docs consulted (non-exhaustive)

| Domain | Document |
|--------|----------|
| Platform / module contract | `docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` |
| Application lifecycle | `docs/architecture/APPLICATION_LIFECYCLE.md` |
| Workspace runtime | `docs/architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`, `WORKSPACE_ROUTING_CONTRACT.md` |
| Policy Engine | `docs/architecture/POLICY_ENGINE.md` |
| Domain events | `docs/architecture/DOMAIN_EVENTS.md` |
| Global Trash | `docs/architecture/GLOBAL_TRASH.md` |
| V_Link | `docs/architecture/V_LINK.md` |
| Platform Entity Model | `docs/architecture/PLATFORM_ENTITY_MODEL.md` |
| Search | `docs/search/SEARCH_CONSTITUTION.md`, `SEARCH_PROVIDER_MODEL.md` |
| AI | `AI_SYSTEM_MENTAL_MODEL.md`, `AI_CONTEXT_ASSEMBLY.md`, `AI_CANONICAL_ROUTE_MAP.md`, `docs/guides/AI_CONTEXT_PROVIDER_API.md` |
| Notifications | `docs/guides/NOTIFICATION_METADATA_GUIDE.md` |
| Dashboard | `docs/dashboard/DASHBOARD_STATUS_RECORD.md`, `PERSONAL_DASHBOARD_WIDGET_CONTRACT.md` |
| Analytics | `docs/analytics/ANALYTICS_OWNERSHIP_MODEL.md`, `ANALYTICS_STATUS_RECORD.md` |
| Third-party | `docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`, `docs/marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md` |
| Module reference | `REFERENCE_MODULE_CATALOG.md`, `CERTIFICATION_LEDGER.md` |
| Interop contract | `memory-bank/moduleSpecs.md` |

### 2.3 Major implementation areas inspected

- `server/src/startup/registerBuiltInModules.ts`, `builtInModuleManifests.ts`, `registerPlatformEntities.ts`, `registerGlobalTrashHandlers.ts`
- `web/src/runtime/modules/coreModuleRegistry.ts`, `moduleRegistry.ts`
- `web/src/lib/businessWorkspaceContracts.ts`, `BusinessWorkspaceContent.tsx`
- `web/src/contexts/BusinessConfigurationContext.tsx`
- Search / AI / V_Link / events / activity / trash / marketplace packages under `server/src/`
- Per-module services, routes, Prisma modules, and targeted tests

### 2.4 Product language note

Draft 2 of the Product Definition & Canonical Language Guide was **not located** in-repo (`Glob` / content search returned no match). This report uses the brief’s terminology (Application, Module, Capability, Surface, Domain owner, System of record, Application contribution, Shared operational understanding, Projection, Business workspace, Dashboard, Unified Search, Interoperability) while treating **code + canonical architecture** as authoritative for what is implemented.

---

## 3. Repository state

Captured at audit start (non-mutating):

| Field | Value |
|-------|-------|
| Branch | `main` |
| HEAD SHA | `3feebc09a29c86da2a843b04856c462fa55be444` |
| `origin/main` SHA | `3feebc09a29c86da2a843b04856c462fa55be444` |
| Ahead / behind | `0` / `0` |
| Staged changes | None |
| Unstaged (sample) | `.env.example`, `cloudbuild.yaml`, deploy scripts, auth pages, `web/src/lib/auth.ts`, `backendUrl.ts` (untracked), etc. |
| Untracked (sample) | `.cursor/plans/*`, `docs/go-to-market/*`, `docs/deployment/MANUAL_CLOUD_BUILD_DEPLOY.md` |

**Constraint honored:** Unrelated dirty worktree left undisturbed (no stash/reset/checkout/clean).

---

## 4. Executive findings

1. **CONFIRMED** — First-party applications participate via a **multi-declaration stack**: DB/built-in module seed → `buildBuiltInModuleManifest` → `registerBuiltInModules` (incl. AI ContextProviders) → `platformEntityRegistry` → frontend `coreModuleRegistry` → workspace contracts + **hardcoded switch** in `BusinessWorkspaceContent`.
2. **CONFIRMED** — File Hub (`drive`), Chat, and Scheduling each own domain SoR in Prisma + canonical services; platform systems generally **federate** (search visibility services, AI context providers, trash handlers) rather than becoming alternate SoRs.
3. **CONFIRMED** — Server manifest capabilities and frontend `coreModuleRegistry` capabilities **drift**, especially Chat and Scheduling (backend richer; frontend sparse). Drive is the closest alignment.
4. **CONFIRMED** — Business workspace mounting for first-party apps is **switch-based** (`BusinessWorkspaceContent`), with contracts listing switch-mounted modules; registry is consulted but not used as the renderer. Partner modules fall through to `PartnerModuleWorkspaceEmbed`.
5. **CONFIRMED** — Policy Engine **coexists** with legacy permission checks via dual-enforcement helpers (`*PolicyDual.ts`) for drive/chat/scheduling; docs describe partial PE rollout.
6. **CONFIRMED** — AI ContextProviders and SearchProviders are mature **application contribution** patterns for first-party modules (visibility-gated, source-owned reads).
7. **CONFIRMED** — Dashboard widgets exist per module (`widgetRegistry` / core registry `widgets[]`) but are more **bespoke projections** than Search/AI contribution contracts.
8. **CONFIRMED** — Analytics lacks a Search/AI-class per-application provider registry; ownership model is documented, participation is **bespoke** (chat analytics service; scheduling 501 stubs; drive via capability rollups).
9. **CONFIRMED** — Internal module interoperability (Drive↔Chat attachments, Scheduling↔HR publish, Chat socket hub fan-out) is materially richer than external-system interoperability contracts.
10. **CONFIRMED** — No complete partner-authored uploaded module product exists in-repo; best example is internal sandbox pilot `vssyl-pilot-assets` plus a certified **partner runtime platform** (search/workspace/activity delegates).
11. **CONFIRMED** — Scheduling published operation matrix / portions of `V_LINK.md` **lag code** (search, PE, trash, V_Link, notifications now present in code).
12. **CONFIRMED** — Scheduling intentionally omits `capabilities.realtime: true` while still emitting schedule socket events via Chat hub — declaration vs transport split.
13. **CONFIRMED** — Entity registry `supportsSearch` can disagree with live SearchProviders (Scheduling: registry `false`, provider `ready`, manifest `supportsSearch: true`).
14. **CONFIRMED** — `BusinessConfigurationContext` mixes installed-module state with coarse role/`view`/`manage` modulePermissions and position/tier permission maps — modern install path + legacy coarse permission concepts.
15. **INFERENCE** — Platform participation is **mechanism-plural** (many registries) rather than a single “application contribution” facade; coherence is highest where File Hub–style service extraction was applied.

---

## 5. File Hub vertical trace (`drive`)

**User-facing name:** File Hub · **Module id:** `drive` · **Certification (docs):** Level 4 Reference Implementation (`CERTIFICATION_LEDGER.md`, `REFERENCE_MODULE_CATALOG.md`).

### A. Identity / registration

| Claim | Confidence | Evidence |
|-------|------------|----------|
| Canonical id `drive`, name File Hub | CONFIRMED | `registerBuiltInModules.ts` :: `BUILT_IN_MODULE_DEFINITIONS`; `builtInModuleIds.ts` |
| Server manifest builder | CONFIRMED | `builtInModuleManifests.ts` :: `case 'drive'` / `buildBuiltInModuleManifest` |
| Frontend core registry | CONFIRMED | `coreModuleRegistry.ts` :: `id: 'drive'`, `name: 'File Hub'` |
| Alternate frontend config | CONFIRMED | `web/src/config/modules.ts` :: `MODULES` |
| Built-in only (not marketplace) | CONFIRMED | No partner listing; bootstrap `businessBootstrapService.ts` :: `CORE_MODULES` |
| Naming drift “Drive” vs “File Hub” | CONFIRMED | `businessBootstrapService` still uses name `Drive` in places |

**Authoritative declaration (INFERENCE):** Runtime capability truth for platform consumers tends to follow `builtInModuleManifests.ts` + entity/search/AI registrations; frontend registry is parallel metadata. No single “authoritative capability SoT” enforced across both.

### B. Domain ownership

| Concern | Evidence |
|---------|----------|
| SoR | `prisma/modules/drive/files.prisma` :: `File`, `Folder`, `FilePermission`, `FolderPermission`, legacy `Activity` |
| Services | `driveUploadService`, `driveDeleteService`, `driveFileShareService`, `driveVisibilityService`, `driveNotificationService`, `driveRealtimeService`, `driveAIContextService`, `driveAIActionService`, `driveVlinkAccessService`, `driveVlinkLifecycleService` |
| HTTP | `routes/drive.ts`, `fileController`, `folderController`, `driveAIContextController` |
| Storage I/O | `storageService` via upload path — **bytes**, not domain metadata SoR |

**DOCUMENTED DIRECTION drift:** Some docs reference `driveActivityService` / `driveDomainEventService` files that **do not exist**; emission is inline + `domainEventEmitters.ts`.

### C. Manifest / capability declaration

**Backend** (`builtInModuleManifests.ts` :: `drive`): `read, write, ai, vlink, trash, realtime, notifications, search, preview, businessWorkspace, globalActivity`; entities `file`/`folder`; notifications `drive_permission`, `drive_shared`, restore/delete types.

**Frontend** (`coreModuleRegistry.ts`): same capability set as backend for drive (aligned).

**CONFIRMED drift elsewhere:** AI action permissions include `drive:share` / `drive:delete`; `web/src/config/modules.ts` uses `view`/`upload`/`delete`; seed RBAC uses different vocabularies.

### D. Frontend runtime

- Discovery: `moduleRegistry` / `CORE_MODULE_DEFINITIONS`; personal contracts `personalDashboardContracts.ts` (`pathSegment: 'drive'`).
- Personal: `web/src/app/drive/**` → `DrivePageContent` / `DriveModuleWrapper` → `DriveModule` / `EnhancedDriveModule`.
- Mixed: registry-driven metadata + hardcoded app routes + workspace switch.

### E. Business workspace

- Contract: `businessWorkspaceContracts.ts` — `segment-switch`, `entryComponent: 'DriveWorkspaceLanding'`.
- Mount: `BusinessWorkspaceContent.tsx` :: `case 'drive'`.
- Segment page stub may return null when switch-mounted (pattern shared with chat).
- Install: core bootstrap; feature gate e.g. `useFeature('drive_advanced_sharing')` in wrapper.

### F. Authorization

| Layer | Evidence |
|-------|----------|
| AuthN | `authenticateJWT` on drive routes |
| Tenant / visibility | `dashboardId` + `driveVisibilityService` / permission helpers |
| Legacy | `drivePermissionHelpers.ts` :: `canRead*` / `canWrite*` |
| PE | `policyEngine.ts` file/folder authorize helpers |
| Dual | `drivePolicyDual.ts` :: `evaluateDrivePolicyDual` |
| Tests | `drivePolicyDual.test.ts`, `fileController.pe-d2.test.ts` |

Docs: intentional dual-enforcement / partial PE rollout — **not treated as defect**.

### G. Entity participation

- `platformEntityRegistry.ts` :: `registerDrivePlatformEntities()` — `file`/`folder`, `supportsSearch: true`, V_Link `FILE`/`FOLDER`.
- Context graph: `driveAdapter.ts`.
- Startup: `registerPlatformEntities.ts`.

### H. Unified Search

- `searchProviderRegistry.ts` :: `driveSearchProvider` (`readiness: 'ready'`, `searchMethod: 'visibility_service'`).
- Implementation: `searchAccessibleDriveFiles` / `Folders` in `driveVisibilityService`.
- **Federates** authorized source data; does not copy SoR into search store (CONFIRMED pattern).

### I. AI context

- Registered providers: `recent_files`, `storage_overview`, `file_count` in `registerBuiltInModules.ts`.
- Controllers/services: `driveAIContextController`, `driveAIContextService` → visibility.
- Twin discovery: module AI registration + pipeline source map (`drive_files`).

### J. AI actions

- Separate from context: `ActionExecutor.executeDriveAction` → `driveAIActionService` (`aiCreateFolder`, `aiShareFile`, `aiDeleteFile`, …).
- Tools: `list_drive_files`, `share_file` in tool executor / risk registries.
- Mutations return through domain services; authority inherits actor (CONFIRMED pattern).

### K. V_Link

- Access / lifecycle: `driveVlinkAccessService`, `driveVlinkLifecycleService`.
- Resolver: `vlinkEntityResolverService` FILE/FOLDER cases.
- Relationship ≠ permission: access services re-check visibility/PE (CONFIRMED intent).

### L. Domain events

- Types: `FILE_*`, `FOLDER_*` in `domainEventRegistry.ts`.
- Emitters: `domainEventEmitters.ts`; sites in upload/delete/share/controllers/AI actions.
- Consumers: notification subscriber, AI suggestion rules (`documentUploadRule`, etc.).

### M. Activity

- `emitModuleActivityEvent({ moduleId: 'drive', ... })` at mutation sites.
- Mapper: `platformActivityDriveMapper.ts`; legacy Prisma `Activity` bridge remains.

### N. Notifications

- `driveNotificationService` → `NotificationService`; types in manifest + UI maps.
- Delivery/attention layer, not SoR (CONFIRMED).

### O. Realtime

- `driveRealtimeService` / `chatSocketService.broadcastDriveEvent`; client `useDriveWebSocket`.
- Events: `drive:item:created|updated|deleted|moved|pinned`.
- Projection transport over domain SoR (CONFIRMED).

### P. Global Trash / lifecycle

- `registerGlobalTrashHandlers.ts` drive handler → `driveDeleteService` soft/restore/permanent.
- Schema: `trashedAt` on File/Folder.

### Q. Dashboard projection

- Widget `drive` in widget registry; `DriveWidget.tsx`; personal contract `widgetType: 'drive'`.
- Bespoke widget fetch vs SearchProvider-style contract (CONFIRMED relative to H/I).

### R. Analytics

- Derived: `analyticsCapabilityService` / `analyticsDashboardSummaryService` count/storage rollups.
- No drive-owned AnalyticsProvider registry entry.

### S. External / interoperability

- GCS/local via `storageService`; Chat attachments; HR onboarding folders; Todo picker; Notebook link refs; workforce attachment relations.
- Domain-specific integrations, not a generic external provider contract.

**Key tests:** extensive under `server/src/**/drive*.test.ts`, `builtInModuleManifests.drive.test.ts`, e2e `tests/e2e/drive/*`.

---

## 6. Scheduling vertical trace (`scheduling`)

**Module id:** `scheduling` · **Docs:** Reference Candidate #6; published `SCHEDULING_OPERATION_MATRIX.md` is **stale vs code** on several surfaces (PE, trash, V_Link, notifications, search).

### A. Identity / registration

- Seed: `seedSchedulingModule.ts` :: `seedSchedulingModuleOnStartup` (`id: 'scheduling'`).
- Built-in + AI: `registerBuiltInModules.ts`.
- Manifest: `builtInModuleManifests.ts` :: `case 'scheduling'`.
- Entities: `registerSchedulingPlatformEntities()`.
- **Drift:** seed `entryPoint` still `/business/[id]/admin/scheduling`; icon `calendar-clock` vs built-in `clock`.

### B. Domain ownership

- Prisma: `prisma/modules/scheduling/core.prisma` — `Schedule`, `ScheduleShift`, `ShiftTemplate`, `ScheduleTemplate`, `EmployeeAvailability`, `ShiftSwapRequest`, `BusinessStation`, `JobLocation`.
- Services: `schedulingScheduleService`, `schedulingShiftService`, `schedulingPublishService`, `schedulingSwapService`, `schedulingTrashService`, `schedulingAIActionService`, etc.
- Org chart / HR PTO: **read/consume**, not owned (publish bridge `hrScheduleService`).
- Business fields `schedulingMode` / `schedulingStrategy` owned by Business config, consumed by Scheduling.

### C. Manifest / capability declaration

- Backend caps: `read, write, ai, vlink, trash, notifications, globalActivity, search, businessWorkspace` — **no** `realtime: true` (test-enforced intentional omission).
- Frontend (`coreModuleRegistry`): **only** `['read', 'write']` — **CONFIRMED DRIFT**.
- Entity `supportsSearch: true` in manifest vs `false` in `platformEntityRegistry` — **CONFIRMED DRIFT** (while SearchProvider exists).

### D. Frontend runtime

- `SchedulingLayout`, workspace pages under `web/src/app/business/[id]/workspace/scheduling/**`, legacy admin page, `web/src/api/scheduling.ts`, `useScheduling`, `useSchedulingWebSocket`, `SchedulingAIAssistant`.

### E. Business workspace

- Contract switch-mounted `SchedulingLayout`; `BusinessWorkspaceContent` :: `case 'scheduling'`.
- Business-scoped (`supportedContexts: BUSINESS_ONLY`).
- Visibility via installed modules + feature gating (`checkSchedulingModuleInstalled`).

### F. Authorization

- Legacy middleware: `schedulingPermissions.ts` (admin/manager/employee/self).
- PE actions: `policyActions.ts` SCHEDULING_*; rules in `policyEngine.ts`.
- Dual: `schedulingPolicyDual.ts` — deny blocks; `POLICY_NOT_IMPLEMENTED` does not fail closed the same way (documented dual pattern).
- Wired on `routes/scheduling.ts`.

### G. Entity participation

- Registered: `schedule`, `shift`, `swap_request`.
- Templates **not** platform entities (test-confirmed).
- Search flag mismatch (see C/H).

### H. Unified Search

- `schedulingSearchProvider` ready → `searchAccessibleScheduling` in `schedulingVisibilityService`.
- Federated visibility search (CONFIRMED).

### I. AI context

- Providers: `scheduling_overview`, `coverage_status`, `scheduling_conflicts`.
- Controllers/services: `schedulingAiContextController`, `schedulingAiContextService`.
- Selection: `moduleContextProviderSelection.ts` includes `'scheduling'` in business-scoped set.

### J. AI actions

- `ActionExecutor.executeSchedulingAction` → `schedulingAIActionService` (generate/publish/assign/swap/availability/claim).
- HTTP AI routes for generate/suggest.
- Domain-service mutation path (CONFIRMED).

### K. V_Link

- `schedulingVlinkAccessService`, `schedulingVlinkLifecycleService`; resolver cases SCHEDULE / SCHEDULE_SHIFT / SHIFT_SWAP_REQUEST.
- **DOCUMENTED DIRECTION stale:** `V_LINK.md` still says scheduling not integrated — **code contradicts**.

### L. Domain events

- Registry + `schedulingDomainEventService` facade + emitters; matrix `emitsDomainEvents: true`.

### M. Activity

- `schedulingActivityService` :: `emitSchedulingActivity` → `emitModuleActivityEvent`.

### N. Notifications

- `schedulingNotificationService`; types `scheduling_schedule_published`, `_shift_assigned`, swap/open-shift; frontend notification page maps present.

### O. Realtime

- Runtime: `chatSocketService` schedule room + `broadcastShift*` / `broadcastSchedulePublished`; client `useSchedulingWebSocket`.
- Manifest does **not** claim `realtime` capability (intentional).

### P. Global Trash

- `trashedAt` on Schedule/Shift/ScheduleTemplate; `schedulingTrashService`; `registerGlobalTrashHandlers` scheduling entry.

### Q. Dashboard

- Widget + `SchedulingWidget` → `GET /api/scheduling/dashboard-summary` (`schedulingDashboardController`).
- In-module `SchedulingDashboard` view.

### R. Analytics

- Admin analytics methods return **501** (`getLaborCostAnalytics`, etc.); unrouted stubs.
- Recommendations service exists separately.
- **No** standardized AnalyticsProvider.

### S. External / interoperability

- HR calendar sync on publish; PTO conflict reads; Workforce Comms bridge on schedule published; onboarding UI hook.
- Internal module interop — not external payroll/POS provider contract.

**Key tests:** `builtInModuleManifests.scheduling.test.ts`, `schedulingPolicyDual.test.ts`, visibility/V_Link/trash/activity/notification/domain-event suites, `scheduling-tenant-scope.integration.test.ts`.

---

## 6b. Note on published Scheduling docs

Treat `docs/architecture/audits/SCHEDULING_OPERATION_MATRIX.md` as a historical BO snapshot where it disagrees with services listed above. Phase 2 should not use that matrix alone for participation matrix cells.

---

## 7. Chat vertical trace (`chat`)

**Certification (docs):** Level 3 · Reference Module #2.

### A. Identity / registration

- Built-in definition + AI providers `recent_conversations`, `unread_messages`, `conversation_history` — `registerBuiltInModules.ts`.
- Scope `both` — `builtInModuleScopes.ts`.
- Frontend `coreModuleRegistry` + personal dashboard contracts.
- Entities: `registerChatPlatformEntities()`.

### B. Domain ownership

- Prisma: `prisma/modules/chat/conversations.prisma` — Conversation, Message, Thread, participants, etc.
- Services: `chatConversationService`, `chatMessageService`, `chatThreadService`, `chatTrashService`, `chatVisibilityService`, `chatAttachmentService`, `chatAIActionService`, adapters for activity/notification/realtime/domain events.
- Thin controller contract tests (no Prisma in controller).

### C. Manifest / capability declaration

- Backend: full set including `ai, vlink, trash, realtime, notifications, search, businessWorkspace, globalActivity`.
- Frontend: **`['read', 'write', 'realtime']` only** — **CONFIRMED DRIFT**.

### D. Frontend runtime

- Personal `app/chat/page.tsx`; always-available chat via `ChatProvider` / `StackableChatContainer` / `UnifiedGlobalChat` in root layout.
- Business: `ChatModuleWrapper` / Enhanced module.
- Mixed always-on shell + workspace module surface.

### E. Business workspace

- Switch-mounted `ChatModuleWrapper`; segment stub returns null.
- No dedicated `ChatWorkspaceLanding.tsx` (documented accepted partial).

### F. Authorization

- Legacy: `chatPermissionService` participant/dashboard checks.
- Dual PE: `chatPolicyDual.ts`; actions in `policyActions` / `policyEngine`.
- Visibility: `conversationPassesReadPolicy` / filters.
- Socket join/typing: membership only, **no PE** (documented accepted).

### G. Entity participation

- Platform entity: `conversation` only; message/thread deferred (docs + code).
- Context graph: `chatAdapter` conversations.
- `CHAT_THREAD` label without access adapter.

### H. Unified Search

- `chatSearchProvider` → `searchAccessibleChat`.
- Separate invite user search (`chatUserSearchService`) — not Unified Search SoR.

### I. AI context

- Routes `/ai/context/recent`, `/unread`, `/query/history` → visibility-owned getters.
- Also `CrossModuleContextEngine.getChatContext`.

### J. AI actions

- `chatAIActionService` :: `aiSendMessage`, `aiCreateConversation`, `aiRespondToMessage` → canonical send/create.
- `ActionExecutor.executeChatAction`.

### K. V_Link

- Conversation access + lifecycle unlink on permanent delete.
- Thread type incomplete.

### L. Domain events

- Conversation + message lifecycle/reaction/read types; thread.created activity-only (documented).

### M. Activity

- `chatActivityService` → `emitModuleActivityEvent`.

### N. Notifications

- `chatNotificationService` (`chat_message`, `chat_mention`, `chat_reaction`); UI deep-links to chat.

### O. Realtime

- **Mature hub:** `ChatSocketService` is platform Socket.IO owner (conversation rooms, typing, reactions, read; also Drive/scheduling/place/notification fan-out; optional Redis adapter).
- Domain adapter `chatRealtimeService`.
- Broadcast-only `new_message` path does not create DB rows (mutation ownership remains HTTP/services).

### P. Global Trash

- Handler for `conversation` + `message`; conversation `trashedAt` vs message `deletedAt` (documented asymmetry).

### Q. Dashboard

- `ChatWidget`; templates; always-available chat is primary UX (product intent).

### R. Analytics

- `chatAnalyticsService` + `GET /api/chat/analytics`; ownership map in `analyticsCapabilityOwnership.ts`; consumed by dashboard summary unread rollup.
- Domain-owned metrics, not a platform AnalyticsProvider registry.

### S. External / interoperability

- Drive attachments PE/visibility; Todo↔Chat integration; HR onboarding deep links; socket hub reuse.
- Marketplace bots **not** shipped (product context).

**Key tests:** manifests, PE, visibility, trash, activity, events, V_Link, AI actions, analytics, e2e reactions.

---

## 8. Third-party module vertical trace

### Choice and rationale

| Field | Value |
|-------|-------|
| Chosen example | **`vssyl-pilot-assets`** (Vssyl Pilot Assets) |
| Why | Only **executable** partner-shaped participation in-repo: search delegate, workspace participation registration, activity ingest → `emitModuleActivityEvent`, allowlists, Level-3 partner capability certification pilot |
| What it is not | External partner product, uploaded zip SPA, or full HTTPS partner SoR |

**CONFIRMED:** No sufficiently complete third-party uploaded module product exists in the repository. Closest artifacts otherwise: `docs/guides/full-capability-partner-module.json` + `REFERENCE_PARTNER_MODULE_SPEC.md` (**spec only**); `docs/test-modules/upload-fixtures/` (scanner toys).

### A. Registration

- Constants: `shared/src/types/search-delegate.ts` :: `SANDBOX_PILOT_ASSETS_MODULE_ID`.
- Startup: `registerSandboxPilotSearchDelegateOnStartup`, `registerSandboxPilotWorkspaceParticipationOnStartup`, `registerSandboxPilotActivityIngestOnStartup`.
- DB sync paths also call sandbox register after partner sync (`syncPartner*FromDatabase`).
- Cert: `MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md` pilot module `vssyl-pilot-assets`.

### B. Domain ownership

- In-memory asset list in `sandboxPilotAssetsSearch.ts` — **platform-hosted sandbox SoR**, not partner-owned external system.
- Real partners expected to own entities off-platform (documented direction).

### C. Manifest / capabilities

- Hardcoded snapshots in register files (`search`, `workspace`, `activity`, `moduleScope: business`).
- Full capability JSON exists as **docs fixture**, not wired as this pilot’s body.

### D. Frontend runtime

- Host: `ModuleHost.tsx` (iframe sandbox), `PartnerModuleWorkspaceEmbed.tsx`.
- **No** pilot HTML/SPA package in repo (cert finding: iframe bundle follow-up).

### E. Business workspace

- First-party switch default branch → `PartnerModuleWorkspaceEmbed` for non-first-party ids (`BusinessWorkspaceContent.tsx`).
- Workspace bridge JWT + init documented.

### F. Authorization

- Delegate JWTs: search / workspace bridge / activity ingest audiences.
- PostMessage auth bridge docs; no platform session token into iframe (CONFIRMED design).
- Feature flags / module allowlists gate pilot.

### G–R (summary)

| Layer | Status |
|-------|--------|
| Entities | In-memory `asset` only |
| Search | Implemented sandbox delegate |
| AI context / actions | **Not** on pilot (fixtures elsewhere; F-08 deferred) |
| V_Link | **Not implemented** for partners (cert) |
| Domain events | Partner inbound via activity ingest, not in-process PE bus |
| Activity | Implemented ingest → `emitModuleActivityEvent` |
| Notifications | Not implemented from partner activity (cert) |
| Realtime | Not implemented iframe bridge (cert) |
| Trash | Partner-owned contract; not wired for pilot |
| Dashboard | Not a pilot surface |
| Analytics | External; must not substitute activity |

### S. Supply chain / partner runtime (platform)

| Stage | Evidence |
|-------|----------|
| Upload / artifacts | `moduleArtifactController`, Prisma `ModuleVersion` / `ModuleArtifact` |
| Baseline / smart / malware scan | `moduleArtifactBaselineScan`, smart scan, `malwareScanningService` |
| Certification gates | `moduleCertificationValidator`, `moduleVersionCertificationGate` |
| Submit / approve | `moduleSubmissionController`, `adminModuleGovernanceService` |
| Install / scope / billing | `moduleScopeService`, subscriptions, Stripe probes |
| Runtime resolve | `moduleRuntimeController` :: `getModuleRuntimeConfig` |
| Participation surfaces | Search delegate, workspace bridge, activity ingest registries + proxies |

**CONFIRMED hypothesis #10:** Third-party Vssyl modules have a mature **runtime/supply-chain** contract distinct from external business systems (accounting/POS/payroll) — those external SoRs are not modeled by the partner iframe pipeline.

---

## 9. Cross-application comparison table

Legend: **Canonical** = clear SoR + platform wiring · **Implemented** = code present · **Partial** = subset / accepted gap · **Bespoke** = works without shared provider contract · **Declared only** = metadata without matching runtime · **Drift** = conflicting declarations · **Not found** / **N/A** / **Unknown**.

| Mechanism | File Hub | Scheduling | Chat | Third-party (`vssyl-pilot-assets`) |
|-----------|----------|------------|------|-------------------------------------|
| Registration | Canonical built-in | Canonical + seed | Canonical built-in | Partial sandbox + DB sync (§8A) |
| Domain owner | Canonical Prisma/services | Canonical Prisma/services | Canonical Prisma/services | Partial in-memory sandbox |
| Manifest (server) | Implemented rich | Implemented rich | Implemented rich | Partial hardcoded / docs fixtures |
| Capabilities (FE registry) | Aligned | Drift (sparse) | Drift (sparse) | N/A (host embed) |
| Frontend registry | Implemented | Implemented | Implemented | Partner host path |
| Business workspace | Switch-mounted | Switch-mounted | Switch-mounted | Default → Partner embed |
| Authorization | Dual PE + legacy | Dual PE + legacy | Dual PE + legacy; socket membership | Delegate JWT + allowlists |
| Entities | file/folder | schedule/shift/swap | conversation only | asset (memory) |
| Search | Implemented provider | Implemented provider + entity flag drift | Implemented provider | Implemented sandbox delegate |
| AI context | Implemented | Implemented | Implemented | Not found on pilot |
| AI actions | Implemented | Implemented | Implemented | Declared only (fixtures) |
| V_Link | Implemented | Implemented (docs stale) | Implemented (conversation) | Not found |
| Events | Implemented | Implemented | Implemented | Via activity ingest |
| Activity | Implemented | Implemented | Implemented | Implemented ingest |
| Notifications | Implemented | Implemented | Implemented | Not found (cert) |
| Realtime | Implemented + claimed | Runtime yes / claim no | Mature hub + claimed | Not found |
| Trash/lifecycle | Implemented | Implemented | Implemented (asymmetry) | Not found |
| Dashboard | Bespoke widget | Bespoke widget | Bespoke widget + always-on chat | Not found |
| Analytics | Bespoke rollup consumer | 501 stubs / local UI | Domain analytics service | External / not in feed |
| Interoperability | Internal modules + storage | HR/workforce bridges | Drive/todo + socket hub | Partner runtime ≠ external ERP |

Non-obvious cells: Scheduling realtime claim (§6O); Scheduling search entity flags (§6C/G/H); Chat FE capability drift (§7C); pilot incompleteness (§8).

---

## 10. Participation mechanisms inventory

| Mechanism | Canonical owner (docs/code) | Purpose | Source of truth (today) | Consumers | Consistent across 4 apps? |
|-----------|----------------------------|---------|-------------------------|-----------|---------------------------|
| Built-in / DB module record | Application lifecycle + startup seed | Identity, install | `Module` rows + `registerBuiltInModules` / seeds | Install UI, scope, billing | Pilot uses sandbox ids; first-party yes |
| Server manifest (`buildBuiltInModuleManifest`) | Platform standards / moduleSpecs | Declare caps, entities, notifications | `builtInModuleManifests.ts` | Cert tests, some sync | First-party yes; pilot partial |
| Frontend `coreModuleRegistry` | Workspace runtime docs | UI metadata, widgets, routes | `coreModuleRegistry.ts` | Shell, registry helpers | Drift vs server for chat/scheduling |
| `BusinessWorkspaceContent` switch + contracts | Workspace routing contract | Mount first-party UI | Switch + `businessWorkspaceContracts.ts` | Business workspace | First-party switch; partner default embed |
| Platform Entity Registry | `PLATFORM_ENTITY_MODEL.md` | Entity metadata | `platformEntityRegistry.ts` | Activity, V_Link hints, trash | Pilot no; scheduling search flag drift |
| SearchProvider / Search Delegate | Search Constitution / provider model | Federated discovery | `searchProviderRegistry` + partner delegate registry | Unified Search | First-party providers; pilot delegate |
| AI ContextProvider / ModuleAIContext | AI context assembly + moduleSpecs | Authorized context contribution | `registerBuiltInModules` + HTTP providers | Digital Life Twin | First-party yes; pilot no |
| AI ActionExecutor / tools | AI execution architecture | Governed mutations | `ActionExecutor` + domain `*AIActionService` | Twin tools | First-party yes; pilot fixtures only |
| V_Link resolvers / lifecycle | `V_LINK.md` | Relationship context | `vlinkEntityResolverService` + module access services | V_Link UI/graph | First-party yes; partner no |
| Domain events | `DOMAIN_EVENTS.md` | Cross-cutting fan-out | `domainEventRegistry` / emitters | Notifications, AI suggestions | First-party yes; partner via activity |
| Module activity | Platform activity query model / moduleSpecs | Immutable “what happened” | `emitModuleActivityEvent` | Feeds, mappers | First-party + pilot ingest |
| Notification taxonomy | Notification metadata guide | Attention delivery | Manifest types + `NotificationService` | UI, grouping, email/push | First-party yes; partner no |
| Realtime (Socket.IO hub) | Chat as hub owner (domain map) | Live projection | `chatSocketService` + module adapters | Clients | Chat owns hub; drive/scheduling consume |
| Global Trash handlers | `GLOBAL_TRASH.md` | Soft-delete lifecycle | `registerGlobalTrashHandlers` | Trash UI/API | First-party yes; partner no |
| Dashboard widgets | Dashboard / personal widget contracts | Projection surfaces | `widgetRegistry` / module `widgets[]` | Dashboard grids | First-party yes; pilot no |
| Analytics paths | Analytics ownership model | Derived metrics | Bespoke services + summary | Dashboards/admin | **Inconsistent / incomplete** |
| Partner runtime (iframe + JWT delegates) | Third-party pipeline SoT | Sandboxed module host | Marketplace services + `ModuleHost` | Partner modules | Pilot partial only |

**No replacement proposed** (Phase 1 constraint).

---

## 11. Confirmed drift / duplication / missing evidence

### A. Confirmed consistent mechanisms

- First-party apps own Prisma SoR + service mutations; Search/AI context read through visibility services.
- Dual PE + legacy pattern documented and implemented for drive/chat/scheduling.
- Global Trash handler registration for all three first-party apps.
- AI actions delegate to domain `*AIActionService` (no broader AI authority found).
- Partner default workspace path uses embed host rather than inventing first-party switch cases per partner.

### B. Confirmed inconsistent declarations

- Server vs frontend capabilities: Chat, Scheduling (sparse FE); Drive aligned.
- Scheduling: manifest `supportsSearch: true` vs entity registry `supportsSearch: false` vs live SearchProvider.
- Scheduling seed entryPoint/icon vs workspace/manifest.
- File Hub bootstrap naming “Drive” vs “File Hub”.
- Permission vocabularies (`drive:read` vs UI `view`/`upload` vs seed RBAC).

### C. Confirmed parallel mechanisms

- Server manifest vs frontend registry vs `web/src/config/modules.ts` vs seed module JSON.
- Workspace **contracts** vs **hardcoded switch** vs registry definitions (registry read but voided in `BusinessWorkspaceContent`).
- Legacy module activity / Prisma Activity vs `emitModuleActivityEvent`.
- Chat always-available shell vs Chat as workspace module vs Chat widget.
- Partner contribution via JWT delegates vs first-party in-process providers (same philosophy, different mechanism).

### D. Documented direction not yet fully implemented

- Partner AI context/actions, V_Link, notifications, realtime iframe bridge (marketplace cert findings).
- Chat message/thread platform entities; ChatWorkspaceLanding.
- External AI capabilities (web search etc.) — separate, not shipped.
- Analytics as a uniform contribution contract (ownership model discovery; incomplete standardization).
- Portions of Scheduling operation matrix / V_LINK integration table vs code.

### E. Genuine absence / no evidence found

- Complete third-party uploaded partner application in-repo.
- Product Definition & Canonical Language Guide Draft 2 file in-repo.
- `docs/architecture/reviews/` directory.
- Per-application AnalyticsProvider registry analogous to SearchProvider.
- Scheduling analytics routes beyond 501 stubs.

### F. Unknown / requires runtime verification

- Whether production DB module rows match `buildBuiltInModuleManifest` after sync for all tenants.
- Whether PE dual fail-open on `POLICY_NOT_IMPLEMENTED` is exercised in production configs.
- End-to-end partner upload→scan→approve→install→iframe for a real zip (fixtures only statically).
- Whether frontend code paths **consume** capability arrays for gating (vs decorative metadata).
- Live Redis adapter behavior for Chat hub in production.

---

## 12. Questions Phase 2 must answer

1. Which declaration is authoritative for **capabilities** — server manifest, frontend registry, DB module row, or a reconciled projection — and what may remain transitional?
2. Should Business workspace **rendering** remain switch-authoritative, or must registry/contracts become the single mount SoT?
3. Are Dashboard widgets governed by a formal **application contribution** contract, or intentionally bespoke projections?
4. Is there a canonical **analytics contribution** mechanism, or should analytics remain domain-owned + platform rollup only?
5. Which permission path (PE, legacy helpers, `BusinessConfigurationContext` coarse roles/positions, org-chart) is transitional vs permanent for Business workspace visibility?
6. How should **entity registry flags** (e.g. `supportsSearch`) relate to live SearchProviders when they disagree?
7. Is intentional non-claim of `realtime` (Scheduling) a lasting pattern for “runtime exists, capability uncertified”?
8. Should partner JWT delegates and first-party Context/Search providers be described as one **participation model** with two adapters, or kept as separate architectures?
9. What minimum bar makes a third-party module “complete” for participation matrix rows (UI bundle required?)?
10. Which published audits/matrices must be marked historical so Phase 2 does not encode stale cells?

---

## 13. Runtime verification needed

| Claim | Why static is insufficient | Suggested verification (do not claim run unless executed) |
|-------|----------------------------|-------------------------------------------------------------|
| Manifest sync to DB | Seed vs builder drift | Inspect a live `Module` row for `scheduling`/`drive` after startup; or targeted startup tests |
| Capability arrays drive UI | May be unused metadata | Grep + runtime breakpoint on consumers of `capabilities` in web; feature flag gates |
| PE dual in production | Config/env dependent | Run `pnpm --filter` focused `*PolicyDual*.test.ts`; staging deny/allow matrix |
| Search authorization | Needs tenant fixtures | Existing `*VisibilityService.test.ts` + staging Unified Search queries |
| Partner iframe E2E | No partner SPA in repo | Manual: upload fixture zip → approve → install → open workspace embed |
| Scheduling socket rooms | Membership path | Runtime: publish schedule and observe `schedule:*` events with two clients |
| Analytics 501s | Confirm unrouted | `curl` admin analytics endpoints / route inventory |
| Always-available chat vs PE | Socket path | E2E join without HTTP PE path |

**Commands executed in this Phase 1 audit:** git status/rev-parse only (non-mutating). **No** test suite claimed PASS/FAIL.

---

## Appendix A — Hypothesis verification (prompt § Special)

| # | Hypothesis | Verdict |
|---|------------|---------|
| 1 | Server vs FE capability drift | **CONFIRMED** (esp. chat, scheduling; drive aligned) |
| 2 | Dynamic registry vs manual switch | **CONFIRMED** switch-authoritative mount; registry metadata parallel |
| 3 | BusinessConfigurationContext modern + legacy | **CONFIRMED** (`hasPermission` role/`view`, position/tier maps + modules) |
| 4 | PE + legacy dual enforcement | **CONFIRMED** + documented partial rollout |
| 5 | AI ContextProviders mature contributions | **CONFIRMED** for first-party traced apps |
| 6 | SearchProviders same philosophy | **CONFIRMED** visibility/federated for first-party |
| 7 | Dashboard more bespoke | **CONFIRMED** |
| 8 | Analytics lacking comparable contract | **CONFIRMED** |
| 9 | Internal interop > external interop | **CONFIRMED** |
| 10 | Third-party runtime ≠ external ERP interop | **CONFIRMED** |

---

## Appendix B — Git / change control for this report

| Item | Value |
|------|-------|
| Initial HEAD | `3feebc09a29c86da2a843b04856c462fa55be444` |
| Final HEAD | same (no commit) |
| Modified by this phase | This file only (new) |
| Commit | NONE |
| Push | NONE |

---

*End of Phase 1 evidence report.*
