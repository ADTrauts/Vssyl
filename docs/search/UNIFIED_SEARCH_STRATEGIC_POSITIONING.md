# Unified Search — Strategic Positioning

**Program:** Unified Search Capability — Phase 0A Discovery  
**Date:** 2026-06-23  
**Status:** Strategic recommendation — discovery only

---

## 1. Platform Capability framing

Unified Search must be classified as a **Platform Capability** (`unified_search` or `search_capability`), not a product module.

| Attribute | Value |
|-----------|-------|
| **Class** | Platform Capability |
| **User promise** | Find information anywhere in Vssyl |
| **Not** | A workspace module with `moduleId` landing |
| **Peer capabilities** | Platform Analytics, Platform Kernel, Context Graph |
| **Ledger target (future)** | L2 WITH FINDINGS after federation Phase 1 |

---

## 2. Architecture options

### Option A — Search Aggregation Layer

Federates module `SearchProvider` implementations; no central index.

| Pros | Cons |
|------|------|
| Matches current code | Latency stacks; provider gaps visible |
| Honors module SoR | Quality varies per module |
| Lowest migration cost | Substring search limits |

### Option B — Central Search Service

Unified index of platform entities; query one store.

| Pros | Cons |
|------|------|
| Fast global queries | Second store risk; drift from SoR |
| Consistent ranking | Violates federation ADR if writes |
| Marketplace appeal | High build cost; replay/index ops |

### Option C — Hybrid Model (recommended)

**Federated providers (authoritative)** + **optional derived read indexes** (tags, events, acceleration).

| Pros | Cons |
|------|------|
| Matches ratified ADR (2026-06-14) | Two paths to document |
| Module owners retain SoR | Index eventual consistency |
| Tag index precedent exists | Phase 2+ index governance |
| AI can share provider contracts | More architecture docs |

---

## 3. Formal recommendation

### **Option C — Hybrid**

**Primary path:** Federation via module `SearchProvider` + platform providers (V_Link, member, dashboard).

**Secondary path (optional, charter-gated):** Derived indexes — tag facet (`tagIndexService`), domain-event search index (replace stub), relationship read adapters (T5).

**Justification:**

1. [SEARCH_ARCHITECTURE_DECISION_RECORD.md](../architecture/SEARCH_ARCHITECTURE_DECISION_RECORD.md) already **accepted** federated orchestration.  
2. Runtime already implements **Option A skeleton** — throwing it away wastes L3 visibility work.  
3. Central-only **Option B** conflicts with relationship ownership matrix and Platform Kernel dual-write honesty.  
4. Tag index + DE stub prove **derived readers** are planned as **accelerators**, not SoR.  
5. Analytics and Kernel certifications show Platform Capabilities succeed with **honest partial federation** before L3 infrastructure.

---

## 4. Strategic role questions

### 1. Core Platform Capability?

**Yes.** Search is cross-cutting discovery infrastructure. Charter as **Unified Search Platform Capability** with G1–G9 evaluation path.

### 2. Required service for future modules?

**Yes.** Extend module certification checklist:

- `capabilities.search: true` ⇒ registered `SearchProvider` OR documented exemption  
- Visibility service owns queries  
- Operation matrix row **C** before manifest claim  

### 3. Dependency of AI retrieval layer?

**Yes — shared contracts, not duplicate pipelines.**

AI grounding (`pipelineGroundingRetrieval`, context providers) should **call the same visibility-bounded search delegates** where entity discovery is needed. Today AI uses parallel paths (`searchTasksForAI`, orchestrator) — convergence reduces trust drift.

### 4. Dependency of Marketplace ecosystem?

**Yes.** `SearchProvider` interface in `shared/types/search.ts` is the partner contract. Phase 1 must add **registry loader** for third-party manifests (align `third-party-modules.mdc`).

### 5. Foundation for Context Graph / Relationship Framework?

**Yes.**

| Framework piece | Search role |
|-----------------|-------------|
| Tag Index | T4 facet reader in hybrid model |
| Relationship adapters | T5 future global mode |
| V_Link search | Already separated — keep |
| Federation contract Pattern E | Orchestrator merge model |

---

## 5. Positioning vs certified neighbors

| Capability | Relationship to Search |
|------------|------------------------|
| **Platform Kernel** | Activity/events feed discovery — **not** user search; optional future facet |
| **Analytics** | Metrics not search; may consume search success signals |
| **Context Graph** | Tag/relationship **read** federation — search consumer |
| **Dashboard** | Primary UX host for global bar |
| **Policy Engine** | Must gate `search:read` |

---

## 6. What not to do in Phase 1

- Build Elasticsearch/BigQuery warehouse for search  
- Replace module visibility with index-only authorization  
- Certify search before provider gap closure  
- Re-open Relationship Framework ADR (federation stands)  
- Conflate admin operator search with tenant search  

---

## 7. Success definition (program level)

| Milestone | Outcome |
|-----------|---------|
| Phase 0A | This discovery suite ✅ |
| Phase 0B | Capability charter + ownership model |
| Phase 1 | Federation completeness + PE + capability service |
| Phase 2 | Optional derived indexes (tag wire, DE index charter) |
| L2 evaluation | Platform Capability L2 CwF candidacy |

---

**Last updated:** 2026-06-23
