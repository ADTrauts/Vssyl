# UX Reference Pattern Catalog (Wave 6A)

**Status:** **Authoritative** — platform UX pattern registry  
**Date:** 2026-06-03  
**Wave:** 6A — UX Reference Pattern Extraction Program  
**Program:** [`REFERENCE_MODULE_PROGRAM.md`](./REFERENCE_MODULE_PROGRAM.md)  
**Closeout:** [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](./UX_REFERENCE_PROGRAM_CLOSEOUT.md)

---

## Summary

| Metric | Value |
|--------|------:|
| **Total patterns extracted** | **56** |
| **Canonical standard documents** | **9** |
| **Reference modules sourced** | **5** (#1–#5) |
| **Vacant UX slots** | **0** |

---

## Pattern ownership resolution (overlaps)

| Pattern family | **Primary owner** | Secondary references | Standard doc |
|----------------|-------------------|----------------------|--------------|
| `WorkspaceSplitLayout` | **Drive #1** | Todo #3, Calendar #5, AI #4 | [`WORKSPACE_PATTERNS.md`](./patterns/WORKSPACE_PATTERNS.md) |
| `PageHeader` + `PageToolbar` (workspace) | **Todo #3** | Calendar #5, AI #4 | WORKSPACE |
| `PageHeader` + `PageToolbar` (management) | **Notifications #2** | — | WORKSPACE UX-PAT-WS-010 |
| Mobile collapsible sheet (3C-7B) | **Calendar #5** | Notifications #2, AI #4 | [`MOBILE_PATTERNS.md`](./patterns/MOBILE_PATTERNS.md) |
| `ConfirmModal` soft delete | **Drive #1** | Todo, Calendar, NTF, AI | [`CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md`](./patterns/CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md) |
| Drag-to-trash confirm | **Drive #1** | Todo #3, AI #4 | CONFIRMATION |
| `EmptyState` primitive | **Drive #1** | Todo #3, AI #4, Calendar #5 | [`EMPTY_STATE_PATTERNS.md`](./patterns/EMPTY_STATE_PATTERNS.md) |
| `ContextMenu` | **Drive #1** | Calendar #5 (event chips) | CONFIRMATION UX-PAT-DES-008 |
| `DropdownMenu` row actions | **Notifications #2** | Todo #3, AI #4 | CONFIRMATION UX-PAT-DES-008 |
| Business hub landing | **Todo #3** | Drive, Calendar, AI | [`NAVIGATION_PATTERNS.md`](./patterns/NAVIGATION_PATTERNS.md) |
| Multi-view toggles | **Todo #3** | Drive (grid modes) | WORKSPACE |
| Time-grid shell | **Calendar #5** | — | WORKSPACE UX-PAT-WS-004 |
| Feed / inbox | **Notifications #2** | — | CROSS_MODULE |
| Twin / AI workspace | **AI #4** | — | [`AI_EXPERIENCE_PATTERNS.md`](./patterns/AI_EXPERIENCE_PATTERNS.md) |
| Global trash UI | **Drive #1** | Todo, Calendar, AI | [`CROSS_MODULE_INTEGRATION_PATTERNS.md`](./patterns/CROSS_MODULE_INTEGRATION_PATTERNS.md) |
| Keyboard feed shortcuts | **Notifications #2** | Calendar #5 (`?` help) | [`ACCESSIBILITY_PATTERNS.md`](./patterns/ACCESSIBILITY_PATTERNS.md) |

---

## Master pattern index

### Workspace patterns ([`WORKSPACE_PATTERNS.md`](./patterns/WORKSPACE_PATTERNS.md))

| ID | Name | Primary | Secondary |
|----|------|---------|-----------|
| UX-PAT-WS-001 | WorkspaceSplitLayout (entity browser) | Drive #1 | Todo, Calendar, AI |
| UX-PAT-WS-002 | PageHeader + PageToolbar + split | Todo #3 | Calendar, AI |
| UX-PAT-WS-003 | WorkspaceSecondary detail panel | Drive #1 | Todo #3 |
| UX-PAT-WS-004 | Time-grid page shell | Calendar #5 | — |
| UX-PAT-WS-005 | Multi-view workspace | Todo #3 | Drive #1 |
| UX-PAT-WS-006 | Board view drag-and-drop | Todo #3 | Drive #1 |
| UX-PAT-WS-007 | Loading states | Drive #1 | All |
| UX-PAT-WS-008 | Event/entity drawer workflow | Calendar #5 | — |
| UX-PAT-WS-009 | Twin workspace (sidebar + thread) | AI #4 | — |
| UX-PAT-WS-010 | Management page shell (no split) | Notifications #2 | — |

### Navigation patterns ([`NAVIGATION_PATTERNS.md`](./patterns/NAVIGATION_PATTERNS.md))

| ID | Name | Primary | Secondary |
|----|------|---------|-----------|
| UX-PAT-NAV-001 | Business workspace hub landing | Todo #3 | Drive, Calendar, AI |
| UX-PAT-NAV-002 | Cross-module deep linking | Notifications #2 | — |
| UX-PAT-NAV-003 | Canonical cross-route navigation | AI #4 | — |
| UX-PAT-NAV-004 | Control-center tabs | AI #4 | NTF settings |
| UX-PAT-NAV-005 | Header quick-access overlay | AI #4 | NTF bell |
| UX-PAT-NAV-006 | View route quartet | Calendar #5 | — |
| UX-PAT-NAV-007 | Category/filter sidebar | Notifications #2 | Drive, Calendar |

### Mobile patterns ([`MOBILE_PATTERNS.md`](./patterns/MOBILE_PATTERNS.md))

| ID | Name | Primary | Secondary |
|----|------|---------|-----------|
| UX-PAT-MOB-001 | Collapsible sidebar sheet (3C-7B) | Calendar #5 | NTF, AI |
| UX-PAT-MOB-002 | Horizontal scroll canvas | Calendar #5 | Todo #3 |
| UX-PAT-MOB-003 | Responsive secondary panel | Todo #3 | Drive #1 |
| UX-PAT-MOB-004 | Mobile composer reachability | AI #4 | — |
| UX-PAT-MOB-005 | 375px QA matrix gate | Calendar #5 | All refs |

### Empty state patterns ([`EMPTY_STATE_PATTERNS.md`](./patterns/EMPTY_STATE_PATTERNS.md))

| ID | Name | Primary | Secondary |
|----|------|---------|-----------|
| UX-PAT-EMP-001 | Shared EmptyState primitive | Drive #1 | Todo, AI, Calendar |
| UX-PAT-EMP-002 | Filter-empty vs zero-data | Todo #3 | AI, Calendar, Drive |
| UX-PAT-EMP-003 | Welcome / no-selection empty | AI #4 | Drive #1 |

### Confirmation & destructive patterns ([`CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md`](./patterns/CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md))

| ID | Name | Primary | Secondary |
|----|------|---------|-----------|
| UX-PAT-DES-001 | Soft delete ConfirmModal | Drive #1 | Todo, Cal, NTF, AI |
| UX-PAT-DES-002 | Bulk delete ConfirmModal | Drive #1 | NTF #2 |
| UX-PAT-DES-003 | Drag-to-trash ConfirmModal | Drive #1 | Todo, AI |
| UX-PAT-DES-004 | Permanent delete confirm | Drive #1 | — |
| UX-PAT-DES-005 | Named entity create Modal | Drive #1 | — |
| UX-PAT-DES-006 | Recurrence scope sub-confirm | Calendar #5 | — |
| UX-PAT-DES-007 | Scheduling conflict confirm | Calendar #5 | — |
| UX-PAT-DES-008 | Action menus (Context/Dropdown) | Drive #1 / NTF #2 | Todo, AI, Cal |

### AI experience patterns ([`AI_EXPERIENCE_PATTERNS.md`](./patterns/AI_EXPERIENCE_PATTERNS.md))

| ID | Name | Primary | Secondary |
|----|------|---------|-----------|
| UX-PAT-AI-001 | Single engine page + embedded | AI #4 | — |
| UX-PAT-AI-002 | Conversation lifecycle menus | AI #4 | — |
| UX-PAT-AI-003 | Streaming composer + attachments | AI #4 | — |
| UX-PAT-AI-004 | Provider picker full vs embed | AI #4 | — |
| UX-PAT-AI-005 | Identity control center | AI #4 | — |
| UX-PAT-AI-006 | Explain / policy drawers | AI #4 | — |
| UX-PAT-AI-007 | Header quick-access twin | AI #4 | — |

### Cross-module patterns ([`CROSS_MODULE_INTEGRATION_PATTERNS.md`](./patterns/CROSS_MODULE_INTEGRATION_PATTERNS.md))

| ID | Name | Primary | Secondary |
|----|------|---------|-----------|
| UX-PAT-XMOD-001 | Global Trash integration | Drive #1 | Todo, Cal, AI |
| UX-PAT-XMOD-002 | Notification feed integration | Notifications #2 | All modules |
| UX-PAT-XMOD-003 | Drive attachment bridge | Drive #1 | Todo, AI, Cal |
| UX-PAT-XMOD-004 | Calendar bridge read surface | Todo #3 | Calendar #5 |
| UX-PAT-XMOD-005 | Realtime tenant-scoped | Notifications #2 | Cal, Chat arch |
| UX-PAT-XMOD-006 | Error toast surfacing | Notifications #2 | AI, Todo, Cal |
| UX-PAT-XMOD-007 | Feed selection + bulk actions | Notifications #2 | Drive #1 |
| UX-PAT-XMOD-008 | Scheduling integration bundle | Calendar #5 | — |
| UX-PAT-XMOD-009 | V_Link UX touchpoints | Drive #1 | Cal, Todo |

### Accessibility patterns ([`ACCESSIBILITY_PATTERNS.md`](./patterns/ACCESSIBILITY_PATTERNS.md))

| ID | Name | Primary | Secondary |
|----|------|---------|-----------|
| UX-PAT-A11Y-001 | Icon-only control labels | Todo #3 | AI, Cal, NTF |
| UX-PAT-A11Y-002 | Modal focus + Escape | Drive #1 | All |
| UX-PAT-A11Y-003 | Feed keyboard shortcuts | Notifications #2 | Calendar #5 |
| UX-PAT-A11Y-004 | Mobile panel toggle labels | Calendar #5 | AI, NTF |
| UX-PAT-A11Y-005 | View mode toggle labels | Todo #3 | Calendar #5 |
| UX-PAT-A11Y-006 | DropdownMenu menuLabel | AI #4 | Todo, NTF |
| UX-PAT-A11Y-007 | Dark mode readability | Todo #3 | Cal, NTF |

---

## Future-module inheritance matrix

| Module archetype | Required pattern families | Primary reference | Secondary |
|------------------|---------------------------|-------------------|-----------|
| **File / entity browser** | WS-001, DES-001/003/008, EMP-001, XMOD-001, A11Y-001/002 | **Drive #1** | Todo (toolbar) |
| **Inbox / notification feed** | WS-010, NAV-002, XMOD-002/007, DES-002, A11Y-003, MOB-001 | **Notifications #2** | Drive (bulk) |
| **Task / work management** | WS-002, WS-005/006, NAV-001, EMP-001/002, DES-001, MOB-003, XMOD-004 | **Todo #3** | Drive, Calendar |
| **AI / twin workspace** | WS-009, AI-001–007, NAV-003/005, MOB-001/004, DES-001/003, EMP-003 | **AI #4** | Calendar (sheet), Drive (trash) |
| **Scheduling / time-grid** | WS-004, NAV-006, WS-008, DES-006/007, MOB-001/002, XMOD-008, A11Y-003 | **Calendar #5** | Drive (menus/trash) |
| **Marketplace partner module** | NAV-001 + archetype row above | Matching reference | `moduleSpecs.md` |
| **Messaging (Chat)** | *Not UX Reference* — use Chat **architecture** #2 for code; target **5H-Chat-L2** for UX | — | NTF #2 for feed patterns only |

---

## Duplicate patterns consolidated

| Duplicate teaching | Canonical pattern | Retired / secondary citation |
|--------------------|-------------------|------------------------------|
| Split layout in 4 modules | UX-PAT-WS-001 | Cite Drive first; others as variants |
| Toolbar chrome in 4 modules | UX-PAT-WS-002 vs WS-010 | Split workspace → Todo; feed → NTF |
| Mobile sheet in 3 modules | UX-PAT-MOB-001 | Calendar 3C-7B is origin |
| Delete confirm in 5 modules | UX-PAT-DES-001 | Drive 3B program is superset |
| Empty UI in 4 modules | UX-PAT-EMP-001 | NTF local inline = certified exception |
| Hub landing in 4 modules | UX-PAT-NAV-001 | `module-development.mdc` + Todo template |
| Keyboard shortcuts | UX-PAT-A11Y-003 | NTF feed keys; Calendar `?` help variant |

---

## Remaining platform UX standard gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| Chat UX Reference #2 | **High** | Rejected 5B.3 — messaging archetype undocumented as UX reference |
| Place UX Reference #6 | **Medium** | Architecture #5 only; dual-surface UX not extracted |
| Drive 11-category rescore | **Low** | Pre-5A categories; F-8 mobile QA historical |
| Partner iframe enforcement | **Medium** | Patterns documented; marketplace gate not automated |
| Dedicated `FEED_PATTERNS.md` | **Low** | Covered under WS-010 + XMOD-002/007 + A11Y-003 |
| Dedicated `SCHEDULING_PATTERNS.md` | **Low** | Covered under WS-004/008 + DES-006/007 + XMOD-008 |
| `ACTION_PATTERNS.md` (non-destructive) | **Low** | Selection/quick actions in XMOD-007; create flows in DES-005 |
| Loading pattern standalone doc | **Low** | UX-PAT-WS-007 sufficient |
| Dark mode matrix standardization | **Medium** | R-AI-4, uneven across modules |
| Business Workspace shell reference | **High** | Reference Workspace Program chartered (6C) — WS-L1; inaugural candidate Business Workspace |

---

## Reference Workspace patterns (orchestration — not Wave 6A)

Module interior patterns above are **UX Reference** scope. **Platform orchestration** patterns are governed by the **Reference Workspace Program** (Wave 6C charter) — proposed `WS-REF-*` family, extraction deferred to Wave 6E.

| Layer | Owner | Examples |
|-------|-------|----------|
| Global chrome | Platform Shell sub-tier (3C-4F) | `PlatformShell`, `PlatformHeader`, `PlatformLeftSidebar` |
| Module mount + switch | Reference Workspace | `BusinessWorkspaceContent`, `businessWorkspaceNavigation` |
| Module interior split | UX #1 Drive | UX-PAT-WS-001 `WorkspaceSplitLayout` |
| Hub landing content | UX #3 Todo | UX-PAT-NAV-001 `[Module]WorkspaceLanding` |
| Publisher hub (mounted) | UX #6 Place (future) | `PlaceWorkspaceLanding` inside business switch |

**Charter:** [`../architecture/audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md`](../architecture/audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md)

---

## Related

- [`UX_CERTIFICATION_STANDARD.md`](./UX_CERTIFICATION_STANDARD.md)
- [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md)
- [`LAYOUT_PATTERNS.md`](./LAYOUT_PATTERNS.md)

**Last updated:** 2026-06-14 (Wave 6C-Reference-Workspace-Charter)
