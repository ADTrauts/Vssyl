# Relationship Framework — Phase 1B Closeout

**Program:** Vssyl Relationship Framework  
**Phase:** 1B — Constitutional architecture  
**Status:** **Complete**  
**Date:** 2026-06-14  
**Prior phase:** [RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md](./RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md) (Phase 1A)

> **Scope:** Documentation, governance, and architecture only. No database changes, migrations, APIs, UI, graph databases, automation engines, or relationship services were implemented.

---

## Required report

| # | Topic | Section |
|---|-------|---------|
| 1 | Taxonomy decisions | §1 |
| 2 | Ownership decisions | §2 |
| 3 | Federation decisions | §3 |
| 4 | Documentation gaps | §4 |
| 5 | Architectural risks | §5 |
| 6 | Recommended Phase 1C | §6 |

---

## Phase 1B deliverables

| ID | Deliverable | Path | Status |
|----|-------------|------|--------|
| 1B-1 | Relationship Taxonomy | [RELATIONSHIP_TAXONOMY.md](../RELATIONSHIP_TAXONOMY.md) | ✅ |
| 1B-2 | Relationship Ownership Matrix | [RELATIONSHIP_OWNERSHIP_MATRIX.md](../RELATIONSHIP_OWNERSHIP_MATRIX.md) | ✅ |
| 1B-3 | Documentation Reconciliation | [RELATIONSHIP_DOCUMENTATION_RECONCILIATION.md](./RELATIONSHIP_DOCUMENTATION_RECONCILIATION.md) | ✅ |
| 1B-4 | Read Federation Contract | [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](../RELATIONSHIP_READ_FEDERATION_CONTRACT.md) | ✅ |
| 1B-5 | Phase 1B Closeout | This document | ✅ |

---

## 1. Taxonomy decisions

### Locked decisions

| Decision | Rationale |
|----------|-----------|
| **18 relationship classes** defined with definitions, examples, storage patterns, and anti-patterns | Covers platform inventory without universal table |
| **V_Link maps to Association (+ Membership for container, Hierarchy for nesting)** | Preserves constitutional "membership ≠ access" |
| **Tags are a separate class — module-local in v1** | No platform Tag Layer in Phase 1B |
| **Access grant is distinct from Association** | Prevents permission escalation via V_Link |
| **AI context is its own class** | Separates persisted truth from inference |
| **Notification / webhook = Subscription class** | Not relationship SoR |
| **Cross-class composition allowed** | Real features combine classes; primary class required in specs |

### Explicit non-decisions (deferred)

- Unified tag taxonomy across modules  
- New relationship classes for marketplace-only patterns  
- Promotion of `Relationship` (user-user) to platform federation source beyond Place  

### Canonical document

**[RELATIONSHIP_TAXONOMY.md](../RELATIONSHIP_TAXONOMY.md)** is the constitutional source of truth for relationship **classes**. New mechanisms must map here before implementation.

---

## 2. Ownership decisions

### Locked decisions

| Decision | Rationale |
|----------|-----------|
| **Every major relationship has one system of record** | Documented in ownership matrix — no duplication register entries |
| **V_Link owns only platform association container edges** | `VLink`, `VLinkMember`, `VLinkEntity`, `VLinkSuggestion` |
| **Module owns operational links** | `TaskFileLink`, `NoteShare`, `ConversationParticipant`, etc. |
| **NotebookLink owns page workflow edges** | Distinct from V_Link per NOTEBOOK_RELATIONSHIP_MODEL |
| **AI visibility authority = module visibility service or V_Link resolver** | No third AI-specific relationship store |
| **Notifications are not SoR** | Confirm state via module reader |

### Conflict resolution rules locked

- Share → access grant SoR  
- Group for project → V_Link  
- Page → task workflow → NotebookLink  
- AI related items → federation read; persist via V_Link accept or module link  

### Canonical document

**[RELATIONSHIP_OWNERSHIP_MATRIX.md](../RELATIONSHIP_OWNERSHIP_MATRIX.md)**

---

## 3. Federation decisions

### Locked decisions

| Decision | Rationale |
|----------|-----------|
| **No universal relationship database** | Constitutional — avoids god object |
| **Federation layer is logical in Phase 1B** | Consumers orchestrate reads; no new service deployed |
| **Five read patterns (A–E)** | Provider, resolver, operational hydrate, event-derived, parallel fan-out |
| **AI precedence: memory > persisted V_Link > module providers > inference** | Matches runtime intent |
| **Caching is derived and invalidatable** | Guidance only — no cache built |
| **Graph visualization must not unify Place and V_Link without taxonomy legend** | Different semantic classes |

### Consumer contracts defined

AI, Search, Analytics, Graph views, Recommendations, Automation, Discovery — each with allowed/forbidden reads and permission checkpoints.

### Canonical document

**[RELATIONSHIP_READ_FEDERATION_CONTRACT.md](../RELATIONSHIP_READ_FEDERATION_CONTRACT.md)**

---

## 4. Documentation gaps

### Closed in Phase 1B

- Relationship taxonomy charter  
- Ownership matrix  
- Federation contract  
- Reconciliation audit with P0–P2 corrective list  

### Still open (recommended next)

