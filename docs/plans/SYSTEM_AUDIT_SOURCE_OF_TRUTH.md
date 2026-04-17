# ACSystem Audit Source of Truth

Last updated: 2026-04-17  
Status: Active  
Owner: Platform Engineering / Andrew + AI agent

---

## Purpose

This document is the canonical source of truth for the Vssyl full-system audit and modernization effort.

Use this document to track:

1. Scope and goals.
2. Audit phases and review order.
3. Findings and severity.
4. Decisions made during review.
5. Remediation status and verification.

If information related to this audit appears elsewhere, this file wins unless explicitly superseded here.

---

## Core Goal

Systematically review the entire Vssyl codebase to ensure it is:

1. Correct.
2. Secure.
3. Maintainable.
4. Consistent with current architectural standards.
5. Production-ready for continued growth.

This effort assumes some older parts of the codebase were created under lower-quality coding conditions and may now need validation, restructuring, or replacement.

---

## Primary Outcomes

1. Identify correctness bugs, security risks, architectural drift, and legacy code debt.
2. Separate real production risk from merely old or ugly code.
3. Establish a prioritized remediation plan instead of ad hoc cleanup.
4. Preserve working systems while modernizing weak areas safely.
5. Create a durable operating record for every major audit decision.

---

## Non-Goals

This audit is not intended to:

1. Rewrite the whole platform at once.
2. Replace stable code only because it is old.
3. Mix unrelated feature work into audit-driven changes.
4. Disrupt in-progress local work without explicit review.
5. Create scattered planning documents for the same initiative.

---

## Source-of-Truth Rules

1. This is the primary document for the audit effort.
2. New findings should be logged here before or alongside remediation work.
3. Major implementation decisions should be recorded in the Decision Log.
4. Every remediation item should reference verification performed.
5. If a follow-up document is needed for a narrow subsystem, it must link back to this file and not replace it.

---

## Current Operating Constraints

1. The repository already contains unrelated in-progress local changes and they must be treated carefully.
2. Audit work should prefer read-only review first, then targeted fixes in controlled waves.
3. Security, auth, data isolation, and correctness take priority over style cleanup.
4. Large high-risk files should be reviewed before broad cosmetic refactors.
5. Existing repo standards around Prisma, API proxying, multi-tenant scoping, storage service usage, and logging must remain the baseline.

---

## Local State Snapshot At Audit Start

Known modified or new files already present in the working tree when this audit effort was started:

1. `server/.env`
2. `server/src/controllers/moduleController.ts`
3. `server/src/services/__tests__/moduleArtifactSmartScan.test.ts`
4. `server/src/services/moduleArtifactSmartScan.ts`
5. `web/src/app/admin-portal/modules/page.tsx`

These files may overlap with audit work and require extra caution before any edits.

---

## Audit Principles

### Priority Order

1. Security
2. Data correctness
3. Tenant isolation
4. Reliability and operational safety
5. Maintainability
6. Developer ergonomics

### Review Philosophy

1. Prefer evidence over intuition.
2. Treat oversized files and bypass paths as risk multipliers.
3. Do not refactor critical flows without understanding their runtime and data model impact.
4. Preserve behavior intentionally when behavior is correct.
5. Log why something is kept, not just why something is changed.

---

## System Inventory

### Monorepo areas

1. `web`
  Next.js app router frontend, dashboard flows, admin portal, business workspace, module pages, API proxy.
2. `server`
  Express API, controllers, routes, services, auth, Stripe, AI, module marketplace, WebSockets, admin surfaces.
3. `shared`
  Shared components, types, and utilities.
4. `prisma`
  Modular Prisma schema sources, generated schema, migrations.
5. `docs`
  Plans, guides, and operational documentation.

### High-complexity platform areas

1. Authentication and authorization.
2. Multi-tenant scoping across personal, business, and household contexts.
3. Admin portal and admin-only APIs.
4. Billing and Stripe flows.
5. AI provider orchestration, attachments, and query metering.
6. Module marketplace, uploads, review, and runtime sandboxing.
7. WebSocket and notification systems.
8. Prisma schema and migration discipline.
9. Production configuration and deployment paths.

---

## Initial Risk Register

These are seeded concerns at the start of the audit. They are not final findings yet.


| ID    | Area                    | Risk Hypothesis                                                                                | Initial Priority | Status               |
| ----- | ----------------------- | ---------------------------------------------------------------------------------------------- | ---------------- | -------------------- |
| R-001 | Auth / Admin            | Admin, debug, or one-off operational routes may not be consistently gated.                     | Critical         | Confirmed in Phase 1 |
| R-002 | Multi-tenant data       | Some queries may be missing business, household, or dashboard scoping.                         | Critical         | Confirmed in Phase 2 |
| R-003 | Backend architecture    | Large controllers/services may hide mixed responsibilities and inconsistent validation.        | High             | Confirmed in Phase 3 |
| R-004 | Billing                 | Stripe and subscription flows may contain fragile legacy assumptions.                          | High             | Confirmed in Phase 5 |
| R-005 | AI systems              | Provider, attachment, logging, or query-metering paths may have correctness or privacy issues. | High             | Confirmed in Phase 5 |
| R-006 | Module platform         | Module upload, artifact review, runtime, and sandbox flow may have hardening gaps.             | High             | Confirmed in Phase 5 |
| R-007 | Prisma / schema         | Migration drift, archive confusion, or schema discipline issues may exist.                     | High             | Open                 |
| R-008 | Frontend API usage      | Some frontend code may bypass proxy standards or use inconsistent endpoint patterns.           | Medium           | Confirmed in Phase 4 |
| R-009 | Shared package hygiene  | Legacy duplicates or parallel exports may create maintenance hazards.                          | Medium           | Open                 |
| R-010 | Logging / observability | Older code may use inconsistent logging and weak operational diagnostics.                      | Medium           | Confirmed in Phase 3 |


---

## Audit Phases

### Phase 1 - Security, Auth, and Access Control

Focus:

1. Authentication middleware.
2. Authorization checks.
3. Admin-only route enforcement.
4. Debug and operational endpoints.
5. Sensitive action protection.

Success criteria:

1. Sensitive endpoints have consistent auth requirements.
2. Admin and elevated operations are clearly and correctly protected.
3. No unsafe production route exposure is left undocumented.

### Phase 2 - Data Isolation and Persistence Safety

Focus:

1. Business, household, and dashboard scoping.
2. Query correctness.
3. Prisma usage patterns.
4. Migration hygiene.
5. Data integrity assumptions.

Success criteria:

1. Multi-tenant boundaries are explicit and enforced.
2. Schema and migration workflow is consistent and safe.
3. High-risk database paths are identified and verified.

### Phase 3 - Backend Architecture and Service Quality

Focus:

1. Large controllers and services.
2. Validation quality.
3. Error handling consistency.
4. Logging standards.
5. Route-controller-service separation.

Success criteria:

1. God objects and mixed-responsibility paths are identified.
2. Critical backend flows have clear ownership and contracts.
3. Refactor candidates are prioritized by risk, not annoyance.

### Phase 4 - Frontend Architecture and UX Reliability

Focus:

1. API proxy adherence.
2. Session and auth UX.
3. Admin portal complexity.
4. Business workspace consistency.
5. Legacy component duplication.

Success criteria:

1. Frontend data access patterns are consistent.
2. Critical user flows are backed by predictable architecture.
3. High-risk UI surfaces have a clear cleanup path.

### Phase 5 - Platform Systems

Focus:

1. WebSockets.
2. Notifications.
3. AI pipelines.
4. Module marketplace/runtime.
5. Billing and payments.

Success criteria:

1. Cross-cutting systems are understood end to end.
2. Integration risks are documented and ranked.
3. System hardening work is sequenced safely.

### Phase 6 - Testing, CI/CD, and Operational Readiness

Focus:

1. Unit and integration coverage quality.
2. E2E coverage of critical journeys.
3. Lint and type-check expectations.
4. Deployment pipeline safety.
5. Production config and observability.

Success criteria:

1. Critical gaps in automated protection are documented.
2. Release safety standards are made explicit.
3. Verification requirements are attached to remediation work.

---

## Review Order

Recommended audit order:

1. Security and auth surfaces.
2. Multi-tenant data isolation.
3. Admin/debug/operational routes.
4. Prisma and migration workflow.
5. Billing and Stripe.
6. Module marketplace and runtime.
7. WebSockets and notifications.
8. AI pipeline and attachments.
9. Frontend API contract consistency.
10. Shared package cleanup candidates.
11. Testing gaps and deployment hardening.

---

## Findings Log

Use this section for confirmed findings only.


