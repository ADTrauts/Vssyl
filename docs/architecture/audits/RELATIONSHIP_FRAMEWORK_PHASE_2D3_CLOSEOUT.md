# Relationship Framework — Phase 2D-3 Closeout

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-3 — Relationship Recommendation Architecture  
**Status:** **Complete**  
**Date:** 2026-06-14  
**Prior phases:** 1A–1D, 2A–2C, 2D-1, 2D-2

> **Scope:** Constitutional recommendation architecture only. No engine, ML, APIs, schemas, or UI.

---

## Required report

| # | Topic | Section |
|---|-------|---------|
| 1 | Recommendation model summary | §1 |
| 2 | Signal model summary | §2 |
| 3 | Permission model summary | §3 |
| 4 | AI boundary summary | §4 |
| 5 | Lifecycle summary | §5 |
| 6 | Governance summary | §6 |
| 7 | Unresolved risks | §7 |
| 8 | Recommended next phase | §8 |

---

## Phase 2D-3 deliverables

| ID | Deliverable | Path | Status |
|----|-------------|------|--------|
| 2D3-1 | Recommendation architecture | [RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md](../RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md) | ✅ |
| 2D3-2 | Signal model | [RECOMMENDATION_SIGNAL_MODEL.md](../RECOMMENDATION_SIGNAL_MODEL.md) | ✅ |
| 2D3-3 | Permission model | [RECOMMENDATION_PERMISSION_MODEL.md](../RECOMMENDATION_PERMISSION_MODEL.md) | ✅ |
| 2D3-4 | AI recommendation boundary | [AI_RECOMMENDATION_BOUNDARY.md](../AI_RECOMMENDATION_BOUNDARY.md) | ✅ |
| 2D3-5 | Lifecycle model | [RECOMMENDATION_LIFECYCLE_MODEL.md](../RECOMMENDATION_LIFECYCLE_MODEL.md) | ✅ |
| 2D3-6 | Governance | [RECOMMENDATION_GOVERNANCE.md](../RECOMMENDATION_GOVERNANCE.md) | ✅ |
| 2D3-7 | Phase 2D-3 closeout | This document | ✅ |

---

## 1. Recommendation model summary

### Locked principles

| Principle | Statement |
|-----------|-----------|
| **Recommendations = suggestions** | Proposals — not facts |
| **Relationships = facts** | SoR after authorized mutation |
| **Acceptance required** | Canonical module/platform API |
| **Non-authoritative** | Proposal stores ≠ relationship SoR |
| **Explainable** | reasonCode + reasonText required |
| **Approval-driven** | User remains authority |

### Ecosystem

Sources (read-only signals) → correlator/ranker (future) → permission filter → proposal stores (`VLinkSuggestion`, `AISuggestion`, Place) → consumers → **accept path** → relationship SoR + domain events.

---

## 2. Signal model summary

**14 signal families** documented: relationship proximity, shared V_Link, tags, participants, business, project, calendar, files, conversations, location, graph proximity, search behavior, AI context overlap, domain event correlation.

| Rule | Detail |
|------|--------|
| Confidence bands | low / medium / high — not auto-accept |
| Cross-module tags | No equivalence inference |
| ML (future) | Rank within adapter-visible candidates only — Phase 3 charter |

---

## 3. Permission model summary

**Fail-closed** — same bar as search/graph/adapters.

- Signal inputs visibility-gated  
- Cross-tenant forbidden  
- No permission inheritance shortcuts  
- Redact or omit — never leak titles  
- Accept re-checks PE — stale proposals expire  

---

## 4. AI boundary summary

| Allowed | Forbidden |
|---------|-----------|
| Surface, explain, draft suggestions | Auto-create relationships |
| VLinkSuggestion pending | Pipeline grounding of pending |
| T2 event correlation | Silent graph solid edges |
| Rank with explainability | Hidden candidates from embeddings |

Precedence: recommendations **below** confirmed V_Link for grounding.

Aligned with AI retrieval, automation, and graph interaction docs.

---

## 5. Lifecycle summary

| State | Relationship created? |
|-------|----------------------|
| **Suggested** | No |
| **Accepted** | Yes — via mutation then terminal proposal |
| **Rejected** | No |
| **Dismissed** | No |
| **Expired** | No |

**Recommendation state ≠ relationship state.**

---

## 6. Governance summary

- Certification **RG1–RG17**  
- Signal family ownership table  
- Levels Rec0–Rec3  
- Guards against hidden rankers and recommendation-only edges  
- Contract test themes defined  

---

## 7. Unresolved risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| REC-R1 | Ambient AI frequency annoyance | Medium | Caps + dismiss preferences |
| REC-R2 | Tag signal → V_Link product pressure | High | Signal model SC + boundary docs |
| REC-R3 | Place discovery vs private workspace blur | Medium | Tenant partitions |
| REC-R4 | Multiple proposal stores — inconsistent UX | Medium | Unified card DTO (future) |
| REC-R5 | ML ranker scope creep | High | RG15–RG17 Phase 3 gate |
| REC-R6 | Stale accept after revoke | Medium | PE re-check on accept |
| REC-R7 | explainabilityKey catalog unmaintained | Low | Governance registry |

---

## 8. Recommended next phase

**Not executed.**

| Rank | Phase | Proposed deliverables |
|------|-------|----------------------|
| **2D-4 (recommended)** | **Relationship Analytics Model** | `RELATIONSHIP_ANALYTICS_MODEL.md` — event-derived C0 metrics, no edge SoR |
| **Phase 3 (future)** | **Relationship Intelligence Platform** | Insights, health metrics, explainability — **after** 2D-4; ML charter separate |

**Recommendation:** Complete **2D-4 Relationship Analytics Model** to close Phase 2 consumer architecture (search, automation, read, graph, recommend, analytics).

### Potential Phase 3 themes (document only — not started)

- Relationship Intelligence Platform  
- Relationship Insights dashboards  
- Relationship Health Metrics  
- Relationship Explainability tooling  

---

## Framework index update

Recommendation artifacts registered under **Phase 2D-3** in [RELATIONSHIP_FRAMEWORK_INDEX.md](../RELATIONSHIP_FRAMEWORK_INDEX.md).

---

## Success criteria

| Criterion | Met? |
|-----------|------|
| Recommendations vs relationships clarified | ✅ |
| Signal families with permission/explainability | ✅ |
| Fail-closed permission model | ✅ |
| AI boundary aligned | ✅ |
| Lifecycle distinct from relationship lifecycle | ✅ |
| Governance certification | ✅ |
| No engine/ML implementation | ✅ |
| Phase 2D-4 recommended | ✅ |

---

## Next step

**Human gate:** Approve Phase 2D-4 (Relationship Analytics Model).

**Do not execute Phase 2D-4** until explicitly requested.

---

**Last updated:** 2026-06-14
