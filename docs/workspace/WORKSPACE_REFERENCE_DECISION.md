# Workspace — Reference Decision (WS-L3-2)

**Program:** WS-L3-2 — Council Ratification  
**Date:** 2026-06-19  
**Authority:** RD-WS3-005  
**Status:** **RATIFIED** — governance only

---

## Council reference decisions

| Option | Considered | **Council decision** |
|--------|------------|----------------------|
| Reference Workspace Candidate | Superseded by 2026-06-14 registration | **Rejected** — already registered |
| **Reference Workspace With Findings** | WS-L3-1 recommendation | **RATIFIED** |
| Reference Workspace (plain) | Zero-finding bar | **Rejected** |
| Not Ready | — | **Rejected** |

---

## Ratified designation

| Field | Value |
|-------|-------|
| **Designation** | **Reference Workspace With Findings** |
| **Program** | Reference Workspace Module **#3** (UX program type — separate from arch #1–#5) |
| **Registration** | Approved with Findings (2026-06-14) — **affirmed** |
| **WS-L3 certification** | WS-L3 CERTIFIED WITH FINDINGS (2026-06-19) — **aligned** |
| **Holder model** | **Hybrid** — Platform Shell + Business Workspace shell + Personal Dashboard shell |

---

## Reference Workspace With Findings — criteria

| Criterion | Status |
|-----------|--------|
| WS-L3 WITH FINDINGS ratified | Yes |
| Registration complete | Yes (2026-06-14) |
| ENG-1 closed | Yes |
| Constitutional shell patterns | Navigation SSOT, switch authority, PlatformShell layering |
| Open advisories | 11 — on certificate |
| Pattern annex REG-B3 | Open — WITH FINDINGS suffix justified |

**Decision:** **APPROVED** as **Reference Workspace With Findings** — copy patterns with documented gaps (runtime scope tests, pattern annex, URL hygiene).

---

## Copy-worthy today

| Pattern | Source | Advisory note |
|---------|--------|---------------|
| Workspace navigation SSOT | `businessWorkspaceNavigation.ts`, `personalDashboardNavigation.ts` | — |
| Module switch authority | `BusinessWorkspaceContent.tsx` | — |
| Hub landing mount | `*WorkspaceLanding.tsx` | Per module |
| Segment-switch null deferral | `workspace/{segment}/page.tsx` | Include place (ENG-1) |
| Cross-surface transitions | `crossSurfaceNavigation.ts` | — |
| PlatformShell consumer | 3C-4E / 3C-4F | — |
| Drift enforcement | Registry ↔ switch ↔ contract CI | — |
| Runtime scope bridge | `WorkspaceRuntimeScopeBridge` | B-F3 — copy with gap |

**Not copy-worthy without Dashboard Wave 3:** Widget registry orchestration inside `DashboardClient` — **module product**, not shell reference.

---

## Denied / deferred

| Request | Decision |
|---------|----------|
| Plain Reference Workspace | **Denied** — 11 advisories + REG-B3 |
| Reference Implementation (L4 analog) | **Denied** |
| UX Reference #6 for Workspace | **Deferred** |
| Bundling Dashboard module into reference | **Denied** — hybrid boundary |

---

## Catalog placement (WS-L3-3 execution)

| Action | Target | Status |
|--------|--------|--------|
| Reference Workspace With Findings annex | `REFERENCE_MODULE_CATALOG.md` | **Executed** |
| Link platform shell spec | `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` | **Executed** |
| Cross-link WS-L3 evidence | [WORKSPACE_CERTIFICATION_RECORD.md](./WORKSPACE_CERTIFICATION_RECORD.md) | **Executed** |

---

## Related

- [WORKSPACE_REFERENCE_STATUS_RECORD.md](./WORKSPACE_REFERENCE_STATUS_RECORD.md)
- [WORKSPACE_REFERENCE_ASSESSMENT.md](./WORKSPACE_REFERENCE_ASSESSMENT.md)
- [WORKSPACE_COUNCIL_RATIFICATION.md](./WORKSPACE_COUNCIL_RATIFICATION.md)

**Last updated:** 2026-06-19 (WS-L3-3 EXECUTED)
