# Vssyl_Business — Domain definition and canonical naming

**Purpose:** Single place to align language for the **business and enterprise** product area so specs, code, and AI sessions do not use conflicting names.

**Last updated:** 2026-05-16

## Cross-references

- [systemPatterns.md](./systemPatterns.md) — app flow, providers, Work tab → business workspace
- [databaseContext.md](./databaseContext.md) — `prisma/modules/business/*` file map
- [permissionsModel.md](./permissionsModel.md) — tenant scope and enforcement lifecycle
- [businessWorkspaceArchitecture.md](../docs/archive/session-summaries/business-workspace/businessWorkspaceArchitecture.md) — **historical** sync plan; trust **`WORKSPACE_ROUTING_CONTRACT.md`**, **`APPLICATION_LIFECYCLE.md`**, **`BusinessConfigurationContext`**, and **`web/src/lib/businessWorkspaceNavigation.ts`** for current wiring

---

## 1. What “Vssyl_Business” means

**Vssyl_Business** is a **product domain name**, not a separate repository or app. It covers:

- The `Business` organization and its data (`prisma/modules/business/`)
- Business-scoped dashboards and modules (install scope **business**)
- Subscription and feature gating for business/enterprise features
- Org chart and position-aware module access
- Business admin and employee-facing surfaces under `/business/...`
- The **Work** entry experience from the personal shell (Work tab + branded landing + work auth)

---

## 2. Surfaces — canonical names

Use these terms in PRs, Memory Bank updates, and plans:

| Canonical name | Description | Pointers |
|----------------|-------------|----------|
| **Personal dashboard shell** | Logged-in home with global tabs and sidebars | `/dashboard/...`, `DashboardLayoutInner`, `DashboardClient` |
| **Work tab** | Tab **inside the personal shell** for employer “go to work” | `web/src/components/WorkTab.tsx`; `showWorkTab` in layout/header |
| **Branded work landing** | Full-width chooser / work authentication UI after opening Work; uses business branding | `web/src/components/BrandedWorkDashboard.tsx` |
| **Business workspace** | Day-to-day employer tools: sidebar, business-scoped modules | Route family **`/business/:id/workspace/...`**. URL helpers: `web/src/lib/businessWorkspaceNavigation.ts`. Module contracts (v1, read-only metadata): `web/src/runtime/modules/` — see `docs/architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md` |
| **Business admin hub** | Business setup, module install, HR/admin, AI admin, etc. | **`/business/:id`** and nested admin routes (broader than workspace-only) |

**Rule:** In prose, **“business workspace”** = the **`/business/:id/workspace`** experience, not the Work tab alone.

---

## 3. “Enterprise” and “tier” — disambiguate

| Concept | Where it lives | Vocabulary |
|---------|----------------|------------|
| **User / platform feature gating** | `server/src/services/featureGatingService.ts` | Tiers: `free`, `pro`, `business_basic`, `business_advanced`, `enterprise` |
| **Business model column** | `Business.tier` in `prisma/modules/business/business.prisma` | Strings such as `free`, `standard`, `enterprise` — **not identical** to FeatureGating tier strings; compare carefully when debugging |
| **Module marketplace / module billing** | `Module` pricing fields; `BusinessModuleSubscription` | e.g. `pricingTier`, subscription `tier` like `premium` / `enterprise` — **module commercial** tier, not automatically the same as user or `Business.tier` |

**In writing:** say **“subscription tier”** (FeatureGating), **“Business.tier”** (DB field), or **“module commercial tier”** (marketplace/business module subscription).

---

## 4. Two RBAC layers (do not conflate)

| Layer | Schema / API idea | Use |
|------|-------------------|-----|
| **Business membership role** | `BusinessMember.role` — `ADMIN`, `MANAGER`, `EMPLOYEE`; flags `canInvite`, `canManage`, `canBilling` | Coarse org admin vs employee; invitations, billing, broad admin |
| **Org chart / position** | `OrganizationalTier`, `Position`, `EmployeePosition`, `PermissionSet`, `Permission` | Granular module/feature/action; **position-aware** module lists (`PositionAwareModuleProvider`, `BusinessConfigurationContext`) |

**In writing:** say **“business member role”** vs **“org position”** (or **“position permissions”**), not just **“role”** if both could apply.

---

## 5. Aliases and legacy strings

| Alias | Canonical / note |
|-------|-------------------|
| `connections` URL segment (under workspace) | Maps to **members** in `resolveBusinessWorkspaceModule` (`businessWorkspaceNavigation.ts`) |
| “File Hub” (UI) | Usually **Drive module** in business context; module id is still **drive** |
| “Org” in generic policy docs | May mean any organization; in schema the employer entity is **`Business`** |
| **Personal vs business module install** | `ModuleInstallation` (user) vs `BusinessModuleInstallation` (org) — always name the **scope** |
| `WorkAuth` / work token | **Vssyl work session** (business context on top of NextAuth), not a third-party IdP name |

---

## 6. Implementation pointers (read before changing behavior)

- Business module list + config: `web/src/contexts/BusinessConfigurationContext.tsx`
- Work tab and branded landing: `web/src/components/WorkTab.tsx`, `BrandedWorkDashboard.tsx`
- Position-aware + personal modules: `web/src/components/PositionAwareModuleProvider.tsx`
- Business workspace chrome: `web/src/components/business/DashboardLayoutWrapper.tsx`
- Work auth state: `web/src/contexts/WorkAuthContext.tsx` (`workToken`, `currentBusinessId`, `isWorkAuthenticated`)
- HR tier gating example: `server/src/middleware/hrFeatureGating.ts`

---

## 7. Change process

When naming or flow changes (e.g. rename a tab or a route), update this file in the same PR and add a one-line note to [activeContext.md](./activeContext.md) if the change is user-visible.
