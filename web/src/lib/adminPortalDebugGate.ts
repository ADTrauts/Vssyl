export const ADMIN_PORTAL_DEBUG_ENV_VAR = 'ADMIN_PORTAL_DEBUG_ENABLED';

export function isAdminPortalDebugEnabled(): boolean {
  return process.env[ADMIN_PORTAL_DEBUG_ENV_VAR] === 'true';
}
