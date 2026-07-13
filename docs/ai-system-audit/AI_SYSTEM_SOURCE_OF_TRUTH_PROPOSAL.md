# AI System Source of Truth Proposal

**Date:** 2026-07-12  
**Status:** **Accepted** — AI Architecture Phase 0 (2026-07-12)  
**Note:** Constitutions remain authoritative for *principles*. This mapping is authoritative for *navigation and analysis ownership*.

---

## Proposed canonical set

| Concern | Canonical document | Code SSOT |
|---------|-------------------|-----------|
| Whole-system understanding (navigation) | `docs/ai-system-audit/README.md` | — |
| Platform AI principles | `docs/architecture/AI_PLATFORM_CONSTITUTION.md` | — |
| Live diagrams / overview | `docs/architecture/AI_PLATFORM_OVERVIEW.md` | twin path |
| Knowledge principles | `docs/ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md` | — |
| Ingress decisions | `docs/ai-knowledge/AI_KNOWLEDGE_DECISION_MODEL.md` | distributed stores |
| Knowledge transitions | `docs/ai-knowledge/KNOWLEDGE_TRANSITION_MODEL.md` | store fields |
| Knowledge composition runtime | `docs/ai-knowledge/AI_KNOWLEDGE_ENGINE_SPEC.md` | `server/src/knowledge/` |
| Attachments / vision | `docs/ai/ARCHITECTURE.md` + `PROVIDERS.md` | Core + providers |
| AI retrieval | `docs/ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md` | `server/src/ai/retrieval/` |
| Routes | `docs/architecture/AI_CANONICAL_ROUTE_MAP.md` | `server/src/index.ts` mounts |
| Conversation reasoning | `docs/architecture/AI_CONVERSATION_REASONING.md` | `server/src/ai/conversation/` |
| Provider routing (current) | This audit Provider doc + `providerRouting.ts` | providers/* |
| Provider routing (target) | `AI_MODEL_ROUTING_TARGET_ARCHITECTURE.md` | (future) |
| Agent navigation tree | `docs/architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md` | — |

---

## Remain authoritative

- `docs/VSSYL_SOURCE_OF_TRUTH.md`  
- AI Platform Constitution + Boundary Model + Operation Matrix  
- AI Knowledge Constitution + Decision Model  
- Search Constitution (for search domain)  
- Module interoperability / platform standards  

---

## Historical / redirect candidates

| Document | Disposition |
|----------|-------------|
| `docs/ai-knowledge/deep-dive/*` (2026-07-05) | **Historical deep dive** — keep; banner: prefer `docs/ai-system-audit/` for whole-system nav; still useful lifecycle detail |
| `docs/architecture/audits/AI_LEGACY_DUPLICATION_REGISTER.md` | Historical Wave 0 — still useful; cross-link this audit redundancy register |
| Memory Bank AI session summaries | Historical product notes — not architecture SoT |
| Plans under `docs/plans/AI_MODEL_MANAGEMENT.md` | Likely scaffold — verify before acting |
| Superseded global search memory-bank notes | Already flagged in navigation guide |

---

## Update rules

1. **Code wins** for “what runs.”  
2. **Constitution wins** for “what must be true.”  
3. When code and constitution disagree: **stop** and reconcile before shipping.  
4. New architecture docs must follow `ARCHITECTURE_DOCUMENT_STANDARD.md`.  
5. After major AI changes: update Operation Matrix / certification ledger as required; update this audit’s findings or supersede with dated revision.  
6. Do not duplicate long lifecycle prose in Memory Bank — link here or to architecture docs.  

---

## Ownership rules

| Role | Owns |
|------|------|
| AI Platform eng | Twin, providers, pipeline, orchestrator |
| Module eng | Context providers, AI action services, SoR |
| Knowledge program | Decision Model compliance, composition eligibility |
| Admin portal eng | Pipeline operator UX |
| Product | Surface naming, autonomy UX honesty, Notebook exemption |

---

## Suggested Navigation Guide patch (Phase 0)

Under “AI work”, add:

```
Whole-system audit (2026-07-12) → docs/ai-system-audit/README.md
```

Keep constitutional docs first for change tasks; use audit for understanding and simplification sequencing.
