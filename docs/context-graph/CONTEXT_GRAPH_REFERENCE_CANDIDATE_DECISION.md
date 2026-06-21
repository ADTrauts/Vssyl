# Context Graph — Reference Candidate Decision

**Program:** CG-0C — Context Graph Council Ratification  
**Date:** 2026-06-18  
**Authority:** Architecture Council — reference designation vote  
**Status:** **RATIFIED** — candidates approved; **not promoted** to Reference Platform Capability in catalog until CG-2+ with runtime evidence

**Parent:** [CONTEXT_GRAPH_REFERENCE_COMPARISON.md](./CONTEXT_GRAPH_REFERENCE_COMPARISON.md)  
**Ratification:** [CONTEXT_GRAPH_COUNCIL_RATIFICATION.md](./CONTEXT_GRAPH_COUNCIL_RATIFICATION.md) — RD-CG-008

---

## Decision summary

| Capability | Council decision | Effective status |
|------------|------------------|------------------|
| **#CG-1** Federated Context Graph Read Model | **APPROVED** — Reference Platform Capability **Candidate** | **Ratified** |
| **#CG-2** V_Link Cross-Module Association Substrate | **APPROVED** — Reference Platform Capability **Candidate** | **Ratified** |
| **#CG-3** Context Bundle Descriptor Pattern | **DEFERRED** | Candidate until Phase 1C runtime |
| **Reference Domain (whole Context Graph)** | **DENIED** | Not a module domain |
| **Reference Implementation (L4)** | **DENIED** | File Hub only |
| **Plain Reference Platform Capability** | **DENIED** | No runtime; 15 open findings |

---

## #CG-1 — Federated Context Graph Read Model

### Ratification record (RD-CG-008)

| Field | Value |
|-------|-------|
| **Ratified?** | **YES** — as **Candidate** |
| **Designation** | Reference Platform Capability Candidate #CG-1 |
| **Teaching domain** | Federation over module SoRs without universal relationship table; read orchestrator; adapter registry; PE-at-every-hop |
| **Evidence** | Phase 0A/0B constitutional package; [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](../architecture/RELATIONSHIP_READ_FEDERATION_CONTRACT.md) |
| **Conditions** | No runtime at CG-0C; cite as **Candidate** only until CG-2; not L4 |

### What #CG-1 teaches

| Pattern | Copy target |
|---------|-------------|
| Federated node descriptors | `(moduleId, entityType, entityId)` — no ContextNode table |
| Read-only orchestrator | Compose bundles without foreign SoR writes |
| Traversal caps | [GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](../architecture/GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md) |
| Consumer contracts | AI, search, visualization as readers |

### What #CG-1 is not

- Not a graph database reference
- Not a universal relationships table pattern
- Not AI-owned knowledge store

---

## #CG-2 — V_Link Cross-Module Association Substrate

### Ratification record (RD-CG-008)

| Field | Value |
|-------|-------|
| **Ratified?** | **YES** — as **Candidate** |
| **Designation** | Reference Platform Capability Candidate #CG-2 |
| **Teaching domain** | User-curated Association containers; membership ≠ entity access; AI pipeline source `vlink`; polymorphic attachments |
| **Evidence** | [V_LINK.md](../architecture/V_LINK.md); Phase 0A inventory (5 models, 23 endpoints, 20 services) |
| **Conditions** | V_Link ships today; Context Graph extends — cite WITH FINDINGS notation until CG-2 certifies federation layer |

### What #CG-2 teaches

| Pattern | Copy target |
|---------|-------------|
| `*VlinkAccessService` per module | File Hub reference path |
| `vlinkEntityResolverService` | Permission-safe hydrate |
| Domain events on link lifecycle | 14 vlink event types |
| AI suggestions approval gate | No silent SoR writes |

### What #CG-2 is not

- Not a tag system
- Not a folder replacement
- Not access grants (FilePermission pattern is separate)

---

## #CG-3 — Context Bundle Descriptor Pattern

### Ratification record (RD-CG-008)

| Field | Value |
|-------|-------|
| **Ratified?** | **DEFERRED** |
| **Designation** | Candidate **after Phase 1C** |
| **Teaching domain** | Logical context bundles for AI + API; provenance; token budgets |
| **Evidence** | [CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md](./CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md) — spec only |
| **Conditions** | Runtime `ContextBundleDescriptor` + pipeline integration required |

**Promotion path:** Spec ratified in 0B → runtime in 1C → #CG-3 candidacy at CG-2.

---

## Reference path vote (Motion G)

| Option | Council outcome |
|--------|-----------------|
| None | Rejected — teaching value documented |
| **Candidate** | **Ratified** — #CG-1, #CG-2 |
| With Findings | Premature — no certification |
| Reference Capability | Rejected — no runtime evidence |

---

## Catalog update (deferred)

**Do not** update [REFERENCE_MODULE_CATALOG.md](../architecture/REFERENCE_MODULE_CATALOG.md) in CG-0C.

**Future (CG-2 ledger PR):** Optional annex:

```
## Context Graph — Platform Capability Candidates (CG-0C)
| ID | Capability | Designation |
| CG-1 | Federated Context Graph Read Model | Reference Platform Capability Candidate |
| CG-2 | V_Link Cross-Module Association Substrate | Reference Platform Capability Candidate |
```

Promotion to **Reference Platform Capability With Findings** follows CG-5 pattern (Admin Portal, Business Administration precedent).

---

## Comparison to Business Administration reference

| Dimension | Business Administration | Context Graph |
|-----------|------------------------|---------------|
| Runtime at ratification | Substantial (BA-1A–1E) | V_Link only; federation not built |
| Certification at ratification | L3 WITH FINDINGS | NOT CERTIFIABLE |
| Reference at ratification | #OC-1, #OC-2 candidates | #CG-1, #CG-2 candidates |
| Deferred capability | #OC-3 (BA-F-005) | #CG-3 (Phase 1C) |

---

## Related

- [CONTEXT_GRAPH_COUNCIL_RATIFICATION.md](./CONTEXT_GRAPH_COUNCIL_RATIFICATION.md)
- [CONTEXT_GRAPH_LEDGER_RECOMMENDATION.md](./CONTEXT_GRAPH_LEDGER_RECOMMENDATION.md)

**Last updated:** 2026-06-18
