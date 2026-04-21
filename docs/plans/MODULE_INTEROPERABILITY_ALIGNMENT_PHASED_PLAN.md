# Module Interoperability Alignment Phased Plan

Last updated: 2026-04-21  
Status: **Complete** (Phases 1–5)  
Owner: Platform Engineering / Andrew + AI agent

---

## Purpose

This document is the step-by-step source of truth for aligning Vssyl core modules and third-party modules to one shared architecture contract so systems can interoperate reliably across:

- Permissions and access control
- Activity/event logging
- Realtime propagation
- UI activity/feed consumers
- Notifications
- AI context integration
- Multi-tenant context and scoping
- Compliance/audit visibility

This plan is intentionally phased and execution-gated.

---

## Required Execution Protocol (for each phase run)

After each phase is implemented, the agent must:

1. Run agreed validation checks for touched scope.
2. Fix clear errors introduced by that phase.
3. Provide a concise run summary:
   - What changed
   - What passed
   - What failed or remains
   - Risk notes
4. Pause and ask exactly:
   - **"Phase N is complete. Ready to start Phase N+1?"**
5. Do not start the next phase without explicit user confirmation.

---

## Non-Goals

This initiative is not intended to:

1. Rewrite every module at once.
2. Replace stable behavior without integration value.
3. Merge unrelated feature work into this track.
4. Introduce conflicting standards across first-party and third-party modules.

---

## Current Integration Gaps (baseline)

1. Activity model is fragmented across Drive/Chat/feed aggregation.
2. Folder actions do not have full parity with file activity persistence.
3. Shared activity surfaces are not fully aligned to one event contract.
4. Realtime delivery is stronger in individual modules than shared cross-module feeds.
5. Permission inheritance policy (folder-to-file semantics) needs one explicit source of truth.
6. Third-party module requirements are documented but not fully normalized to core module contracts.

---

## Phase 1 - Canonical Contract and Documentation Foundation

### Objective
Define one interoperability contract for all modules (core + third-party), then publish it as canonical guidance.

### Scope
1. Define a canonical module contract:
   - context/tenant scoping
   - permission lifecycle (authorize -> execute -> emit -> notify)
   - normalized activity event envelope
   - realtime channel and visibility rules
   - notification metadata standards
   - AI context provider requirements
   - API proxy/auth conventions
   - observability and audit requirements
2. Update docs to make this enforceable by policy:
   - `memory-bank/moduleSpecs.md`
   - `docs/guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md`
   - `memory-bank/systemPatterns.md`
   - `memory-bank/permissionsModel.md`
   - `memory-bank/threadActivityProductContext.md`
   - `memory-bank/compliance.md`
3. Add module certification checklist requirements for review/approval.

### Acceptance Criteria
1. One clearly named canonical contract section exists and is cross-referenced.
2. Third-party guide mirrors first-party contract requirements.
3. Documentation explicitly distinguishes Activity vs Analytics.
4. Required phase-gate protocol is documented in this plan and followed.

### Suggested Validation
1. Manual doc consistency pass across updated files.
2. Verify no conflicting contract statements remain in touched docs.

---

## Phase 2 - Backend Event and Permission Flow Alignment

### Objective
Normalize backend action flow and close activity persistence gaps.

### Scope
1. Implement/standardize normalized activity event shape for core actions.
2. Close folder activity parity gap (schema + controller flow).
3. Ensure all critical action paths follow:
   - authorize
   - execute
   - emit/persist normalized event
   - trigger realtime delivery
4. Keep analytics derivation separate from activity event recording.

### Acceptance Criteria
1. Folder and file actions both generate normalized persisted activity.
2. Chat activity can be consumed through compatible normalized feed projection.
3. No action emits event prior to successful permission enforcement.
4. Multi-tenant context is included in activity visibility/scoping.

### Suggested Validation
1. `pnpm type-check`
2. Targeted integration tests for permission and tenant boundaries.
3. Targeted tests for activity emission paths (Drive/Folder/Chat).

---

## Phase 3 - Realtime and UI Consumer Alignment

### Objective
Align activity consumers to one shared contract and improve realtime consistency.

### Scope
1. Align UI consumers:
   - Folder details/activity view
   - Chat thread activity
   - Dashboard activity widget
2. Add push-assisted update flow for shared activity surfaces (poll fallback allowed).
3. Ensure event visibility is scoped by user membership/tenant context.

### Acceptance Criteria
1. Dashboard activity is contract-aligned and not solely ad hoc aggregation logic.
2. Folder and chat activity surfaces consume compatible event payloads.
3. Realtime updates reflect authorized, context-scoped events.

