# Admin Portal Impersonation Policy

**Finding:** AP-F-012  
**Status:** Implementation-aligned policy (Package 0E-D)  
**Last updated:** 2026-06-17

## Purpose

Admin impersonation lets platform administrators assume a non-admin user session for support, debugging, and tenant-scoped verification. It is a **privileged, audited, short-lived** operation — not a general user login bypass.

## Who May Impersonate

- Users with platform role `ADMIN` only
- All impersonation routes require `authenticateJWT` + `requireAdmin`
- Unauthenticated and non-admin callers are rejected with 401/403

## Who May Not Be Impersonated

| Target | Policy |
|--------|--------|
| Self (acting admin) | **Denied** — prevents privilege confusion and audit ambiguity |
| Other `ADMIN` users | **Denied** — administrators are never impersonation targets |
| Missing user | **Denied** — 404 |
| Unverified accounts (`emailVerified` is null) | **Denied** — treated as not fully activated |

**Note:** The `User` model does not yet persist ban/suspend status. Until `User.status` (or equivalent) exists, ban/suspend enforcement relies on future schema work; unverified accounts are the only persisted eligibility signal beyond role.

## Required Audit Events

| Action | Audit log `action` | Actor |
|--------|-------------------|-------|
| Start | `USER_IMPERSONATION_START` | Acting admin `userId` |
| End | `USER_IMPERSONATION_END` | Acting admin `userId` |
| Denied attempt | `USER_IMPERSONATION_DENIED` | Acting admin `userId` |

Audit records include:

- `resourceType: 'user'`
- `resourceId` = target user id
- `adminImpersonationId` on start/end (links to `admin_impersonations` row)
- `ipAddress`, `userAgent`, structured `details` JSON

## Session / Scope Expectations

- One active impersonation per admin at a time
- Default session TTL: 1 hour (`expiresInMinutes` optional override)
- Session token stored as SHA-256 hash in `admin_impersonations.sessionTokenHash`
- Optional `businessId` scopes impersonation to a business the target belongs to
- Optional `context` and `reason` fields document support/debug intent

## Tenant / Business Safety

- When `businessId` is supplied, `AdminService.startImpersonation` verifies `businessMember` membership before creating the session
- Cross-tenant impersonation is intentional for platform support; business scope narrows context when provided
- Responses expose only `id`, `email`, `name` for target users — never passwords or secrets

## Prohibited Uses

- Impersonating another administrator
- Impersonating yourself
- Using impersonation for routine development without audit justification
- Sharing impersonation tokens outside secure admin channels
- Bypassing tenant/business membership checks when `businessId` is specified

## Test Requirements

Route tests (`admin-portal-impersonation.test.ts`) must prove:

1. Unauthenticated requests fail
2. Non-admin requests fail
3. Admin can impersonate eligible user
4. Self-impersonation denied
5. Admin-target impersonation denied
6. Unverified account impersonation denied
7. Start action audit-logged (`USER_IMPERSONATION_START`)
8. End action audit-logged (`USER_IMPERSONATION_END`)
9. Response does not leak sensitive fields (password, tokens beyond session token)
10. Existing happy path intact

## Future Certification Expectations

- Persist `User.status` and deny impersonation for `banned` / `suspended`
- Normalize impersonation events to platform activity envelope when Admin Portal certification path requires it
- Runtime verification of impersonation banner + session handoff in production UI
- Consolidate debug impersonation pages (AP-F-020 / AP-F-021 — out of 0E-D scope)

## Implementation References

- Routes: `server/src/routes/admin-portal/adminPortalRoutes.core.ts`
- Validation: `server/src/routes/admin-portal/adminPortalShared.ts` (`validateImpersonationTarget`, `logImpersonationDenied`)
- Service: `server/src/services/adminService.ts` (`startImpersonation`, `endImpersonation`)
- Tests: `server/src/routes/__tests__/admin-portal-impersonation.test.ts`
