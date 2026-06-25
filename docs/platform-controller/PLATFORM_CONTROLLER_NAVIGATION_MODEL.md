# Platform Controller — Navigation Model

**Program:** Platform Controller Program — Phase 1A  
**Date:** 2026-06-24  
**Status:** Implemented (Phase 1B — 2026-06-24) — nav config in `web/src/config/platformControllerNavigation.ts`

**Related:** [Information Architecture](./PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md) · [UX Simplification](./PLATFORM_CONTROLLER_UX_SIMPLIFICATION.md)

---

## 1. Executive summary

Target navigation reduces **22 sidebar items across 6 sections** to **14 items across 10 domains** (+ collapsed Operator Labs). The model prioritizes **Platform Programs** and **Marketplace** as first-class entries and eliminates redundant top-level items (`AI System`, separate `Commercial`, `Developer & Modules`).

**No new dashboards.** New nav entries point to **existing pages** or a **link-only Programs hub**.

---

## 2. Current vs target navigation

### 2.1 Current (`layout.tsx` — 22 items)

| Section | Items |
|---------|------:|
| Operations | 4 |
| Commercial | 2 |
| AI | 2 |
| Platform | 7 |
| Developer & Modules | 2 |
| Admin Labs | 2–3 |
| **Total** | **22** |

### 2.2 Target (14 + Labs)

| # | Domain | Nav label | Path | Icon intent |
|---|--------|-----------|------|-------------|
| 1 | Overview | **Overview** | `/admin-portal/dashboard` | Home |
| 2 | Platform Programs | **Platform Programs** | `/admin-portal/platform-programs` | Layers / Grid |
| 3 | Marketplace | **Marketplace** | `/admin-portal/modules` | Package |
| 4 | Marketplace | ↳ Developers | `/admin-portal/developers` | Code (indented or sub-item) |
| 5 | AI | **AI Pipeline** | `/admin-portal/ai-pipeline` | Brain |
| 6 | Diagnostics | **Diagnostics** | `/admin-portal/ai-pipeline/diagnostics` | Activity |
| 7 | Diagnostics | ↳ Logs | `/admin-portal/system-logs` | FileText |
| 8 | Diagnostics | ↳ Performance | `/admin-portal/performance` | Gauge |
| 9 | Operations | **Operations** | `/admin-portal/users` | Users (section header pattern) |
| 10 | Operations | ↳ Users | `/admin-portal/users` | — |
| 11 | Operations | ↳ Moderation | `/admin-portal/moderation` | — |
| 12 | Operations | ↳ Support | `/admin-portal/support` | — |
| 13 | Operations | ↳ Impersonation | `/admin-portal/impersonate` | — |
| 14 | Providers | **Providers** | `/admin-portal/ai-pipeline#provider-governance` | Cloud |
| 15 | Security | **Security** | `/admin-portal/security` | Lock |
| 16 | Billing | **Billing** | `/admin-portal/billing` | DollarSign |
| 17 | Billing | ↳ Pricing | `/admin-portal/pricing` | — |
| 18 | Configuration | **Configuration** | `/admin-portal/system` | Settings |
| 19 | Overview | ↳ Analytics | `/admin-portal/analytics` | BarChart3 |

**Collapsed Operator Labs** (footer, env-gated): Overrides · Testing · Seed Modules

**Alternative (flatter):** If subsection pattern adds complexity, use **14 flat items** without Operations sub-indent — Users, Moderation, Support, Impersonation as peer items under collapsed "Operations" section (same as today but renamed).

**Recommended:** **Collapsed sections** with **max 4 items visible per section** — matches existing chevron pattern in `layout.tsx`.

---

## 3. Target sidebar structure (recommended)

```
Platform Controller                    [shell header rename]
─────────────────────────────────────
Overview
  Overview
  Platform Analytics

Platform Programs                        ← NEW hub (link federation)
Marketplace
  Modules
  Developers

AI & Diagnostics
  AI Pipeline
  Diagnostics
  System Logs
  Performance

Operations
  Users
  Moderation
  Support
  Impersonation

Providers                                ← deep link to existing panel
Security
Billing
  Financial Management
  Pricing

Configuration
  System Administration
  Governance                             ← merged tab target
  Data Retention                         ← merged tab target

Operator Labs ▾                          ← collapsed default
  Admin Overrides
  Testing & Debug                        ← env gate
```

**Item count:** 18 visible when all sections expanded → **14 unique destinations** (Analytics, Developers, Pricing, Governance, Retention are depth-2).

---

## 4. Redundancy review

### 4.1 Pages

| Duplicate / overlap | Recommendation | Why |
|---------------------|----------------|-----|
| `ai-system` vs `ai-pipeline` hub | **Merge** — remove ai-system from nav | AI System is launcher duplicating Pipeline hub cards + analytics links |
| `business-intelligence` vs `analytics?tab=insights` | **Remove** (done) | Already redirects; keep redirect |
| `ai-learning` vs `ai-pipeline` | **Remove** (done) | Already redirects |
| `ai-context` vs `ai-pipeline/diagnostics` | **Remove** (done) | Already redirects with query passthrough |
| `test-impersonation` + `impersonation-test` vs `impersonate` | **Remove** | Same capability; consolidate to impersonate |
| `dashboard` vs `analytics` | **Leave unchanged** | Dashboard = summary cards; analytics = deep metrics (documented in `adminAnalyticsOwnership.ts`) |
| `performance` vs `analytics` | **Leave unchanged** | Performance = infra/scaling; analytics = platform/business metrics |
| `governance` vs `security` | **Leave unchanged** | Governance = policy management; security = incidents/audit — merge under Configuration nav, not single page |
| `system` health vs `dashboard` health | **Leave unchanged** | Different endpoints; overview links to system for detail |
| `developers` vs `modules` | **Leave unchanged** | Related but distinct workflows — same Marketplace section |

