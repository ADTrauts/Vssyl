# Context Graph — Relationship Gap Analysis

**Program:** Context Graph Phase 1A  
**Date:** 2026-06-23  
**Status:** Prioritization only — no implementation

---

## Purpose

Identify relationships repeatedly **inferred** by Search/Retrieval/AI that are not stored as persisted edges. Prioritize for future V_Link suggestions or federation — not auto-persist.

---

## Prioritization matrix

| Relationship | Frequency | Consumers | Persisted today? | Priority | Remediation path |
|--------------|-----------|-----------|------------------|----------|------------------|
| **project ↔ file** | High | project_assistant | Partial (V_Link manual) | **P0** | V_Link hub + bridge inference |
| **project ↔ task** | High | project_assistant, planning | Containment FK | P1 | Todo project scope in bundle |
| **project ↔ conversation** | Medium | project_assistant | Rare V_Link | **P0** | Suggestion queue |
| **project ↔ event** | Medium | project_assistant, planning | V_Link optional | P1 | Calendar bundle adapter |
| **project ↔ place** | Low | local_discovery | No | P2 | Business-scoped discovery |
| **file ↔ task** | Medium | workflow_action | No cross-module FK | **P0** | Attachment inference → suggestion |
| **chat ↔ file** | Medium | workflow_action | Chat attachment | P1 | Chat adapter neighbors |
| **business ↔ artifact** | High | business_operations | Scope only | P1 | Operational bundle |
| **tag co-occurrence** | High | Search, tag index | Metadata only | P2 | Tag overlay — not edges |
| **user ↔ cross-module cluster** | High | All retrieval consumers | Dashboard scope | P1 | Session inference bundle |

---

## P0 gaps (Phase 1B+ candidates)

1. **project ↔ file** — Cross-module launch assets; retrieval rediscovers every turn.
2. **project ↔ conversation** — Decision threads not linked to project hub.
3. **file ↔ task** — Workflow actions need attachment edge without manual V_Link.

**Remediation (governed):** `VLinkSuggestion` after user-visible inference — **not** auto-persist from bridge.

---

## What Phase 1A addresses

Bridge surfaces co-occurring retrieval evidence as **inference edges** in bundle composition. Does **not** close P0 persistence gaps — reduces redundant rediscovery within a single request.

---

## Explicitly deferred

- Graph traversal APIs
- Relationship storage tables
- Semantic/vector edges
- Recommendation auto-accept

**Last updated:** 2026-06-23
