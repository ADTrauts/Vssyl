# CG-1A — Constitutional Compliance Review

**Program:** Vssyl Context Graph  
**Phase:** CG-1A Council Checkpoint  
**Date:** 2026-06-18  
**Reviewer:** Platform Architecture Governance  
**Status:** Governance audit — no code changes

**Authority:** [CONTEXT_GRAPH_COUNCIL_RATIFICATION.md](./CONTEXT_GRAPH_COUNCIL_RATIFICATION.md) (RD-CG-001 through RD-CG-006), [CONTEXT_GRAPH_FEDERATION_CONTRACT.md](./CONTEXT_GRAPH_FEDERATION_CONTRACT.md), [CONTEXT_GRAPH_CHARTER.md](./CONTEXT_GRAPH_CHARTER.md)

---

## 1. Review scope

Audit CG-1A implementation against ratified constitutional constraints. Evidence sourced from:

- `server/src/context-graph/*`
- [CG_1A_IMPLEMENTATION_REPORT.md](./CG_1A_IMPLEMENTATION_REPORT.md)
- [CG_1A_PERMISSION_ENFORCEMENT_REPORT.md](./CG_1A_PERMISSION_ENFORCEMENT_REPORT.md)
- [CG_1A_ADAPTER_REGISTRY.md](./CG_1A_ADAPTER_REGISTRY.md)
- [CG_1A_BUNDLE_RESOLUTION_REPORT.md](./CG_1A_BUNDLE_RESOLUTION_REPORT.md)

---

## 2. Ratified constraint matrix

| RD / Contract | Requirement | CG-1A evidence | Verdict |
|---------------|-------------|----------------|---------|
| **RD-CG-002** | Federated architecture — no universal SoR | Orchestrator + adapters read module/V_Link services only; no new Prisma graph models | ✅ **COMPLIANT** |
| **RD-CG-002** | No graph database | No Neo4j, no graph DB dependency, no graph store | ✅ **COMPLIANT** |
| **RD-CG-003** | V_Link evolve — not replace | `vlinkAdapter` uses `vlinkService`, `vlinkPermissionService`; attachments as edges | ✅ **COMPLIANT** |
| **RD-CG-004** | Tags = metadata only | No tag index, no tag-as-edge inference in resolver | ✅ **COMPLIANT** |
| **RD-CG-005** | Platform owns federation; modules own SoR | Adapters delegate to `*VlinkAccessService`; no cross-module writes | ✅ **COMPLIANT** |
| **RD-CG-005** | AI = consumer only | No AI memory graph, no pipeline migration in 1A | ✅ **COMPLIANT** |
| **RD-CG-006** | Phase 1A scope only | No projection API, tag index, visualization, write APIs | ✅ **COMPLIANT** |
| **Federation F1–F7** | Read federation; module descriptors | `EntityRef`, `ContextGraphNode`, `ContextBundleDescriptor` | ✅ **COMPLIANT** |
| **PE at every hop** | No permission inheritance | `permissionResolver.shouldOmitNode`; per-adapter PE | ✅ **COMPLIANT** |
| **Denied nodes omitted** | No traversal leaks | Bundle tests confirm denied attachments omitted | ✅ **COMPLIANT** |

**Overall constitutional verdict:** ✅ **PASS**

---

## 3. Prohibited architecture checklist

| Prohibited item | Present? | Evidence |
|-----------------|----------|----------|
| Graph database | **No** | No new graph DB integration |
| `ContextNode` universal table | **No** | No Prisma migration |
| Universal relationship table | **No** | Edges from V_Link + adapter `getNeighbors` only |
| Tag index | **No** | Not implemented |
| Write / mutation APIs | **No** | Two GET/POST read routes only; adapters read-only |
| Graph UI | **No** | No frontend graph surfaces |
| N-hop social traversal | **No** | `MAX_DEPTH = 2`; 1A uses depth 0–1 |
| AI memory graph | **No** | No `UserMemoryFact` graph edges |

**Prohibited architecture verdict:** ✅ **NONE INTRODUCED**

---

