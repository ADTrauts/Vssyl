# Knowledge Provenance Standard

**Program:** Connected Knowledge Platform — Phase 0B  
**Date:** 2026-06-25  
**Status:** Mandatory metadata standard — **no schema migration in this phase**

**Authority:** [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md)

---

## 1. Purpose

Define **mandatory provenance metadata** for every knowledge edge and user knowledge fact exposed through federation consumers.

Provenance answers: **where did this knowledge come from, who touched it, and how was it validated?**

---

## 2. Scope

| Artifact | Provenance required |
|----------|:-------------------:|
| Federation bundle edge | ✅ |
| Federation bundle node (hydrated entity) | ✅ (entity-level subset) |
| UserMemoryFact in bundle | ✅ |
| Transient retrieval evidence | ✅ (minimal) |
| Module-internal only reads | ⚠️ Recommended — required at federation boundary |
| Activity log row | Separate envelope — not edge provenance |

---

## 3. Core provenance record

Every **KnowledgeEdge** in a federation bundle MUST include:

```typescript
interface KnowledgeProvenance {
  /** Knowledge hierarchy tier L0–L6 */
  tier: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';

  /** Canonical origin enum */
  origin: KnowledgeOrigin;

  /** ISO 8601 — when this knowledge assertion became current */
  assertedAt: string;

  /** ISO 8601 — last validation or hydrate success */
  verifiedAt: string;

  /** Actor who created or last governed (userId or system id) */
  actor: ProvenanceActor;

  /** Source system identifier */
  sourceSystem: string;

  /** Optional relationship source detail */
  relationshipSource?: RelationshipSourceDetail;

  /** Append-only governance history */
  verificationHistory?: VerificationEvent[];
}
```

### 3.1 KnowledgeOrigin enum

| Value | Meaning | Typical tier |
|-------|---------|:------------:|
| `module_native` | Module schema FK or operational link | L2 |
| `vlink_manual` | User linked via V_Link UI/API | L2 |
| `vlink_ai_accepted` | User accepted VLinkSuggestion | L3 |
| `user_memory_explicit` | User typed/saved fact | L3 |
| `user_memory_learned` | Learning service — until user confirms | L4 |
| `partner_delegate` | Partner SoR via delegate | L1 |
| `platform_registry` | Platform entity descriptor / invariant | L0 |
| `ai_inference` | entityLinking or synthesis | L4 |
| `retrieval_evidence` | AI Retrieval consumer | L6 |
| `search_discovery` | Unified Search hit used as relatedness | L6 |
| `suggestion_pending` | **Bundle forbidden** — governance only | L5 |

### 3.2 ProvenanceActor

```typescript
interface ProvenanceActor {
  type: 'user' | 'system' | 'partner' | 'ai';
  id: string;
  displayName?: string;
  /** Required when type === 'ai' */
  modelId?: string;
  /** Required when type === 'partner' */
  partnerModuleId?: string;
}
```

### 3.3 RelationshipSourceDetail

```typescript
interface RelationshipSourceDetail {
  /** Taxonomy class */
  relationshipClass: string;
  /** Storage pointer — not exposed to clients raw */
  sorRef?: {
    store: 'module' | 'vlink' | 'partner' | 'memory';
    moduleId?: string;
    table?: string;
    recordId?: string;
  };
  /** V_Link specific */
  vlinkId?: string;
  vlinkEntityId?: string;
  /** Retrieval / inference trace */
  evidenceRef?: string;
  retrievalConsumerId?: string;
  searchProviderId?: string;
}
```

### 3.4 VerificationEvent

```typescript
interface VerificationEvent {
  at: string;
  action: 'created' | 'confirmed' | 'revalidated' | 'unlinked' | 'revoked' | 'restored';
  actor: ProvenanceActor;
  method: 'manual' | 'ai_accept' | 'ai_reject' | 'delegate' | 'lifecycle' | 'admin';
  note?: string;
}
```

---

## 4. Field requirements by tier

