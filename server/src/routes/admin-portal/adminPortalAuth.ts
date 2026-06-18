/**
 * Canonical Admin Portal authorization middleware (AP-F-011).
 * Re-exports shared gates and documents preferred middleware stacks.
 * Do not change response contracts — wrappers compose existing behavior only.
 */
import type { RequestHandler } from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { requireAdmin } from './adminPortalShared';
import { requireAdminPortalDebugEnabled } from './adminPortalDebugGate';

export { requireAdmin } from './adminPortalShared';
export { requireAdminPortalDebugEnabled } from './adminPortalDebugGate';
export {
  enforceDangerousMigrationOpGate,
  isAdminPortalDangerousOpsEnabled,
  ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR,
} from './adminPortalShared';

/** Standard canonical admin-portal route stack: JWT → platform ADMIN role. */
export const adminPortalAccessMiddleware: RequestHandler[] = [authenticateJWT, requireAdmin];

/** Security sub-router parent mount in admin-portal.ts (handlers rely on parent stack). */
export const adminPortalSecurityAccessMiddleware: RequestHandler[] = [authenticateJWT, requireAdmin];

/** Testing router stack: debug env gate → JWT → ADMIN (order preserved from admin-portal-testing.ts). */
export const adminPortalTestingAccessMiddleware: RequestHandler[] = [
  requireAdminPortalDebugEnabled,
  authenticateJWT,
  requireAdmin,
];
