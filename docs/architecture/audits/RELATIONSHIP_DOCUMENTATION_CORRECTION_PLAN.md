# Relationship Documentation Correction Plan

**Program:** Vssyl Relationship Framework  
**Wave:** P0 Documentation Reconciliation (Phase 1D)  
**Status:** **Applied** — 2026-06-14  
**Source audit:** [RELATIONSHIP_DOCUMENTATION_RECONCILIATION.md](./audits/RELATIONSHIP_DOCUMENTATION_RECONCILIATION.md) (Phase 1B)

> **Scope:** Governance and documentation only. No code, migrations, APIs, or schema changes.

---

## Purpose

Master inventory of documentation drift identified in Phase 1B, the **correct state** after Phases 1A–1C constitutional decisions, and the **updates applied** in this wave.

**Integration truth authority (post-wave):** [PLATFORM_ENTITY_MODEL.md](../PLATFORM_ENTITY_MODEL.md) resolver table — other docs link to it rather than duplicating status.

---

## Correction summary

| Severity | Issues found | Corrected in wave |
|----------|--------------|-------------------|
| P0 | 12 | 12 |
| P1 | 8 | 8 |
| P2 | 4 | 3 (1 deferred — CI drift test spec only) |

---

## P0 corrections

| # | Document | Current issue (pre-wave) | Correct state | Update applied |
|---|----------|--------------------------|---------------|----------------|
| P0-1 | `V_LINK.md` | Lists chat, todo, place, notes as **Pending** | Resolver + manifest truth per entity type table | ✅ Rewrote integration section |
| P0-2 | `PLATFORM_ENTITY_MODEL.md` | Place ❌ pending; registry lists 3 modules only; NOTE ❌ | Full registry + resolver/lifecycle/manifest columns | ✅ Full table rewrite |
| P0-3 | `VSSYL_PLATFORM_STANDARDS` §19 | chat/todo/place `vlink` ❌; place `trash` ❌ | Align with `builtInModuleManifests.ts` | ✅ Matrix + footnote |
| P0-4 | `memory-bank/vlinkProductContext.md` | No module resolver breadth | Resolver status subsection + links | ✅ Added §Module resolver status |
| P0-5 | `docs/architecture/README.md` | No Relationship Framework cluster | Index + link to `RELATIONSHIP_FRAMEWORK_INDEX.md` | ✅ Added section |
| P0-6 | — | No program entry point | `RELATIONSHIP_FRAMEWORK_INDEX.md` | ✅ Created |
| P0-7 | `TODO_OPERATION_MATRIX.md` | V_Link row cites "Inline Prisma" | `todoVlinkAccessService` delegated | ✅ Row corrected |
| P0-8 | `PLACE_PRODUCT_ARCHITECTURE_REVIEW.md` | `placeVlinkAccessService` marked **(future)** | Shipped Phase 2A | ✅ Wording updated |
| P0-9 | `V_LINK.md` | No Relationship Framework cross-links | Taxonomy, ownership, lifecycle, federation links | ✅ Added |
| P0-10 | `PLATFORM_ENTITY_MODEL.md` | No Relationship Framework cross-links | Links to taxonomy, lifecycle, cascades | ✅ Added |
| P0-11 | `V_LINK.md` | Last updated 2026-05-28 | 2026-06-14 | ✅ |
| P0-12 | `PLATFORM_ENTITY_MODEL.md` | Last updated 2026-06-01 | 2026-06-14 | ✅ |

---

## P1 corrections

| # | Document | Current issue | Correct state | Update applied |
|---|----------|---------------|---------------|----------------|
| P1-1 | `AI_PLATFORM_OVERVIEW.md` | No Relationship Framework refs in V_Link section | Federation + taxonomy links | ✅ |
| P1-2 | `AI_CONTEXT_ASSEMBLY.md` | Tags in diagram without taxonomy context | Tags ≠ relationship federation | ✅ Note added |
| P1-3 | `AI_CONTEXT_PROVIDER_MATRIX.md` | No operational link distinction | Appendix: TaskFileLink, NotebookLink vs vlink source | ✅ |
| P1-4 | `REFERENCE_MODULE_CATALOG.md` | No Relationship Framework pointer | Platform infrastructure cross-link | ✅ |
| P1-5 | `V_LINK_PLATFORM_LAYER_PLAN.md` | VL phases read as current integration truth | Historical plan banner + current truth links | ✅ |
| P1-6 | `RELATIONSHIP_DOCUMENTATION_RECONCILIATION.md` | Status "no doc edits applied" | Wave applied pointer | ✅ Status banner |
| P1-7 | `VSSYL_PLATFORM_STANDARDS` §21 | Generic V_Link gap note only | Link to Relationship Framework index | ✅ |
| P1-8 | `GLOBAL_TRASH.md` | No lifecycle matrix link | Cross-link to lifecycle doc | ✅ One-line link |

