import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { canWriteFile, canWriteFolder } from '../services/drivePermissionHelpers';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyDecision, PolicyInput, PolicyDenyReason } from './policyTypes';

export class PolicyDeniedError extends Error {
  constructor(public readonly decision: PolicyDecision) {
    super(typeof decision.reason === 'string' ? decision.reason : 'Policy denied');
    this.name = 'PolicyDeniedError';
  }
}

function resolveUserId(input: PolicyInput): string | undefined {
  if (input.userId && typeof input.userId === 'string') {
    return input.userId;
  }
  const id = input.user?.id;
  return typeof id === 'string' ? id : undefined;
}

async function deny(input: PolicyInput, reason: PolicyDenyReason, matchedPolicy?: string): Promise<PolicyDecision> {
  const decision: PolicyDecision = { allow: false, reason, matchedPolicy };
  const userId = resolveUserId(input);
  await logger.warn('Policy denied', {
    operation: 'policy_deny',
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    reason,
    matchedPolicy,
    userId,
    scope: input.scope,
  });
  return decision;
}

function scopeDashboardMatchesResource(
  scope: PolicyInput['scope'],
  resourceDashboardId: string | null
): PolicyDenyReason | null {
  if (!scope?.dashboardId) return null;
  if (scope.dashboardId !== (resourceDashboardId ?? undefined)) {
    return 'TENANT_MISMATCH';
  }
  return null;
}

function scopeBusinessHouseholdMatchDashboard(
  scope: PolicyInput['scope'],
  row: { businessId?: string | null; householdId?: string | null }
): PolicyDenyReason | null {
  if (!scope) return null;
  if (scope.businessId !== undefined) {
    const s = scope.businessId ?? null;
    const r = row.businessId ?? null;
    if (s !== r) return 'TENANT_MISMATCH';
  }
  if (scope.householdId !== undefined) {
    const s = scope.householdId ?? null;
    const r = row.householdId ?? null;
    if (s !== r) return 'TENANT_MISMATCH';
  }
  return null;
}

async function authorizeDashboardRead(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  const resourceId = input.resourceId;
  if (!resourceId || typeof resourceId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }
  if (input.resourceType !== 'dashboard') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: resourceId },
    select: { id: true, userId: true, businessId: true, householdId: true },
  });

  if (!dashboard) {
    // Defer 404 to handler (no row to enforce tenant/owner against).
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  const scope = input.scope;
  if (scope?.dashboardId && scope.dashboardId !== resourceId) {
    return deny(input, 'TENANT_MISMATCH');
  }

  const tenantErr = scopeBusinessHouseholdMatchDashboard(scope, dashboard);
  if (tenantErr) {
    return deny(input, tenantErr);
  }

  if (dashboard.userId !== userId) {
    /** Preserve existing REST shape: handler scopes by userId and returns 404 for other users' dashboards. */
    return { allow: true, matchedPolicy: 'delegate_owner_scope' };
  }

  return { allow: true, matchedPolicy: 'dashboard_owner' };
}

async function authorizeFileRead(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  const fileId = input.resourceId;
  if (!fileId || typeof fileId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }
  if (input.resourceType !== 'file') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { id: true, userId: true, dashboardId: true, trashedAt: true },
  });

  if (!file || file.trashedAt) {
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  const dashErr = scopeDashboardMatchesResource(input.scope, file.dashboardId);
  if (dashErr) {
    return deny(input, dashErr);
  }

  if (file.userId === userId) {
    return { allow: true, matchedPolicy: 'file_owner' };
  }

  const perm = await prisma.filePermission.findFirst({
    where: {
      fileId,
      userId,
      OR: [{ canRead: true }, { canWrite: true }],
    },
    select: { id: true },
  });
  if (perm) {
    return { allow: true, matchedPolicy: 'file_permission_read' };
  }

  return deny(input, 'INSUFFICIENT_ROLE');
}

