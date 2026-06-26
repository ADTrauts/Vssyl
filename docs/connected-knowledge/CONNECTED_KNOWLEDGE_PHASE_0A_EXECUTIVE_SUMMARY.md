# Connected Knowledge Platform — Phase 0A Executive Summary

**Program:** Connected Knowledge Platform — Reality Assessment & Strategic Architecture  
**Date:** 2026-06-25  
**Status:** Discovery only — **no implementation, no schema changes, no V-Link redesign, no AI reasoning changes**

**Authority:** Post-completion of Platform Kernel, Unified Search, AI Retrieval, Context Graph, Marketplace Partner Runtime, Platform Controller, and Platform Adoption programs. [PLATFORM_PORTFOLIO_REFRESH_2026.md](../platform-portfolio/PLATFORM_PORTFOLIO_REFRESH_2026.md)

**Sibling deliverables:** [CONNECTED_KNOWLEDGE_REALITY_ASSESSMENT.md](./CONNECTED_KNOWLEDGE_REALITY_ASSESSMENT.md) · [ENTITY_RELATIONSHIP_CATALOG.md](./ENTITY_RELATIONSHIP_CATALOG.md) · [CONNECTED_KNOWLEDGE_ARCHITECTURE_AUDIT.md](./CONNECTED_KNOWLEDGE_ARCHITECTURE_AUDIT.md) · [AI_KNOWLEDGE_MODEL_ASSESSMENT.md](./AI_KNOWLEDGE_MODEL_ASSESSMENT.md) · [VLINK_EVOLUTION_STRATEGY.md](./VLINK_EVOLUTION_STRATEGY.md) · [CONNECTED_KNOWLEDGE_STRATEGIC_POSITIONING.md](./CONNECTED_KNOWLEDGE_STRATEGIC_POSITIONING.md)

---

## 1. Strategic question

Vssyl has crossed from **module collection** to **application platform**. Seven foundational capabilities are certified and adoption is underway. The next evolution is not another platform capability — it is enabling the platform to **understand relationships among everything it manages**.

This assessment answers: **How does Vssyl evolve from an application platform into a Connected Knowledge Platform where entities—not modules—become the primary organizational model?**

---

## 2. Bottom line

**Vssyl already contains the seeds of a Connected Knowledge Platform**, but knowledge is **fragmented across consumption paths**, not missing as infrastructure.

| Finding | Implication |
|---------|-------------|
| Relationships exist in **many systems of record** (module FKs, V_Link, shares, roster) | Federation is correct; a universal graph database is not |
| **V_Link** is the cross-module association substrate — not a tagging feature | Evolve V_Link into the relationship governance layer; do not replace it |
| **Context Graph** (L3 certified) orchestrates federation for AI | Extend composition; do not duplicate edge storage |
| **AI Retrieval** discovers relatedness at query time | Evidence is not knowledge until user-confirmed or module-persisted |
| **Platform Adoption debt** (ACT-R1, search gaps) blocks trustworthy knowledge reads | Knowledge layer quality depends on adoption completion |
| Users still navigate **by module** | Entity-centric UX is a product evolution, not yet an architecture gap |

**Recommended posture:** Pursue **Connected Knowledge Platform** as a **Tier 0 constitutional program** — federated entity graph with explicit provenance, confidence, and lifecycle — building on Context Graph and Relationship Framework, not parallel to them.

---

## 3. Knowledge maturity scorecard

| Dimension | Current (0–5) | Target | Primary blocker |
|-----------|:-------------:|:------:|-----------------|
| Entity identity | **4** | 5 | Notebook/Notes alias drift; partner entities absent |
| Explicit relationships | **3.5** | 5 | Module-local SoRs; incomplete V_Link coverage |
| Cross-module federation | **3** | 5 | Parallel AI/search/graph paths; retrieval bridge partial |
| Relationship provenance | **2.5** | 5 | Inference undisclosed inconsistently; no confidence model |
| AI knowledge vs retrieval | **2** | 4 | Evidence assembly ≠ understanding; no causal model |
| Entity-centric UX | **1.5** | 4 | Business Workspace routes modules; no universal entity hub |
| Partner knowledge contribution | **1** | 3 | V_Link resolver in-process only |
| Temporal/history as knowledge | **2.5** | 4 | Activity strong on write; read path migration incomplete |

**Composite knowledge readiness: 2.6 / 5** — strong foundations, uneven unification.

---

## 4. Component roles (one-line each)

