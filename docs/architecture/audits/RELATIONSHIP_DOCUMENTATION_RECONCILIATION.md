# Relationship Documentation Reconciliation

**Program:** Vssyl Relationship Framework  
**Phase:** 1B — Constitutional architecture  
**Status:** Complete — **P0 corrections applied** in Phase 1D ([RELATIONSHIP_DOCUMENTATION_CORRECTION_PLAN.md](./RELATIONSHIP_DOCUMENTATION_CORRECTION_PLAN.md))  
**Date:** 2026-06-14  
**Baseline:** [RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md](./RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md)  
**Evidence:** Repo implementation as of 2026-06-14 (`vlinkEntityResolverService.ts`, `registerPlatformEntities.ts`, module closeout audits)

> **Scope:** Compare canonical documentation against implementation. Provides **corrective recommendations** — apply in a follow-up doc maintenance wave, not as part of Phase 1B engineering.

---

## Executive summary

| Category | Count |
|----------|-------|
| Outdated docs (implementation ahead) | **8** |
| Incorrect assumptions | **5** |
| Missing docs | **6** |
| Documentation ahead of implementation | **3** |
| Aligned | **4** |

Primary drift theme: **V_Link and platform entity integration progressed faster than index docs** (`V_LINK.md`, `PLATFORM_ENTITY_MODEL.md`, platform capability matrix). Secondary theme: **Relationship Framework** docs did not exist until Phase 1A/1B.

---

## Reconciliation method

For each source document:

1. Compared stated integration status vs `server/src/services/vlinkEntityResolverService.ts` switch cases  
2. Compared entity registry vs `server/src/startup/registerPlatformEntities.ts`  
3. Cross-checked module closeout audits (File Hub, Calendar, Todo)  
4. Cross-checked AI pipeline docs vs `pipelineCatalogDefaults.ts` and `AI_CONTEXT_PROVIDER_MATRIX.md`

---

## Document-by-document findings

### V_LINK.md

| Field | Value |
|-------|-------|
| Path | `docs/architecture/V_LINK.md` |
| Last updated | 2026-05-28 |
| Verdict | **Outdated — implementation ahead** |

| Claim in doc | Reality (2026-06-14) | Severity |
|--------------|----------------------|----------|
| Integrated: drive, calendar | ✅ Correct | — |
| Pending: chat, todo, notes, hr, scheduling, place | ❌ **Partially wrong** | High |
| — chat | ✅ `chatVlinkAccessService` in resolver | Doc wrong |
| — todo | ✅ `todoVlinkAccessService`; Wave 2 complete per [TODO_PHASE2_TRASH_ENTITY_VLINK.md](./TODO_PHASE2_TRASH_ENTITY_VLINK.md) | Doc wrong |
| — place | ✅ `placeVlinkAccessService` for LISTING + MEETING | Doc wrong |
| — notes | ⚠️ Partial inline resolver in `resolveNonDriveEntityAccess` | Doc overstated as "pending" — partial exists |
| — hr, scheduling | ❌ Still not integrated | Doc correct for these |

**Recommendations:**

1. Replace integration table with resolver truth table synced to `VLinkEntityType` enum.  
2. Add link to [RELATIONSHIP_TAXONOMY.md](../RELATIONSHIP_TAXONOMY.md) — V_Link = **Association** class only.  
3. Note `CHAT_THREAD`, `NOTE` dedicated service gap explicitly.  
4. Update **Last updated** when edited.

---

### PLATFORM_ENTITY_MODEL.md

| Field | Value |
|-------|-------|
| Path | `docs/architecture/PLATFORM_ENTITY_MODEL.md` |
| Last updated | 2026-06-01 |
| Verdict | **Outdated — implementation ahead** |

| Claim in doc | Reality | Severity |
|--------------|---------|----------|
| CHAT_CONVERSATION resolver ✅ | ✅ | Aligned |
| TASK/TODO resolver ✅ | ✅ | Aligned |
| NOTE resolver ❌ | ⚠️ Inline Prisma in resolver — **partial** | Medium |
| PLACE "❌ pending" | ❌ Doc wrong — `placeVlinkAccessService` exists | High |
| Registry: drive, chat, calendar only | ❌ Doc wrong — registry also todo, notes, notebook, place | High |
| CHAT_THREAD deferred | ✅ | Aligned |

**Recommendations:**

1. Update resolver gap table to match Phase 1A §3.4 status matrix.  
2. Expand registry list to match `registerPlatformEntities.ts` log output.  
3. Split NOTE row: resolver **partial**, trash **trashedAt migration pending**, search **partial**.  
4. Add column: **Relationship taxonomy class** per entity type.

