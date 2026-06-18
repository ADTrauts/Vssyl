# Business Administration Service Decomposition Blueprint

**Program:** Business Administration Phase 0B — Architecture Planning  
**Date:** 2026-06-18  
**Constraint:** Design only — no implementation, no file creation in `server/src/`

**Parent:** [BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md](./BUSINESS_ADMINISTRATION_REALITY_ASSESSMENT.md)  
**Closes:** BA-F-002 (blocking)

---

## 1. Executive summary

`businessController.ts` is the primary architectural debt in Business Administration: **18 exported handlers**, **56 `prisma.` calls**, mixed concerns (bootstrap, members, analytics, social follow). Org-chart routes already follow the target pattern (thin routes → services).

**Target state:** Zero Prisma in `businessController`; all mutations through named services with activity hooks.

---

## 2. Current `businessController` map

| Handler | Route(s) | Prisma calls (approx.) | Concerns | Target service |
|---------|----------|--------------------------|----------|----------------|
| `createBusiness` | `POST /api/business` | **14** | Business create, calendar bootstrap, default module install, dashboard | `businessBootstrapService` |
| `getUserBusinesses` | `GET /api/business` | 1 | List | `businessProfileService` |
| `getBusiness` | `GET /api/business/:id` | 2 | Read + membership check | `businessProfileService` |
| `updateBusiness` | `PUT\|PATCH /api/business/:id` | 3 | Profile + branding + scheduling JSON | `businessProfileService` + `businessConfigurationService` |
| `uploadLogo` | `POST /api/business/:id/logo` | 3 | Logo URL update | `businessBrandingService` |
| `removeLogo` | `DELETE /api/business/:id/logo` | 3 | Logo clear | `businessBrandingService` |
| `inviteMember` | `POST /api/business/:businessId/invite` | 6 | Invitation create + notification path | `businessMemberService` |
| `acceptInvitation` | `POST /api/business/invite/accept/:token` | **10** | Member create, dashboard, calendar, invitation | `businessMemberService` + `businessBootstrapService` |
| `getBusinessMembers` | `GET /api/business/:id/members` | 2 | List | `businessMemberService` |
| `updateBusinessMember` | `PUT /api/business/:id/members/:userId` | 3 | Role/flags update | `businessMemberService` |
| `removeBusinessMember` | `DELETE /api/business/:id/members/:userId` | 5 | Soft deactivate + admin guard | `businessMemberService` |
| `getBusinessAnalytics` | `GET /api/business/:id/analytics` | **8** | Cross-entity aggregates | `businessAnalyticsService` |
| `getBusinessModuleAnalytics` | `GET /api/business/:id/module-analytics` | 2 | Module stats | `businessAnalyticsService` |
| `getBusinessSetupStatus` | `GET /api/business/:id/setup-status` | 4 | Onboarding checklist | `businessProfileService` |
| `followBusiness` | `POST .../follow` | 2 | Social | `businessSocialService` (optional) |
| `unfollowBusiness` | `DELETE .../follow` | 1 | Social | `businessSocialService` |
| `getBusinessFollowers` | `GET .../followers` | 1 | Social | `businessSocialService` |
| `getUserFollowing` | `GET /user/following` | 1 | Social | `businessSocialService` |

**Note:** Social follow handlers are low-priority for BA certification; may remain in `businessSocialService` or defer.

---

## 3. Proposed target services

### 3.1 Service catalog

| Service | Responsibility | Prisma entities | Activity owner |
|---------|----------------|-----------------|----------------|
| **`businessProfileService`** | CRUD read/update business record, setup status | `Business` | `businessActivityService` |
| **`businessBrandingService`** | Logo, branding JSON, theme validation | `Business.branding` | `businessActivityService` |
| **`businessConfigurationService`** | `schedulingConfig`, `aiSettings`, preferences JSON | `Business` fields | `businessActivityService` + BO read contract |
| **`businessMemberService`** | Invite, accept, update, remove members | `BusinessMember`, `BusinessInvitation` | `businessActivityService` |
| **`businessBootstrapService`** | Create side effects: calendar, dashboard, default modules | `Calendar`, `Dashboard`, `BusinessModuleInstallation` | `businessActivityService` |
| **`businessAnalyticsService`** | Aggregate analytics queries | Read-only cross-table | None (read) |
| **`businessIntegrationService`** | Webhook + SSO orchestration (future extract from routes) | `WebhookSubscription`, `SSOConfig` | `businessActivityService` |
| **`businessApprovalService`** | `ManagerApprovalHierarchy` CRUD + resolution (**design only**) | `ManagerApprovalHierarchy` | `businessActivityService` |
| **`businessActivityService`** | Normalized `emitModuleActivityEvent` for BA | — | Platform |
| **`orgChartActivityService`** | Activity for structure mutations | — | Platform (paired with existing org services) |

