# Admin Portal — Information Architecture

**Program:** Admin Portal Reference Program — Operational Excellence Phase 0A  
**Date:** 2026-07-05  
**Status:** Discovery — documents current IA and consolidation targets

**Related:** [UX Audit](./ADMIN_PORTAL_UX_AUDIT.md) · [Operational Model](./ADMIN_PORTAL_OPERATIONAL_MODEL.md) · [Capability Matrix](./ADMIN_PORTAL_CAPABILITY_MATRIX.md)

---

## 1. IA principles

| Principle | Application |
|-----------|-------------|
| **One canonical path** | Each operator capability maps to one primary nav destination |
| **Programs before engines** | Certified platform capabilities surface via Platform Programs hub |
| **Deep pages reuse shells** | AI Pipeline sub-tree pattern for future expansions |
| **Hubs federate, not duplicate** | Platform Programs links to existing pages — no second dashboards |
| **Labs stay collapsed** | Debug, seed, overrides in Operator Labs (default collapsed) |
| **Customer ≠ operator** | Product surfaces (`/billing`, `/support`) separate from portal |

---

## 2. Current information architecture

### 2.1 Top-level map

```
Platform Controller (/admin-portal)
├── Overview
│   ├── Platform Overview          → /dashboard
│   └── Platform Analytics         → /analytics
├── Platform Programs
│   ├── Platform Programs          → /platform-programs  [hub]
│   └── Platform Adoption          → /platform-adoption
├── Marketplace
│   ├── Modules                    → /modules            [canonical governance]
│   └── Developers                 → /developers
├── AI & Diagnostics
│   ├── AI Pipeline                → /ai-pipeline        [hub]
│   │   ├── Intents                → /ai-pipeline/intents
│   │   ├── Grounding              → /ai-pipeline/grounding
│   │   ├── Sources                → /ai-pipeline/sources
│   │   ├── Tools                  → /ai-pipeline/tools
│   │   ├── Diagnostics            → /ai-pipeline/diagnostics
│   │   ├── Test Lab               → /ai-pipeline/test-lab
│   │   ├── Quality                → /ai-pipeline/quality
│   │   ├── Audit                  → /ai-pipeline/audit
│   │   └── Compliance             → /ai-pipeline/compliance
│   ├── Diagnostics                → /ai-pipeline/diagnostics  [shortcut]
│   ├── System Logs                → /system-logs
│   └── Performance                → /performance
├── Operations
│   ├── Users                      → /users
│   ├── Moderation                 → /moderation
│   ├── Support                    → /support
│   └── Impersonation              → /impersonate
├── Providers
│   └── Provider Governance        → /ai-pipeline#provider-governance
├── Security
│   └── Security & Compliance      → /security
├── Billing
│   ├── Financial Management       → /billing
│   └── Pricing                    → /pricing
├── Configuration
│   ├── System Administration      → /system
│   ├── Governance                 → /governance
│   └── Data Retention             → /retention
└── Operator Labs [collapsed]
    ├── Admin Overrides            → /overrides
    ├── Testing & Debug            → /testing [gated]
    └── Seed Modules               → /seed-modules [gated]
```

### 2.2 Orphan / satellite pages (not in sidebar)

| Page | IA role | Target disposition |
|------|---------|-------------------|
| `/business-intelligence` | Analytics satellite | **Merge** → analytics `?tab=insights` |
| `/business-ai` | AI satellite | **Keep** — link from Platform Programs |
| `/ai-system` | Legacy launcher | **Deprecate** — redirect to AI Pipeline |
| `/ai-context` | Legacy duplicate | **Retire** — redirect to diagnostics |
| `/ai-learning` | Legacy | **Deprecate** — redirect to AI Pipeline |
| Debug pages (7) | Engineering | **Gate** — not in production IA |
| `/admin/*` | Legacy | **Do not extend** |

---

## 3. API information architecture

### 3.1 Canonical mount

```
/api/admin-portal/
├── core/          → users, dashboard, moderation, impersonation
├── analyticsOps/  → analytics, billing, modules governance, probes
├── platform/      → support, system, BI, performance, database
├── aiPipeline/    → pipeline catalog, policies, traces, compliance
├── adoption/      → platform adoption metrics
└── security/      → module security monitoring (sub-mount)
```

### 3.2 Satellite mounts (documented, migrate incrementally)

| Prefix | Primary portal consumer | Migration target |
|--------|------------------------|------------------|
| `/api/admin/logs` | system-logs | `/api/admin-portal/logs` |
| `/api/admin/ai-providers` | AI Pipeline provider views | `/api/admin-portal/providers` |
| `/api/admin-override` | overrides | `/api/admin-portal/overrides` |
| `/api/admin/modules/ai` | modules AI Context tab | `/api/admin-portal/modules/ai` |
| `/api/pricing` | pricing page | `/api/admin-portal/pricing` |
| `/api/email-notification` | — (no UI) | `/api/admin-portal/email` |
| `/api/admin/business-ai` | business-ai page | `/api/admin-portal/business-ai` |

