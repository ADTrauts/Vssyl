# Business Workspace Wave 1B — Hub Standardization and Boundary Cleanup

**Status:** **Complete** — implementation wave  
**Date:** 2026-06-14  
**Wave:** Business Workspace **1B**  
**Prior:** [BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md](./BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md)

> **No Workspace certification. No Reference Workspace registration. No UX certification changes.**

---

## Required report

| # | Topic | Outcome |
|---|-------|---------|
| 1 | Stub widget disposition | **Deleted** — replaced with hub panel + segment redirects |
| 2 | Landing file disposition | **4 deleted** — canonical entries documented |
| 3 | Members ownership resolution | **Redirect** to `/workspace/members` (canonical nested route) |
| 4 | Drive boundary removals | **Moved** to `DriveWorkspaceLanding` |
| 5 | Dashboard bootstrap consolidation | **Single path** — `ensureBusinessDashboard` + `useEnsureBusinessDashboard` |
| 6 | Remaining WS-L1 blockers | **4** (down from 9) — see §6 |
| 7 | Recommended Wave 1C scope | Navigation contract tests + segment URL migration — see §7 |

**Validation:** `pnpm type-check` **PASS** · no orphan landing imports · stub widgets removed from shell

---

## 1. Stub widget disposition (1B-1)

| Widget | 1A issue | 1B disposition | Replacement |
|--------|----------|----------------|-------------|
| `BusinessDashboardWidget` | Mock product stats in shell | **Delete** | `BusinessWorkspaceHubPanel` — orchestration-only copy |
| `BusinessAnalyticsWidget` | Mock analytics in shell | **Delete** | `BusinessWorkspaceModuleRedirect` → `/workspace/analytics` |
| `BusinessMembersWidget` | Mock members in shell | **Delete** | `BusinessWorkspaceModuleRedirect` → `/workspace/members` |

**Default case:** `BusinessWorkspaceHubPanel` (was stub dashboard).

---

## 2. Landing file disposition (1B-2)

| File | 1A status | 1B disposition | Canonical entry |
|------|-------------|----------------|-----------------|
| `NotebookWorkspaceLanding.tsx` | Dead | **Delete** | `NotebookShell` |
| `HRWorkspaceLanding.tsx` | Dead | **Delete** | `HRLayout` |
| `SchedulingWorkspaceLanding.tsx` | Dead | **Delete** | `SchedulingLayout` |
| `VLinkWorkspaceLanding.tsx` | Dead | **Delete** | `VLinkModule` |

**New module entry:**

| File | Action | Role |
|------|--------|------|
| `DriveWorkspaceLanding.tsx` | **Create** | File Hub business entry — owns sidebar/upload/folder |

**Unchanged active landings:** `PlaceWorkspaceLanding`, `TodoWorkspaceLanding`, `CalendarWorkspaceLanding`, `AIWorkspaceLanding`.

---

## 3. Members ownership resolution (1B-3)

| Path | Before | After |
|------|--------|-------|
| `?module=members` / `?module=connections` | Stub `BusinessMembersWidget` | Redirect → `/business/:id/workspace/members` |
| `/workspace/members` | `WorkMembersPage` (real API) | **Canonical** — unchanged |
| `buildBusinessWorkspaceModuleHref('members')` | Segment URL | Unchanged ✅ |

**Ownership:** Member list UI = **nested route** (`WorkMembersPage`). Shell = **redirect only**.

---

## 4. Drive boundary removals (1B-4)

**Removed from `BusinessWorkspaceContent`:**

- `handleFileUpload` / `executeCreateFolder` / `DriveCreateFolderModal`
- Inline `WorkspaceSplitLayout` + `DriveSidebar` wiring
- `refreshTrigger` / `selectedFolder` state

**Added:** `web/src/components/drive/DriveWorkspaceLanding.tsx` — module-owned File Hub business entry.

**Switch case `drive`:** `<DriveWorkspaceLanding dashboardId businessId />` only.

---

## 5. Dashboard bootstrap consolidation (1B-5)

