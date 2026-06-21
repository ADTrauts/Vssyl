# Context Graph — Bundle Descriptor Specification

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0B — Constitutional architecture  
**Date:** 2026-06-18  
**Status:** Logical type specification — no implementation

---

## 1. Purpose

Define the **ContextBundleDescriptor** — a logical, serializable view composing nodes, edges, summaries, and provenance for AI grounding, hub UI, and API consumers. Bundles are **views**, not persisted graph snapshots.

---

## 2. Bundle kinds

| kind | Anchor | Typical consumer |
|------|--------|------------------|
| `vlink` | `vlink:{id}` | Hub UI, AI pipeline |
| `entity_neighborhood` | Entity descriptor | Entity detail panels |
| `ai_session` | User + workspace scope | Twin orchestration |
| `notebook_context` | `notebook:page:{id}` | Notebook + AI |
| `resolved` | Arbitrary root from `bundle/resolve` | API clients |

---

## 3. Root descriptor

```typescript
interface ContextBundleDescriptor {
  bundleId: string;              // ephemeral UUID per request — not SoR
  kind: 'vlink' | 'entity_neighborhood' | 'ai_session' | 'notebook_context' | 'resolved';
  version: '1.0';
  createdAt: string;             // ISO-8601

  root: PlatformEntityNodeDescriptor | VLinkContainerNodeDescriptor;

  tenantScope: {
    dashboardId: string;
    businessId?: string | null;
    householdId?: string | null;
    scope: 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD';
  };

  composition: {
    depthRequested: number;
    depthUsed: number;
    nodeBudgetRequested: number;
    nodeBudgetUsed: number;
    edgeBudgetRequested: number;
    edgeBudgetUsed: number;
    truncated: boolean;
    truncationReason?: 'node_budget' | 'depth_cap' | 'permission_omit';
  };
}
```

---

## 4. Included nodes

```typescript
interface ContextBundleNode {
  descriptor: PlatformEntityNodeDescriptor | VLinkContainerNodeDescriptor;
  display: {
    title: string;
    subtitle?: string;
    icon?: string;
    url?: string;
  };
  access: 'full' | 'restricted';
  role: 'root' | 'attachment' | 'neighbor' | 'container_member';
  metadata?: {
    tags?: string[];
    moduleLabel?: string;
    updatedAt?: string;
    publicCode?: string;       // vlink containers
  };
}
```

**Rules:**

- `access: 'restricted'` → title replaced with placeholder; no url with sensitive path
- Tags appear in `metadata.tags` — never as separate bundle nodes
- Omitted nodes are **not listed** — counted only in `composition.nodesOmitted`

---

## 5. Included edges

```typescript
interface ContextBundleEdge {
  edge: GraphEdgeDescriptor;
  display?: {
    label?: string;            // e.g. "linked in Tax 2024"
  };
  ephemeral?: boolean;         // true for inference-only edges
}
```

**Rules:**

- SoR edges: `ephemeral: false` or omitted
- `entityLinking` inference: `ephemeral: true` — never persisted
- V_Link attachments: `grantsContentAccess: false` always

---

## 6. Summaries

```typescript
interface ContextBundleSummaries {
  human?: string;               // UI-safe markdown summary
  ai?: string;                  // prompt-safe compact summary
  stats: {
    nodeCount: number;
    edgeCount: number;
    restrictedNodeCount: number;
    containerCount: number;
    attachmentCount: number;
    tagsDistinct?: string[];    // union of node tags — facet hint only
  };
}
```

### Summary generation rules

| Consumer | Max length | Content |
|----------|------------|---------|
| `human` | 2 KB | Titles + relationship labels |
| `ai` | 4 KB | Compact list form; redaction placeholders |
| `stats` | — | Counts only — no content |

---

## 7. Provenance

```typescript
interface ContextBundleProvenance {
  sources: Array<{
    system: 'vlink' | 'drive' | 'todo' | 'calendar' | 'chat' | 'notebook' | 'memory' | 'tag_index' | string;
    adapterId?: string;
    recordsRead: number;
    recordsUsed: number;
  }>;
  orchestratorVersion?: string;
  consumer: 'ai_pipeline' | 'hub_ui' | 'api_client' | 'search' | 'admin_diagnostic';
  requestId?: string;
}
```

**AI trace mapping:** Provenance `sources` map to pipeline trace `source` fields.

---

## 8. Permission outcome

