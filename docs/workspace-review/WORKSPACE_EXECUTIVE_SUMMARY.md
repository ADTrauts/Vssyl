---

⚠️ **Architecture Notice**

This document is retained for historical context.

The canonical Source of Truth for dashboard/shell boundary is:

[`WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md`](./WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md)

Workspace program status: [`../workspace/WORKSPACE_CERTIFICATION_RECORD.md`](../workspace/WORKSPACE_CERTIFICATION_RECORD.md)

Please update the canonical documents rather than this file.

---

# Workspace & Dashboard Executive Summary

**Program:** Workspace & Dashboard Constitutional Review  
**Date:** 2026-06-21  
**Audience:** Product, engineering leadership, architecture council  
**Status:** Discovery complete — **superseded by reality assessment + WS-L3 ratification**

---

## Bottom line

**Dashboard is hybrid — not one thing.** Reference Workspace (Business + Personal shells) is **already WS-L3 CERTIFIED WITH FINDINGS and archived**. The **Dashboard module** (`dashboard` id) is a **separate, true product module** at **L1** that was **explicitly excluded** from WS-L3. **Analytics is not a true module** — it is a **platform capability** with operator ownership in Admin Portal and a **mock business UI stub**.

**Outcome gate: Qualified A**

- **Dashboard Module Wave 3 should proceed** — scoped to widget product, services, registry, activity, tenancy boundary
- **Do not replace** with a Workspace Experience program — that would reopen an archived certification track
- **Rename** portfolio initiative to **Dashboard Module Wave 3** to prevent shell/module conflation
- **Analytics** requires a **scope lock** (platform capability vs product surface) before any L3 program

---

## Required questions — full answers

| # | Question | Answer |
|---|----------|--------|
| **1** | Is Dashboard a true module? | **Yes for widget/grid product** — registered built-in, services, AI context, widget registry. **No for shell and tenancy anchor** — those are workspace/platform concerns. |
| **2** | Is Dashboard a workspace composition surface? | **Yes for orchestration** (`DashboardLayoutInner`, business switch, navigation SSOT). **No for widget semantics** — `DashboardClient` is module interior. **Classification C — Hybrid.** |
| **3** | Should Dashboard have an independent certification track? | **Yes.** WS-L3 award kept Dashboard module out of scope. Module L1→L3 is the correct remaining track. |
| **4** | Should Dashboard be governed by Workspace instead? | **Shell layers: already are** (WS-L3 archived). **Module product: no** — separate ownership and certification. |
| **5** | Is Analytics a module? | **No.** Runtime pseudo-module only — not in `registerBuiltInModules.ts`, no manifest, no canonical services, mock business UI. |
| **6** | Is Analytics a platform capability? | **Yes — recommended primary class.** Derived reads, event subscribers, permission-gated rollups per ANALYTICS_PERMISSION_MODEL. |
| **7** | Is Analytics an Admin Portal responsibility? | **Yes for operator metrics** — `/admin-portal/analytics` is L3 canonical (Stage 0C). Distinct from tenant business analytics. |
| **8** | Is Analytics a Dashboard responsibility? | **No for domain ownership.** Dashboard hosts analytics **widgets** as projections only. |
| **9** | Are Dashboard and Analytics incorrectly modeled today? | **Yes.** Portfolio/ledger treat both as uncertified product modules without distinguishing shell vs module (Dashboard) or capability vs module (Analytics). |
| **10** | What is the correct long-term architecture? | **Three-layer model:** (1) Reference Workspace owns shell orchestration [done], (2) Dashboard module owns widget/grid product [Wave 3 target], (3) Platform Analytics Capability owns cross-module rollups with Admin Portal for operator metrics and module-owned domain analytics (HR, Place, Chat). |

---

## Outcome gate: A vs B

| Option | Verdict |
|--------|---------|
| **A. Dashboard remains standalone module; Dashboard Wave 3 proceeds** | **✅ Qualified YES** — proceed as **Dashboard Module Wave 3** with explicit shell exclusion |
| **B. Reclassify Dashboard as Workspace; replace Wave 3 with Workspace Experience program** | **❌ NO** — contradicts WS-L3 award boundaries; duplicates archived work |

---

## Architecture at a glance

```
Reference Workspace (WS-L3 CwF · ARCHIVED)
├── Business Workspace shell — switch, navigation, PlatformShell
└── Personal Dashboard shell — tabs, routes, PlatformShell
         │
         ├── mounts module interiors (Drive, HR, Chat, …)
         │
         └── hosts widget grid container ──► Dashboard MODULE (L1 · Wave 3 target)
                    │
                    └── widget projections ◄── Platform Analytics Capability (scope TBD)
                                              Admin Portal operator analytics (L3)
                                              Module domain analytics (HR, etc.)
```

---

## Key evidence

| Finding | Source |
|---------|--------|
| WS-L3 excludes Dashboard module | [WORKSPACE_CERTIFICATION_RECORD.md](../workspace/WORKSPACE_CERTIFICATION_RECORD.md) |
| Hybrid ownership Classification C | [WORKSPACE_OWNERSHIP_MODEL.md](../workspace/WORKSPACE_OWNERSHIP_MODEL.md) §Dashboard boundary |
| Dashboard = registered built-in #10 | [VSSYL_PLATFORM_STANDARDS](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §0.1 |
| Analytics = pseudo-module runtime only | Same §0.1 |
| Business analytics page is mock | `web/src/app/business/[id]/workspace/analytics/page.tsx` |
| Analytics not in module registration | `registerBuiltInModules.ts` — no `analytics` id |
| Business dashboard case is stub hub | `BusinessWorkspaceContent.tsx` → `BusinessWorkspaceHubPanel` |
| Tenancy + widgets share `Dashboard` entity | `prisma/modules/business/dashboard.prisma` |

---

## Recommended next initiatives (governance only)

| Priority | Initiative | Track |
|----------|------------|-------|
| **1** | **Dashboard Module Wave 3** — constitutional audit + service extraction + registry unification charter | Module L1→L3 |
| **2** | WS advisory burn-down (ENG-2, REG-B3, P-F*/B-F*) | Existing WS certificate |
| **3** | **Analytics scope lock** — platform capability vs business product surface | Platform capability charter |
| **4** | Platform kernel increment (Activity reads + Domain Events) | Unblocks honest analytics + future L3 claims |

**Do not:** Reopen Reference Workspace certification · Certify Analytics as module without scope lock · Conflate Dashboard shell work into Wave 3

---

## Deliverables index

| Document | Purpose |
|----------|---------|
| [WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md](./WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md) | Implementation inventory + hybrid determination |
| [DASHBOARD_DOMAIN_BOUNDARY_ANALYSIS.md](./DASHBOARD_DOMAIN_BOUNDARY_ANALYSIS.md) | Dashboard module vs shell boundaries |
| [ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md](./ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md) | Analytics ownership classes |
| [WORKSPACE_CERTIFICATION_MODEL_REVIEW.md](./WORKSPACE_CERTIFICATION_MODEL_REVIEW.md) | Certification track recommendations |
| This file | Executive brief |

---

## Stop condition

- Constitutional review **complete**
- No implementation work authorized herein
- No certification execution
- No ledger update
- No council activity
- No modernization packages created

**Last updated:** 2026-06-21
