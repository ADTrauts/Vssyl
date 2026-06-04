# Business Workspace Operation Matrix

**Surface id:** `business-workspace` (platform shell)  
**Status:** Wave 0 discovery (2026-06-04) — **not certified**  
**Related:** [BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md](./BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — correct owner and layer |
| **P** | Partial — works; wrong layer, stub, drift, or incomplete pipeline |
| **N** | Non-compliant or missing |
| **—** | Not applicable to shell |

**Owner:** `BW` = Business Workspace shell · `Biz` = Business domain · `Dash` = Dashboard platform · `Mod` = target product module · `Plat` = platform (module install, AI boundaries)

**Columns:** PE = Policy Engine · Activity = module/platform activity · Event = domain event · RT = realtime · AI = AI path

---

## Master operation matrix

| Operation | Owner | Service | Controller / UI | PE | Visibility | Activity | Event | Notification | RT | AI | Trash | V_Link | Notes |
| --------- | ----- | ------- | ----------------- | -- | ---------- | -------- | ----- | ------------ | -- | -- | ----- | ------ | ----- |
| **Open business workspace hub** | BW | — | `workspace/page.tsx` | — | — | — | — | — | — | — | — | — | Loads business + dashboard |
| **Resolve active module** | BW | — | `businessWorkspaceNavigation.ts` | — | — | — | — | — | — | — | — | — | Query + path segments |
| **Build module href** | BW | — | `buildBusinessWorkspaceModuleHref` | — | — | — | — | — | — | — | — | — | members/notebook segments |
| **Nested route guard** | BW | — | `hasNestedWorkspaceRoute` + layout | — | — | — | — | — | — | — | — | — | HR/scheduling deep paths |
| **Ensure business dashboard** | BW + Dash | `dashboardService` (create) | Client fetch `/api/dashboard` | P | — | — | — | — | — | — | — | — | Duplicated in page + layout wrapper |
| **Seed workspace resources** | BW | `businessWorkspaceSeeder` | Called from `dashboardService` | — | — | — | — | — | — | — | — | — | Drive folder, calendar, chat |
| **Render module switch** | BW | — | `BusinessWorkspaceContent` | — | — | — | — | — | — | — | — | — | Authoritative per runtime doc |
| **Registry metadata lookup** | BW | — | `getModuleDefinition` | — | — | — | — | — | — | — | — | — | Non-authoritative void lookup |
| **Filter installed modules** | BW | — | `BusinessConfigurationContext` + `PositionAwareModuleProvider` | P | — | — | — | — | P | — | — | — | WebSocket hooks partial |
| **Workspace runtime bridge** | BW | — | `WorkspaceRuntimeScopeBridge` | — | — | — | — | — | P | — | — | — | `BusinessLayoutRuntimeShell` |
| **Sidebar module list** | BW | — | `DashboardLayoutWrapper` | P | — | — | — | — | — | — | — | — | `displayModules` filter |
| **Mount File Hub** | Mod | `drive*Service` | `DriveModuleWrapper` + sidebar | C | C | C | C | C | C | C | C | C | Shell mounts only |
| **Mount Chat** | Mod | `chat*Service` | `ChatModuleWrapper` | C | C | C | C | C | C | C | C | C | |
| **Mount Calendar** | Mod | `calendar*Service` | `CalendarModuleWrapper` | C | C | C | C | C | — | C | C | C | `contextType=BUSINESS` |
| **Mount Todo** | Mod | `todo*Service` | `TodoModule` | C | C | C | C | C | — | C | C | C | |
| **Mount Notebook** | Mod | `notebook*Service` | `NotebookShell` | C | C | P | C | P | — | C | — | — | Not `NotebookWorkspaceLanding` |
| **Mount Place** | Mod | `place*Service` | `PlaceWorkspaceLanding` | C | C | C | C | P | P | C | C | C | Publisher surface |
| **Mount HR** | Mod | `hr*Service` | `HRLayout` | P | P | P | P | P | — | P | — | — | Landing file unwired |
| **Mount Scheduling** | Mod | scheduling services | `SchedulingLayout` | P | P | P | P | P | — | — | — | — | Landing file unwired |
| **Mount V_Link** | Plat | `vlinkService` | `VLinkModule` | P | P | — | — | — | — | P | — | C | |
| **Mount AI widget** | Plat | twin pipeline | `AIWidget` | P | — | — | — | — | — | P | — | — | `dashboardType=business` |
| **Stub business overview** | BW | — | `BusinessDashboardWidget` | — | — | N | N | N | — | — | — | — | Mock `setTimeout` stats |
| **Stub business analytics** | BW | — | `BusinessAnalyticsWidget` | — | — | N | N | N | — | — | — | — | Should be Analytics module |
| **Stub team members** | BW | — | `BusinessMembersWidget` | — | — | N | N | N | — | — | — | — | Should use `businessAPI` / Members |
| **Stub business calendar** | BW | — | `BusinessCalendarWidget` | — | — | N | N | N | — | — | — | — | **Unused** in switch (calendar uses wrapper) |
| **Client drive upload in shell** | BW | — | `handleFileUpload` in content | — | — | — | — | — | — | — | — | — | **P** — should live in Drive module |
| **Install module (business)** | Plat | `moduleProvisionController` | `/api/module/.../install` | C | — | P | C | — | — | — | — | — | PE + domain event tests exist |
| **Uninstall module** | Plat | `moduleProvisionController` | `/api/module/.../uninstall` | C | — | P | C | — | — | — | — | — | |
| **List business modules** | Plat | — | `getBusinessModules` | P | — | — | — | — | — | — | — | — | |
| **Create business** | Biz | — | `businessController.createBusiness` | P | — | P | C | P | — | — | — | — | Seeds default module installs |
| **Invite member** | Biz | — | `businessController.inviteMember` | P | — | P | C | C | — | — | — | — | Email + notification |
| **Update business** | Biz | — | `businessController.updateBusiness` | C | — | P | C | — | — | — | — | — | `businessUpdatePolicyDual` |
| **Business analytics API** | Biz | — | `getBusinessAnalytics` | P | — | — | — | — | — | — | — | — | Not shell |
| **Front page config** | — | `businessFrontPageService` | `/api/business-front/*` | P | — | — | — | — | — | — | — | — | **Adjacent** — not workspace |
| **AI business policy block** | Plat | `businessWorkspaceBoundaries` | `AIContextAssembler` | — | — | — | — | — | — | C | — | — | Read-only injection |
| **Employee AI access digest** | Plat | `workspaceAIPolicyDigest` | `/api/business-ai/...` | P | — | — | — | — | — | P | — | — | Business AI product |
| **Work Tab module grid** | BW | — | `BrandedWorkDashboard` | P | — | — | — | — | P | — | — | — | Parallel entry; shared config |

---

## Manifest truth rows (product modules — `businessWorkspace` capability)

Shell has **no manifest**. These rows track **declared vs wired** for modules mounted in the switch.

| Module | `capabilities.businessWorkspace` | Switch case | Hub / wrapper | Matrix |
|--------|----------------------------------|-------------|---------------|--------|
| `drive` | true | `drive` | `DriveModuleWrapper` | **C** |
| `chat` | true (manifest) | `chat` | `ChatModuleWrapper` | **C** |
| `calendar` | partial registry | `calendar` | `CalendarModuleWrapper` | **C** |
| `todo` | true | `todo` | `TodoModule` | **C** |
| `notebook` | true | `notebook` / `notes` | `NotebookShell` | **P** (no landing) |
| `place` | true | `place` | `PlaceWorkspaceLanding` | **C** |
| `hr` | true (seed) | `hr` | `HRLayout` | **P** |
| `scheduling` | true (seed) | `scheduling` | `SchedulingLayout` | **P** |
| `analytics` | registry only | `analytics` | **Stub widget** | **N** |
| `members` | registry only | `members` / `connections` | **Stub widget** | **N** |
| `dashboard` | core registry | `dashboard` | **Stub widget** | **N** |
| `ai` | registry | `ai` | `AIWidget` | **P** |
| `vlink` | registry | `vlink` | `VLinkModule` | **P** |

---

## Summary counts (Wave 0)

| Metric | C | P | N |
|--------|---|---|---|
| Shell orchestration rows | 4 | 14 | 4 |
| Mounted product modules (approx.) | 5 | 6 | 2 |
| Manifest capability rows | 5 | 5 | 2 |

**P0 modernization targets:** stub dashboard/analytics/members (**N**), duplicate dashboard bootstrap (**P**), unwired landing files (**P**), drive upload in shell (**P**).

---

*Last updated: 2026-06-04 (Wave 0)*
