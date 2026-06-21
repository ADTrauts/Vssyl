# Context Graph — AI Integration Analysis

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0A — Discovery  
**Date:** 2026-06-18  
**Status:** Analysis only — no implementation

**Authority:** [AI_PLATFORM_OVERVIEW.md](../architecture/AI_PLATFORM_OVERVIEW.md), [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md)

---

## Purpose

Define how AI should consume graph nodes, relationships, context bundles, and memory — extending today's V_Link pipeline integration into a full Context Graph consumption model.

**No code changes in Phase 0A.**

---

## Current AI integration (verified)

| Component | Role | Status |
|-----------|------|--------|
| `vlinkPipelineContextService` | Confirmed vlinks + resolved attachments | ✅ Production |
| `entityLinking.ts` | Merges module payloads + `persistedVLinks` | ✅ Production |
| Pipeline catalog source `vlink` | Admin-toggleable grounding source | ✅ Production |
| `recent_vlinks` context provider | Module AI provider | ✅ Production |
| `GET /api/vlinks/ai/context/recent` | Bounded recent context endpoint | ✅ Production |
| Query signal detection | VL-code + relationship keywords | ✅ Production |

---

## Target consumption model

### Layer 1 — Durable user memory

| Source | Class | Precedence |
|--------|-------|------------|
| `UserMemoryFact` | AI context | **Highest** for factual claims |
| `UserAIContext` | AI context + tags | Instruction/context rows |

**Not graph edges.** Memory is user-scoped semantic facts — adjacent to graph, not replaced by it.

### Layer 2 — Persisted associations (V_Link)

| Source | What AI receives |
|--------|------------------|
| Active vlinks where user is member | Container title, public code, scope |
| Resolved attachments | Entity type, id, title (or redacted), url |
| Nested parent | `parentVLinkId` for hierarchy context |

**Pipeline entry:** `fetchVLinkPipelineContext` when catalog source enabled.

### Layer 3 — Module entity context

| Source | Pattern |
|--------|---------|
| Context providers | Pattern A — bounded entity lists |
| Attached files | Drive analysis path |
| Module operational state | Task status, event time, etc. |

### Layer 4 — Operational relationships

| Source | When included |
|--------|---------------|
| `NotebookLink` | Intent requires page-task context |
| `TaskDependency` | Task management intents |
| `TaskFileLink` | File-task intents |

**Intent-gated** — not always-on grounding.

### Layer 5 — Context bundles (future formalization)

| Bundle | Composition |
|--------|-------------|
| **V_Link bundle** | Container + attachments (today ≈ pipeline item) |
| **Session bundle** | Layers 1–4 for active workspace scope |
| **Anchor neighborhood** | 1-hop graph projection for entity detail |

**Recommendation:** Define `ContextBundleDescriptor` in Phase 0B — logical type, no Prisma.

### Layer 6 — Inference (ephemeral)

| Source | Rules |
|--------|-------|
| `entityLinking` inference | Merge with persisted; mark ephemeral |
| Query similarity | Never written to SoR |
| Tag collision | **Forbidden** as relationship signal |

---

## Graph nodes in AI prompts

| Node type | Prompt representation |
|-----------|----------------------|
| Resolved file | Title, path/url, type — if PE allows |
| Restricted attachment | `[Restricted drive item]` |
| V_Link container | Title, VL-code, attachment count |
| Calendar event | Title, time — via resolver |
| Org position | Title, department — via future adapter |

**Budget:** Relationship context participates in assembly tier budgeting per [AI_CONTEXT_ASSEMBLY.md](../architecture/AI_CONTEXT_ASSEMBLY.md).

---

## Graph relationships in AI prompts

| Relationship | Format |
|--------------|--------|
| V_Link attachment | "In vlink **Tax 2024**: linked file *Receipt.pdf*, task *File taxes*" |
| NotebookLink | "Page *Meeting notes* references task *Follow up*" |
| Task dependency | "Task *B* blocked by task *A*" |
| Approval chain | "Approvals route to manager *Jane*" — workflow intents only |

---

## Memory vs graph boundary

| Question | Answer |
|----------|--------|
| Should AI memory be graph nodes? | **No** — separate SoR |
| Can memory reference graph anchors? | **Yes** — metadata pointer to entity ref |
| Can vlinks promote to memory? | **User explicit action** — not automatic |
| Do tags become memory? | **No** — unless user promotes via memory UX |

---

## Pipeline trace expectations

When Context Graph matures:

| Trace field | Value |
|-------------|-------|
| `source` | `vlink`, `module_context`, `memory`, `graph_bundle` |
| `nodesConsidered` | Count |
| `nodesUsed` | After PE filter |
| `restrictedCount` | Redacted attachments |
| `suggestionsIgnored` | Pending AI suggestions |
| `depth` | Traversal depth used |

---

## Admin Portal integration

| Admin surface | Graph relevance |
|---------------|-----------------|
| Context Sources catalog | Enable/disable `vlink` source |
| Pipeline diagnostics | Trace `source: vlink` |
| Grounding rules | `reconcileSystemPipelineGroundingRules()` |

Admin configures **whether** graph relationships ground — not **what** relationships exist.

---

## Gaps for AI consumption

| Gap | Impact | Phase |
|-----|--------|-------|
| No formal context bundle API | AI uses implicit vlink items | 0B contract |
| No graph orchestrator for non-vlink edges | NotebookLink intent-only | 1A adapter |
| NOTE resolver partial | Notes grounding weaker | 1A remediation |
| No relationship summary provider | Missed cross-module synthesis | 1B |
| Tag index absent | Cross-module tag facet unavailable | 2A |

---

## Recommendations

1. **Keep V_Link as primary AI relationship channel** — extend, don't replace
2. **Formalize context bundle descriptor** in Phase 0B
3. **Add graph orchestrator read path** for AI in Phase 1A (read-only)
4. **Preserve precedence ordering** — memory > persisted vlink > providers > inference
5. **Do not implement AI memory graph** — keep `UserMemoryFact` separate

---

**Last updated:** 2026-06-18