async function authorizeFileReadFolder(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  const folderId = input.resourceId;
  if (!folderId || typeof folderId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }
  if (input.resourceType !== 'folder') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, userId: true, dashboardId: true, trashedAt: true },
  });

  if (!folder || folder.trashedAt) {
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  const dashErr = scopeDashboardMatchesResource(input.scope, folder.dashboardId);
  if (dashErr) {
    return deny(input, dashErr);
  }

  if (folder.userId === userId) {
    return { allow: true, matchedPolicy: 'folder_owner' };
  }

  const perm = await prisma.folderPermission.findFirst({
    where: {
      folderId,
      userId,
      OR: [{ canRead: true }, { canWrite: true }],
    },
    select: { id: true },
  });
  if (perm) {
    return { allow: true, matchedPolicy: 'folder_permission_read' };
  }

  return deny(input, 'INSUFFICIENT_ROLE');
}

async function authorizeFileWriteMutation(
  input: PolicyInput,
  matchedPolicy: string
): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const fileId = input.resourceId;
  if (!fileId || typeof fileId !== 'string' || input.resourceType !== 'file') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { id: true, userId: true, dashboardId: true, trashedAt: true },
  });

  if (!file || file.trashedAt) {
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  const dashErr = scopeDashboardMatchesResource(input.scope, file.dashboardId);
  if (dashErr) {
    return deny(input, dashErr);
  }

  if (file.userId === userId) {
    return { allow: true, matchedPolicy: 'file_owner' };
  }

  if (await canWriteFile(userId, fileId)) {
    return { allow: true, matchedPolicy };
  }

  return deny(input, 'INSUFFICIENT_ROLE');
}

async function authorizeFileUpdate(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeFileWriteMutation(input, 'file_permission_write');
}

async function authorizeFileDelete(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeFileWriteMutation(input, 'file_permission_write_delete');
}

async function authorizeFolderWriteMutation(
  input: PolicyInput,
  matchedPolicy: string
): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const folderId = input.resourceId;
  if (!folderId || typeof folderId !== 'string' || input.resourceType !== 'folder') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, userId: true, dashboardId: true, trashedAt: true },
  });

  if (!folder || folder.trashedAt) {
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  const dashErr = scopeDashboardMatchesResource(input.scope, folder.dashboardId);
  if (dashErr) {
    return deny(input, dashErr);
  }

  if (folder.userId === userId) {
    return { allow: true, matchedPolicy: 'folder_owner' };
  }

  if (await canWriteFolder(userId, folderId)) {
    return { allow: true, matchedPolicy };
  }

  return deny(input, 'INSUFFICIENT_ROLE');
}

async function authorizeFolderUpdate(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeFolderWriteMutation(input, 'folder_permission_write');
}

async function authorizeFolderDelete(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeFolderWriteMutation(input, 'folder_permission_write_delete');
}

/** Upload into a folder requires write on that folder; root upload allows authenticated actor. */
async function authorizeFileUpload(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  if (input.metadata?.uploadRoot === true) {
    return { allow: true, matchedPolicy: 'file_upload_root' };
  }

  return authorizeFolderWriteMutation(input, 'folder_permission_upload');
}

