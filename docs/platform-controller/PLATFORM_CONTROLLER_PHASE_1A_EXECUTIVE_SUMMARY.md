# Platform Controller — Phase 1A Executive Summary

**Program:** Platform Controller Program — Phase 1A — Information Architecture, Consolidation & Control Plane Design  
**Date:** 2026-06-24  
**Status:** Design complete — **Phase 1B implemented** (2026-06-24). See [Phase 1B Closeout](./PLATFORM_CONTROLLER_PHASE_1B_CLOSEOUT.md).

**Prior phase:** [Admin Portal Phase 0A](../admin-portal/ADMIN_PORTAL_PHASE_0A_EXECUTIVE_SUMMARY.md)  
**L3 Certified status:** **Unchanged** — remains valid

**Deliverables:** [Information Architecture](./PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md) · [Navigation Model](./PLATFORM_CONTROLLER_NAVIGATION_MODEL.md) · [Workflow Analysis](./PLATFORM_CONTROLLER_WORKFLOW_ANALYSIS.md) · [Platform Programs Hub Design](./PLATFORM_PROGRAMS_HUB_DESIGN.md) · [API Consolidation](./PLATFORM_CONTROLLER_API_CONSOLIDATION.md) · [UX Simplification](./PLATFORM_CONTROLLER_UX_SIMPLIFICATION.md) · [Naming Review](./PLATFORM_CONTROLLER_NAMING_REVIEW.md)

---

## Bottom line

Phase 1A defines how to transform the existing **Admin Portal** into a coherent **Platform Controller** through **consolidation only** — reorganizing 41 existing pages into 10 operator domains, introducing a **link-only Platform Programs hub** (no duplicate dashboards), elevating **Marketplace** to first-class navigation, and retiring redundant launchers (`AI System`, duplicate impersonation test routes, already-redirected legacy AI/BI pages).

**No runtime code changes were made.** Phase 1B may implement sidebar regrouping, the Programs hub shell, configuration tabs, and API proxy aliases.

---

## Strategic transition

| Dimension | Admin Portal (legacy identity) | Platform Controller (target identity) |
|-----------|-------------------------------|---------------------------------------|
| Operator mental model | "Find the admin page" | "Manage the platform capability" |
| Nav items | 22 across 6 sections | **14** destinations across 10 domains |
| Platform programs | Scattered / orphan | **Platform Programs hub** (federation) |
| Product name | Admin Portal | **Platform Controller** (shell copy first) |
| Route prefix | `/admin-portal` | **Unchanged until migration program** |

---

## Required recommendations summary

### Navigation & IA

- **10 domains:** Overview · Platform Programs · Marketplace · AI · Diagnostics · Operations · Providers · Security · Billing · Configuration (+ Operator Labs)
- **Platform Programs hub** at `/admin-portal/platform-programs` — cards linking to existing surfaces only
- **Marketplace** remains **separate top-level nav** (daily certification workflow) **and** Programs hub card (cross-program status)
- **Retire from nav:** AI System, duplicate test-impersonation routes
- **Merge under Configuration (nav):** governance + retention (tabs in 1B)

### Redundancy

| Category | Action |
|----------|--------|
| ai-system vs ai-pipeline | **Merge** nav → Programs hub |
| ai-learning, ai-context, business-intelligence | **Remove** from IA (redirects exist) |
| test-impersonation routes | **Remove** (redirect to impersonate) |
| dashboard vs analytics | **Leave** — summary vs deep metrics |
| Four marketplace probes | **Leave** — distinct capabilities |
| centralized-ai API | **Retire** (410) in future wave |

### Platform Programs hub

Five v1 programs with **existing homes**:

| Program | Deep link target |
|---------|------------------|
| Platform Kernel | `system`, `performance` |
| Unified Search | `modules` + readiness/probes |
| AI Retrieval | `ai-pipeline` |
| Context Graph | `ai-pipeline/sources`, modules AI Context tab |
| Marketplace Partner Runtime | `modules`, `developers` |

### API consolidation (documented)

- **P1 merges:** ai-providers, admin-override, module AI context → `/api/admin-portal/*`
- **P1 retire:** centralized-ai body
- **P3 retire:** emergency HTTP → CLI
- **21 mounts** fully dispositioned in [API Consolidation](./PLATFORM_CONTROLLER_API_CONSOLIDATION.md)

### Naming

- **User-facing:** Platform Controller
- **Architecture:** Platform Control Plane
- **No code renames** in Phase 1A

---

## Complete page disposition (required)

