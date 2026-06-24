# AI Retrieval Participation — Architecture

**Program:** Marketplace & Module Ecosystem — Phase 1A  
**Date:** 2026-06-23  
**Status:** Architecture recommendation — **no implementation**  
**Authority:** [AI_RETRIEVAL_COMPLIANCE_REQUIREMENTS.md](../ai/retrieval/AI_RETRIEVAL_COMPLIANCE_REQUIREMENTS.md), [AI_RETRIEVAL_CONSTITUTION.md](../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md)

---

## 1. Participation readiness

| Path | Level | Partner today? |
|------|-------|----------------|
| **Query discovery (`discover()`)** | **2 — Architecturally Ready** | ❌ Blocked by Search M-02 |
| **Context provider summaries** | **3 — Partner Ready** | ✅ Via `ModuleAIContextService` |
| **Webhook action executors** | **3 — Partner Ready** | ✅ Via `ActionExecutorRegistry` |
| **Retrieval consumer (module as consumer)** | **1 — First Party Only** | ❌ Consumers are platform intents |
| **Retrieval source exposure** | **2 — Architecturally Ready** | ❌ Requires search delegate |

---

## 2. Current architecture

```
AI Pipeline intent
    → aiRetrievalPipelineHook
    → aiRetrievalCapabilityService.discover()
    → executeGlobalSearch()          ← partner gap
    → mapSearchResultsToEvidence()
    → context patch + diagnostics
```

Parallel (unchanged):
```
ModuleAIContextService.fetchProvider()
    → partner HTTPS context endpoint
    → structured summaries (Tier C / Option B hybrid)
```

**Key files:**
- `server/src/ai/retrieval/aiRetrievalCapabilityService.ts`
- `server/src/ai/retrieval/aiRetrievalEvidenceMapper.ts`
- `server/src/ai/retrieval/aiRetrievalPipelineHook.ts`
- `server/src/ai/services/ModuleAIContextService.ts`

---

## 3. Three participation modes

### Mode A — Retrieval evidence source (via Search)

Partner modules contribute **query-driven evidence** when search delegate returns hits.

| Requirement | Status |
|-------------|--------|
| RC-M1 No direct visibility service calls | ✅ Enforced by architecture |
| RC-M2 Platform adapter contract | **Search delegate IS the adapter** |
| RC-M3 Evidence + diagnostics equivalent | ✅ Mapper handles `SearchResult[]` |
| RC-M4 Marketplace certification gate | Partial — extend for search |

**Dependency:** [SEARCH_PARTICIPATION_ARCHITECTURE.md](./SEARCH_PARTICIPATION_ARCHITECTURE.md) M-02.

Evidence shape (`AIRetrievalEvidence`):
- `sourceModuleId`, `entityType`, `entityId`, `title`, `snippet`
- `permissionsVerified: true` when from platform search path
- `retrievalOrigin: 'unified_search'`

### Mode B — Context provider (existing — partner ready)

Partners expose **structured rollups** independent of search:

| Gate | Requirement |
|------|-------------|
| G1–G2 | Valid `aiContext` + `contextProviders[]` |
| G3 | Webhook executor for writes |
| G6–G7 | Tenant scoping + Test Lab health check |

**Does not** satisfy query-discovery for entities not in provider summaries. **Tier C exempt** per Readiness Matrix.

**Certification:** `moduleContextProviderCertification.ts` + admin review.

### Mode C — Retrieval consumer (module drives discovery)

A partner module **cannot** become a retrieval consumer today. Consumers are platform-defined intents:

- `planning`, `workflow_action`, `business_operations`, `local_discovery`, `project_assistant`

Registered in `aiRetrievalConsumerContract.ts`.

**Future (optional):** Marketplace modules declare `retrievalConsumer` intent — platform reviews and wires to adapter. **Not recommended for Phase 1B** — high governance risk.

---

## 4. Can partners contribute retrieval evidence?

