# CG-1D — AI Context Bundle Architecture

**Program:** CG-1D — AI Context Bundle Formalization  
**Date:** 2026-06-19  
**Status:** **IMPLEMENTED**

---

## Purpose

Formalize the **Context Graph → AI Pipeline** contract so the AI system consumes federation bundles as a **Tier 0 platform service**, without owning or mutating graph state.

---

## Architecture layers

```
┌─────────────────────────────────────────────────────────────┐
│  AI Pipeline (Digital Life Twin)                            │
│  catalog source: graph_bundle + legacy vlink                │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  graphBundlePipelineContextService (AI layer)               │
│  • query signal detection                                   │
│  • vlink membership discovery (Prisma — IDs only)           │
│  • NO direct adapter/registry access                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  contextGraphBundleProvider (constitutional boundary)       │
│  resolveVLinkBundlesForAi() → orchestrator only             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  contextGraphOrchestrator + bundleResolver (Tier 0)         │
│  • adapter registry                                         │
│  • PE at every hop                                          │
│  • read-only ContextBundleDescriptor                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Dual consumption model

| Source | Format | Role |
|--------|--------|------|
| `vlink` | Implicit `VLinkPipelineContextItem[]` | Legacy relationship context; confirmed memberships only |
| `graph_bundle` | Formal `ContextBundleDescriptor` + `ContextBundleAiGroundingPayload` | **Constitutional** federation grounding |

Both may run in parallel when catalog sources are enabled. **`graph_bundle` is the authoritative federation contract** for provenance, permission outcome, and adapter attribution.

---

## Constitutional constraints (non-negotiable)

| Rule | Enforcement |
|------|-------------|
| AI does not own graph state | No graph writes in AI layer; bundles are ephemeral views |
| AI does not mutate graph state | Read-only orchestrator; no write APIs added |
| AI does not bypass module SoR | All nodes hydrated via module adapters + PE |
| AI does not access adapters directly | `contextGraphBundleProvider` is sole bundle entry point |
| No graph DB / ContextNode table | Unchanged from CG-0C charter |
| No AI memory graph | AI remains consumer only (RD-CG-005) |

---

## Runtime artifacts

| Artifact | Path |
|----------|------|
| AI contract types | `server/src/context-graph/contextBundleAiContract.ts` |
| Bundle provider | `server/src/context-graph/contextGraphBundleProvider.ts` |
| Pipeline service | `server/src/ai/context/graphBundlePipelineContextService.ts` |
| Grounding HTTP endpoint | `POST /api/context-graph/ai/grounding-bundle` |
| Catalog source | `graph_bundle` in `pipelineCatalogDefaults.ts` |

---

## Related

- [CG_1D_PIPELINE_INTEGRATION_MODEL.md](./CG_1D_PIPELINE_INTEGRATION_MODEL.md)
- [CG_1D_CONTEXT_BUNDLE_SCHEMA.md](./CG_1D_CONTEXT_BUNDLE_SCHEMA.md)
- [CG_1D_AI_GROUNDING_CONTRACT.md](./CG_1D_AI_GROUNDING_CONTRACT.md)
- [CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md](./CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md)

**Last updated:** 2026-06-19