### Suggested Validation
1. `pnpm type-check`
2. Relevant integration tests for activity feed and websocket authorization.
3. Manual QA for dashboard/chat/drive activity update behavior.

---

## Phase 4 - Third-Party Module Enforcement and Project Rules

**Status:** Complete (2026-04-21)

### Objective
Make interoperability requirements enforceable for third-party modules and future core work.

### Scope
1. Update module review requirements to mandate contract compliance.
2. Update `.cursor/rules` guardrails to prevent architecture drift.
3. Add clear "must pass" certification checklist for module acceptance.
4. Ensure docs define first-party and third-party parity expectations.

### Acceptance Criteria
1. Third-party modules cannot be approved without contract-aligned permissions, events, scoping, and AI context.
2. Rules and docs are aligned and non-conflicting.
3. Enforcement path is documented (review + validation + tests).

### Suggested Validation
1. Rule/document consistency pass.
2. Dry-run checklist against one existing first-party module and one third-party sample module.

### Deliverables (completed)
- `.cursor/rules/module-interoperability.mdc` — always-on contract enforcement for agents.
- `.cursor/rules/module-development.mdc` — interoperability section + certification folded into approval requirements.
- `.cursor/rules/RULES_SUMMARY.md` — index and quick-reference for interoperability.
- `memory-bank/moduleSpecs.md` — enforcement path table.
- `docs/guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md` — enforcement path (review → approval).
- `docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md` — publish gate item (5) for certification checklist.
- `docs/test-modules/README.md` — dry-run pointer for checklist vs samples.

---

## Phase 5 - Stabilization and Rollout Verification

**Status:** Complete (2026-04-21)

### Objective
Finalize rollout confidence and operational handoff.

### Scope
1. Execute full verification pass on changed systems.
2. Confirm production-safe behavior and regression posture.
3. Publish final summary and remaining follow-ups (if any).
4. Update:
   - `memory-bank/activeContext.md`
   - `memory-bank/progress.md`

### Acceptance Criteria
1. Validation checks complete with documented outcomes.
2. Known residual risks are explicitly tracked with owners.
3. Plan status moved from Active to Complete (or Partial with open IDs).

### Suggested Validation
1. `pnpm type-check`
2. `pnpm test`
3. Optional targeted lint/tests for changed areas as needed

### Scope completed (final)
1. Repository verification: `pnpm type-check` and `pnpm test` at repo root (see table below).
2. Final summary and residual risks recorded here and in `memory-bank/activeContext.md`.
3. Memory bank updated: `memory-bank/activeContext.md`, `memory-bank/progress.md`.

### Validation run (documented outcomes)

| Command | Result |
|---------|--------|
| `pnpm type-check` | Pass — `shared`, `web`, `server` `tsc --noEmit` completed successfully. |
| `pnpm test` (server) | Pass — 30 files, 149 tests (Vitest). |

### Residual risks / follow-ups (tracked)

| ID | Risk / item | Owner | Notes |
|----|-------------|-------|--------|
| R1 | Certification checklist is **semantic**; full compliance still verified via **human review** + spot checks, not one automated suite. | Platform Engineering | By design per Phase 4; optional future tooling TBD. |
| R2 | Activity storage is **dual** (legacy `Activity` for file-scoped rows + `Log` `module_activity_event` for normalized events) until a future consolidation phase. | Platform Engineering | Feed and Drive details merge/project as implemented. |
| R3 | Some `getItemActivity` log queries are **actor-scoped** (`userId` on `Log`); shared-resource parity for all collaborators may need schema/query expansion later. | Platform Engineering | Expand if product requires full shared audit for shared folders/files. |

---

## Phase Run Summary Template

Use this after every phase run:

1. **Phase:** `Phase N - Name`
2. **Scope completed:**
   - Item 1
   - Item 2
3. **Validation run:**
   - Commands executed
   - Pass/fail by command
4. **Errors found and fixes applied:**
   - Error
   - Resolution
5. **Open risks / deferred items:**
   - Item
6. **Status:** Complete / Partial / Blocked
7. **Gate question:** **"Phase N is complete. Ready to start Phase N+1?"**

---

## Tracking Conventions

Use these statuses for phase tracking:

1. Backlog
2. Planned
3. In Progress
4. Blocked
5. Complete
6. Deferred

This document remains the source of truth for this interoperability initiative unless explicitly superseded here.

**Initiative closure:** Phases 1–5 complete as of 2026-04-21. Phase 5 validation and residual risks are recorded under **Phase 5** above.

