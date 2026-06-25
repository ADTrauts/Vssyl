# Platform Programs Hub — Design

**Program:** Platform Controller Program — Phase 1A  
**Date:** 2026-06-24  
**Status:** Implemented (Phase 1B — 2026-06-24)

**Route:** `/admin-portal/platform-programs` ✅

**Constraint:** The hub **must not duplicate dashboards or metrics pipelines**. It federates **existing pages, panels, APIs, and components** via cards, links, and read-only status chips.

**Related:** [Information Architecture](./PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md) · [Marketplace Governance](../admin-portal/ADMIN_PORTAL_MARKETPLACE_GOVERNANCE_REVIEW.md)

---

## 1. Purpose

**Platform Programs** is the operational home for **certified platform capabilities** — the answer to Phase 0A finding AP0A-F01 ("no unified Platform Programs hub").

Operators landing here answer: *"Which platform programs exist, are they healthy, and where do I go to manage them?"*

---

## 2. Design principles

| Principle | Application |
|-----------|-------------|
| **Reuse first** | Every program card deep-links to an **existing** surface |
| **No duplicate metrics** | Hub reads **existing** summary endpoints only; no new rollup jobs |
| **Progressive disclosure** | Hub = status + link; depth stays on program pages |
| **Shared visual language** | Reuse AI Pipeline hub patterns (`PipelineOperationsHub`, `AdminStatCard`) |
| **Future extensibility** | New programs = new card + link; no hub rearchitecture |

---

## 3. Hub route (Phase 1B)

| Attribute | Value |
|-----------|-------|
| Path | `/admin-portal/platform-programs` |
| Nav label | **Platform Programs** |
| Shell | `AdminPortalPageShell` (existing) |
| Content type | **Static federation grid** — no new backend required for v1 |

---

## 4. Registered platform programs (v1)

| Program | Certification status | Existing operator home | Hub card role |
|---------|---------------------|------------------------|---------------|
| **Platform Kernel** | Platform foundation | `system`, `performance`, `dashboard` | Link + optional health chip from `getDashboardStats` / `getSystemHealth` |
| **Unified Search** | Platform capability | Modules readiness (search delegate) + probe API | Link to Modules; show pilot flag note |
| **AI Retrieval** | AI Platform L2 + Pipeline L3 | `ai-pipeline` hub | Link — reuse `PipelineHealthMetrics` summary |
| **Context Graph** | Platform capability | `ai-pipeline/sources`, modules AI Context tab | Dual links: Platform sources · Module providers |
| **Marketplace Partner Runtime** | L3 CwF (2026-06-24) | `modules` submissions + readiness card | Link — submission pending count from existing stats API |

**Future programs** (card slot reserved, no implementation):
- Platform Activity (cross-tenant ingest monitor)
- Policy Engine (when operator surface exists)
- Analytics Capability (link to `analytics` only)

---

## 5. Shared layout specification

### 5.1 Page structure (reuse existing components)

