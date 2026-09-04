# Vssyl Application Rules — Quick Reference

Quick index for Cursor enforcement and procedures. Vssyl architecture/docs remain authoritative; Cursor configuration points to them rather than creating parallel governance.

## Authority layers

| Layer | Role | Location |
|-------|------|----------|
| **Agent orientation** | Cross-repository operating guidance and decision guardrails | Root `AGENTS.md` — **not** architecture law |
| **Executable constraints** | Scoped must/must-not coding rules | `.cursor/rules/*.mdc` |
| **Architectural truth** | Platform boundaries, contracts, certification | `docs/architecture/` |
| **Product intent / status** | Module product context and bounded current context | `memory-bank/` (selective reads; not universal baseline) |

## Workflow layers

| Layer | Use for | Project location |
|-------|---------|------------------|
| **Rules** | Non-negotiable must/must-not constraints | `.cursor/rules/` |
| **Skills** | Reusable procedures that load when relevant | `.cursor/skills/` |
| **Commands** | Explicit user-triggered workflows | `.cursor/commands/` |
| **Hooks** | Deterministic tool safety enforcement | `.cursor/hooks.json`, `.cursor/hooks/` |

Current procedures: `vssyl-architecture-discovery`, `vssyl-prisma-schema-change`, and `vssyl-cloud-agent-verify`. Explicit commands: `/architecture-audit` and `/verify`. The shell hook gates destructive Git, database, SQL, Google Cloud, and live-credential operations.

## Rule files (`.cursor/rules/`)

| File | Role | Long docs |
|------|------|-----------|
| **`source-of-truth.mdc`** | Repo vs Memory Bank; stop on conflicts | `docs/VSSYL_SOURCE_OF_TRUTH.md`, root `AGENTS.md` |
| **`core.mdc`** | Plan/ACT, reuse-first, selective context-loading | Root `AGENTS.md` |
| **`memory-bank.mdc`** | Selective Memory Bank reads; doc placement pointer | `docs/guides/DOCUMENTATION_PLACEMENT.md` |
| **`coding-standards.mdc`** | Index to split standards below | — |
| **`api-and-auth.mdc`** | API/auth/proxy/tenancy must/must-not constraints | — |
| **`typescript-quality.mdc`** | `any` policy, routers, Prisma JSON | — |
| **`database-prisma.mdc`** | Modular Prisma, migrations | `docs/guides/PRISMA_MIGRATION_DISCIPLINE.md` |
| **`storage-and-ai-attachments.mdc`** | GCS, vision pipeline | — |
| **`ui-standards.mdc`** | `shared/components`, contrast | `docs/ux/COMPONENT_STANDARDS.md` |
| **`ux-standards.mdc`** | UX constitution, tokens, layouts, a11y | `docs/ux/` |
| **`frontend-proxy-auth-consistency.mdc`** | Proxy, auth UX, providers | — |
| **`backend-trust-boundaries.mdc`** | Auth, tenancy, sockets, webhooks | — |
| **`policy-engine.mdc`** | Policy Engine v1 enforcement | `docs/architecture/POLICY_ENGINE.md` |
| **`domain-events.mdc`** | Domain vs module activity emission | `docs/architecture/DOMAIN_EVENTS.md` |
| **`workspace-runtime.mdc`** | Module/widget contracts | `docs/architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md` |
| **`runtime-state-boundaries.mdc`** | No runtime state / context leakage | same architecture doc |
| **`module-interoperability.mdc`** | `moduleSpecs.md` contract | `memory-bank/moduleSpecs.md` |
| **`module-development.mdc`** | Module integration must/must-not constraints | `docs/guides/MODULE_DEVELOPMENT_GUIDE.md` |
| **`third-party-modules.mdc`** | Marketplace modules | `docs/guides/THIRD_PARTY_MODULE_RULEBOOK.md` |
| **`release-safety-gates.mdc`** | CI, deploy, health | — |
| **`platform-standards.mdc`** | Runtime Kernel, tiers, read/write paths, drift | `docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` |

## Architecture docs (`docs/architecture/`)

| Doc | Use when |
|-----|----------|
| **`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`** | Platform architecture, module contract, governance, migration |
| `POLICY_ENGINE.md` | Adding or migrating authorization |
| `DOMAIN_EVENTS.md` | Choosing emitters, subscribers, sockets |
| `WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md` | Runtime contracts, module/widget metadata |
| `AI_SYSTEM_MENTAL_MODEL.md` / `AI_READING_GUIDE.md` / `AI_DOCUMENT_STATUS_MATRIX.md` | AI architecture discovery (not archived `AI_PLATFORM_PHASED_PLAN.md`) |

Index: `docs/architecture/README.md`

## UX docs (`docs/ux/`)

