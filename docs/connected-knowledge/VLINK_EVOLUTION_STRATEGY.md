# V-Link Evolution Strategy

**Program:** Connected Knowledge Platform — Phase 0A  
**Date:** 2026-06-25  
**Status:** Strategic recommendation — **no V-Link redesign or implementation**

**Authority:** [V_LINK.md](../architecture/V_LINK.md), [memory-bank/vlinkProductContext.md](../../memory-bank/vlinkProductContext.md), [VLINK_PARTICIPATION_ARCHITECTURE.md](../marketplace/VLINK_PARTICIPATION_ARCHITECTURE.md)

---

## 1. Strategic question

Should V-Link remain a **manual linking feature**, or evolve into the **relationship and knowledge governance layer** of a Connected Knowledge Platform?

---

## 2. Verdict

**Evolve — do not replace.**

V-Link is already the platform's **Association class SoR**, AI pipeline source, and user-facing knowledge container. The Connected Knowledge Platform program **extends V-Link's role**; it does not introduce a competing link system.

| Option | Verdict |
|--------|---------|
| Remain manual-only feature | **Rejected** — underuses existing investment |
| Replace with new graph product | **Rejected** — duplicates Context Graph + module SoRs |
| **Evolve into relationship framework + knowledge governance** | **Selected** |
| Merge into Context Graph brand | **Rejected** — V-Link is user-facing; Context Graph is orchestration |

---

## 3. Current state summary

| Dimension | Status |
|-----------|--------|
| **Model** | Hybrid node (container) + edge (`VLinkEntity`) |
| **Scope** | Personal, business, household via `VLinkScope` |
| **Membership** | `VLinkMember` — container visibility only |
| **Attachments** | 8+ entity types with resolver + lifecycle |
| **AI** | Catalog source `vlink`; suggestions require accept |
| **Graph** | `vlinkContextGraphAdapter` in certified Context Graph |
| **Partner** | Blocked — in-process resolver required |
| **Gaps** | Notes/Notebook parity; USER/BUSINESS linkable types; governance UX |

---

## 4. Evolution pillars

### 4.1 Relationship framework (constitutional — largely shipped)

V-Link already implements the **Association** class in [RELATIONSHIP_TAXONOMY.md](../architecture/RELATIONSHIP_TAXONOMY.md).

**Phase 0A completion:** Document V-Link as the **default cross-module association mechanism** — not one linking feature among many.

| Mechanism | Class | V-Link role |
|-----------|-------|-------------|
| V_Link container → entity | Association | **Primary** |
| Todo project → task | Containment | Module — not V-Link |
| NotebookLink | Reference | Module — adapter in graph |
| Drive share | Access grant | Module — not V-Link |

**Do not** expand V-Link to absorb access grants or module containment.

### 4.2 Knowledge layer (extend)

| Capability | Today | Target |
|------------|-------|--------|
| User project hubs | V-Link containers | Same — market as "knowledge hubs" |
| Cross-module neighborhood | Manual links only | Federation API includes native module edges |
| Provenance | `VLinkEntity.source` | Extended metadata (0B) |
| Confidence | Binary (linked or not) | Tiered display for AI-accepted |
| Archive vs trash | Separate lifecycles | Unchanged — constitutional |

V-Link containers become the **user-curated knowledge anchor** — the object users name ("2024 Tax", "Store Opening") while federation shows **full neighborhood**.

### 4.3 Graph interaction model (orchestration — Context Graph)

V-Link does **not** implement graph traversal. Context Graph does.

| Responsibility | Owner |
|----------------|-------|
| Store association edges | V-Link (`VLinkEntity`) |
| Traverse + hydrate neighborhood | Context Graph |
| Inference edges | Retrieval — ephemeral in bundle |
| Dedup precedence | Grounding reconcile |

**Evolution:** Richer `vlinkContextGraphAdapter` inputs — not new V-Link tables for traversal.

### 4.4 AI confirmation workflow (strengthen)

Existing assets:

- `VLinkSuggestion` model (PENDING → ACCEPTED / REJECTED)
- Pipeline exclusion of pending suggestions
- `entityLinking` prefers `persistedVLinks`

**Gaps:**

| Gap | Remediation (Phase 1B) |
|-----|------------------------|
| Retrieval evidence → suggestion | Intent-scoped "link these?" UX |
| Batch review | Governance panel in V-Link hub |
| Provenance on accept | Store retrieval trace id in metadata |
| Reject feedback | Optional — not required for MVP |

**Constitutional line:** AI proposes; user confirms; platform persists. No auto-link from retrieval.

