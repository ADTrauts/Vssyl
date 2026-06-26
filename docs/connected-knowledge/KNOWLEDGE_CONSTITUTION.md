# Knowledge Constitution

**Program:** Connected Knowledge Platform — Phase 0B  
**Date:** 2026-06-25  
**Status:** Constitutional governance — **no implementation, no schema changes**

**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md); [RELATIONSHIP_TAXONOMY.md](../architecture/RELATIONSHIP_TAXONOMY.md); Phase 0A [CONNECTED_KNOWLEDGE_PHASE_0A_EXECUTIVE_SUMMARY.md](./CONNECTED_KNOWLEDGE_PHASE_0A_EXECUTIVE_SUMMARY.md)

**Sibling deliverables:** [KNOWLEDGE_TRUST_MODEL.md](./KNOWLEDGE_TRUST_MODEL.md) · [KNOWLEDGE_PROVENANCE_STANDARD.md](./KNOWLEDGE_PROVENANCE_STANDARD.md) · [KNOWLEDGE_CONFIDENCE_MODEL.md](./KNOWLEDGE_CONFIDENCE_MODEL.md) · [KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md](./KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md) · [KNOWLEDGE_RELATIONSHIP_LIFECYCLE.md](./KNOWLEDGE_RELATIONSHIP_LIFECYCLE.md) · [PARTNER_KNOWLEDGE_PARTICIPATION.md](./PARTNER_KNOWLEDGE_PARTICIPATION.md)

---

## 1. Purpose

This constitution defines **what knowledge is** inside Vssyl, how it differs from data and evidence, and the non-negotiable rules every platform capability must follow when representing, trusting, or consuming knowledge.

**Supersedes nothing.** It extends the Relationship Framework and Context Graph charters for the knowledge layer.

---

## 2. Definitions

| Term | Definition |
|------|------------|
| **Data** | Module-owned records in systems of record (Prisma rows, partner payloads) |
| **Relationship** | Typed connection between entities or principals per Relationship Taxonomy |
| **Knowledge** | A **permission-stable, provenance-bearing** representation of entities and relationships that authorized consumers may rely on across requests |
| **Evidence** | Ephemeral, query-scoped signals used for discovery or grounding — **not knowledge** until promoted per lifecycle rules |
| **Federation** | Read-time composition of knowledge from multiple SoRs without a universal store |
| **Node** | Entity identified by `(moduleId, entityType, entityId)` or container key `vlink:vlink:{id}` |

### What is knowledge

Knowledge includes:

1. **Module-native relationships** persisted in module schemas (ownership, containment, assignment, access grants, operational links)
2. **V_Link associations** persisted in `VLinkEntity` after link or accepted suggestion
3. **User memory facts** (`UserMemoryFact`) — user-governed semantic statements
4. **Delegated partner assertions** validated through marketplace delegate and stored as platform edges with partner provenance

### What is not knowledge

| Artifact | Classification |
|----------|----------------|
| Search index rows | Derived discovery — re-hydrate required |
| AI Retrieval evidence | Transient retrieval evidence |
| `entityLinking` inference | Inferred knowledge (ephemeral) |
| `VLinkSuggestion` PENDING | Suggested knowledge |
| Activity log entries | Temporal audit — not relationship SoR |
| Domain event payloads | Invalidation signals |
| Notifications | Delivery artifacts |
| Tags | Metadata on nodes — not edges |

---

## 3. Constitutional principles

| ID | Principle | Rule |
|----|-----------|------|
| **KC-1** | **Module SoR supremacy** | Modules own data; platform federates reads. No universal knowledge table. |
| **KC-2** | **No silent promotion** | Evidence and inference never become knowledge without lifecycle transition (user confirm, module persist, or delegate verify). |
| **KC-3** | **Provenance is mandatory** | Every knowledge edge or fact exposed in a federation bundle carries provenance per [KNOWLEDGE_PROVENANCE_STANDARD.md](./KNOWLEDGE_PROVENANCE_STANDARD.md). |
| **KC-4** | **Confidence ≠ authority** | Confidence describes epistemic weight for UX and ranking — never permission or SoR precedence alone. See [KNOWLEDGE_CONFIDENCE_MODEL.md](./KNOWLEDGE_CONFIDENCE_MODEL.md). |
| **KC-5** | **Membership ≠ access** | V_Link and container membership never grant attachment content access. Unchanged from Relationship Framework. |
| **KC-6** | **AI reads; modules authorize** | All knowledge hydration passes Policy Engine and module visibility services. |
| **KC-7** | **Precedence is fixed** | When sources conflict, hierarchy in §4 governs — consumers do not invent local precedence. |
| **KC-8** | **Partner delegate only** | Partner knowledge enters through certified delegate — no in-process partner SoR. |
| **KC-9** | **Consumption unity** | All consumers use the same knowledge tier rules in [KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md](./KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md). |
| **KC-10** | **Tags are not knowledge edges** | Tags remain module-local metadata per taxonomy. |

---

## 4. Knowledge hierarchy

Authoritative levels (highest precedence first). Full trust semantics: [KNOWLEDGE_TRUST_MODEL.md](./KNOWLEDGE_TRUST_MODEL.md).

