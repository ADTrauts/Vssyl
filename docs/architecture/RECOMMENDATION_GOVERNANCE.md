# Recommendation Governance

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-3 — Recommendation constitutional architecture  
**Status:** Canonical governance  
**Date:** 2026-06-14  
**Adapter governance:** [READ_ADAPTER_GOVERNANCE.md](./READ_ADAPTER_GOVERNANCE.md)

> **Scope:** Certification, ownership, deprecation, and testing for recommendation features. **No** tooling in this phase.

---

## Purpose

Prevent **hidden ranking systems**, **opaque logic**, and **recommendation-only relationships** that bypass SoR and user authority.

---

## Certification requirements

Before a recommendation feature ships:

| # | Requirement |
|---|-------------|
| RG1 | Maps to **recommendation type** with canonical **accept API** |
| RG2 | All **signal families** documented in signal model |
| RG3 | **explainabilityKey** + reasonText for user-facing cards |
| RG4 | **Permission model** checklist passed |
| RG5 | **Lifecycle states** defined — no shortcut to Accepted without mutation |
| RG6 | **No auto-accept** unless explicit D2 user rule (automation) — AI excluded |
| RG7 | **Tenant scoped** — cross-tenant review |
| RG8 | **Frequency caps** documented |
| RG9 | **AI boundary** review if AI-generated |
| RG10 | **Graph** uses dashed provenance only |
| RG11 | **Not** in V_Link / AI grounding until Accepted |
| RG12 | Operation matrix / module audit updated |
| RG13 | Domain events distinguish suggestion vs relationship |
| RG14 | Dismiss/reject preference — not fake relationship row |

### ML ranker additional (future)

| # | Requirement |
|---|-------------|
| RG15 | Candidates pre-filtered by adapters only |
| RG16 | Model card + reason mapping — no pure score UI |
| RG17 | Phase 3 intelligence charter approval |

---

## Signal ownership

| Signal family | Owner | Reviewer |
|---------------|-------|----------|
| Place / discovery | Place module | Product + architecture |
| V_Link co-membership | Platform V_Link | Architecture |
| AI correlation rules | AI platform | AI + architecture |
| Chat / calendar co-participation | Module owner | Module + architecture |
| Cross-module correlator | Platform architecture | Architecture council |

New signal family requires signal model amendment + permission review.

---

## Deprecation rules

| Rule | Detail |
|------|--------|
| Deprecate signal family | Stop new recommendations — expire Suggested |
| Deprecate recommendation type | Migrate accept path — document successor |
| Remove proposal store table | **Never** if it holds only proposals — migrate data |
| Change accept API | Breaking — dual-write period or force expire proposals |

---

## Versioning

| Artifact | Version |
|----------|---------|
| Signal family schema | `signalFamilyVersion` |
| Recommendation card DTO | `recommendationSchemaVersion` |
| Correlation rule set | `rulesetId` + semver |
| explainabilityKey catalog | Central registry — additive ok |

**Breaking:** Removing accept path or loosening permission without review.

---

## Testing expectations (future)

| Theme | Assert |
|-------|--------|
| Denied visibility | No card generated |
| Accept | SoR row created + correct event |
| Reject | No SoR row |
| Expire on trash | Proposal terminal |
| Cross-tenant | Zero candidates |
| AI suggest | No auto linkEntity |
| Graph | Dashed only |
| Stale accept | PE re-check fails gracefully |
| explainability | reasonText present |

Contract tests: mock adapters — correlator never raw cross-module Prisma.

---

## Prevent: hidden ranking

| Guard | Detail |
|-------|--------|
| Documented signal families | No undocumented signals |
| Reason required | Every card |
| Admin audit | Business ADMIN may view rule ids — not other users' private signals |
| No silent reorder affecting permissions | Rank affects order only |
| Analytics separate | Click metrics ≠ relationship SoR |

---

## Prevent: recommendation-only relationships

| Guard | Detail |
|-------|--------|
| Acceptance checklist | Mutation API mandatory |
| No FK from entity to AISuggestion as link | Proposal ids separate |
| Graph solid edges | Adapter-backed SoR only |
| Search | Entity hits not proposal hits |
| Federation | No recommendation table in read adapter catalog as SoR |

---

## Certification levels

| Level | Meaning |
|-------|---------|
| **Rec0** | Undocumented heuristic |
| **Rec1** | Documented in module doc |
| **Rec2** | RG1–RG14 certified |
| **Rec3** | Rec2 + contract tests + AI review |

Existing: Place discovery, VLinkSuggestion, ambient AI — target **Rec2** alignment.

---

## PR checklist

- [ ] Accept API identified  
- [ ] Signals documented  
- [ ] Permission fail-closed  
- [ ] Lifecycle states  
- [ ] No auto relationship  
- [ ] Events correct (suggestion vs created)  
- [ ] AI/graph boundaries  
- [ ] No universal rank DB  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md](./RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md) | Architecture |
| [AUTOMATION_CONSUMER_BOUNDARY.md](./AUTOMATION_CONSUMER_BOUNDARY.md) | C5 class |

**Last updated:** 2026-06-14
