# Reference Workspace Program

**Domain:** Platform shell orchestration (Business + Personal co-surfaces)  
**Program:** Reference Workspace With Findings  
**Index:** [`../architecture/VSSYL_ARCHITECTURE_INDEX.md`](../architecture/VSSYL_ARCHITECTURE_INDEX.md) §2

---

## Purpose

Certified shell orchestration for Business Workspace (hub) and Personal Dashboard shell (grid + tabs). Governs module mounting, routing SSOT, and cross-surface transitions.

## Scope

Shell chrome consumption, hub/switch, widget grid **routing** — not module interiors or Dashboard widget product.

## Source of Truth

| Topic | Document |
|-------|----------|
| **Certification record** | [`WORKSPACE_CERTIFICATION_RECORD.md`](./WORKSPACE_CERTIFICATION_RECORD.md) |
| Platform shell spec | [`../architecture/REFERENCE_WORKSPACE_PLATFORM_SHELL.md`](../architecture/REFERENCE_WORKSPACE_PLATFORM_SHELL.md) |
| Ownership model | [`WORKSPACE_OWNERSHIP_MODEL.md`](./WORKSPACE_OWNERSHIP_MODEL.md) |
| Reference decision | [`WORKSPACE_REFERENCE_DECISION.md`](./WORKSPACE_REFERENCE_DECISION.md) |

## Reference Documents

- [`../architecture/WORKSPACE_ROUTING_CONTRACT.md`](../architecture/WORKSPACE_ROUTING_CONTRACT.md)
- [`../architecture/PERSONAL_DASHBOARD_ROUTING_CONTRACT.md`](../architecture/PERSONAL_DASHBOARD_ROUTING_CONTRACT.md)
- [`../architecture/CROSS_SURFACE_TRANSITIONS.md`](../architecture/CROSS_SURFACE_TRANSITIONS.md)
- [`WORKSPACE_PROGRAM_ARCHIVE.md`](./WORKSPACE_PROGRAM_ARCHIVE.md)

## Reference Implementations

- `BusinessWorkspaceContent.tsx` switch
- `DashboardLayoutInner` / `DashboardLayoutWrapper`
- `personalDashboardNavigation.ts`, `businessWorkspaceNavigation.ts`, `crossSurfaceNavigation.ts`

## Certification Status

**WS-L3 Certified WITH FINDINGS** — ratified 2026-06-19. **11 advisories** on certificate. Program **archived**.

## Related Domains

- [Navigation](../architecture/NAVIGATION_WORKSPACE_ARCHITECTURE_DISCOVERY.md)
- [Dashboard](../dashboard/) — product module (out of WS scope)
- [UX PlatformShell](../ux/audits/PLATFORMSHELL_CERTIFICATION.md)

## Open Decisions

- RWS-F1 Place publisher segment 404
- `WS-REF-*` pattern annex extraction (REG-B3)
- Runtime scope contract tests (B-F3)

**Last updated:** 2026-06-29