```typescript
interface ContextBundlePermissionOutcome {
  overall: 'full' | 'partial' | 'empty';
  gatesApplied: Array<
    'tenant' | 'vlink_membership' | 'module_visibility' | 'policy_engine' | 'catalog_disabled'
  >;
  restrictedNodes: number;
  omittedNodes: number;
  suggestionsExcluded: number;
  pendingSuggestionsIgnored: number;
  catalogSourcesEnabled?: string[];   // e.g. ['vlink']
}
```

| overall | Meaning |
|---------|---------|
| `full` | All nodes `access: full` |
| `partial` | Mix of full + restricted |
| `empty` | No visible nodes after gates |

---

## 9. AI suitability flags

```typescript
interface ContextBundleAiSuitability {
  groundable: boolean;          // safe for twin prompt injection
  groundableReason?: string;    // if false — e.g. 'catalog_disabled', 'no_membership'
  precedenceLayer: 1 | 2 | 3 | 4 | 5 | 6 | 7;  // per AI_RELATIONSHIP_RETRIEVAL_MODEL
  includesEphemeralEdges: boolean;
  includesRestrictedEntities: boolean;
  includesMemory: boolean;        // adjacent layer — not in bundle edges
  suggestedPipelineSource: 'vlink' | 'graph_bundle' | 'module_context';
  tokenEstimate: number;
}
```

### Precedence layers

| Layer | Source |
|------:|--------|
| 1 | UserMemoryFact |
| 2 | Persisted V_Link (this bundle when kind=vlink) |
| 3 | Module AI providers |
| 4 | Operational links |
| 5 | Search hydrate |
| 6 | Domain event signal (triggers re-fetch — not raw payload) |
| 7 | Inference (ephemeral) |

---

## 10. Depth limits

| Surface / consumer | maxDepth | maxNodes | maxEdges |
|--------------------|----------|----------|----------|
| V_Link hub bundle | 1 | 100 | 100 |
| Entity neighborhood | 1 | 50 | 50 |
| AI session bundle | 1 | 50 | 50 |
| Notebook context | 2 | 30 | 30 |
| Admin diagnostic | 2 | 200 | 200 |
| Default API | 1 | 50 | 50 |

**Hard cap:** `depth > 2` prohibited for user-facing consumers.

---

## 11. Token budget limits

| Consumer | Default token budget | Overflow behavior |
|----------|---------------------|-------------------|
| AI pipeline | 2,000 tokens (bundle slice) | Truncate summaries; drop lowest-relevance attachments |
| Hub UI | N/A (not token-bound) | Paginate attachments |
| API client | Configurable `maxTokenEstimate` param | Return `truncated: true` |

### Token estimation rules

| Field | Estimate |
|-------|----------|
| Node title + subtitle | ~20 tokens each |
| Edge label | ~10 tokens |
| Tag string | ~3 tokens |
| AI summary | counted verbatim |

Orchestrator returns `aiSuitability.tokenEstimate` — assembler enforces tier budget.

---

## 12. Example (conceptual)

```json
{
  "bundleId": "bnd_ephemeral_01",
  "kind": "vlink",
  "version": "1.0",
  "root": { "kind": "container", "containerType": "vlink", "vlinkId": "…" },
  "tenantScope": { "dashboardId": "…", "businessId": "…", "scope": "BUSINESS" },
  "composition": { "depthRequested": 1, "depthUsed": 1, "truncated": false },
  "nodes": [ "…" ],
  "edges": [ "…" ],
  "summaries": { "ai": "V_Link Tax 2024: file Receipt.pdf, task File taxes", "stats": { "nodeCount": 3 } },
  "provenance": { "sources": [{ "system": "vlink", "recordsUsed": 2 }], "consumer": "ai_pipeline" },
  "permissionOutcome": { "overall": "partial", "restrictedNodes": 1 },
  "aiSuitability": { "groundable": true, "precedenceLayer": 2, "tokenEstimate": 340 }
}
```

---

## 13. Mapping from today's V_Link pipeline

| Today (`VLinkPipelineContextItem`) | Bundle field |
|-----------------------------------|--------------|
| `vlinkId`, `publicCode`, `title` | root container node |
| `linkedEntities[]` | nodes + vlink.attachment edges |
| `restrictedLinkedEntityCount` | `permissionOutcome.restrictedNodes` |
| `accessibleLinkedEntityCount` | stats |
| Pipeline skip reasons | `permissionOutcome.overall: empty` |

Phase 1C formalizes this mapping in code — not in 0B.

---

**Last updated:** 2026-06-18
