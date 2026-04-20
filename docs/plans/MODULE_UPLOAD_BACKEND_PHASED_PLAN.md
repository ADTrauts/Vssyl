# Module Upload Backend Phased Plan

Last updated: 2026-04-07  
Status: In progress (Phase 4 completed)  
Owner: Platform Engineering

---

## Goal

Deliver a reliable, production-ready module upload and release workflow where:

1. A user submits a module and artifact through module management.
2. The module is linked to either a new business or an existing business.
3. **Active business employees are allowed to upload/link modules** (not owner-only).
4. Admin reviews and approves modules in admin portal module management.
5. Developer management exposes subscriptions and payouts clearly.
6. Approved modules appear in user-facing module marketplace/management and can run.

---

## Policy Lock (Confirmed)

### Business membership permission model

- Upload/link to business is allowed for users who are:
  - active members of the business (`isActive = true`)
- This policy intentionally includes employees.

### Scope note

- This plan keeps install/runtime permissions separate from upload/link permissions.
- Upload/link can be membership-based while install can remain elevated-permission if desired.

---

## Current State Snapshot

### Working now

- Module submit flow exists.
- Artifact pipeline exists: submit -> upload init -> direct GCS PUT -> finalize.
- Admin module review exists (approve/reject).
- Runtime exists (hosted and bundle runtime paths).
- Marketplace visibility is filtered by approved status.
- Post-submit modal supports creating a new business or linking an existing business.

### Gaps to close

- Business association behavior needs explicit alignment to confirmed membership policy.
- No explicit, durable "developer business account" designation is formalized for reporting/governance.
- Admin module testing/sandbox operations need clear operational workflow and validation.
- Developer management and financial reporting need explicit acceptance checks tied to this flow.

---

## Phase 1 - Policy Alignment and Flow Contract

### Objective

Document and enforce the agreed permission rule across upload/link endpoints and UI messaging.

### Deliverables

- Backend contract documented: active business member can link uploaded module.
- Consistent error responses for unauthorized vs not-found.
- UI copy updated to reflect real policy.

### Primary files/endpoints

- `server/src/controllers/moduleController.ts` (`linkModuleToBusiness`)
- `web/src/components/BusinessCreationModal.tsx`
- `web/src/app/modules/submit/page.tsx`

### Acceptance criteria

- Active employee can link module to business successfully.
- Non-member gets access denied.
- Response messages are consistent and user-readable.

### Phase 1 execution status

- **Status:** Completed
- **Completed on:** 2026-04-06
- **Summary:**
  - Aligned backend link contract to membership policy (active business members, including employees).
  - Standardized response behavior for this flow: 401 unauthenticated, 404 module not found, 403 access denied.
  - Updated submit/link UI copy to reflect active-member policy clearly.
- **Files updated:**
  - `server/src/controllers/moduleController.ts`
  - `web/src/components/BusinessCreationModal.tsx`
  - `web/src/app/modules/submit/page.tsx`
- **Verification:**
  - Lint diagnostics checked on all edited files.
  - Result: no lint errors.

---

## Phase 2 - Business Association Hardening

### Objective

Make business linkage robust, auditable, and deterministic.

### Deliverables

- Validate module ownership/developer identity on link operations.
- Validate business membership (`isActive`) at time of link.
- Add audit logging for module->business linkage actions.
- Enforce idempotent behavior (re-link same module/business is safe and predictable).

### Primary files/endpoints

- `server/src/controllers/moduleController.ts` (`linkModuleToBusiness`)
- `server/src/services/adminService.ts` (audit/reporting integration if needed)

### Acceptance criteria

- Linking logs clear audit events with actor, moduleId, businessId, timestamp.
- Repeated link requests do not produce inconsistent state.
- Unauthorized users cannot link.

### Phase 2 execution status

- **Status:** Completed
- **Completed on:** 2026-04-06
- **Summary:**
  - Hardened `linkModuleToBusiness` ownership and active-membership checks (developer ownership + active member required).
  - Implemented deterministic idempotent behavior for re-linking the same module to the same business.
  - Added audit logging for both real linkage and no-op linkage attempts.
- **Files updated:**
  - `server/src/controllers/moduleController.ts`
- **Verification:**
  - Lint diagnostics checked on edited file.
  - Result: no lint errors.

---

## Phase 3 - Developer Business Designation

### Objective

Introduce explicit developer-business designation for governance, reporting, and admin filtering.

### Deliverables

- Define schema strategy:
  - preferred: explicit business-level metadata field(s), or
  - relationship-level metadata (module-linked developer business)
- Apply Prisma migration safely.
- Set/update designation automatically when module is linked after submission.
- Expose designation in admin portal data APIs where useful.

### Primary files/endpoints

- `prisma/modules/business/business.prisma` (or chosen module schema)
- migration files
- `server/src/controllers/moduleController.ts`
- admin query surfaces in `server/src/services/adminService.ts`

### Acceptance criteria

- Designation is stored and queryable.
- New module-linked businesses are marked correctly.
- Existing records can be backfilled (if required by rollout decision).

