# CG-1A — Permission Enforcement Report

**Program:** Vssyl Context Graph  
**Phase:** 1A  
**Date:** 2026-06-18

---

## Model

Permission enforcement follows the ratified federation contract:

- **PE at every hop** — each adapter resolves access via existing module/V_Link permission services
- **No permission inheritance** — child nodes do not inherit parent access
- **No traversal leaks** — denied nodes never appear in bundle output

**File:** `server/src/context-graph/permissionResolver.ts`

---

## Access levels

| `ContextGraphAccess` | In bundle? | Bundle `access` field |
|----------------------|--------------|----------------------|
| `full` | Yes | `full` |
| `restricted` | Yes (metadata redacted) | `restricted` |
| `denied` | **No — omitted** | N/A |

---

## Core functions

### `shouldOmitNode(permissions)`

Returns `true` when `access === 'denied'` or `canRead === false`. Used in `bundleResolver.addGraphNode` before inclusion.

### `toBundleAccess(access)`

Maps `full` / `restricted` to bundle node access; `denied` → `null` (node excluded).

### `trimNodesForBundle(nodes)`

Batch helper — filters denied nodes, returns `omittedCount`.

### `permissionsFromAccess(access, reason?)`

Adapter helper to build `NodePermissions` from PE outcomes.

---

## Enforcement points

| Hop | Enforcement |
|-----|-------------|
| V_Link container | `assertVLinkAccess` + membership |
| V_Link attachments | `resolveEntityAccess` per entity |
| Drive file/folder | `driveVlinkAccessService` |
| Calendar event | `calendarVlinkAccessService` |
| Todo task | `todoVlinkAccessService` |
| Bundle assembly | `shouldOmitNode` on every candidate node |

`permissionOutcome.gatesApplied` in bundle descriptor: `['tenant', 'vlink_membership', 'module_visibility', 'policy_engine']`.

---

## Omission vs restriction

| Outcome | User sees | Counted in |
|---------|-----------|------------|
| **Omitted** (denied) | Nothing | `composition.nodesOmitted`, `permissionOutcome.omittedNodes` |
| **Restricted** | Node shell, limited metadata | `summaries.stats.restrictedNodeCount`, `permissionOutcome.restrictedNodes` |

Denied nodes are **never** serialized in `nodes[]`. Restricted nodes remain visible with `access: 'restricted'`.

---

## Bundle permission outcome

`permissionOutcome.overall`:

| Value | Condition |
|-------|-----------|
| `empty` | Zero visible nodes |
| `partial` | Some nodes restricted |
| `full` | All visible nodes full access |

---

## Tests

### Unit — `permissionResolver.test.ts` (3 tests)

- `shouldOmitNode` — denied vs full/restricted
- `toBundleAccess` — denied maps to null
- `trimNodesForBundle` — 2 included, 1 omitted

### Integration — `bundleResolver.test.ts`

- **Omits denied attachment nodes** — root visible, denied drive file omitted, `nodesOmitted: 1`

### API — `context-graph.integration.test.ts`

- Auth required on both endpoints
- Invalid descriptor returns `400` without leaking bundle data

---

## Explicit compliance answers

| Requirement | Met |
|-------------|-----|
| PE at every hop | Yes |
| No permission inheritance | Yes |
| Denied nodes omitted | Yes |
| Restricted nodes included with flag | Yes |
| Traversal does not leak denied content | Yes |

**CG-F-007** (full traversal permission matrix, ≥10 integration tests) remains **open** — targeted for Phase 1B.

**Last updated:** 2026-06-18
