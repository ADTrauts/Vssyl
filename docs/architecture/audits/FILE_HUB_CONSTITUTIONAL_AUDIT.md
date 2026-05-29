# File Hub Constitutional Compliance Audit (FH-0)

**Module id:** `drive`  
**Product name:** File Hub  
**Audit date:** 2026-05-28  
**Phase:** FH-0 — discovery, verification, gap analysis only (**no code changes**)  
**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) and linked architecture extracts  
**Plan reference:** [file_hub_stabilization_plan_66bb107f.plan.md](../../../.cursor/plans/file_hub_stabilization_plan_66bb107f.plan.md)

---

## 1. Executive summary

File Hub is classified as a **Tier 1 canonical platform service** (platform storage infrastructure with module UI). It participates in several Runtime Kernel systems — Policy Engine (partial), `storageService`, Global Trash (partial), V_Link resolver, domain events (partial), module activity (partial), AI context providers, and federated search — but **does not yet qualify as constitutionally compliant**.

The module is the intended **reference implementation** for platform standards. Current state: **Partial compliance** with **multiple P0 violations** that block beta-grade reliability and violate Tier 0 adjacency rules (Global Trash permanent delete, canonical write path, scheduler governance).

### Headline findings

| Category | Verdict |
|----------|---------|
| Overall constitutional posture | **Partial** — functional product, incomplete platform contract |
| P0 blockers | 8 findings (trash/storage, AI bypass, star auth, enterprise regression, scheduler, duplicate trash API) |
| P1 gaps | 12+ findings (write-path omissions, capability drift, entity contract, PE coverage) |
| Tier classification | **Compliant** — Tier 1 documented correctly |
| FH-0.1 scope | **Confirmed valid** with expansions for `toggleFileStarred` auth and AI save-to-drive routes |

### Compliance score (approximate)

| Score | Areas |
|-------|-------|
| **Compliant (3)** | Infrastructure tier, storageService on primary upload/download, V_Link resolver for FILE/FOLDER |
| **Partial (14)** | Kernel participation, service boundaries, read/write paths, trash, events, activity, PE, AI, scheduler, capabilities, entity model, realtime, notifications, business workspace |
| **Non-compliant (3)** | Global trash permanent delete + storage, primary UI trash pipeline, scheduler registration |

---

## 2. Compliance scorecard

| # | Constitutional area | Status | Severity | Remediation phase |
|---|---------------------|--------|----------|-------------------|
| 1 | Runtime Kernel participation | Partial | P1 | FH-0.1, FH-1 |
| 2 | Infrastructure Tier classification | Compliant | — | Document in FH-0 (done) |
| 3 | Service boundary compliance | Partial | P0 | FH-0.1, FH-1 |
| 4 | Canonical read path compliance | Partial | P1 | FH-1, FH-2 |
| 5 | Canonical write path compliance | Partial | P0 | FH-0.1, FH-1 |
| 6 | Platform Entity Model compliance | Partial | P1 | FH-2.5 |
| 7 | Capability Matrix compliance | Partial | P1 | FH-2.6 |
| 8 | Global Trash compliance | Partial | P0 | FH-0.1 |
| 9 | V_Link compliance | Partial | P1 | FH-3A |
| 10 | Domain Event compliance | Partial | P1 | FH-0.1, FH-1 |
| 11 | Module Activity compliance | Partial | P1 | FH-0.1, FH-1 |
| 12 | Policy Engine compliance | Partial | P0 | FH-0.1, FH-1 |
| 13 | Scheduler compliance | Non-compliant | P0 | FH-1.5 |
| 14 | StorageService compliance | Partial | P0 | FH-0.1 |
| 15 | AI integration compliance | Partial | P0 | FH-0.1, FH-1 |
| 16 | Notification compliance | Partial | P2 | FH-1 |
| 17 | Search integration compliance | Partial | P2 | FH-2 |
| 18 | Business Workspace integration | Partial | P2 | FH-2 |
| 19 | Realtime/WebSocket integration | Partial | P1 | FH-3A, FH-2.6 |
| 20 | Governance / drift detection | Partial | P2 | FH-2.6, FH-6 |

---

## 3. P0 findings