### Phase 3 execution status

- **Status:** Completed
- **Completed on:** 2026-04-06
- **Summary:**
  - Added explicit business-level developer designation fields:
    - `isDeveloperBusiness`
    - `developerBusinessLinkedAt`
    - `developerBusinessLinkedBy`
  - Implemented automatic designation in module-link flow:
    - set designation when linking module to business
    - set designation on idempotent no-op link if missing (backfill-on-touch behavior)
  - Exposed designation metadata in admin module submission data include path.
- **Files updated:**
  - `prisma/modules/business/business.prisma`
  - `prisma/migrations/20260407014624_add_developer_business_designation/migration.sql`
  - `server/src/controllers/moduleController.ts`
  - `server/src/services/adminService.ts`
- **Verification:**
  - Prisma workflow completed:
    - `pnpm prisma:build`
    - `pnpm prisma migrate status`
    - `pnpm prisma migrate dev --name add_developer_business_designation --create-only`
    - `pnpm prisma migrate dev`
    - `pnpm prisma:generate`
  - Lint diagnostics checked on edited TS files.
  - Result: no lint errors.

---

## Phase 4 - Admin Module Review and Sandbox Operations

### Objective

Make admin module management operational for real validation, not only status changes.

### Deliverables

- Define explicit admin review checklist:
  - artifact scan status
  - runtime readiness
  - permission manifest sanity
  - publish/rollback readiness
- Confirm sandbox/testing path behavior from admin workflow.
- Add missing actions or status indicators in admin modules UI.

### Primary files/endpoints

- `web/src/app/admin-portal/modules/page.tsx`
- `server/src/routes/admin-portal.ts`
- `server/src/services/adminService.ts`
- runtime path references:
  - `web/src/app/modules/run/[moduleId]/page.tsx`
  - `web/src/components/ModuleHost.tsx`

### Acceptance criteria

- Admin can verify module readiness with visible, actionable signals.
- Approval path blocks publish when required scan/runtime conditions fail.
- Rollback/promote version workflow remains functional.

### Phase 4 execution status

- **Status:** Completed
- **Completed on:** 2026-04-07
- **Summary:**
  - Added explicit admin-facing review checklist UI in Module Management cards:
    - artifact scan signal from latest version artifact
    - runtime readiness signal
    - publish readiness signal
    - developer-business designation badge when linked
  - Wired previously placeholder actions in pending review flow:
    - `View Details` opens a detailed submission modal with permissions and latest artifact metadata
    - `Security Scan` triggers version/scan refresh for the module
    - `Open Sandbox` launches module runtime path from admin workflow
  - Added approval guardrail in UI to prevent approve action when latest artifact scan is not `PASSED`.
  - Extended admin submission data include path to pull latest module version and artifact scan fields used by checklist/status indicators.
- **Files updated:**
  - `web/src/app/admin-portal/modules/page.tsx`
  - `server/src/services/adminService.ts`
- **Verification:**
  - Lint diagnostics checked on edited files.
  - Result: no lint errors.

---

## Phase 5 - Developer Management Financial Validation

### Objective

Ensure developer management correctly reflects module subscriptions, revenue, and payouts.

### Deliverables

- Validate data integrity between:
  - module subscriptions
  - developer revenue records
  - payout records
- Verify admin developers page and billing page show accurate values.
- Add/adjust API responses where mapping gaps exist.

### Primary files/endpoints

- `web/src/app/admin-portal/developers/page.tsx`
- `web/src/app/admin-portal/billing/page.tsx`
- `web/src/lib/adminApiService.ts`
- `server/src/routes/admin-portal.ts` (`/billing/*`, `/modules/developers/stats`)
- `server/src/services/adminService.ts`

### Acceptance criteria

- Developer stats, revenue, and payout lists load without mismatch.
- Financial totals are internally consistent for sampled developers/modules.
- API and UI error handling is clear for missing/empty data.

### Phase 5 execution status

- **Status:** Completed
- **Completed on:** 2026-04-07
- **Summary:**
  - Fixed developer management contract mismatch by changing `/modules/developers/stats` output to a true aggregate stats object (instead of per-developer array), aligned to frontend expectations.
  - Added backend financial validation summary that reconciles:
    - module subscription revenue
    - recorded developer/platform revenue entries
    - pending/paid payout amounts
    - deltas for quick consistency checks.
  - Extended billing API responses with summary metadata for subscriptions and payouts (counts and totals) so dashboard cards are driven by canonical backend aggregates instead of partial page slices.
  - Updated admin billing UI to consume summary metadata and show schema drift warnings clearly.
  - Fixed developer payouts UI field mismatch (`requestedAt` vs `createdAt`) so payout dates render correctly.
  - Expanded tier badge handling for actual tier values (`pro`, `business_basic`, `business_advanced`, `enterprise`, `free`).
- **Files updated:**
  - `server/src/services/adminService.ts`
  - `server/src/routes/admin-portal.ts`
  - `web/src/app/admin-portal/developers/page.tsx`
  - `web/src/app/admin-portal/billing/page.tsx`