| Component | Role in Connected Knowledge Platform |
|-----------|--------------------------------------|
| **V-Link** | Cross-module **association SoR** and user-curated knowledge containers |
| **Context Graph** | **Federation orchestrator** — bundles entities + edges for consumers |
| **Platform Kernel** | **Temporal signal** (activity) + invalidation (domain events) |
| **Unified Search** | **Discovery input** — candidate entities and inferred relatedness |
| **AI Retrieval** | **Query-time evidence** — ephemeral relationship candidates |
| **Platform Entities** | **Node identity contract** — `(moduleId, entityType, entityId)` |
| **Activity System** | **Audit trail** of actions — not relationship SoR |
| **Marketplace** | **Partner entity/edge delegate** — blocked today; architecture defined |
| **AI Memory** | **User-stated facts** — adjacent to graph, not edges |
| **Notifications** | **Delivery** — not knowledge |
| **Dashboard** | **Composition shell** — adoption gaps limit knowledge surfacing |
| **Business Workspace** | **Module router** — must evolve to entity landing, not replace graph |

---

## 5. What separates retrieval from knowledge

| Capability | Today | Connected Knowledge target |
|------------|-------|---------------------------|
| Find related files | Search + retrieval evidence | Same, plus **persisted edge with provenance** when user confirms |
| "What is connected to Project X?" | V_Link container + module lists | **Unified entity neighborhood** from federation bundle |
| "Why did this happen?" | Activity log + module context | **Causal narrative** (Phase 2+ — not in scope now) |
| Cross-module project view | Reconstructed per AI turn | **Stable project entity** or V_Link hub as anchor |
| Partner module entities | Not in graph | **Delegate hydrate** via marketplace contract |

**Genuine knowledge understanding** requires: persisted relationships with provenance, confidence tiers, permission-respecting federation, and user governance over AI-inferred edges. Vssyl has **retrieval + partial persistence**; it does not yet have **unified knowledge consumption** or **causal reasoning**.

---

## 6. V-Link verdict

**Do not remain a manual linking feature alone.** V-Link should evolve into:

1. **Relationship governance layer** — suggestions, acceptance, provenance (`MANUAL` | `AI_ACCEPTED`)
2. **Knowledge container primitive** — nestable hubs users recognize as "projects" or "topics"
3. **Federation anchor** — primary cross-module edge SoR for Context Graph
4. **AI confirmation workflow** — bridge from ephemeral retrieval to persisted association

V-Link brand and constitutional rules (**membership ≠ access**) remain. Implementation is Phase 1+.

---

## 7. Highest-priority gaps (ranked)

| Rank | Gap | Impact | Depends on |
|------|-----|--------|------------|
| **1** | Unified knowledge read path (graph + retrieval + V_Link dedup) | AI and search tell different "relatedness" stories | Context Graph bridge completion |
| **2** | ACT-R1 activity read migration | History and timeline knowledge untrustworthy | Platform Adoption Wave 1 |
| **3** | Entity catalog completeness (Notes, Notebook, HR, Scheduling in V_Link/search) | Business knowledge invisible | Module adoption |
| **4** | Provenance + confidence model (constitutional) | Users cannot distinguish fact from inference | Connected Knowledge Phase 0B |
| **5** | Partner V_Link delegate | External knowledge siloed | Marketplace Phase 2 |
| **6** | Entity-centric navigation design | Users still think in modules | Product program (out of 0A scope) |

---

## 8. Explicitly out of scope (this phase)

- Graph persistence layer / new Prisma models
- AI reasoning or pipeline implementation changes
- V-Link UI redesign
- Schema migrations
- Certification ledger changes

---

## 9. Recommended next phase (0B preview)

| Workstream | Objective |
|------------|-----------|
| **0B-1 Constitutional charter** | Connected Knowledge Platform definition, ownership, anti-patterns |
| **0B-2 Provenance model** | Edge metadata: `source`, `confidence`, `lifecycle`, `confirmedAt` |
| **0B-3 Consumption convergence** | Single federation contract for AI, Search hints, operator tools |
| **0B-4 Entity catalog lock** | Canonical relationship inventory per entity type |
| **0B-5 Partner delegate spec** | Marketplace entity/relationship contribution without in-process code |

**Do not open Phase 1 implementation** until 0B council review completes.

---

## 10. One-sentence positioning

> **Vssyl becomes a Connected Knowledge Platform when every authorized consumer — AI, search, workspace, and partners — reads the same federated entity neighborhood with explicit provenance, while modules retain ownership of their systems of record.**
