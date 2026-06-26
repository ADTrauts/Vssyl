# Connected Knowledge Platform — Phase 0B Executive Summary

**Program:** Connected Knowledge Platform — Knowledge Constitution & Trust Model  
**Date:** 2026-06-25  
**Status:** Constitutional governance complete — **no implementation, no schema changes, no UI**

**Prior phase:** [CONNECTED_KNOWLEDGE_PHASE_0A_EXECUTIVE_SUMMARY.md](./CONNECTED_KNOWLEDGE_PHASE_0A_EXECUTIVE_SUMMARY.md)

**Deliverables:** [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md) · [KNOWLEDGE_TRUST_MODEL.md](./KNOWLEDGE_TRUST_MODEL.md) · [KNOWLEDGE_PROVENANCE_STANDARD.md](./KNOWLEDGE_PROVENANCE_STANDARD.md) · [KNOWLEDGE_CONFIDENCE_MODEL.md](./KNOWLEDGE_CONFIDENCE_MODEL.md) · [KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md](./KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md) · [KNOWLEDGE_RELATIONSHIP_LIFECYCLE.md](./KNOWLEDGE_RELATIONSHIP_LIFECYCLE.md) · [PARTNER_KNOWLEDGE_PARTICIPATION.md](./PARTNER_KNOWLEDGE_PARTICIPATION.md)

---

## 1. Strategic question

Phase 0A concluded: **the gap is unified knowledge consumption with explicit provenance and confidence** — not graph persistence.

Phase 0B answers: **What are the constitutional rules for knowledge itself** — how truth, evidence, inference, and suggestion are distinguished and governed?

---

## 2. Bottom line

Vssyl now has a **Knowledge Constitution** that:

1. Defines a **seven-level knowledge hierarchy** (L0 System Truth → L6 Transient Retrieval Evidence)
2. Mandates **provenance metadata** on every federated edge
3. Separates **confidence from authority** — confidence never grants permission
4. Assigns **Context Graph as single bundle composer** for consumption unity
5. Defines **lifecycle promotion** from evidence → suggestion → confirmed knowledge
6. Establishes **partner delegate rules** for L1 delegated truth

**No runtime changes in this phase.** Phase 1 may begin after council approval of this constitution.

---

## 3. Knowledge hierarchy (summary)

| Level | Name | Persisted? | Consumer use |
|:-----:|------|:----------:|--------------|
| **L0** | System Truth | ✅ | Platform invariants, PE |
| **L1** | Delegated SoR | Partner | Partner entities via delegate |
| **L2** | Explicit User Knowledge | ✅ | Authoritative — module FK, manual V_Link |
| **L3** | Confirmed AI Knowledge | ✅ | Governed — accepted suggestions, explicit memory |
| **L4** | Inferred Knowledge | Request | AI grounding with disclosure |
| **L5** | Suggested Knowledge | Pending | Governance UI only — not in bundle |
| **L6** | Transient Retrieval Evidence | Query | AI/search with disclosure |

**Precedence:** Lower L number always wins on conflict.

---

## 4. Trust model (summary)

Trust = **authorization (PE) + tier authority + provenance + freshness**.

| Dimension | Rule |
|-----------|------|
| Authority | Tier L0–L6 |
| Permission | Policy Engine — independent of confidence |
| Conflict | Tier > timestamp > module over V_Link for native classes |
| Inference | Never wins over persistence |
| Partner | L1 valid only on successful delegate |

---

## 5. Provenance (summary)

Mandatory on every federation edge:

- `tier`, `origin`, `assertedAt`, `verifiedAt`, `actor`, `sourceSystem`
- Optional: `relationshipSource`, `verificationHistory`, `modelId` (AI), `partnerModuleId`

Phase 1 maps as-built fields (`VLinkEntity.source`, retrieval traces) to this standard at compose time.

---

## 6. Confidence (summary)

Four tiers: **C1 Certain**, **C2 Established**, **C3 Likely**, **C4 Tentative**.

