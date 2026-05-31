# File Hub Reference Implementation Review

**Date:** 2026-05-31  
**Phase:** FH-6 — Reference Implementation Finalization (Part 7)  
**Module id:** `drive` (File Hub)  
**Prior maturity:** 83/100 (post FH-5)  
**Post FH-6 maturity:** 87/100

---

## Executive summary

File Hub meets the platform module contract for a **Reference Implementation** after FH-6 consolidation. Delete and share paths are service-owned; write-side activity is normalized; notifications, realtime, Global Trash, V_Link, and AI read paths are compliant. Remaining gaps are **P2/P3 platform migrations** (legacy activity reads, deprecated route retirement, optional workspace hub landing) — none block reference designation.

---

## Dimension assessment

| Dimension | Verdict | Evidence |
|-----------|---------|----------|
| **Entity Model** | **YES** | `platformEntityRegistry` file/folder descriptors; manifest `entities[]`; V_Link `FILE`/`FOLDER` types; lifecycle via canonical services |
| **Capability Matrix** | **YES** | `builtInModuleManifests.ts` reconciled FH-2/4; enterprise `EnhancedDriveModule` honors vlink/realtime/trash (FH-4) |
| **Policy Engine** | **YES** | `evaluateDrivePolicyDual` on upload/delete/share/move/update; AI reads per-file PE |
| **AI** | **YES** | `driveVisibilityService` reads; `driveUploadService` writes; `share_file` → `grantFileSharePermission`; V_Link pipeline compliant |
| **V_Link** | **YES** | `driveVlinkAccessService`, `driveVlinkLifecycleService`; FH-3A audit; hard-delete unlink |
| **Realtime** | **YES** | Upload/rename/move/trash/restore/hard-delete/share fan-out; collaborator broadcast (FH-5) |
| **Notifications** | **YES** | `driveNotificationService`; manifest metadata; restore/trash/permission types (FH-5) |
| **Global Trash** | **YES** | `registerGlobalTrashHandlers`; visibility-aware list; owner empty-trash |
| **Domain Events** | **YES** | Full registry (`file.*`, `folder.*`); emitters in delete/share/upload paths |
| **Activity** | **PARTIAL** | Writes normalized; reads dual legacy+log in item/recent endpoints; platform feed still legacy |
| **Governance** | **PARTIAL** | Deprecated drive trash wrappers mounted; safe removal documented; trash job canonical |
| **Workspace Integration** | **PARTIAL** | Business workspace uses `DriveModuleWrapper` + sidebar; no dedicated `DriveWorkspaceLanding.tsx` hub |

**Score: 9 YES, 3 PARTIAL, 0 NO**

---

## Detailed evidence

### Entity Model — YES

- Registration: `server/src/platform/platformEntityRegistry.ts`
- Manifest: `server/src/startup/builtInModuleManifests.ts` (`drive`)
- Trash/restore/delete scoped by `dashboardId` + ownership/permissions

### Capability Matrix — YES

- Declared: upload, share, trash, vlink, realtime, AI context, notifications
- Runtime: standard + enterprise modules subscribe to sockets and Global Trash

### Policy Engine — YES

- Dual enforcement: legacy role + PE (`drivePolicyDual.ts`)
- All destructive and share mutations gated before persistence

### AI — YES

- Reads: `listAccessibleDriveFiles`, `validateAccessibleFileIds`, context providers
- Writes: `driveUploadService.createDriveFile` (HTTP + AI save-to-drive)
- Tools: `share_file` → share service

### V_Link — YES

- Resolver delegates to `driveVlinkAccessService` (membership ≠ content access)
- Soft trash → restricted; hard delete → auto-unlink

### Realtime — YES

- `driveRealtimeService`, `chatSocketService.broadcastDriveEvent`
- Collaborator fan-out on trash/restore/delete (FH-5)

### Notifications — YES

- Types: `drive_permission`, `drive_item_restored`, `drive_item_deleted`
- Manifest block in `builtInModuleManifests.ts`
- No self-notifications; collaborator-safe delivery

### Global Trash — YES

- Handler: `registerGlobalTrashHandlers.ts`
- List: `driveVisibilityService` permission-aware trashed items

### Domain Events — YES

- Registry: `domainEventRegistry.ts` (upload, delete, share, rename, move, restore, unshare, folder lifecycle)
- Emitters: `domainEventEmitters.ts` called from services

### Activity — PARTIAL