```
┌─────────────────────────────────────────────────────────────┐
│ AdminPortalPageShell                                         │
│  Title: Platform Programs                                    │
│  Subtitle: Certified platform capabilities — operational home│
├─────────────────────────────────────────────────────────────┤
│ [Optional] Alert banner — env-gated pilot flags              │
├─────────────────────────────────────────────────────────────┤
│ SECTION: Program status grid (2-col responsive)              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ ProgramCard      │  │ ProgramCard      │  ...            │
│  └──────────────────┘  └──────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│ SECTION: Quick diagnostics (links only)                      │
│  Diagnostics · System Logs · AI Trace Search               │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 ProgramCard anatomy (new component — thin wrapper only)

| Element | Source | New? |
|---------|--------|------|
| Title + description | Static config registry (client-side map) | Config only |
| Certification badge | Static per program + link to ledger doc | No API |
| Health chip | Existing API per program (see §6) | Reuse |
| Primary CTA | `Link` to existing route | No |
| Secondary CTA | Probe or docs link | No |

**Do not build** a new `ProgramDashboard` with charts.

---

## 6. Shared indicators — reuse map

### 6.1 Health indicators

| Indicator | Existing source | Used on |
|-----------|-----------------|---------|
| System online / uptime | `adminApiService.getDashboardStats()` | Platform Kernel card |
| Pipeline retrieval trigger % | `usePipelineHubData()` / pipeline stats API | AI Retrieval card |
| Pending module submissions | `adminApiService.getModuleStats()` | Marketplace card |
| Search delegate registered | `getMarketplaceReadiness(moduleId)` for pilot module only | Unified Search card (pilot) |
| Context sources count | Pipeline catalog API | Context Graph card |

**Phase 1B v1 fallback:** Cards render **links only** if summary fetch fails — no mock data.

### 6.2 Certification indicators

| Indicator | Source |
|-----------|--------|
| Program certification level | Static text from `CERTIFICATION_LEDGER.md` references |
| Module-level certification | Not on hub — stays on `ModuleCertificationReviewPanel` |
| Partner capability validator version | Marketplace card footer link to modules |

### 6.3 Diagnostics links (shared footer)

| Link | Target |
|------|--------|
| AI trace forensics | `/admin-portal/ai-pipeline/diagnostics` |
| System logs | `/admin-portal/system-logs` |
| Performance | `/admin-portal/performance` |

### 6.4 Probes (not duplicated on hub)

Probes remain on **`MarketplaceReadinessCard`** only. Hub links to Marketplace — does not re-expose probe buttons.

### 6.5 Readiness (marketplace-specific)

Hub **Marketplace Partner Runtime** card shows:
- Pending submissions count (existing API)
- Link to modules
- Text: "Delegate probes run per-module on submission detail"

---

## 7. Program card specifications

### 7.1 Platform Kernel

| Field | Value |
|-------|-------|
| Primary link | `/admin-portal/system` |
| Secondary links | Performance · Overview dashboard |
| Health | Dashboard stats system health field |
| Certification | Platform foundation (not ledger module) |

### 7.2 Unified Search

| Field | Value |
|-------|-------|
| Primary link | `/admin-portal/modules` (submissions with partner modules) |
| Secondary | Docs: Search Delegate architecture |
| Health | Pilot: readiness for `vssyl-pilot-assets` if query cheap; else "Probe per module" |
| Note | No search index admin UI — intentional |

### 7.3 AI Retrieval

| Field | Value |
|-------|-------|
| Primary link | `/admin-portal/ai-pipeline` |
| Secondary | Diagnostics · Test Lab |
| Health | Reuse `PipelineHealthMetrics` compact variant or link-only v1 |
| Certification | AI Platform L2; Pipeline admin L3 |

### 7.4 Context Graph

| Field | Value |
|-------|-------|
| Primary link | `/admin-portal/ai-pipeline/sources` |
| Secondary | `/admin-portal/modules` (AI Context tab via query `?tab=ai-context`) |
| Health | Catalog source count from pipeline registry |
| Note | Cross-link both paths in card body |

### 7.5 Marketplace Partner Runtime

| Field | Value |
|-------|-------|
| Primary link | `/admin-portal/modules` |
| Secondary | `/admin-portal/developers` |
| Health | Module stats API — pending reviews, certified count |
| Certification | L3 CwF Partner Capability (2026-06-24) |

---

## 8. Marketplace integration decision

**Should Marketplace be a separate section or part of Platform Programs?**

**Recommendation: Both — complementary, not duplicate.**

| Layer | Role |
|-------|------|
| **Platform Programs hub** | Status + entry card for Marketplace Partner Runtime program |
| **Marketplace nav section** | **Primary workflow home** for daily certification work |

**Rationale:** Operators certifying modules daily need **direct Marketplace nav**. Programs hub provides **cross-program context** without replacing the modules page.

**Do not merge** modules into Platform Programs route — would harm workflow efficiency.

---

## 9. Relationship to AI System page

`ai-system` content distribution:

| ai-system content | Target |
|-------------------|--------|
| AI Pipeline card | Programs → AI Retrieval card |
| Test Lab card | AI Retrieval secondary link |
| Provider card | Providers nav (hash link) |
| Platform Analytics card | Overview → Analytics |
| Business AI card | Programs → Business AI panel link (`business-ai` page) |
| Patterns/insights sections | Remain on `business-ai` or analytics — not hub |

**After merge:** `ai-system` route **remains** for bookmark compatibility but **removed from sidebar**.

---

## 10. Config registry (Phase 1B implementation hint)

```typescript
// Illustrative — NOT implemented in Phase 1A
interface PlatformProgramDefinition {
  id: string;
  title: string;
  description: string;
  certificationRef?: string;
  primaryHref: string;
  secondaryHrefs?: { label: string; href: string }[];
  healthProbe?: 'dashboard' | 'pipeline' | 'moduleStats' | 'none';
}
```

Single file: `web/src/config/platformPrograms.ts` — **no backend**.

---

## 11. What this hub explicitly does NOT include

- New Search index management UI
- New Context Graph visualization
- Duplicate provider dashboard
- Aggregate probe history store (deferred)
- New certification validator logic
- Feature flag editor (deferred to Configuration)

---

## 12. Success criteria

| Criterion | How hub meets it |
|-----------|------------------|
| Platform Programs first-class | Top-level nav + dedicated route |
| No functionality duplicated | Links + read-only chips only |
| Marketplace integrated | Card + direct Marketplace nav |
| Future programs fit | Card registry pattern |
| Reuses existing functionality | §6 reuse map |

---

**Last updated:** 2026-06-24 (Phase 1A design)
