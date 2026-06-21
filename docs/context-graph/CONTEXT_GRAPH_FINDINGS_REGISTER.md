# Context Graph — Findings Register

**Program:** Vssyl Context Graph Architecture  
**Phase:** Certification program **ARCHIVED** (CG-6, 2026-06-19)  
**Date:** 2026-06-18 (created); updated through CG-6  
**Status:** **ARCHIVED** — LEVEL 3 CERTIFIED promoted; advisories only remain open

---

## Summary

| Severity | Open | Closed |
|----------|-----:|-------:|
| **Blocking** | **0** | **2** |
| **Major** | **0** | **5** |
| **Advisory** | **8** | 0 |
| **Total** | **8** | **7** |

**CG-6 promotion (2026-06-19):** **LEVEL 3 CERTIFIED** — WITH FINDINGS notation removed. All majors closed (CG-F-005 CG-2A, CG-F-006 CG-1D). Advisories tracked without certificate notation.

---

## Blocking findings

### CG-F-001 — No federation orchestrator service

| Field | Value |
|-------|-------|
| **Severity** | **Blocking** |
| **Status** | **CLOSED** (CG-1A, 2026-06-18) |
| **Category** | Architecture / runtime |
| **Description** | Context Graph federation is documented (Relationship Framework Phase 2D) but no `contextGraphOrchestratorService` exists to compose bundles from adapters. |
| **Evidence** | Phase 0A inventory — V_Link services exist in isolation |
| **Remediation** | Phase 1A — read-only orchestrator + adapter registry |
| **Closure evidence** | `server/src/context-graph/contextGraphOrchestrator.ts`, `bundleResolver.ts` |
| **Owner** | Platform |
| **Target** | Phase 1A |

### CG-F-002 — No Context Graph read API

| Field | Value |
|-------|-------|
| **Severity** | **Blocking** |
| **Status** | **CLOSED** (CG-1A, 2026-06-18) |
| **Category** | API |
| **Description** | No `/api/context-graph/*` routes. Bundle composition split across `/api/vlinks/*` without formal `ContextBundleDescriptor`. |
| **Evidence** | [CONTEXT_GRAPH_READ_API_CONTRACT.md](./CONTEXT_GRAPH_READ_API_CONTRACT.md) — spec only |
| **Remediation** | Phase 1A/1B — implement contract endpoints |
| **Closure evidence** | `GET /api/context-graph/vlinks/:id/bundle`, `POST /api/context-graph/bundle/resolve` |
| **Owner** | Platform |
| **Target** | Phase 1A |

---

## Major findings

### CG-F-003 — Missing adapter contracts (formal interface)

| Field | Value |
|-------|-------|
| **Severity** | **Major** |
| **Status** | **CLOSED** (CG-1A, 2026-06-18) |
| **Category** | Adapter boundaries |
| **Description** | Module integration uses `*VlinkAccessService` ad hoc — no unified `ContextGraphModuleAdapter` interface or registry. |
| **Remediation** | Phase 1A — adapter interface + registry |
| **Closure evidence** | `ContextGraphAdapter` in `contextGraphTypes.ts`; 4 P0 adapters in `adapterRegistry.ts` |
| **Target** | Phase 1A |

### CG-F-004 — NOTE resolver debt

| Field | Value |
|-------|-------|
| **Severity** | **Major** |
| **Status** | **CLOSED (graph access path)** (CG-1B, 2026-06-18) |
| **Category** | Module integration |
| **Description** | NOTE type uses inline Prisma in resolver; no `notesVlinkAccessService`; no lifecycle unlink; manifest undeclared. |
| **Evidence** | [PLATFORM_ENTITY_MODEL.md](../architecture/PLATFORM_ENTITY_MODEL.md) — ⚠️ NOTE row |
| **Remediation** | Phase 1D — dedicated access + lifecycle service |
| **Closure evidence** | `notesVlinkAccessService.ts`; `vlinkEntityResolverService` delegates NOTE; `notesAdapter.ts` |
| **Residual** | NOTE lifecycle unlink; manifest `vlink` declaration — advisory |
| **Target** | Phase 1D (parallel with 1A) |

### CG-F-005 — No Tag Index

| Field | Value |
|-------|-------|
| **Severity** | **Major** |
| **Status** | **CLOSED** (CG-2A, 2026-06-19) |
| **Category** | Tags |
| **Description** | Cross-module tag facet search requires derived read index — not implemented. Module-local tags only. |
| **Remediation** | Phase 2A — read-only federated tag index + search API |
| **Closure evidence** | [CG_2A_TAG_INDEX_IMPLEMENTATION_REPORT.md](./CG_2A_TAG_INDEX_IMPLEMENTATION_REPORT.md); `tagIndexService.ts`; `GET /api/context-graph/tags/search` |
| **Target** | Phase 2A |

### CG-F-006 — No formal AI bundle format

| Field | Value |
|-------|-------|
| **Severity** | **Major** |
| **Status** | **CLOSED** (CG-1D, 2026-06-19) |
| **Category** | AI integration |
| **Description** | `vlinkPipelineContextService` returned implicit items — not `ContextBundleDescriptor` with provenance, AI suitability, token estimate. |
| **Remediation** | CG-1D — `graph_bundle` catalog source, `contextGraphBundleProvider`, `POST /api/context-graph/ai/grounding-bundle` |
| **Closure evidence** | [CG_1D_IMPLEMENTATION_REPORT.md](./CG_1D_IMPLEMENTATION_REPORT.md); `graphBundlePipelineContextService.ts`; pipeline catalog `graph_bundle` |
| **Target** | CG-1D |