| Gap | Priority | Notes |
|-----|----------|-------|
| V_LINK.md integration list stale | P0 | chat, todo, place implemented |
| PLATFORM_ENTITY_MODEL resolver table stale | P0 | place, registry breadth |
| Platform standards §19 vlink capability matrix | P0 | todo/place/chat flags |
| `docs/architecture/README.md` Relationship cluster | P1 | Index new docs |
| RELATIONSHIP_LIFECYCLE_MATRIX.md | P1 | Phase 1C — trash/archive/unlink per class |
| TAG_STRATEGY.md | P1 | Phase 1C |
| Resolver status drift test / generated appendix | P2 | Prevent recurrence |

Full reconciliation: [RELATIONSHIP_DOCUMENTATION_RECONCILIATION.md](./RELATIONSHIP_DOCUMENTATION_RECONCILIATION.md)

---

## 5. Architectural risks

Carried forward from Phase 1A with Phase 1B mitigations:

| ID | Risk | Phase 1B mitigation |
|----|------|------------------------|
| RF-R1 | Semantic collapse (V_Link = share = tag) | Taxonomy + anti-patterns per class |
| RF-R2 | Enum ahead of resolver | Ownership matrix + reconciliation P0 |
| RF-R3 | Parallel cross-module stores | Notebook vs V_Link rules; federation Pattern E |
| RF-R4 | Documentation drift | Reconciliation doc + drift prevention recommendations |
| RF-R5 | Tag sprawl | Locked: module-local v1; Phase 1C tag strategy |
| RF-R6 | AI inference as truth | Federation contract precedence + grounding table |
| RF-R7 | Trash lifecycle fragmentation | Phase 1C lifecycle matrix (recommended) |
| RF-R8 | No read index | Federation without universal DB; Phase 2 gate criteria in contract |
| RF-R9 | Membership overload | Taxonomy distinguishes membership types |
| RF-R10 | Third-party bypass | Federation contract § third-party modules |

**New risk (Phase 1B):**

| ID | Risk | Mitigation |
|----|------|------------|
| RF-R11 | **Premature federation service** — building `relationshipReadService` before two consumers need it | Phase gate in federation contract |

---

## 6. Recommended Phase 1C

**Phase 1C is recommended only — not executed.**

Theme: **Lifecycle, tags, and documentation hardening** — still architecture-first; optional small doc-maintenance commits; no universal relationship DB.

### Phase 1C proposed deliverables

| ID | Deliverable | Type | Description |
|----|-------------|------|-------------|
| 1C-1 | **RELATIONSHIP_LIFECYCLE_MATRIX.md** | Architecture | trash, archive, unlink, restore, permanent delete per taxonomy class and SoR |
| 1C-2 | **TAG_STRATEGY.md** | Architecture | Module-local conventions; cross-module search options; explicit non-goals; Place vs Todo vs Notes |
| 1C-3 | **Doc maintenance wave** | Documentation | Apply P0 items from reconciliation (V_LINK.md, PLATFORM_ENTITY_MODEL, §19 matrix) |
| 1C-4 | **V_Link integration truth table** | Documentation + optional drift test spec | Single table: enum → resolver → lifecycle → manifest → UI |
| 1C-5 | **Relationship Framework index** | Documentation | Update architecture README + VSSYL_SOURCE_OF_TRUTH pointer |

### Phase 1C optional research topics (no implementation)

| Topic | Output |
|-------|--------|
| Graph visualization | UX contract: which graphs show which classes; redaction rules |
| Automation triggers | Catalog of domain events that imply relationship changes; webhook gaps |
| Relationship analytics | Event-derived metrics spec; no warehouse build |
| Recommendation systems | Proposal flows only (V_LinkSuggestion vs Place discovery) |
| Relationship search | Federated search composition spec; no index merge |

### Phase 1C explicit exclusions

- Universal relationship table or graph DB  
- Tag platform schema  
- Relationship read microservice  
- Visualization UI  
- Recommendation engine implementation  

### Suggested Phase 2 entry criteria (after 1C)

1. Lifecycle matrix approved  
2. P0 documentation reconciliation merged  
3. NOTE vlink access service design approved (or NOTE deferred from V_Link enum)  
4. CHAT_THREAD: implement or remove from enum decision recorded  
5. Two consumer teams (e.g. AI + Search) sign off on federation contract  

---

## Success criteria assessment

| Criterion | Met? |
|-----------|------|
| Constitutional taxonomy defined | ✅ |
| Ownership boundaries prevent duplication | ✅ |
| Federation model without universal DB | ✅ |
| Documentation gaps identified with corrective plan | ✅ |
| No engineering scope creep in Phase 1B | ✅ |
| Phase 1C recommended but not executed | ✅ |

---

## Document hierarchy (Relationship Framework program)

```
docs/architecture/
├── RELATIONSHIP_TAXONOMY.md              ← class constitution
├── RELATIONSHIP_OWNERSHIP_MATRIX.md        ← SoR constitution
├── RELATIONSHIP_READ_FEDERATION_CONTRACT.md ← read constitution
└── audits/
    ├── RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md  (Phase 1A)
    ├── RELATIONSHIP_DOCUMENTATION_RECONCILIATION.md
    └── RELATIONSHIP_FRAMEWORK_PHASE_1B_CLOSEOUT.md (this file)
```

---

## Next step

**Human gate:** Review Phase 1B deliverables. Approve Phase 1C scope or reprioritize P0 doc maintenance.

**Do not begin Phase 1C implementation** until explicitly requested.

---

**Last updated:** 2026-06-14
