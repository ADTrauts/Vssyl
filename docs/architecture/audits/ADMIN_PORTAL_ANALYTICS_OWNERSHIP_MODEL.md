# Admin Portal Analytics Ownership Model

**Program:** Stage 0C — AP-F-007  
**Date:** 2026-06-18  
**Authority:** Ratified Admin Portal governance; extends [ADMIN_PORTAL_AI_AND_ANALYTICS_BOUNDARY_REVIEW.md](./ADMIN_PORTAL_AI_AND_ANALYTICS_BOUNDARY_REVIEW.md)

---

## 1. Canonical model

```
Operator ──► /admin-portal/analytics  (CANONICAL UI)
                    │
                    ├── tab=overview  → getAnalytics + activity feed
                    └── tab=insights  → getBusinessIntelligence (strategic only)

Backend owner: adminAnalyticsService.ts
Registry: web/src/lib/adminAnalyticsOwnership.ts
```

---

## 2. Surface roles

| Surface | Role | May display user/revenue/growth charts? |
|---------|------|----------------------------------------|
| Platform Analytics | **canonical** | **Yes** — sole operator destination |
| Business Intelligence page | **retired** | **No** — redirect only |
| AI System | **satellite** | **No** — launcher + AI-specific summary |
| Performance | **satellite** | **No** — infra/ops only |
| Dashboard | **satellite** | Summary cards only; link to canonical |
| AI Pipeline | **satellite** | AI control-plane metrics only |
| Domain APIs (support, modules) | **satellite** | Scoped subdomain metrics |

---

## 3. Enforcement rules

1. **No new admin analytics pages** without updating `ADMIN_ANALYTICS_SURFACES` and council review.
2. **AI launcher surfaces** must not call `getAnalytics` or `getBusinessIntelligence` for trend charts.
3. **Sidebar** exposes exactly **one** platform analytics nav item under Platform.
4. **Legacy `/business-intelligence`** must redirect to `/admin-portal/analytics?tab=insights`.
5. **BI API routes** remain under `adminAnalyticsService` — UI consolidation only.

---

## 4. Satellites (remain)

| Satellite | Rationale |
|-----------|-----------|
| Performance page | Distinct infra/scalability domain |
| Dashboard stats | High-level snapshot, not deep analytics |
| AI Pipeline quality metrics | AI control plane, not platform business KPIs |
| support/modules analytics APIs | Governed subdomain reporting |

---

## 5. Retired

| Item | Disposition |
|------|-------------|
| `business-intelligence/page.tsx` (full UI) | Redirect to insights tab |
| AI System trend/unified charts | Removed; delegation card |
| Sidebar BI nav item | Removed |

---

## 6. Registry

Authoritative constants:

- `ADMIN_CANONICAL_ANALYTICS_PATH` = `/admin-portal/analytics`
- `ADMIN_CANONICAL_ANALYTICS_INSIGHTS_PATH` = `/admin-portal/analytics?tab=insights`
- `ADMIN_RETIRED_BI_PATH` = `/admin-portal/business-intelligence`

---

**Last updated:** 2026-06-18
