# Admin Portal Analytics File Target Matrix

**Program:** Stage 0C — AP-F-007  
**Date:** 2026-06-18

---

## 1. Frontend — modified

| File | Change |
|------|--------|
| `web/src/lib/adminAnalyticsOwnership.ts` | **Added** — ownership registry |
| `web/src/app/admin-portal/analytics/page.tsx` | **Modified** — tabs (overview / insights), business metric cards |
| `web/src/components/admin-portal/AdminPlatformAnalyticsInsightsPanel.tsx` | **Added** — strategic BI panel |
| `web/src/app/admin-portal/business-intelligence/page.tsx` | **Modified** — redirect to insights tab |
| `web/src/app/admin-portal/ai-system/page.tsx` | **Modified** — removed chart triplication; delegation card |
| `web/src/app/admin-portal/layout.tsx` | **Modified** — removed BI nav item |

---

## 2. Frontend — tests

| File | Change |
|------|--------|
| `web/src/lib/__tests__/adminPortalAnalyticsOwnership.test.ts` | **Added** — 0C hygiene tests |

---

## 3. Backend — unchanged (satellite APIs retained)

| File | Role |
|------|------|
| `server/src/services/admin/adminAnalyticsService.ts` | Canonical analytics + BI data |
| `server/src/routes/admin-portal/adminPortalRoutes.analyticsOps.ts` | `/analytics/*` routes |
| `server/src/routes/admin-portal/adminPortalRoutes.platform.ts` | `/business-intelligence/*` routes |
| `server/src/services/admin/adminPerformanceService.ts` | Performance satellite |

---

## 4. Documentation — added

| File |
|------|
| `ADMIN_PORTAL_ANALYTICS_REALITY_ASSESSMENT.md` |
| `ADMIN_PORTAL_ANALYTICS_OWNERSHIP_MODEL.md` |
| `ADMIN_PORTAL_ANALYTICS_CONVERGENCE_PLAN.md` |
| `ADMIN_PORTAL_ANALYTICS_FILE_TARGET_MATRIX.md` (this file) |
| `ADMIN_PORTAL_ANALYTICS_IMPLEMENTATION_PLAN.md` |
| `ADMIN_PORTAL_ANALYTICS_CERTIFICATION_IMPACT.md` |
| `ADMIN_PORTAL_ANALYTICS_EXECUTIVE_SUMMARY.md` |

---

## 5. Documentation — updated

| File | Change |
|------|--------|
| `ADMIN_PORTAL_FINDINGS_REGISTER.md` | AP-F-007 → Closed |
| `ADMIN_PORTAL_REMAINING_FINDINGS_REGISTER.md` | Remove AP-F-007 |
| `ADMIN_PORTAL_IMPLEMENTATION_PACKAGE_PLAN.md` | Package 0C complete |

---

## 6. Explicitly out of scope

| Area | Owner |
|------|-------|
| AP-F-023–026 UX | 1A |
| Ledger update | Separate PR per ratification |
| Performance page refactor | Not required for AP-F-007 |
| Schema / new dashboards | Prohibited by charter |

---

**Last updated:** 2026-06-18
