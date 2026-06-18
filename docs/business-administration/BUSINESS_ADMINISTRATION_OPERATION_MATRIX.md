# Business Administration Operation Matrix

**Program:** Business Administration Discovery — Phase 0A  
**Domain:** Business Administration (platform subdomain)  
**Status:** Reality assessment — not certified  
**Date:** 2026-06-18  
**Related:** [BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md](./BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — correct layer, expected behavior |
| **P** | Partial — works with gaps |
| **N** | Non-compliant or missing |
| **—** | Not applicable |
| **BO** | Owned by Business Operations module (overlap row) |

**Columns:** PE = Policy Engine; Act = normalized activity; Ev = domain event; Ntf = notification; RT = realtime; AI = AI surface

**Scope:** Core BA mounts only (`/api/business`, `/api/org-chart`, `/api/business-front`, `/api/business-ai`, `/api/modules`, webhooks, `/api/sso`). BO-overlap rows marked.

---

## 1. Configuration operations

### 1.1 Business profile

| Operation | Route | Handler | PE | Act | Ev | Ntf | RT | Status | Notes |
|-----------|-------|---------|----|----|----|----|-----|--------|-------|
| Create business | `POST /api/business` | `createBusiness` | P | N | N | N | — | P | Inline Prisma in controller |
| Get business | `GET /api/business/:id` | `getBusiness` | — | N | N | N | — | P | Tenant scoped |
| Update business | `PUT|PATCH /api/business/:id` | `updateBusiness` | P | N | N | N | — | P | `BUSINESS_UPDATE` dual partial |
| Upload logo | `POST /api/business/:id/logo` | `uploadLogo` | P | N | N | N | — | P | Storage + business update |
| Delete logo | `DELETE /api/business/:id/logo` | `deleteLogo` | P | N | N | N | — | P | |
| Setup status | `GET /api/business/:id/setup-status` | `getSetupStatus` | — | N | N | N | — | C | Read-only |

### 1.2 Branding & preferences (on Business model)

| Operation | Route | Handler | PE | Act | Ev | Ntf | RT | Status | Notes |
|-----------|-------|---------|----|----|----|----|-----|--------|-------|
| Update branding JSON | via `updateBusiness` | `updateBusiness` | P | N | N | N | P | P | `BusinessConfigurationContext` may broadcast |
| Update AI settings JSON | via `updateBusiness` | `updateBusiness` | P | N | N | N | — | P | `Business.aiSettings` |
| Update scheduling config JSON | via `updateBusiness` | `updateBusiness` | P | N | N | N | — | P | **BO overlap** — Scheduling reads |

### 1.3 SSO

| Operation | Route | PE | Act | Status | Notes |
|-----------|-------|----|----|--------|-------|
| List SSO configs | `GET /api/sso/business/:businessId` | N | N | P | Enterprise feature |
| Create SSO | `POST /api/sso/business/:businessId` | N | N | P | |
| Update SSO | `PUT /api/sso/business/:businessId/:id` | N | N | P | |
| Delete SSO | `DELETE /api/sso/business/:businessId/:id` | N | N | P | |

### 1.4 Webhooks

| Operation | Route | PE | Act | Status | Notes |
|-----------|-------|----|----|--------|-------|
| List subscriptions | `GET /api/business/:businessId/webhook-subscriptions` | N | N | P | |
| Create subscription | `POST ...` | N | N | P | |
| Update subscription | `PUT .../:id` | N | N | P | |
| Delete subscription | `DELETE .../:id` | N | N | P | |
| Test delivery | `POST .../:id/test` | N | N | P | |

---

## 2. Management operations

### 2.1 Business members

| Operation | Route | Handler | PE | Act | Status | Notes |
|-----------|-------|---------|----|-----|--------|-------|
| List members | `GET /api/business/:id/members` | `getMembers` | — | N | P | Legacy on business router |
| Update member | `PUT /api/business/:id/members/:userId` | `updateMember` | P | N | P | `BUSINESS_MEMBER_UPDATE` |
| Remove member | `DELETE /api/business/:id/members/:userId` | `removeMember` | P | N | P | |
| Invite member | `POST /api/business/:businessId/invite` | `inviteMember` | P | N | P | |
| Accept invite | `POST /api/business/invite/accept/:token` | `acceptInvite` | P | N | P | |
| Bulk role update | `PUT /api/member/business/members/:memberId/role` | memberController | P | N | P | |

### 2.2 Organizational tiers

| Operation | Route | Service | PE | Act | Status |
|-----------|-------|---------|----|-----|--------|
| List tiers | `GET /api/org-chart/tiers/:businessId` | `orgChartService` | N | N | P |
| Create tier | `POST /api/org-chart/tiers` | `orgChartService` | N | N | P |
| Update tier | `PUT /api/org-chart/tiers/:id` | `orgChartService` | N | N | P |
| Delete tier | `DELETE /api/org-chart/tiers/:id` | `orgChartService` | N | N | P |

### 2.3 Departments

| Operation | Route | Service | PE | Act | Status |
|-----------|-------|---------|----|-----|--------|
| List departments | `GET /api/org-chart/departments/:businessId` | `orgChartService` | N | N | P |
| Create department | `POST /api/org-chart/departments` | `orgChartService` | N | N | P |
| Update department | `PUT /api/org-chart/departments/:id` | `orgChartService` | N | N | P |
| Delete department | `DELETE /api/org-chart/departments/:id` | `orgChartService` | N | N | P |

### 2.4 Positions

| Operation | Route | Service | PE | Act | Status |
|-----------|-------|---------|----|-----|--------|
| List positions | `GET /api/org-chart/positions/:businessId` | `orgChartService` | N | N | P |
| Create position | `POST /api/org-chart/positions` | `orgChartService` | N | N | P |
| Update position | `PUT /api/org-chart/positions/:id` | `orgChartService` | N | N | P |
| Delete position | `DELETE /api/org-chart/positions/:id` | `orgChartService` | N | N | P | Hard delete |

### 2.5 Employee positions (identity)

| Operation | Route | Service | PE | Act | Status |
|-----------|-------|---------|----|-----|--------|
| Assign employee | `POST /api/org-chart/employees/assign` | `employeeManagementService` | N | N | P |
| Remove employee | `DELETE /api/org-chart/employees/:id` | `employeeManagementService` | N | N | P |
| Transfer employee | `POST /api/org-chart/employees/transfer` | `employeeManagementService` | N | N | P |
| List employees | `GET /api/org-chart/employees/:businessId` | `employeeManagementService` | N | N | C |
| Employee summary | `GET /api/org-chart/employees/summary/:businessId` | `employeeManagementService` | N | N | C |

### 2.6 Permissions

| Operation | Route | Service | PE | Act | Status |
|-----------|-------|---------|----|-----|--------|
| List permissions | `GET /api/org-chart/permissions` | `permissionService` | N | N | C |
| Check permission | `GET /api/org-chart/permissions/check` | `permissionService` | N | N | C |
| User permissions | `GET /api/org-chart/permissions/user/:userId/:businessId` | `permissionService` | N | N | C |
| Business permissions | `GET /api/org-chart/permissions/:businessId` | `permissionService` | N | N | C |
| List permission sets | `GET /api/org-chart/permission-sets/:businessId` | `permissionService` | N | N | P |
| Create permission set | `POST /api/org-chart/permission-sets` | `permissionService` | N | N | P |
| Update permission set | `PUT /api/org-chart/permission-sets/:id` | `permissionService` | N | N | P |
| Delete permission set | `DELETE /api/org-chart/permission-sets/:id` | `permissionService` | N | N | P |
| Copy permission set | `POST /api/org-chart/permission-sets/:id/copy` | `permissionService` | N | N | P |

### 2.7 Module lifecycle

| Operation | Route | PE | Act | Status | Notes |
|-----------|-------|----|-----|--------|-------|
| List installed modules | `GET /api/modules/business/:businessId` | N | N | P | |
| Install module | `POST /api/modules/install` | N | N | P | |
| Uninstall module | `DELETE /api/modules/uninstall` | N | N | P | |
| Configure module | `PUT /api/modules/configure` | N | N | P | |

### 2.8 Front page / workspace shell

| Operation | Route | Service | PE | Act | Status |
|-----------|-------|---------|----|-----|--------|
| Get config | `GET /api/business-front/:businessId/config` | `businessFrontPageService` | N | N | P |
| Update config | `PUT /api/business-front/:businessId/config` | `businessFrontPageService` | N | N | P |
| List widgets | `GET /api/business-front/:businessId/widgets` | `businessFrontPageService` | N | N | P |
| CRUD widgets | `POST|PUT|DELETE .../widgets` | `businessFrontPageService` | N | N | P |
| Preview / customize | `GET|PUT .../preview`, `.../customization` | `businessFrontPageService` | N | N | P |

### 2.9 BO overlap — stations & locations (Scheduling)

| Operation | Route | Owner | Status | Notes |
|-----------|-------|-------|--------|-------|
| CRUD stations | `/api/scheduling/admin/stations` | **BO** | C | UI in `StationsAndPositionsEditor` |
| CRUD job locations | `/api/scheduling/admin/job-locations` | **BO** | C | |

### 2.10 BO overlap — operational policies (HR)

| Operation | Route | Owner | Status | Notes |
|-----------|-------|-------|--------|-------|
| Get HR settings | `GET /api/hr/admin/settings` | **BO** | P | Exposed in BA settings UI |
| Update HR settings | `PUT /api/hr/admin/settings` | **BO** | P | |
| CRUD attendance policies | `/api/hr/admin/attendance/policies` | **BO** | P | |

### 2.11 Unwired — approval chains

| Operation | Route | Status | Notes |
|-----------|-------|--------|-------|
| Manage approval hierarchy | — | **N** | `ManagerApprovalHierarchy` — no routes |

---

## 3. Analytics operations

| Operation | Route | Handler | Status | Notes |
|-----------|-------|---------|--------|-------|
| Business aggregate analytics | `GET /api/business/:id/analytics` | `getBusinessAnalytics` | P | Controller Prisma |
| Module analytics | `GET /api/business/:id/module-analytics` | `getModuleAnalytics` | P | |
| Workspace analytics page | UI only | — | P | Aggregates module views |
| HR analytics | `/api/hr/admin/analytics/*` | **BO** | P | |
| Scheduling labor analytics | scheduling admin analytics | **BO** | **N** | 501 stubs |
| Business AI analytics | `GET /api/business-ai/:businessId/analytics` | businessAI | P | |

---

## 4. AI operations

| Operation | Route | Owner | Status | Notes |
|-----------|-------|-------|--------|-------|
| Initialize AI twin | `POST /api/business-ai/:businessId/initialize` | BA | P | |
| Get/update AI config | `GET|PUT /api/business-ai/:businessId/config` | BA | P | |
| Interact with twin | `POST /api/business-ai/:businessId/interact` | BA | P | |
| Employee AI access | `PUT /api/business-ai/:businessId/employee-access` | BA | P | |
| Learning events | `GET /api/business-ai/:businessId/learning-events` | BA | P | |
| Review learning event | `PUT .../learning-events/:eventId/review` | BA | P | Approval-like flow |
| Centralized insights | `GET .../centralized-insights` | BA | P | |
| Global business AI admin | `/api/admin/business-ai/*` | **Admin Portal** | P | Operator only |
| Module AI context (HR/sched) | module AI routes | **BO** | P | Read providers |

---

## 5. Integration operations

| Operation | Route | Status | Notes |
|-----------|-------|--------|-------|
| Webhook subscribe/deliver | webhook routes | P | See §1.4 |
| SSO configure | sso routes | P | See §1.3 |
| Module install | module routes | P | See §2.7 |
| Business config WebSocket sync | `BusinessConfigurationContext` | P | Planned/incomplete per memory-bank |
| Schedule publish → calendar | `hrScheduleService` | P | **Shared bridge** — BO trigger |
| Front-page → WC migration | `workforceMigrationService` | P | **BO** WC bridge |

---

## 6. Matrix summary

| Category | Operations (approx.) | C | P | N |
|----------|---------------------|---|---|---|
| Configuration | 25 | 1 | 22 | 2 |
| Management | 45 | 5 | 38 | 2 |
| Analytics | 6 | 0 | 5 | 1 |
| AI | 9 | 0 | 8 | 1 |
| Integration | 6 | 0 | 6 | 0 |
| **Total** | **~91** | **6** | **79** | **6** |

**Dominant pattern:** Operations work at **Partial (P)** — functional but lacking Policy Engine coverage, activity events, and service extraction on `businessController`.

---

## 7. Constitutional gaps (all categories)

| Gap | Affected operations |
|-----|---------------------|
| No BA activity service | All org-chart and business profile mutations |
| No domain events (`orgchart.*`, `business.*`) | Structure and permission changes |
| No Global Trash | Position/department delete |
| Fat business controller | Profile, members, analytics mutations |
| Partial PE | Org-chart uses custom middleware; SSO/webhooks ungated |
| No realtime config sync | Module enable/disable propagation |

---

## Related documents

- [BUSINESS_ADMINISTRATION_CERTIFICATION_READINESS.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_READINESS.md)
- [BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md](./BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md)
