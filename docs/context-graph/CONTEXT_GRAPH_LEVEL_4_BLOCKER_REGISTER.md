# Context Graph — Level 4 Blocker Register

**Program:** Context Graph L4 Certification  
**Date:** 2026-06-23  
**Status:** **L4 awarded (RD-CG-L4-001)** — remaining items are post-cert gates

---

## Level 4 definition (this program)

**Graph Ready / Certified Graph Capability:** Unified, governed consumption of relationships across Search, Retrieval, Context Graph federation, and AI grounding — with production-safe defaults, multi-consumer readiness, and council-ratified contracts.

**Current:** ~3.9 runtime; L3 certified federation; consumption stack pilot-only.

---

## Level 4 blockers

| ID | Blocker | Severity | Owner | Status | Closure criteria |
|----|---------|----------|-------|--------|------------------|
| L4-B01 | Consumption stack not council-ratified | **Major** | Platform council | **Closed (L4)** | RD-CG-L4-001 awarded |
| L4-B02 | Production pilot not soaked | **Major** | Ops | **Closed (L4-F01)** | Automated gate + Approve With Findings |
| L4-B03 | Single consumer scope (`project_assistant`) | **Major** | AI platform | **Ratified (L4-F02)** | Documented L4 boundary |
| L4-B04 | No bounded graph read API | Moderate | Context Graph | **Deferred (L4-F03)** | Separate program |
| L4-B05 | NOTE entity V_Link gap (B-03) | Moderate | Notes module | Open | Resolver + lifecycle per entity truth table |
| L4-B06 | HR/scheduling adapters missing | Moderate | Module teams | Open | Adapter registration OR explicit exclusion |
| L4-B07 | No operator runbook for pilot flags | Moderate | Ops | **Closed (L4-F01)** | Operational readiness + soak plan |
| L4-B08 | G4 operations partial (CG-6 carryover) | Moderate | Platform | Open | Observability for reconcile diagnostics |
| L4-B09 | G9 consumer coverage partial | Moderate | AI platform | Open | Consumer expansion post-L4 or gate waiver |
| L4-B10 | Domain event invalidation not wired to bridge | Advisory | Platform | Open | Event-triggered bundle refresh design |

**Closed (1A–1C):** L4-B01-partial (bridge), L4-B02-partial (dev validation), B-01/B-02/B-06 from architecture audit.

---

## Level 5 blockers (Foundational Context Infrastructure)

| ID | Blocker | Notes |
|----|---------|-------|
| L5-B01 | No persistent relationship projection layer | Constitutional — may remain inference-only |
| L5-B02 | No cross-tenant graph analytics | By design |
| L5-B03 | Marketplace partner graph conformance untested | Third-party adapter certification |
| L5-B04 | No event-driven active context graph | Deferred per AI_CONTEXT_ASSEMBLY |
| L5-B05 | Semantic/vector discovery | Explicitly out of scope |
| L5-B06 | VLinkSuggestion production funnel | Requires user-accept governance at scale |
| L5-B07 | Unified SC-M4 search convergence | AI parallel paths remain |
| L5-B08 | Graph explorer / hub UI at scale | Depends on L4-B04 read API |

---

## Priority order for closure

1. **L4-B01** — Council L4 certification track (governance)
2. **L4-B02** — Staging soak
3. **L4-B07** — Operator runbook
4. **L4-B03** — Consumer scope decision
5. **L4-B04** — Read API deferral or implementation
6. **L4-B05 / L4-B06** — Module gaps

---

## Explicitly deferred (not L4 blockers)

- Graph database / persistence tables
- Semantic search / embeddings
- Production flag enablement (Phase 1D out of scope)

**Last updated:** 2026-06-23
