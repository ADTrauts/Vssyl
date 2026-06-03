# Notebook Certification Strategy

**Phase:** 0.75  
**Parent:** [NOTEBOOK_TECHNICAL_ARCHITECTURE.md](./NOTEBOOK_TECHNICAL_ARCHITECTURE.md)  
**Date:** 2026-06-01

---

## Objective

Reach **Notebook `moduleId: notebook` — Level 3 Certified** without:

- Demoting or recertifying **File Hub #4 / Chat #2 / Calendar #3 / Todo #4**
- Merging Todo task architecture into Notebook
- Invalidating Todo Reference Module #4 documentation

Notebook certifies as a **composition module** — like Business Workspace in scope, but with **owned product surface** and Phase 3+ **NotebookLink** persistence.

---

## Certification model

| Module | Level | Role after Notebook L3 |
|--------|-------|------------------------|
| File Hub | 4 | Unchanged — files, trash, storage |
| Chat | 3 | Unchanged — messaging |
| Calendar | 3 | Unchanged — events |
| Todo | 3 | **Reference #4 unchanged** — tasks |
| Notes (`notes`) | 1 → 2 | **Backend domain** inside Notebook track; may stay Level 2 sub-domain |
| **Notebook** | **Target 3** | Product module + link layer + AI orchestration |

**Notes module id** may remain installed as **dependency** without separate Level 3 product cert — analogous to internal packages.

---

## Level 3 gate mapping

| # | Gate | Notebook approach | Evidence phase |
|---|------|-------------------|----------------|
| 1 | Canonical services | `notes*Service` (domain) + `notebookLinkService`, `notebookAIActionService` | 2, 3, 6 |
| 2 | Thin controllers | `notebook*Controller`, thin `notesController` | 2, 3, 6 |
| 3 | Policy Engine | `notesPolicyDual` + link create PE | 2, 3 |
| 4 | Global Trash | `notesTrashService` handler; Todo already has task | 2 |
| 5 | V_Link | `notebook:page` entity; user V_Link optional | 7 |
| 6 | Platform entities | `registerNotebookPlatformEntities` | 7 |
| 7 | Domain events | `notebook.*` facade + `notes.*` where applicable | 3, 7 |
| 8 | Module activity | `notebookActivityService` facade | 3 |
| 9 | Notifications | `notes_shared` + notebook types if added | 2, 7 |
| 10 | Realtime | **N/A or Partial** — document deferral unless co-edit ships | 7 |
| 11 | AI compliance | `notebookAIActionService` → domain services | 6 |
| 12 | Manifest truth | `notebook` case — no false trash/vlink | 1, 7 |
| 13 | Tests | PE, trash, links, AI executor | 2–7 |
| 14 | Documentation | Constitutional audit + operation matrix | 7 |
| 15 | Legacy sunset | `/notes` redirects; picker hides `notes` | 7 |

**Acceptable partials (documented):**

- Realtime co-editing N/A
- Federated search Phase 3 platform ticket
- `notes` module id remains in `BUILT_IN_MODULE_IDS` as dependency

---

## Required audits (Phase 7)

| Document | Purpose |
|----------|---------|
| `NOTEBOOK_CONSTITUTIONAL_AUDIT.md` | §0–§30 compliance for composition |
| `NOTEBOOK_OPERATION_MATRIX.md` | Per-operation C/P/N; delegate rows for Todo/Calendar/Drive |
| `NOTEBOOK_SERVICE_EXTRACTION_PLAN.md` | Already implied by backend arch — formalize at Phase 2 start |
| `NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md` | Sign-off |

**Do not** rewrite `TODO_LEVEL3_CERTIFICATION_REVIEW.md`.

---

## Manifest requirements (target)

```typescript
// Design-only — builtInModuleManifests case 'notebook'
{
  permissions: ['notebook:read', 'notebook:write'],
  capabilities: {
    read: true,
    write: true,        // UI composition — actual writes delegate
    ai: true,
    businessWorkspace: true,
    trash: true,        // only after notesTrashService Phase 2
    vlink: true,        // only after entity registration Phase 7
    notifications: true,
    realtime: false,    // truthful Phase 7
  },
  dependencies: ['notes', 'todo'],
  entities: [{ id: 'page', platformType: 'notebook:page', vlinkType: 'NOTE' }],
  notifications: [
    { type: 'notes_shared', ... },  // inherited via notes domain
  ],
}
```

**Phase 1 manifest:** `trash: false`, `vlink: false`, `realtime: false`.

---

## Platform entity registration

| Entity id | Platform type | V_Link enum | Resolver |
|-----------|---------------|-------------|----------|
| `page` | `notebook:page` | `NOTE` (alias) | Existing NOTE case + page visibility |

**Todo entity:** remains `todo:task` — Notebook does not register tasks.

---

## Reference module interaction (non-disruption checklist)

| Reference | Notebook must not | Notebook may |
|-----------|-------------------|--------------|
| **#1 File Hub** | Upload/storage in notebook service | Link files, call Drive visibility |
| **#2 Chat** | Message writes | Link conversations |
| **#3 Calendar** | Event CRUD in notebook | Link events, read context |
| **#4 Todo** | Alter `todoTaskService` signatures | Call create/update via service; embed UI |

**Regression gate before Notebook L3 merge:** Full `todo` test suite + File Hub trash sample + chat/calendar smoke unchanged.

---

## Certification timeline

| Milestone | Phase | Ledger update |
|-----------|-------|---------------|
| Notebook planning complete | 0.75 | Notes paused (done) |
| MLVP shipped | 1 | Notebook “Stabilizing” row optional |
| Notes domain services + trash | 2 | Notes → Level 2 sub-domain note |
| Links + activity facade | 3 | — |
| AI executor | 6 | — |
| L3 review signed | 7 | Notebook Level 3; Reference #5 discussion → Place |

**Notebook as Reference Module #5?** Only if architecture council wants a **composition** reference — otherwise **Place** remains #5 for entity/geo patterns. Notebook L3 does not require Reference designation.

---

## What Notebook certification replaces

| Superseded | Replacement |
|------------|-------------|
| Standalone **Notes Level 3** product cert | Notebook L3 + Notes domain Level 2 |
| Notes modernization roadmap wave | Phases 2–7 in [NOTEBOOK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_IMPLEMENTATION_PLAN.md) |

---

## Pre-certification blockers (track now)

| Blocker | Status |
|---------|--------|
| Manifest `trash: true` on `notes` without handler | ✅ Phase 2 — `notesTrashService` |
| Notebook AI not in ActionExecutor / toolExecutor | ✅ Phase 7+ — read-only ops; confirm HTTP-only |
| No `notebook:page` entity | ✅ Phase 7+ — `registerNotebookPlatformEntities` |
| Inline Prisma in notes controllers (core CRUD) | ✅ Phase 2 — delegated to `notes*Service` |
| Formal Level 3 sign-off | ✅ [NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md](./audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md) (2026-06-02) |

---

*Gates align with [CERTIFICATION_LEDGER.md](./CERTIFICATION_LEDGER.md) Level 3 table.*
