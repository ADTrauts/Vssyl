# Notebook Implementation Readiness Review

**Phase:** 0.5  
**Date:** 2026-06-01  
**Status:** Phase **0.75** technical blueprint complete — **Phase 1 implementation ACT still required** before code

**Spec index:** [NOTEBOOK_WORKSPACE_ARCHITECTURE.md](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md) and companion Phase 0.5 docs.

---

## 1. Readiness summary

| Gate | Status | Notes |
|------|--------|-------|
| Product definition (Page, workflows) | ✅ Complete | Phase 0.5 docs |
| Domain boundaries (Todo/Notes/Place) | ✅ Documented | No Todo architecture changes |
| Navigation & page types | ✅ Complete | |
| Relationship model (V_Link vs NotebookLink) | ✅ Complete | Phase 2 for NL table |
| AI ownership | ✅ Complete | Phase 1 = delegation only |
| Healthcare validation | ✅ Complete | 6 scenarios |
| Migration strategy | ✅ From Phase 0 | [NOTEBOOK_MIGRATION_STRATEGY.md](./NOTEBOOK_MIGRATION_STRATEGY.md) |
| Constitutional audit (Notebook) | ⏳ Phase 1 pre-flight | Before merge to main |
| UX wireframes | ⏳ Product | Recommended before ACT |
| Technical blueprint (0.75) | ✅ Complete | See [NOTEBOOK_TECHNICAL_ARCHITECTURE.md](./NOTEBOOK_TECHNICAL_ARCHITECTURE.md) |
| Implementation ACT | ❌ Not granted | Awaiting explicit approval |

---

## 2. Acceptance criteria checklist (Phase 0.5)

| # | Criterion | Doc |
|---|-----------|-----|
| 1 | Notebook Page definition | [NOTEBOOK_WORKSPACE_ARCHITECTURE.md](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md) §1 |
| 2 | Core workflows | §2 |
| 3 | Navigation model | [NOTEBOOK_NAVIGATION_MODEL.md](./NOTEBOOK_NAVIGATION_MODEL.md) |
| 4 | Page types | [NOTEBOOK_PAGE_TYPES.md](./NOTEBOOK_PAGE_TYPES.md) |
| 5 | Relationship model | [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md) |
| 6 | AI strategy | [NOTEBOOK_AI_STRATEGY.md](./NOTEBOOK_AI_STRATEGY.md) |
| 7 | Future-proofing | [NOTEBOOK_WORKSPACE_ARCHITECTURE.md](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md) §7 |
| 8 | Healthcare use cases | [NOTEBOOK_HEALTHCARE_USE_CASES.md](./NOTEBOOK_HEALTHCARE_USE_CASES.md) |
| 9 | Notebook vs Place | [NOTEBOOK_WORKSPACE_ARCHITECTURE.md](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md) §8 |
| 10 | Implementation readiness | This doc |
| 11 | Phase 1 scope | §4 below |

---

## 3. Existing assets reusable for Phase 1

| Asset | Reuse |
|-------|-------|
| `NotesModule.tsx` | Page editor + templates |
| `web/src/api/notes.ts` | Page CRUD |
| Todo module UI / API | Embedded task list |
| `registerBuiltInModules` pattern | Add `notebook` manifest block |
| `seedNotesModule.ts` / `seedTodoModule` | Keep; add `seedNotebookModule` facade |
| `BusinessWorkspaceContent` | New `case 'notebook'` |
| Widget registry pattern | `notebook` widget |

---

## 4. Recommended Phase 1 scope (MLVP)

### 4.1 In scope — minimum lovable Notebook

**Product:** Staff open **one Notebook hub** and complete “meeting notes → tasks” without leaving the module.

