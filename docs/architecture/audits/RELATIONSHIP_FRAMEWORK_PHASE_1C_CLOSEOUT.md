# Relationship Framework — Phase 1C Closeout

**Program:** Vssyl Relationship Framework  
**Phase:** 1C — Lifecycle architecture  
**Status:** **Complete**  
**Date:** 2026-06-14  
**Prior phases:** [RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md](./RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md) (1A), [RELATIONSHIP_FRAMEWORK_PHASE_1B_CLOSEOUT.md](./RELATIONSHIP_FRAMEWORK_PHASE_1B_CLOSEOUT.md) (1B)

> **Scope:** Documentation and constitutional architecture only. No code, migrations, APIs, services, graph databases, automation engines, or UI.

---

## Required report

| # | Topic | Section |
|---|-------|---------|
| 1 | Lifecycle rules summary | §1 |
| 2 | Cascade rules summary | §2 |
| 3 | Retention rules summary | §3 |
| 4 | Event model summary | §4 |
| 5 | Remaining architectural gaps | §5 |
| 6 | Recommended Phase 1D | §6 |

---

## Phase 1C deliverables

| ID | Deliverable | Path | Status |
|----|-------------|------|--------|
| 1C-1 | Lifecycle Matrix | [RELATIONSHIP_LIFECYCLE_MATRIX.md](../RELATIONSHIP_LIFECYCLE_MATRIX.md) | ✅ |
| 1C-2 | Cascade Rules | [RELATIONSHIP_CASCADE_RULES.md](../RELATIONSHIP_CASCADE_RULES.md) | ✅ |
| 1C-3 | Audit and Retention Policy | [RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md](../RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md) | ✅ |
| 1C-4 | Event Model | [RELATIONSHIP_EVENT_MODEL.md](../RELATIONSHIP_EVENT_MODEL.md) | ✅ |
| 1C-5 | Phase 1C Closeout | This document | ✅ |

---

## 1. Lifecycle rules summary

### Platform states locked

| State | Primary use |
|-------|-------------|
| Active | Normal operation |
| Archived | V_Link, NotebookLink — **not** Global Trash |
| Trashed | Entity `trashedAt` — Global Trash |
| Soft-unlinked | V_Link entity edge retired with audit |
| Revoked | Access grants, membership removal |
| Permanently deleted | Row gone; audit may remain |

### Cross-cutting lifecycle decisions

| Decision | Rule |
|----------|------|
| V_Link vs Global Trash | **Separate** — V_Link uses archive/delete on container |
| Entity trash vs association | **Edges persist** on soft trash; resolver **restricted** |
| Entity permanent delete vs V_Link | **Soft-unlink** — not hard delete of audit row |
| Tags | Lifecycle **bound to host entity** |
| AI inference | **Ephemeral** — no lifecycle in SoR |
| Pending V_Link suggestions | **Never active** for AI |

All **18 taxonomy classes** have lifecycle columns defined in the lifecycle matrix (including Access grant, Hierarchy, Containment).

---

## 2. Cascade rules summary

### Cascade type defaults

| Taxonomy class | Target soft trash | Target permanent delete |
|----------------|-------------------|-------------------------|
| Access grant | Independent | Hard cascade |
| Association (V_Link) | Independent (restricted) | Soft-unlink |
| Association (module) | Orphan allowed | Hard cascade or orphan |
| Membership | Container rules | Hard cascade |
| Reference / attachment | Orphan allowed | Varies |

### Scenario playbooks documented

- Delete file, folder, task, calendar event, conversation, note/page, V_Link, business, user account  
- NotebookLink unlink (archive only — target unchanged)

### Blocked deletes (orphan forbidden)

- V_Link parent with active children  
- Business delete without data governance  
- User delete with owned content and no transfer  

Full matrix: [RELATIONSHIP_CASCADE_RULES.md](../RELATIONSHIP_CASCADE_RULES.md)

---

## 3. Retention rules summary

### Retention tiers

| Tier | Default |
|------|---------|
| R0 Operational | Life of edge |
| R1 Soft-delete grace | Restore window |
| R2 Audit | Indefinite (events, activity, VLinkActivity) |
| R3 Analytics | Derived warehouse policy |
| R4 Ephemeral | AI inference, cache |
| R5 Purge | Notifications/delivery logs |

### AI visibility after delete

| Must remain | Must never remain |
|-------------|-------------------|
| Audit tombstones (admin) | Entity content via association |
| Soft-unlinked link audit | Pending suggestions in grounding |
| Domain event metadata (ids) | Cross-tenant edges |
| | Restricted titles in search |

Full policy: [RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md](../RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md)

---

## 4. Event model summary

### Conceptual vocabulary

Framework concepts (`relationship.created`, `.updated`, `.archived`, `.restored`, `.deleted`, `.unlinked`, `.revoked`, `.expired`, `.transferred`) map to **concrete** domain events — not a single universal event bus type.

### Emission ownership

- **Module SoR → module emits** (share, assign, attendee, NotebookLink activity)  
- **V_Link → platform emits** (`vlink.*` catalog)  
- **Federation rule:** Events trigger **re-fetch or cache invalidation** — not relationship SoR  

### Key gaps (events not yet universal)

NotebookLink domain events, TaskDependency events, full attendee RSVP domain types — documented for Phase 2.