| Field | L0–L3 | L4 | L5 | L6 |
|-------|:-----:|:--:|:--:|:--:|
| `tier` | ✅ | ✅ | ✅ | ✅ |
| `origin` | ✅ | ✅ | ✅ | ✅ |
| `assertedAt` | ✅ | ✅ | ✅ | ✅ |
| `verifiedAt` | ✅ | ⚠️ request time | ✅ | ⚠️ query time |
| `actor` | ✅ | ✅ system+model | ✅ | ✅ system |
| `sourceSystem` | ✅ | ✅ | ✅ | ✅ |
| `relationshipSource` | ✅ | ✅ evidenceRef | ✅ suggestionId | ✅ evidenceRef |
| `verificationHistory` | Recommended | ❌ | On accept path | ❌ |
| `modelId` (if AI involved) | If AI | ✅ | ✅ | Optional |

---

## 5. Entity-level provenance (nodes)

Hydrated nodes in bundles include subset:

```typescript
interface KnowledgeNodeProvenance {
  tier: 'L1' | 'L2';  // nodes are never L4–L6 as entities
  origin: KnowledgeOrigin;
  moduleId: string;
  entityType: string;
  hydratedAt: string;
  hydrateSource: 'module_adapter' | 'vlink_resolver' | 'partner_delegate';
  delegateVersion?: string;
}
```

Nodes do not carry `confidence` for existence — existence is SoR. Confidence applies to **edges and facts**.

---

## 6. Mapping from current systems (as-built → standard)

| Current artifact | Provenance mapping |
|------------------|-------------------|
| `VLinkEntity.source = MANUAL` | `origin: vlink_manual`, tier L2, actor = `linkedById` |
| `VLinkEntity.source = AI_SUGGESTED` | `origin: vlink_ai_accepted`, tier L3 |
| `VLinkSuggestion` | `origin: suggestion_pending`, tier L5 — not in bundle |
| Module FK | `origin: module_native`, tier L2, `sourceSystem: {moduleId}` |
| `UserMemoryFact` | `origin: user_memory_explicit \| user_memory_learned` |
| `AIRetrievalEvidence` | `origin: retrieval_evidence`, tier L6, `evidenceRef` |
| `entityLinking` output | `origin: ai_inference`, tier L4 |
| Partner delegate 200 | `origin: partner_delegate`, tier L1 |

**Phase 1:** Federation layer maps as-built fields to this standard at bundle compose time — schema extension optional later.

---

## 7. User confirmation provenance

When user confirms knowledge, append verification event:

```json
{
  "at": "2026-06-25T12:00:00Z",
  "action": "confirmed",
  "actor": { "type": "user", "id": "user_123" },
  "method": "ai_accept",
  "note": "Accepted from retrieval suggestion batch"
}
```

Required on promotion L5/L6 → L2/L3.

---

## 8. Partner provenance extensions

| Field | Required for L1 |
|-------|-----------------|
| `actor.partnerModuleId` | ✅ |
| `relationshipSource.delegateVersion` | ✅ |
| `verifiedAt` | From delegate response timestamp |
| `verificationHistory` | On revalidation / revoke |

See [PARTNER_KNOWLEDGE_PARTICIPATION.md](./PARTNER_KNOWLEDGE_PARTICIPATION.md).

---

## 9. Privacy and redaction

| Scenario | Provenance behavior |
|----------|---------------------|
| Restricted attachment in V_Link | Node hydrates placeholder; edge provenance present; target title redacted |
| User lacks entity read | Edge omitted entirely — not partial provenance leak |
| Operator debug | Full provenance including `sorRef` |
| Client UI | `sorRef` stripped; user-safe labels only |

---

## 10. Validation rules (CI / Phase 1)

| Rule ID | Check |
|---------|-------|
| PV-1 | No bundle edge without `tier` and `origin` |
| PV-2 | No L5 edges in federation bundle |
| PV-3 | `ai_*` origins include `modelId` when actor.type === 'ai' |
| PV-4 | L1 edges include `partnerModuleId` |
| PV-5 | `verificationHistory` monotonic by `at` |

---

## 11. Anti-patterns

| Anti-pattern | Violation |
|--------------|-----------|
| Provenance optional in production bundle | PV-1 |
| Fabricated `verifiedAt` | Trust model |
| Copy search rank as origin | Must be `search_discovery` |
| Hide AI origin on L3 edge | Must be `vlink_ai_accepted` |

---

## 12. References

- [KNOWLEDGE_CONFIDENCE_MODEL.md](./KNOWLEDGE_CONFIDENCE_MODEL.md)
- [KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md](./KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md)
