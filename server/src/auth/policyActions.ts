/**
 * Named policy actions. Unimplemented actions fail closed in the policy engine (POLICY_NOT_IMPLEMENTED).
 */
export const POLICY_ACTIONS = {
  DASHBOARD_READ: 'dashboard:read',
  BUSINESS_UPDATE: 'business:update',
  BUSINESS_MEMBER_MANAGE: 'business:member.manage',
  MODULE_INSTALL: 'module:install',
  FILE_READ: 'file:read',
  FILE_UPDATE: 'file:update',
  FILE_DELETE: 'file:delete',
  CALENDAR_EVENT_CREATE: 'calendar:event.create',
} as const;

export type PolicyAction = (typeof POLICY_ACTIONS)[keyof typeof POLICY_ACTIONS];
