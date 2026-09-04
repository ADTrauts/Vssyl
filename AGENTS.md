# Vssyl — Repository Agent Instructions

## Purpose

This file gives coding agents the smallest durable mental model needed to work safely across the Vssyl monorepo.

It is an orientation and decision-guardrail document, not a replacement for the scoped rules in `.cursor/rules/` or the canonical architecture documents under `docs/architecture/`.

**Core principle:** understand and extend the existing system before creating another system beside it.

---

## 1. Source-of-truth hierarchy

Use this order when sources disagree:

1. **Repository code, configuration, migrations, and tests** — implementation truth.
2. **`docs/VSSYL_SOURCE_OF_TRUTH.md`** — repository-wide authority and document placement.
3. **`docs/architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md` and constitutional architecture documents** — platform boundaries and architecture law.
4. **Certification/status records** — dated implementation maturity and findings.
5. **`memory-bank/`** — product intent and carefully maintained current context. It may lag implementation or architecture.
6. **Guides and examples** — operational help, not architecture authority.
7. **Archived, deprecated, historical, phase, closeout, and session documents** — historical evidence only.

### Conflict rule

- If code and a constitutional/current architecture document disagree, **do not silently choose one**. Identify the conflict before changing behavior.
- If two documents disagree, find the owner in `docs/architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md`.
- If Memory Bank and architecture docs disagree about architecture, **architecture wins**.
- If Memory Bank and code disagree about current implementation, **code wins**.
- Historical documents must never be used as prescriptive design authority.

---

## 2. Context-loading discipline

Do **not** read the entire Memory Bank or documentation tree by default.

Default discovery sequence for every substantive task:

1. This file (`AGENTS.md`) — agent orientation and cross-repository operating guidance.
2. `docs/VSSYL_SOURCE_OF_TRUTH.md` — repository-wide authority and document placement.
3. Inspect the actual task-relevant code paths, callers, tests, data models, and configuration.
4. Use `docs/architecture/VSSYL_ARCHITECTURE_INDEX.md` to locate the canonical architecture document for the affected domain.
5. Load only the task-relevant scoped `.cursor/rules/*.mdc` and canonical documents.
6. Load targeted Memory Bank product context (`memory-bank/*ProductContext.md`, and similar) only when product intent for that area is relevant.
7. Load `memory-bank/activeContext.md` or `memory-bank/progress.md` only when current workstream status, recent implementation history, sequencing, or unfinished work is materially relevant.
8. Read `docs/archive/` or deprecated documents only for archaeology, migration history, or when explicitly requested.

Do **not** treat `activeContext.md` or `progress.md` as universal baseline reads.

**Never assume that a document is current because it is in `memory-bank/` or has “complete”, “canonical”, “current”, “plan”, or “source of truth” in its prose. Verify its authority and status.**

---

## 3. Vssyl mental model

Vssyl is a **contextual operational platform**, not a collection of disconnected SaaS modules.

The product supports personal and business operating contexts through a shared platform and modular applications. The platform supplies common infrastructure so individual modules do not reinvent it.

### Platform responsibilities

Cross-cutting platform capabilities include, as applicable:

- identity, authentication, tenancy, and authorization
- Policy Engine and trust-boundary enforcement
- application/module lifecycle and registry behavior
- workspace and navigation contracts
- domain events, activity, realtime delivery, and notifications
- storage and File Hub integration
- Global Trash / lifecycle behavior
- V_Link, relationships, and context graph capabilities
- unified search/discovery
- AI / Digital Life Twin orchestration
- governed background execution and platform jobs
- shared UX/design system
- billing/entitlements and administrative control-plane capabilities

### Application responsibilities

Applications/modules remain the systems of record for their own entities and business rules.

A module may consume platform capabilities. It must not create a competing platform capability simply because doing so is locally convenient.

---

## 4. Monorepo map

