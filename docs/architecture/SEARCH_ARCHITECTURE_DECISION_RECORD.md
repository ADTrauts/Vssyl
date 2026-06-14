# Search Architecture Decision Record

**Program:** Vssyl Relationship Framework  
**Phase:** 2B — Relationship search constitutional architecture  
**Status:** Accepted  
**Date:** 2026-06-14  
**Architecture:** [RELATIONSHIP_SEARCH_ARCHITECTURE.md](./RELATIONSHIP_SEARCH_ARCHITECTURE.md)

> Documents **why** Vssyl selected **federated search** over alternative architectures. Constitutional — changes require Relationship Framework charter review.

---

## Status

| Field | Value |
|-------|-------|
| **Decision** | Federated SearchProvider + optional derived read indexes |
| **Rejected alternatives** | Universal relationship DB; graph-first architecture; global tag table SoR |
| **Scope** | Global search, relationship-aware discovery, future indexes |
| **Consequences** | Per-module provider ownership; eventual consistency for indexes; no single graph query |

---

## Context

Vssyl relationships are **decentralized by design** (Phase 1A baseline). Multiple consumers need search:

- Global search bar across modules  
- Module-local filter/tag UX  
- Future relationship explorer ("what links here?")  
- AI retrieval that respects confirmed associations  

Constraints:

- [RELATIONSHIP_TAXONOMY.md](./RELATIONSHIP_TAXONOMY.md) — 18 relationship classes  
- [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md) — singular SoR per class  
- [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md) — no universal DB  
- [TAG_STRATEGY.md](./TAG_STRATEGY.md) — module-local tags  
- Multi-tenant isolation + Policy Engine on every module  

The platform must choose a search architecture that **composes** existing SoR without becoming a second relationship store.

---

## Decision

Adopt **federated search orchestration**:

1. **Entity Search** via module **SearchProviders** with visibility service gates  
2. **V_Link Search** via platform provider (`searchVLinksForUser`)  
3. **Tag Search** via in-module filters + optional **Tag Index** (derived, read-only)  
4. **Relationship Search** via future **Relationship Read Adapters** (parallel fan-out, hydrate targets) — no unified edge table  
5. Optional **derived indexes** (entity, tag, container) invalidated by domain events — acceleration only  

This extends existing v1 implementation (`searchController` provider registry) rather than replacing it with a new storage paradigm.

---

## Alternative 1 — Universal relationship database

### Description

Single platform table (or service) storing all edges: `(sourceType, sourceId, relType, targetType, targetId, tenant, …)` with sync jobs from modules.

### Why rejected

| Factor | Assessment |
|--------|------------|
| **Ownership** | Violates ownership matrix — duplicates FilePermission, TaskFileLink, VLinkEntity, NotebookLink, … |
| **Write path** | Requires sync on every module mutation — dual-write failure modes |
| **Taxonomy drift** | 18 classes with different lifecycles collapse to generic `relType` string |
| **Permission** | Edge visible ≠ target visible — universal table encourages title indexing leaks |
| **Module autonomy** | Third-party modules cannot accept platform edge sync as certification requirement |
| **Operational cost** | Reconciliation jobs, backfill, schema migration on every new relationship class |

### Tradeoff accepted by rejection

- No single SQL "all relationships for entity X" without fan-out  
- Relationship explorer builds **views** at read time  

**Verdict:** ❌ Rejected — contradicts Phase 1B F3 and duplication guards.

---

## Alternative 2 — Graph-first architecture

### Description

Neo4j / graph DB (or PostgreSQL adjacency as primary) as **authoritative** relationship store; modules write through graph API.

### Why rejected

| Factor | Assessment |
|--------|------------|
| **Primary storage** | Moves SoR from modules to graph — violates module interoperability contract |
| **Tenancy** | Graph traversals risk cross-tenant leakage without heavy guardrails |
| **Lifecycle** | Trash/cascade rules differ per class — graph simplifies incorrectly |
| **V_Link semantics** | Container membership ≠ entity access — graph edges tempt wrong modeling |
| **Existing investment** | Prisma module schemas, visibility services, PE actions already authoritative |
| **Partner modules** | Cannot require graph writes in-process for iframe/bundle partners |