| Level | Name | Description | Persistence | Example |
|:-----:|------|-------------|-------------|---------|
| **L0** | **System Truth** | Platform invariants and registry contracts | Platform boot | Entity descriptor registry; PE deny wins |
| **L1** | **Delegated Source of Truth** | Partner module authoritative records via delegate | Partner SoR | Partner CRM deal validated on hydrate |
| **L2** | **Explicit User Knowledge** | User or module operator created without AI | Module / V_Link SoR | Manual `VLinkEntity`; `Task.projectId` |
| **L3** | **Confirmed AI Knowledge** | User accepted AI suggestion or explicit AI-applied fact with confirmation | V_Link / UserMemoryFact | `VLinkEntity` source `AI_SUGGESTED` + accept |
| **L4** | **Inferred Knowledge** | Ephemeral cross-module synthesis for current request | Request scope | `entityLinking` merge |
| **L5** | **Suggested Knowledge** | AI or system proposal awaiting governance | `VLinkSuggestion` PENDING | "Link these files?" |
| **L6** | **Transient Retrieval Evidence** | Search/retrieval hits for grounding | Per query | `AIRetrievalEvidence` |

**Precedence rule:** Higher level (lower number) **always wins** on conflict for the same `(from, to, relationshipClass)` assertion. L4–L6 must never be displayed or synthesized as L2–L3 without lifecycle promotion.

### Adjacent layers (not in hierarchy)

| Layer | Role |
|-------|------|
| **Activity / audit** | Proves actions occurred — supports verification history, not edge truth |
| **Analytics** | Derived metrics — never knowledge SoR |
| **Notifications** | Alerts about knowledge changes — not knowledge |

---

## 5. Knowledge vs relationship vs entity

```
Entity (node)          →  exists in module SoR or V_Link container
Relationship (edge)    →  typed connection per taxonomy
Knowledge (federated)  →  entity + relationship + provenance + confidence + authorized view
```

A relationship becomes **knowledge** when:

1. It is persisted in an authorized SoR (module, V_Link, UserMemoryFact, partner edge), **and**
2. It is hydrated through federation with complete provenance metadata, **and**
3. The requesting principal is authorized to see it

---

## 6. Ownership model

| Knowledge class | Owner | Mutator |
|-----------------|-------|---------|
| Module-native edges | Module team | Module services only |
| V_Link associations | Platform (vlink) | `vlinkService` + PE |
| User memory facts | User (tenant-scoped) | `userMemoryFactService` |
| Federation bundle | Context Graph orchestrator | Read-only composition |
| Inference / evidence | None | Ephemeral producers |
| Partner edges | Partner SoR + platform edge store | Partner via delegate; platform stores association |

---

## 7. AI contribution rules

| AI may | AI may not |
|--------|------------|
| Propose suggestions (`VLinkSuggestion`) | Persist V_Link without user accept |
| Produce inference for grounding (disclosed) | Override module SoR or persisted V_Link |
| Create UserMemoryFact when user explicitly saves | Auto-create facts from retrieval |
| Rank evidence by relevance | Assign authority via confidence alone |
| Feed retrieval evidence to lifecycle | Emit synthetic domain events for inference |

Aligns with [AI_AUTOMATION_BOUNDARY.md](../architecture/AI_AUTOMATION_BOUNDARY.md).

---

## 8. User confirmation

User confirmation is the **primary promotion path** from L5/L6 → L3/L2.

| Action | Effect |
|--------|--------|
| Accept `VLinkSuggestion` | L5 → L3 (`VLinkEntity` with AI provenance) |
| Manual link | L6/L4 → L2 (direct) |
| Reject suggestion | L5 → discarded; no knowledge created |
| Save memory fact | User statement → L3 explicit user knowledge |
| Revoke / unlink | Knowledge → archived or removed per lifecycle |

Confirmation must record: `confirmedAt`, `confirmedById`, `confirmationMethod` — see provenance standard.

---

## 9. Anti-patterns (forbidden)

| Anti-pattern | Violation |
|--------------|-----------|
| Universal `knowledge` or `relationships` table | KC-1 |
| Auto-link from retrieval hit | KC-2 |
| Confidence replaces PE check | KC-4, KC-6 |
| Pending suggestion in federation bundle as solid edge | KC-2 |
| Activity log as edge SoR | Definitions §2 |
| Partner in-process Prisma | KC-8 |
| Consumer-specific precedence | KC-7, KC-9 |
| "AI knows" marketing without provenance | KC-3 |

---

## 10. Governance

| Change type | Approver |
|-------------|----------|
| New knowledge tier | Architecture council + Connected Knowledge program |
| Provenance field addition | Platform team + this constitution amendment |
| Taxonomy class for knowledge | Relationship Framework governance |
| Partner delegate contract | Marketplace + Connected Knowledge |
| Consumer exemption | **Not permitted** — council only |

---

## 11. Phase 1 readiness gate

Phase 1 implementation may begin when:

1. This constitution and Phase 0B deliverables are council-approved
2. Context Graph bundle descriptor extended **on paper** with provenance/confidence slots (no schema yet — TypeScript interface spec in consumption architecture)
3. No open conflicts with Relationship Taxonomy or AI_AUTOMATION_BOUNDARY

---

## 12. References

- [CONNECTED_KNOWLEDGE_STRATEGIC_POSITIONING.md](./CONNECTED_KNOWLEDGE_STRATEGIC_POSITIONING.md)
- [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md)
- [CONTEXT_GRAPH_FEDERATION_CONTRACT.md](../context-graph/CONTEXT_GRAPH_FEDERATION_CONTRACT.md)