| Page | Disposition | Why |
|------|-------------|-----|
| `/admin-portal` | **Keep** | Entry redirect |
| `/admin-portal/dashboard` | **Rename** | → Platform Overview label |
| `/admin-portal/platform-programs` | **Merge** | **New hub** — links only (1B) |
| `/admin-portal/users` | **Keep** | Operations |
| `/admin-portal/moderation` | **Keep** | Operations |
| `/admin-portal/support` | **Keep** | Operations |
| `/admin-portal/impersonate` | **Keep** | Operations |
| `/admin-portal/billing` | **Keep** | Billing |
| `/admin-portal/pricing` | **Move** | Billing section |
| `/admin-portal/modules` | **Move** | Marketplace home |
| `/admin-portal/developers` | **Move** | Marketplace |
| `/admin-portal/ai-pipeline` | **Move** | AI / Programs (AI Retrieval) |
| `/admin-portal/ai-pipeline/*` (9 subpages) | **Keep** | AI depth |
| `/admin-portal/ai-system` | **Merge** | Absorb into Programs hub; drop nav |
| `/admin-portal/business-ai` | **Move** | Programs panel link |
| `/admin-portal/analytics` | **Keep** | Overview metrics |
| `/admin-portal/performance` | **Move** | Diagnostics |
| `/admin-portal/security` | **Keep** | Security |
| `/admin-portal/governance` | **Merge** | Configuration tab |
| `/admin-portal/retention` | **Merge** | Configuration tab |
| `/admin-portal/system-logs` | **Move** | Diagnostics |
| `/admin-portal/system` | **Move** | Configuration home |
| `/admin-portal/overrides` | **Hide** | Operator Labs |
| `/admin-portal/testing` | **Hide** | Operator Labs (gated) |
| `/admin-portal/seed-modules` | **Hide** | Operator Labs |
| `/admin-portal/ai-learning` | **Remove** | Redirect exists |
| `/admin-portal/ai-context` | **Remove** | Redirect exists |
| `/admin-portal/business-intelligence` | **Remove** | Redirect exists |
| `/admin-portal/debug-auth` | **Hide** | Debug |
| `/admin-portal/debug-session` | **Hide** | Debug |
| `/admin-portal/test-api` | **Hide** | Debug |
| `/admin-portal/test-auth` | **Hide** | Debug |
| `/admin-portal/test-impersonation` | **Remove** | Duplicate |
| `/admin-portal/impersonation-test` | **Remove** | Duplicate |

**Counts:** Keep 20 · Merge 6 · Move 12 · Rename 1 · Hide 9 · Remove 7

---

## Success criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Every existing capability has a logical home | ✅ § disposition table |
| 2 | Duplicate workflows identified | ✅ [Navigation Model §4](./PLATFORM_CONTROLLER_NAVIGATION_MODEL.md) |
| 3 | Platform Programs first-class concept | ✅ [Hub Design](./PLATFORM_PROGRAMS_HUB_DESIGN.md) |
| 4 | Navigation hierarchy simplified | ✅ 22 → 14 items |
| 5 | API consolidation documented | ✅ 21 mounts |
| 6 | Marketplace naturally integrated | ✅ Top-level + Programs card |
| 7 | Naming strategy defined | ✅ [Naming Review](./PLATFORM_CONTROLLER_NAMING_REVIEW.md) |
| 8 | No functionality duplicated | ✅ Hub is links-only |
| 9 | No runtime code changes | ✅ Phase 1A constraint met |

---

## Phase 1B implementation backlog (authorized next — not started)

| Priority | Item | Type |
|----------|------|------|
| P0 | Sidebar regroup per Navigation Model | IA |
| P0 | `platform-programs` link hub page | IA |
| P0 | Shell header → Platform Controller | Copy |
| P1 | Remove ai-system from nav (keep route) | IA |
| P1 | Redirect duplicate impersonation test routes | IA |
| P1 | Configuration tabs (governance + retention) | IA |
| P1 | API proxy aliases (providers, overrides, module AI) | API |
| P2 | Inline probe results on readiness card | UX |
| P2 | `modules/page.tsx` tab extraction | UX |
| P3 | centralized-ai 410 retirement | API |

---

## Explicitly out of scope (confirmed)

- UI redesign · Component rewrites · New diagnostics · New platform capabilities · Certification changes · URL prefix migration · Memory Bank updates (deferred to 1B doc pass)

---

## Document index

| Document | Purpose |
|----------|---------|
| [PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md](./PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md) | Domain model + full page map |
| [PLATFORM_CONTROLLER_NAVIGATION_MODEL.md](./PLATFORM_CONTROLLER_NAVIGATION_MODEL.md) | Sidebar target + redundancy |
| [PLATFORM_CONTROLLER_WORKFLOW_ANALYSIS.md](./PLATFORM_CONTROLLER_WORKFLOW_ANALYSIS.md) | Operator workflow paths |
| [PLATFORM_PROGRAMS_HUB_DESIGN.md](./PLATFORM_PROGRAMS_HUB_DESIGN.md) | Federation hub — reuse map |
| [PLATFORM_CONTROLLER_API_CONSOLIDATION.md](./PLATFORM_CONTROLLER_API_CONSOLIDATION.md) | 21 mount disposition |
| [PLATFORM_CONTROLLER_UX_SIMPLIFICATION.md](./PLATFORM_CONTROLLER_UX_SIMPLIFICATION.md) | Density, depth, disclosure |
| [PLATFORM_CONTROLLER_NAMING_REVIEW.md](./PLATFORM_CONTROLLER_NAMING_REVIEW.md) | Platform Controller naming |
| This document | Executive summary |

---

**Last updated:** 2026-06-24 (Phase 1A design complete)