### When graph is acceptable (narrow)

- **Derived read projection** for visualization (Main Street layout, future explorer)  
- **Not** authoritative for permissions or mutations  

**Verdict:** ❌ Rejected as primary SoR; ⚠️ optional derived projection only per federation F7.

---

## Alternative 3 — Global tag table (system of record)

### Description

Platform `Tag`, `TagAssignment` tables; all modules assign tags through central API; search queries one tag index.

### Why rejected

| Factor | Assessment |
|--------|------------|
| **Tag strategy** | Phase 2A locked module-local SoR |
| **Semantics** | Tags are labels not links — global table invites relationship collapse |
| **Lifecycle** | Tag lifecycle = host lifecycle — junction table adds orphan risk |
| **Namespace** | Cross-module `#urgent` equivalence undefined |
| **Write amplification** | Every module CRUD doubles writes |

### Acceptable subset

- **Global Tag Index** — derived, read-only mirror ([TAG_INDEX_CONTRACT.md](./TAG_INDEX_CONTRACT.md))  
- Modules continue to own `tags[]` on host rows  

**Verdict:** ❌ Rejected as SoR; ✅ derived index allowed.

---

## Why federation wins

| Criterion | Federation | Universal DB | Graph-first | Global tags |
|-----------|------------|--------------|-------------|-------------|
| Respects ownership matrix | ✅ | ❌ | ❌ | ⚠️ |
| No dual-write SoR | ✅ | ❌ | ❌ | ❌ |
| Module certification path | ✅ | ❌ | ❌ | ⚠️ |
| PE / visibility at source | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Matches current code | ✅ | ❌ | ❌ | ❌ |
| Tag strategy aligned | ✅ | ✅ | ✅ | ❌ |
| V_Link boundary preserved | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Third-party module parity | ✅ | ❌ | ❌ | ⚠️ |

---

## Tradeoffs accepted

| Tradeoff | Mitigation |
|----------|------------|
| **No single-query cross-module graph** | Parallel fan-out + UI merge with taxonomy badges |
| **Eventual consistency on indexes** | Hydrate re-check; prefer omit on doubt |
| **Provider registry gaps** (todo, calendar, notes not global yet) | Phase implementation track — not architecture change |
| **Duplicate relevance logic per module** | Shared scoring helpers optional — not required for correctness |
| **Higher fan-out latency** | Parallel `Promise.all`, per-provider timeouts, module filter |
| **Relationship search complexity** | Phase 2C Relationship Read Adapter catalog |

---

## Consequences

### Positive

- Search scales with module boundaries  
- Permission bugs localized to module visibility services  
- New modules add provider without platform schema migration  
- AI and search share federation contract  
- Derived indexes optional per consumer need  

### Negative

- Global "related items" requires orchestration investment  
- Cross-module analytics need event-derived warehouses, not search store  
- Certification must verify each provider's PE path  

### Neutral

- Vector search (future) attaches to **entity indexes** per module — not universal relationship embedding store  

---

## Related decisions (locked)

| ID | Decision | Phase |
|----|----------|-------|
| RF-1 | No universal relationship DB | 1B |
| RF-2 | V_Link ≠ operational links | 1B |
| RF-3 | Tags module-local | 2A |
| RF-4 | Federation patterns A–E | 1B |
| RF-5 | Search fail-closed on permissions | 2B |

---

## Revisit triggers

Reopen this ADR only if:

- Regulatory requirement mandates centralized relationship audit store (likely **event warehouse**, not search SoR)  
- Measured p99 global search latency fails SLO after parallel fan-out optimization (consider **derived entity index**, not universal DB)  
- Product mandates real-time cross-module graph analytics at billions of edges (consider **derived graph projection**, not primary SoR)  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md) | Federation principles |
| [RELATIONSHIP_SEARCH_ARCHITECTURE.md](./RELATIONSHIP_SEARCH_ARCHITECTURE.md) | Chosen architecture |
| [audits/RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md](./audits/RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md) | Evidence for decentralization |

**Last updated:** 2026-06-14
