# File Hub V_Link Compliance Audit (FH-3A)

**Module id:** `drive` (File Hub)  
**Status:** FH-3A platform compliance artifact  
**Last updated:** 2026-05-28  
**References:** [V_LINK.md](../V_LINK.md), [PLATFORM_ENTITY_MODEL.md](../PLATFORM_ENTITY_MODEL.md), [FILE_HUB_OPERATION_MATRIX.md](./FILE_HUB_OPERATION_MATRIX.md)

---

## Executive summary

File Hub is the **first module targeted for full V_Link platform compliance**. FH-3A confirms File and Folder entities participate in V_Link, permissions, AI retrieval, entity registry, domain events, and lifecycle management without new architectural systems.

| Area | Status |
|------|--------|
| Entity registration | **Compliant** (FH-2 + FH-3A verification) |
| Resolver (file/folder) | **Compliant** (centralized `driveVlinkAccessService`) |
| Permission-safe retrieval | **Compliant** (membership ≠ content access) |
| Lifecycle (soft trash) | **Compliant** (restricted resolution; links retained) |
| Lifecycle (permanent delete) | **Compliant** (FH-3A auto-unlink) |
| Domain events → V_Link | **Partial** (file/folder events exist; no V_Link consumer yet) |
| AI linked retrieval | **Compliant** (via `listVLinkEntities` → resolver) |
| Capability declarations | **Compliant** (manifest + registry aligned) |

---

## Part 1 — V_Link audit matrix

| Standard | File | Folder | Classification |
|----------|------|--------|----------------|
| V_Link entity type enum | `FILE` | `FOLDER` | **Compliant** |
| Resolver implemented | `resolveDriveFileForVLink` | `resolveDriveFolderForVLink` | **Compliant** |
| Link permission gate | `userCanLinkDriveFile` | `userCanLinkDriveFolder` | **Compliant** |
| Membership ≠ content access | Enforced via resolver | Enforced via resolver | **Compliant** |
| Trashed entity handling | `restricted` + `state: trashed` | Same | **Compliant** |
| Deleted entity handling | `restricted` + unlink on hard delete | Same + tree unlink | **Compliant** |
| Platform entity descriptor | `platformEntityRegistry` | Same | **Compliant** |
| Manifest `entities[]` | Registered | Registered | **Compliant** |
| Search provider | `driveSearchProvider` | Partial folder facet | **Partial** |
| V_Link UI deep links | `/drive?file=` | `/drive?folder=` | **Compliant** |
| Domain event fan-in to V_Link index | Not implemented (platform v2) | Same | **Partial** (documented) |

---

## Part 2 — Entity registration verification

### Registry path

| Layer | Path | File | Folder |
|-------|------|------|--------|
| Platform descriptor | `server/src/platform/platformEntityRegistry.ts` | `drive:file` | `drive:folder` |
| Startup registration | `server/src/startup/registerPlatformEntities.ts` | ✅ | ✅ |
| Manifest | `server/src/startup/builtInModuleManifests.ts` `entities[]` | ✅ | ✅ |
| V_Link enum | `VLinkEntityType.FILE` | `VLinkEntityType.FOLDER` | ✅ |
| Activity targetType | `file` | `folder` | ✅ |
| Module ownership | `moduleId: drive` | `moduleId: drive` | ✅ |

### Resolver path

```
listVLinkEntities / linkEntityToVLink / AI pipeline
  → vlinkEntityResolverService.resolveEntityAccess
  → driveVlinkAccessService.resolveDriveFileForVLink | resolveDriveFolderForVLink
  → drivePermissionHelpers + Policy Engine FILE_READ
```

### Permission path

```
userCanLinkEntity
  → userCanLinkDriveFile | userCanLinkDriveFolder
  → same checks as resolve (no bypass)
```

**Conclusion:** File and Folder are fully recognized platform entities for V_Link purposes.

---

## Part 3 — Resolver compliance

| Scenario | File behavior | Folder behavior |
|----------|---------------|-----------------|
| Active + owner | `access: full`, title + URL | Same |
| Active + shared collaborator | `full` if read/write share or folder inherit + PE | `full` if share + PE |
| Active + unrelated user | `restricted` | `restricted` |
| Trashed | `restricted` (title may show) | `restricted` |
| Permanently deleted | `restricted` (`state: deleted`) | Same |
| Restored from trash | Returns to `full` when permissions allow | Same |

**Orphan links:** Soft trash does **not** unlink (by design — link metadata preserved, content gated). Permanent delete runs `unlinkDriveEntityFromAllVLinks` / `unlinkDriveFolderTreeFromAllVLinks` (FH-3A).

---

## Part 4 — Permission-safe V_Link retrieval

### Required path (implemented)

```
User → V_Link membership (assertVLinkAccess)
     → listVLinkEntities / resolveEntityAccess
     → driveVlinkAccessService
     → File Hub permission (owner | share | folder inherit)
     → Policy Engine file:read
     → Result (full | restricted)
```

### Anti-pattern (not present)

```
User → V_Link → File content   ❌ BLOCKED
```

### Retrieval surfaces audited