### CG-F-007 — No graph permission contract tests

| Field | Value |
|-------|-------|
| **Severity** | **Major** |
| **Status** | **CLOSED** (CG-1C, 2026-06-19) |
| **Category** | Security / test |
| **Description** | PE-at-every-hop enforced in docs but no integration test suite for multi-hop traversal redaction. |
| **Remediation** | Phase 1A/1B — traversal permission test matrix |
| **Closure evidence** | `traversalPermissionMatrix.test.ts` (13 scenarios); [CG_1C_PERMISSION_TRAVERSAL_MATRIX.md](./CG_1C_PERMISSION_TRAVERSAL_MATRIX.md) |
| **Target** | Phase 1B |

---

## Advisory findings

### CG-F-008 — No graph projection API

| Severity | Advisory |
|----------|----------|
| **Description** | `GET /api/context-graph/projection` unspecified in runtime — visualization blocked |
| **Target** | Phase 1B |

### CG-F-009 — CHAT_THREAD deferred

| Severity | Advisory |
|----------|----------|
| **Description** | `VLinkEntityType.CHAT_THREAD` enum exists without resolver |
| **Target** | Phase 1D decision |

### CG-F-010 — NotebookLink not in federation orchestrator

| Severity | Advisory |
|----------|----------|
| **Status** | **PARTIAL** (CG-1B) |
| **Description** | Operational links require notebook adapter registration |
| **Closure evidence** | `notebookAdapter.ts` exposes `notebook.link` edges via `listPageLinks` |
| **Target** | Phase 1A |

### CG-F-011 — BA org/approval adapters missing

| Severity | Advisory |
|----------|----------|
| **Description** | L3 BA capabilities have no graph read adapters |
| **Target** | Phase 1B / 2 |

### CG-F-012 — No vlink-specific realtime

| Severity | Advisory |
|----------|----------|
| **Description** | Pull-based model only; domain events emitted but no graph cache invalidation consumer |
| **Target** | Phase 2+ optional |

### CG-F-013 — V_Link activity not in module envelope

| Severity | Advisory |
|----------|----------|
| **Description** | `VLinkActivity` is container-local — not normalized module activity |
| **Target** | Phase 2+ |

### CG-F-014 — PLATFORM_ENTITY_MODEL doc drift

| Severity | Advisory |
|----------|----------|
| **Description** | Truth table understates chat/todo/place/HR/scheduling resolver status |
| **Target** | Phase 1D doc sync |

### CG-F-015 — Admin impersonation policy for graph diagnostic

| Severity | Advisory |
|----------|----------|
| **Description** | `GET /api/context-graph/admin/projection` needs impersonation policy reference |
| **Target** | Phase 1B |

---

## Findings by category

| Category | Blocking | Major | Advisory |
|----------|----------|-------|----------|
| Architecture / runtime | 1 | 1 | 0 |
| API | 1 | 0 | 1 |
| Adapter boundaries | 0 | 1 | 2 |
| Module integration | 0 | 1 | 2 |
| Tags | 0 | 1 | 0 |
| AI integration | 0 | 1 | 0 |
| Security / test | 0 | 1 | 1 |
| Documentation | 0 | 0 | 1 |
| Realtime / activity | 0 | 0 | 2 |

---

## Closure criteria for Phase 1 gate

| Finding | Closure evidence | Status |
|---------|------------------|--------|
| CG-F-001 | `contextGraphOrchestratorService` + unit tests | **Closed** |
| CG-F-002 | `bundle/resolve` + `vlinks/:id/bundle` routes | **Closed** |
| CG-F-003 | Adapter registry with ≥4 modules | **Closed** |
| CG-F-005 | Federated tag index + search API | **Closed** (CG-2A) |
| CG-F-006 | Pipeline consumes `ContextBundleDescriptor` | **Closed** (CG-1D) |
| CG-F-007 | ≥10 traversal permission integration tests | **Closed** |

---

## CG-1A reports

| Document | Purpose |
|----------|---------|
| [CG_1C_CERTIFICATION_READINESS.md](./CG_1C_CERTIFICATION_READINESS.md) | CG-1C closeout & CG-2 gate |
| [CG_1A_ADAPTER_REGISTRY.md](./CG_1A_ADAPTER_REGISTRY.md) | Adapter contract + inventory |
| [CG_1A_BUNDLE_RESOLUTION_REPORT.md](./CG_1A_BUNDLE_RESOLUTION_REPORT.md) | Bundle resolver behavior |
| [CG_1A_PERMISSION_ENFORCEMENT_REPORT.md](./CG_1A_PERMISSION_ENFORCEMENT_REPORT.md) | PE trimming model |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [CONTEXT_GRAPH_CERTIFICATION_FRAMEWORK.md](./CONTEXT_GRAPH_CERTIFICATION_FRAMEWORK.md) | G1–G9 gates |
| [CONTEXT_GRAPH_ADAPTER_INVENTORY.md](./CONTEXT_GRAPH_ADAPTER_INVENTORY.md) | Per-adapter gaps |

**Last updated:** 2026-06-19 (CG-6 — program archived; plain L3 promoted)