| ID    | Date       | Severity | Area                                              | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Evidence                                                                                                                                                                                                                                | Status    | Owner    |
| ----- | ---------- | -------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- |
| F-001 | 2026-04-14 | Critical | Auth / Admin setup                                | **Mitigated:** Matches **`A-001`**. Mount only when `ENABLE_ADMIN_SETUP_ROUTES=true` and `ADMIN_SETUP_SECRET` (≥16 chars); routes require setup secret; no plaintext passwords in responses.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `server/src/routes/admin-setup.ts`, `server/src/index.ts`                                                                                                                                                                               | Mitigated | AI agent |
| F-002 | 2026-04-14 | Critical | Billing / access control                          | **Mitigated:** Matches **`A-002`**. `authenticateJWT` + `requireRole('ADMIN')`; mounted only if `NODE_ENV !== 'production'` or `ENABLE_DEBUG_BUSINESS_TIER=true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                | `server/src/routes/debug-business-tier.ts`, `server/src/index.ts`                                                                                                                                                                       | Mitigated | AI agent |
| F-003 | 2026-04-14 | Critical | User data exposure                                | **Mitigated:** Matches **`A-003`**. Unauthenticated `GET /api/debug/users` removed; use `GET /api/admin-portal/users` (JWT + admin) for operator lists.                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `server/src/index.ts`, `server/src/routes/admin-portal.ts`                                                                                                                                                                              | Mitigated | AI agent |
| F-004 | 2026-04-14 | High     | Authorization bypass                              | **Mitigated (2026-04-16):** `requireAdmin` now requires `**user.role === 'ADMIN'`** after `authenticateJWT` (same pattern as `requireRole('ADMIN')`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `server/src/routes/ai-centralized.ts`, `server/src/middleware/auth.ts`                                                                                                                                                                  | Mitigated | AI agent |
| F-005 | 2026-04-14 | Medium   | Auth consistency / security drift                 | **Mitigated (2026-04-15):** `ai-context-debug` and `businessAI` use `**authenticateJWT`** + DB-backed `**req.user**`; admin debug routes use `**requireRole('ADMIN')**`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `server/src/routes/ai-context-debug.ts`, `server/src/routes/businessAI.ts`, `server/src/middleware/auth.ts`                                                                                                                             | Mitigated | AI agent |
| F-006 | 2026-04-14 | High     | Admin surface protection                          | **Mitigated (2026-04-16):** All admin log routes except `**POST /client`** use `**requireRole('ADMIN')**` (parent mount still applies `authenticateJWT`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `server/src/index.ts`, `server/src/routes/admin-logs.ts`, `server/src/controllers/logController.ts`                                                                                                                                     | Mitigated | AI agent |
| F-007 | 2026-04-14 | Medium   | Information disclosure                            | **Mitigated (2026-04-16):** `/api/debug` (debug-modules) is no longer mounted in production unless `ENABLE_PUBLIC_DEBUG_ROUTES=true`. Non-production retains the prior unauthenticated route behavior when mounted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `server/src/routes/debug-modules.ts`, `server/src/index.ts`                                                                                                                                                                             | Mitigated | AI agent |
| F-008 | 2026-04-14 | Medium   | Information disclosure                            | **Mitigated (2026-04-16):** `GET /api/schema` returns **404** when `NODE_ENV === 'production'` unless `ENABLE_PUBLIC_SCHEMA_ROUTE=true`. Non-production behavior unchanged. Test: `server/src/routes/__tests__/health-schema.integration.test.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                    | `server/src/routes/health.ts`, `server/src/index.ts`                                                                                                                                                                                    | Mitigated | AI agent |
| F-009 | 2026-04-14 | Medium   | Authorization inconsistency                       | **Mitigated (2026-04-16):** `**GET /check`** now requires `**ADMIN**` like `**POST /add-employee-columns**`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `server/src/routes/admin-fix-subscriptions.ts`, `server/src/index.ts`                                                                                                                                                                   | Mitigated | AI agent |
| F-010 | 2026-04-14 | Critical | Tenant isolation / authorization                  | **Mitigated (2026-04-17):** Routes use `**requireOrgChartAccess`** / `**requireManageFor***` / `**requireEmployeeUserOrManager**` from `**orgChartPermissions.ts**`; service layer enforces **position/business** alignment for employee flows. Tests: `**org-chart.integration.test.ts`**.                                                                                                                                                                                                                                                                                                                                                                                           | `server/src/routes/org-chart.ts`, `server/src/middleware/orgChartPermissions.ts`, `server/src/services/orgChartService.ts`                                                                                                              | Mitigated | AI agent |
| F-011 | 2026-04-14 | High     | Payment integration correctness                   | **Mitigated:** `**POST /api/payment/webhook`** is registered in `**index.ts**` **before** `**express.json()`** with `**express.raw({ type: 'application/json' })**` and **no JWT**; JWT applies only to `**app.use('/api/payment', authenticateJWT, paymentRouter)`** (non-webhook routes). Same fix as **F-052** / `**A-047`**.                                                                                                                                                                                                                                                                                                                                                      | `server/src/index.ts`, `server/src/routes/payment.ts`, `server/src/controllers/paymentController.ts`                                                                                                                                    | Mitigated | AI agent |
| F-012 | 2026-04-14 | High     | Information disclosure / operational exposure     | **Mitigated (2026-04-16):** `/api/debug/database` is gated with the same production default-off switch as `/api/debug` (`NODE_ENV !== 'production'` or `ENABLE_PUBLIC_DEBUG_ROUTES=true`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `server/src/routes/debug-database.ts`, `server/src/index.ts`                                                                                                                                                                            | Mitigated | AI agent |
| F-013 | 2026-04-14 | Medium   | Auth wiring / feature correctness                 | **Mitigated (2026-04-15):** `**auth-url`**, `**test-config**`, and `**status**` mount `**authenticateJWT**`; `**callback**` stays public. Controller uses `**getUserFromRequest**` from `**middleware/auth**`. Tests: `**google-oauth-auth.integration.test.ts**`.                                                                                                                                                                                                                                                                                                                                                                                                                    | `server/src/routes/googleOAuth.ts`, `server/src/controllers/googleOAuthController.ts`, `server/src/index.ts`                                                                                                                            | Mitigated | AI agent |
| F-014 | 2026-04-14 | Medium   | Account enumeration                               | **Mitigated (2026-04-16):** Resend returns a **single success message** for all cases; email is only sent when a user exists and is **unverified**. Invalid email shape still returns **400**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `server/src/index.ts`                                                                                                                                                                                                                   | Mitigated | AI agent |
| F-015 | 2026-04-14 | Critical | Cross-user write / tenant isolation               | **Mitigated (2026-04-17):** `POST /api/notifications` uses `**req.user.id`** only; `**POST /api/notifications/for-user**` remains **platform `ADMIN`** only. `**advancedNotificationController**` create path no longer honors legacy `**targetUserId**` (disabled router in `index.ts`, aligned for safe re-enable).                                                                                                                                                                                                                                                                                                                                                                 | `server/src/controllers/notificationController.ts`, `server/src/controllers/advancedNotificationController.ts`, `server/src/routes/notification.ts`                                                                                     | Mitigated | AI agent |
| F-016 | 2026-04-14 | Critical | Real-time tenant isolation                        | **Mitigated (2026-04-15):** `join_conversation`, `join_business`, `join_schedule`, and typing handlers now verify active membership before joining rooms or emitting; auto-join on connect uses DB-backed participant lists.                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `server/src/services/chatSocketService.ts`                                                                                                                                                                                              | Mitigated | AI agent |
| F-017 | 2026-04-14 | High     | Real-time data integrity                          | **Mitigated (2026-04-15):** Read receipts were already gated; **message reactions** now call `assertMessageConversationMember` before `messageReaction.upsert`, matching `handleNewMessage` / `mark_read`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `server/src/services/chatSocketService.ts`                                                                                                                                                                                              | Mitigated | AI agent |
| F-018 | 2026-04-14 | High     | Tenant scoping / provisioning integrity           | **Mitigated (2026-04-17):** New context-bound dashboards require **active membership** (`business_member`, `institution_member`, or `household_member`) before create; **at most one** of `businessId` / `institutionId` / `householdId` (else **400**). Existing per-user dashboard short-circuit unchanged. `**DashboardCreationError`** → **403/400** from `**createDashboard`** controller. Tests: `server/src/routes/__tests__/dashboard-context.integration.test.ts`.                                                                                                                                                                                                           | `server/src/services/dashboardService.ts`, `server/src/controllers/dashboardController.ts`, `server/src/services/businessWorkspaceSeeder.ts`                                                                                            | Mitigated | AI agent |
| F-019 | 2026-04-14 | Medium   | Membership lifecycle enforcement                  | **Mitigated (2026-04-16):** Invite, member list, pinned colleagues, role updates, invitation flows, and related gates now load membership with `**isActive: true`** (or treat inactive as non-member). Re-inviting a user with an inactive row is allowed.                                                                                                                                                                                                                                                                                                                                                                                                                            | `server/src/controllers/memberController.ts`                                                                                                                                                                                            | Mitigated | AI agent |
| F-020 | 2026-04-14 | Medium   | Invitation redemption integrity                   | **Mitigated (2026-04-16):** `acceptInvitation` compares `**invitation.email`** to the authenticated user’s DB email (**case-insensitive / trimmed**); mismatch returns **403**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `server/src/controllers/businessController.ts`                                                                                                                                                                                          | Mitigated | AI agent |
| F-021 | 2026-04-14 | Medium   | Marketplace isolation / unpublished data exposure | **Mitigated (2026-04-16):** `getModuleDetails` returns full detail only for `**APPROVED`** modules, the **developer** (`developerId`), or `**ADMIN`**. Others receive **404**. Tests in `moduleController.phase7.test.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `server/src/controllers/moduleController.ts`                                                                                                                                                                                            | Mitigated | AI agent |
| F-022 | 2026-04-14 | Medium   | Wrong-tenant context selection                    | **Mitigated (2026-04-15):** `**fetchModuleContext`** no longer infers `**businessId**` from oldest membership; callers must pass an explicit `**businessId**` (e.g. query) for business-scoped providers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `server/src/ai/services/ModuleAIContextService.ts`                                                                                                                                                                                      | Mitigated | AI agent |
| F-023 | 2026-04-14 | High     | Context-binding integrity                         | **Mitigated (2026-04-16):** `createFolder` requires `**assertUserOwnsDashboard`** when `dashboardId` is set. `**uploadFile**` validates **folder ownership**, `**folderId`/`dashboardId` consistency**, derives `**effectiveDashboardId`** from folder when omitted, and asserts dashboard ownership before persist (`taskDashboardBinding#assertUserOwnsDashboard`).                                                                                                                                                                                                                                                                                                                 | `server/src/controllers/folderController.ts`, `server/src/controllers/fileController.ts`, `server/src/services/taskDashboardBinding.ts`                                                                                                 | Mitigated | AI agent |
| F-024 | 2026-04-14 | Medium   | Conversation scoping / participant policy         | **Mitigated (2026-04-16):** `createConversation` requires **owned `dashboardId`** when set; **tenant-scoped** dashboards require **active membership** for every participant (business / household / institution, in priority order); **personal** (no tenant ids) allows **only the owner** as participant. Tests: `server/src/routes/__tests__/chat-create-conversation.integration.test.ts`.                                                                                                                                                                                                                                                                                       | `server/src/controllers/chatController.ts`                                                                                                                                                                                              | Mitigated | AI agent |
| F-025 | 2026-04-14 | Medium   | Context-binding integrity                         | **Mitigated (2026-04-16):** `createNote` validates **owned dashboard** + `**businessId`** alignment and verifies `**folderId**` (when set) belongs to the same dashboard/business for the creator.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `server/src/controllers/notesController.ts`                                                                                                                                                                                             | Mitigated | AI agent |
| F-026 | 2026-04-14 | Critical | Tenant isolation / IDOR                           | **Mitigated (2026-04-16):** Admin/employee scheduling handlers scope **schedules**, **shifts**, and **schedule templates** by `**req.businessId`** (middleware-resolved tenant): `findFirst` / `findMany` / updates use `**id` + `businessId**`. Shift assign path verifies tenant before update.                                                                                                                                                                                                                                                                                                                                                                                     | `server/src/controllers/schedulingController.ts`, `server/src/middleware/schedulingPermissions.ts`                                                                                                                                      | Mitigated | AI agent |
| F-027 | 2026-04-14 | High     | Tenant-binding integrity                          | **Mitigated (2026-04-16):** `**resolveSchedulingBusinessIdFromRequest`** rejects **query/body `businessId` mismatch** (400). `**createSchedule`** / `**createShift**` / template creates use `**req.businessId**` from that resolution, not body alone.                                                                                                                                                                                                                                                                                                                                                                                                                               | `server/src/controllers/schedulingController.ts`, `server/src/middleware/schedulingPermissions.ts`                                                                                                                                      | Mitigated | AI agent |
| F-028 | 2026-04-14 | High     | Tenant spoofing / context ownership               | **Mitigated (2026-04-16):** Shared `**enforceCalendarContextMembership`** gates `**createCalendar**` and `**autoProvisionCalendar**` (PERSONAL `contextId === userId`; BUSINESS/HOUSEHOLD active membership).                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `server/src/controllers/calendarController.ts`                                                                                                                                                                                          | Mitigated | AI agent |
| F-029 | 2026-04-14 | High     | Cross-context linkage integrity                   | **Mitigated (2026-04-17):** `linkToCalendar` with `**existingEventId`** loads the event (non-trashed), resolves the calendar, and requires **personal calendar ownership** (`PERSONAL` + `contextId`) or a `**calendar_members`** row before updating the meeting. Tests: `server/src/routes/__tests__/place-meeting-calendar-link.integration.test.ts`.                                                                                                                                                                                                                                                                                                                              | `server/src/controllers/placeMeetingController.ts`                                                                                                                                                                                      | Mitigated | AI agent |
| F-030 | 2026-04-14 | High     | Cross-business IDOR                               | **Mitigated (2026-04-16):** Update/delete resolve the link with `**listing.businessId === :businessId`** before mutating; wrong pair returns **404**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `server/src/controllers/placeListingController.ts`                                                                                                                                                                                      | Mitigated | AI agent |
| F-031 | 2026-04-14 | Critical | Tenant isolation / trusted body data              | **Mitigated (2026-04-17):** Routes use `**requireOrgChartAccess`** + manage tier; `**assignedById**` is set from `**req.user**` on assign/transfer. Service enforces **position `businessId`** vs caller `**businessId**` and requires the **assignee to be an active `business_member`** before assign/transfer; validation includes the same membership rule. Tests: `server/src/routes/__tests__/org-chart.integration.test.ts`.                                                                                                                                                                                                                                                   | `server/src/routes/org-chart.ts`, `server/src/services/employeeManagementService.ts`                                                                                                                                                    | Mitigated | AI agent |
| F-032 | 2026-04-14 | Medium   | Context filter mismatch                           | **Mitigated (2026-04-16):** When `dashboardId` is present, the feed requires **dashboard ownership**, then scopes **Drive** (file dashboard), **Chat** (conversation dashboard), **Todo** (`task.dashboardId`), and **Calendar** (context derived from dashboard business/household/institution/personal). Test: `activity-feed-dashboard.integration.test.ts`.                                                                                                                                                                                                                                                                                                                       | `server/src/controllers/activityFeedController.ts`                                                                                                                                                                                      | Mitigated | AI agent |
| F-033 | 2026-04-14 | Medium   | Cross-user directory exposure                     | **Mitigated (2026-04-17):** Member provider requires **shared active `business` / `household` / `institution` membership** or an **accepted `Relationship`** with the searcher before name/email match. Tests: `**search-member-visibility.integration.test.ts**`.                                                                                                                                                                                                                                                                                                                                                                                                                    | `server/src/controllers/searchController.ts`                                                                                                                                                                                            | Mitigated | AI agent |
| F-034 | 2026-04-14 | Medium   | Business summary scoping error                    | **Mitigated (2026-04-16):** `getBusinessPermissionSummary` derives `modulesWithPermissions` and `permissionDistribution` only from that business's `permissionSet` rows (`permissions` JSON arrays), not the global `permission` catalog.                                                                                                                                                                                                                                                                                                                                                                                                                                             | `server/src/services/permissionService.ts`                                                                                                                                                                                              | Mitigated | AI agent |
| F-035 | 2026-04-14 | Critical | IDOR / cross-user mutation                        | **Mitigated (2026-04-16):** `completeTask` and `reopenTask` now require the same access as `getTaskById` / `deleteTask` (`trashedAt` null and caller is `createdById` or `assignedToId`) before `task.update`. Tests: `server/src/routes/__tests__/todo-task-complete.integration.test.ts`.                                                                                                                                                                                                                                                                                                                                                                                           | `server/src/controllers/todoController.ts`                                                                                                                                                                                              | Mitigated | AI agent |
| F-036 | 2026-04-14 | Critical | Cross-user data exposure                          | **Mitigated (2026-04-16):** Active conversation membership is required; tasks are limited to creator/assignee and must carry a `[Created from chat message: <uuid>]` marker for a message in that conversation. Non-members get 403. Tests: `server/src/routes/__tests__/todo-chat-conversation-tasks.integration.test.ts`.                                                                                                                                                                                                                                                                                                                                                           | `server/src/controllers/todoController.ts`, `server/src/services/todoChatIntegrationService.ts`                                                                                                                                         | Mitigated | AI agent |
| F-037 | 2026-04-14 | High     | Project-scoping IDOR                              | **Mitigated (2026-04-16):** Project **list/create** use `**assertUserOwnedDashboardBusinessAlignment`** on `dashboardId` + `businessId`; **update/delete** assert alignment on the loaded `**TaskProject`** row before mutating.                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `server/src/controllers/todoController.ts`, `server/src/services/taskDashboardBinding.ts`                                                                                                                                               | Mitigated | AI agent |
| F-038 | 2026-04-14 | High     | Context-binding integrity                         | **Mitigated (2026-04-16):** `createTask` and chat `createTaskFromMessage` require the dashboard to be **owned by the caller** (`userId`) and `businessId` / `householdId` to **match** the dashboard row (`taskDashboardBinding` + service order: conversation membership before dashboard on chat path). Tests: `todo-task-context.integration.test.ts`, `todo-chat-conversation-tasks.integration.test.ts`.                                                                                                                                                                                                                                                                         | `server/src/controllers/todoController.ts`, `server/src/services/todoChatIntegrationService.ts`, `server/src/services/taskDashboardBinding.ts`                                                                                          | Mitigated | AI agent |
| F-039 | 2026-04-14 | Medium   | Context-binding integrity                         | **Mitigated (2026-04-16):** `getFolders` / `createFolder` validate **owned dashboard** + `**businessId`** match; **create** validates **parent** in same dashboard/business; **update** validates new **parent** in the same tree. Test: `notes-folder-context.integration.test.ts`.                                                                                                                                                                                                                                                                                                                                                                                                  | `server/src/controllers/notesFolderController.ts`                                                                                                                                                                                       | Mitigated | AI agent |
| F-040 | 2026-04-14 | High     | Backend architecture / scheduling                 | `server/src/controllers/schedulingController.ts` has grown into a multi-domain god controller spanning admin, manager, employee, AI-context, stations, and job-location flows in one file, with a mix of active implementations and `501` placeholder endpoints. This file size and role-mixing materially increases regression, permission-drift, and merge-conflict risk in a business-critical area.                                                                                                                                                                                                                                                                               | `server/src/controllers/schedulingController.ts`                                                                                                                                                                                        | Open      | AI agent |
| F-041 | 2026-04-14 | High     | Admin architecture / service contracts            | The admin surface is split across a very large `server/src/routes/admin-portal.ts` router and a multi-domain `server/src/services/adminService.ts` god service. `AdminService` owns unrelated concerns (users, moderation, analytics, billing, support, performance, modules, impersonation) and exposes many `Promise<unknown>` methods plus placeholder values, which weakens type contracts and makes admin behavior harder to reason about or test safely.                                                                                                                                                                                                                        | `server/src/routes/admin-portal.ts`, `server/src/services/adminService.ts`                                                                                                                                                              | Open      | AI agent |
| F-042 | 2026-04-14 | High     | Module platform architecture                      | `server/src/controllers/moduleController.ts` mixes marketplace listing, installs, developer submissions, admin review, artifact upload session management, malware scanning, and business HR setup side effects in one controller. The same submission-management domain is also implemented separately in `AdminService` / `admin-portal`, creating overlapping query paths and a real risk of divergent validation, authorization, and product behavior.                                                                                                                                                                                                                            | `server/src/controllers/moduleController.ts`, `server/src/services/adminService.ts`, `server/src/routes/admin-portal.ts`                                                                                                                | Open      | AI agent |
| F-043 | 2026-04-14 | Medium   | Validation consistency                            | The shared `validateRequest` middleware exists, but route-level validation is only used in a narrow slice of the backend (`dashboard` and `widget` routes). Most controllers instead rely on ad hoc `req.body` / `req.query` checks and local request-shape assumptions, which makes input validation inconsistent and difficult to audit across the platform.                                                                                                                                                                                                                                                                                                                        | `server/src/middleware/validateRequest.ts`, `server/src/routes/dashboard.ts`, `server/src/routes/widget.ts`, `server/src/controllers/businessController.ts`, `server/src/controllers/schedulingController.ts`                           | Open      | AI agent |
| F-044 | 2026-04-14 | High     | Error handling / operational visibility           | The backend defines a structured async `logger`, but the main error middleware in `server/src/index.ts` only logs unhandled errors in non-production and returns `error.message` directly in client responses. Combined with broad `console.*` usage elsewhere, this creates inconsistent diagnostics and raises the chance of weak production observability and accidental internal-error leakage.                                                                                                                                                                                                                                                                                   | `server/src/index.ts`, `server/src/lib/logger.ts`                                                                                                                                                                                       | Open      | AI agent |
| F-045 | 2026-04-14 | Medium   | Request typing / boundary drift                   | Controllers repeatedly bypass the canonical auth typing patterns by defining local `getUserFromRequest` helpers or reading `(req as any).user` directly instead of consistently using shared authenticated request types/helpers. This weakens compile-time guarantees and encourages drift in null-checking, role handling, and controller-service boundaries.                                                                                                                                                                                                                                                                                                                       | `server/src/controllers/moduleController.ts`, `server/src/controllers/businessController.ts`, `server/src/controllers/aiQueryController.ts`, `server/src/controllers/googleOAuthController.ts`                                          | Open      | AI agent |
| F-046 | 2026-04-14 | High     | Frontend state architecture / business context    | Business configuration state is provided from multiple overlapping frontend shells. `web/src/app/business/[id]/layout.tsx` and `web/src/app/business/[id]/workspace/layout.tsx` both wrap the same route tree in `BusinessConfigurationProvider`, while `web/src/app/dashboard/DashboardLayout.tsx` also mounts `BusinessConfigurationProvider` around dashboard/work-tab flows, including a `WorkTab` branch that mounts the provider without a `businessId`. This creates competing sources of truth for business configuration and raises the risk of duplicate fetch/subscription work and inconsistent branding/state behavior between personal-work and direct business routes. | `web/src/app/business/[id]/layout.tsx`, `web/src/app/business/[id]/workspace/layout.tsx`, `web/src/app/dashboard/DashboardLayout.tsx`                                                                                                   | Open      | AI agent |
| F-047 | 2026-04-14 | High     | Frontend architecture / shared shell hotspot      | **Partially mitigated (2026-04-17):** Canonical **`MODULE_ICONS`** moved to **`web/src/config/moduleIcons.ts`**; **`RightSidebarCustomizer`** imports from there (no dependency on the dashboard route module for icons). **`DashboardLayout`** still centralizes most shell behavior; further splits (hooks / subcomponents) remain.                                                                                                                                                                                                                                                                                                                                               | `web/src/config/moduleIcons.ts`, `web/src/app/dashboard/DashboardLayout.tsx`, `web/src/components/sidebar/RightSidebarCustomizer.tsx`                                                                                                    | Open      | AI agent |
| F-048 | 2026-04-14 | Medium   | Business workspace routing / UX consistency       | Business workspace navigation is split across competing patterns. `DashboardLayoutWrapper` derives the active module from both nested path segments and `window.location.search`, while `BusinessWorkspaceContent` and module shells still support query-param module switching. HR is a concrete example of the drift: the workspace can render embedded `HRLayout`, but there are also dedicated nested HR routes, and `HRLayout` itself reads state from `window.location.search` rather than App Router search APIs. This makes deep links, active-module highlighting, and shell behavior harder to reason about consistently.                                                   | `web/src/components/business/DashboardLayoutWrapper.tsx`, `web/src/components/business/BusinessWorkspaceContent.tsx`, `web/src/components/hr/HRLayout.tsx`, `web/src/app/business/[id]/workspace/page.tsx`                              | Open      | AI agent |
| F-049 | 2026-04-14 | High     | Frontend API contract / proxy drift               | **Mitigated (2026-04-17):** Profile and admin API test pages use `**/api/profile`** and `**/api/admin-portal/test**` (Next proxy). `**PUT /api/profile**` implemented for name updates (was missing server-side).                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `web/src/app/profile/page.tsx`, `web/src/app/admin-portal/test-api/page.tsx`, `server/src/index.ts`                                                                                                                                     | Mitigated | AI agent |
| F-050 | 2026-04-14 | Medium   | Frontend API consistency / debug leakage          | **Mitigated (2026-04-17):** Calendar ICS export and admin log export use same-origin **`/api/...`** fetches. Unused env-based URL constants removed from **`retention.ts`** / **`governance.ts`**. Prior **`127.0.0.1:7242`** debug-ingest calls are absent from the listed module/trash files in current tree.                                                                                                                                                                                                                                                                                                                                                                      | `web/src/api/calendar.ts`, `web/src/api/logs.ts`, `web/src/api/retention.ts`, `web/src/api/governance.ts`                                                                                                                               | Mitigated | AI agent |
| F-051 | 2026-04-14 | Medium   | Session/auth UX reliability                       | **Mitigated (2026-04-17):** **`web/src/middleware.ts`** gates **`/admin-portal/*`** (non-**`ADMIN`** → **`/forbidden`**), **`/profile/*`**, and **`/business/*`** (session required via NextAuth **`withAuth`**). **`/forbidden`** page; **`admin-portal/layout`** + **`profile/page`** client fallbacks aligned. Tenant/membership authorization remains in layouts and APIs.                                                                                                                                                                                                                                       | `web/src/middleware.ts`, `web/src/app/forbidden/page.tsx`, `web/src/app/admin-portal/layout.tsx`, `web/src/app/profile/page.tsx`                                                                                                        | Mitigated | AI agent |
| F-052 | 2026-04-14 | Critical | Billing / webhook intake correctness              | **Mitigated:** `**POST /api/payment/webhook`** registered **before** `**express.json()`** with **raw body**; `**handleWebhook`** not behind JWT. See `**A-047**`, `**stripe-webhook.integration.test.ts**`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `server/src/index.ts`, `server/src/controllers/paymentController.ts`                                                                                                                                                                    | Mitigated | AI agent |
| F-053 | 2026-04-14 | High     | Real-time delivery architecture                   | **Mitigated (2026-04-17):** User-targeted events use Socket.IO room `user_${userId}` so **all tabs** for a user receive emits; `broadcastToUser` / notifications use `io.to('user_…')`. Optional **`SOCKET_IO_REDIS_URL`** (or `REDIS_URL`) attaches `@socket.io/redis-adapter` for **multi-instance** broadcast when configured. In-memory process still has no cross-host fan-out without Redis.                                                                                                                                                                                                                                                                                    | `server/src/services/chatSocketService.ts`                                                                                                                                                                                              | Mitigated | AI agent |
| F-054 | 2026-04-14 | High     | Real-time authorization / privacy                 | **Mitigated (2026-04-17):** `join_conversation` / `join_business` / `join_schedule` / typing remain **membership-gated** (**F-016**). **`presence_update`** now emits **`user_presence`** only to **`conversation_${id}`** rooms for conversations the user participates in (`getActiveConversationIdsForUser` + `socket.to(...).emit`), not **`io.emit`** globally.                                                                                                                                                                                                                                                                                                                | `server/src/services/chatSocketService.ts`                                                                                                                                                                                              | Mitigated | AI agent |
| F-055 | 2026-04-14 | High     | Notification realtime client lifecycle            | **Mitigated (2026-04-17):** One shared Socket.IO client with ref-counted lifecycle; event forwarding uses listener sets; `onNotification` / `onNotificationUpdate` / `onNotificationDelete` return **unsubscribe** functions. `NotificationBadge`, `notifications/page`, and `ChatMainPanel` register in `useEffect` and remove listeners on cleanup. `isConnected` is React state driven by socket connect/disconnect.                                                                                                                                                                                                                                                              | `web/src/lib/notificationSocket.ts`, `web/src/components/NotificationBadge.tsx`, `web/src/app/notifications/page.tsx`, `web/src/app/chat/ChatMainPanel.tsx`                                                                              | Mitigated | AI agent |
| F-056 | 2026-04-14 | High     | Billing / module subscription lifecycle drift     | Module subscription billing is split across multiple partially overlapping Stripe integration paths. `ModuleSubscriptionService` creates DB subscriptions even when Stripe subscription creation fails, relies on placeholder Stripe price IDs (`price_${moduleId}_${tier}`), and defines `handleStripeWebhook` logic that is not wired into the main webhook path. At the same time, `PaymentService` and `StripeService` implement parallel subscription/webhook handling with different assumptions. This creates a high risk of DB/Stripe divergence for module billing state.                                                                                                    | `server/src/services/moduleSubscriptionService.ts`, `server/src/services/paymentService.ts`, `server/src/services/stripeService.ts`                                                                                                     | Open      | AI agent |
| F-057 | 2026-04-14 | Medium   | Module runtime / sandbox environment parity       | The module-platform runtime and review path is strongly environment-coupled. `SandboxService` assumes a local Docker daemon via `dockerode`, which does not match common Cloud Run deployment constraints, while artifact upload finalization in `moduleController` requires configured GCS and rejects non-GCS environments. Together this means module security/runtime validation and upload behavior are not exercised uniformly across environments, increasing the chance of production-only failures or overstated sandbox guarantees.                                                                                                                                         | `server/src/services/sandboxService.ts`, `server/src/controllers/moduleController.ts`                                                                                                                                                   | Open      | AI agent |
| F-058 | 2026-04-14 | Medium   | AI multimodal contract clarity                    | The AI attachment pipeline is capability-aware but can silently degrade multimodal behavior. `DigitalLifeTwinCore` removes `visionImageParts` when the selected provider lacks vision support, and provider capabilities explicitly mark `local` as non-vision. This means requests with image attachments can fall back to summary/text-only behavior without a hard failure or a clearly enforced contract at the platform boundary.                                                                                                                                                                                                                                                | `server/src/ai/core/DigitalLifeTwinCore.ts`, `server/src/ai/providers/capabilities.ts`                                                                                                                                                  | Open      | AI agent |
| F-059 | 2026-04-14 | Critical | Verification discipline / CI enforcement          | **Mitigated (2026-04-17):** Root **`test`** runs **`pnpm --filter vssyl-server test`** (Vitest). **`.github/workflows/ci.yml`** runs **`pnpm install`**, **`prisma migrate deploy`**, **`pnpm type-check`**, **`pnpm test`** with Postgres. Playwright E2E is not in the default CI job (optional / local).                                                                                                                                                                                                                                                                                                                                                                      | `package.json`, `server/package.json`, `.github/workflows/ci.yml`, `memory-bank/testingStrategy.md`                                                                                                                                     | Mitigated | AI agent |
| F-060 | 2026-04-14 | High     | Deployment safety / migration gating              | **Mitigated (2026-04-17):** In production, `bootstrap()` runs `runProductionStartupMigrations()` before `listen`; failures **throw**, `bootstrap().catch` logs and **`process.exit(1)`** — server does not accept traffic with failed migrate/schema build.                                                                                                                                                                                                                                                                                                                                                                                                                           | `server/src/index.ts`                                                                                                                                                                                                                   | Mitigated | AI agent |
| F-061 | 2026-04-14 | High     | Health/readiness signal mismatch                  | **Mitigated (2026-04-17):** `app.use('/api', healthRouter)` only; **`GET /api/health`** and **`GET /api/ready`** in `health.ts` both probe DB via `prisma.$queryRaw`. **`server/Dockerfile.production`** `HEALTHCHECK` uses **`http://localhost:5000/api/ready`**. **`GET /api/live`** remains a lightweight liveness ping without DB.                                                                                                                                                                                                                                                                                                                                                | `server/src/index.ts`, `server/src/routes/health.ts`, `server/Dockerfile.production`                                                                                                                                                    | Mitigated | AI agent |
| F-062 | 2026-04-14 | High     | CI/repo configuration drift                       | **Mitigated (2026-04-17):** CI uses **`pnpm@10.11.0`** (aligned with **`packageManager`**). Workspace packages are **`web`**, **`server`**, **`shared`** only. Default CI does not run a broken `shared` **`format:check`** target. Remaining gap: optional full-repo **`pnpm lint`** / Prettier in CI when ready.                                                                                                                                                                                                                                                                                                                                                                  | `.github/workflows/ci.yml`, `package.json`, `pnpm-workspace.yaml`, `server/Dockerfile.production`                                                                                                                                       | Mitigated | AI agent |
| F-063 | 2026-04-14 | Medium   | Test coverage blind spots in critical flows       | Test files exist, but they are concentrated in a few areas: admin-portal routes, module pipeline paths, and limited E2E flows. Critical flows identified in earlier phases, including Stripe/webhooks, websockets/notifications, tenant-isolation guarantees, and AI attachment behavior, have little or no focused automated coverage. The existing test harness also mounts only a narrow slice of the real server stack in some integration tests.                                                                                                                                                                                                                                 | `server/src/routes/__tests__/*`, `server/src/controllers/__tests__/moduleController.phase7.test.ts`, `server/src/__tests__/helpers/app.ts`, `server/src/__tests__/setup.ts`, `playwright.config.ts`                                     | Open      | AI agent |
| F-064 | 2026-04-14 | Medium   | Release operations / rollback readiness           | **Mitigated (2026-04-17):** **`docs/deployment/CLOUD_RUN_ROLLBACK_RUNBOOK.md`** documents Cloud Run revision rollback, migration failure response, Stripe/webhook notes, and pre-deploy checks. **`cloudbuild.yaml`** still deploys without CI gates in that pipeline; optional future: wire Cloud Build to **`pnpm verify:ci`** or equivalent before deploy.                                                                                                                                                                                                                                                                                                                          | `docs/deployment/CLOUD_RUN_ROLLBACK_RUNBOOK.md`, `cloudbuild.yaml`                                                                                                                                                                       | Mitigated | AI agent |


Severity definitions:

1. Critical
  Security issue, data leak risk, payment risk, or production-break risk.
2. High
  Likely correctness or architectural issue with material user or developer impact.
3. Medium
  Maintainability, consistency, or reliability weakness worth fixing.
4. Low
  Minor cleanup or optimization item.

---

## Remediation Tracker

### Remediation execution queue (how to run the list)

The `**A-*` rows are not a mandatory row-by-row sequence.** Use this queue to pick work in a repeatable way:

1. **Wave S — Security / tenant (Critical `A-*` still Backlog)**
  Examples: `A-001`, `A-002`, `A-009`, `A-023`, `A-027`, `A-031`, `A-032` (public or weakly gated surfaces, IDOR, cross-tenant writes).
2. **Wave P — Platform entrypoints (Phase 5)**
  `A-047`, ~~`A-048`~~, ~~`A-049`~~, `A-050` (Stripe/webhooks, realtime, notification client, billing lifecycle).
3. **Wave R — Release rails (Phase 6)**
  `A-053`–`A-055`, ~~`A-054`~~, ~~`A-057`~~ (CI/verify contract, migrations/readiness/health, deploy runbook).
4. **Wave T — Targeted tests**
  `A-056` once gates reliably fail bad merges.

Within each wave, order by **Critical → High → Medium**, then by deploy risk. Implementation may jump waves for expediency; update **Status** and **Verification** when an item ships.


| ID    | Linked Finding(s) | Remediation                                                                                                                                                                                                                                                                                 | Priority | Status      | Verification                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-001 | F-001             | Remove or hard-disable `/api/admin-setup` in normal runtime. If a bootstrap path must exist, gate it behind strict admin auth plus environment-based kill switch and never return credentials in responses.                                                                                 | Critical | Done        | Mount only when `ENABLE_ADMIN_SETUP_ROUTES=true` and `ADMIN_SETUP_SECRET` (≥16 chars) set; all routes require `X-Admin-Setup-Secret` or `setupSecret` (SHA-256 compare). Plaintext credentials removed from JSON responses.                                                                                                                                                                                                                                             |
| A-002 | F-002             | Remove public debug business-tier mutation or require authenticated admin access with explicit non-production guardrails. Review any feature/billing side effects tied to `business.tier`.                                                                                                  | Critical | Done        | `authenticateJWT` + `requireRole('ADMIN')` on all routes. Mounted only if `NODE_ENV !== 'production'` or `ENABLE_DEBUG_BUSINESS_TIER=true`.                                                                                                                                                                                                                                                                                                                             |
| A-003 | F-003             | Remove `/api/debug/users` or protect it with strict admin auth and environment gating. Review for any other public debug enumeration endpoints.                                                                                                                                             | Critical | Done        | Removed unauthenticated `GET /api/debug/users` from `server/src/index.ts`. Use `GET /api/admin-portal/users` (JWT + admin) for operator user lists.                                                                                                                                                                                                                                                                                                                     |
| A-004 | F-004             | Replace local `requireAdmin` in `ai-centralized` with canonical role enforcement and verify all sensitive centralized AI endpoints require the intended privilege level.                                                                                                                    | High     | Done        | `requireAdmin` enforces `role === 'ADMIN'`.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| A-005 | F-005             | Normalize JWT/auth handling for `ai-context-debug` and `businessAI` onto the canonical `authenticateJWT` flow or a shared equivalent that loads DB-backed user state.                                                                                                                       | Medium   | Done        | `authenticateJWT` + `requireRole('ADMIN')` on debug routes; `businessAI` uses `AuthenticatedRequest.user.id`.                                                                                                                                                                                                                                                                                                                                                           |
| A-006 | F-006             | Require explicit admin authorization for `/api/admin/logs/*` and validate log export, retention, and analytics endpoints against intended admin-only policy.                                                                                                                                | High     | Done        | `requireRole('ADMIN')` on all routes except `POST /client`.                                                                                                                                                                                                                                                                                                                                                                                                             |
| A-007 | F-007, F-008      | Remove or environment-gate public debug and schema enumeration endpoints that expose internal module or database metadata.                                                                                                                                                                  | Medium   | Done        | `/api/debug` + `/api/debug/database` gated in `index.ts`; `GET /api/schema` gated in `health.ts` (`ENABLE_PUBLIC_SCHEMA_ROUTE` in production).                                                                                                                                                                                                                                                                                                                          |
| A-008 | F-009             | Normalize privilege checks across maintenance/admin fix routes so read and write operations use the same intended authorization standard.                                                                                                                                                   | Medium   | Done        | `GET /admin/fix-subscriptions/check` requires `ADMIN`.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| A-009 | F-010             | Add explicit business membership and role/permission enforcement to org-chart routes and/or service boundaries, then add tests proving unauthorized users cannot read or mutate another business's org-chart data.                                                                          | Critical | Done        | Route-level: `server/src/middleware/orgChartPermissions.ts` + `server/src/routes/org-chart.ts`. Tests: `server/src/routes/__tests__/org-chart.integration.test.ts` (401 unauthenticated, 403 non-member read, 403 employee mutate, admin-only global permissions catalog).                                                                                                                                                                                              |
| A-010 | F-011             | Split Stripe webhook intake from JWT-protected payment routes, keep webhook public only where signature verification is performed, and verify end-to-end webhook delivery.                                                                                                                  | High     | Done        | Superseded by `A-047`: same wiring fix. Manual Stripe delivery QA still recommended.                                                                                                                                                                                                                                                                                                                                                                                    |
| A-011 | F-012             | Remove or environment-gate database debug routes and eliminate raw schema/migration error leakage from public responses.                                                                                                                                                                    | High     | Done        | Same mount gate as F-007/F-012; not exposed in production unless `ENABLE_PUBLIC_DEBUG_ROUTES=true`.                                                                                                                                                                                                                                                                                                                                                                     |
| A-012 | F-013             | Fix Google OAuth route auth wiring so protected management/status endpoints use authenticated business-member checks while the callback remains public only for the OAuth exchange.                                                                                                         | Medium   | Done        | Route-level `authenticateJWT` on protected paths; `google-oauth-auth.integration.test.ts`.                                                                                                                                                                                                                                                                                                                                                                              |
| A-013 | F-014             | Normalize resend-verification responses to avoid revealing whether an email exists or is already verified.                                                                                                                                                                                  | Medium   | Done        | Uniform JSON body; send only when unverified user exists.                                                                                                                                                                                                                                                                                                                                                                                                               |
| A-014 | F-015             | Restrict notification creation so callers can only create notifications for themselves unless a dedicated trusted/admin flow is used. Add tests for cross-user notification injection.                                                                                                      | Critical | Done        | `POST /api/notifications` uses `req.user.id` only; admin: `POST /api/notifications/for-user` + `ADMIN`. `**advancedNotificationController`** create path no longer applies `targetUserId`.                                                                                                                                                                                                                                                                              |
| A-015 | F-016, F-017      | Add membership checks before joining socket rooms or writing chat reactions/read receipts, and verify socket events are scoped to authorized conversations/businesses/schedules only.                                                                                                       | Critical | Done        | `chatSocketService`: `join_conversation` / auto-join list, `typing_*`, `join_business` / `join_schedule`, `new_message`, `mark_read`, and `**message_reaction**` all gate on active membership (reactions now call `assertMessageConversationMember` before `messageReaction.upsert`). Optional: add socket.io client integration tests + manual QA for regressions.                                                                                                    |
| A-016 | F-018             | Require explicit membership/ownership validation before creating context-bound dashboards or seeding business workspace resources, especially before assigning calendar ownership.                                                                                                          | High     | Done        | `assertDashboardContextMembership` in `**createDashboard**` (after existing-dashboard short-circuit); `**dashboard-context.integration.test.ts**`.                                                                                                                                                                                                                                                                                                                      |
| A-017 | F-019             | Normalize business membership checks to require `isActive` consistently across read, invitation, and member-management endpoints.                                                                                                                                                           | Medium   | Done        | `memberController` gates use active membership; invite treats inactive prior row as not blocking re-invite.                                                                                                                                                                                                                                                                                                                                                             |
| A-018 | F-020             | Bind invitation acceptance to the invited email identity or otherwise enforce the intended invite-recipient model.                                                                                                                                                                          | Medium   | Done        | `acceptInvitation` email match (403 on mismatch). Optional: Vitest for accept path.                                                                                                                                                                                                                                                                                                                                                                                     |
| A-019 | F-021             | Apply publication/visibility rules consistently to module detail access, or explicitly define which unpublished metadata authenticated users may view.                                                                                                                                      | Medium   | Done        | `getModuleDetails`: APPROVED / developer / ADMIN only.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| A-020 | F-022             | Stop inferring default business context by oldest membership for AI context fetches; require explicit tenant context or a safer active-context resolution strategy.                                                                                                                         | Medium   | Done        | Removed `resolveDefaultBusinessId` / auto-fill in `ModuleAIContextService.fetchModuleContext`.                                                                                                                                                                                                                                                                                                                                                                          |
| A-021 | F-023, F-025      | Revalidate `dashboardId`, `folderId`, `businessId`, and similar context ids on server-side create flows before persisting records. Prefer deriving context from authorized parent objects where possible.                                                                                   | High     | Done        | Notes + Drive `**createFolder**` / `**uploadFile**` + To-Do/task binding patterns as documented in F-023/F-025/F-039/F-038.                                                                                                                                                                                                                                                                                                                                             |
| A-022 | F-024             | Enforce dashboard/context ownership and participant eligibility rules when creating conversations, then add tests for invalid dashboard and participant combinations.                                                                                                                       | Medium   | Done        | `validateConversationDashboardAccess` + `chat-create-conversation.integration.test.ts`                                                                                                                                                                                                                                                                                                                                                                                  |
| A-023 | F-026, F-027      | Bind scheduling reads and mutations to the authorized `businessId` end-to-end, and reconcile route middleware context with persisted `businessId` so body/query mismatches cannot create cross-tenant records.                                                                              | Critical | Done        | `resolveSchedulingBusinessIdFromRequest` + controller scoping; `server/src/routes/__tests__/scheduling-tenant-scope.integration.test.ts`                                                                                                                                                                                                                                                                                                                                |
| A-024 | F-028             | Require membership/ownership validation before creating calendars in business or household contexts, and re-check auto-provisioning flows against the same rule.                                                                                                                            | High     | Done        | `enforceCalendarContextMembership` in `**createCalendar**` + `**autoProvisionCalendar**`. Optional: calendar context Vitest.                                                                                                                                                                                                                                                                                                                                            |
| A-025 | F-029             | Verify access to existing calendar events before linking Place meetings to them, not just when creating a new event.                                                                                                                                                                        | High     | Done        | `assertUserCanAccessCalendarEvent` in `**linkToCalendar**`; `place-meeting-calendar-link.integration.test.ts` (403 vs 200).                                                                                                                                                                                                                                                                                                                                             |
| A-026 | F-030             | Scope Place interaction-link updates/deletes through business-owned listings rather than `linkId` alone.                                                                                                                                                                                    | High     | Done        | `findFirst` on link + `listing.businessId` before update/delete.                                                                                                                                                                                                                                                                                                                                                                                                        |
| A-027 | F-031             | Add explicit business membership/manager authorization to org-chart employee assignment routes and ensure position/business consistency is enforced inside the service layer.                                                                                                               | Critical | Done        | `requireOrgChartAccess` + position/business alignment + **active assignee membership** (`EmployeeAssignmentValidationError`); `org-chart.integration.test.ts` (manage gate + **400 non-member assign**).                                                                                                                                                                                                                                                                |
| A-028 | F-032             | Either honor `dashboardId` in activity feed queries or remove the parameter and document the endpoint as intentionally cross-dashboard.                                                                                                                                                     | Medium   | Done        | `activityFeedController` scopes sources when `dashboardId` set + ownership check.                                                                                                                                                                                                                                                                                                                                                                                       |
| A-029 | F-033             | Define and enforce the intended visibility rules for member search results, then scope directory search accordingly.                                                                                                                                                                        | Medium   | Done        | `**buildMemberSearchVisibilityWhere`** (shared tenant + accepted connections); `**search-member-visibility.integration.test.ts**`.                                                                                                                                                                                                                                                                                                                                      |
| A-030 | F-034             | Apply `businessId` scoping consistently inside business-scoped permission summary queries.                                                                                                                                                                                                  | Medium   | Done        | `permissionService#getBusinessPermissionSummary` aggregates from business `permissionSet` JSON only.                                                                                                                                                                                                                                                                                                                                                                    |
| A-031 | F-035             | Add the same ownership/assignee access checks to task state transitions that already exist for task reads/deletes, and verify unauthorized task IDs cannot be completed or reopened.                                                                                                        | Critical | Done        | `todoController` `completeTask` / `reopenTask` + `todo-task-complete.integration.test.ts`.                                                                                                                                                                                                                                                                                                                                                                              |
| A-032 | F-036             | Replace conversation-task lookup with a properly scoped link model or a query constrained by authorized conversation membership and task ownership/context.                                                                                                                                 | Critical | Done        | Membership + marker-scoped query; `todo-chat-conversation-tasks.integration.test.ts`. Optional future: `TaskMessageLink` model for indexing.                                                                                                                                                                                                                                                                                                                            |
| A-033 | F-037             | Introduce explicit access rules for TaskProject resources and scope list/create/update/delete operations through authorized dashboards or business contexts.                                                                                                                                | High     | Done        | `assertUserOwnedDashboardBusinessAlignment` on project routes; optional Vitest.                                                                                                                                                                                                                                                                                                                                                                                         |
| A-034 | F-038, F-039      | Revalidate To-Do and Notes-folder context ids server-side before creating or moving records, and ensure chat-derived task creation proves conversation membership.                                                                                                                          | High     | Done        | To-Do + chat task paths + **notes folders** + **createNote** context binding.                                                                                                                                                                                                                                                                                                                                                                                           |
| A-035 | F-040             | Break `schedulingController` into smaller domain-focused controllers/services with explicit ownership boundaries for admin, manager, employee, AI-context, and setup flows. Remove or isolate placeholder endpoints so incomplete surfaces do not live beside production-critical paths.    | High     | Backlog     | Focused backend tests, route-level validation                                                                                                                                                                                                                                                                                                                                                                                                                           |
| A-036 | F-041             | Split the admin portal into bounded domains and replace `Promise<unknown>` / placeholder-heavy service contracts with typed service interfaces per admin area (users, moderation, billing, support, modules, analytics).                                                                    | High     | Backlog     | `pnpm type-check`, focused backend tests                                                                                                                                                                                                                                                                                                                                                                                                                                |
| A-037 | F-042             | Separate module marketplace, developer-submission, artifact-scan, and installation/provisioning responsibilities into clearer services/controllers, then consolidate duplicated submission queries behind one owned path.                                                                   | High     | Backlog     | Focused backend tests, route-level validation                                                                                                                                                                                                                                                                                                                                                                                                                           |
| A-038 | F-043             | Adopt a consistent validation standard for backend routes: apply shared request validation at route boundaries for critical endpoints and reduce controller-local shape parsing to business-rule checks only.                                                                               | Medium   | Backlog     | Focused backend tests, route-level validation                                                                                                                                                                                                                                                                                                                                                                                                                           |
| A-039 | F-044             | Normalize backend error handling onto structured logging for both development and production, and stop returning raw internal error text except where explicitly intended and safe.                                                                                                         | High     | Backlog     | Focused backend tests, manual API verification                                                                                                                                                                                                                                                                                                                                                                                                                          |
| A-040 | F-045             | Standardize authenticated request access through shared types/helpers and remove ad hoc `(req as any).user` / duplicate `getUserFromRequest` patterns from controllers as touched.                                                                                                          | Medium   | Backlog     | `pnpm type-check`, focused backend tests                                                                                                                                                                                                                                                                                                                                                                                                                                |
| A-041 | F-046             | Collapse business-configuration ownership to one clear provider strategy per route tree. Remove overlapping `BusinessConfigurationProvider` layers and define how personal dashboard work mode and direct business routes share or hand off business configuration state.                   | High     | Backlog     | Focused frontend tests, manual QA for business/workspace flows                                                                                                                                                                                                                                                                                                                                                                                                          |
| A-042 | F-047             | Split `DashboardLayout` into smaller shell components/hooks and move shared registries/constants (such as module icon mappings) out of route modules into stable shared frontend modules.                                                                                                   | High     | In progress | **`MODULE_ICONS`** → **`web/src/config/moduleIcons.ts`**. Remaining: split layout / hooks. Manual QA for dashboard/sidebar.                                                                                                                                                                                                                                                                                                                                              |
| A-043 | F-048             | Standardize business workspace navigation on one primary routing model, then align embedded module shells, nested routes, and active-module detection to that model. Prioritize HR as a representative cleanup path.                                                                        | Medium   | Backlog     | Focused frontend tests, manual QA for workspace deep links                                                                                                                                                                                                                                                                                                                                                                                                              |
| A-044 | F-049             | Audit frontend API paths for proxy adherence and fix concrete path-contract drift first, starting with authenticated profile and admin test surfaces.                                                                                                                                       | High     | Done        | Relative `/api/*` on profile + admin test pages; `PUT /api/profile` for name.                                                                                                                                                                                                                                                                                                                                                                                           |
| A-045 | F-050             | Centralize blob/export and debug-only network helpers so direct backend calls and localhost-only telemetry are explicitly gated, documented, and removed from normal runtime paths where unnecessary.                                                                                       | Medium   | Done        | Same-origin `/api` for calendar ICS + log export; removed unused URL constants; debug-ingest calls cleared from module/trash paths in tree.                                                                                                                                                                                                                                                                                                                              |
| A-046 | F-051             | Define a consistent protected-route UX strategy for the frontend, including when auth is enforced server-side, when client redirects are acceptable, and how unauthorized vs unauthenticated users should be presented.                                                                     | Medium   | Done        | Middleware: **`/admin-portal`**, **`/profile`**, **`/business`**; non-admin admin routes → **`/forbidden`**. Manual auth QA recommended for edge flows.                                                                                                                                                                                                                                                                                                                  |
| A-047 | F-052             | Split Stripe webhook intake into a public raw-body route registered before JSON parsing and JWT middleware, then verify end-to-end webhook signature validation and downstream event processing.                                                                                            | Critical | Done        | `POST /api/payment/webhook` before `express.json()`, raw body, no JWT; `stripe-webhook.integration.test.ts`. Optional: Stripe CLI / dashboard smoke test in each environment.                                                                                                                                                                                                                                                                                           |
| A-048 | F-053, F-054      | Redesign realtime delivery semantics to support multiple simultaneous sockets per user, authorize room joins against tenant membership, and define a production-safe cross-instance broadcast strategy.                                                                                     | High     | Done        | **`F-053`:** `user_${userId}` room + optional Redis adapter. **`F-054`:** room joins gated; **`user_presence`** scoped to shared `conversation_*` rooms. Server `pnpm exec tsc --noEmit` passed.                                                                                                                                                                                               |
| A-049 | F-055             | Replace ad hoc notification socket subscriptions with a stable shared client/store or hook contract that supports cleanup, accurate connection state, and one listener registration path per consumer.                                                                                      | High     | Done        | Shared module-level socket + listener sets; consumers use returned unsubscribers; `pnpm exec tsc --noEmit` in `web` passed. Manual notification QA recommended.                                                                                                                                                                                                                                                                                                         |
| A-050 | F-056             | Consolidate module billing and Stripe lifecycle handling behind one authoritative service path, use real Stripe product/price mapping, and ensure webhook processing updates both platform and module subscription state consistently.                                                      | High     | Backlog     | Focused backend tests, manual billing validation                                                                                                                                                                                                                                                                                                                                                                                                                        |
| A-051 | F-057             | Align module upload, sandbox, and runtime validation expectations with actual deployment environments. Document required infrastructure explicitly and avoid implying sandbox guarantees that depend on unavailable local Docker/runtime assumptions.                                       | Medium   | Backlog     | Focused backend tests, production-safety review                                                                                                                                                                                                                                                                                                                                                                                                                         |
| A-052 | F-058             | Make multimodal capability downgrade explicit in platform behavior: surface when attachments are reduced to summaries/text-only, and enforce or document the supported provider/model combinations for image-aware requests.                                                                | Medium   | Backlog     | Focused backend tests, manual AI attachment validation                                                                                                                                                                                                                                                                                                                                                                                                                  |
| A-053 | F-059             | Make release-quality verification explicit at the repo root and in CI: run server automated tests in CI at minimum, define where E2E fits, and align the monorepo’s default `test` contract with the checks required before merge or deploy.                                                | Critical | Done        | Root `test` runs server Vitest; CI runs `pnpm type-check` and `pnpm test`. Optional: **`pnpm lint`** / Prettier in CI; document Playwright E2E placement in `memory-bank/testingStrategy.md` when finalized.                                                                                                                                                                                                                                                            |
| A-054 | F-060, F-061      | Fail deploys when startup migrations or readiness checks do not establish a safe serving state. Separate liveness from readiness, and ensure health probes reflect database-backed readiness rather than shallow process availability.                                                      | High     | Done        | Production `bootstrap()` exits on migration failure; Docker `HEALTHCHECK` hits `/api/ready` (DB-backed). `/api/live` available for pure liveness. Optional: periodic production deploy dry-run.                                                                                                                                                                                                                                                           |
| A-055 | F-062             | Reconcile CI/workspace/tooling configuration with the actual repo state: align pnpm versions, remove or restore broken filtered-script targets, and ensure CI commands match real packages and scripts.                                                                                     | High     | Done        | CI **`pnpm@10.11.0`**; workspace **`web` / `server` / `shared`**; gates **`type-check`** + **`test`**. Optional: add **`pnpm lint`** when eslint debt is manageable.                                                                                                                                                                                                                                                                                                   |
| A-056 | F-063             | Add focused automated coverage for the highest-risk untested areas first: Stripe/webhooks, tenant-isolation paths, websockets/notifications, and AI attachment/vision behavior. Favor integration tests that exercise the real middleware stack over narrow mock-only tests where feasible. | High     | Backlog     | Focused backend tests, selective E2E coverage                                                                                                                                                                                                                                                                                                                                                                                                                           |
| A-057 | F-064             | Add an operational deployment/rollback runbook that covers Cloud Run revision rollback, failed startup migrations, webhook/billing incident response, and which checks must pass before a production deploy.                                                                                | Medium   | Done        | **`docs/deployment/CLOUD_RUN_ROLLBACK_RUNBOOK.md`**. Optional: production dry-run.                                                                                                                                                                                                                                                                                                                                                                                         |


Status definitions:

1. Backlog
2. Planned
3. In progress
4. Blocked
5. Done
6. Deferred

---

## Decision Log


| ID    | Date       | Decision                                                                                                                                                       | Rationale                                                                                                                                                                                                                                           | Impact                                                                                                                                 |
| ----- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| D-001 | 2026-04-14 | `docs/plans/SYSTEM_AUDIT_SOURCE_OF_TRUTH.md` is the canonical audit document.                                                                                  | Centralize audit planning, findings, and remediation tracking in one durable file.                                                                                                                                                                  | Prevents fragmented planning and conflicting narratives.                                                                               |
| D-002 | 2026-04-14 | Audit work starts read-only and shifts into targeted fix waves.                                                                                                | Reduces the chance of destabilizing a large, partially dirty worktree.                                                                                                                                                                              | Findings can be ranked before remediation begins.                                                                                      |
| D-003 | 2026-04-14 | Security, tenant isolation, and correctness outrank modernization-only cleanup.                                                                                | Older code is not automatically wrong; risk must drive sequencing.                                                                                                                                                                                  | Keeps effort focused on real business and production risk.                                                                             |
| D-004 | 2026-04-14 | Phase 1 findings are being treated as pre-launch hardening and correctness work, not live-incident response.                                                   | The system is not publicly live; the immediate goal is to identify and sequence architectural/auth flaws before launch.                                                                                                                             | Severity still reflects impact if deployed, but remediation can be planned methodically.                                               |
| D-005 | 2026-04-14 | Phase 3 remediation should prioritize boundary-splitting and contract clarity in backend hotspots before broad cleanup passes.                                 | The main backend risk is concentrated in a small number of monolithic controllers/services and inconsistent boundary patterns, not evenly across the whole codebase.                                                                                | Keeps modernization work focused on the highest-regression backend surfaces first.                                                     |
| D-006 | 2026-04-14 | Phase 4 remediation should favor unifying frontend shells and routing contracts before broad visual or component cleanup.                                      | The strongest frontend risk is architectural drift between shells, providers, and API/routing patterns, not isolated styling defects.                                                                                                               | Keeps frontend modernization focused on route reliability and shared-state predictability first.                                       |
| D-007 | 2026-04-14 | Phase 5 remediation should prioritize broken cross-cutting entrypoints and delivery semantics before optimization or feature expansion.                        | The highest platform-system risk is concentrated in webhook intake, realtime authorization/delivery, and divergent billing/runtime contracts rather than in isolated feature code.                                                                  | Keeps Phase 5 follow-up focused on restoring trustworthy system boundaries first.                                                      |
| D-008 | 2026-04-14 | Phase 6 remediation should prioritize trustworthy release gates before broad test expansion.                                                                   | The main release-readiness gap is not only missing tests, but that existing checks are not consistently wired into CI, deploy, and readiness signals.                                                                                               | Keeps Phase 6 follow-up focused on enforceable safety rails first, then incremental coverage growth.                                   |
| D-009 | 2026-04-14 | Preventive audit follow-up should encode repeated root-cause failures into a small set of focused Cursor rules instead of expanding one global standards file. | The audit found recurring mistakes around backend trust boundaries, frontend proxy/auth drift, and release-gate discipline. Those patterns benefit from targeted guardrails, while one-off findings should remain in remediation tickets and tests. | Makes the rule set more enforceable and easier to maintain without turning audit findings into a second monolithic standards document. |


---

## Phase 1 Completion Summary

### Status

Phase 1 is complete.

### Scope completed

1. Authentication middleware review.
2. Authorization pattern review.
3. Admin and debug route review.
4. Sensitive backend entry point review.
5. Mixed-auth router and mount review.

### Confirmed findings count

1. Critical: 4
2. High: 4
3. Medium: 6
4. Low: 0

### Systemic conclusions

1. The biggest Phase 1 problem is not one isolated route. It is inconsistent auth architecture:
  mixed mount-level auth, router-level auth, controller-level auth, and service-layer trust.
2. There is a canonical auth path in `server/src/middleware/auth.ts`, but parallel JWT implementations exist and drift from it.
3. Local copy-paste `requireAdmin` implementations are a recurring risk and already produced at least one real authorization bypass.
4. Debug, setup, and operational routes were historically added in a way that prioritized convenience over a uniform protection model.
5. Some issues are direct public exposure risks if deployed as-is; others are correctness and maintainability problems that would make future security regressions more likely.

### Phase 1 exit criteria assessment

1. Sensitive endpoints have consistent auth requirements: Not yet. Findings logged.
2. Admin and elevated operations are clearly and correctly protected: Not yet. Findings logged.
3. No unsafe production route exposure is left undocumented: Met for this phase.

### Recommended remediation order from Phase 1

1. `F-001`, `F-002`, `F-003`
  Remove or gate the public bootstrap/debug endpoints first.
2. ~~`F-010`~~
  Fix org-chart tenant authorization before any business-facing expansion.
3. `F-004`, `F-006`
  Normalize admin-only enforcement on centralized AI and admin logs.
4. ~~`F-011`~~
  Repair Stripe webhook routing before payment validation work continues.
5. ~~`F-005`~~, `F-009`, ~~`F-013`~~, `F-014`
  Clean up auth drift, inconsistent admin checks, and account-enumeration behavior.

---

## Phase 2 Completion Summary

### Status

Phase 2 is complete.

### Scope completed

1. Business, household, and dashboard scoping review.
2. Query correctness review in tenant-sensitive flows.
3. Prisma access pattern review in context-bound services/controllers.
4. Service-layer trust boundary review where route auth may be insufficient.
5. Cross-context creation, linkage, and real-time room scoping review.

### Confirmed findings count

1. Critical: 6
2. High: 9
3. Medium: 10
4. Low: 0

### Systemic conclusions

1. The dominant Phase 2 problem is trust in client-supplied context identifiers:
  `businessId`, `dashboardId`, `householdId`, `folderId`, `calendarId`, `eventId`, and similar ids are too often accepted without revalidation.
2. Route-level authentication often proves only that the caller is logged in, not that they belong to the target tenant or control the target resource.
3. Service methods frequently assume the caller already enforced tenant ownership, which makes them unsafe when reused from weakly protected routes.
4. Real-time paths are materially weaker than HTTP paths in several places, especially around room joins and chat-related side effects.
5. Several endpoints imply context scoping in their API shape but do not actually apply that scoping in the query layer.
6. Cross-tenant risk is not limited to direct data reads:
  it also appears as context pollution, wrong-tenant linkage, ownership escalation during provisioning, and ID-only updates/deletes.

### Phase 2 exit criteria assessment

1. Multi-tenant boundaries are explicit and enforced: Not yet. Findings logged.
2. Schema and persistence usage are context-safe in tenant-sensitive flows: Not yet. Findings logged.
3. High-risk database and service trust paths are identified and documented: Met for this phase.

### Recommended remediation order from Phase 2

1. ~~`F-015`~~, `F-016`, ~~`F-026`~~, ~~`F-031`~~, ~~`F-035`~~, ~~`F-036`~~
  Fix the direct cross-user / cross-tenant write and read paths first.
2. ~~`F-018`~~, `F-023`, ~~`F-027`~~, `F-028`, ~~`F-029`~~, `F-030`, `F-038`
  Fix context-binding and provisioning flows that trust caller-supplied tenant ids.
3. `F-017` (remaining realtime/chat surface); `F-024` / `F-037` mitigated (2026-04-16)
  Tighten chat/project lifecycle and conversation-linked mutation paths where still open.
4. `F-019`, `F-020`, `F-021`, ~~`F-022`~~, `F-032`, ~~`F-033`~~, `F-034`, `F-039`
  Clean up membership lifecycle, tenant defaults, scoping mismatches, and directory/summary leakage.

---

## Phase 3 Completion Summary

### Status

Phase 3 is complete.

### Scope completed

1. Large controller and service review.
2. Validation-quality review at route/controller boundaries.
3. Error-handling and logging consistency review.
4. Route-controller-service separation review.
5. High-risk backend hotspot and god-object review.

### Confirmed findings count

1. Critical: 0
2. High: 4
3. Medium: 2
4. Low: 0

### Systemic conclusions

1. The dominant Phase 3 problem is concentration of backend responsibility in a few oversized hotspots:
  `schedulingController.ts`, `adminService.ts`, `admin-portal.ts`, and `moduleController.ts` carry too many domains and too many side effects at once.
2. Backend ownership boundaries are inconsistent:
  route files, controllers, and services all contain mixtures of transport logic, authorization assumptions, Prisma queries, orchestration, and product rules.
3. Validation is not standardized at the route boundary:
  a shared validation middleware exists, but most of the backend still relies on ad hoc request parsing inside controllers.
4. Logging and error handling are similarly split:
  a structured logger exists, but it is not the uniform backend contract, and unhandled-error visibility is weaker than it should be in production.
5. Typed request/access patterns are not consistently reused:
  repeated local helpers and `(req as any).user` access increase drift and make controller behavior harder to reason about mechanically.

### Phase 3 exit criteria assessment

1. God objects and mixed-responsibility paths are identified: Met for this phase.
2. Critical backend flows have clear ownership and contracts: Not yet. Findings logged.
3. Refactor candidates are prioritized by risk, not annoyance: Met for this phase.

### Recommended remediation order from Phase 3

1. `F-040`, `F-041`, `F-042`
  Split the largest backend hotspots first so scheduling, admin, and module-platform fixes do not keep piling onto unsafe monoliths.
2. `F-044`
  Normalize production-safe error handling and structured logging before deeper backend refactors, so later changes are easier to observe and verify.
3. `F-043`, `F-045`
  Standardize request validation and authenticated request typing so new work stops reinforcing the same boundary drift.

---

## Phase 4 Completion Summary

### Status

Phase 4 is complete.

### Scope completed

1. Frontend API proxy and client data-access review.
2. Session/auth UX and route-protection review.
3. Admin portal frontend architecture review.
4. Business workspace shell and navigation review.
5. Shared frontend layout/component drift review.

### Confirmed findings count

1. Critical: 0
2. High: 3
3. Medium: 3
4. Low: 0

### Systemic conclusions

1. The dominant Phase 4 problem is frontend shell drift:
  personal dashboard, work mode, and direct business workspace routes each carry overlapping layout, provider, and navigation responsibilities.
2. Shared frontend state ownership is not always singular:
  business configuration, branding, and module/navigation state are resolved from multiple layers instead of one obvious source of truth.
3. Frontend route contracts are inconsistent in two directions:
  some pages still drift from the expected backend/API proxy paths, while other route trees mix nested-route and query-param navigation models.
4. Large frontend hotspots follow the same pattern found in Phase 3:
  `DashboardLayout.tsx`, admin portal pages/layouts, and workspace wrappers are carrying too many concerns at once.
5. Session/auth UX is broadly functional but not standardized:
  different route trees use different combinations of server-side fetches, client redirects, and local fallback rendering.

### Phase 4 exit criteria assessment

1. Frontend data access patterns are consistent: Not yet. Findings logged.
2. Critical user flows are backed by predictable architecture: Not yet. Findings logged.
3. High-risk UI surfaces have a clear cleanup path: Met for this phase.

### Recommended remediation order from Phase 4

1. `F-046`, `F-047`, `F-048`
  Unify frontend shell ownership and routing strategy first so later UI fixes do not keep layering onto conflicting dashboard/workspace architecture.
2. ~~`F-049`~~, ~~`F-050`~~
  Normalize API access paths and eliminate concrete proxy/debug drift next, especially on authenticated and admin-facing flows.
3. ~~`F-051`~~
  Standardize protected-route UX after shell and API ownership are clearer.

---

## Phase 5 Completion Summary

### Status

Phase 5 is complete.

### Scope completed

1. WebSocket and realtime state-flow review.
2. Notification architecture and delivery review.
3. AI pipeline, provider, and attachment-contract review.
4. Module marketplace upload/runtime/sandbox review.
5. Billing and payment cross-cutting flow review.

### Confirmed findings count

1. Critical: 1
2. High: 4
3. Medium: 2
4. Low: 0

### Systemic conclusions

1. The dominant Phase 5 problem is cross-cutting contract drift:
  core entrypoints such as Stripe webhooks, realtime room joins, and notification sockets do not consistently enforce the same assumptions that adjacent code appears to rely on.
2. Realtime delivery is not modeled as a first-class distributed system:
  room authorization, per-user multi-socket support, and multi-instance delivery semantics are weaker than the product behavior implies.
3. Billing logic is fragmented across multiple overlapping service implementations:
  the platform has more than one Stripe/subscription path, and those paths do not clearly converge on one authoritative lifecycle model.
4. Module runtime/security posture is environment-sensitive:
  upload, storage, and sandbox assumptions vary significantly between local and deployed environments.
5. The AI attachment pipeline is thoughtfully capability-aware, but the platform contract around degraded multimodal behavior is not explicit enough.

### Phase 5 exit criteria assessment

1. Cross-cutting systems are understood end to end: Met for this phase.
2. Integration risks are documented and ranked: Met for this phase.
3. System hardening work is sequenced safely: Met for this phase.

### Recommended remediation order from Phase 5

1. ~~`F-052`~~, ~~`F-053`~~, ~~`F-054`~~
  Fix the broken webhook intake path and the most dangerous realtime authorization/delivery issues first.
2. ~~`F-055`~~, `F-056`
  Stabilize notification client behavior and unify module billing/Stripe lifecycle handling next.
3. `F-057`, `F-058`
  Then tighten environment/runtime parity and make multimodal degradation behavior explicit.

---

## Phase 6 Completion Summary

### Status

Phase 6 is complete.

### Scope completed

1. Automated test coverage quality review.
2. CI/CD and deployment-safety review.
3. Lint/type-check/test verification-discipline review.
4. Release-readiness review for critical user journeys.
5. Operational observability and rollback-safety review.

### Confirmed findings count

1. Critical: 1
2. High: 4
3. Medium: 2
4. Low: 0

### Systemic conclusions

1. The dominant Phase 6 problem is enforcement drift:
  the repo has some meaningful tests and quality scripts, but those protections are not consistently wired into CI, deploy, or default contributor workflows.
2. Release readiness is weaker than the platform surface area requires:
  deployment can continue past migration failure, and health checks do not clearly prove full serving readiness.
3. CI configuration itself is part of the risk surface:
  package-manager versions, filtered package targets, and script expectations are not all aligned with the current monorepo layout.
4. Automated coverage exists, but it is concentrated in a few subsystems:
  several of the highest-risk areas identified in earlier phases still have little or no focused automated protection.
5. Operational recovery guidance is under-documented relative to deployment complexity:
  rollback and failed-release handling are not clearly codified in the repo’s human-facing docs.

### Phase 6 exit criteria assessment

1. Critical gaps in automated protection are documented: Met for this phase.
2. Release safety standards are made explicit: Not yet. Findings logged.
3. Verification requirements are attached to remediation work: Met for this phase.

### Recommended remediation order from Phase 6

1. ~~`F-059`~~, ~~`F-060`~~, ~~`F-061`~~, ~~`F-062`~~
  Fix the release gates and readiness contract first so deploy safety is enforceable. (All listed items mitigated in-repo; optional **`pnpm lint`** / Prettier in CI remains.)
2. `F-063`
  Add focused tests for the highest-risk gaps once CI and default verification flow can actually enforce them.
3. ~~`F-064`~~
  Codify rollback and release-response guidance after the technical gatekeepers are in place.

---

## Verification Standard

Every remediation item should include only the verification that is actually meaningful for the change.

Possible verification methods:

1. `pnpm lint`
2. `pnpm type-check`
3. Focused backend tests
4. Focused frontend tests
5. E2E coverage for critical flows
6. Manual QA for sensitive user journeys
7. Route-level or API-level validation
8. Production-safety review for env/config changes

Verification notes:

1. Do not add low-value tests that merely restate implementation.
2. Prefer focused tests around auth, tenant isolation, billing, module runtime, and AI/file handling.
3. If verification is skipped, log why.

---

## Progress Tracker

### Overall status

- Phase 1: Complete
- Phase 2: Complete
- Phase 3: Complete
- Phase 4: Complete
- Phase 5: Complete
- Phase 6: Complete

### Next action

Phase audit sequence is complete.

Next action should shift from read-only audit to remediation planning and execution, using the findings and remediation tracker as the source of truth.

---

## Usage Instructions

When this document is updated during the audit:

1. Add confirmed findings to the Findings Log.
2. Add any resulting fix work to the Remediation Tracker.
3. Record meaningful tradeoffs in the Decision Log.
4. Update phase progress after each audit pass.
5. Keep this file concise enough to stay usable, but complete enough to remain authoritative.