| Surface | Uses resolver | Status |
|---------|---------------|--------|
| `GET /api/vlinks/:id/entities` | ✅ `listVLinkEntities` | **Compliant** |
| `linkEntityToVLink` | ✅ `userCanLinkEntity` | **Compliant** |
| AI `fetchVLinkPipelineContext` | ✅ via `listVLinkEntities` | **Compliant** |
| AI attachment / file analysis | Separate path (`driveVisibilityService`) | **Compliant** (FH-1) |

**FH-3A fix:** Replaced duplicate Prisma-only resolver queries with centralized `driveVlinkAccessService` including `canWrite` share parity and Policy Engine.

---

## Part 5 — Lifecycle compliance matrix

| Operation | V_Link link row | Resolver | Unlink on permanent delete |
|-----------|-----------------|----------|----------------------------|
| **File create** | Manual/AI link only | N/A | N/A |
| File rename | Retained | Title updates on resolve | N/A |
| File move | Retained | URL/folder context updates | N/A |
| File soft trash | Retained | `restricted` | No |
| File restore | Retained | Returns `full` if permitted | No |
| File permanent delete | **Soft-unlinked** (`unlinkedAt`) | `deleted` | **Yes (FH-3A)** |
| **Folder create** | Manual/AI link only | N/A | N/A |
| Folder rename/move | Retained | Title/URL update | N/A |
| Folder soft trash | Retained | `restricted` | No |
| Folder restore | Retained | Returns `full` | No |
| Folder permanent delete | **Tree unlink** | `deleted` | **Yes (FH-3A)** |

---

## Part 6 — Domain event compliance

File Hub emits normalized domain events (FH-2). V_Link platform **does not yet consume** these for index maintenance (platform v2 per `DOMAIN_EVENTS.md`).

| Event | Source | V_Link consumer | Status |
|-------|--------|-----------------|--------|
| `file.uploaded` | upload | None (v2) | **Partial** |
| `file.renamed` | update | None | **Partial** |
| `file.moved` | move | None | **Partial** |
| `file.deleted` | trash/hard delete | None | **Partial** |
| `file.restored` | restore | None | **Partial** |
| `file.shared` / `file.unshared` | share service | None | **Partial** |
| `folder.*` | folder controllers / delete service | None | **Partial** |
| `vlink.entity.unlinked` | lifecycle service on hard delete | V_Link activity log | **Compliant** |

**No low-risk missing wiring** beyond permanent-delete unlink (implemented FH-3A).

---

## Part 7 — AI context compliance

| Path | Permission gate | Status |
|------|-----------------|--------|
| V_Link pipeline (`fetchVLinkPipelineContext`) | Resolver → `restricted` count | **Compliant** |
| `list_drive_files` tool | `driveVisibilityService` + PE | **Compliant** (FH-1) |
| Message attachments | `validateAccessibleFileIds` | **Compliant** (FH-1) |
| `DigitalLifeTwinCore` file analysis | `fetchAccessibleActiveFiles` | **Compliant** (FH-1) |
| Drive AI context providers | Accessible scope (FH-2) | **Compliant** |

AI never receives full metadata for `restricted` linked entities — only type label via `entityTypeLabel`.

---

## Part 8 — Capability validation

| Capability | Manifest | Registry | Runtime | V_Link integration |
|------------|----------|----------|---------|-------------------|
| vlink | ✅ | ✅ | Resolver + link API | **Compliant** |
| ai | ✅ | ✅ | Context providers + tools | **Compliant** |
| search | ✅ | ✅ | `driveSearchProvider` | **Partial** (folder) |
| realtime | ✅ | ✅ | Socket broadcasts | **Compliant** |
| notifications | ✅ | ✅ | `drive_permission` | **Partial** (metadata array) |
| trash | ✅ | ✅ | Global Trash handler | **Compliant** |
| preview | ✅ | ✅ | Download proxy | **Compliant** |
| analytics | ❌ declared | ❌ | Widget mock only | **N/A** (not claimed) |

---

## Part 9 — Tests (FH-3A)

| Test file | Coverage |
|-----------|----------|
| `driveVlinkAccessService.test.ts` | Permission gate, trashed/deleted, PE block |
| `vlinkEntityResolverService.drive.test.ts` | Delegation to access service |
| `driveVlinkLifecycleService.test.ts` | Unlink on permanent delete |
| `driveDeleteService.test.ts` | Permanent delete triggers unlink |

---

## Remaining FH-3B opportunities (out of scope)

- V_Link search index driven by file/folder domain events (platform v2)
- Related-items panel UX (not compliance)
- Folder search facet parity
- Notification manifest `notifications[]` block
- Explicit tombstone metadata on `restricted` resolver responses for AI
- Event-driven V_Link suggestion refresh on file rename/move

---

## FH-3A completion recommendation

**Recommend marking FH-3A complete** after FH-3A code lands:

1. ✅ File/folder V_Link resolver uses canonical permission + PE path  
2. ✅ Permanent delete removes dangling V_Link references  
3. ✅ Entity registration verified across registry, manifest, enum  
4. ✅ AI and API retrieval audited — no membership bypass  
5. ✅ Lifecycle matrix documented  
6. ✅ Targeted tests added  
7. ✅ No V_Link UX redesign  

**Tag suggestion:** `file-hub-fh-3a-complete`
