# PP-3 — Policy Engine Alignment (Package 1)

**Program:** Account Platform — PP-3 Package 1  
**Date:** 2026-06-20  
**Status:** **Implemented** — `entitlement:read` and `entitlement:write` in Policy Engine v1

---

## New policy actions

| Action | Resource type | Authority |
|--------|---------------|-----------|
| `entitlement:read` | `user` (personal) | Authenticated self — `resourceId` must match `userId` |
| `entitlement:read` | `business` (scoped) | Active `businessMember` for `scope.businessId` |
| `entitlement:write` | `subscription` / `business` | Platform `ADMIN` role only |

**Registry:** `server/src/auth/policyActions.ts`  
**Engine:** `server/src/auth/policyEngine.ts` → `authorizeEntitlementPolicy()`  
**Dual helper:** `server/src/auth/entitlementPolicyDual.ts`

---

## Deny reasons

| Reason | When |
|--------|------|
| `INSUFFICIENT_ROLE` | Unauthenticated; personal read of another user; non-admin write |
| `NOT_MEMBER` | Business-scoped read without active membership |
| `TENANT_MISMATCH` | `resourceId` disagrees with `scope.businessId` |

---

## Enforcement sites

| Site | Action | Pattern |
|------|--------|---------|
| `entitlementController` | `entitlement:read` | `assertEntitlementReadPolicy()` before resolve |
| `admin-override` set-tier | `entitlement:write` | `assertEntitlementWritePolicy()` before `setBusinessTierAuthority()` |
| `debug-business-tier` POST | Implicit admin gate | Existing `requireRole('ADMIN')` + authority write path |

---

## Dual enforcement posture

Package 1 uses **policy-first** for new entitlement routes (no legacy parallel check needed).

Admin override retains existing `requireAdmin` middleware **plus** `entitlement:write` policy — dual gate intentional for transitional admin paths.

Billing subscription mutations (checkout, Stripe webhooks) are **not** yet policy-wrapped — deferred to Package 2 (addresses PP3-F05 partially via admin path only).

---

## Documentation cross-reference

Update agent rule pointer: `.cursor/rules/policy-engine.mdc` and `docs/architecture/POLICY_ENGINE.md` should list entitlement actions when next touched.

---

## Coverage summary

| Area | PE coverage |
|------|-------------|
| Entitlement read APIs | ✅ `entitlement:read` |
| Admin tier override | ✅ `entitlement:write` |
| Billing checkout / webhooks | ❌ Package 2 |
| Feature gating middleware | ❌ Not required — resolver is read-only |
| HR feature gating | ❌ HR owns matrix; tier input only |

---

**Last updated:** 2026-06-20 (PP-3 Package 1)