- `web/` — Next.js 14 / React / TypeScript frontend.
- `server/` — Express / TypeScript backend, Passport/JWT, Socket.IO, platform services, AI runtime.
- `shared/` — shared TypeScript types/utilities.
- `prisma/` — modular Prisma schemas and migrations.
- `.cursor/rules/` — scoped agent rules. Treat these as executable development constraints.
- `docs/architecture/` — architecture law, contracts, status/certification, decision records.
- `docs/ux/` — UX constitution, tokens, patterns, audits.
- `docs/guides/` — how-to and onboarding.
- `docs/deployment/` and `docs/setup/` — operational deployment/setup truth.
- `docs/plans/` — future execution plans, not proof of shipped behavior.
- `docs/archive/` — historical material, not current guidance.
- `memory-bank/` — product intent and bounded current context, not architecture authority.

---

## 5. Reuse-first / consolidation-first

Before creating or materially changing a route, service, resolver, model, schema concept, component, registry, context provider, AI layer, permission system, scheduler, event mechanism, or document:

1. Search the repository using multiple relevant names and concepts.
2. Find the existing canonical owner.
3. Trace its callers and consumers.
4. Check tests and contracts protecting it.
5. Check whether a legacy parallel path already exists.
6. Prefer extension, migration, consolidation, or deletion of duplication over adding another abstraction.
7. Create something new only when the existing owner cannot safely satisfy the requirement.

**Do not solve architectural confusion by introducing another layer.**

If an existing implementation fully satisfies the requirement, use it as-is.

---

## 6. Backend ownership and mutation boundaries

Follow the current scoped rules, especially:

- `.cursor/rules/api-and-auth.mdc`
- `.cursor/rules/backend-trust-boundaries.mdc`
- `.cursor/rules/policy-engine.mdc`
- `.cursor/rules/domain-events.mdc`

### Required shape

For canonical mutations, the intended flow is:

`UI/API/AI/workflow -> authenticated boundary -> canonical domain service -> validation + authorization -> persistence/transaction -> events/activity -> realtime/notifications/analytics`

### Must

- Resolve actor identity from verified authentication.
- Treat client-supplied `userId`, `businessId`, `dashboardId`, `householdId`, resource IDs, socket payloads, and webhook payloads as untrusted.
- Prove tenant membership/ownership before protected reads or writes.
- Keep business/domain mutation logic in canonical services.
- Emit domain events only after successful mutations.
- Preserve auditability and authorization on AI-initiated actions.

### Must not

- Put new business logic directly in Express route definitions/controllers when a canonical service should own it.
- Let AI, workflows, sockets, or UI bypass canonical services.
- Treat V_Link membership, workspace visibility, or a client-provided context ID as authorization by itself.
- Copy an existing legacy violation as a pattern for new work.

---

## 7. Authorization and Policy Engine

Centralized authorization lives under `server/src/auth/`; use `docs/architecture/POLICY_ENGINE.md` and `.cursor/rules/policy-engine.mdc`.

Important migration reality:

- Policy Engine rollout is **partial**.
- Some routes intentionally use dual enforcement with legacy checks.
- Do not remove legacy checks until the Policy Engine covers equivalent behavior and tests prove parity.
- Do not expand a parallel org-chart/RBAC permission engine for platform authorization.
- New protected behavior should align with the canonical Policy Engine direction and fail closed.

---

## 8. Prisma and data model

Follow `.cursor/rules/database-prisma.mdc`.

- Edit `prisma/modules/**/*.prisma`.
- **Never hand-edit `prisma/schema.prisma`; it is generated.**
- Build/generate the schema through the root pnpm scripts.
- Schema changes require migrations.
- Never edit an already-applied migration; create a new migration.
- Do not reset a database to fix drift unless destructive data loss is explicitly intended and approved.
- Preserve tenant ownership/scoping in models and queries.

Use the current code/schema as truth. Old data-model examples in Memory Bank are not authoritative.

---

## 9. Modules, registry, workspaces, and navigation

The module system is governed platform infrastructure.

For module work, consult:

- `memory-bank/moduleSpecs.md`
- `docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`
- `docs/architecture/REFERENCE_MODULE_CATALOG.md`
- relevant module certification/operation matrix
- relevant `.cursor/rules/module-*.mdc`