### 4.5 Relationship governance (new product surface)

| Governance action | Mechanism |
|-------------------|-----------|
| Review AI suggestions | V-Link hub + notifications |
| Merge duplicate hubs | Manual — auto-merge is Phase 2+ |
| Archive completed projects | V-Link ARCHIVED state |
| Audit who linked what | `VLinkActivity` + platform activity |
| Force-transfer ownership | Existing admin patterns |

Governance UX is **Phase 1B product work** — architecture is ready.

---

## 5. What V-Link must NOT become

| Anti-pattern | Reason |
|--------------|--------|
| Universal relationship store | Module FKs remain SoR |
| Access control for files | Drive share / PE |
| Tag system | Taxonomy forbids |
| Graph database | Context Graph federates |
| Partner code host | Marketplace delegate only |
| Auto-learning link engine | AI_AUTOMATION_BOUNDARY |

---

## 6. Marketplace evolution

### Current blocker

Resolver runs in-process. Partners cannot implement `*VlinkAccessService`.

### Recommended path

**Model A — V-Link Entity Proxy** (from marketplace architecture):

```
VLinkEntityType: PARTNER_ENTITY
metadata: { moduleId, partnerEntityType, partnerEntityId, delegateVersion }
```

Delegate endpoints: `hydrate`, `accessCheck`, `search`.

| Phase | Partner capability |
|-------|-------------------|
| Today | None |
| 1B | Consume-only deep links (interim) |
| 2A | Full delegate — create + consume edges |
| 2B | Partner entities in federation bundle |

Platform **stores** `VLinkEntity` rows; partner **authorizes** hydrate.

---

## 7. Entity type expansion roadmap

| VLinkEntityType | Priority | Prerequisite |
|-----------------|----------|--------------|
| NOTE / NOTEBOOK page | **P0** | Resolver parity, manifest |
| HR employee_profile | **P1** | `hrVlinkAccessService` + governance |
| scheduling:shift | **P1** | Search provider + resolver |
| USER (reference) | **P2** | Members consolidation — link to person, not grant access |
| BUSINESS (reference) | **P2** | Org context anchor |
| PARTNER_ENTITY | **P2** | Delegate spec |
| Custom types | **P3** | Manifest extension + council |

Do not add enum values without resolver + lifecycle + PE ([PLATFORM_ENTITY_MODEL.md](../architecture/PLATFORM_ENTITY_MODEL.md)).

---

## 8. Overlap resolution with other systems

| System | Relationship | Resolution |
|--------|--------------|------------|
| **Context Graph** | Orchestrator | V-Link = edge SoR; CG = read federation |
| **entityLinking** | Ephemeral merge | Feeds suggestions; never replaces V-Link |
| **AI Retrieval** | Evidence | → suggestion workflow |
| **Todo project** | Containment | Coexist — document when to use which |
| **Notebook** | Meeting workspace | V-Link for cross-module; NotebookLink for internal refs |
| **Dashboard widgets** | Siloed | Future: widget instances as lightweight nodes (optional) |

---

## 9. Success metrics (for Phase 1+)

| Metric | Baseline | Target |
|--------|----------|--------|
| Linkable entity types | 8 | 14+ |
| AI suggestions accepted rate | Unknown | Measure |
| % twin requests using vlink source | Telemetry | Increase with adoption |
| Partner entities in graph | 0 | Delegate pilot |
| Notes/Notebook V_Link parity | Partial | Full |

---

## 10. Phase alignment

| Phase | V-Link work |
|-------|-------------|
| **0A** | This strategy doc ✅ |
| **0B** | Provenance metadata constitution |
| **1A** | Adapter dedup; retrieval → suggestion API spec |
| **1B** | Governance UX; Notes/Notebook parity |
| **2A** | Partner delegate |
| **2B** | Knowledge hub marketing + entity landing integration |

---

## 11. One-sentence strategy

> **V-Link evolves from "where users manually link things" into "where users govern what the platform knows is connected" — while Context Graph federates the full neighborhood and modules keep their native edges.**

---

## 12. References

- [CONNECTED_KNOWLEDGE_STRATEGIC_POSITIONING.md](./CONNECTED_KNOWLEDGE_STRATEGIC_POSITIONING.md)
- [ENTITY_RELATIONSHIP_CATALOG.md](./ENTITY_RELATIONSHIP_CATALOG.md)
- [RELATIONSHIP_FRAMEWORK_INDEX.md](../architecture/RELATIONSHIP_FRAMEWORK_INDEX.md)