## 4. Federation architecture compliance

### 4.1 Module source-of-truth ownership

Each P0 adapter reads from its module's existing services:

| Adapter | SoR delegation |
|---------|----------------|
| vlink | `vlinkService`, `vlinkPermissionService`, `vlinkEntityResolverService` |
| drive | `driveVlinkAccessService` |
| calendar | `calendarVlinkAccessService` |
| todo | `todoVlinkAccessService` |

No adapter persists entities or relationships. **Compliant.**

### 4.2 V_Link as association substrate

- Container roots resolve via `resolveVLinkContainer`
- Attachment edges via `listVLinkAttachmentEdges` → `VLinkEntity` mapping
- Cross-module hydration follows `VLINK_ENTITY_TYPE_MAP` (FILE→drive, etc.)

No parallel edge store. **Compliant.**

### 4.3 Federation read model

- Nodes: `(moduleId, entityType, entityId)` descriptors
- Bundles: ratified `ContextBundleDescriptor` with provenance and permission outcome
- Registry: extensible without schema migration

**Compliant with Option C federated model.**

---

## 5. Permission enforcement compliance

| Requirement | Implementation | Verdict |
|-------------|----------------|---------|
| PE at every hop | Each `getNode` uses module access service | ✅ |
| No permission inheritance | `shouldOmitNode` evaluates each node independently | ✅ |
| Denied omitted | Not serialized in `nodes[]`; counted in `nodesOmitted` | ✅ |
| Restricted visible | `access: 'restricted'` in bundle when PE returns restricted | ✅ |
| Membership ≠ access | V_Link membership checked separately from attachment PE | ✅ |

**Residual gap (non-constitutional):** CG-F-007 — full traversal permission integration matrix (≥10 tests) not closed. Does not violate federation contract; affects certification G6 score.

---

## 6. Findings closure audit

| Finding | 1A closure claim | Council assessment |
|---------|------------------|-------------------|
| **CG-F-001** | Orchestrator shipped | ✅ **Properly closed** |
| **CG-F-002** | Two bundle endpoints | ⚠️ **Partially closed** — blockers for 1A met; neighborhood/projection routes remain (1B-prime / 1C) |
| **CG-F-003** | Registry + 4 adapters | ✅ **Properly closed** |

CG-F-002 partial closure is **acceptable** for 1A charter — RD-CG-006 authorized 1A bundle endpoints specifically, not full Phase 1 read contract.

---

## 7. Read API sufficiency for adapter expansion

Current endpoints:

- `GET /api/context-graph/vlinks/:id/bundle`
- `POST /api/context-graph/bundle/resolve`

`POST /bundle/resolve` accepts arbitrary `root: { moduleId, entityType, entityId }` and resolves via registry lookup. **No new routes required** to register P1 adapters — only adapter registration and V_Link entity type mapping for NOTE/CHAT/NOTEBOOK attachments.

Optional convenience routes (`GET .../entities/.../context`) improve DX but are **not blockers** for 1B adapter expansion.

**Verdict:** ✅ **Sufficient for 1B**

---

## 8. Non-compliance items (certification, not constitutional)

| Item | Severity | Phase |
|------|----------|-------|
| CG-F-007 traversal permission matrix | Major | 1B-prime or 1B closeout |
| CG-F-006 AI bundle format | Major | 1C |
| CG-F-004 NOTE access service | Major | 1B prerequisite (Notes) |
| CG-F-008 projection API | Advisory | 1B-prime |
| Rate limits on context-graph routes | G8 | 1B-prime |

None rise to constitutional failure.

---

## 9. Compliance verdict summary

| Axis | Verdict |
|------|---------|
| Federated architecture | **PASS** |
| V_Link substrate preserved | **PASS** |
| Prohibited architecture avoided | **PASS** |
| Permission model | **PASS** |
| Findings closure (1A scope) | **PASS** (CG-F-002 partial noted) |
| **Overall CG-1A constitutional compliance** | **PASS** |
| **Overall certification readiness** | **PARTIAL** |

---

**Last updated:** 2026-06-18
