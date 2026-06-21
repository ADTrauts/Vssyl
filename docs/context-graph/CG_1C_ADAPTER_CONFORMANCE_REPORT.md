# CG-1C — Adapter Conformance Report

**Program:** Vssyl Context Graph  
**Phase:** 1C  
**Date:** 2026-06-19

---

## Summary

| Metric | Result |
|--------|--------|
| Adapters operational | **8/8 (100%)** |
| Entity types registered | **11/11 (100%)** |
| Contract methods per adapter | **4/4** (getNode, getNeighbors, getPermissions, getSummary) |
| Conformance test file | `adapterConformance.test.ts` (25 tests) |
| Write/persist methods | **0** |

---

## Per-adapter conformance

| Adapter | moduleId | entityTypes | Registry | getNode | getNeighbors | getPermissions | getSummary | Bundle participation |
|---------|----------|-------------|----------|---------|--------------|----------------|------------|---------------------|
| V_Link | `vlink` | container | ✅ | ✅ | ✅ | ✅ | ✅ | Container root + attachment edges |
| Drive | `drive` | file, folder | ✅ | ✅ | ✅ | ✅ | ✅ | Attachment hydrate + vlink inbound |
| Calendar | `calendar` | event | ✅ | ✅ | ✅ | ✅ | ✅ | Attachment hydrate |
| Todo | `todo` | task | ✅ | ✅ | ✅ | ✅ | ✅ | Attachment hydrate |
| Notes | `notes` | note | ✅ | ✅ | ✅ | ✅ | ✅ | vlink + notebook.link neighbors |
| Notebook | `notebook` | notebook, notebook_page | ✅ | ✅ | ✅ | ✅ | ✅ | notebook.link + containment |
| Chat | `chat` | conversation | ✅ | ✅ | ✅ | ✅ | ✅ | Attachment hydrate |
| Place | `place` | place, place_list | ✅ | ✅ | ✅ | ✅ | ✅ | Attachment hydrate |

---

## Validation dimensions

### Registry registration

All 11 entity type keys resolve via `getAdapterForEntity(moduleId, entityType)`.

### Entity resolution

Each adapter returns `null` for wrong `moduleId` or unsupported `entityType` (verified drive, place_review).

### Descriptor generation

Nodes include: `moduleId`, `entityType`, `entityId`, `title`, `permissions`, optional `summary`, `metadata`, `display`.

### Permission enforcement

Adapters delegate to module access services; `getPermissions` reflects `getNode` outcome or explicit deny for not-found.

### Edge generation

| Adapter | Edge types emitted |
|---------|-------------------|
| vlink | `vlink.attachment` (outbound from container) |
| drive/calendar/todo/chat/place | `vlink.attachment` (inbound) |
| notes/notebook | `notebook.link`, `notebook.containment` |

### Bundle participation

Verified via `bundleResolver`, `crossAdapterTraversal`, and `traversalPermissionMatrix` suites.

---

## Deferred entity types (intentional)

| Entity | Status |
|--------|--------|
| `chat:message` | Not registered — conversation-level only |
| `place:place_review` | Returns null — no SoR |
| `CHAT_THREAD` | CG-F-009 advisory |

---

## Evidence

```
server/src/context-graph/__tests__/adapterConformance.test.ts  — 25 tests PASS
server/src/context-graph/__tests__/adapterRegistry.test.ts     —  7 tests PASS
server/src/context-graph/__tests__/p1Adapters.test.ts          —  5 tests PASS
```

**Last updated:** 2026-06-19
