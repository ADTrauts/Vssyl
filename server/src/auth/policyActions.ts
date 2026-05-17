/**
 * Named policy actions. Unimplemented actions fail closed in the policy engine (POLICY_NOT_IMPLEMENTED).
 */
export const POLICY_ACTIONS = {
  DASHBOARD_READ: 'dashboard:read',
  BUSINESS_UPDATE: 'business:update',
  BUSINESS_MEMBER_MANAGE: 'business:member.manage',
  BUSINESS_MEMBER_INVITE: 'business:member.invite',
  BUSINESS_MEMBER_REMOVE: 'business:member.remove',
  BUSINESS_MEMBER_UPDATE: 'business:member.update',
  BUSINESS_MEMBER_ACCEPT_INVITATION: 'business:member.acceptInvitation',
  BUSINESS_MEMBER_RESEND_INVITE: 'business:member.resendInvite',
  BUSINESS_MEMBER_CANCEL_INVITE: 'business:member.cancelInvite',
  MODULE_INSTALL: 'module:install',
  MODULE_UNINSTALL: 'module:uninstall',
  FILE_READ: 'file:read',
  FILE_UPDATE: 'file:update',
  FILE_DELETE: 'file:delete',
  FOLDER_UPDATE: 'folder:update',
  FOLDER_DELETE: 'folder:delete',
  FOLDER_CREATE: 'folder:create',
  FOLDER_SHARE: 'folder:share',
  FILE_MOVE: 'file:move',
  FILE_UPLOAD: 'file:upload',
  FILE_SHARE: 'file:share',
  CALENDAR_EVENT_CREATE: 'calendar:event.create',
} as const;

export type PolicyAction = (typeof POLICY_ACTIONS)[keyof typeof POLICY_ACTIONS];