/** Move requires write on source file and write on target folder (null target = root). */
async function authorizeFileMove(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const fileId = input.resourceId;
  if (!fileId || typeof fileId !== 'string' || input.resourceType !== 'file') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const sourceDecision = await authorizeFileWriteMutation(
    { ...input, resourceType: 'file', resourceId: fileId },
    'file_move_source'
  );
  if (!sourceDecision.allow) {
    return sourceDecision;
  }

  const targetFolderId = input.metadata?.targetFolderId;
  if (targetFolderId === undefined) {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  if (targetFolderId === null || targetFolderId === '') {
    return { allow: true, matchedPolicy: 'file_move_root' };
  }

  if (typeof targetFolderId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  return authorizeFolderWriteMutation(
    {
      ...input,
      resourceType: 'folder',
      resourceId: targetFolderId,
    },
    'file_move_target_folder'
  );
}

/** Create subfolder requires write on parent folder; root create allows authenticated actor. */
async function authorizeFolderCreate(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  if (input.metadata?.createRoot === true) {
    return { allow: true, matchedPolicy: 'folder_create_root' };
  }

  return authorizeFolderWriteMutation(input, 'folder_permission_create');
}

async function authorizeDriveResourceShare(
  input: PolicyInput,
  resourceType: 'file' | 'folder'
): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const resourceId = input.resourceId;
  if (!resourceId || typeof resourceId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  if (input.resourceType !== resourceType) {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  if (resourceType === 'file') {
    const file = await prisma.file.findUnique({
      where: { id: resourceId },
      select: { id: true, userId: true, dashboardId: true, trashedAt: true },
    });
    if (!file || file.trashedAt) {
      return { allow: true, matchedPolicy: 'delegate_not_found' };
    }
    const dashErr = scopeDashboardMatchesResource(input.scope, file.dashboardId);
    if (dashErr) {
      return deny(input, dashErr);
    }
    if (file.userId !== userId) {
      return deny(input, 'NOT_OWNER');
    }
    return { allow: true, matchedPolicy: 'file_share_owner' };
  }

  const folder = await prisma.folder.findUnique({
    where: { id: resourceId },
    select: { id: true, userId: true, dashboardId: true, trashedAt: true },
  });
  if (!folder || folder.trashedAt) {
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }
  const dashErr = scopeDashboardMatchesResource(input.scope, folder.dashboardId);
  if (dashErr) {
    return deny(input, dashErr);
  }
  if (folder.userId !== userId) {
    return deny(input, 'NOT_OWNER');
  }
  return { allow: true, matchedPolicy: 'folder_share_owner' };
}

async function authorizeFileShare(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeDriveResourceShare(input, 'file');
}

async function authorizeFolderShare(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeDriveResourceShare(input, 'folder');
}

function memberCanManageBusinessModules(role: string, canManage: boolean): boolean {
  return role === 'ADMIN' || role === 'MANAGER' || canManage;
}

/** Aligns with business member update/remove legacy checks (canManage or elevated role). */
export function memberCanManageBusinessMembers(role: string, canManage: boolean): boolean {
  return memberCanManageBusinessModules(role, canManage);
}

/** Aligns with invite/resend legacy checks (canInvite or elevated role). */
export function memberCanInviteBusinessMembers(role: string, canInvite: boolean): boolean {
  return role === 'ADMIN' || role === 'MANAGER' || canInvite;
}

function normalizeEmailForPolicy(email: string): string {
  return email.trim().toLowerCase();
}

function resolveBusinessIdFromInput(input: PolicyInput): string | undefined {
  const scopeId = input.scope?.businessId;
  if (scopeId && typeof scopeId === 'string') {
    return scopeId;
  }
  const resourceId = input.resourceId;
  return resourceId && typeof resourceId === 'string' ? resourceId : undefined;
}

async function authorizeBusinessMemberManagement(
  input: PolicyInput,
  permission: 'invite' | 'manage',
  matchedPolicyOnAllow?: string
): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  if (input.resourceType !== 'business') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const businessId = resolveBusinessIdFromInput(input);
  if (!businessId) {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });

  if (!business) {
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  const membership = await prisma.businessMember.findFirst({
    where: { businessId, userId, isActive: true },
    select: { role: true, canManage: true, canInvite: true, businessId: true },
  });

  if (!membership) {
    return deny(input, 'NOT_MEMBER');
  }

  if (membership.businessId !== businessId) {
    return deny(input, 'TENANT_MISMATCH');
  }

  const allowed =
    permission === 'invite'
      ? memberCanInviteBusinessMembers(membership.role, membership.canInvite)
      : memberCanManageBusinessMembers(membership.role, membership.canManage);

  if (!allowed) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  return {
    allow: true,
    matchedPolicy:
      matchedPolicyOnAllow ??
      (permission === 'invite' ? 'business_member_invite' : 'business_member_manage'),
  };
}

async function authorizeBusinessUpdate(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeBusinessMemberManagement(input, 'manage', 'business_update');
}

async function authorizeBusinessMemberInvite(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeBusinessMemberManagement(input, 'invite');
}

async function authorizeBusinessMemberRemove(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeBusinessMemberManagement(input, 'manage');
}

async function authorizeBusinessMemberUpdate(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeBusinessMemberManagement(input, 'manage');
}

async function authorizeBusinessMemberResendInvite(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeBusinessMemberManagement(input, 'invite', 'business_member_resend_invite');
}

async function authorizeBusinessMemberCancelInvite(input: PolicyInput): Promise<PolicyDecision> {
  return authorizeBusinessMemberManagement(input, 'invite', 'business_member_cancel_invite');
}

/**
 * Invitee accepts an invitation — actor must match invitation email (not admin/manage role).
 */
async function authorizeBusinessMemberAcceptInvitation(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const token = input.metadata?.invitationToken;
  if (!token || typeof token !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const invitation = await prisma.businessInvitation.findUnique({
    where: { token },
    select: { email: true, businessId: true },
  });

  if (!invitation) {
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  const scopeBusinessId = input.scope?.businessId;
  if (scopeBusinessId && scopeBusinessId !== invitation.businessId) {
    return deny(input, 'TENANT_MISMATCH');
  }

  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!account?.email) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  if (
    normalizeEmailForPolicy(account.email) !== normalizeEmailForPolicy(invitation.email)
  ) {
    return deny(input, 'INSUFFICIENT_ROLE', 'invitation_email_mismatch');
  }

  return { allow: true, matchedPolicy: 'business_member_accept_invitation' };
}

function resolveModuleScope(
  input: PolicyInput
): 'personal' | 'business' {
  const scopeKey =
    input.metadata?.installScope === 'business' ||
    input.metadata?.installScope === 'personal'
      ? input.metadata.installScope
      : input.metadata?.uninstallScope === 'business' ||
          input.metadata?.uninstallScope === 'personal'
        ? input.metadata.uninstallScope
        : input.scope?.businessId
          ? 'business'
          : 'personal';
  return scopeKey;
}

/**
 * module:install — business installs require active membership + ADMIN | MANAGER | canManage.
 * Personal installs require authenticated actor + APPROVED module (no business scope).
 */
async function authorizeModuleInstall(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const moduleId = input.resourceId;
  if (!moduleId || typeof moduleId !== 'string' || input.resourceType !== 'module') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const installScope = resolveModuleScope(input);

  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true, status: true },
  });

  if (!module) {
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  if (module.status !== 'APPROVED') {
    return deny(input, 'INSUFFICIENT_ROLE', 'module_not_approved');
  }

  if (installScope === 'personal') {
    return { allow: true, matchedPolicy: 'module_install_personal' };
  }

  const businessId = input.scope?.businessId;
  if (!businessId || typeof businessId !== 'string') {
    return deny(input, 'INSUFFICIENT_ROLE', 'missing_business_scope');
  }

  const membership = await prisma.businessMember.findFirst({
    where: { businessId, userId, isActive: true },
    select: { role: true, canManage: true, businessId: true },
  });

  if (!membership) {
    return deny(input, 'NOT_MEMBER');
  }

  if (membership.businessId !== businessId) {
    return deny(input, 'TENANT_MISMATCH');
  }

  if (!memberCanManageBusinessModules(membership.role, membership.canManage)) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  return { allow: true, matchedPolicy: 'business_module_install' };
}

/**
 * module:uninstall — business: active membership + ADMIN | MANAGER | canManage + business installation.
 * Personal: authenticated actor + personal installation owned by user.
 */
async function authorizeModuleUninstall(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const moduleId = input.resourceId;
  if (!moduleId || typeof moduleId !== 'string' || input.resourceType !== 'module') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const uninstallScope = resolveModuleScope(input);

  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true },
  });

  if (!module) {
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  if (uninstallScope === 'personal') {
    const installation = await prisma.moduleInstallation.findUnique({
      where: { moduleId_userId: { moduleId, userId } },
      select: { id: true, userId: true },
    });

    if (!installation) {
      return { allow: true, matchedPolicy: 'delegate_installation_not_found' };
    }

    if (installation.userId !== userId) {
      return deny(input, 'INSUFFICIENT_ROLE', 'not_install_owner');
    }

    return { allow: true, matchedPolicy: 'module_uninstall_personal' };
  }

  const businessId = input.scope?.businessId;
  if (!businessId || typeof businessId !== 'string') {
    return deny(input, 'INSUFFICIENT_ROLE', 'missing_business_scope');
  }

  const membership = await prisma.businessMember.findFirst({
    where: { businessId, userId, isActive: true },
    select: { role: true, canManage: true, businessId: true },
  });

  if (!membership) {
    return deny(input, 'NOT_MEMBER');
  }

  if (membership.businessId !== businessId) {
    return deny(input, 'TENANT_MISMATCH');
  }

  if (!memberCanManageBusinessModules(membership.role, membership.canManage)) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const businessInstallation = await prisma.businessModuleInstallation.findUnique({
    where: { moduleId_businessId: { moduleId, businessId } },
    select: { id: true },
  });

  if (!businessInstallation) {
    return { allow: true, matchedPolicy: 'delegate_installation_not_found' };
  }

  return { allow: true, matchedPolicy: 'business_module_uninstall' };
}

