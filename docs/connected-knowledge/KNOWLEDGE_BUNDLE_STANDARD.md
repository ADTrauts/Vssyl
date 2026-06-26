# Knowledge Bundle Standard

**Program:** Connected Knowledge Platform — Phase 1A  
**Date:** 2026-06-25  
**Status:** Implemented contract v1.0 — neighborhoods extend bundles Phase 1B

**Authority:** [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md) · [KNOWLEDGE_PROVENANCE_STANDARD.md](./KNOWLEDGE_PROVENANCE_STANDARD.md)

---

## 1. Purpose

Define the **canonical platform knowledge contract** — the structure every governed consumer receives after composition.

---

## 2. KnowledgeBundle

```typescript
interface KnowledgeBundle {
  bundleId: string;                    // kb-{contextBundleId}
  version: '1.0';
  composedAt: string;                  // ISO 8601
  anchor?: RootRef;
  contextBundleId: string;
  kind: BundleKind;
  tenantScope: TenantScope;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  facts: KnowledgeFact[];
  contextBundle: ContextBundleDescriptor;  // fallback for unmigrated consumers
  diagnostics: KnowledgeBundleDiagnostics;
  metadata: {
    consumer: KnowledgeConsumerId;
    trustTier: KnowledgeTier;          // highest-authority tier in bundle
  };
}
```

---

## 3. KnowledgeNode

Every node includes:

| Field | Required | Description |
|-------|:--------:|-------------|
| `nodeKey` | ✅ | `{moduleId}:{entityType}:{entityId}` or `vlink:container:{id}` |
| `provenance.tier` | ✅ | L0–L6 (nodes: L0–L4, L6 — never L5) |
| `provenance.origin` | ✅ | Constitutional origin enum |
| `provenance.hydratedAt` | ✅ | Compose timestamp |
| `provenance.hydrateSource` | ✅ | `module_adapter` \| `vlink_resolver` \| `partner_delegate` \| `retrieval_inference` |
| `trust` | ✅ | Authorization + label + freshness |
| `consumerEligibility` | ✅ | Per-consumer tier access + disclosure flag |

---

## 4. KnowledgeEdge

Every edge includes:

| Field | Required | Description |
|-------|:--------:|-------------|
| `provenance.tier` | ✅ | L0–L4, L6 (L5 forbidden in bundle) |
| `provenance.origin` | ✅ | Constitutional origin |
| `provenance.assertedAt` | ✅ | Source assertion time |
| `provenance.verifiedAt` | ✅ | Compose/hydrate time |
| `provenance.actor` | ✅ | User, system, partner, or AI |
| `provenance.sourceSystem` | ✅ | Module or system id |
| `confidence` | ✅ | C1–C4 (never numeric in API) |
| `trust` | ✅ | Constitutional trust label |
| `consumerEligibility` | ✅ | Consumer matrix |

---

## 5. Origin → tier mapping (compose time)

| As-built signal | Origin | Tier |
|-----------------|--------|:----:|
| Module FK / neighbor | `module_native` | L2 |
| V_Link attachment | `vlink_manual` | L2 |
| AI accepted suggestion | `vlink_ai_accepted` | L3 |
| User memory explicit | `user_memory_explicit` | L3 |
| Retrieval inference bridge | `retrieval_evidence` | L6 (nodes), L4 (edges) |
| entityLinking / synthesis | `ai_inference` | L4 |
| Partner delegate hydrate | `partner_delegate` | L1 |
| Pending suggestion | `suggestion_pending` | L5 — **excluded** |

---

## 6. Consumer eligibility matrix

| Consumer | L0–L3 | L4 | L5 | L6 |
|----------|:-----:|:--:|:--:|:--:|
| project_assistant | ✅ | ✅ disclose | ❌ | ✅ disclose |
| planning | ✅ | ✅ disclose | ❌ | ✅ disclose |
| business_operations | ✅ | ✅ disclose | ❌ | ✅ disclose |
| local_discovery | ✅ | ✅ disclose | ❌ | ✅ disclose |
| ai_pipeline | ✅ | ✅ disclose | ❌ | ✅ disclose |
| hub_ui | ✅ | ❌ | ✅ review | ❌ |
| admin_diagnostic | ✅ | ✅ | ✅ | ✅ |

---

## 7. Validation rules (CI)

| Rule | Check |
|------|-------|
| KB-1 | No bundle edge without `tier` and `origin` |
| KB-2 | No L5 edges in federation bundle |
| KB-3 | Every node has `consumerEligibility` |
| KB-4 | `contextBundle` fallback present on every KnowledgeBundle |
| KB-5 | Confidence is C1–C4 enum only |

---

## 9. Relationship to Knowledge Neighborhood (Phase 1B)

Bundles are the **evidence layer**. Neighborhoods are the **understanding layer** built from bundles via convergence. Every neighborhood retains `sourceBundles[]` for unmigrated consumers.

See [KNOWLEDGE_NEIGHBORHOOD_STANDARD.md](./KNOWLEDGE_NEIGHBORHOOD_STANDARD.md).

---

## 10. References

- [KNOWLEDGE_COMPOSITION_ENGINE.md](./KNOWLEDGE_COMPOSITION_ENGINE.md)
- [CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md](../context-graph/CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md)
