# Business Workspace Route Inventory

**Status:** Authoritative (Wave 1D)  
**Date:** 2026-06-03  
**Surface:** `/business/:businessId/workspace/*`  
**Contracts:** [WORKSPACE_ROUTING_CONTRACT.md](./WORKSPACE_ROUTING_CONTRACT.md) · `businessWorkspaceContracts.ts`

> **Mount rule:** `shouldRenderWorkspaceChildren(pathname)` chooses App Router `children` vs `BusinessWorkspaceContent` switch.

---

## 1. Hub

| Path | `page.tsx` | Renderer | Notes |
|------|------------|----------|-------|
| `/business/:id/workspace` | `workspace/page.tsx` | `null` deferral | Layout + `ensureBusinessDashboard` own bootstrap |

---

## 2. Segment-switch modules (switch mount)

Switch renders module entry; segment `page.tsx` (when present) is **null deferral** only.

| Segment | `moduleId` | Entry component | `page.tsx` | Disposition (1D) |
|---------|------------|-----------------|------------|------------------|
| `drive` | drive | `DriveWorkspaceLanding` | ✅ null deferral | Retained |
| `chat` | chat | `ChatModuleWrapper` | ✅ null deferral | **Replaced** (was mock UI) |
| `calendar` | calendar | `CalendarWorkspaceLanding` | ✅ null deferral | **Replaced** (was mock UI) |
| `todo` | todo | `TodoWorkspaceLanding` | — absent | Switch-only (no page file) |
| `place` | place | `PlaceWorkspaceLanding` | — absent | Switch-only |
| `ai` | ai | `AIWorkspaceLanding` | ✅ null deferral | **Replaced** (was `BusinessAIControlCenter`) |
| `vlink` | vlink | `VLinkModule` | ✅ null deferral | **Replaced** (was legacy `?module=` redirect) |

**CI:** `businessWorkspaceRouteHygiene.test.ts` enforces null deferral for present segment-switch pages.

---

## 3. Segment-page modules (App Router children)

First segment in `WORKSPACE_CHILD_ROUTE_SEGMENTS` — `children` render; switch redirects or defers.

| Segment | `moduleId` | Entry component | Nested routes |
|---------|------------|-----------------|---------------|
| `members` | members | `WorkMembersPage` | — |
| `analytics` | analytics | `WorkAnalyticsPage` | — |
| `notebook` | notebook | `NotebookShell` | `notebook/page/[pageId]` |
| `hr` | hr | `HRLayout` | `hr/me`, `hr/team` |
| `scheduling` | scheduling | `SchedulingLayout` | `scheduling/me`, `scheduling/team` |
| `settings` | — | Module settings surfaces | `settings/webhooks`, etc. |
| `developer-portal` | — | Partner dev portal | `developer-portal/modules/[moduleId]` |
| `modules` | — | Module management | — |

**Switch behavior:** `members`, `connections`, `analytics` cases use `BusinessWorkspaceModuleRedirect` to segment-page hrefs when reached via legacy paths.

---

## 4. Redirect routes

| Path | Type | Target | Retained? |
|------|------|--------|-----------|
| `workspace/notes/page.tsx` | Client redirect | `/workspace/notebook` | ✅ **Certified exception** — `notes` alias |
| Hub `?module=:id` | Resolve-only | `resolveBusinessWorkspaceModule` | ✅ Legacy compatibility (no new links) |

---

## 5. Orphan disposition summary (Wave 1D)

| Former artifact | Classification | 1D action |
|-----------------|----------------|-----------|
| `chat/page.tsx` mock UI | **Dead** | Replaced with null deferral |
| `calendar/page.tsx` mock UI | **Dead** | Replaced with null deferral |
| `ai/page.tsx` `BusinessAIControlCenter` | **Dead** | Replaced with null deferral |
| `vlink/page.tsx` `?module=vlink` redirect | **Dead** (legacy) | Replaced with null deferral |
| `drive/page.tsx` | **Null deferral** | Unchanged |
| `notes/page.tsx` | **Active redirect** | Unchanged |

**No mock product UI remains on segment-switch `page.tsx` files.**

---

## 6. Related artifacts

| File | Role |
|------|------|
| `web/src/lib/businessWorkspaceContracts.ts` | `WORKSPACE_CHILD_ROUTE_SEGMENTS`, switch contracts |
| `web/src/lib/businessWorkspaceNavigation.ts` | `shouldRenderWorkspaceChildren`, href builder |
| `web/src/components/business/BusinessWorkspaceContent.tsx` | Switch mount |
| `web/src/components/business/DashboardLayoutWrapper.tsx` | Children gate |
| `web/src/lib/__tests__/businessWorkspaceRouteHygiene.test.ts` | Segment-switch hygiene CI |

*Last updated: 2026-06-03 (Business Workspace Wave 1D)*