| Rule | Detail |
|------|--------|
| Assigner | Federation composer (not consumers) |
| Purpose | UX labeling and ranking only |
| Forbidden | Confidence as permission; numeric "% confident" in API |
| Confirmation | Promotes tier → confidence follows |

---

## 7. Consumption (summary)

| Consumer | L0–L3 | L4 | L5 | L6 |
|----------|:-----:|:--:|:--:|:--:|
| AI Twin | ✅ fact | ✅ disclose | ❌ | ✅ disclose |
| Context Graph | compose | compose | ❌ | input |
| Search | entities | ❌ | ❌ | hints |
| Dashboard | ✅ | ❌ | ❌ | ❌ |
| V_Link UI | ✅ | ❌ | ✅ review | ❌ |
| Notifications | events | — | alert | — |

**Single composer:** Context Graph produces `KnowledgeBundle` for all consumers.

---

## 8. Lifecycle (summary)

```
L6 evidence → L5 suggested → L3 confirmed (user accept)
            → L2 explicit (manual link)
L4 inference → L5 or destroyed at request end
L1 partner → active ↔ degraded ↔ revoked
```

**KL-1:** No automatic L6 → L2 promotion.

---

## 9. Partner participation (summary)

- **L1** delegated truth via `knowledgeDelegate` manifest
- Platform stores **association edges** only
- hydrate + accessCheck on every display
- Revocation via webhook or cert suspension
- No in-process partner code

---

## 10. Constitutional principles (top 5)

| ID | Principle |
|----|-----------|
| KC-1 | Module SoR supremacy — no universal knowledge table |
| KC-2 | No silent promotion from evidence |
| KC-3 | Provenance mandatory |
| KC-4 | Confidence ≠ authority |
| KC-9 | Consumption unity via single composer |

Full list: [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md)

---

## 11. Phase 1 readiness gate

| Gate | Status |
|------|--------|
| 0B constitution council review | ⏳ Pending |
| KnowledgeBundle TypeScript spec | ✅ In consumption architecture |
| Context Graph extension design | ✅ Composer role defined |
| Schema migration | ❌ Not required for Phase 1 start |
| Platform Adoption ACT-R1 | ⚠️ Parallel — improves history tier trust |

**Authorize Phase 1A** (consumption convergence) after council sign-off.

---

## 12. Explicitly out of scope (0B)

- V-Link redesign
- Context Graph reimplementation
- Graph persistence / new tables
- AI workflow implementation
- UI / governance screens

---

## 13. Recommended Phase 1 workstreams

| ID | Workstream | Deliverable |
|----|------------|-------------|
| **1A** | Composer provenance mapping | Map as-built → KnowledgeProvenance at compose |
| **1A** | Retrieval → composer channel | Retire parallel twin path |
| **1B** | Neighborhood API spec + routes | L2–L3 only |
| **1B** | Suggestion governance API | L5 queue |
| **2A** | Partner delegate pilot | One marketplace module |

---

## 14. One-sentence outcome

> **Data becomes relationships; relationships become knowledge when they carry tier, provenance, and confidence through a single federation composer — and evidence only becomes knowledge when users or modules govern the promotion.**

---

## 15. Document index

| Document | Role |
|----------|------|
| [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md) | Master charter |
| [KNOWLEDGE_TRUST_MODEL.md](./KNOWLEDGE_TRUST_MODEL.md) | Trust and conflict |
| [KNOWLEDGE_PROVENANCE_STANDARD.md](./KNOWLEDGE_PROVENANCE_STANDARD.md) | Metadata standard |
| [KNOWLEDGE_CONFIDENCE_MODEL.md](./KNOWLEDGE_CONFIDENCE_MODEL.md) | Confidence rules |
| [KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md](./KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md) | Consumer matrix |
| [KNOWLEDGE_RELATIONSHIP_LIFECYCLE.md](./KNOWLEDGE_RELATIONSHIP_LIFECYCLE.md) | State transitions |
| [PARTNER_KNOWLEDGE_PARTICIPATION.md](./PARTNER_KNOWLEDGE_PARTICIPATION.md) | Marketplace rules |
