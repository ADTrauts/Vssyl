# Admin Portal Analytics Convergence Plan

**Program:** Stage 0C — AP-F-007  
**Date:** 2026-06-18

---

## 1. Convergence objective

Eliminate analytics **triplication** by establishing Platform Analytics as the single authoritative operator destination while preserving strategic BI capabilities as a **tab**, not a separate page.

---

## 2. Convergence sequence (executed)

| Step | Action | Status |
|------|--------|--------|
| 1 | Publish ownership registry (`adminAnalyticsOwnership.ts`) | **Done** |
| 2 | Redirect BI page → `analytics?tab=insights` | **Done** |
| 3 | Remove BI from sidebar nav | **Done** |
| 4 | Add Overview + Strategic Insights tabs on analytics page | **Done** |
| 5 | Extract `AdminPlatformAnalyticsInsightsPanel` (BI strategic sections only) | **Done** |
| 6 | Remove AI System `getAnalytics`/`getBusinessIntelligence` fetches and chart blocks | **Done** |
| 7 | Add Platform Analytics launcher card on AI System | **Done** |
| 8 | Hygiene tests (`adminPortalAnalyticsOwnership.test.ts`) | **Done** |

---

## 3. What did not change (by design)

- No new analytics products or reporting frameworks
- No Prisma schema redesign
- BI API routes unchanged (satellite endpoints under canonical service)
- Performance page unchanged (infra satellite)
- UX findings AP-F-023–026 untouched (1A scope)

---

## 4. Route / redirect map

| From | To |
|------|-----|
| `/admin-portal/business-intelligence` | `/admin-portal/analytics?tab=insights` |
| AI System "View strategic insights" | `/admin-portal/analytics?tab=insights` |
| AI System "Open Platform Analytics" | `/admin-portal/analytics` |

---

## 5. Service delegation

| Consumer | Delegates to |
|----------|--------------|
| Analytics Overview tab | `adminApiService.getAnalytics` |
| Analytics Insights tab | `adminApiService.getBusinessIntelligence` |
| AI System | `getBusinessAIGlobal`, `getBusinessAIPatterns` only |
| Dashboard | `getDashboardStats` (summary satellite) |

---

## 6. Exit criteria (AP-F-007)

- [x] Single canonical analytics destination documented and enforced
- [x] No duplicate analytics sidebar entry points
- [x] AI System no longer renders platform trend charts
- [x] BI page redirects to canonical insights tab
- [x] Ownership registry in repo
- [x] Hygiene tests pass

---

**Last updated:** 2026-06-18
