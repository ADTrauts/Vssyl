# Context Graph — Bundle Composition Review

**Program:** Context Graph Phase 1A  
**Date:** 2026-06-23  
**Status:** Inventory artifact

---

## Purpose

Document how graph bundles are assembled today before the Retrieval → Bundle inference bridge.

---

## Graph bundle sources

| Source | Entry point | Trigger |
|--------|-------------|---------|
| **V_Link federation** | `fetchGraphBundlePipelineContext` | VL code, relationship query, intent boost |
| **Orchestrator** | `resolveVLinkBundle` / `resolveContextBundle` | API or provider |
| **AI provider** | `resolveVLinkBundlesForAi` | Pipeline `graph_bundle` catalog source |
| **Retrieval bridge (1A)** | `enrichGraphBundlesFromRetrieval` | `project_assistant` + flag |

---

## Federation adapters

Registered in `server/src/context-graph/adapterRegistry.ts`:

| Adapter | moduleId | Entity types |
|---------|----------|--------------|
| vlink | vlink | vlink container |
| drive | drive | file, folder |
| calendar | calendar | event |
| todo | todo | task, project |
| notes | notes | page |
| notebook | notebook | page |
| chat | chat | conversation |
| place | place | listing, meeting |

**Resolution flow:** `bundleResolver.ts` → adapter `getNode` / `getNeighbors` → PE via `permissionResolver`.

---

## V_Link contribution

| Element | Role in bundle |
|---------|----------------|
| `VLink` container | Root node (`kind: vlink`) |
| `VLinkEntity` | Attachment edges + hydrated nodes |
| `VLinkMember` | Membership gate (not content access) |

Provenance: `provenance.sources[]` with `system: vlink`.

---

## Entity contribution

Entity-root bundles (`entity_neighborhood`) use module adapter neighbors at depth 1. Node key: `{moduleId}:{entityType}:{entityId}`.

---

## Activity contribution

**None in bundle composition today.** Activity is audit/temporal signal — not fed into `ContextBundleDescriptor`. Domain events may trigger re-fetch but do not inject edges.

---

## Domain event contribution

**None in bundle assembly.** Per AI-6, events signal invalidation only.

---

## Bundle descriptor shape

See `contextGraphTypes.ts` — `ContextBundleDescriptor` with nodes, edges, provenance, permissionOutcome, composition budgets.

AI grounding: `contextBundleAiContract.ts` → `ContextBundleAiGroundingPayload`.

---

## Phase 1A addition

Retrieval evidence enriches bundles **additively** with `relationshipClass: inference` edges and `provenance: inference` metadata. Federation SoR edges unchanged.

**Last updated:** 2026-06-23