| ID | Finding | Evidence | Requirement | Remediation |
|----|---------|----------|-------------|-------------|
| P0-1 | **Global trash permanent delete skips blob storage** | [trashController.ts](../../server/src/controllers/trashController.ts) `deleteItem` (~740), `emptyTrash` (~847) — Prisma only | §9 storage, [GLOBAL_TRASH.md](../GLOBAL_TRASH.md) permanent delete + storageService | FH-0.1 `driveDeleteService` |
| P0-2 | **Primary UI soft-delete uses global trash bypass** | [DriveModule.tsx](../../web/src/components/modules/DriveModule.tsx) → [GlobalTrashContext.tsx](../../web/src/contexts/GlobalTrashContext.tsx) → `POST /api/trash/items`; skips PE/events/activity/RT from module `deleteFile` | §7 Global Trash must use canonical handlers with full pipeline | FH-0.1 registry delegation |
| P0-3 | **Global trash owner-only vs shared write mismatch** | `trashController.trashItem` requires `{ id, userId }`; `deleteFile` uses `canWriteFile` | §4 permissions, fail closed | FH-0.1 + FH-1 |
| P0-4 | **AI `share_file` direct Prisma bypass** | [toolExecutor.ts](../../server/src/ai/tools/toolExecutor.ts) ~51-79 | §6 AI canonical services + PE | FH-0.1 |
| P0-5 | **`toggleFileStarred` has no auth check** | [fileController.ts](../../server/src/controllers/fileController.ts) ~1261-1276 — no `hasUserId`, no PE | §27 security boundaries | FH-0.1 or hotfix batch |
| P0-6 | **EnhancedDriveModule drops vlink + realtime** | [EnhancedDriveModule.tsx](../../web/src/components/drive/enterprise/EnhancedDriveModule.tsx) — no VLink/WebSocket; bulk delete unimplemented | §19 capability truth, §5 V_Link | FH-3A (enterprise parity) |
| P0-7 | **cleanupService not Platform Job Registry compliant** | [cleanupService.ts](../../server/src/services/cleanupService.ts); [index.ts](../../server/src/index.ts) ~1007 `startCleanupJob()`; duplicate cron register; direct Prisma | §22 Platform Job Scheduler | FH-1.5 |
| P0-8 | **Duplicate drive-only trash API** | `/api/drive/files/trashed`, restore, hard-delete; folder equivalents | §7 single canonical trash | FH-0.1 deprecate + delegate |

---

## 4. P1 findings

| ID | Finding | Evidence | Remediation |
|----|---------|----------|-------------|
| P1-1 | Fat controllers — mutations not in canonical services | `fileController.ts`, `folderController.ts` ~1600 lines | FH-1 service extraction |
| P1-2 | `moveFolder` missing Policy Engine dual enforcement | [folderController.ts](../../server/src/controllers/folderController.ts) `moveFolder` ~599 | FH-1 |
| P1-3 | Restore/hard-delete missing PE, events, activity, RT | Module + global trash restore/delete paths | FH-0.1, FH-1 |
| P1-4 | Only 4 domain event types for drive | [domainEventRegistry.ts](../../server/src/events/domainEventRegistry.ts); no move/rename/folder delete/restore | FH-1 |
| P1-5 | Share file: duplicate notifications (direct + domain subscriber) | `grantFilePermission` + `notificationDomainEventSubscriber` | FH-1 |
| P1-6 | Share/unshare missing module activity | `grantFilePermission`, `revokeFilePermission`, folder equivalents | FH-1 |
| P1-7 | `coreModuleRegistry` under-declares capabilities (read/write only) | [coreModuleRegistry.ts](../../web/src/runtime/modules/coreModuleRegistry.ts) ~75 vs [builtInModuleManifests.ts](../../server/src/startup/builtInModuleManifests.ts) ~41-51 | FH-2.6 |
| P1-8 | AI context claims "versioning" — not implemented | [registerBuiltInModules.ts](../../server/src/startup/registerBuiltInModules.ts) ~150 | FH-2.6 copy fix |
| P1-9 | File/Folder not formal PlatformEntityDescriptor registrations | [PLATFORM_ENTITY_MODEL.md](../PLATFORM_ENTITY_MODEL.md) | FH-2.5 |
| P1-10 | Folder hard-delete no child cascade | `hardDeleteFolder` ~455 — single row delete | FH-0.1 |
| P1-11 | AI save-to-drive routes bypass pipeline | [ai.ts](../../server/src/routes/ai.ts) save-to-drive ~528, edit-image ~662 | FH-1 |
| P1-12 | `list_drive_files` owner-only, no PE | [toolExecutor.ts](../../server/src/ai/tools/toolExecutor.ts) ~30 | FH-1 |
| P1-13 | listFiles owner-only — shared files invisible in folder view | [fileController.ts](../../server/src/controllers/fileController.ts) raw SQL owner scope | FH-2 |
| P1-14 | Stale E2E tests (`/api/files` not `/api/drive/files`) | [tests/e2e/drive/file.spec.ts](../../../tests/e2e/drive/file.spec.ts) | FH-6 |