**Rule:** New operator endpoints register on canonical mount only.

---

## 4. Platform Programs registry IA

`web/src/config/platformPrograms.ts` defines five certified programs:

| Program ID | Hub card | Primary operator link | Health source |
|------------|----------|----------------------|---------------|
| `platform-kernel` | ✅ | System Administration | dashboard stats |
| `unified-search` | ✅ | Modules (probe) | searchPilotReadiness |
| `ai-retrieval` | ✅ | AI Pipeline | pipeline |
| `context-graph` | ✅ | AI Pipeline sources | catalog |
| `marketplace-partner-runtime` | ✅ | Modules | moduleStats |

**IA intent:** Operators land on Platform Programs for cross-program health; drill into existing deep pages.

---

## 5. Analytics IA ownership

Per [`adminAnalyticsOwnership.ts`](../../web/src/lib/adminAnalyticsOwnership.ts) and Analytics program docs:

| Analytics class | Canonical UI | Notes |
|-----------------|--------------|-------|
| **Operator platform metrics** | `/admin-portal/analytics` | MRR, users, system |
| **Strategic insights** | analytics `?tab=insights` | **Target** — absorb business-intelligence |
| **Module governance metrics** | `/admin-portal/modules` (tab) | Install/revenue per module |
| **Platform adoption** | `/admin-portal/platform-adoption` | Feature adoption |
| **AI pipeline metrics** | `/admin-portal/ai-pipeline` | Usage, enforcement |
| **Tenant/product analytics** | Dashboard module (product) | **Not** admin portal |
| **Module interior analytics** | HR, Chat, etc. | Domain-owned |

---

## 6. Search & discoverability

### 6.1 Current state

| Mechanism | Coverage |
|-----------|----------|
| Sidebar navigation | 24 destinations |
| Platform Programs hub cards | 5 programs + deep links |
| AI Pipeline hub sections | Pipeline sub-nav |
| Global operator search | **None** |
| Breadcrumbs | Pipeline sub-shell only |
| URL bookmarking | Orphan pages still work |

### 6.2 Recommended search IA (modernization)

```
Header global search
├── Users          → /users?search={q}
├── Businesses     → /businesses?search={q}  [new]
├── Modules        → /modules?search={q}
└── Support tickets → /support?search={q}
```

No new search engine — filter existing list endpoints.

---

## 7. Target IA (post-modernization)

Changes are **additive consolidations** — not restructure.

```
Platform Controller
├── Overview
│   ├── Platform Overview          [+ health strip from /api/health]
│   └── Platform Analytics         [absorbs business-intelligence]
├── Platform Programs              [unchanged]
├── Marketplace                    [unchanged]
├── AI & Diagnostics               [unchanged]
├── Operations
│   ├── Users
│   ├── Businesses                 [NEW — CRM hub]
│   ├── Moderation
│   ├── Support
│   └── Impersonation
├── Providers                      [unchanged]
├── Security                       [unchanged]
├── Billing                        [unchanged]
├── Configuration
│   ├── System Administration
│   ├── Email Operations           [NEW — wire existing API]
│   ├── Feature Flags              [NEW — read-only env snapshot]
│   ├── Background Jobs            [NEW — cron status panel]
│   ├── Governance
│   └── Data Retention
└── Operator Labs                  [unchanged]
```

### 7.1 Retired from IA

- `/admin-portal/business-intelligence` → redirect to analytics insights tab
- `/admin-portal/ai-context` → redirect to diagnostics
- `/admin-portal/ai-system` → redirect to AI Pipeline

---

## 8. IA anti-patterns (do not introduce)

| Anti-pattern | Why forbidden |
|--------------|---------------|
| Register `admin` as installable module | Constitutional — control plane ≠ module |
| Duplicate module governance under `/modules/admin` | AP-F-009 closed |
| Second billing admin in product settings | Billing ops stay in portal |
| Partner developer tools in portal | Belongs in developer-portal |
| Full Context Graph visual admin | Engine-owned; portal shows operator probes only |
| Parallel AI admin in centralized-ai mount | Deprecated satellite |

---

## 9. IA completeness score

| IA dimension | Score |
|--------------|------:|
| Sidebar coverage of certified programs | 90% |
| Canonical API alignment | 80% |
| Orphan page debt | 65% |
| Search/discoverability | 50% |
| Target IA gaps (businesses, email, jobs) | 60% |

### **Overall IA maturity: ~75%**

---

**Last updated:** 2026-07-05
