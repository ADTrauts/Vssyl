# CG-1A — Adapter Registry Report

**Program:** Vssyl Context Graph  
**Phase:** 1A  
**Date:** 2026-06-18

---

## Adapter contract

Formal interface: `ContextGraphAdapter` in `server/src/context-graph/contextGraphTypes.ts`.

| Method | Purpose | Writes |
|--------|---------|--------|
| `getNode(ctx, ref)` | Hydrate node descriptor for entity | No |
| `getNeighbors(ctx, ref)` | List outbound/inbound edges (read) | No |
| `getPermissions(ctx, ref)` | PE-trimmed access for entity | No |
| `getSummary(ctx, ref)` | Short text summary | No |

**Node descriptor shape** (ratified):

```typescript
{
  moduleId,
  entityType,
  entityId,
  title,
  summary?,
  metadata?,
  permissions: { canRead, access, reason? }
}
```

Adapters are **read-only views** over module SoR. No persistence, ownership changes, or writes.

---

## Registry

**File:** `server/src/context-graph/adapterRegistry.ts`

| Function | Behavior |
|----------|----------|
| `registerContextGraphAdapter(adapter)` | Index by `moduleId:entityType` |
| `getAdapterForEntity(moduleId, entityType)` | Lookup adapter for traversal |
| `getAdapterByModuleId(moduleId)` | Module-level lookup |
| `listRegisteredAdapters()` | All P0 adapters |
| `listSupportedEntityTypes()` | Flat entity-type index |
| `initializeContextGraphAdapterRegistry()` | Boot-time registration |

Registry initializes at module load with exactly **four** adapters.

---

## P0 adapter inventory

| Adapter | File | moduleId | entityTypes | Upstream services |
|---------|------|----------|-------------|-------------------|
| V_Link | `adapters/vlinkAdapter.ts` | `vlink` | `container` | `vlinkService`, `vlinkPermissionService`, `vlinkEntityResolverService` |
| Drive | `adapters/driveAdapter.ts` | `drive` | `file`, `folder` | `driveVlinkAccessService` |
| Calendar | `adapters/calendarAdapter.ts` | `calendar` | `event` | `calendarVlinkAccessService` |
| Todo | `adapters/todoAdapter.ts` | `todo` | `task` | `todoVlinkAccessService` |

**Operational count:** 4 adapters, 5 resolvable entity types.

---

## V_Link attachment mapping

V_Link adapter maps `VLinkEntityType` to federation entity refs for cross-adapter hydration:

| V_Link entity type | Federation ref |
|--------------------|----------------|
| `FILE` | `drive:file` |
| `FOLDER` | `drive:folder` |
| `CALENDAR_EVENT` | `calendar:event` |
| `TASK` / `TODO` | `todo:task` |

Unmapped types (e.g. `NOTE`, `CHAT_THREAD`) are skipped at traversal — no stub adapters created.

---

## Registry tests

`server/src/context-graph/__tests__/adapterRegistry.test.ts`:

- Confirms 4 registered adapters
- Resolves drive file and vlink container adapters
- Returns null for unsupported pairs (`notes:page`, `drive:unknown`)
- Lists exactly 5 supported entity types
- Module-level lookup for calendar

---

## Non-goals (1A)

- No adapters for notes, chat, notebook, HR, scheduling, BA, or marketplace modules
- No adapter registration API or dynamic partner loading
- No write/mutation adapter methods

**Last updated:** 2026-06-18
