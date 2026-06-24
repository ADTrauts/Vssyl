# Context Graph — AI Discovery Analysis

**Program:** Context Graph Phase 0A  
**Date:** 2026-06-23  
**Status:** Analysis of AI consumers and relationship-dependent questions

---

## Purpose

Identify how five AI Retrieval consumers discover information, which relationships they **reconstruct** at runtime, and where **relationship traversal** would improve results beyond search alone.

**Retrieval consumers (wired):** `workflow_action`, `business_operations`, `project_assistant`, `local_discovery`, `planning`

---

## Discovery paths today

```
User message → Pipeline intent → runPipelineRetrievalDiscovery()
  → resolveRetrievalConsumerIntent() → discover() → executeGlobalSearch()
  → AIRetrievalEvidence[] → context patch (_ai_retrieval_discovery)
```

Parallel paths (not replaced by retrieval):

| Path | Source | Relationship depth |
|------|--------|-------------------|
| V_Link pipeline | `vlinkPipelineContextService` | Persisted attachments |
| Graph bundle | `graphBundlePipelineContextService` | Federated bundle from anchor |
| Module AI providers | `ContextProviderOrchestrator` | Module-local edges |
| entityLinking | Inference merge | Ephemeral |

**Federation precedence:** [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md) — persisted V_Link beats inference.

---

## Consumer analysis

### 1. planning

| Aspect | Finding |
|--------|---------|
| **Typical questions** | "What do I have next week?", "Summarize my open commitments" |
| **Search sufficiency** | Moderate — finds tasks/events by text |
| **Traversal gap** | Task→project, event→calendar, cross-module timeline |
| **Reconstructed** | Implicit "my stuff" via dashboard scope + search hits |
| **Graph improvement** | Bounded containment traversal from dashboard anchor |

### 2. workflow_action

| Aspect | Finding |
|--------|---------|
| **Typical questions** | "Create task from this file", "Schedule follow-up" |
| **Search sufficiency** | Low for action targets — needs precise entity resolution |
| **Traversal gap** | File→conversation source, task→assignee roster |
| **Reconstructed** | Entity IDs from recent context + search |
| **Graph improvement** | Attachment edges (chat→file) + V_Link hub |

### 3. business_operations

| Aspect | Finding |
|--------|---------|
| **Typical questions** | "Status of Q2 initiative", "Who owns this process?" |
| **Search sufficiency** | Moderate across drive, todo, chat |
| **Traversal gap** | Business roster ≠ document access; org→artifact |
| **Reconstructed** | `operationalProfile` from evidence module diversity |
| **Graph improvement** | Business-scoped bundle with membership metadata (not access) |

### 4. project_assistant

| Aspect | Finding |
|--------|---------|
| **Typical questions** | "What's blocking the launch?", "Show all launch assets" |
| **Search sufficiency** | **Insufficient** — project is a cross-module concept |
| **Traversal gap** | Task+file+event+chat thread unity |
| **Reconstructed** | `projectProfile` + cross-module evidence counts |
| **Graph improvement** | **Highest value** — V_Link project hub or inferred project bundle |

### 5. local_discovery

| Aspect | Finding |
|--------|---------|
| **Typical questions** | "Coffee shops near the office", "Vendors for this business" |
| **Search sufficiency** | Good for Place listings via search provider |
| **Traversal gap** | Business→place context, follow graph |
| **Reconstructed** | `discoveryProfile.placeEvidenceCount` |
| **Graph improvement** | Place follow edges + business ownership (not internal file graph) |

---

## Questions requiring relationships (not search alone)

| Question pattern | Why search fails | Relationship needed |
|------------------|------------------|---------------------|
| "Everything for Project X" | Keyword collision | Containment + V_Link hub |
| "Who can see this link?" | Search has no membership model | V_LinkMember + PE |
| "What files came from this chat?" | Attachment not indexed as edge | Chat→file attachment |
| "Related tasks to this event" | No shared keyword | Co-link via V_Link or user accept |
| "My team's shared context" | Business scope ≠ shared files | Access grant vs association distinction |
| "Suggest links" | Search finds candidates only | Suggestion queue — not auto-edge |

---

## Repeatedly rediscovered relationships

| Signal | Mechanism | Persisted? | Graph candidate |
|--------|-----------|------------|-----------------|
| Cross-module evidence set | Retrieval adapter | No | Session projection |
| Co-linked in V_Link | Search finds hub | Yes (if user linked) | SoR — solid edge |
| Tag overlap | Tag index API | Metadata only | Overlay badge |
| Same conversation + file | Chat provider | Partial | Attachment edge |
| Project keyword cluster | project_assistant | No | **V_Link suggestion** |
| Place + business co-query | local_discovery | No | Discovery context only |

---

## Context providers vs retrieval

| Layer | Role |
|-------|------|
| **Module context providers** | Authoritative module-local relationships |
| **V_Link pipeline** | Authoritative cross-module associations |
| **Graph bundle** | Federated multi-hop read |
| **Retrieval** | **Discovery** — fills gaps when anchor unknown |

Retrieval should **feed** graph bundle composition in Phase 1 — not replace V_Link SoR.

---

## Recommendations for AI integration (Phase 1 — design only)

1. **Evidence → bundle hints:** Map `AIRetrievalEvidence` to candidate `GraphEdge` with `provenance: inference`
2. **Anchor resolution:** When retrieval finds hub V_Link, switch to `graph_bundle` grounding
3. **Consumer profiles:** Extend diagnostics to include `relationshipDepth` (flat search vs federated)
4. **No auto-persist:** High-confidence suggestions → `VLinkSuggestion` only (existing boundary)

---

## References

- [AI_RETRIEVAL_CONSUMER_STANDARD.md](../ai/retrieval/AI_RETRIEVAL_CONSUMER_STANDARD.md)
- [PROJECT_ASSISTANT_RETRIEVAL_INVENTORY.md](../ai/retrieval/PROJECT_ASSISTANT_RETRIEVAL_INVENTORY.md)
- [BUSINESS_OPERATIONS_RETRIEVAL_INVENTORY.md](../ai/retrieval/BUSINESS_OPERATIONS_RETRIEVAL_INVENTORY.md)
- [LOCAL_DISCOVERY_RETRIEVAL_INVENTORY.md](../ai/retrieval/LOCAL_DISCOVERY_RETRIEVAL_INVENTORY.md)

**Last updated:** 2026-06-23