---

### VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md (§19 capability matrix)

| Field | Value |
|-------|-------|
| Path | `docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` |
| Verdict | **Outdated — implementation ahead** |

| Claim | Reality | Severity |
|-------|---------|----------|
| chat `vlink` ❌ pending | Resolver exists; manifest may still lag — verify `builtInModuleManifests.ts` | Medium |
| todo `vlink` ❌ | ❌ Doc wrong — Phase 2 complete | High |
| place `vlink` ❌ | ❌ Doc wrong — resolver exists | High |
| notes `vlink` ❌ | ⚠️ Partial | Medium |

**Recommendations:**

1. Reconcile capability matrix from manifest drift tests (`builtInModuleManifests.*.test.ts`).  
2. Distinguish **resolver exists** vs **capability manifest declared** vs **UI complete**.  
3. Add footnote pointing to Relationship Ownership Matrix for vlink vs operational links.

---

### V_LINK_PLATFORM_LAYER_PLAN.md

| Field | Value |
|-------|-------|
| Path | `docs/plans/V_LINK_PLATFORM_LAYER_PLAN.md` |
| Verdict | **Mixed — historical plan with accurate principles; phase status stale** |

| Aspect | Status |
|--------|--------|
| Non-negotiables (membership ≠ access, etc.) | ✅ Still canonical |
| Phase VL-9 AI context | ✅ Marked complete — aligned |
| Phase VL-10 chat/task | ⚠️ Backend resolver for chat/todo largely done; **UI tabs** may still be partial |
| Repo audit §1.1 "No vlink code" | Historical only — **do not delete**; add banner "superseded by implementation" |

**Recommendations:**

1. Add header: **Implementation status:** see `memory-bank/vlinkProductContext.md` + PLATFORM_ENTITY_MODEL.  
2. Do not use VL phase checklist as current integration truth.  
3. Keep plan as **decision archaeology** for non-negotiables.

---

### memory-bank/vlinkProductContext.md

| Field | Value |
|-------|-------|
| Verdict | **Mostly aligned** |

AI pipeline integration table matches runtime. Missing: chat/todo/place resolver completion note.

**Recommendation:** Add "Module resolver status" subsection linking to reconciled PLATFORM_ENTITY_MODEL.

---

### AI_PLATFORM_OVERVIEW.md

| Field | Value |
|-------|-------|
| Verdict | **Aligned** for V_Link pipeline ordering and non-negotiables |

Minor gap: does not reference Relationship Framework taxonomy or federation contract.

**Recommendation:** Add cross-link to RELATIONSHIP_READ_FEDERATION_CONTRACT.md in V_Link section.

---

### AI_CONTEXT_ASSEMBLY.md

| Field | Value |
|-------|-------|
| Verdict | **Partial — tags mentioned as assembly input, not classified** |

Tags appear in diagram as metadata — consistent with taxonomy (module-local, not relationship SoR).

**Recommendation:** Clarify tags are **not** relationship federation inputs unless module provider exports them.

---

### AI_CONTEXT_PROVIDER_MATRIX.md

| Field | Value |
|-------|-------|
| Verdict | **Aligned** for `recent_vlinks` and platform sources |

Does not document module **operational links** (TaskFileLink, NotebookLink) as separate from V_Link.

**Recommendation:** Add appendix row group: "Operational link exposure" — via module providers only, not vlink source.

---

### AI_PIPELINE_ADMIN_TOOLS.md / pipelineCatalogDefaults

| Field | Value |
|-------|-------|
| Verdict | **Aligned** |

Source id `vlink` / label "V_Link Relationships" exists. Grounding rules include optional `vlink` on planning, workflow, business, technical intents.

---

### NOTEBOOK_RELATIONSHIP_MODEL.md

| Field | Value |
|-------|-------|
| Verdict | **Aligned and authoritative** for Notebook vs V_Link split |

Best existing pattern for **ownership matrix** thinking. Phase 3B+ status notes are current.

**Recommendation:** Elevate to required reading in V_LINK.md and Relationship Framework index.

---

### GLOBAL_TRASH.md

| Field | Value |
|-------|-------|
| Verdict | **Aligned** |

V_Link archive separate from Global Trash — consistent with taxonomy lifecycle rules.

---

### REFERENCE_MODULE_CATALOG.md

| Field | Value |
|-------|-------|
| Verdict | **Partial — manifest truth references notebook; no relationship program index** |

