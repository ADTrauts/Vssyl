# Business Workspace Operation Matrix

**Surface id:** `business-workspace` (platform shell)  
**Status:** Wave 2F re-audit (2026-06-14) — **aligned with WS-L2 prep**  
**Prior:** Wave 0 (2026-06-04) · Waves 1A–1D modernization  
**Related:** [BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md](./BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md) · [WORKSPACE_ROUTING_CONTRACT.md](../WORKSPACE_ROUTING_CONTRACT.md) · [BUSINESS_WORKSPACE_ROUTE_INVENTORY.md](../BUSINESS_WORKSPACE_ROUTE_INVENTORY.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — correct owner and layer |
| **P** | Partial — works; wrong layer, deferred path, or incomplete pipeline |
| **N** | Non-compliant or missing |
| **—** | Not applicable to shell |

**Owner:** `BW` = Business Workspace shell · `Biz` = Business domain · `Dash` = Dashboard platform · `Mod` = target product module · `Plat` = platform · `XWS` = cross-surface

**Columns:** PE = Policy Engine · Activity = module/platform activity · RT = realtime · AI = AI path

---

## Master operation matrix (re-audited)

| Operation | Owner | Service / UI | PE | Activity | RT | Trash | Notes | Status |
| --------- | ----- | ------------ | -- | -------- | -- | ----- | ----- | ------ |
| **Open business workspace hub** | BW | `BusinessWorkspaceHubPanel` | — | — | — | — | Switch `dashboard` case | **C** (was N stub) |
| **Resolve active module** | BW | `resolveBusinessWorkspaceModule` | — | — | — | — | Segment + legacy query resolve | **C** |
| **Build module href** | BW | `buildBusinessWorkspaceModuleHref` | — | — | — | — | Segment canonical 1C | **C** |
| **Children render gate** | BW | `shouldRenderWorkspaceChildren` | — | — | — | — | Prevents switch/page double-mount | **C** |
| **Nested route guard** | BW | `hasNestedWorkspaceRoute` + layout | — | — | — | — | HR/scheduling deep paths | **C** |
| **Ensure business dashboard** | BW + Dash | `ensureBusinessDashboard` | P | — | — | — | Centralized hook 1B+ | **P** |
| **Seed workspace resources** | BW | `businessWorkspaceSeeder` | — | — | — | — | On dashboard create | **C** |
| **Render module switch** | BW | `BusinessWorkspaceContent` | — | — | — | — | Authoritative mount | **C** |
| **Registry metadata lookup** | BW | `getModuleDefinition` | — | — | — | — | Non-authoritative void | **C** |
| **Filter installed modules** | BW | `BusinessConfigurationContext` | P | — | P | — | WebSocket partial | **P** |
| **Workspace runtime bridge** | BW | `WorkspaceRuntimeScopeBridge` | — | — | P | — | No contract tests | **P** (B-F3) |
| **Sidebar module list** | BW | `DashboardLayoutWrapper` | C | — | — | — | Segment navigation 1C | **C** |
| **Registry drift CI** | BW | `businessWorkspaceRegistryDrift.test.ts` | — | — | — | — | 9 tests | **C** |
| **Route hygiene CI** | BW | `businessWorkspaceRouteHygiene.test.ts` | — | — | — | — | 4 tests 1D | **C** |
| **Mount File Hub** | Mod | `DriveWorkspaceLanding` → wrapper | C | C | C | C | Null deferral page 1D | **C** |
| **Mount Chat** | Mod | `ChatModuleWrapper` | C | C | C | C | Mock page removed 1D | **C** |
| **Mount Calendar** | Mod | `CalendarWorkspaceLanding` | C | C | — | C | Mock page removed 1D | **C** |
| **Mount Todo** | Mod | `TodoModule` | C | C | — | C | Switch-only segment | **C** |
| **Mount Notebook** | Mod | `NotebookShell` | C | C | P | C | No landing file | **P** |
| **Mount Place (publisher)** | Mod | `PlaceWorkspaceLanding` | C | C | P | C | Switch `?module=place` **C**; segment `/place` **N** (RWS-F1) | **P** |
| **Mount HR** | Mod | `HRLayout` + nested routes | P | P | — | — | Landing deleted 1B; layout wired | **P** |
| **Mount Scheduling** | Mod | `SchedulingLayout` | P | P | — | — | Landing deleted 1B | **P** |
| **Mount V_Link** | Plat | `VLinkModule` | P | — | — | — | Null deferral 1D | **P** |
| **Mount AI** | Mod | `AIWorkspaceLanding` | P | — | — | — | Null deferral 1D | **P** |
| **Mount analytics** | Mod | Segment page `/analytics` | C | — | — | — | Real page; stub removed 1B | **C** |
| **Mount members** | Mod | Segment page `/members` | C | C | — | — | Real page; stub removed 1B | **C** |
| **Client drive upload in shell** | BW | — | — | — | — | — | **Removed** 1B | **C** (was P leak) |
| **Stub dashboard widget** | BW | — | — | — | — | — | **Deleted** 1B | **C** (was N) |
| **Stub analytics widget** | BW | — | — | — | — | — | **Deleted** 1B | **C** (was N) |
| **Stub members widget** | BW | — | — | — | — | — | **Deleted** 1B | **C** (was N) |
| **Work Tab module grid** | BW (XWS) | `BrandedWorkDashboard` | P | — | P | — | Parallel entry | **P** |
| **B→P transition** | XWS | `handleSwitchToPersonal` | — | — | — | — | RWS-09 QA PASS | **C** |
| **B→Place publisher** | XWS | Segment + switch | — | — | — | — | Segment 404; query works | **P** (RWS-F1) |
| **Global search / trash** | Plat | Header + right rail | — | — | — | C | Platform-global | **C** |
| **Install / uninstall module** | Plat | `moduleProvisionController` | C | P | — | — | PE tests exist | **C** |

---

## Manifest truth rows (re-audited)

| Module | Switch case | Hub / wrapper | Segment page | Matrix |
|--------|-------------|---------------|--------------|--------|
| `drive` | ✅ | `DriveWorkspaceLanding` | Null deferral | **C** |
| `chat` | ✅ | `ChatModuleWrapper` | Null deferral | **C** |
| `calendar` | ✅ | `CalendarWorkspaceLanding` | Null deferral | **C** |
| `todo` | ✅ | `TodoModule` | Absent (switch-only) | **C** |
| `notebook` | ✅ | `NotebookShell` | `/notebook` tree | **P** |
| `place` | ✅ | `PlaceWorkspaceLanding` | **Missing** — RWS-F1 | **P** |
| `hr` | ✅ | `HRLayout` | `/hr/*` nested | **P** |
| `scheduling` | ✅ | `SchedulingLayout` | `/scheduling/*` | **P** |
| `analytics` | ✅ | Segment redirect | `/analytics` | **C** |
| `members` | ✅ | Segment page | `/members` | **C** |
| `dashboard` | ✅ | `BusinessWorkspaceHubPanel` | Hub | **C** |
| `ai` | ✅ | `AIWorkspaceLanding` | Null deferral | **P** |
| `vlink` | ✅ | `VLinkModule` | Null deferral | **P** |

---

## Wave 1A–1D finding disposition

| ID | 1A / WS-L1 issue | Final status (2F) |
|----|------------------|-------------------|
| B-1–B-3 | Stub widgets | ✅ **Closed** (1B) |
| B-4 | Dead landings | ✅ **Closed** (1B delete) |
| B-5 | Drive upload in shell | ✅ **Closed** (1B) |
| B-6 | Dual mount orphan mocks | ✅ **Closed** (1D) |
| B-F1 | Orphan segment pages | ✅ **Closed** (1D) |
| B-F2 | Legacy `?module=` resolve-only | ⏳ **Intentional deferral** — resolve-only sunset policy TBD |
| B-F3 | Runtime scope contract tests | ⏳ **Deferred** — shared with personal |
| B-F4 | Stale operation matrix | ✅ **Closed** (2F this re-audit) |
| RWS-F1 | Place segment 404 | ⏳ **Open** — QA 2E; hygiene wave recommended |

---

## Summary counts (Wave 2F)

| Metric | C | P | N |
|--------|---|---|---|
| Shell orchestration rows | 16 | 6 | 0 |
| Mounted product modules | 8 | 5 | 0 |
| Manifest capability rows | 8 | 5 | 0 |

**P0 targets resolved since Wave 0:** stub dashboard/analytics/members (**N→C**), orphan mock pages (**closed 1D**), drive upload leak (**closed 1B**).

**Remaining P0/P1:** Place segment page (**RWS-F1**), runtime scope tests (**B-F3**), HR/scheduling landing parity (**P**).

---

*Last updated: 2026-06-14 (Wave 2F re-audit)*
