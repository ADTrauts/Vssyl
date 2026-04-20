# Module Upload Phase 7 Rollout Guide

Last updated: 2026-04-07  
Owner: Platform Engineering

## Purpose

This runbook defines the production rollout and smoke validation for the third-party module upload/review/publish/runtime path after Phase 7.

## Scope

- Module upload/link authorization and developer-business designation
- Admin module review + promotion safeguards
- Marketplace visibility and installation path
- Runtime path validation (hosted and bundle)

**Environment assumptions (GCS vs local, Docker sandbox limits):** see `docs/guides/MODULE_PLATFORM_ENVIRONMENT_MATRIX.md` (**A-051**). Artifact upload **requires** configured GCS in code; do not assume local file storage exercises the same path.

## Pre-Deploy Checklist

- Database migrations are applied:
  - `pnpm prisma migrate status`
  - `pnpm prisma migrate deploy`
- Prisma client is current:
  - `pnpm prisma:generate`
- Regression tests pass:
  - `pnpm vitest run src/controllers/__tests__/moduleController.phase7.test.ts`
- Lint checks pass on touched files:
  - `pnpm lint`
- Environment variables are present in target environment:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_WS_URL`
  - `DATABASE_URL`
  - `STORAGE_PROVIDER`
  - `GOOGLE_CLOUD_PROJECT_ID`
  - `GOOGLE_CLOUD_STORAGE_BUCKET`

## Deployment Steps

1. Deploy backend service with latest code.
2. Deploy frontend service with latest code.
3. Verify both health endpoints and basic auth flow.
4. Run production smoke checks (below) before broad release.

## Production Smoke Checks

### A. Upload + Link Policy

1. Submit a module as an active business employee.
2. Link module to an existing business where user is active.
3. Verify success response.
4. Attempt link with a non-member user.
5. Verify `403` access denial.
6. Confirm business record is marked `isDeveloperBusiness = true`.

### B. Admin Review and Promotion

1. Open admin portal module submissions.
2. Confirm checklist shows scan/runtime/publish readiness.
3. Attempt approval when scan is not `PASSED`.
4. Verify approval is blocked in UI.
5. Promote a version with non-passed artifact scan via admin action/API.
6. Verify request fails with artifact scan guardrail.

### C. Marketplace Visibility and Installation

1. Confirm only approved modules appear in marketplace results.
2. Install approved module in personal scope.
3. Install approved module in business scope with valid role/membership.
4. Validate unauthorized business user cannot install.

### D. Runtime Validation

1. Hosted path: run module with valid `frontend.entryUrl`.
2. Bundle path: run module with artifact-backed runtime.
3. Verify runtime rejects:
   - uninstalled module
   - non-approved module
   - missing active subscription for paid module
4. Verify business runtime uses business-scope subscription checks.

## Monitoring and Alerting During Rollout

- Monitor backend logs for:
  - `module_install`
  - `get_marketplace_modules`
  - `get_module_runtime_config`
  - `module_link_business`
  - `MODULE_PROMOTE_PREVIOUS_VERSION`
- Watch for spikes in:
  - `403` on install/runtime endpoints
  - `402` subscription-required responses
  - `5xx` on upload init/finalize/runtime

## Rollback Criteria

Rollback if any of these occur after deployment:

- Runtime availability regression for approved installed modules
- Incorrect marketplace visibility for approved modules
- Unauthorized access succeeds for business-scope actions
- Repeated `5xx` errors in module upload/review/runtime path

## Rollback Actions

1. Revert frontend and backend to previous known-good release.
2. Confirm runtime and marketplace behavior restored.
3. Preserve logs and request samples for postmortem.
4. Create follow-up patch and re-run smoke checks before reattempt.
