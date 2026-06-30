# Architecture reference (`docs/architecture/`)

**Start here for platform architecture:** [`VSSYL_ARCHITECTURE_INDEX.md`](./VSSYL_ARCHITECTURE_INDEX.md)

Cross-cutting platform design notes. **Agent enforcement** lives in `.cursor/rules/` (short); this folder explains **why**, examples, anti-patterns, and review checklists.

Complement (not replace) `memory-bank/systemPatterns.md` for product-level architecture narrative.

---

## Governance (Phase 1 — canonical entry points)

| Document | Purpose |
|----------|---------|
| [**VSSYL_ARCHITECTURE_INDEX**](./VSSYL_ARCHITECTURE_INDEX.md) | Executive table of contents — **read first** |
| [**ARCHITECTURE_SOURCE_OF_TRUTH**](./ARCHITECTURE_SOURCE_OF_TRUTH.md) | Which doc owns each topic; edit policy |
| [**ARCHITECTURE_DOMAIN_MAP**](./ARCHITECTURE_DOMAIN_MAP.md) | Domain topology + certification status |
| [**ARCHITECTURE_HEALTH_REPORT**](./ARCHITECTURE_HEALTH_REPORT.md) | Documentation health metrics |
| [**AI_ARCHITECTURE_NAVIGATION_GUIDE**](./AI_ARCHITECTURE_NAVIGATION_GUIDE.md) | AI assistant decision trees |
| [**ARCHITECTURE_DOCUMENT_STANDARD**](./ARCHITECTURE_DOCUMENT_STANDARD.md) | Required template for new architecture docs |
| [**CERTIFICATION_LEDGER**](./CERTIFICATION_LEDGER.md) | Certification status dashboard |

---

## Constitutional & platform law

| Topic | Document | Cursor rule |
|-------|----------|-------------|
| **Platform standards** | [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) | `platform-standards.mdc` |
| **Application lifecycle** | [APPLICATION_LIFECYCLE.md](./APPLICATION_LIFECYCLE.md) | `module-development.mdc` |
| **Navigation discovery** | [NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md](./NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md) | — |
| Policy Engine | [POLICY_ENGINE.md](./POLICY_ENGINE.md) | `policy-engine.mdc` |
| Domain Events | [DOMAIN_EVENTS.md](./DOMAIN_EVENTS.md) | `domain-events.mdc` |
| Workspace runtime | [WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](./WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md) | `workspace-runtime.mdc` |
| Reference Workspace shell | [REFERENCE_WORKSPACE_PLATFORM_SHELL.md](./REFERENCE_WORKSPACE_PLATFORM_SHELL.md) | `module-development.mdc` |

---

## Workspace & routing contracts

| Topic | Document |
|-------|----------|
| Business routing | [WORKSPACE_ROUTING_CONTRACT.md](./WORKSPACE_ROUTING_CONTRACT.md) |
| Personal routing | [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](./PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) |
| Cross-surface transitions | [CROSS_SURFACE_TRANSITIONS.md](./CROSS_SURFACE_TRANSITIONS.md) |
| Reference Module Catalog | [REFERENCE_MODULE_CATALOG.md](./REFERENCE_MODULE_CATALOG.md) |

---

## AI architecture

| Topic | Document |
|-------|----------|
| AI platform constitution | [AI_PLATFORM_CONSTITUTION.md](./AI_PLATFORM_CONSTITUTION.md) |
| Overview / diagrams | [AI_PLATFORM_OVERVIEW.md](./AI_PLATFORM_OVERVIEW.md) |
| Digital Life Twin | [AI_TWIN_PROMPT_PIPELINE.md](./AI_TWIN_PROMPT_PIPELINE.md) |
| AI textbook | [AI_SYSTEM_TEXTBOOK.md](./AI_SYSTEM_TEXTBOOK.md) → [`ai-textbook/`](./ai-textbook/) |

---

## Platform capabilities

| Topic | Document |
|-------|----------|
| V_Link | [V_LINK.md](./V_LINK.md) |
| Global Trash | [GLOBAL_TRASH.md](./GLOBAL_TRASH.md) |
| Relationship Framework | [RELATIONSHIP_FRAMEWORK_INDEX.md](./RELATIONSHIP_FRAMEWORK_INDEX.md) |
| Platform entity model | [PLATFORM_ENTITY_MODEL.md](./PLATFORM_ENTITY_MODEL.md) |
| Search ADR | [SEARCH_ARCHITECTURE_DECISION_RECORD.md](./SEARCH_ARCHITECTURE_DECISION_RECORD.md) |

---

## Reference modules (architecture)

| # | Module | Doc |
|---|--------|-----|
| 1 | File Hub (L4) | [FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md](./audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md) |
| 2 | Chat (L3) | [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) |
| 3 | Calendar (L3) | [CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md) |
| 4 | Todo (L3) | [TODO_LEVEL3_CERTIFICATION_REVIEW.md](./audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md) |
| 5 | Place (L3) | [PLACE_LEVEL3_CERTIFICATION_REVIEW.md](./audits/PLACE_LEVEL3_CERTIFICATION_REVIEW.md) |

**Pattern catalog:** [`../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)

**Reference programs:** Architecture refs · UX refs ([`../ux/REFERENCE_MODULE_PROGRAM.md`](../ux/REFERENCE_MODULE_PROGRAM.md)) · Reference Workspace ([`audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md`](./audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md))

---

## Domain folders (program docs)

Each major domain has a `README.md` landing page under `docs/`:

[`search/`](../search/) · [`marketplace/`](../marketplace/) · [`dashboard/`](../dashboard/) · [`workspace/`](../workspace/) · [`analytics/`](../analytics/) · [`context-graph/`](../context-graph/) · [`account-platform/`](../account-platform/) · [`platform-kernel/`](../platform-kernel/) · [`business-operations/`](../business-operations/) · [`go-to-market/`](../go-to-market/) · [`ux/`](../ux/)

**Module audits:** [`audits/`](./audits/) — Phase 0 constitutional audits and QA evidence.

**How-to guides:** [`../guides/README.md`](../guides/README.md) — not architecture truth.

**Last updated:** 2026-06-29 (Architecture Governance Phase 1A)