---

## 5. P2 findings

| ID | Finding | Evidence | Remediation |
|----|---------|----------|-------------|
| P2-1 | No `DriveWorkspaceLanding.tsx` — inline hub pattern | [BusinessWorkspaceContent.tsx](../../web/src/components/business/BusinessWorkspaceContent.tsx) | FH-2 document or add |
| P2-2 | Duplicate satellite pages (starred/recent/shared/trash layouts) | [web/src/app/drive/](../../web/src/app/drive/) | FH-2 |
| P2-3 | Orphaned components (DriveSearch, FolderNode, PinIconOptions, DriveEnterpriseShowcase) | `web/src/components/` | FH-2 |
| P2-4 | Notifications capability without manifest `notifications[]` metadata block | [builtInModuleManifests.ts](../../server/src/startup/builtInModuleManifests.ts) | FH-2.6 |
| P2-5 | Permission vocabulary drift (`drive:*` vs `view/upload/delete`) | manifest vs [modules.ts](../../web/src/config/modules.ts) | FH-2.6 |
| P2-6 | Preview implemented but undeclared in manifest/registry | DriveDetailsPanel, download proxy | FH-2.6 |
| P2-7 | `/uploads` static mount in production-capable server | [index.ts](../../server/src/index.ts) | FH-1.5 / infra |
| P2-8 | Legacy `/api/folder` duplicate mount | [index.ts](../../server/src/index.ts) | FH-1 deprecate |
| P2-9 | Widget refreshMode manual despite realtime backend | runtime adapter | FH-2.6 |
| P2-10 | `createDashboardExport` stub | [fileMigrationService.ts](../../server/src/services/fileMigrationService.ts) | FH-2 |

---

## 6. P3 findings

| ID | Finding | Remediation |
|----|---------|-------------|
| P3-1 | Cosmetic: sidebar "Pinned" vs route `/drive/starred` | FH-2 |
| P3-2 | Dead query `?view=shared` on DriveWidget | FH-0.1 frontend fix |
| P3-3 | `getShareLink` client export unused | FH-2 investigate |
| P3-4 | `reorderFiles`/`reorderFolders` API — UI wiring unknown | FH-2 audit |

---

## 7. Area-by-area audit (20 domains)

### 7.1 Runtime Kernel participation

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P1 |
| **Current** | Uses PE (partial), storageService, Global Trash API, V_Link resolver, domain events (4 types), module activity, AI orchestrator providers, search provider, chatSocketService realtime |
| **Evidence** | [fileController.ts](../../server/src/controllers/fileController.ts), [registerBuiltInModules.ts](../../server/src/startup/registerBuiltInModules.ts), [searchController.ts](../../server/src/controllers/searchController.ts) |
| **Requirement** | §2 Runtime Kernel — modules extend, never replace |
| **Gap** | Controllers replace canonical services; trash/AI/scheduler paths bypass kernel mutation contract |
| **Remediation** | FH-0.1, FH-1 |

### 7.2 Infrastructure Tier classification

