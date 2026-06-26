# Knowledge Confidence Model

**Program:** Connected Knowledge Platform — Phase 0B  
**Date:** 2026-06-25  
**Status:** Constitutional confidence semantics — **no implementation**

**Authority:** [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md) · [KNOWLEDGE_TRUST_MODEL.md](./KNOWLEDGE_TRUST_MODEL.md)

---

## 1. Purpose

Define platform-wide **confidence** rules for knowledge presentation, ranking, and AI synthesis.

**Constitutional rule (KC-4):** Confidence describes **epistemic weight for UX and ranking**. It **never** implies authority, permission, or SoR precedence.

Authority is determined solely by the **knowledge hierarchy tier** (L0–L6).

---

## 2. Confidence vs trust vs authority

| Concept | Answers | Can grant access? |
|---------|---------|:-----------------:|
| **Authority (tier)** | Which source wins? | Indirectly — via SoR + PE |
| **Trust** | May consumer rely on this? | Via PE only |
| **Confidence** | How strongly to present / rank? | **Never** |

```
Effective visibility = PE authorized
Display weight      = f(confidence, tier) for ordering and labeling only
Conflict winner     = tier (authority), not confidence
```

---

## 3. Confidence tiers

Platform-wide enum — **four values only** (no numeric scores in user-facing contract):

| Tier | Label | Meaning | Typical knowledge tier |
|------|-------|---------|------------------------|
| **C1** | **Certain** | Persisted, user- or module-authored, no active conflict | L0–L3 |
| **C2** | **Established** | Persisted module/V_Link; minor freshness lag possible | L2 |
| **C3** | **Likely** | Strong ephemeral signal or learned memory pending confirm | L4, some L6 |
| **C4** | **Tentative** | Weak inference, single retrieval hit, unverified delegate | L6, degraded L1 |

### UI disclosure mapping (normative)

| Confidence | User-facing badge (example) |
|------------|----------------------------|
| C1 | (none) or "Confirmed" for L3 AI |
| C2 | (none) for routine module facts |
| C3 | "Suggested" / "Inferred" |
| C4 | "Found in search" / "Unverified" |

---

## 4. Who assigns confidence

| Source | Assigner | Rule |
|--------|----------|------|
| Module-native edge | **Federation composer** | Auto C1 or C2 from tier + freshness |
| V_Link manual | Federation composer | C1 |
| V_Link AI accepted | Federation composer | C1 with "Confirmed" disclosure |
| UserMemoryFact explicit | Federation composer | C1 |
| UserMemoryFact learned | Federation composer | C3 until user edits → C1 |
| entityLinking | Federation composer | C3 |
| AI Retrieval evidence | Retrieval consumer | C3 or C4 by rank position |
| Search discovery | Search adapter | C4 default |
| Partner delegate | Federation composer | C1 on 200; C4 on stale/unverified |
| Pending suggestion | Governance UI only | **Not scored** — not in bundle |

**No consumer may assign confidence locally** except federation composer and designated retrieval/search adapters per [KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md](./KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md).

---

## 5. Default assignment matrix

| origin (provenance) | tier | Default confidence | Notes |
|---------------------|:----:|:------------------:|-------|
| `module_native` | L2 | C1 or C2 | C2 if hydrate cache > SLA |
| `vlink_manual` | L2 | C1 | |
| `vlink_ai_accepted` | L3 | C1 | Show AI confirmed |
| `user_memory_explicit` | L3 | C1 | |
| `user_memory_learned` | L4 | C3 | |
| `partner_delegate` | L1 | C1 | C4 if delegate age > TTL |
| `ai_inference` | L4 | C3 | |
| `retrieval_evidence` | L6 | C3 (top 3), C4 (rest) | By rank |
| `search_discovery` | L6 | C4 | |

---

## 6. How confidence changes

| Event | Confidence transition |
|-------|----------------------|
| User accepts suggestion | N/A in bundle until promoted → C1 |
| User rejects suggestion | Removed |
| User manual link | C1 |
| Delegate revalidation success | C4 → C1 |
| Delegate failure | C1 → C4 (edge hidden or placeholder) |
| Retrieval re-run with same hit | May stay C3/C4 — tier unchanged |
| User edits memory fact to explicit | C3 → C1 |
| Entity trashed | Edge removed — confidence moot |

Confidence **does not** change permission. Trashed entity: PE hides regardless of confidence.

---

## 7. Confirmation effect on confidence

| Before confirmation | After confirmation |
|---------------------|-------------------|
| L5 suggestion | Not in bundle |
| L6 retrieval | L2/L3 edge at C1 |
| L4 inference | Remains L4 C3 unless user persists via V_Link/memory |
| L3 AI memory | C1 with verification event |

**Rule:** Confirmation promotes **tier** first; confidence follows tier defaults.

---

## 8. Conflict resolution

| Situation | Resolution |
|-----------|------------|
| High confidence vs high tier | **Tier wins** — confidence ignored |
| Two L2 edges same class | Not a confidence problem — show both or tier timestamp rule |
| C1 partner vs C1 module contradict | Trust model §5 — module trash / PE |
| Consumer wants to boost C4 to C1 for UX | **Forbidden** |

---

## 9. AI synthesis rules

| Rule | Detail |
|------|--------|
| AI-CONF-1 | Synthesis must not upgrade confidence |
| AI-CONF-2 | C3/C4 sources require linguistic disclosure in twin output |
| AI-CONF-3 | C1 L3 AI edges may be stated as user-confirmed |
| AI-CONF-4 | Never state C4 as fact without qualification |
| AI-CONF-5 | Confidence not passed to LLM as permission signal |

---

## 10. Search ranking interaction

Search may use internal relevance scores **privately**. Exported knowledge hints to federation use **C4** unless retrieval consumer promotes with evidence bundle.

Search rank ≠ confidence.

---

## 11. Relationship traversal

Graph traversal depth limits apply by **tier**, not confidence:

| Max hop tier included | Default |
|-----------------------|---------|
| L0–L3 | Unlimited within policy hop budget |
| L4 | 1 hop from anchor |
| L6 | 0 hop persistence — anchor expansion only |

Low confidence does not justify extra hops.

---

## 12. Forbidden uses of confidence

| Forbidden | Reason |
|-----------|--------|
| Skip PE because C1 | KC-6 |
| Auto-link when C3 | KC-2 |
| Numeric "95% confident" in platform API | Implies authority |
| Partner sets C1 without delegate | Trust model |
| Downgrade tier when C4 | Tier is independent |

---

## 13. Phase 1 interface (spec only)

```typescript
type KnowledgeConfidence = 'C1' | 'C2' | 'C3' | 'C4';

interface KnowledgeEdge {
  from: NodeKey;
  to: NodeKey;
  relationshipClass: string;
  provenance: KnowledgeProvenance;
  confidence: KnowledgeConfidence;
}
```

---

## 14. References

- [KNOWLEDGE_PROVENANCE_STANDARD.md](./KNOWLEDGE_PROVENANCE_STANDARD.md)
- [AI_KNOWLEDGE_MODEL_ASSESSMENT.md](./AI_KNOWLEDGE_MODEL_ASSESSMENT.md)