/**
 * Central policy check: authentication must already have established the actor (pass userId or user).
 * Denies are logged with operation `policy_deny`. Unknown actions fail closed.
 */
export async function authorize(input: PolicyInput): Promise<PolicyDecision> {
  const action = input.action;

  if (action === POLICY_ACTIONS.DASHBOARD_READ) {
    return authorizeDashboardRead(input);
  }

  if (action === POLICY_ACTIONS.FILE_READ && input.resourceType === 'file') {
    return authorizeFileRead(input);
  }

  if (action === POLICY_ACTIONS.FILE_READ && input.resourceType === 'folder') {
    return authorizeFileReadFolder(input);
  }

  if (action === POLICY_ACTIONS.FILE_UPDATE) {
    return authorizeFileUpdate(input);
  }

  if (action === POLICY_ACTIONS.FILE_DELETE) {
    return authorizeFileDelete(input);
  }

  if (action === POLICY_ACTIONS.FOLDER_UPDATE) {
    return authorizeFolderUpdate(input);
  }

  if (action === POLICY_ACTIONS.FOLDER_DELETE) {
    return authorizeFolderDelete(input);
  }

  if (action === POLICY_ACTIONS.FOLDER_CREATE) {
    return authorizeFolderCreate(input);
  }

  if (action === POLICY_ACTIONS.FILE_UPLOAD) {
    return authorizeFileUpload(input);
  }

  if (action === POLICY_ACTIONS.FILE_MOVE) {
    return authorizeFileMove(input);
  }

  if (action === POLICY_ACTIONS.FILE_SHARE) {
    return authorizeFileShare(input);
  }

  if (action === POLICY_ACTIONS.FOLDER_SHARE) {
    return authorizeFolderShare(input);
  }

  if (action === POLICY_ACTIONS.MODULE_INSTALL) {
    return authorizeModuleInstall(input);
  }

  if (action === POLICY_ACTIONS.MODULE_UNINSTALL) {
    return authorizeModuleUninstall(input);
  }

  if (action === POLICY_ACTIONS.BUSINESS_MEMBER_INVITE) {
    return authorizeBusinessMemberInvite(input);
  }

  if (action === POLICY_ACTIONS.BUSINESS_MEMBER_REMOVE) {
    return authorizeBusinessMemberRemove(input);
  }

  if (action === POLICY_ACTIONS.BUSINESS_MEMBER_UPDATE) {
    return authorizeBusinessMemberUpdate(input);
  }

  if (action === POLICY_ACTIONS.BUSINESS_MEMBER_ACCEPT_INVITATION) {
    return authorizeBusinessMemberAcceptInvitation(input);
  }

  if (action === POLICY_ACTIONS.BUSINESS_MEMBER_RESEND_INVITE) {
    return authorizeBusinessMemberResendInvite(input);
  }

  if (action === POLICY_ACTIONS.BUSINESS_MEMBER_CANCEL_INVITE) {
    return authorizeBusinessMemberCancelInvite(input);
  }

  if (action === POLICY_ACTIONS.BUSINESS_UPDATE) {
    return authorizeBusinessUpdate(input);
  }

  if (action === POLICY_ACTIONS.CHAT_CONVERSATION_CREATE) {
    return await authorizeChatConversationCreate(input);
  }

  const chatConversationActions: string[] = [
    POLICY_ACTIONS.CHAT_CONVERSATION_READ,
    POLICY_ACTIONS.CHAT_CONVERSATION_TRASH,
    POLICY_ACTIONS.CHAT_CONVERSATION_RESTORE,
    POLICY_ACTIONS.CHAT_CONVERSATION_PERMANENT_DELETE,
    POLICY_ACTIONS.CHAT_MESSAGE_CREATE,
    POLICY_ACTIONS.CHAT_THREAD_CREATE,
  ];
  if (chatConversationActions.includes(action) && input.resourceType === 'conversation') {
    return authorizeChatConversationParticipant(input);
  }

  const chatMessageActions: string[] = [
    POLICY_ACTIONS.CHAT_MESSAGE_READ,
    POLICY_ACTIONS.CHAT_MESSAGE_TRASH,
    POLICY_ACTIONS.CHAT_MESSAGE_RESTORE,
    POLICY_ACTIONS.CHAT_MESSAGE_PERMANENT_DELETE,
    POLICY_ACTIONS.CHAT_MESSAGE_REACT,
  ];
  if (chatMessageActions.includes(action) && input.resourceType === 'message') {
    return authorizeChatMessageParticipant(input);
  }

  return deny(input, 'POLICY_NOT_IMPLEMENTED');
}