| Today | After Search M-02 |
|-------|-------------------|
| ❌ No search hits → no evidence | ✅ Search hits → `AIRetrievalEvidence` |
| ✅ Context providers → twin summaries (not evidence path) | Same |

**Context Graph bridge:** Partner evidence eligible for **inference-only** bundle enrichment when `CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED=true` — same rules as first-party (provenance `inference`, min confidence 0.2, no SoR override).

---

## 5. Required contracts

### 5.1 Search-backed evidence (primary)

Inherits search delegate contract entirely. No separate retrieval endpoint required if search delegate ships.

### 5.2 Optional: dedicated retrieval delegate (Phase 2+)

For modules needing discovery **without** global search bar participation:

```json
{
  "retrievalDelegate": {
    "url": "https://partner.example.com/vssyl/retrieval/discover",
    "version": "1",
    "intents": ["business_operations"],
    "maxEvidence": 10
  }
}
```

Platform calls only when consumer intent matches. Response: `AIRetrievalEvidence[]` + diagnostics.

**Defer** until search delegate proven — avoids duplicate contracts.

### 5.3 Context provider (existing)

See [`AI_CONTEXT_PROVIDER_API.md`](../guides/AI_CONTEXT_PROVIDER_API.md).

---

## 6. Governance requirements

| # | Rule |
|---|------|
| **RG-01** | Partners never call `executeGlobalSearch` or visibility services directly |
| **RG-02** | Evidence must map through `aiRetrievalEvidenceMapper` — no raw injection |
| **RG-03** | `permissionsVerified: false` evidence excluded from graph bridge |
| **RG-04** | Fabricated evidence = P0 security (block certification) |
| **RG-05** | Feature flags per consumer intent apply to partner evidence equally |
| **RG-06** | Diagnostics must attribute `retrievalSourceCounts` by partner moduleId |
| **RG-07** | Context providers remain additive — retrieval does not replace them (RC-08) |

---

## 7. Certification requirements

| Class | Requirements |
|-------|--------------|
| **Retrieval via search** | PS-01–PS-10 (search doc) + RC-M1–M-4 when gate implemented |
| **Context provider only** | G1–G7 + structural cert — **Retrieval Exempt** (Tier C) |
| **AI action executor** | G3 + webhook signing + operation declarations |
| **Claiming retrieval without search delegate** | **Block** — Retrieval Non-Compliant |

Extend `moduleCertificationValidator`:
- If manifest claims query-discovery or `capabilities.retrieval`, require `searchDelegate` OR documented Tier C exemption.

---

## 8. Security: malicious retrieval pollution

| Attack | Defense |
|--------|---------|
| Inject false evidence | Only APPROVED modules in dynamic registry; mapper normalizes shape |
| Cross-tenant evidence | Search JWT scoping; mapper drops unverified permissions |
| Graph bundle pollution | Inference provenance; dedup by entity key; min confidence |
| Prompt injection via snippets | Evidence sanitization in mapper (truncate, strip HTML) |
| Executor abuse | HMAC webhook + user approval flows |

---

## 9. Vertical examples

| Vertical | Realistic retrieval participation today | After M-02 |
|----------|----------------------------------------|------------|
| **Inventory** | Context provider: "low stock summary" | Search: SKUs, warehouses |
| **CRM** | Context provider: "pipeline summary" | Search: contacts, deals |
| **Healthcare** | Context provider only (compliance review) | Search deferred pending BAA |
| **Manufacturing** | Context provider: "work order status" | Search: orders, assets |
| **Property** | Context provider: "vacancy summary" | Search: units, leases |

---

## 10. Recommendation

1. **Do not build separate retrieval delegate before search delegate** — search path satisfies RC-M2 for most partners.
2. **Preserve context provider path** — Option B Hybrid remains correct.
3. **Do not allow marketplace retrieval consumers in Phase 1B** — platform intents only.
4. **Extend certification** when M-02 ships to enforce RC-M4 at publish gate.

**Target readiness:** Query discovery **Level 3** contingent on Search M-02 (Phase 1B). Context providers **already Level 3**.

---

**Last updated:** 2026-06-23