| Artifact | Path | Role |
|----------|------|------|
| `ensureBusinessDashboard` | `web/src/lib/ensureBusinessDashboard.ts` | Canonical fetch-or-create |
| `useEnsureBusinessDashboard` | `web/src/hooks/useEnsureBusinessDashboard.ts` | Hook for layout wrapper |
| `DashboardLayoutWrapper` | Uses hook | **Single bootstrap owner** |
| `workspace/page.tsx` | Returns `null` | Hub deferred to layout wrapper |

**Removed:** ~165 lines duplicate bootstrap in `DashboardLayoutWrapper` · ~280 lines in `workspace/page.tsx`.

---

## 6. Remaining WS-L1 blockers

| # | Blocker | Status after 1B | Wave |
|---|---------|-------------------|------|
| B-1 | Stub product UI in shell | ✅ **Resolved** | 1B |
| B-2 | Dead landing files | ✅ **Resolved** | 1B |
| B-3 | Drive handlers in shell | ✅ **Resolved** | 1B |
| B-4 | Dual mount paths | 🟡 **Partial** — members/analytics unified; HR/scheduling/notebook nested paths remain | 1C |
| B-5 | Duplicated dashboard bootstrap | ✅ **Resolved** | 1B |
| B-6 | Members duplicate UI | ✅ **Resolved** | 1B |
| B-7 | No navigation contract tests | ⏳ Open | 1C |
| B-8 | Dual URL model (query vs segment) | 🟡 **Partial** — analytics segment added; drive/chat/todo/place still query | 1C |
| B-9 | Registry vs switch drift | ⏳ Open | 1C |

**WS-L1 verdict:** **6/9 blockers resolved** — eligible for WS-L1 reassessment after **1C**.

---

## 7. Recommended Wave 1C scope

| Task | Target |
|------|--------|
| **1C-1** | Contract tests: `resolveBusinessWorkspaceModule`, `buildBusinessWorkspaceModuleHref`, `hasNestedWorkspaceRoute` |
| **1C-2** | Segment URL migration for `drive`, `chat`, `calendar`, `todo`, `place`, `ai` |
| **1C-3** | Registry ⊆ switch drift test |
| **1C-4** | WS-L1 reassessment gate |

---

## 8. Canonical module entry paths (1B-6)

| `moduleId` | Canonical entry | Mount type |
|------------|-----------------|------------|
| `dashboard` | `BusinessWorkspaceHubPanel` | Shell hub |
| `drive` | `DriveWorkspaceLanding` | Module landing |
| `chat` | `ChatModuleWrapper` | Module wrapper |
| `calendar` | `CalendarWorkspaceLanding` | Thin landing |
| `todo` | `TodoWorkspaceLanding` | Thin landing |
| `notebook` / `notes` | `NotebookShell` | Module shell |
| `place` | `PlaceWorkspaceLanding` | Full publisher hub |
| `ai` | `AIWorkspaceLanding` | Thin landing |
| `hr` | `HRLayout` | Module layout |
| `scheduling` | `SchedulingLayout` | Module layout |
| `vlink` | `VLinkModule` | Platform module |
| `members` / `connections` | `/workspace/members` → `WorkMembersPage` | Nested route |
| `analytics` | `/workspace/analytics` → `WorkAnalyticsPage` | Nested route |

---

## 9. Files changed

| File | Change |
|------|--------|
| `BusinessWorkspaceContent.tsx` | Slim switch; stubs removed |
| `DriveWorkspaceLanding.tsx` | **New** |
| `BusinessWorkspaceHubPanel.tsx` | **New** |
| `BusinessWorkspaceModuleRedirect.tsx` | **New** |
| `ensureBusinessDashboard.ts` | **New** |
| `useEnsureBusinessDashboard.ts` | **New** |
| `DashboardLayoutWrapper.tsx` | Hook bootstrap |
| `workspace/page.tsx` | Null deferral |
| `businessWorkspaceNavigation.ts` | Analytics segment href |
| `*WorkspaceLanding` (4 dead) | **Deleted** |

---

## Related

- [BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md](./BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md)
- [REFERENCE_WORKSPACE_CHARTER_REVIEW.md](./REFERENCE_WORKSPACE_CHARTER_REVIEW.md)

---

**Last updated:** 2026-06-14 (Wave 1B complete)