### 4.2 Workflows

| Duplicate workflow | Recommendation | Why |
|--------------------|----------------|-----|
| AI diagnostics via ai-context vs pipeline/diagnostics | **Merge** (done) | Single diagnostics path |
| BI review via ai-system vs analytics | **Merge** (done) | ai-system links to analytics |
| Module cert via `/modules/admin` vs `/admin-portal/modules` | **Remove** (done) | Canonical modules path only |
| Provider config via ai-system vs pipeline provider panel | **Merge** | Single provider panel on pipeline hub |
| Probe execution via API only vs readiness card | **Leave unchanged** | Card is UI; API is backend — enhance card feedback in 1B, not duplicate |

### 4.3 Diagnostics

| Surface | Recommendation | Why |
|---------|----------------|-----|
| AI Pipeline diagnostics | **Keep** — canonical | Trace forensics |
| AI Pipeline test-lab | **Keep** — link from Diagnostics nav | Dry-run evaluation |
| system-logs | **Keep** — move under Diagnostics domain | App logs |
| performance | **Keep** — move under Diagnostics domain | Infra metrics |
| debug-auth/session | **Hide** | Dev only |
| testing page test runner | **Hide** | Env-gated |

### 4.4 Configuration

| Surface | Recommendation | Why |
|---------|----------------|-----|
| system | **Keep** — Configuration home | Migrations, backup, config |
| governance + retention | **Merge nav** — tabs on configuration route (1B) | Same operator persona; reduces Platform section sprawl |
| pricing vs billing | **Leave unchanged** | Related but distinct write paths — same Billing section |
| overrides | **Hide** in Labs | Dangerous; infrequent |

### 4.5 APIs (summary — detail in API Consolidation doc)

| Duplicate | Recommendation | Why |
|-----------|----------------|-----|
| `/api/centralized-ai` vs `/api/admin-portal/ai-pipeline` | **Remove** centralized-ai body (410) | Legacy mock scaffold |
| `/api/admin-override` vs canonical portal | **Merge** into `/api/admin-portal/overrides` | UI already on portal |
| `/api/admin/ai-providers` vs pipeline provider routes | **Group** under `/api/admin-portal/providers` | Single client prefix |
| Duplicate `GET /security/events` | **Remove** duplicate registration | Already flagged AP-F-015 |
| Probe routes inline auth | **Leave** short-term; **merge** middleware in 1B | Behavior equivalent |

### 4.6 Probes

| Probe | Recommendation | Why |
|-------|----------------|-----|
| Search / Workspace / Billing / Activity | **Leave unchanged** | Four distinct capabilities — not duplicates |
| Marketplace readiness GET vs four probes | **Leave unchanged** | Read = declarative; probe = executable — complementary |

---

## 5. Navigation hierarchy rationale

| Decision | Rationale |
|----------|-----------|
| Platform Programs as top-level | Answers Phase 0A gap AP0A-F01 without new metric systems |
| Marketplace not nested under Programs | Certification is high-frequency; deserves direct access |
| AI Pipeline stays top-level | Too deep to bury — but labeled under "AI & Diagnostics" section |
| Providers as nav deep-link | Reuses `ProviderGovernancePanel` — zero new UI |
| Retire AI System nav | Eliminates launcher redundancy; Programs hub replaces |
| Configuration absorbs Platform clutter | governance, retention, system were 3 of 7 Platform items |
| Analytics under Overview | Reinforces "overview → drill down" mental model |

---

## 6. Active path / highlight rules

| Pattern | Rule |
|---------|------|
| `/admin-portal/ai-pipeline/*` | Highlight **AI Pipeline** nav item |
| `/admin-portal/modules` | Highlight **Marketplace → Modules** |
| `/admin-portal/platform-programs` | Highlight **Platform Programs** |
| Hash routes `#provider-governance` | Highlight **Providers** |
| `/admin-portal/analytics` | Highlight **Platform Analytics** under Overview |

---

## 7. Mobile / collapse behavior

Preserve existing sidebar collapse. When collapsed:
- Show domain icons only
- Platform Programs icon = primary discovery for certified capabilities
- Operator Labs hidden until expanded

---

## 8. Migration notes (Phase 1B)

| Change type | Effort | Risk |
|-------------|--------|------|
| Sidebar regroup | Low | Low — labels/paths only |
| Add platform-programs hub | Low | Low — static links |
| Remove ai-system from nav | Low | Medium — verify no external bookmarks (keep route) |
| Configuration tabs merge | Medium | Low — same components |
| Redirect test-impersonation pages | Low | Low |

---

**Last updated:** 2026-06-24 (Phase 1A design)