**Recommendation:** Add Relationship Framework doc cluster under platform infrastructure index.

---

### docs/architecture/README.md

| Field | Value |
|-------|-------|
| Verdict | **Missing Relationship Framework cluster** |

**Recommendation:** Add section:

- RELATIONSHIP_TAXONOMY.md  
- RELATIONSHIP_OWNERSHIP_MATRIX.md  
- RELATIONSHIP_READ_FEDERATION_CONTRACT.md  
- audits/RELATIONSHIP_FRAMEWORK_*  

---

## Summary tables

### Implementation ahead of documentation

| Doc | Drift |
|-----|-------|
| V_LINK.md | chat, todo, place listed pending — implemented |
| PLATFORM_ENTITY_MODEL.md | place pending; registry incomplete |
| Platform standards §19 matrix | todo/chat/place vlink flags wrong |
| vlinkProductContext.md | resolver breadth understated |

### Documentation ahead of implementation

| Doc | Drift |
|-----|-------|
| V_LINK enum | DASHBOARD, WIDGET, USER, BUSINESS, HOUSEHOLD, MODULE_ENTITY — no resolvers |
| V_LINK plan VL-10 | Implies full Chat/Task **UI** integration — hub tabs may remain placeholder |
| PLATFORM_ENTITY_MODEL NOTE row | Said ❌ resolver — partial inline exists |

### Incorrect assumptions (cross-doc)

| Assumption | Correction |
|------------|------------|
| "V_Link integration = module vlink capability flag only" | Requires resolver + lifecycle + manifest alignment |
| "Pending in V_LINK.md means no backend" | Often means UI or manifest only |
| "PLACE has no V_Link" | `placeVlinkAccessService` implemented |
| "Tags can unify cross-module search soon" | Phase 1B decision: tags stay module-local |
| "One relationship system needed" | Federation over existing SoRs — see federation contract |

### Missing documentation (new in Phase 1B)

| Document | Status |
|----------|--------|
| RELATIONSHIP_TAXONOMY.md | ✅ Created Phase 1B |
| RELATIONSHIP_OWNERSHIP_MATRIX.md | ✅ Created Phase 1B |
| RELATIONSHIP_READ_FEDERATION_CONTRACT.md | ✅ Created Phase 1B |
| RELATIONSHIP_LIFECYCLE_MATRIX.md | ⏳ Recommended Phase 1C |
| TAG_STRATEGY.md | ⏳ Recommended Phase 1C |
| V_LINK resolver status auto-sync | ⏳ Recommend drift test or generated appendix |

---

## Corrective action plan (documentation only)

| Priority | Action | Owner | Target files |
|----------|--------|-------|--------------|
| P0 | Update V_Link integrated module list | Architecture | `V_LINK.md` |
| P0 | Fix resolver gap + registry tables | Architecture | `PLATFORM_ENTITY_MODEL.md` |
| P0 | Reconcile §19 capability matrix vlink column | Architecture | `VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` |
| P1 | Add Relationship Framework index | Architecture | `docs/architecture/README.md` |
| P1 | Cross-link taxonomy from V_LINK + AI overview | Architecture | `V_LINK.md`, `AI_PLATFORM_OVERVIEW.md` |
| P1 | Update vlinkProductContext resolver status | Memory Bank | `memory-bank/vlinkProductContext.md` |
| P2 | Banner on V_LINK plan historical sections | Plans | `V_LINK_PLATFORM_LAYER_PLAN.md` |
| P2 | Provider matrix operational links appendix | Audits | `AI_CONTEXT_PROVIDER_MATRIX.md` |

**No code changes in Phase 1B.** P0 doc edits may be a discrete **doc maintenance** commit after Phase 1B closeout approval.

---

## Drift prevention (recommended)

1. **Generated resolver status** — CI test enumerates `VLinkEntityType` cases in `vlinkEntityResolverService.ts` vs manifest `capabilities: vlink`.  
2. **Single integration truth table** — maintain in `PLATFORM_ENTITY_MODEL.md` only; other docs link to it.  
3. **Relationship program index** — `docs/architecture/README.md` cluster updated when taxonomy changes.

---

## Related documents

| Document | Role |
|----------|------|
| [RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md](./RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md) | Phase 1A evidence |
| [RELATIONSHIP_FRAMEWORK_PHASE_1B_CLOSEOUT.md](./RELATIONSHIP_FRAMEWORK_PHASE_1B_CLOSEOUT.md) | Phase summary |

**Last updated:** 2026-06-14
