# Knowledge Trust Model

**Program:** Connected Knowledge Platform — Phase 0B  
**Date:** 2026-06-25  
**Status:** Constitutional trust semantics — **no implementation**

**Authority:** [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md)

---

## 1. Purpose

Define **how knowledge is trusted** in Vssyl: what "trust" means, how it differs from confidence and permission, and how conflicts resolve.

**Core axiom:** Trust is **authorization + provenance + tier** — never a single score.

---

## 2. Trust dimensions

| Dimension | Question answered | Owner |
|-----------|-------------------|-------|
| **Authorization** | May this principal see this knowledge? | Policy Engine + module visibility |
| **Authority** | Which SoR wins on conflict? | Knowledge hierarchy (L0–L6) |
| **Authenticity** | Who created or confirmed it? | Provenance (`actor`, `origin`) |
| **Freshness** | Is it still valid? | Lifecycle state + domain event invalidation |
| **Epistemic weight** | How strongly should UI/AI present it? | Confidence tier (non-authoritative) |

**Trust for consumption** = Authorization ✅ AND Freshness ✅ AND (Authority resolved) AND Provenance present.

Confidence alone **never** establishes trust.

---

## 3. Hierarchy trust semantics

| Level | Trust label | Consumer may rely on for | Trust basis |
|:-----:|-------------|--------------------------|-------------|
| **L0** | **Invariant** | Platform behavior, deny rules | Constitutional |
| **L1** | **Delegated authoritative** | Partner entity state when delegate succeeds | Partner SoR + signed delegate response |
| **L2** | **Authoritative** | Cross-request stable truth | Module or V_Link persistence |
| **L3** | **Governed** | User-endorsed AI or explicit memory | User confirmation on record |
| **L4** | **Contextual** | Current-turn grounding only | Request scope — disclose as inferred |
| **L5** | **Provisional** | Review queues only — not federation | Pending governance |
| **L6** | **Hypothesis** | Discovery, ranking, AI evidence | Query scope — disclose as retrieval |

### Trust decay

| Level | Decay behavior |
|-------|----------------|
| L0–L3 | Decay only via lifecycle (unlink, delete, revoke, expiry on UserMemoryFact) |
| L4 | Expires at end of request |
| L5 | Expires per suggestion TTL or reject |
| L6 | Expires at end of query / retrieval session |

---

## 4. Source trust matrix

| Source system | Default tier | Trust conditions |
|---------------|:------------:|------------------|
| Module Prisma FK | L2 | PE allows read; entity not trashed |
| V_Link `MANUAL` | L2 | Resolver + access service pass |
| V_Link `AI_SUGGESTED` (accepted) | L3 | Accept recorded in provenance |
| UserMemoryFact `explicit` | L3 | User created |
| UserMemoryFact `inferred` | L4 until user edits | Learning path — promote on explicit save |
| Partner delegate hydrate | L1 | Delegate 200 + tenant match + not revoked |
| entityLinking | L4 | Ephemeral |
| AI Retrieval | L6 | Ephemeral |
| Search hit | L6 | Hydrate re-check required |
| Tag index | Metadata overlay | Not edge trust |

---

## 5. Conflict resolution

When two assertions describe the same relationship differently:

### 5.1 Resolution order

```
1. Policy Engine deny (L0 effective) — hide entirely
2. Higher authority tier (lower L number) wins
3. Same tier: newer verifiedAt / updatedAt wins
4. Same tier + timestamp: module SoR > V_Link for module-native class
5. Same tier + V_Link vs V_Link: user resolve via governance (no auto-merge)
6. Inference (L4–L6) never wins over persistence (L1–L3)
```

### 5.2 Conflict types

| Conflict | Resolution |
|----------|------------|
| Module FK says A→B, V_Link says A→C (association) | **Both valid** if different classes; same class → module native for containment/assignment; V_Link for cross-module association |
| Retrieval suggests link, V_Link denies (unlinked) | Unlink wins — L2 > L6 |
| Partner says exists, module trashed | Trash wins — freshness fails |
| Two pending suggestions for same edge | User picks one; other reject |
| AI inference contradicts UserMemoryFact | UserMemoryFact wins (L3 explicit) |

### 5.3 Unresolvable conflicts

Expose **both** with provenance in operator/debug views only. User-facing surfaces show authoritative tier only; log conflict in diagnostics.

---

## 6. Verification history

Trust may strengthen through verification events (not a new tier):

| Event | Effect on trust |
|-------|-----------------|
| User manual link | Baseline L2 |
| User accept AI suggestion | L3 + verification entry |
| Partner delegate re-validate | Refreshes L1 freshness |
| Admin force-transfer V_Link | New actor in provenance — audit |
| Entity restore from trash | Re-validates freshness |

Verification history is **append-only metadata** on knowledge provenance — see [KNOWLEDGE_PROVENANCE_STANDARD.md](./KNOWLEDGE_PROVENANCE_STANDARD.md).

---

## 7. Distrust and revocation

| Trigger | Trust outcome |
|---------|---------------|
| Partner revocation webhook | L1 edges hidden until re-validated |
| Delegate timeout / 4xx | Edge shown as **unverified** — hydrate placeholder |
| User unlink | Trust ends for that edge |
| Permission revoked | Authorization fails — knowledge not visible (not same as untrusted) |
| Suggestion reject | L5 destroyed — never trusted |

**Distinction:** *Unauthorized* ≠ *untrusted*. Hidden knowledge may still be authoritative in SoR.

---

## 8. AI trust boundaries

| Scenario | Trust treatment |
|----------|-----------------|
| Twin cites file from retrieval | Present as "found in search" — L6 |
| Twin cites V_Link attachment | Present as "in your project hub" — L2/L3 |
| Twin merges co-mentioned entities | Disclose inference — L4 |
| Twin states causal "because" | Narrative — not L2 unless activity backs verb |
| Pending suggestions in prompt | **Forbidden** |

---

## 9. Operator / admin trust

Platform Controller and admin surfaces may display:

- Tier distribution per module
- Provenance completeness score
- Conflict counts in federation diagnostics

Operators **must not** override L2 module SoR from admin UI without module-specific governed action.

---

## 10. Trust metrics (Phase 1+ telemetry)

| Metric | Purpose |
|--------|---------|
| `knowledge.tier` | Distribution in bundles |
| `knowledge.provenance_complete` | % edges with required fields |
| `knowledge.conflict` | Resolver conflicts per bundle |
| `knowledge.delegate_failure` | Partner trust degradation |

---

## 11. References

- [KNOWLEDGE_CONFIDENCE_MODEL.md](./KNOWLEDGE_CONFIDENCE_MODEL.md)
- [KNOWLEDGE_RELATIONSHIP_LIFECYCLE.md](./KNOWLEDGE_RELATIONSHIP_LIFECYCLE.md)
- [backend-trust-boundaries.mdc](../../.cursor/rules/backend-trust-boundaries.mdc)