Full model: [RELATIONSHIP_EVENT_MODEL.md](../RELATIONSHIP_EVENT_MODEL.md)

---

## 5. Remaining architectural gaps

| ID | Gap | Severity | Notes |
|----|-----|----------|-------|
| G-1 | Notes `deletedAt` vs `trashedAt` lifecycle alignment | Medium | Lifecycle intent documented; migration pending |
| G-2 | NOTE V_Link dedicated access/lifecycle service | Medium | Partial inline resolver |
| G-3 | CHAT_THREAD enum vs deferred resolver | Low | Decision: implement or remove enum |
| G-4 | Not all relationship classes emit domain events | Low | Activity-only paths (NotebookLink, dependencies) |
| G-5 | V_Link does not consume file/calendar delete events for index | Low | Federation Phase 2 |
| G-6 | User account delete governance matrix incomplete | High | Cascade doc §9 — product/legal needed |
| G-7 | P0 doc reconciliation from Phase 1B still open | Medium | V_LINK.md, PLATFORM_ENTITY_MODEL |
| G-8 | TAG_STRATEGY.md not yet written | Low | Phase 1D candidate |
| G-9 | Legal hold / compliance overlay | High | Enterprise — out of scope Phase 1C |
| G-10 | Relationship Framework index in architecture README | Low | Doc hygiene |

---

## 6. Recommended Phase 1D

**Phase 1D is recommended only — not executed.**

Theme: **Consumer contracts and strategy docs** — still architecture-only unless explicitly approved doc-maintenance for P0 reconciliation.

### Phase 1D proposed deliverables

| ID | Deliverable | Type | Description |
|----|-------------|------|-------------|
| 1D-1 | **TAG_STRATEGY.md** | Architecture | Module-local conventions; cross-module search options; explicit non-goals; no platform schema |
| 1D-2 | **RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md** | Architecture | Which graphs show which taxonomy classes; Place vs V_Link; redaction; no UI build |
| 1D-3 | **RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md** | Architecture | Map framework concepts → concrete domain events; webhook gaps; no automation engine |
| 1D-4 | **RELATIONSHIP_SEARCH_ARCHITECTURE.md** | Architecture | Federated search composition; V_Link vs module indexes; no index merge implementation |
| 1D-5 | **RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md** | Architecture | Proposal vs persistence; V_LinkSuggestion vs Place discovery vs AISuggestion boundaries |
| 1D-6 | **Doc maintenance wave (P0)** | Documentation | Apply reconciliation fixes from Phase 1B |
| 1D-7 | **RELATIONSHIP_FRAMEWORK_INDEX.md** or README section | Documentation | Single entry point for all program docs |

### Phase 1D optional alignment work (still no code)

| Item | Output |
|------|--------|
| Event concept → concrete type registry appendix | Extend RELATIONSHIP_EVENT_MODEL.md |
| Module lifecycle certification checklist | Reference module patterns doc |
| User account delete governance | Cross-functional brief |

### Phase 1D explicit exclusions

- Universal relationship table or graph DB  
- Tag platform schema  
- Search index implementation  
- Recommendation engine  
- Automation/workflow engine  
- Visualization UI  
- Lifecycle service code changes  

### Suggested Phase 2 entry criteria (after 1D)

1. Phase 1C lifecycle + cascade docs approved  
2. P0 documentation reconciliation merged  
3. TAG_STRATEGY and at least one consumer contract (search or viz) approved  
4. Module teams acknowledge lifecycle matrix for their SoR edges  
5. Explicit gate before any `relationshipReadService` or derived index  

---

## Program document hierarchy (Phases 1A–1C)

```
docs/architecture/
├── RELATIONSHIP_TAXONOMY.md                 (1B — classes)
├── RELATIONSHIP_OWNERSHIP_MATRIX.md           (1B — SoR)
├── RELATIONSHIP_READ_FEDERATION_CONTRACT.md   (1B — read)
├── RELATIONSHIP_LIFECYCLE_MATRIX.md           (1C — lifecycle)
├── RELATIONSHIP_CASCADE_RULES.md              (1C — cascades)
├── RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md (1C — audit)
├── RELATIONSHIP_EVENT_MODEL.md                (1C — events)
└── audits/
    ├── RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md      (1A)
    ├── RELATIONSHIP_DOCUMENTATION_RECONCILIATION.md  (1B)
    ├── RELATIONSHIP_FRAMEWORK_PHASE_1B_CLOSEOUT.md   (1B)
    └── RELATIONSHIP_FRAMEWORK_PHASE_1C_CLOSEOUT.md   (1C — this file)
```

---

## Success criteria assessment

| Criterion | Met? |
|-----------|------|
| Lifecycle defined for all taxonomy classes | ✅ |
| Cascade rules for major delete scenarios | ✅ |
| Audit/retention/AI visibility policy | ✅ |
| Constitutional event model without implementation | ✅ |
| No engineering scope creep | ✅ |
| Phase 1D recommended but not executed | ✅ |

---

## Next step

**Human gate:** Review Phase 1C deliverables. Approve Phase 1D scope or prioritize P0 doc reconciliation.

**Do not begin Phase 1D** until explicitly requested.

---

**Last updated:** 2026-06-14