**Existing services (retain):** `orgChartService`, `permissionService`, `employeeManagementService`, `businessFrontPageService`, `businessWorkspaceSeeder`.

### 3.2 Controller target

| Controller | After extraction |
|------------|------------------|
| `businessController.ts` | HTTP validation, PE dual invoke, service call, response map — **0 Prisma** |
| `org-chart.ts` routes | Unchanged pattern; add activity calls in services |

---

## 4. Extraction sequence (BA-1B)

| Phase | Service | Handlers moved | Dependency |
|-------|---------|----------------|------------|
| **B1** | `businessProfileService` | `getBusiness`, `getUserBusinesses`, `getBusinessSetupStatus` | BA-1A activity stubs |
| **B2** | `businessBrandingService` | `uploadLogo`, `removeLogo` | B1 |
| **B3** | `businessMemberService` | `inviteMember`, `acceptInvitation`, `getBusinessMembers`, `updateBusinessMember`, `removeBusinessMember` | B1 + activity |
| **B4** | `businessBootstrapService` | Extract from `createBusiness`, `acceptInvitation` side effects | B3 |
| **B5** | `businessProfileService` (write) | `updateBusiness` — split config fields to `businessConfigurationService` | B2, B4 |
| **B6** | `businessAnalyticsService` | `getBusinessAnalytics`, `getBusinessModuleAnalytics` | B1 (read-only) |
| **B7** | `createBusiness` orchestration | Thin orchestrator calling bootstrap + profile | B4, B5 |

**Critical path:** B1 → B3 → B4 → B5 → B7 (create path last — highest risk).

---

## 5. Route ownership after decomposition

| Mount | Owner layer | Notes |
|-------|-------------|-------|
| `/api/business` | `businessController` → services above | Canonical profile/member |
| `/api/org-chart` | Inline routes → `orgChartService`, `permissionService`, `employeeManagementService` | Add `orgChartActivityService` hooks inside services |
| `/api/business-front` | `businessFrontPageService` | Already thin |
| `/api/business-ai` | `BusinessAIDigitalTwinService` | Enterprise AI — separate extraction optional |
| `/api/modules` | Module platform | PE in BA-1C |
| Webhooks / SSO | Route → **`businessIntegrationService`** (new) | BA-1B optional wave |

---

## 6. Activity & audit architecture (BA-F-001 design)

### 6.1 Module id strategy

Business Administration is not a marketplace module. Use **platform activity namespace**:

| Logical surface | `moduleId` in activity envelope | Rationale |
|-----------------|-----------------------------------|-----------|
| Business profile, members, branding | `business_admin` | New platform subdomain id (planning) |
| Org chart structure | `org_chart` | Matches API mount semantics |

Alternative (council decision): single `moduleId: 'platform'` with action prefixes — **not recommended** (weak module filtering).

### 6.2 Activity action taxonomy (business_admin)

| Action | Trigger | targetType |
|--------|---------|------------|
| `business_admin_business_created` | `createBusiness` | `business` |
| `business_admin_business_updated` | `updateBusiness` | `business` |
| `business_admin_branding_updated` | branding/logo change | `business` |
| `business_admin_member_invited` | `inviteMember` | `business_invitation` |
| `business_admin_member_joined` | `acceptInvitation` | `business_member` |
| `business_admin_member_updated` | `updateBusinessMember` | `business_member` |
| `business_admin_member_removed` | `removeBusinessMember` | `business_member` |
| `business_admin_config_updated` | scheduling/ai JSON change | `business` |
| `business_admin_webhook_*` | webhook CRUD | `webhook_subscription` |
| `business_admin_sso_*` | SSO CRUD | `sso_config` |

