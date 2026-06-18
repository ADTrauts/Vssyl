# BA-1C Implementation Report

**Phase:** BA-1C — Policy Engine Completion  
**Date:** 2026-06-18  
**Status:** Complete — stop per BA-1C boundary (no BA-1D+)

## Summary

Business Administration mutation routes now use the platform Policy Engine dual-authorization pattern (legacy middleware + `authorize()`), matching Scheduling and existing `/api/business` inline PE. All 18 org-chart write operations are protected; `/api/business` core admin mutations reach 8/8 in-scope coverage (follow/unfollow remain optional per certification framework §4.3).

## Files created

| File | Purpose |
|------|---------|
| `server/src/auth/orgChartPolicyDual.ts` | `evaluateOrgChartPolicyDual`, `checkOrgChartPolicy` middleware |
| `server/src/auth/businessAdminPolicyDual.ts` | `evaluateBusinessAdminPolicyDual`, `checkBusinessPolicy` middleware (route-ready) |
| `server/src/routes/__tests__/business-policy-engine.test.ts` | PE dual integration tests for org-chart + business mutations |
| `docs/business-administration/BA_1C_IMPLEMENTATION_REPORT.md` | This report |

## Files modified

| File | Change |
|------|--------|
| `server/src/auth/policyActions.ts` | Added `business:create` and seven `orgchart:*` actions |
| `server/src/auth/policyEngine.ts` | `authorizeBusinessCreate`, `authorizeOrgChartPolicy`, routing |
| `server/src/middleware/orgChartPermissions.ts` | Sets `req.orgChartBusinessId` for PE middleware |
| `server/src/routes/org-chart.ts` | `checkOrgChartPolicy` on all 18 write routes |
| `server/src/controllers/businessController.ts` | `BUSINESS_CREATE` PE dual on `createBusiness` |

## Policy actions added

| Action | Routes / use |
|--------|----------------|
| `business:create` | `POST /api/business` |
| `orgchart:tier.write` | POST/PUT/DELETE `/api/org-chart/tiers` |
| `orgchart:department.write` | POST/PUT/DELETE `/api/org-chart/departments` |
| `orgchart:position.write` | POST/PUT/DELETE `/api/org-chart/positions` |
| `orgchart:structure.initialize` | `POST /api/org-chart/structure/:businessId/default` |
| `orgchart:permission_set.write` | POST/PUT/DELETE/copy `/api/org-chart/permission-sets` |
| `orgchart:employee.assign` | assign, remove, transfer, validate `/api/org-chart/employees/*` |
| `orgchart:permission.read` | Registered in engine (member read); not wired on routes (optional) |

## Routes protected

### `/api/org-chart` — 18/18 write routes

| Route | Policy action |
|-------|---------------|
| `POST /tiers` | `orgchart:tier.write` |
| `PUT /tiers/:id` | `orgchart:tier.write` |
| `DELETE /tiers/:id` | `orgchart:tier.write` |
| `POST /departments` | `orgchart:department.write` |
| `PUT /departments/:id` | `orgchart:department.write` |
| `DELETE /departments/:id` | `orgchart:department.write` |
| `POST /positions` | `orgchart:position.write` |
| `PUT /positions/:id` | `orgchart:position.write` |
| `DELETE /positions/:id` | `orgchart:position.write` |
| `POST /structure/:businessId/default` | `orgchart:structure.initialize` |
| `POST /permission-sets` | `orgchart:permission_set.write` |
| `PUT /permission-sets/:id` | `orgchart:permission_set.write` |
| `DELETE /permission-sets/:id` | `orgchart:permission_set.write` |
| `POST /permission-sets/:id/copy` | `orgchart:permission_set.write` |
| `POST /employees/assign` | `orgchart:employee.assign` |
| `DELETE /employees/remove` | `orgchart:employee.assign` |
| `POST /employees/transfer` | `orgchart:employee.assign` |
| `POST /employees/validate` | `orgchart:employee.assign` |

### `/api/business` — in-scope admin mutations

| Route | PE path |
|-------|---------|
| `POST /` | Inline dual — `business:create` (**new**) |
| `PUT/PATCH /:id` | Inline dual — `business:update` |
| `POST/DELETE /:id/logo` | Inline dual — `business:update` |
| `POST /:businessId/invite` | Inline dual — `business:member.invite` |
| `POST /invite/accept/:token` | Inline dual — `business:member.acceptInvitation` |
| `PUT/DELETE /:id/members/:userId` | Inline dual — member actions |

