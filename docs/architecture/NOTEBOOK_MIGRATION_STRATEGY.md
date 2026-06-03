# Notebook Migration Strategy

**Status:** Planning only — no implementation  
**Parent:** [`NOTEBOOK_PRODUCT_ARCHITECTURE_REVIEW.md`](./NOTEBOOK_PRODUCT_ARCHITECTURE_REVIEW.md)  
**Date:** 2026-06-01

---

## Recommended path

**Option 3 (Hybrid)** — begin with **Option 1 (unified UI, separate backends)**.

| Option | Summary | Verdict |
|--------|---------|---------|
| **1 — Unified UI** | `notebook` product shell; `/api/notes` + `/api/todo` unchanged | **Start here** — lowest risk |
| **2 — Merge backends** | Single schema/service tree | **Defer indefinitely** — threatens Todo cert |
| **3 — Hybrid** | 1 → link layer → optional schema | **Overall strategy** |

---

## Phase map

### Phase 0 — Decision & freeze

**Status:** ✅ Complete (2026-06-01)

| Action | Owner |
|--------|-------|
| Approve Notebook initiative (this review) | Product + Architecture |
| **Stop** Notes modernization (1B, services, cert) | Engineering |
| **Do not** modify Todo services/controllers | Engineering |
| Update roadmap & ledger intent | Docs |

**Exit criteria:** Roadmap shows Notebook track; no Notes extraction PRs in flight.

---

### Phase 0.5 — Product definition + workspace architecture

**Status:** ✅ Complete (2026-06-01)

| Deliverable | Doc |
|-------------|-----|
| Page definition, workflows, future-proofing | [NOTEBOOK_WORKSPACE_ARCHITECTURE.md](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md) |
| Page types | [NOTEBOOK_PAGE_TYPES.md](./NOTEBOOK_PAGE_TYPES.md) |
| Navigation | [NOTEBOOK_NAVIGATION_MODEL.md](./NOTEBOOK_NAVIGATION_MODEL.md) |
| Relationships | [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md) |
| AI strategy | [NOTEBOOK_AI_STRATEGY.md](./NOTEBOOK_AI_STRATEGY.md) |
| Healthcare use cases | [NOTEBOOK_HEALTHCARE_USE_CASES.md](./NOTEBOOK_HEALTHCARE_USE_CASES.md) |
| Implementation readiness + MLVP | [NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md](./NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md) |

**Exit criteria:** Phase 1 scope signed; UX wireframes recommended before implementation ACT.

---

### Phase 0.75 — Technical architecture + implementation plan

**Status:** ✅ Complete (2026-06-01)

| Deliverable | Doc |
|-------------|-----|
| Technical index + Phase 1 scope | [NOTEBOOK_TECHNICAL_ARCHITECTURE.md](./NOTEBOOK_TECHNICAL_ARCHITECTURE.md) |
| Backend services & Notes survivability | [NOTEBOOK_BACKEND_ARCHITECTURE.md](./NOTEBOOK_BACKEND_ARCHITECTURE.md) |
| Frontend routes & components | [NOTEBOOK_FRONTEND_ARCHITECTURE.md](./NOTEBOOK_FRONTEND_ARCHITECTURE.md) |
| Widgets | [NOTEBOOK_WIDGET_ARCHITECTURE.md](./NOTEBOOK_WIDGET_ARCHITECTURE.md) |
| Phases 1–7 checklists | [NOTEBOOK_IMPLEMENTATION_PLAN.md](./NOTEBOOK_IMPLEMENTATION_PLAN.md) |
| Level 3 strategy | [NOTEBOOK_CERTIFICATION_STRATEGY.md](./NOTEBOOK_CERTIFICATION_STRATEGY.md) |

**Exit criteria:** Implementation ACT for Phase 1 with PR boundaries in implementation plan.

---

### Phase 1 — Notebook product shell (UI + routing)

