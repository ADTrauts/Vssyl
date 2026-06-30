# Dashboard Module

**Domain:** Widget grid product (`moduleId: dashboard`)  
**Program:** Dashboard Wave 3 Modernization (archived)  
**Index:** [`../architecture/VSSYL_ARCHITECTURE_INDEX.md`](../architecture/VSSYL_ARCHITECTURE_INDEX.md) §3

---

## Purpose

Personal dashboard widget grid, layout persistence, widget registry, and escalation to full module routes.

## Scope

**Product module** — not the Personal Dashboard **shell** (orchestration). See boundary docs below.

## Source of Truth

| Topic | Document |
|-------|----------|
| **Program status** | [`DASHBOARD_STATUS_RECORD.md`](./DASHBOARD_STATUS_RECORD.md) |
| Certification | [`DASHBOARD_CERTIFICATION_RECORD.md`](./DASHBOARD_CERTIFICATION_RECORD.md) |
| Operation matrix | [`DASHBOARD_OPERATION_MATRIX.md`](./DASHBOARD_OPERATION_MATRIX.md) |
| Shell vs module boundary | [`../workspace-review/WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md`](../workspace-review/WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md) |

## Reference Documents

- [`DASHBOARD_WIDGET_BOUNDARY_MATRIX.md`](./DASHBOARD_WIDGET_BOUNDARY_MATRIX.md)
- [`DASHBOARD_PROGRAM_ARCHIVE.md`](./DASHBOARD_PROGRAM_ARCHIVE.md)
- [`../architecture/PERSONAL_DASHBOARD_WIDGET_CONTRACT.md`](../architecture/PERSONAL_DASHBOARD_WIDGET_CONTRACT.md)
- [`../../memory-bank/dashboardProductContext.md`](../../memory-bank/dashboardProductContext.md)

## Reference Implementations

- `web/src/app/dashboard/DashboardClient.tsx`
- `web/src/lib/widgetRegistry.ts`
- `server/src/services/dashboard/dashboardService.ts`

## Certification Status

**L3 Certified WITH FINDINGS** — ratified 2026-06-21. Program **archived**. Reference implementation **deferred**.

## Related Domains

- [Workspace](../workspace/) — shell orchestration
- [Applications](../architecture/APPLICATION_LIFECYCLE.md) — install vs assignment
- [Navigation](../architecture/NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md)

## Open Decisions

- Widget registry dual-path migration
- Business hub vs `DashboardClient` (by design — separate tracks)

**Last updated:** 2026-06-29