**Out of BA-1C scope (framework optional):** `POST/DELETE /:businessId/follow`, integration mounts (`/api/sso`, webhooks, modules).

## Coverage before vs after

| Surface | Before BA-1C | After BA-1C |
|---------|--------------|-------------|
| `/api/org-chart` writes | **0/18** PE dual (legacy only) | **18/18** PE dual |
| `/api/business` admin mutations | **7/10** inline PE (~70%) | **8/8** in-scope (**100%**); 2 social routes optional |
| Authorization path | Org-chart: custom middleware only | Legacy middleware → `checkOrgChartPolicy` → handler |
| Activity on policy failure | N/A (org-chart) | **No emission** — handlers never reached |

## Policy Engine audit (mutation inventory)

| Route family | Service | Action | Ownership boundary | Authorization path |
|--------------|---------|--------|--------------------|--------------------|
| Org-chart tiers/depts/positions | `orgChartService` | `orgchart:*.write` | `businessId` tenant scope | `requireOrgChartAccess` / `requireManageFor*` → `authorizeBusinessMemberManagement(manage)` |
| Structure default | `orgChartService` | `orgchart:structure.initialize` | business membership + manage | same |
| Permission sets | `permissionService` | `orgchart:permission_set.write` | business membership + manage | same |
| Employee ops | `employeeManagementService` | `orgchart:employee.assign` | business membership + manage | same |
| Business create | `businessProfileService` | `business:create` | authenticated founder | `authorizeBusinessCreate` |
| Business update/branding | `businessProfileService` / `businessBrandingService` | `business:update` | active member + manage | inline `evaluateBusinessUpdatePolicyDual` |
| Member mutations | `businessMemberService` | `business:member.*` | membership + invite/manage flags | inline `evaluateBusinessMemberPolicyDual` |

## Test results

```
pnpm type-check — PASS

✓ business-policy-engine.test.ts (8)
✓ org-chart.integration.test.ts (7)
✓ business-activity-integration.test.ts (1)

Total: 16/16 tests passed
```

**Verified behaviors:**
- Authorized manager mutations succeed with activity emission
- Employee / non-member receive 403 (legacy + PE)
- PE security deny (`INSUFFICIENT_ROLE`) blocks request without activity
- `orgchart:employee.assign` action dispatched on employee validate route
- Business create bootstrap PE allows authenticated create
- Business PATCH still succeeds for admin (BA-1B regression)

## BA-F-003 closure assessment

| Criterion | Pre BA-1C | Post BA-1C |
|-----------|-----------|------------|
| Org-chart PE dual on writes | **0/18** | **18/18** |
| `/api/business` core mutation PE | 7/8 in-scope gaps (`create` missing) | **8/8 in-scope** |
| PE actions registered in `policyEngine` | No `orgchart:*` | **7 orgchart + business:create** |
| Dual pattern aligned with Scheduling | No | **Yes** — legacy → `checkOrgChartPolicy` |
| Integration mounts (SSO, webhooks, modules) | No PE | **Deferred** — out of BA-1C scope |

**Finding BA-F-003:** **CLOSED** for BA-1C scope (`/api/business` + `/api/org-chart` mutation coverage). Residual integration-mount PE tracked separately in certification framework §4.5 (not BA-1C).

## Readiness estimate

| Gate | Post BA-1B | Post BA-1C | Notes |
|------|------------|------------|-------|
| G1 Authorization (core BA mounts) | ~2/3 PARTIAL | **3/3 PASS** | Org-chart + business admin mutations |
| G2 Auditability | 3/3 PASS | 3/3 PASS | Unchanged; policy failures do not emit activity |
| G3 Service boundaries | 3/3 PASS | 3/3 PASS | Unchanged |
| G1–G9 overall | ~63% (17/27) | **~70% (19/27)** | +G1 PASS for core mounts |

## Stop condition confirmation

Not started: BA-1D (integration testing program), BA-1E (UX modernization), BA-2 (certification review).

## Next recommended step

**BA-1D — Integration testing** per implementation sequence (cross-module BA flows).