| # | Deliverable | Layer |
|---|-------------|-------|
| 1 | `moduleId: 'notebook'` in built-ins + seed manifest (facade) | Startup |
| 2 | `NotebookWorkspaceLanding.tsx` | Web |
| 3 | Routes `/notebook`, `/business/.../workspace/notebook` | Web |
| 4 | `BusinessWorkspaceContent` + `BrandedWorkDashboard` notebook entry | Web |
| 5 | Shell layout: sidebar (Home, Recent, Favorites, My Pages, Templates, Tasks, Shared, Trash) | Web |
| 6 | Compose existing `NotesModule` as page editor | Web |
| 7 | Embed Todo list panel (existing API client) | Web |
| 8 | **Promote to task** UI → `POST /api/todo` (existing) | Web |
| 9 | Page type metadata via tags (`type:meeting`, `type:daily`) + 4 templates | Web |
| 10 | `notebook` widget (recent page + due task count) | Web |
| 11 | `registerBuiltInModules` AI context (facade keywords; delegate providers) | Server |
| 12 | Optional read-only `GET /api/notebook/summary` aggregator | Server (optional) |

### 4.2 Explicitly out of Phase 1

| Item | Target phase |
|------|--------------|
| `notebookLinkService` / schema | 2 |
| `notebookAIActionService` / extract tasks | 2 |
| Notes `*Service` extraction | 2 (hygiene, not standalone Notes wave) |
| Global Trash handler for notes | 1.5 or 2 |
| Section block JSON schema | 3 |
| Deprecate `/notes` sidebar | 2 |
| SOP page type (first-class) | 2 |
| Calendar/Event embeds | 2 |
| Place embeds | 2 |
| Notebook Level 3 certification audit | Post Phase 2 |

### 4.3 Todo / Notes constraints (Phase 1)

- **Zero** changes to `todo*Service`, `todoController` behavior, trash handlers, PE dual.
- **Zero** changes to Notes controllers except optional read aggregator under `/api/notebook` if approved.
- **No** Prisma migrations for Notebook.

---

## 5. Risks before implementation

| Risk | Severity | Mitigation |
|------|----------|------------|
| Three module ids (`notes`, `todo`, `notebook`) confuse provisioning | Medium | Notebook depends on notes+todo installed; manifest `dependencies` |
| Manifest capability lies inherited from notes | Medium | Notebook manifest truthful; don’t copy `trash: true` without handler |
| Large `NotesModule` hard to embed | Low | Shell wraps component; refactor later |
| Users expect full AI extract Day 1 | Medium | Label “Coming soon”; manual promote-to-task |
| Healthcare daily workflow needs auto daily page | Low | Phase 1.1 |

---

## 6. Pre-flight before Phase 1 ACT

| Step | Owner |
|------|-------|
| Product sign-off on MLVP §4.1 | Product |
| UX wireframe: 3-pane desktop + mobile tabs | Design |
| Architecture sign-off on no-Todo-touch rule | Architecture |
| Create `NOTEBOOK_PHASE1_IMPLEMENTATION_PLAN.md` when ACT granted | Engineering |
| Optional: lightweight `NOTEBOOK_CONSTITUTIONAL_AUDIT.md` (facade-only) | Engineering |

---

## 7. Minimum lovable product (final recommendation)

**Ship this first:**

> **Notebook hub** = sidebar navigation + **Home** (pinned pages + due tasks) + **meeting/daily templates** + **page editor** (existing Notes) + **Tasks panel** + **“Promote to task”** — personal and business workspace routes, one widget, facade AI context only.

**Success sentence for pilot facilities:**

*“After Tuesday leadership meeting, the dietary manager opens Notebook, finishes notes in the template, promotes three action items to tasks with owners, and sees them in the same sidebar Tasks view — without opening a separate Todo module.”*

**Do not ship first:** AI extraction, persisted cross-links, SOP governance, Place embeds, or Notes service modernization.

---

## 8. Phase timeline (planning)

| Phase | Duration (est.) | Theme |
|-------|-----------------|-------|
| **0.5** | Complete | Product + workspace architecture |
| **1** | 4–6 weeks | MLVP shell (UI + manifest) |
| **1.5** | 2 weeks | Trash parity, Drive picker deep link |
| **2** | 6–8 weeks | NotebookLink + AI extract + embeds |
| **3** | TBD | Search, sections schema, manifest consolidation |

---

*Roadmap: [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md).*