| Doc | Use when |
|-----|----------|
| **`UX_CONSTITUTION.md`** | Any UI change; token ownership |
| `DESIGN_TOKENS.md` | Colors, type, spacing, radius, shadows |
| `LAYOUT_PATTERNS.md` | New pages or shells |
| `UX_AUDIT_TEMPLATE.md` | Module UX review |

Index: `docs/ux/README.md`

**Platform hardening (May 2026):** Policy Engine v1 + dual enforcement on wired routes, domain event taxonomy/adoption, workspace realtime consolidation, marketplace certification gates, Drive PE-D1/D2 — see `memory-bank/progress.md` when status context is needed (Platform Hardening Phase Complete).

## Critical rules (must follow)

1. **Source of truth** — `docs/VSSYL_SOURCE_OF_TRUTH.md`; orientation in `AGENTS.md`; conflicts flagged before coding.
2. **Reuse-first** — `core.mdc`.
3. **Trust boundaries** — prove membership before IO (`backend-trust-boundaries.mdc`).
4. **Frontend proxy** — `/api/*` for browser calls (`frontend-proxy-auth-consistency.mdc`, `api-and-auth.mdc`).
5. **Policy Engine** — JWT before policy; fail closed (`policy-engine.mdc`).
6. **Events** — emit only after success; correct emitter (`domain-events.mdc`, `module-interoperability.mdc`).
7. **Tenancy** — scope by context (`api-and-auth.mdc`).
8. **Prisma** — edit `prisma/modules/**` only (`database-prisma.mdc`).
9. **Modules** — hub + contract + third-party gates (`module-development.mdc`, `third-party-modules.mdc`).
10. **Workspace runtime** — contracts + no state leakage (`workspace-runtime.mdc`, `runtime-state-boundaries.mdc`).
11. **Docs placement** — root exceptions: `README.md`, `AGENTS.md`; see `DOCUMENTATION_PLACEMENT.md`.

## When to open which rule

| Work | Rules |
|------|-------|
| Any task | `AGENTS.md`, `source-of-truth.mdc`, `core.mdc` (selective context-loading; not universal Memory Bank status reads) |
| API / server | `api-and-auth.mdc`, `backend-trust-boundaries.mdc`, `policy-engine.mdc`, `domain-events.mdc` |
| Frontend UI | `ui-standards.mdc`, **`ux-standards.mdc`**, `frontend-proxy-auth-consistency.mdc`, `runtime-state-boundaries.mdc` |
| Dashboard / business workspace runtime | `workspace-runtime.mdc`, `runtime-state-boundaries.mdc` |
| Schema / DB | `database-prisma.mdc` |
| New module (first-party) | `module-interoperability.mdc`, `module-development.mdc`, **`platform-standards.mdc`** |
| Marketplace / partner | `third-party-modules.mdc`, rulebook in `docs/guides/` |
| Deploy / CI | `release-safety-gates.mdc` |
| AI architecture | Architecture AI chain above; check `AI_DOCUMENT_STATUS_MATRIX.md` before older plans |

## Cursor and documentation placement

1. **Agent orientation** → root `AGENTS.md` (not architecture law).
2. **Agent constraints** → `.cursor/rules/*.mdc` (short; target &lt; 60 lines; use `globs` when scoped).
3. **Reusable agent procedures** → `.cursor/skills/<name>/SKILL.md`; reference canonical docs instead of copying them.
4. **Explicit repeatable workflows** → `.cursor/commands/*.md`; do not duplicate ordinary prompts.
5. **Deterministic safety** → `.cursor/hooks.json` + `.cursor/hooks/`; hooks do not teach architecture.
6. **Why, examples, anti-patterns, checklists** → `docs/architecture/` or `docs/guides/`.
7. **Product intent / status** → `memory-bank/`.
8. Prefer updating existing focused material; add a new Rule only for a distinct platform concern.
9. Cross-reference long docs; update this index and relevant README indexes with workflow changes.

## Legacy / deprecated

| File | Status |
|------|--------|
| `memory-bank/AI_CODING_STANDARDS.md` | **Deprecated** — use `.cursor/rules/typescript-quality.mdc`, `api-and-auth.mdc`, `coding-standards.mdc` |
| `docs/archive/session-summaries/AI_PLATFORM_PHASED_PLAN.md` | **Historical** — not current AI architecture/roadmap authority — use `docs/architecture/AI_SYSTEM_MENTAL_MODEL.md`, `AI_READING_GUIDE.md`, `AI_DOCUMENT_STATUS_MATRIX.md` |
| `docs/guides/MODULE_DEVELOPMENT_LONG_REFERENCE.md` | **Redirect** → `MODULE_DEVELOPMENT_GUIDE.md` |
| `docs/guides/POLICY_ENGINE.md`, `docs/guides/DOMAIN_EVENTS.md` | **Redirect** → `docs/architecture/` |

**Last updated:** 2026-09-03