### Workspace routing

For business workspace routing, `docs/architecture/WORKSPACE_ROUTING_CONTRACT.md` and the referenced code contracts are authoritative.

- Use canonical navigation/resolver helpers.
- Do not hand-build new business workspace URLs.
- Do not add new `?module=` navigation; that form is legacy resolve-only.
- Do not create shell stub UI that impersonates module data.
- Respect `hub`, `segment-switch`, and `segment-page` mount contracts.
- Keep registry, contract, renderer, navigation, and drift tests aligned.

Canonical terminology matters:

- User-facing **File Hub** is commonly represented by module id/code name `drive`.
- Use `todo`, not legacy `tasks`, where the platform contract specifies `todo`.
- Follow explicit alias/normalization contracts rather than creating new aliases.

---

## 10. AI / Digital Life Twin

Before significant AI work, read in this order:

1. `docs/architecture/AI_SYSTEM_MENTAL_MODEL.md`
2. `docs/architecture/AI_READING_GUIDE.md`
3. `docs/architecture/AI_DOCUMENT_STATUS_MATRIX.md`
4. the canonical subsystem document(s) for the task
5. relevant implementation and tests

### Stable AI mental model

- Vssyl AI is a **governed Digital Life Twin**.
- Personal and Business Twins are scopes over a **shared runtime**, not separate competing intelligence engines.
- Applications remain systems of record.
- AI gathers authorized context and may act only through normal application/service boundaries.
- Model providers are replaceable adapters, not product architecture.
- Knowledge, context, memory, retrieval, intelligence, model routing, response shape, skills, and execution are distinct concerns.
- Do not collapse them into one generic “AI engine”.
- Do not create a second Twin orchestration path to solve a local feature.
- Treat `/api/ai/twin` as the canonical conversational Twin route unless current code and canonical docs explicitly establish a successor.
- Business scope is carried through the shared runtime with business authorization/policy.
- The response contract (`conversation`, `grounded_answer`, `enterprise`) shapes response behavior; it is not a synonym for business-vs-personal or grounded-vs-ungrounded.
- AI actions inherit the user’s authority. AI never gains broader access than the actor.
- Do not describe deprecated `ContinuousLearning`, old “centralized AI”, legacy BusinessAIDigitalTwin interaction paths, or historical autonomy concepts as current architecture.
- Check `AI_DOCUMENT_STATUS_MATRIX.md` before relying on any older AI plan, summary, deep dive, or phase document.

When touching `DigitalLifeTwinCore`, routing, context providers, prompts, assemblers, tools, memory, learning, providers, or skills, first determine **which layer owns the decision**. Avoid reintroducing duplicate resolution in downstream layers.

---

## 11. Search and knowledge

- Unified Search architecture is governed by `docs/search/SEARCH_CONSTITUTION.md` and current search architecture docs.
- Do not use the historical `memory-bank/globalSearchProductContext.md` redirect stub (or its archived body) as architecture authority.
- AI retrieval/search must preserve normal authorization and tenant filtering.
- V_Link/context relationships, application search, AI retrieval, and external/web capabilities are separate concepts.
- Do not claim a future/design-only external capability is shipped without confirming code and status.

---

## 12. Global Trash, lifecycle, events, and realtime

Use the platform systems instead of local variants when the domain is covered.

- Prefer Global Trash semantics and current lifecycle contracts.
- Preserve known migrations/legacy exceptions until their replacement is actually complete.
- Emit the correct domain/module activity only after successful state change.
- Realtime and notifications consume canonical state/events; they should not become alternate mutation owners.
- Do not add a new scheduler/`setInterval`/cron mechanism without first checking the Platform Job Registry direction and existing job ownership.

---

## 13. Frontend and UX

Read `docs/ux/UX_CONSTITUTION.md` for visual or interaction work and follow relevant frontend rules.