| Field | Detail |
|-------|--------|
| **Status** | Compliant |
| **Severity** | — |
| **Current** | Tier 1 — File Hub / `drive` per §2 inventory |
| **Evidence** | [VSSYL_PLATFORM_STANDARDS](../VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §0.1 |
| **Gap** | None |
| **Remediation** | Document only |

### 7.3 Service boundary compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P0 |
| **Current** | `driveService.ts` — helper only (chat folder, HR docs). Mutations live in controllers |
| **Evidence** | [driveService.ts](../../server/src/services/driveService.ts), §16 ownership map |
| **Requirement** | Controllers thin; canonical services own mutations |
| **Gap** | Known violation per constitution §16 table (`fileController`, `toolExecutor`) |
| **Remediation** | FH-0.1 `driveDeleteService`; FH-1 broader extraction |

### 7.4 Canonical read path compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P1 |
| **Current** | Download via controller + PE implicit via auth; search via `driveSearchProvider` with tenant scope; AI via context providers |
| **Evidence** | [fileController.downloadFile](../../server/src/controllers/fileController.ts), [searchController.ts](../../server/src/controllers/searchController.ts), [driveAIContextController.ts](../../server/src/controllers/driveAIContextController.ts) |
| **Requirement** | Resolver/provider → permission filter → canonical source |
| **Gap** | `listFiles` owner-only raw SQL; shared files missing; AI context weak tenant scoping (userId only) |
| **Remediation** | FH-2, FH-1 |

### 7.5 Canonical write path compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P0 |
| **Current** | Upload/share/create/update on module routes mostly follow PE → persist → events/activity/RT |
| **Evidence** | See §9 Write-path audit |
| **Requirement** | §16 write path mandatory chain |
| **Gap** | Trash UI path, restore, hard-delete, star file, moveFolder PE, AI tools |
| **Remediation** | FH-0.1, FH-1 |

### 7.6 Platform Entity Model compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P1 |
| **Current** | FILE/FOLDER in Prisma; V_Link resolver ✅ per [PLATFORM_ENTITY_MODEL.md](../PLATFORM_ENTITY_MODEL.md) |
| **Evidence** | [files.prisma](../../prisma/modules/drive/files.prisma), [vlinkEntityResolverService.ts](../../server/src/services/vlinkEntityResolverService.ts) |
| **Requirement** | §21 module-owned schema + platform contracts |
| **Gap** | No manifest `entities[]` registration; no PlatformEntityDescriptor adapter; tombstone behavior undocumented |
| **Remediation** | FH-2.5 |

### 7.7 Capability Matrix compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P1 |
| **Current** | Manifest declares 10 capabilities; registry declares 2 |
| **Evidence** | See §10 |
| **Requirement** | §19 truthful capability declaration |
| **Gap** | Registry drift; preview/versioning/analytics truth gaps; enterprise path breaks vlink/realtime |
| **Remediation** | FH-2.6, FH-3A |

### 7.8 Global Trash compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P0 |
| **Current** | File Hub Trash page filters GlobalTrashContext by `moduleId=drive` ✅ |
| **Evidence** | [drive/trash/page.tsx](../../web/src/app/drive/trash/page.tsx) ~153-157; [trashController.ts](../../server/src/controllers/trashController.ts) |
| **Requirement** | [GLOBAL_TRASH.md](../GLOBAL_TRASH.md) |
| **Gap** | Duplicate API; storage leak; no module-scoped empty; pipeline bypass on primary delete |
| **Remediation** | FH-0.1 |

### 7.9 V_Link compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P1 |
| **Current** | FILE/FOLDER resolver with permission checks; UI in DriveModule; link/unlink via vlinkService with domain events |
| **Evidence** | [V_LINK.md](../V_LINK.md), [DriveModule.tsx](../../web/src/components/modules/DriveModule.tsx), [vlinkService.ts](../../server/src/services/vlinkService.ts) |
| **Requirement** | Membership ≠ content access |
| **Gap** | EnhancedDriveModule missing; folder search partial; no drive module activity on link (uses VLinkActivity only) |
| **Remediation** | FH-3A |

### 7.10 Domain Event compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P1 |
| **Current** | 4 events: `file.uploaded`, `file.deleted`, `file.shared`, `folder.shared` |
| **Evidence** | [DOMAIN_EVENTS.md](../DOMAIN_EVENTS.md), [domainEventEmitters.ts](../../server/src/events/domainEventEmitters.ts) |
| **Requirement** | §8 registry taxonomy |
| **Gap** | Missing move, rename, restore, hard delete, folder delete, unshare |
| **Remediation** | FH-1 (document intentional omissions or add types) |

### 7.11 Module Activity compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P1 |
| **Current** | `emitModuleActivityEvent` on create/update/delete/move/share (partial), folder pin |
| **Evidence** | [moduleActivityService.ts](../../server/src/services/moduleActivityService.ts), folder/file controllers |
| **Gap** | Missing on share file, restore, hard-delete, global trash path, star file |
| **Remediation** | FH-0.1, FH-1 |

### 7.12 Policy Engine compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P0 |
| **Current** | `evaluateDrivePolicyDual` on primary write paths per [drivePolicyDual.ts](../../server/src/auth/drivePolicyDual.ts) |
| **Evidence** | [POLICY_ENGINE.md](../POLICY_ENGINE.md), [driveProductContext.md](../../../memory-bank/driveProductContext.md) § Authorization |
| **Gap** | trash global path, restore, hard-delete, moveFolder, star, share revoke, AI tools |
| **Remediation** | FH-0.1, FH-1 |

### 7.13 Scheduler compliance

| Field | Detail |
|-------|--------|
| **Status** | Non-compliant |
| **Severity** | P0 |
| **Current** | 30-day trash purge in cleanupService; started from index.ts |
| **Evidence** | [PLATFORM_JOB_REGISTRY.md](../PLATFORM_JOB_REGISTRY.md), [cleanupService.ts](../../server/src/services/cleanupService.ts) |
| **Requirement** | §22 — registry, canonical service invocation, no duplicate cron |
| **Gap** | Duplicate `scheduleTrashCleanup` + `startCleanupJob`; direct Prisma; not in registry annex as compliant |
| **Remediation** | FH-1.5 |

### 7.14 StorageService compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P0 |
| **Current** | Upload/download/hardDeleteFile use storageService |
| **Evidence** | [storageService.ts](../../server/src/services/storageService.ts), [fileController.ts](../../server/src/controllers/fileController.ts) |
| **Requirement** | §9 all production bytes via GCS abstraction |
| **Gap** | Global trash delete/empty; folder hard-delete; `/uploads` static fallback |
| **Remediation** | FH-0.1 |

### 7.15 AI integration compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P0 |
| **Current** | Context providers registered; fileAnalysisService; pipeline source `drive_files`; ActionExecutor for some ops |
| **Evidence** | [registerBuiltInModules.ts](../../server/src/startup/registerBuiltInModules.ts), [toolExecutor.ts](../../server/src/ai/tools/toolExecutor.ts) |
| **Requirement** | §6 governed actions through canonical services |
| **Gap** | share_file, list_drive_files, save-to-drive routes bypass |
| **Remediation** | FH-0.1, FH-1 |

### 7.16 Notification compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P2 |
| **Current** | `drive_permission`, `drive_shared` in [notifications/page.tsx](../../web/src/app/notifications/page.tsx) |
| **Evidence** | NotificationService in grant/revoke permission |
| **Gap** | Duplicate on file share; no manifest notifications metadata block |
| **Remediation** | FH-1, FH-2.6 |

### 7.17 Search integration compliance

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P2 |
| **Current** | `driveSearchProvider` in searchController; tenant + trashed exclusion |
| **Evidence** | [searchController.ts](../../server/src/controllers/searchController.ts) |
| **Gap** | Filename only; orphaned DriveSearch.tsx; trashed excluded ✅ |
| **Remediation** | FH-2 |

### 7.18 Business Workspace integration

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P2 |
| **Current** | `BusinessWorkspaceContent` case `drive` with DriveSidebar + DriveModuleWrapper |
| **Evidence** | [BusinessWorkspaceContent.tsx](../../web/src/components/business/BusinessWorkspaceContent.tsx) |
| **Gap** | Deprecated redirect at `business/.../workspace/drive`; no WorkspaceLanding |
| **Remediation** | FH-2 |

### 7.19 Realtime/WebSocket integration

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P1 |
| **Current** | `broadcastDriveEvent` + `useDriveWebSocket` in DriveModule |
| **Evidence** | [useDriveWebSocket.ts](../../web/src/hooks/useDriveWebSocket.ts), [chatSocketService.ts](../../server/src/services/chatSocketService.ts) |
| **Gap** | Not on EnhancedDriveModule; not on trash/restore/share paths |
| **Remediation** | FH-3A, FH-2.6 |

### 7.20 Governance / drift detection

| Field | Detail |
|-------|--------|
| **Status** | Partial |
| **Severity** | P2 |
| **Current** | This audit is first module-specific compliance artifact |
| **Requirement** | Appendix B drift checklist |
| **Gap** | No automated regression for capability truth or write-path contract |
| **Remediation** | FH-6 tests + FH-2.6 |

---

## 8. FILE entity audit

| Dimension | Status | Evidence | Gap |
|-----------|--------|----------|-----|
| **Ownership** | Partial | `File.userId` owner; permissions for collaborators | listFiles owner-only |
| **Lifecycle** | Partial | active → trashed (`trashedAt`) → permanent delete | No archived state; tombstone undocumented |
| **Permissions** | Partial | FilePermission canRead/canWrite; PE on wired paths | Global trash owner-only |
| **Trash behavior** | Partial | Module deleteFile ✅ pipeline; UI uses global trash ✗ | Pipeline split |
| **Restore behavior** | Non-compliant | Global restore — PE/events/RT missing | FH-0.1 |
| **Permanent delete** | Non-compliant | Module hardDeleteFile has storage; global path does not | FH-0.1 |
| **V_Link participation** | Compliant | VLinkEntityType.FILE; resolver checks read permission | EnhancedDriveModule missing UI |
| **AI visibility** | Partial | recent_files, storage_overview, file_count providers | list_drive_files owner-only |
| **Search participation** | Compliant | driveSearchProvider indexes files | Filename only |
| **Activity participation** | Partial | Module activity on CRUD/move; missing share/restore | FH-1 |
| **Entity resolver support** | Compliant | [vlinkEntityResolverService.ts](../../server/src/services/vlinkEntityResolverService.ts) FILE case | — |
| **Domain events** | Partial | uploaded, deleted, shared only | move/rename/restore/hard-delete |
| **Tenant scope** | Partial | `dashboardId` on model; not always enforced in queries | AI context userId-only |

---

## 9. FOLDER entity audit

| Dimension | Status | Evidence | Gap |
|-----------|--------|----------|-----|
| **Create** | Partial | createFolder with PE + activity + RT | driveService bootstrap skips PE |
| **Rename** | Partial | updateFolder with PE + activity + RT | No domain event |
| **Move** | Partial | moveFolder + updateFolder paths | **moveFolder missing PE** |
| **Trash behavior** | Partial | Same split as files (module vs global UI) | Pipeline split |
| **Restore behavior** | Non-compliant | Same as file restore | FH-0.1 |
| **Permanent delete** | Non-compliant | hardDeleteFolder — DB only, no cascade | FH-0.1 |
| **Cascade behavior** | Non-compliant | Soft trash does not cascade children; hard delete does not recurse | FH-0.1 |
| **Child inheritance** | Partial | Folder permissions exist; inherited via folder read for files | Not documented in entity contract |
| **V_Link participation** | Compliant | FOLDER resolver ✅ | EnhancedDriveModule missing |
| **Activity logging** | Partial | create/update/delete/move/pin | share missing MA |
| **AI visibility** | Partial | Indirect via file providers | No folder-specific provider |
| **Search visibility** | Partial | Folders in driveSearchProvider | — |
| **Resolver support** | Compliant | vlinkEntityResolverService FOLDER case | — |

**Important:** Folder lifecycle gaps (cascade, PE on moveFolder, hard-delete) are **separate and more severe** than file lifecycle gaps.

---

## 10. Capability matrix audit

| Capability | Declared (manifest) | Registry | Backend | UI (standard) | UI (enterprise) | AI | Tested | User-visible | Drift |
|------------|---------------------|----------|---------|---------------|-----------------|-----|--------|--------------|-------|
| read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ stale E2E | ✅ | Registry under-declares others |
| write | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | — |
| trash | ✅ | ❌ | ✅ | ✅ | ❌ | — | ❌ | ✅ | E: bulk delete N/I |
| search | ✅ | ❌ | ✅ | ✅ | ⚠️ local only | ✅ | ❌ | ✅ | E degraded |
| preview | ❌ | ❌ | ✅ | ✅ | ❌ | — | ❌ | ✅ | Undeclared but shipped |
| notifications | ✅ | ❌ | ✅ | ✅ | ❌ | — | ❌ | ✅ | No manifest metadata array |
| realtime | ✅ | ❌ | ✅ | ✅ | ❌ | — | ⚠️ mocks only | ✅ | **E regression** |
| businessWorkspace | ✅ | ❌ | ✅ | ✅ | ✅ | — | ⚠️ | ✅ | Registry omits |
| ai | ✅ | ❌ | ✅ | ⚠️ | ❌ | ✅ | ✅ context | ✅ | E no AI surface |
| vlink | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | **E regression** |
| analytics | ❌ | ❌ | ⚠️ | ❌ | ⚠️ UI only | ❌ | ❌ | ⚠️ widget mock | Undeclared |
| globalActivity | ✅ | ❌ | ✅ | ✅ | ❌ | — | ⚠️ | ✅ | E missing panel |
| versioning | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (claimed in AI text) | ❌ | ❌ | **False claim in AI purpose** |

**Capability drift summary:** Manifest is optimistic vs registry and vs EnhancedDriveModule runtime behavior. Do not claim versioning. Treat preview as pending declaration in FH-2.6.

---

## 11. Canonical write-path audit

Legend: PE = Policy Engine · DE = Domain Event · MA = Module Activity · N = Notification · RT = Realtime

| Operation | Entry | Service | PE | Persist | DE | MA | N | RT | Missing stages |
|-----------|-------|---------|-----|---------|----|----|---|-----|----------------|
| Upload | POST /api/drive/files | ~inline | ✅ | ✅ | ✅ | ✅ | ✗ | ✅ | N; AI save-to-drive bypass |
| Rename file | PUT /api/drive/files/:id | ✗ | ✅ | ✅ | ✗ | ✅ | ✗ | ✅ | DE, N |
| Move file | POST .../move | ✗ | ✅ | ✅ | ✗ | ✅ | ✗ | ✅ | DE, N |
| Delete file (soft) | POST /api/trash/items **(UI)** | ✗ | ✗ | ✅ | ✗ | ✗ | ✗ | ✗ | **All when UI path** |
| Delete file (soft) | DELETE /api/drive/files/:id | ✗ | ✅ | ✅ | ✅ | ✅ | ✗ | ✅ | N; UI doesn't use |
| Restore file | POST /api/trash/restore/:id | ✗ | ✗ | ✅ | ✗ | ✗ | ✗ | ✗ | PE, DE, MA, N, RT |
| Permanent delete file | DELETE /api/trash/delete/:id | ✗ | ✗ | ✅ | ✗ | ✗ | ✗ | ✗ | **Storage**, PE, DE, MA |
| Create folder | POST /api/drive/folders | ✗ | ✅ | ✅ | ✗ | ✅ | ✗ | ✅ | DE, N |
| Rename folder | PUT /api/drive/folders/:id | ✗ | ✅ | ✅ | ✗ | ✅ | ✗ | ✅ | DE, N |
| Move folder | POST .../folders/:id/move | ✗ | **✗** | ✅ | ✗ | ✅ | ✗ | ✅ | **PE**, DE, N |
| Delete folder (soft) | POST /api/trash/items (UI) | ✗ | ✗ | ✅ | ✗ | ✗ | ✗ | ✗ | Full pipeline |
| Restore folder | POST /api/trash/restore/:id | ✗ | ✗ | ✅ | ✗ | ✗ | ✗ | ✗ | Full pipeline |
| Permanent delete folder | DELETE /api/trash/delete/:id | ✗ | ✗ | ✅ | ✗ | ✗ | ✗ | ✗ | Storage, cascade, all |
| Share file | POST .../permissions | ✗ | ✅ | ✅ | ✅ | ✗ | ✅ dup | ✗ | MA, RT |
| Unshare file | DELETE .../permissions/:uid | ✗ | ✗ | ✅ | ✗ | ✗ | ✅ | ✗ | PE, DE, MA, RT |
| Share folder | POST .../permissions | ✗ | ✅ | ✅ | ✅ | ✗ | ✅ | ✗ | MA, RT |
| Unshare folder | DELETE .../permissions/:uid | ✗ | ✗ | ✅ | ✗ | ✗ | ✅ | ✗ | PE, DE, MA, RT |
| Star file | PUT .../star | ✗ | **✗** | ✅ | ✗ | ✗ | ✗ | ✗ | **Auth**, PE, all |
| Star folder | PUT .../star | ✗ | ✗ | ✅ | ✗ | ✅ | ✗ | ✅ | PE, DE, N |
| Link V_Link | POST /api/vlinks/:id/entities | ✅ vlinkService | ~VLink | ✅ | ✅ vlink.* | ✗ drive MA | ✗ | ✗ | Drive MA optional |
| Unlink V_Link | DELETE .../entities/:linkId | ✅ | ~ | ✅ | ✅ | ✗ | ✗ | ✗ | — |

**Known bypasses:** `toolExecutor.share_file`, `toolExecutor.list_drive_files`, `ai.ts` save-to-drive, `driveService.getOrCreateChatFilesFolder` (system folder bootstrap).

---

## 12. Global Trash audit

| Requirement | Status | Evidence |
|-------------|--------|----------|
| File Hub Trash is filtered Global Trash view | **Compliant** | [drive/trash/page.tsx](../../web/src/app/drive/trash/page.tsx) filters `moduleId === 'drive'` |
| No duplicate source of truth (UI) | **Compliant** | Uses GlobalTrashContext only |
| Duplicate backend API | **Non-compliant** | `/api/drive/files/trashed`, restore, hard-delete |
| Permanent delete consistency | **Non-compliant** | Global vs module paths differ on storage |
| Restore consistency | **Partial** | Same API, missing pipeline stages |
| Storage cleanup consistency | **Non-compliant** | Global path skips storageService |
| Module-scoped empty trash | **Missing** | `emptyTrash` deletes all modules |
| Soft delete → moduleId drive in list | **Compliant** | trashController maps files/folders to drive/File Hub |

---

## 13. Scheduler audit

| Job | Location | Schedule | Registry compliant | Delegates to canonical delete | Issue |
|-----|----------|----------|-------------------|------------------------------|-------|
| Trash permanent delete (30-day) | cleanupService.ts | `0 0 * * *` | **No** | Partial — uses storageService for files but direct Prisma | Duplicate register in same file; not in Platform Job Registry annex as canonical |
| Server startup | index.ts ~1007 | startCleanupJob() | **No** | — | Fragmented per §22 |

**No other File Hub-specific cron found.** No File Hub setInterval in web layer.

**Required outcome (FH-1.5):** Register job; delegate to `driveDeleteService`; dedupe cron registration.

---

## 14. AI audit

| Surface | PE | Canonical service | DE | MA | Notifications | Finding |
|---------|-----|-------------------|----|----|---------------|---------|
| Context providers (recent, storage, count) | N/A read | ✅ controllers | N/A | N/A | N/A | Weak tenant scope |
| fileAnalysisService | ✅ implied | ✅ storageService | N/A | N/A | N/A | Compliant read path |
| ActionExecutor drive actions | ✅ when routed to controllers | ✅ | Partial | Partial | Partial | Depends on action |
| toolExecutor list_drive_files | ✗ | ✗ direct prisma | ✗ | ✗ | ✗ | P1 bypass |
| toolExecutor share_file | ✗ | ✗ direct prisma | ✗ | ✗ | ✗ | **P0 bypass** |
| save-to-drive (ai.ts) | ✗ | ✗ direct prisma.file.create | ✗ | ✗ | ✗ | P1 bypass |
| V_Link contextual retrieval | ✅ | ✅ vlinkPipelineContextService | N/A | N/A | N/A | Permission-filtered |

---

## 15. Recommended FH-0.1 implementation scope (confirmation)

FH-0 audit **confirms** the existing FH-0.1 plan remains valid. **Do not remove items.** Expand as noted.

### Confirmed valid (proceed in FH-0.1)

| Item | Audit confirmation |
|------|-------------------|
| GlobalTrashModuleRegistry | Required — trashController is monolithic; drive handler first |
| driveDeleteService | Required — P0 storage leak on global permanent delete |
| Module-scoped empty trash (`?moduleId=drive`) | Required — missing today |
| Deprecate drive-only trash endpoints | Required — P0 duplicate API |
| AI share_file → grantFilePermission path | Required — P0 bypass |
| Policy dual on Global Trash drive handlers | Required — P0 |
| Domain events + module activity on permanent delete | Required — gap confirmed |
| cleanupService → driveDeleteService delegation | Required — partial step toward FH-1.5 |
| Frontend emptyDriveTrash + deep link fixes | Valid — P2/P3 but low risk |
| Storage deletion tests | Required |

### Expand FH-0.1 scope (newly discovered in FH-0)

| Item | Severity | Rationale |
|------|----------|-----------|
| **`toggleFileStarred` auth + PE** | P0 | Security gap — any UUID toggles star |
| **Document AI save-to-drive as FH-0.1 follow-up or FH-1** | P1 | Can defer to FH-1 if scope control needed; flag in plan |
| **Folder cascade in driveDeleteService** | P0 | Confirmed non-compliant on folder hard-delete |

### Do not add to FH-0.1 (defer)

| Item | Defer to |
|------|----------|
| Full service extraction from fileController | FH-1 |
| Platform Job Registry registration | FH-1.5 |
| coreModuleRegistry capability reconcile | FH-2.6 |
| EnhancedDriveModule V_Link parity | FH-3A |
| Entity descriptor registration | FH-2.5 |
| New domain event types (move, rename, etc.) | FH-1 (unless trivial add-on during FH-0.1) |
| listFiles shared-file visibility | FH-2 |

### Newly discovered blockers for beta (inform priority)

1. Global trash storage leak (P0-1) — **blocks production trash empty**
2. toggleFileStarred auth (P0-5) — **security**
3. EnhancedDriveModule enterprise regression (P0-6) — **blocks enterprise File Hub claim**
4. Primary delete path pipeline bypass (P0-2) — **blocks constitutional compliance claim**

---

## 16. Appendix: key file index

| Area | Paths |
|------|-------|
| Controllers | `server/src/controllers/fileController.ts`, `folderController.ts`, `folderPermissionController.ts`, `trashController.ts`, `driveAIContextController.ts` |
| Services | `server/src/services/driveService.ts`, `storageService.ts`, `cleanupService.ts`, `fileAnalysisService.ts`, `vlinkService.ts`, `vlinkEntityResolverService.ts` |
| Auth | `server/src/auth/drivePolicyDual.ts`, `policyEngine.ts` |
| Events | `server/src/events/domainEventEmitters.ts`, `domainEventRegistry.ts` |
| AI | `server/src/ai/tools/toolExecutor.ts`, `server/src/routes/ai.ts`, `registerBuiltInModules.ts` |
| Frontend | `web/src/components/modules/DriveModule.tsx`, `drive/enterprise/EnhancedDriveModule.tsx`, `contexts/GlobalTrashContext.tsx`, `app/drive/trash/page.tsx` |
| Registration | `builtInModuleManifests.ts`, `coreModuleRegistry.ts`, `config/modules.ts` |
| Schema | `prisma/modules/drive/files.prisma` |
| Tests | `server/src/controllers/__tests__/fileController.*.test.ts`, `tests/e2e/drive/` |

---

**Audit completed:** FH-0 deliverable. **Next step:** FH-0.1 implementation per confirmed scope above. **No code changes in FH-0.**