---

## P2 corrections (deferred or partial)

| # | Document | Issue | Recommendation | Status |
|---|----------|-------|----------------|--------|
| P2-1 | CI / tests | No automated resolver vs manifest drift test | Spec in Phase 2 engineering gate | ⏳ Documented only |
| P2-2 | `TODO_OPERATION_MATRIX.md` | Broader matrix still mostly P/N (pre-Phase 2 wave) | Full todo matrix refresh is separate certification wave | ⏳ V_Link row only |
| P2-3 | `notes` manifest | `capabilities.vlink` not declared despite NOTE entity | Add `vlink: true` when `notesVlinkAccessService` ships | ⏳ Noted in PLATFORM_ENTITY_MODEL |
| P2-4 | Module product contexts (`calendarProductContext.md`, etc.) | May lack Relationship Framework links | Optional Memory Bank pass in Phase 2 | ⏳ Architecture docs prioritized |

---

## Entity integration truth (canonical snapshot)

Post-wave authoritative status for V_Link resolver coverage:

| VLinkEntityType | Module | Resolver | Lifecycle unlink | Manifest `vlink` | Hub UI |
|-----------------|--------|----------|------------------|------------------|--------|
| FILE, FOLDER | drive | ✅ | ✅ permanent delete | ✅ | ✅ |
| CALENDAR_EVENT | calendar | ✅ | ✅ | ✅ | ✅ |
| CHAT_CONVERSATION | chat | ✅ | ✅ | ✅ | partial tabs |
| TASK, TODO | todo | ✅ | ✅ | ✅ | partial |
| PLACE_LISTING, PLACE_MEETING | place | ✅ | ✅ | ✅ | partial |
| NOTE | notes | ⚠️ partial inline | ❌ dedicated service | ❌ not declared | pending |
| CHAT_THREAD | chat | ❌ deferred | partial | — | — |
| DASHBOARD, WIDGET, USER, BUSINESS, HOUSEHOLD, MODULE_ENTITY | — | ❌ enum only | — | — | — |

**Relationship class:** V_Link attachments = **Association** ([RELATIONSHIP_TAXONOMY.md](../RELATIONSHIP_TAXONOMY.md)).  
**Lifecycle:** Entity trash retains link; permanent delete soft-unlinks ([RELATIONSHIP_LIFECYCLE_MATRIX.md](../RELATIONSHIP_LIFECYCLE_MATRIX.md)).

---

## Incorrect assumptions corrected (cross-doc)

| Assumption | Correction documented in |
|------------|-------------------------|
| "Pending in V_LINK.md = no backend" | V_LINK.md — distinguish resolver / manifest / UI |
| "V_Link integration = capability flag only" | PLATFORM_ENTITY_MODEL — requires resolver + lifecycle |
| "PLACE has no V_Link" | All updated platform docs |
| "Tags unify cross-module relationships" | AI_CONTEXT_ASSEMBLY + RELATIONSHIP_TAXONOMY |
| "One relationship database needed" | RELATIONSHIP_READ_FEDERATION_CONTRACT (linked from index) |

---

## Drift prevention (post-wave)

1. **Single integration truth table** — maintain in `PLATFORM_ENTITY_MODEL.md`; `V_LINK.md` summarizes and links.  
2. **Relationship Framework index** — `RELATIONSHIP_FRAMEWORK_INDEX.md` updated when new constitutional docs added.  
3. **Phase 2 gate** — CI test enumerating resolver cases vs manifest `vlink` + `entities[]` (recommended, not implemented).

---

## Related documents

| Document | Role |
|----------|------|
| [RELATIONSHIP_FRAMEWORK_INDEX.md](../RELATIONSHIP_FRAMEWORK_INDEX.md) | Program entry point |
| [RELATIONSHIP_FRAMEWORK_PHASE_1D_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_1D_CLOSEOUT.md) | Wave closeout |

**Last updated:** 2026-06-14
