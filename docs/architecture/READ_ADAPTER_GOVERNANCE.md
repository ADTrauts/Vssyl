# Read Adapter Governance

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-1 — Read adapter constitutional architecture  
**Status:** Canonical governance  
**Date:** 2026-06-14  
**Registry:** [RELATIONSHIP_PROVIDER_REGISTRY.md](./RELATIONSHIP_PROVIDER_REGISTRY.md)  
**Catalog:** [RELATIONSHIP_READ_ADAPTER_CATALOG.md](./RELATIONSHIP_READ_ADAPTER_CATALOG.md)

> **Scope:** Certification, ownership, deprecation, and testing expectations for relationship read adapters. **No** CI or tooling implementation in this phase.

---

## Purpose

Read adapters are **security boundaries**. Without governance, teams duplicate hydrate logic, bypass visibility services, or drift from PLATFORM_ENTITY_MODEL. This document defines merge gates for new and changed adapters.

---

## Certification requirements

Before a read adapter (K1–K4) is **certified active** in the future registry:

| # | Requirement | Evidence |
|---|-------------|----------|
| G1 | Maps to **one primary** taxonomy class per entry (secondary allowed) | Catalog row + PR description |
| G2 | **SoR ownership** documented in ownership matrix — no duplicate store | RELATIONSHIP_OWNERSHIP_MATRIX link |
| G3 | All reads through **visibility service or PE** — no raw cross-module Prisma in consumer | Code review + architecture sign-off |
| G4 | **Tenant scope** on every query path | Test plan |
| G5 | **Bounded result sets** — maxBatchSize declared | Registry entry |
| G6 | **Safe DTO** — no bodies, secrets, tokens in RelationshipReadDTO | Metadata contract |
| G7 | **Trashed entities** excluded or explicitly flagged per lifecycle matrix | Lifecycle doc reference |
| G8 | V_Link K2 entries align with **PLATFORM_ENTITY_MODEL** resolver row | Integration checklist |
| G9 | Module operation matrix updated with read/search/AI row | Audit doc |
| G10 | Cross-module hydrate uses **Pattern C** — target module gate | Hydration patterns reference |

### Search provider (K5) additional

| # | Requirement |
|---|-------------|
| G11 | Delegates to same permission contract as K1 |
| G12 | Manifest `capabilities.search: true` |
| G13 | [SEARCH_PERMISSION_MODEL.md](./SEARCH_PERMISSION_MODEL.md) fail-closed |

### AI provider (K6) additional

| # | Requirement |
|---|-------------|
| G14 | Delegates to K1/K4 — no independent weak query |
| G15 | [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](./AI_RELATIONSHIP_RETRIEVAL_MODEL.md) precedence honored |
| G16 | AI_CONTEXT_PROVIDER_MATRIX row updated |

---

## Provider ownership

| Owner type | Accountability |
|------------|----------------|
| **Module team** | K1, K2, K3, K5, K6 for module |
| **Platform V_Link team** | K4 vlink.* |
| **Platform search team** | Orchestrator — not SoR |
| **Platform architecture** | Registry schema, certification sign-off |

### Escalation

| Situation | Escalate to |
|-----------|-------------|
| New relationship class read path | Architecture — taxonomy amendment |
| Cross-module hydrate dispute | Architecture — ownership matrix |
| Security loosening | Security + architecture |
| Third-party module read surface | Marketplace certification + iframe boundary |

---

## Deprecation rules

| Rule | Detail |
|------|--------|
| D1 | **providerId immutable** — deprecate, don't rename |
| D2 | `status: deprecated` requires `successorProviderId` or migration note |
| D3 | Minimum **one release cycle** deprecated before removal |
| D4 | Consumers must migrate before removal — lint/registry check (future) |
| D5 | Security tightening may **immediate** deprecate unsafe path with hotfix |

### Deprecated paths (documented)

| Path | Successor | Notes |
|------|-----------|-------|
| Notes inline V_Link resolver | `notes.vlinkAccess` (planned) | PLATFORM_ENTITY_MODEL gap |
| Raw searchController queries | Module visibility service | Ongoing modernization |

---

## Compatibility guarantees

| Guarantee | Statement |
|-----------|-----------|
| **Security** | Adapters may become **more restrictive** without major version — consumers must handle deny |
| **DTO additive** | New optional fields — minor `payloadSchemaVersion` bump |
| **DTO removal** | Major bump + consumer migration |
| **Behavioral** | Loosening visibility requires security review — treated as breaking |
| **Registry** | New providers additive — existing ids stable |

---

## Documentation obligations

| Change type | Required docs |
|-------------|---------------|
| New K1/K2 adapter | Operation matrix, catalog row, registry entry |
| New VLinkEntityType | PLATFORM_ENTITY_MODEL, V_LINK.md if behavior novel |
| New hydrate target | NOTEBOOK_RELATIONSHIP_MODEL or module relationship doc |
| Search provider | SEARCH_PROVIDER_MODEL row |
| AI provider | AI_CONTEXT_PROVIDER_MATRIX |
| Deprecation | Registry status + activeContext/progress if user-visible |

Placement: [DOCUMENTATION_PLACEMENT.md](../guides/DOCUMENTATION_PLACEMENT.md) — architecture in `docs/architecture/`.

---

## Testing expectations (future implementation)

Architecture-only phase defines **required test themes** — not test code.

### Unit / service tests

| Theme | Assert |
|-------|--------|
| Tenant isolation | Cross-tenant id returns empty |
| PE deny | Unauthorized user gets empty / deny |
| Trashed host | Excluded by default |
| Batch bound | Never exceeds maxBatchSize |
| Safe metadata | No disallowed fields in DTO |

### Integration tests

| Theme | Assert |
|-------|--------|
| Pattern C hydrate | Denied target → placeholder or omit |
| V_Link resolver | Restricted attachment no title leak |
| Search + adapter parity | Same user same entity visibility consistent |
| Registry drift | Manifest vlink ↔ K2 entries match |

### Contract tests

| Theme | Assert |
|-------|--------|
| Registry entry | Required fields present |
| platformEntityRegistry | Entity type registered before K2 active |
| Event → invalidate | Subscriber calls purge not SoR write |

Reference patterns: `searchController.place.contract.test.ts`, `AIEventConsumer.test.ts`.

---

## Review gates (PR checklist)

- [ ] Ownership matrix row exists — no duplicate SoR  
- [ ] Catalog class mapping correct  
- [ ] Registry entry drafted (or updated)  
- [ ] Hydration pattern identified (A–E)  
- [ ] AI/search/analytics eligibility matches catalog  
- [ ] No universal relationship table introduced  
- [ ] No graph DB as read SoR  
- [ ] Phase 2A–2C boundaries respected (tags, search, automation)  

---

## Certification levels

| Level | Meaning |
|-------|---------|
| **R0 — Undocumented** | Implementation exists — not registry certified |
| **R1 — Documented** | Catalog + matrix row — default for legacy |
| **R2 — Certified** | G1–G10 passed + tests planned |
| **R3 — Federated** | R2 + orchestrator/registry wired + contract tests |

Phase 2D-1 establishes **R1 minimum** for new adapters; legacy adapters tracked toward R2.

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_FRAMEWORK_INDEX.md](./RELATIONSHIP_FRAMEWORK_INDEX.md) | Program entry |
| [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) | Module contract |
| [memory-bank/moduleSpecs.md](../memory-bank/moduleSpecs.md) | Certification checklist |

**Last updated:** 2026-06-14