- **Verification:**
  - Lint diagnostics checked on all edited files.
  - Result: no lint errors.

---

## Phase 6 - Marketplace Availability and User Run Path

### Objective

Guarantee approved modules are discoverable/installable and runnable by users.

### Deliverables

- Verify marketplace query logic remains tied to approved status.
- Verify install and runtime gates match intended scope rules.
- Validate both hosted and bundle runtime paths in user flow.

### Primary files/endpoints

- `server/src/controllers/moduleController.ts` (`getMarketplaceModules`, `installModule`, `getModuleRuntimeConfig`)
- `web/src/app/modules/page.tsx`
- `web/src/api/modules.ts`
- `web/src/app/modules/run/[moduleId]/page.tsx`

### Acceptance criteria

- Approved module appears in marketplace list.
- User can install under allowed scope.
- Runtime loads correctly for configured mode (hosted/bundle).

### Phase 6 execution status

- **Status:** Completed
- **Completed on:** 2026-04-07
- **Summary:**
  - Hardened business-scope marketplace access by requiring `businessId` and active business membership before returning marketplace data.
  - Fixed business runtime subscription gating mismatch:
    - business runtime now checks `businessSubscriptions` (business module subscriptions),
    - personal runtime continues to check `subscriptions` (personal module subscriptions).
  - Added business-scope runtime access validation:
    - validates `scope` input,
    - requires `businessId` for business scope,
    - enforces active business membership before returning runtime config.
  - Updated marketplace response subscription fields to report the correct scope-specific subscription status/amount (`businessSubscriptions` for business scope, `subscriptions` for personal scope).
- **Files updated:**
  - `server/src/controllers/moduleController.ts`
- **Verification:**
  - Lint diagnostics checked on edited file.
  - Result: no lint errors.

---

## Phase 7 - QA, Rollout, and Operational Guardrails

### Objective

Ship safely with regression coverage and deployment checks.

### Deliverables

- Add/expand tests for:
  - link permissions (member allowed, non-member denied)
  - module->business association and designation behavior
  - admin approval/publish path
  - approved marketplace visibility
- Add rollout checklist and production verification runbook.

### Test targets

- API/integration tests around module controller and admin routes.
- Focused UI verification for submit modal and admin module/developer pages.

### Acceptance criteria

- Critical path tests pass in CI/local.
- Production smoke checks pass after deploy.
- No regressions in existing module upload/runtime flow.

### Phase 7 execution status

- **Status:** Completed
- **Completed on:** 2026-04-07
- **Summary:**
  - Added focused backend regression tests for module critical path in:
    - `server/src/controllers/__tests__/moduleController.phase7.test.ts`
  - Test coverage includes:
    - module-to-business link permission deny for non-members,
    - idempotent link designation backfill path (`isDeveloperBusiness`),
    - business runtime success with active business subscription,
    - promotion guardrail blocking non-passed artifact scan,
    - marketplace query constrained to approved modules.
  - Added rollout + production verification runbook:
    - `docs/deployment/MODULE_UPLOAD_PHASE7_ROLLOUT_GUIDE.md`
    - includes pre-deploy checklist, smoke tests, monitoring points, and rollback criteria/actions.
- **Files updated:**
  - `server/src/controllers/__tests__/moduleController.phase7.test.ts`
  - `docs/deployment/MODULE_UPLOAD_PHASE7_ROLLOUT_GUIDE.md`
- **Verification:**
  - Test command:
    - `pnpm vitest run src/controllers/__tests__/moduleController.phase7.test.ts`
  - Result: 1 test file passed, 5 tests passed.
  - Lint diagnostics checked for edited code/docs touchpoints.
  - Result: no lint errors.

---

## Implementation Order

1. Phase 1 (policy alignment)
2. Phase 2 (association hardening)
3. Phase 3 (developer business designation + migration)
4. Phase 4 (admin operational review/sandbox)
5. Phase 5 (developer financial validation)
6. Phase 6 (marketplace + runtime verification)
7. Phase 7 (QA + rollout)

---

## Risks and Mitigations

- **Risk:** Permission regression blocks legitimate employee uploads.  
  **Mitigation:** Add targeted permission tests before release.

- **Risk:** New designation field causes schema drift or migration conflicts.  
  **Mitigation:** Follow modular Prisma workflow and migration-first rollout.

- **Risk:** Admin UI appears operational but omits a true runtime readiness signal.  
  **Mitigation:** Add explicit runtime/scan indicators and acceptance checklist.

- **Risk:** Financial metrics mismatch due to joins/aggregation assumptions.  
  **Mitigation:** Add reconciliation checks against source tables for sampled windows.

---

## Definition of Done

The plan is complete when:

1. Active business employees can upload/link modules with expected authorization checks.
2. Developer-business designation is persisted and visible to admin workflows.
3. Admin module review process is operational and reliable for approval decisions.
4. Developer management correctly reflects subscriptions and payouts.
5. Approved modules are visible and runnable in user module management.
6. Critical tests and rollout checks pass.

