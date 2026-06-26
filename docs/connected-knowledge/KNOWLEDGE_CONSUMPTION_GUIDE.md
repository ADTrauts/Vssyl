# Knowledge Consumption Guide

**Program:** Connected Knowledge Platform — Phase 1C  
**Date:** 2026-06-25  
**Status:** Active

**Authority:** [KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md](./KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md)

---

## 1. Quick start

### For AI / pipeline consumers

1. Enable flags: `KNOWLEDGE_COMPOSITION_ENABLED=true` + `KNOWLEDGE_CONVERGENCE_ENABLED=true`
2. Read `graphBundlePipelineContext.knowledgeNeighborhoods` after pipeline grounding
3. Map to Knowledge Cards via `toKnowledgeCards(neighborhoods, { consumer })`
4. **Do not** manually reconstruct from `groundingPayloads` when neighborhoods exist

### For API consumers

```http
POST /api/context-graph/knowledge/neighborhood
Authorization: Bearer <token>
Content-Type: application/json

{
  "consumer": "api_client",
  "vlinkIdOrCode": "VL-123456",
  "tenantScope": { "dashboardId": "...", "scope": "PERSONAL" }
}
```

Response includes `neighborhoods`, `knowledgeCards`, `bundles`, and `serviceDiagnostics`.

---

## 2. Read path hierarchy

```
Context Graph resolve
        ↓
Knowledge Composition (1A)
        ↓
Knowledge Convergence (1B)
        ↓
Neighborhood Service (1C)  ← canonical read entry
        ↓
Knowledge Card             ← presentation contract
        ↓
Consumer (AI, Workspace, Dashboard, …)
```

---

## 3. Project Assistant pilot

When `project_assistant` intent is detected and convergence is enabled:

| Artifact | Location |
|----------|----------|
| Module patch | `moduleContexts._knowledge_neighborhood` |
| AI context block | `Knowledge Neighborhood (connected understanding)` |
| Retrieval profile | `projectProfile.knowledgeConsumption` |

The assembler **skips** manual graph bundle reconstruction when neighborhoods are present.

Rendered sections: summary, facts, relationships, activity, history, confidence, provenance, suggested relationships.

---

## 4. Consumer readiness (Phase 1C — evaluate only)

| Consumer | Readiness | Blockers | Recommended path |
|----------|:---------:|----------|------------------|
| **Project Assistant** | ✅ Pilot | None | Knowledge Cards via Neighborhood Service |
| **Planning** | 🟡 Ready | No dedicated UI block yet | Pipeline neighborhoods + `toKnowledgeCards` |
| **Business Operations** | 🟡 Ready | No workspace integration | API + pipeline neighborhoods |
| **Workspace** | 🟠 Partial | No hub card component | `POST /knowledge/neighborhood` + Knowledge Card |
| **Dashboard** | 🟠 Partial | Widgets use activity kernel, not neighborhoods | L2–L3 card subset when widget facade exists |
| **Search** | 🔴 Not ready | Entity discovery only; no neighborhood anchor | Hints channel — do not migrate yet |
| **V_Link hub UI** | 🟡 Ready | Uses governance queue, not neighborhoods | Suggested relationships from cards |

**Do not migrate** Workspace, Dashboard, Search, or Business Operations UI in Phase 1C.

---

## 5. Fallback behavior

| Condition | Fallback |
|-----------|----------|
| Convergence disabled | `bundles` only; 503 from neighborhood API |
| Composition disabled | Raw `ContextBundleDescriptor` on pipeline context |
| Empty neighborhood | 404 from API; assembler uses graph bundles |

`sourceBundles` on each neighborhood always retains full `KnowledgeBundle` for unmigrated consumers.

---

## 6. Anti-patterns

| Do not | Why |
|--------|-----|
| Re-map provenance in UI | Use Knowledge Card fields |
| Merge bundle + neighborhood manually | Use Neighborhood Service |
| Treat suggested relationships as facts | KC governance rule |
| Cache neighborhoods cross-tenant | Tenancy violation |

---

## 7. Testing

```bash
pnpm --filter vssyl-server validate:connected-knowledge
```

Covers composition, convergence, neighborhood service, knowledge cards, and Project Assistant consumer.

---

## 8. References

- [KNOWLEDGE_NEIGHBORHOOD_SERVICE.md](./KNOWLEDGE_NEIGHBORHOOD_SERVICE.md)
- [KNOWLEDGE_CARD_STANDARD.md](./KNOWLEDGE_CARD_STANDARD.md)
- [CONNECTED_KNOWLEDGE_PHASE_1C_CLOSEOUT.md](./CONNECTED_KNOWLEDGE_PHASE_1C_CLOSEOUT.md)