- Reuse shared components and Vssyl design tokens.
- Do not introduce a parallel token/design system inside a module.
- Support both light and dark modes where the surrounding surface does.
- Include loading, empty, error, disabled, and success states appropriate to the interaction.
- Keep destructive operations guarded and aligned with lifecycle/trash behavior.
- Target WCAG 2.1 AA.
- UX changes must not weaken authorization, tenancy, proxy, module, or workspace contracts.
- Prefer established reference-module patterns over one-off UI architecture.

---

## 14. Known technical debt is not precedent

The repository contains transitional and legacy paths. Their existence does not make them recommended patterns.

Before copying a pattern, check current architecture/status docs.

Known categories include:

- partial Policy Engine rollout / dual enforcement
- legacy org-chart permission paths
- direct Prisma access in some AI/action or older controller paths
- historical AI orchestration and provider-selection paths
- fragmented schedulers/background loops
- registry/manifest metadata drift
- legacy workspace route patterns
- lifecycle/trash inconsistencies in older modules
- historical Block-on-Block naming
- old Jest references despite current Vitest usage

When working near these areas, prefer migration toward the canonical platform contract rather than expanding the legacy path.

---

## 15. Validation commands

Use the scripts defined in the repository; prefer `pnpm`.

Common root commands:

```bash
pnpm dev
pnpm type-check
pnpm test
pnpm test:e2e
pnpm verify:ci
pnpm build
pnpm prisma:build
pnpm prisma:generate
pnpm prisma:migrate
```

Notes:

- Root `pnpm test` currently runs the server Vitest suite.
- E2E is separate: `pnpm test:e2e`.
- Server tests use **Vitest**, not Jest.
- For focused changes, run the narrow relevant tests first.
- For cross-cutting changes, run the broader type/build/test gates.
- If Prisma modules change, regenerate the schema/client and validate migration state.

Do not claim validation passed unless the command actually ran successfully.

---

## 16. Documentation discipline

Before creating a document, use `docs/guides/DOCUMENTATION_PLACEMENT.md`.

Placement:

- agent constraints -> `.cursor/rules/*.mdc` or this root `AGENTS.md`
- architecture/contracts/ADRs -> `docs/architecture/`
- UX law/patterns -> `docs/ux/`
- how-to/onboarding -> `docs/guides/`
- setup -> `docs/setup/`
- deployment/runbooks -> `docs/deployment/`
- future phased execution -> `docs/plans/`
- product intent -> `memory-bank/`
- completed session/history -> `docs/archive/`

### Documentation rules

- Prefer updating the canonical document over creating another overlapping document.
- Before editing architecture docs, check `ARCHITECTURE_SOURCE_OF_TRUTH.md`.
- Do not turn a phase plan or implementation summary into a second source of truth.
- Superseded material should be archived/deprecated according to `ARCHITECTURE_DOCUMENT_STANDARD.md`.
- Historical content may be preserved for auditability but must clearly point to the current canonical source.
- **Never archive or document literal credentials or secret payloads.** Redact them (`[REDACTED]`) rather than preserving them as “historical evidence.” Documentation may use placeholders only; runtime secrets belong in managed secret systems (e.g. Secret Manager).
- Keep current-context files bounded. Move completed narrative/history out of files intended for routine agent startup.
- Update indexes and redirects when moving documents.
- Do not resurrect archived material merely because semantic search surfaced it.

---

## 17. Change strategy

Default to:

- smallest safe change
- additive migration before destructive replacement
- canonical-owner reuse
- behavior preservation unless replacement is intentional
- explicit removal of duplication only after callers/tests are understood
- tests at the contract boundary
- documentation updates at the actual source of truth

For architecture-sensitive work, distinguish:

1. **what exists now**
2. **what is legacy/transitional**
3. **what the canonical target is**
4. **what is future/design-only**

Never present #3 or #4 as already shipped unless the code proves it.

---

## 18. Before finishing a task

State, as applicable:

- canonical owner used or changed
- legacy/duplicate path discovered
- files changed
- migration/data impact
- authorization/tenant impact
- tests/validation actually run
- documentation/source-of-truth updates
- unresolved conflicts or debt

Follow the repository’s current Plan/Act workflow in `.cursor/rules/core.mdc`; this file does not override task-mode instructions.
