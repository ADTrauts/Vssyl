# AI Operations Center UX

> **Phase 4B notice:** Phase 4 initially introduced the AI Operations Center as a separate
> route. Phase 4B consolidated these capabilities into the canonical AI Pipeline Hub.
> Current UX: `/admin-portal/ai-pipeline/*` with `PipelineOperatorSubNav`.
> This document is retained for implementation history.

**Program:** AI Architecture Phase 4 (historical)  
**Surface (current):** `/admin-portal/ai-pipeline/*`  
**Legacy redirects:** `/admin-portal/ai/operations/*`

---

## Design system

Uses existing admin portal patterns:

- `AdminPortalPageShell` — page headers
- `AdminStatCard` — overview KPIs
- `Card`, `Badge`, `Button`, `Input`, `Spinner`, `Alert` from `shared/components`
- `AiOperationsSubNav` — section navigation
- `ExecutionExplorerTable` — sortable execution list
- `ExecutionTimelinePanel` — vertical timeline
- `OperationsStatusBadge` — workflow status colors
- `OperationsMetricGrid` — modular metric cards

No second admin UI theme.

---

## Key flows

### Execution Explorer

List → filter (search, provider) → detail drawer/page with timeline, tools, approvals, explainability, evaluations, corrections, regressions.

### Evaluation Queue

Filter by workflow status → bulk assign → per-row priority/severity (PATCH).

### Correction workflow

Review destination → approve routing (`routingApprovalStatus`) → assign owner — never auto-applies Twin changes.

### Explainability viewer

Embedded on execution detail; dedicated fields for provider, tools, approval, grounding, context — **no private CoT**.

### Replay preparation

Enter execution ID → preview current vs proposed → differences list → `canExecute: false`.

---

## Navigation

Added to Platform Controller sidebar under **AI & Diagnostics** → **AI Operations Center**.

Legacy `/admin/*` not used; optional redirect can point to `/admin-portal/ai/operations`.

---

## Responsive layout

Execution detail uses `lg:grid-cols-3` inspector pattern: main timeline + right-rail context/evals/corrections.