async function authorizeChatConversationCreate(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }
  return { allow: true, matchedPolicy: 'chat_authenticated_create' };
}

async function authorizeChatConversationParticipant(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const conversationId = input.resourceId;
  if (!conversationId || typeof conversationId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId,
      isActive: true,
    },
    select: { id: true },
  });

  if (!participant) {
    return deny(input, 'NOT_MEMBER');
  }

  return { allow: true, matchedPolicy: 'chat_active_participant' };
}

async function authorizeChatMessageParticipant(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const messageId = input.resourceId;
  if (!messageId || typeof messageId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const message = await prisma.message.findFirst({
    where: { id: messageId },
    select: {
      id: true,
      deletedAt: true,
      conversation: {
        select: {
          participants: {
            where: { userId, isActive: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!message) {
    return deny(input, 'NOT_MEMBER');
  }

  if (message.conversation.participants.length === 0) {
    return deny(input, 'NOT_MEMBER');
  }

  const trashActions: string[] = [
    POLICY_ACTIONS.CHAT_MESSAGE_TRASH,
    POLICY_ACTIONS.CHAT_MESSAGE_RESTORE,
    POLICY_ACTIONS.CHAT_MESSAGE_PERMANENT_DELETE,
  ];
  if (trashActions.includes(input.action)) {
    if (input.action === POLICY_ACTIONS.CHAT_MESSAGE_TRASH && message.deletedAt != null) {
      return deny(input, 'NOT_MEMBER');
    }
    if (
      (input.action === POLICY_ACTIONS.CHAT_MESSAGE_RESTORE ||
        input.action === POLICY_ACTIONS.CHAT_MESSAGE_PERMANENT_DELETE) &&
      message.deletedAt == null
    ) {
      return deny(input, 'NOT_MEMBER');
    }
  } else if (message.deletedAt != null) {
    return deny(input, 'NOT_MEMBER');
  }

  return { allow: true, matchedPolicy: 'chat_message_active_participant' };
}

export async function enforcePolicy(input: PolicyInput): Promise<PolicyDecision & { allow: true }> {
  const decision = await authorize(input);
  if (!decision.allow) {
    throw new PolicyDeniedError(decision);
  }
  return decision as PolicyDecision & { allow: true };
}
