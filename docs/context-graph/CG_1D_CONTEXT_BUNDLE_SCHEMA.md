# CG-1D — Context Bundle Schema

**Program:** CG-1D — AI Context Bundle Formalization  
**Date:** 2026-06-19  
**Status:** **IMPLEMENTED** — runtime types + AI grounding payload

---

## Canonical types

**Runtime SoT:** `server/src/context-graph/contextGraphTypes.ts`  
**AI contract:** `server/src/context-graph/contextBundleAiContract.ts`

Contract version: **`1.0`** (`CONTEXT_GRAPH_CONTRACT_VERSION`)

---

## ContextBundleDescriptor (full federation view)

Required top-level fields:

| Field | Type | Description |
|-------|------|-------------|
| `bundleId` | string | Ephemeral UUID — not persisted SoR |
| `kind` | BundleKind | `vlink`, `resolved`, etc. |
| `version` | `'1.0'` | Contract version |
| `createdAt` | ISO-8601 | Request timestamp |
| `root` | EntityRef \| VLinkContainerRef | Anchor descriptor |
| `tenantScope` | TenantScope | dashboardId + scope |
| `composition` | object | depth/budget/truncation metadata |
| `nodes` | ContextBundleNode[] | Permission-filtered nodes |
| `edges` | ContextBundleEdge[] | SoR edges only |
| `summaries` | object | human, ai, stats |
| `provenance` | object | sources[], consumer |
| `permissionOutcome` | object | overall, gatesApplied, counts |

---

## ContextBundleNode

| Field | Description |
|-------|-------------|
| `descriptor` | `(moduleId, entityType, entityId)` or vlink container |
| `display.title` | UI/AI-safe title (restricted → placeholder) |
| `access` | `full` \| `restricted` |
| `role` | `root` \| `attachment` \| `neighbor` |
| `metadata` | Tags as metadata only — never separate nodes |

---

## ContextBundleEdge

| Field | Description |
|-------|-------------|
| `edge.edgeType` | SoR edge type |
| `edge.relationshipClass` | Taxonomy class |
| `edge.grantsContentAccess` | Always `false` for V_Link attachments |
| `display.label` | Optional human label |

---

## ContextBundleAiGroundingPayload (AI-safe projection)

Produced by `bundleToAiGroundingPayload()` for pipeline consumption:

```typescript
interface ContextBundleAiGroundingPayload {
  contractVersion: '1.0';
  bundleId: string;
  kind: BundleKind;
  root: EntityRef | VLinkContainerRef;
  tenantScope: TenantScope;
  nodes: Array<{ descriptor; title; access; role; moduleId? }>;
  edges: Array<{ edgeType; relationshipClass; direction; label? }>;
  summaries: { ai?: string; stats };
  provenance: ContextBundleDescriptor['provenance'];
  permissionOutcome: ContextBundleDescriptor['permissionOutcome'];
  composition: { truncated; truncationReason?; nodesOmitted };
  estimatedTokens: number;
}
```

---

## Validation

`assertValidContextBundleForAi(bundle)` enforces:

- Contract version `1.0`
- Required root, tenantScope, provenance, permissionOutcome, summaries.stats

---

## Provenance (AI auditability)

```typescript
provenance: {
  sources: Array<{
    system: string;        // e.g. 'vlink', 'drive'
    adapterId?: string;
    recordsRead: number;
    recordsUsed: number;
  }>;
  consumer: 'ai_pipeline' | ...;
}
```

When `consumer === 'ai_pipeline'`, bundle was composed for AI grounding prepass.

---

## Permission outcome

```typescript
permissionOutcome: {
  overall: 'full' | 'partial' | 'empty';
  gatesApplied: string[];   // e.g. ['module_pe', 'vlink_membership']
  restrictedNodes: number;
  omittedNodes: number;       // denied nodes not listed in bundle
}
```

---

## Token estimate

`estimateBundleTokenCount(bundle)` — chars/4 heuristic over AI summary + node titles + provenance JSON.

Used in grounding payload and assembly budget planning.

---

## Related

- [CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md](./CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md)
- [CG_1D_AI_GROUNDING_CONTRACT.md](./CG_1D_AI_GROUNDING_CONTRACT.md)

**Last updated:** 2026-06-19
