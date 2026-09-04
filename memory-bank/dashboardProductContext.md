# Dashboard Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Architecture:** Workspace/Dashboard reality assessment, Dashboard status record, Application Lifecycle, Workspace Routing Contract

---

## Purpose

Dashboard is Vssyl’s **configurable home surface**: a place where people orient themselves, see what matters across their applications, and jump into work without losing context.

It is **not** the entire Vssyl platform shell. Persistent chrome (header, sidebars, global navigation) is the **workspace shell**. The Dashboard **product/module** is the widget-oriented surface that lives inside that environment.

## User Value

- One familiar front door after sign-in
- Persistent access to installed applications without restarting navigation from scratch
- A personalized overview built from the apps the user already uses
- Less context loss when moving between applications

## Core Product Model

### Workspace shell vs Dashboard product

| Concept | Product meaning |
|--------|------------------|
| **Workspace shell** | The persistent Vssyl environment and chrome through which applications are accessed (personal dashboard routes and business workspace routes). |
| **Dashboard product (`dashboard`)** | The configurable, widget-oriented home surface: layout, widgets, and saved preferences for that home. |

Users experience both together on personal home routes. Product language should still keep them distinct so Dashboard is not mistaken for “all of Vssyl.”

### Widgets as projections

- **Module / application = capability** (File Hub, Chat, Calendar, To-Do, and others).
- **Widget = projection** of that capability onto the home surface.
- Widgets are not independent duplicate applications. Deep work happens in the owning application; widgets summarize, shortcut, or surface status.

### Customization

Users can:

- add and remove widgets
- resize and rearrange them
- keep layout preferences for their home surface

Installed applications may be assigned to dashboard/tab membership separately from Marketplace install (Application Lifecycle owns that relationship).

## Context Behavior

- **Personal:** Primary home is a widget grid on personal dashboard routes, with persistent shell chrome for navigation.
- **Business:** Business workspace uses hub-oriented landing for the dashboard segment rather than the same personal widget-grid product surface. Do not assume business “full widget grid” parity with personal home.
- **Household / education:** Not currently defined as a product invariant for this ProductContext.

## Key Relationships

- **Application Manager / Marketplace:** Install ≠ assignment to a dashboard; Dashboard consumes installed applications as navigable modules and optional widgets.
- **File Hub, Chat, Calendar, To-Do, and other modules:** May appear as widgets or as destinations from shell navigation.
- **Always-available Chat:** Floating/docked chat is a Chat product surface that may appear over the shell; it is not itself a Dashboard widget requirement.
- **Work Tab:** Present in the personal shell as an entry toward work/business context. Its permanent product meaning is an open decision.

## Product Invariants

- Entering another application through the shell should not require abandoning the idea of a home surface to return to.
- Dashboard widgets project existing capabilities; they must not become a second system of record for those applications’ data.
- Personal and business home postures may differ; product language must not claim identical widget-grid behavior in both.
- Changing workspace routing implementation must not redefine Dashboard as “the whole platform.”

## Boundaries

Dashboard product intent does **not** own:

- Workspace URL policy or module mount contracts
- Policy Engine / authorization mechanics
- Analytics as a product (even if an analytics widget exists)
- Marketplace discovery/install flows
- Tenancy model redesign
- Blob storage, Chat realtime transport, or other module interiors

## Open Product Decisions

1. Whether Dashboard should be emphasized primarily as an **operational home (widgets)** vs a **launcher/chrome** experience.
2. Permanent product meaning of **Work Tab** (first-class personal→work entry vs shell convenience).
3. Household / education dashboard UX in-scope or out-of-scope for this product.

## Canonical References

- [`docs/workspace-review/WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md`](../docs/workspace-review/WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md) — shell vs module
- [`docs/dashboard/DASHBOARD_STATUS_RECORD.md`](../docs/dashboard/DASHBOARD_STATUS_RECORD.md) — module status/certification posture
- [`docs/architecture/APPLICATION_LIFECYCLE.md`](../docs/architecture/APPLICATION_LIFECYCLE.md) — install vs dashboard assignment
- [`docs/architecture/WORKSPACE_ROUTING_CONTRACT.md`](../docs/architecture/WORKSPACE_ROUTING_CONTRACT.md) — routing mounts
- [`docs/architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`](../docs/architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md) — runtime contracts
- Historical revitalization notes: [`docs/archive/session-summaries/DASHBOARD_REVITALIZATION_PROJECT.md`](../docs/archive/session-summaries/DASHBOARD_REVITALIZATION_PROJECT.md)