- **Writes:** 100% `emitModuleActivityEvent` (FH-4/6)
- **Reads:** `getItemActivity` / `getRecentActivity` merge legacy + normalized; platform `activityFeedController` still uses `prisma.activity`
- **Blocker for Reference?** No — contract satisfied on write path; read migration is platform-wide

### Governance — PARTIAL

- Deprecated `/api/drive/*/trashed` wrappers log warnings
- `web/src/api/drive.ts` deprecated helpers unused
- Trash cleanup job tier: **canonical**
- **Blocker for Reference?** No — documented retirement plan

### Workspace Integration — PARTIAL

- `BusinessWorkspaceContent.tsx` case `'drive'`: `DriveSidebar` + `DriveModuleWrapper`
- No `DriveWorkspaceLanding.tsx` (Chat/Calendar pattern)
- **Blocker for Reference?** No — see Part 5 recommendation

---

## Part 5 — Workspace maturity

| Item | Classification |
|------|----------------|
| `DriveWorkspaceLanding.tsx` dedicated hub | **Optional / future enhancement** |
| Current `DriveModuleWrapper` in business workspace | **Required (satisfied)** |
| Icon + name in `BrandedWorkDashboard` | Verify at module-development checklist — **likely satisfied via existing drive case** |

**Recommendation:** `DriveWorkspaceLanding.tsx` should **not** block Reference Implementation status. File Hub is fully usable in business workspace via existing wrapper. A thin landing hub is a UX polish item for a future phase.

---

## Part 8 — Certification decision

| Lens | Verdict | Rationale |
|------|---------|-----------|
| **1. Production Ready** | **YES** | Tenancy-safe paths; PE on mutations; Global Trash; notifications; search parity |
| **2. Enterprise Ready** | **YES** | Enterprise module parity (FH-4); V_Link; bulk trash; realtime — details panel depth remains P2 UX |
| **3. Reference Implementation** | **YES** | Canonical service boundaries; full operation matrix; reusable patterns documented; no P0 architectural blockers |

### Exact blockers if certification were denied

**None at P0.** Remaining work is optional:

| ID | Item | Priority |
|----|------|----------|
| ACT-R1 | Legacy activity read paths | P2 |
| GOV-R1 | Remove deprecated drive trash routes | P2 |
| WS-R1 | `DriveWorkspaceLanding.tsx` | P3 |
| NOT-R1 | Split notification type aliases | P3 |

---

## Part 9 — Platform extraction opportunities

Patterns ready for **Platform Guidance** (documentation only):

| Pattern | Source | Extract as |
|---------|--------|------------|
| **Canonical delete service** | `driveDeleteService.ts` | Module trash handler template: PE → persist → activity → event → notify → realtime → V_Link lifecycle |
| **Share service** | `driveFileShareService.ts` | Share/unshare/update template with notification + domain event + realtime |
| **Visibility service** | `driveVisibilityService.ts` | Owned + shared + PE browse/search template |
| **Upload service** | `driveUploadService.ts` | HTTP + AI write unification template |
| **Notification adapter** | `driveNotificationService.ts` | Collaborator collection + safe payload template |
| **V_Link access adapter** | `driveVlinkAccessService.ts` | Per-module resolver delegation template |
| **V_Link lifecycle** | `driveVlinkLifecycleService.ts` | Hard-delete unlink template |
| **Global Trash registration** | `registerGlobalTrashHandlers.ts` | `registerGlobalTrashModuleHandler` checklist |
| **Entity registration** | `platformEntityRegistry.ts` + manifest | Entity descriptor + capability reconciliation checklist |
| **Realtime fan-out** | `driveRealtimeService.ts` | Owner + collaborator broadcast template |
| **Thin controller rule** | FH-6 consolidation | Controllers parse HTTP only; services own business logic |

**Recommended doc target:** `docs/guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md` (future; not created in FH-6).

---

## Recommended next module

After File Hub reference designation: **Chat** or **Calendar** — highest cross-module surface area (V_Link, realtime, notifications, sharing). Chat benefits most from delete/share/visibility templates; Calendar from V_Link + policy patterns.

---

## FH-6 success criteria

| # | Criterion | Met |
|---|-----------|-----|
| 1 | Delete paths canonical | **Yes** |
| 2 | Share logic service-owned | **Yes** |
| 3 | Activity consolidated or documented | **Yes** |
| 4 | Governance drift minimized | **Yes** |
| 5 | Operation matrix finalized | **Yes** |
| 6 | Reference review exists | **Yes** |
| 7 | Formal certification assessment | **Yes** |
| 8 | Platform extraction documented | **Yes** |

**FH-6 complete.**