### 6.3 Activity action taxonomy (org_chart)

| Action | Trigger | targetType |
|--------|---------|------------|
| `org_chart_tier_created` | tier CRUD | `organizational_tier` |
| `org_chart_department_created` | department CRUD | `department` |
| `org_chart_position_created` | position CRUD | `position` |
| `org_chart_employee_assigned` | assign | `employee_position` |
| `org_chart_employee_removed` | remove | `employee_position` |
| `org_chart_employee_transferred` | transfer | `employee_position` |
| `org_chart_permission_set_created` | permission set CRUD | `permission_set` |
| `org_chart_permission_set_copied` | copy | `permission_set` |

### 6.4 Domain event taxonomy (parallel)

Register in `domainEventRegistry.ts` (implementation BA-1A):

| Namespace | Examples |
|-----------|----------|
| `business.profile.updated` | Branding, name, config JSON |
| `business.member.invited` | Invitation |
| `business.member.joined` | New member |
| `orgchart.department.created` | Structure change |
| `orgchart.position.deleted` | Structure change |
| `orgchart.employee.assigned` | Identity anchor change — **BO consumers** |
| `orgchart.permission_set.updated` | Access change |

**BO dependency:** HR, Scheduling, and WC should subscribe to `orgchart.employee.*` and `orgchart.position.*` for cache invalidation — document in integration contract (BA-1D).

### 6.5 Audit trail

| Layer | Design |
|-------|--------|
| Normalized activity | Primary audit for certification (G2) |
| `PermissionChange` model | Wire on permission set mutations — supplement activity |
| Immutable admin audit log | Optional P2 — not blocking L3 WITH FINDINGS |

### 6.6 V_Link integration points

| Mutation | V_Link action |
|----------|---------------|
| Position delete | `orgChartVlinkLifecycleService` — archive relationships |
| Employee remove from position | Unlink position-scoped V_Links |
| Department delete | Cascade check via access service |

**Pattern:** Mirror `schedulingVlinkLifecycleService` / `hrVlinkLifecycleService` — implement in BA-2 if not BA-1A.

### 6.7 Notification integration points

| Event | Notification type (proposed) |
|-------|------------------------------|
| Member invited | `business_admin_member_invited` |
| Member joined | `business_admin_member_joined` |
| Permission set changed | `business_admin_permission_changed` (optional) |

Register in notifications page discovery when implemented — follow `NOTIFICATION_METADATA_GUIDE.md`.

### 6.8 AI grounding implications

| Activity event | AI consumer |
|----------------|-------------|
| `org_chart_employee_assigned` | Business AI twin context refresh |
| `business_admin_config_updated` | `workspaceAIPolicyDigest` invalidation |
| Structure changes | Module AI context providers should re-fetch org overview |

**Rule:** Emit activity **after** successful mutation only — never on failed authorize.

---

## 7. `businessApprovalService` (BA-F-005 design only)

| Operation | Route (proposed) | Model |
|-----------|------------------|-------|
| List hierarchy for employee | `GET /api/org-chart/approval-hierarchy/:businessId/:employeePositionId` | `ManagerApprovalHierarchy` |
| Set approver chain | `PUT /api/org-chart/approval-hierarchy` | same |
| Resolve next approver | Internal — called by HR PTO routes | same |

**Owner:** Joint BA + HR — BA owns API surface; HR owns workflow consumption. **Defer implementation to BA-2**; do not block BA-1 on this.

---

## 8. Acceptance criteria (BA-1B close)

- [ ] `businessController.ts` — **0** `prisma.` references
- [ ] Each target service has unit test file
- [ ] Activity wired on all write paths (BA-1A dependency)
- [ ] `createBusiness` bootstrap isolated and integration-tested
- [ ] No behavior change to API contracts (route paths unchanged)

---

## Related documents

- [BUSINESS_ADMINISTRATION_FINDINGS_REGISTER.md](./BUSINESS_ADMINISTRATION_FINDINGS_REGISTER.md)
- [BUSINESS_ADMINISTRATION_IMPLEMENTATION_SEQUENCE.md](./BUSINESS_ADMINISTRATION_IMPLEMENTATION_SEQUENCE.md)