**Duration:** 4–6 weeks (when approved to implement)

| Deliverable | Detail |
|-------------|--------|
| `moduleId: 'notebook'` | Manifest, seed, `registerBuiltInModules` AI context (facade) |
| Routes | `/notebook`, `/business/[id]/workspace/notebook` |
| `BusinessWorkspaceContent` | `case 'notebook'` composing existing `NotesModule` + Todo list/board entry |
| `NotebookWorkspaceLanding.tsx` | Hub per module-development rule |
| Widget | `notebook` widget — recent pages + due tasks |
| Deep links | V_Link and bookmarks still resolve `/notes`, `/todo` APIs |

**Backend changes:** Minimal — optional `GET /api/notebook/summary` read-only aggregator (no new mutations).

**Todo impact:** None on certification artifacts.

**Notes impact:** No `notes*Service` requirement for Phase 1.

---

### Phase 2 — Cross-link & AI extraction layer

**Duration:** 6–8 weeks

| Deliverable | Detail |
|-------------|--------|
| `notebookLinkService` | CRUD links page↔task↔file↔event; uses Todo/Drive/Calendar visibility |
| Page UI | “Add as task”, “Link file”, embedded task status |
| AI | `notebookAIActionService` — extract actions → `todoAIActionService` |
| Activity | Facade emits `moduleId: 'notebook'` with sub-domain metadata |
| Notes hygiene (targeted) | Global Trash handler for `note` **or** document trash only via Notes controller until handler — **not** full Notes cert wave |

**Todo impact:** Additive only — new link types may extend `todoIntegrationLinkService` or parallel service.

---

### Phase 3 — Platform consolidation (gated)

**Duration:** TBD — requires council review

| Deliverable | Detail |
|-------------|--------|
| Unified search facade | Federated notes + tasks query (Platform §24) |
| Manifest deprecation | Hide standalone `notes` from module picker; `todo` may remain for integrators |
| Platform entities | `notebook:page` registers; `NOTE` enum alias |
| Optional schema | `notebook_sections` table; migrate `Note.content` blocks |

**Todo impact:** Still no merge of `Task` model. Re-audit **Notebook** for Level 3 — not a Todo recertification.

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Todo Reference #4 invalidated by merge | **Forbidden** in Phase 1–2; explicit architecture gate on Phase 3 schema |
| Double modernization (Notes cert + Notebook) | Freeze Notes cert; document in roadmap |
| Manifest lies (`trash: true` on notes) | Fix only when Notebook needs Global Trash UX — implement handler as Notes domain task under Notebook track |
| Widget/provisioning breakage | Keep `notes` + `todo` modules installed; `notebook` depends on both |
| Marketplace `notes`/`todo` APIs | Maintain backward-compatible routes through Phase 2 |
| AI context regression | Register notebook providers that delegate to existing notes + todo providers |

---

## Rollback strategy

Each phase is independently revertible:

- **Phase 1 rollback:** Remove `notebook` case; restore separate `notes` + `todo` workspace entries.
- **Phase 2 rollback:** Disable link service; pages and tasks remain standalone.
- **Phase 3 rollback:** Not recommended once schema migrates — hence council gate.

---

## Success metrics

| Metric | Phase 1 | Phase 2 |
|--------|---------|---------|
| User can open one Notebook hub | ✅ | ✅ |
| Create meeting note + task without leaving hub | Partial (deep link) | ✅ inline |
| Todo cert tests still pass | ✅ | ✅ |
| No new Prisma in notebook facade controllers | ✅ | ✅ |

---

## What this strategy explicitly avoids

- Notes Phase 1B service extraction as a standalone wave
- Merging `notes` and `tasks` tables
- Removing `todoTrashService` or re-registering task trash under `notebook`
- Place modernization (Wave 3) until Notebook Phase 1 exit

---

*Implementation requires product `ACT` approval per phase — this document does not authorize coding.*
