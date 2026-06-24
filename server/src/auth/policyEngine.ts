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

async function authorizeDashboardList(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  if (input.resourceType !== 'dashboard') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }
  return { allow: true, matchedPolicy: 'dashboard_list_authenticated' };
}

async function assertDashboardContextMembershipForWrite(
  userId: string,
  scope: PolicyInput['scope']
): Promise<PolicyDenyReason | null> {
  if (scope?.businessId) {
    const m = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: scope.businessId, userId } },
      select: { isActive: true },
    });
    if (!m?.isActive) {
      return 'NOT_MEMBER';
    }
  }
  if (scope?.householdId) {
    const m = await prisma.householdMember.findUnique({
      where: { userId_householdId: { userId, householdId: scope.householdId } },
      select: { isActive: true },
    });
    if (!m?.isActive) {
      return 'NOT_MEMBER';
    }
  }
  const institutionId =
    typeof scope === 'object' && scope && 'institutionId' in scope
      ? (scope as { institutionId?: string }).institutionId
      : undefined;
  if (institutionId) {
    const m = await prisma.institutionMember.findUnique({
      where: { institutionId_userId: { institutionId, userId } },
      select: { isActive: true },
    });
    if (!m?.isActive) {
      return 'NOT_MEMBER';
    }
  }
  return null;
}

async function authorizeDashboardWrite(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  if (input.resourceType !== 'dashboard') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const resourceId = input.resourceId;
  const scope = input.scope;
  const isCreatePath =
    !resourceId ||
    resourceId === 'new' ||
    resourceId === userId ||
    input.metadata?.operation === 'create';

  if (isCreatePath) {
    const memberErr = await assertDashboardContextMembershipForWrite(userId, scope);
    if (memberErr) {
      return deny(input, memberErr);
    }
    return { allow: true, matchedPolicy: 'dashboard_authenticated_write' };
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: resourceId },
    select: { id: true, userId: true, businessId: true, householdId: true },
  });

  if (!dashboard) {
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  if (scope?.dashboardId && scope.dashboardId !== resourceId) {
    return deny(input, 'TENANT_MISMATCH');
  }

  const tenantErr = scopeBusinessHouseholdMatchDashboard(scope, dashboard);
  if (tenantErr) {
    return deny(input, tenantErr);
  }

  if (dashboard.userId !== userId) {
    return deny(input, 'NOT_OWNER');
  }

  return { allow: true, matchedPolicy: 'dashboard_owner_write' };
}

async function authorizeDashboardDelete(input: PolicyInput): Promise<PolicyDecision> {
  const writeDecision = await authorizeDashboardWrite(input);
  if (!writeDecision.allow) {
    return writeDecision;
  }
  return {
    ...writeDecision,
    matchedPolicy: writeDecision.matchedPolicy?.includes('authenticated')
      ? 'dashboard_authenticated_delete'
      : 'dashboard_owner_delete',
  };
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
 * Bootstrap create — any authenticated user may create a business (founder flow).
 */
async function authorizeBusinessCreate(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  return { allow: true, matchedPolicy: 'business_create_bootstrap' };
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

async function authorizeSearchRead(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const businessId = input.scope?.businessId;
  if (businessId) {
    const membership = await prisma.businessMember.findFirst({
      where: { userId, businessId, isActive: true },
      select: { id: true },
    });
    if (!membership) {
      return deny(input, 'NOT_MEMBER');
    }
  }

  const householdId = input.scope?.householdId;
  if (householdId) {
    const membership = await prisma.householdMember.findFirst({
      where: { userId, householdId, isActive: true },
      select: { id: true },
    });
    if (!membership) {
      return deny(input, 'NOT_MEMBER');
    }
  }

  const dashboardId = input.scope?.dashboardId;
  if (dashboardId) {
    const dashboard = await prisma.dashboard.findFirst({
      where: { id: dashboardId, userId },
      select: { id: true, businessId: true, householdId: true },
    });
    if (!dashboard) {
      return deny(input, 'NOT_OWNER');
    }
    if (businessId && (dashboard.businessId ?? null) !== businessId) {
      return deny(input, 'TENANT_MISMATCH');
    }
    if (householdId && dashboard.householdId !== householdId) {
      return deny(input, 'TENANT_MISMATCH');
    }
  }

  return { allow: true, matchedPolicy: 'search_read_authenticated' };
}

async function authorizeAnalyticsRead(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const operation = input.metadata?.operation;
  if (operation === 'personal' || operation === 'export') {
    if (input.resourceId && input.resourceId !== userId) {
      return deny(input, 'NOT_OWNER');
    }
    return { allow: true, matchedPolicy: 'analytics_self_read' };
  }

  if (operation === 'module') {
    return { allow: true, matchedPolicy: 'analytics_module_read_authenticated' };
  }

  if (operation === 'dashboard_summary') {
    return authorizeDashboardRead({
      ...input,
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceType: 'dashboard',
      resourceId: typeof input.resourceId === 'string' ? input.resourceId : input.scope?.dashboardId,
    });
  }

  return { allow: true, matchedPolicy: 'analytics_read_authenticated' };
}

async function authorizeAnalyticsAdmin(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const businessId = input.scope?.businessId;
  if (typeof businessId === 'string') {
    const membership = await prisma.businessMember.findFirst({
      where: { businessId, userId, isActive: true },
      select: { role: true },
    });
    if (!membership) {
      return deny(input, 'NOT_MEMBER');
    }
    if (membership.role === 'ADMIN' || membership.role === 'MANAGER') {
      return { allow: true, matchedPolicy: 'analytics_business_admin' };
    }
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === 'ADMIN') {
    return { allow: true, matchedPolicy: 'analytics_platform_admin' };
  }

  return deny(input, 'INSUFFICIENT_ROLE');
}

/**
 * Central policy check: authentication must already have established the actor (pass userId or user).
 * Denies are logged with operation `policy_deny`. Unknown actions fail closed.
 */
export async function authorize(input: PolicyInput): Promise<PolicyDecision> {
  const action = input.action;

  if (action === POLICY_ACTIONS.SEARCH_READ) {
    return authorizeSearchRead(input);
  }

  if (action === POLICY_ACTIONS.ANALYTICS_READ) {
    return authorizeAnalyticsRead(input);
  }

  if (action === POLICY_ACTIONS.ANALYTICS_ADMIN) {
    return authorizeAnalyticsAdmin(input);
  }

  if (action === POLICY_ACTIONS.DASHBOARD_READ) {
    if (input.metadata?.operation === 'list') {
      return authorizeDashboardList(input);
    }
    return authorizeDashboardRead(input);
  }

  if (action === POLICY_ACTIONS.DASHBOARD_WRITE) {
    return authorizeDashboardWrite(input);
  }

  if (action === POLICY_ACTIONS.DASHBOARD_DELETE) {
    return authorizeDashboardDelete(input);
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

  if (action === POLICY_ACTIONS.BUSINESS_CREATE) {
    return authorizeBusinessCreate(input);
  }

  if (isOrgChartPolicyAction(action)) {
    return authorizeOrgChartPolicy(input, action);
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

  const calendarReadActions: string[] = [
    POLICY_ACTIONS.CALENDAR_READ,
    POLICY_ACTIONS.CALENDAR_UPDATE,
    POLICY_ACTIONS.CALENDAR_EVENT_RSVP,
  ];
  if (calendarReadActions.includes(action) && input.resourceType === 'calendar') {
    return authorizeCalendarMember(input);
  }

  if (action === POLICY_ACTIONS.CALENDAR_CREATE) {
    return authorizeCalendarCreate(input);
  }

  if (action === POLICY_ACTIONS.CALENDAR_DELETE) {
    return authorizeCalendarOwner(input);
  }

  const calendarEventReadActions: string[] = [
    POLICY_ACTIONS.CALENDAR_EVENT_READ,
    POLICY_ACTIONS.CALENDAR_EVENT_UPDATE,
    POLICY_ACTIONS.CALENDAR_EVENT_DELETE,
  ];
  if (calendarEventReadActions.includes(action) && input.resourceType === 'calendar_event') {
    return authorizeCalendarEventAccess(input);
  }

  if (action === POLICY_ACTIONS.CALENDAR_EVENT_CREATE && input.resourceType === 'calendar_event') {
    return authorizeCalendarEventCreate(input);
  }

  if (action === POLICY_ACTIONS.CALENDAR_AVAILABILITY_READ) {
    return authorizeCalendarAvailabilityRead(input);
  }

  const placeGraphActions: string[] = [
    POLICY_ACTIONS.PLACE_READ,
    POLICY_ACTIONS.PLACE_WRITE,
    POLICY_ACTIONS.PLACE_SETTINGS_UPDATE,
    POLICY_ACTIONS.PLACE_SETUP_COMPLETE,
    POLICY_ACTIONS.PLACE_INTERESTS_UPDATE,
    POLICY_ACTIONS.PLACE_FOLLOW_VISIBILITY_UPDATE,
  ];
  if (placeGraphActions.includes(action) && input.resourceType === 'place') {
    return authorizePlaceOwner(input);
  }

  const placeNodeActions: string[] = [
    POLICY_ACTIONS.PLACE_NODE_CREATE,
    POLICY_ACTIONS.PLACE_NODE_UPDATE,
    POLICY_ACTIONS.PLACE_NODE_DELETE,
    POLICY_ACTIONS.PLACE_NODE_READ,
  ];
  if (placeNodeActions.includes(action) && input.resourceType === 'place_node') {
    return authorizePlaceNodeOwner(input);
  }

  if (action === POLICY_ACTIONS.PLACE_LISTING_READ && input.resourceType === 'place_listing') {
    return authorizePlaceListingRead(input);
  }

  if (action === POLICY_ACTIONS.PLACE_DISCOVERY_READ && input.resourceType === 'place') {
    return authorizePlaceDiscoveryRead(input);
  }

  if (action === POLICY_ACTIONS.PLACE_MEETING_READ && input.resourceType === 'place_meeting') {
    return authorizePlaceMeetingRead(input);
  }

  const placeListingWriteActions: string[] = [
    POLICY_ACTIONS.PLACE_LISTING_WRITE,
    POLICY_ACTIONS.PLACE_LISTING_UNPUBLISH,
    POLICY_ACTIONS.PLACE_LISTING_IMAGE_UPDATE,
    POLICY_ACTIONS.PLACE_LISTING_INTERACTION_LINK_WRITE,
  ];
  if (placeListingWriteActions.includes(action) && input.resourceType === 'place_listing') {
    return authorizePlaceListingAdminWrite(input);
  }

  if (action === POLICY_ACTIONS.PLACE_LISTING_PUBLISH && input.resourceType === 'place_listing') {
    return authorizePlaceListingPublish(input);
  }

  if (action === POLICY_ACTIONS.PLACE_LISTING_REPORT && input.resourceType === 'place_listing') {
    return authorizePlaceListingReport(input);
  }

  const placeListingTrashActions: string[] = [
    POLICY_ACTIONS.PLACE_LISTING_TRASH,
    POLICY_ACTIONS.PLACE_LISTING_RESTORE,
    POLICY_ACTIONS.PLACE_LISTING_PERMANENT_DELETE,
  ];
  if (placeListingTrashActions.includes(action) && input.resourceType === 'place_listing') {
    return authorizePlaceListingAdminWrite(input);
  }

  if (action === POLICY_ACTIONS.PLACE_MEETING_CREATE && input.resourceType === 'place_meeting') {
    return authorizePlaceMeetingCreate(input);
  }

  if (action === POLICY_ACTIONS.PLACE_MEETING_UPDATE && input.resourceType === 'place_meeting') {
    return authorizePlaceMeetingUpdate(input);
  }

  if (action === POLICY_ACTIONS.PLACE_MEETING_CANCEL && input.resourceType === 'place_meeting') {
    return authorizePlaceMeetingCancel(input);
  }

  if (action === POLICY_ACTIONS.PLACE_MEETING_RSVP && input.resourceType === 'place_meeting') {
    return authorizePlaceMeetingRsvp(input);
  }

  if (action === POLICY_ACTIONS.PLACE_MEETING_LINK_CALENDAR && input.resourceType === 'place_meeting') {
    return authorizePlaceMeetingLinkCalendar(input);
  }

  const placeMeetingTrashActions: string[] = [
    POLICY_ACTIONS.PLACE_MEETING_TRASH,
    POLICY_ACTIONS.PLACE_MEETING_RESTORE,
    POLICY_ACTIONS.PLACE_MEETING_PERMANENT_DELETE,
  ];
  if (placeMeetingTrashActions.includes(action) && input.resourceType === 'place_meeting') {
    return authorizePlaceMeetingUpdate(input);
  }

  if (action === POLICY_ACTIONS.PLACE_CONNECTION_REQUEST && input.resourceType === 'place_connection') {
    return authorizePlaceConnectionRequest(input);
  }

  if (action === POLICY_ACTIONS.PLACE_CONNECTION_ACCEPT && input.resourceType === 'place_connection') {
    return authorizePlaceConnectionAccept(input);
  }

  if (
    action === POLICY_ACTIONS.PLACE_TRANSACTION_READ &&
    input.resourceType === 'place_transaction'
  ) {
    return authorizePlaceTransactionRead(input);
  }

  if (
    action === POLICY_ACTIONS.PLACE_TRANSACTION_CREATE &&
    input.resourceType === 'place_transaction'
  ) {
    return authorizePlaceTransactionCreate(input);
  }

  if (
    action === POLICY_ACTIONS.PLACE_TRANSACTION_PRIVACY_UPDATE &&
    input.resourceType === 'place_transaction'
  ) {
    return authorizePlaceTransactionRead(input);
  }

  if (
    action === POLICY_ACTIONS.PLACE_INTERACTION_CLICK &&
    input.resourceType === 'place_transaction'
  ) {
    return authorizePlaceTransactionCreate(input);
  }

  if (
    action === POLICY_ACTIONS.PLACE_INTERACTION_STATS_READ &&
    input.resourceType === 'place_listing'
  ) {
    return authorizePlaceListingAdminWrite(input);
  }

  const placeLocationPrivacyActions: string[] = [
    POLICY_ACTIONS.PLACE_LOCATION_PRIVACY_READ,
    POLICY_ACTIONS.PLACE_LOCATION_PRIVACY_UPDATE,
  ];
  if (placeLocationPrivacyActions.includes(action) && input.resourceType === 'place') {
    return authorizePlaceLocationPrivacyOwner(input);
  }

  if (isSchedulingPolicyAction(action)) {
    return authorizeSchedulingPolicy(input, action);
  }

  if (isHRPolicyAction(action)) {
    return authorizeHRPolicy(input, action);
  }

  if (isWorkforceCommsPolicyAction(action)) {
    return authorizeWorkforceCommsPolicy(input, action);
  }

  if (isIdentitySelfPolicyAction(action)) {
    return authorizeIdentitySelf(input, action);
  }

  if (isConnectionPolicyAction(action)) {
    return authorizeConnectionPolicy(input, action);
  }

  if (isEntitlementPolicyAction(action)) {
    return authorizeEntitlementPolicy(input, action);
  }

  if (isBillingPolicyAction(action)) {
    return authorizeBillingPolicy(input, action);
  }

  return deny(input, 'POLICY_NOT_IMPLEMENTED');
}

const IDENTITY_SELF_ACTIONS = new Set<string>([
  POLICY_ACTIONS.USER_PROFILE_READ,
  POLICY_ACTIONS.USER_PROFILE_UPDATE,
  POLICY_ACTIONS.USER_PHOTO_WRITE,
  POLICY_ACTIONS.USER_PRIVACY_READ,
  POLICY_ACTIONS.USER_PRIVACY_UPDATE,
  POLICY_ACTIONS.USER_PREFERENCE_WRITE,
  POLICY_ACTIONS.SETTINGS_READ,
  POLICY_ACTIONS.SETTINGS_UPDATE,
]);

const CONNECTION_POLICY_ACTIONS = new Set<string>([
  POLICY_ACTIONS.CONNECTION_REQUEST,
  POLICY_ACTIONS.CONNECTION_UPDATE,
  POLICY_ACTIONS.CONNECTION_REMOVE,
]);

const ENTITLEMENT_POLICY_ACTIONS = new Set<string>([
  POLICY_ACTIONS.ENTITLEMENT_READ,
  POLICY_ACTIONS.ENTITLEMENT_WRITE,
]);

const BILLING_POLICY_ACTIONS = new Set<string>([
  POLICY_ACTIONS.BILLING_READ,
  POLICY_ACTIONS.BILLING_WRITE,
]);

function isIdentitySelfPolicyAction(action: string): boolean {
  return IDENTITY_SELF_ACTIONS.has(action);
}

function isConnectionPolicyAction(action: string): boolean {
  return CONNECTION_POLICY_ACTIONS.has(action);
}

function isEntitlementPolicyAction(action: string): boolean {
  return ENTITLEMENT_POLICY_ACTIONS.has(action);
}

function isBillingPolicyAction(action: string): boolean {
  return BILLING_POLICY_ACTIONS.has(action);
}

async function authorizeIdentitySelf(input: PolicyInput, action: string): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  if (input.resourceType !== 'user') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }
  const resourceId = input.resourceId;
  if (resourceId && resourceId !== userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  return { allow: true, matchedPolicy: `identity_self:${action}` };
}

async function authorizeConnectionPolicy(input: PolicyInput, action: string): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  if (action === POLICY_ACTIONS.CONNECTION_REQUEST) {
    if (input.resourceType !== 'user') {
      return deny(input, 'POLICY_NOT_IMPLEMENTED');
    }
    const targetId = input.resourceId;
    if (!targetId || typeof targetId !== 'string') {
      return deny(input, 'POLICY_NOT_IMPLEMENTED');
    }
    if (targetId === userId) {
      return deny(input, 'INSUFFICIENT_ROLE');
    }
    return { allow: true, matchedPolicy: 'connection_request_authenticated' };
  }

  if (input.resourceType !== 'relationship') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }
  const relationshipId = input.resourceId;
  if (!relationshipId || typeof relationshipId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const relationship = await prisma.relationship.findUnique({
    where: { id: relationshipId },
    select: { senderId: true, receiverId: true, status: true },
  });
  if (!relationship) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  if (action === POLICY_ACTIONS.CONNECTION_UPDATE) {
    if (relationship.receiverId !== userId) {
      return deny(input, 'INSUFFICIENT_ROLE');
    }
    if (relationship.status !== 'PENDING') {
      return deny(input, 'INSUFFICIENT_ROLE');
    }
    return { allow: true, matchedPolicy: 'connection_update_receiver' };
  }

  if (action === POLICY_ACTIONS.CONNECTION_REMOVE) {
    if (relationship.senderId !== userId && relationship.receiverId !== userId) {
      return deny(input, 'INSUFFICIENT_ROLE');
    }
    return { allow: true, matchedPolicy: 'connection_remove_participant' };
  }

  return deny(input, 'POLICY_NOT_IMPLEMENTED');
}

async function authorizeEntitlementPolicy(input: PolicyInput, action: string): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  if (action === POLICY_ACTIONS.ENTITLEMENT_WRITE) {
    const role = input.user?.role;
    if (role !== 'ADMIN') {
      return deny(input, 'INSUFFICIENT_ROLE', 'entitlement_write_admin_only');
    }
    return { allow: true, matchedPolicy: 'entitlement_write_platform_admin' };
  }

  if (action !== POLICY_ACTIONS.ENTITLEMENT_READ) {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const businessId = input.scope?.businessId;
  if (!businessId) {
    if (input.resourceType !== 'user') {
      return deny(input, 'POLICY_NOT_IMPLEMENTED');
    }
    const resourceId = input.resourceId;
    if (resourceId && resourceId !== userId) {
      return deny(input, 'INSUFFICIENT_ROLE');
    }
    return { allow: true, matchedPolicy: 'entitlement_read_self' };
  }

  if (input.resourceType !== 'business') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const membership = await prisma.businessMember.findFirst({
    where: { businessId, userId, isActive: true },
    select: { id: true, businessId: true },
  });
  if (!membership) {
    return deny(input, 'NOT_MEMBER', 'entitlement_read_business_member');
  }
  if (input.resourceId && input.resourceId !== businessId) {
    return deny(input, 'TENANT_MISMATCH', 'entitlement_read_business_member');
  }
  return { allow: true, matchedPolicy: 'entitlement_read_business_member' };
}

async function authorizeBillingPolicy(input: PolicyInput, action: string): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  if (input.resourceType !== 'subscription') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }
  const ownerUserId = input.resourceId;
  if (!ownerUserId || typeof ownerUserId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }
  if (ownerUserId !== userId) {
    return deny(input, 'INSUFFICIENT_ROLE', 'billing_subscription_owner_only');
  }
  if (action === POLICY_ACTIONS.BILLING_READ) {
    return { allow: true, matchedPolicy: 'billing_read_owner' };
  }
  if (action === POLICY_ACTIONS.BILLING_WRITE) {
    return { allow: true, matchedPolicy: 'billing_write_owner' };
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

const CALENDAR_WRITE_ROLES = ['OWNER', 'ADMIN', 'EDITOR'] as const;

async function authorizeCalendarMember(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const calendarId = input.resourceId;
  if (!calendarId || typeof calendarId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const calendar = await prisma.calendar.findFirst({
    where: {
      id: calendarId,
      OR: [
        { members: { some: { userId } } },
        { contextType: 'PERSONAL', contextId: userId },
      ],
    },
    select: { id: true },
  });

  if (!calendar) {
    return deny(input, 'NOT_MEMBER');
  }

  return { allow: true, matchedPolicy: 'calendar_member' };
}

async function authorizeCalendarOwner(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const calendarId = input.resourceId;
  if (!calendarId || typeof calendarId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const owner = await prisma.calendarMember.findFirst({
    where: { calendarId, userId, role: 'OWNER' },
    select: { id: true },
  });

  if (!owner) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  return { allow: true, matchedPolicy: 'calendar_owner' };
}

async function authorizeCalendarCreate(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }
  return { allow: true, matchedPolicy: 'calendar_authenticated_create' };
}

async function authorizeCalendarEventAccess(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const eventId = input.resourceId;
  if (!eventId || typeof eventId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, trashedAt: null },
    select: { calendarId: true },
  });

  if (!event) {
    return deny(input, 'NOT_MEMBER');
  }

  return authorizeCalendarMember({
    ...input,
    resourceType: 'calendar',
    resourceId: event.calendarId,
  });
}

async function authorizeCalendarEventCreate(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const calendarId =
    (typeof input.metadata?.calendarId === 'string' ? input.metadata.calendarId : undefined) ??
    input.resourceId;

  if (!calendarId || typeof calendarId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const member = await prisma.calendarMember.findFirst({
    where: {
      calendarId,
      userId,
      role: { in: [...CALENDAR_WRITE_ROLES] },
    },
    select: { id: true },
  });

  if (!member) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  return { allow: true, matchedPolicy: 'calendar_event_create_editor' };
}

async function authorizeCalendarAvailabilityRead(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }
  return { allow: true, matchedPolicy: 'calendar_availability_authenticated' };
}

async function authorizePlaceOwner(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const resourceId = input.resourceId;
  if (!resourceId || typeof resourceId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  if (resourceId === userId) {
    return { allow: true, matchedPolicy: 'place_owner_self' };
  }

  const place = await prisma.place.findFirst({
    where: {
      OR: [{ id: resourceId }, { userId: resourceId }],
    },
    select: { id: true, userId: true },
  });

  if (!place || place.userId !== userId) {
    return deny(input, 'NOT_OWNER');
  }

  return { allow: true, matchedPolicy: 'place_owner' };
}

async function authorizePlaceNodeOwner(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const resourceId = input.resourceId;
  if (!resourceId || typeof resourceId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  if (input.action === POLICY_ACTIONS.PLACE_NODE_CREATE) {
    return authorizePlaceOwner({
      ...input,
      resourceType: 'place',
      resourceId,
    });
  }

  const node = await prisma.placeNode.findUnique({
    where: { id: resourceId },
    select: { id: true, place: { select: { userId: true } } },
  });

  if (!node || node.place.userId !== userId) {
    return deny(input, 'NOT_OWNER');
  }

  return { allow: true, matchedPolicy: 'place_node_owner' };
}

async function authorizePlaceListingRead(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const resourceId = input.resourceId;
  if (!resourceId || typeof resourceId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  if (resourceId === 'explore' || resourceId === 'search') {
    return { allow: true, matchedPolicy: 'place_listing_public_catalog' };
  }

  const listing = await prisma.businessPlaceListing.findUnique({
    where: { businessId: resourceId },
    select: {
      isEnabled: true,
      isPublished: true,
      trashedAt: true,
      business: { select: { einVerified: true } },
    },
  });

  if (
    listing?.isEnabled &&
    listing.isPublished &&
    !listing.trashedAt &&
    listing.business.einVerified
  ) {
    return { allow: true, matchedPolicy: 'place_listing_public_read' };
  }

  const member = await prisma.businessMember.findFirst({
    where: {
      businessId: resourceId,
      userId,
      isActive: true,
      role: { in: ['ADMIN', 'MANAGER'] },
    },
    select: { id: true },
  });

  if (member) {
    return { allow: true, matchedPolicy: 'place_listing_admin_read' };
  }

  return deny(input, 'NOT_OWNER');
}

async function authorizePlaceDiscoveryRead(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const resourceId = input.resourceId;
  if (!resourceId || resourceId !== userId) {
    return deny(input, 'NOT_OWNER');
  }

  return { allow: true, matchedPolicy: 'place_discovery_owner' };
}

async function authorizePlaceLocationPrivacyOwner(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const resourceId = input.resourceId;
  if (!resourceId || resourceId !== userId) {
    return deny(input, 'NOT_OWNER');
  }

  return { allow: true, matchedPolicy: 'place_location_privacy_owner' };
}

async function authorizePlaceMeetingRead(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const meetingId = input.resourceId;
  if (!meetingId || typeof meetingId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  if (input.metadata?.scope === 'list' && meetingId === userId) {
    return { allow: true, matchedPolicy: 'place_meeting_list_authenticated' };
  }

  const meeting = await prisma.placeMeetingPlace.findUnique({
    where: { id: meetingId },
    select: {
      creatorId: true,
      invites: { select: { inviteeId: true } },
    },
  });

  if (!meeting) {
    return deny(input, 'NOT_OWNER');
  }

  const isParticipant =
    meeting.creatorId === userId ||
    meeting.invites.some((invite) => invite.inviteeId === userId);

  if (!isParticipant) {
    return deny(input, 'NOT_MEMBER');
  }

  return { allow: true, matchedPolicy: 'place_meeting_participant' };
}

async function authorizePlaceListingAdminWrite(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const businessId = input.resourceId;
  if (!businessId || typeof businessId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const member = await prisma.businessMember.findFirst({
    where: {
      businessId,
      userId,
      isActive: true,
      role: { in: ['ADMIN', 'MANAGER'] },
    },
    select: { id: true },
  });

  if (!member) {
    return deny(input, 'NOT_OWNER');
  }

  return { allow: true, matchedPolicy: 'place_listing_admin_write' };
}

async function authorizePlaceListingPublish(input: PolicyInput): Promise<PolicyDecision> {
  const admin = await authorizePlaceListingAdminWrite(input);
  if (!admin.allow) {
    return admin;
  }

  const businessId = input.resourceId;
  if (!businessId || typeof businessId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { einVerified: true },
  });

  if (!business?.einVerified) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  return { allow: true, matchedPolicy: 'place_listing_publish' };
}

async function authorizePlaceListingReport(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }
  return { allow: true, matchedPolicy: 'place_listing_report_authenticated' };
}

async function authorizePlaceMeetingCreate(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }
  return { allow: true, matchedPolicy: 'place_meeting_create_authenticated' };
}

async function authorizePlaceMeetingUpdate(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const meetingId = input.resourceId;
  if (!meetingId || typeof meetingId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const meeting = await prisma.placeMeetingPlace.findUnique({
    where: { id: meetingId },
    select: { creatorId: true },
  });

  if (!meeting || meeting.creatorId !== userId) {
    return deny(input, 'NOT_OWNER');
  }

  return { allow: true, matchedPolicy: 'place_meeting_creator' };
}

async function authorizePlaceMeetingCancel(input: PolicyInput): Promise<PolicyDecision> {
  return authorizePlaceMeetingUpdate(input);
}

async function authorizePlaceMeetingRsvp(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }

  const meetingId = input.resourceId;
  if (!meetingId || typeof meetingId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const invite = await prisma.placeMeetingInvite.findUnique({
    where: { meetingPlaceId_inviteeId: { meetingPlaceId: meetingId, inviteeId: userId } },
    select: { id: true },
  });

  if (!invite) {
    return deny(input, 'NOT_MEMBER');
  }

  return { allow: true, matchedPolicy: 'place_meeting_invitee' };
}

async function authorizePlaceMeetingLinkCalendar(input: PolicyInput): Promise<PolicyDecision> {
  return authorizePlaceMeetingRead(input);
}

async function authorizePlaceConnectionRequest(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }
  const targetUserId = input.resourceId;
  if (!targetUserId || targetUserId === userId) {
    return deny(input, 'NOT_OWNER');
  }
  return { allow: true, matchedPolicy: 'place_connection_request' };
}

async function authorizePlaceConnectionAccept(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }
  const relationship = await prisma.relationship.findUnique({
    where: { id: input.resourceId },
    select: { receiverId: true, status: true },
  });
  if (!relationship || relationship.receiverId !== userId) {
    return deny(input, 'NOT_OWNER');
  }
  if (relationship.status !== 'PENDING') {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  return { allow: true, matchedPolicy: 'place_connection_accept' };
}

async function authorizePlaceTransactionRead(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }
  const transaction = await prisma.placeTransaction.findUnique({
    where: { id: input.resourceId },
    select: { userId: true },
  });
  if (!transaction || transaction.userId !== userId) {
    return deny(input, 'NOT_OWNER');
  }
  return { allow: true, matchedPolicy: 'place_transaction_owner' };
}

async function authorizePlaceTransactionCreate(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'NOT_MEMBER');
  }
  return { allow: true, matchedPolicy: 'place_transaction_create' };
}

const SCHEDULING_ADMIN_ACTIONS = new Set<string>([
  POLICY_ACTIONS.SCHEDULING_SCHEDULE_WRITE,
  POLICY_ACTIONS.SCHEDULING_SCHEDULE_DELETE,
  POLICY_ACTIONS.SCHEDULING_SCHEDULE_PUBLISH,
  POLICY_ACTIONS.SCHEDULING_SHIFT_WRITE,
  POLICY_ACTIONS.SCHEDULING_SHIFT_ASSIGN,
  POLICY_ACTIONS.SCHEDULING_SHIFT_DELETE,
  POLICY_ACTIONS.SCHEDULING_SWAP_MANAGE,
  POLICY_ACTIONS.SCHEDULING_TEMPLATE_WRITE,
  POLICY_ACTIONS.SCHEDULING_STATION_WRITE,
]);

const SCHEDULING_MEMBER_ACTIONS = new Set<string>([
  POLICY_ACTIONS.SCHEDULING_SCHEDULE_READ,
  POLICY_ACTIONS.SCHEDULING_SHIFT_READ,
  POLICY_ACTIONS.SCHEDULING_SHIFT_CLAIM,
  POLICY_ACTIONS.SCHEDULING_SWAP_REQUEST,
]);

const HR_ADMIN_ACTIONS = new Set<string>([
  POLICY_ACTIONS.HR_EMPLOYEE_WRITE,
  POLICY_ACTIONS.HR_EMPLOYEE_DELETE,
  POLICY_ACTIONS.HR_EMPLOYEE_TERMINATE,
  POLICY_ACTIONS.HR_EMPLOYEE_IMPORT,
  POLICY_ACTIONS.HR_ONBOARDING_MANAGE,
  POLICY_ACTIONS.HR_ONBOARDING_CREATE,
  POLICY_ACTIONS.HR_ONBOARDING_UPDATE,
  POLICY_ACTIONS.HR_ATTENDANCE_MANAGE,
  POLICY_ACTIONS.HR_ATTENDANCE_EXCEPTION_CREATE,
  POLICY_ACTIONS.HR_SETTINGS_WRITE,
]);

const HR_MANAGER_ACTIONS = new Set<string>([
  POLICY_ACTIONS.HR_TIME_OFF_APPROVE,
  POLICY_ACTIONS.HR_TIME_OFF_DENY,
  POLICY_ACTIONS.HR_ONBOARDING_COMPLETE,
  POLICY_ACTIONS.HR_ATTENDANCE_EXCEPTION_UPDATE,
]);

const HR_MEMBER_ACTIONS = new Set<string>([
  POLICY_ACTIONS.HR_EMPLOYEE_READ,
  POLICY_ACTIONS.HR_TIME_OFF_READ,
  POLICY_ACTIONS.HR_TIME_OFF_REQUEST,
]);

const WORKFORCE_COMMS_ADMIN_ACTIONS = new Set<string>([
  POLICY_ACTIONS.WORKFORCE_COMMUNICATION_CREATE,
  POLICY_ACTIONS.WORKFORCE_COMMUNICATION_WRITE,
  POLICY_ACTIONS.WORKFORCE_COMMUNICATION_PUBLISH,
  POLICY_ACTIONS.WORKFORCE_COMMUNICATION_DELETE,
  POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE,
  POLICY_ACTIONS.WORKFORCE_REPORT_READ,
  POLICY_ACTIONS.WORKFORCE_BRIDGE_MANAGE,
]);

const WORKFORCE_COMMS_MEMBER_ACTIONS = new Set<string>([
  POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ,
  POLICY_ACTIONS.WORKFORCE_ACK_MANAGE,
]);

const ORGCHART_MANAGE_ACTIONS = new Set<string>([
  POLICY_ACTIONS.ORGCHART_TIER_WRITE,
  POLICY_ACTIONS.ORGCHART_DEPARTMENT_WRITE,
  POLICY_ACTIONS.ORGCHART_POSITION_WRITE,
  POLICY_ACTIONS.ORGCHART_STRUCTURE_INITIALIZE,
  POLICY_ACTIONS.ORGCHART_PERMISSION_SET_WRITE,
  POLICY_ACTIONS.ORGCHART_EMPLOYEE_ASSIGN,
  POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_WRITE,
]);

const ORGCHART_READ_ACTIONS = new Set<string>([
  POLICY_ACTIONS.ORGCHART_PERMISSION_READ,
  POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_READ,
]);

function isOrgChartPolicyAction(action: string): boolean {
  return ORGCHART_MANAGE_ACTIONS.has(action) || ORGCHART_READ_ACTIONS.has(action);
}

function isSchedulingPolicyAction(action: string): boolean {
  return (
    SCHEDULING_ADMIN_ACTIONS.has(action) ||
    SCHEDULING_MEMBER_ACTIONS.has(action)
  );
}

function isHRPolicyAction(action: string): boolean {
  return (
    HR_ADMIN_ACTIONS.has(action) ||
    HR_MANAGER_ACTIONS.has(action) ||
    HR_MEMBER_ACTIONS.has(action)
  );
}

function isWorkforceCommsPolicyAction(action: string): boolean {
  return (
    WORKFORCE_COMMS_ADMIN_ACTIONS.has(action) ||
    WORKFORCE_COMMS_MEMBER_ACTIONS.has(action)
  );
}

async function authorizeActiveBusinessMember(
  input: PolicyInput,
  businessId: string,
  matchedPolicy: string
): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const membership = await prisma.businessMember.findFirst({
    where: { businessId, userId, isActive: true },
    select: { role: true, canManage: true },
  });

  if (!membership) {
    return deny(input, 'NOT_MEMBER');
  }

  return { allow: true, matchedPolicy };
}

async function authorizeSchedulingPolicy(
  input: PolicyInput,
  action: string
): Promise<PolicyDecision> {
  const businessId = resolveBusinessIdFromInput(input);
  if (!businessId) {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  if (SCHEDULING_MEMBER_ACTIONS.has(action)) {
    return authorizeActiveBusinessMember(input, businessId, 'scheduling_active_member');
  }

  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const membership = await prisma.businessMember.findFirst({
    where: { businessId, userId, isActive: true },
    select: { role: true, canManage: true },
  });

  if (!membership) {
    return deny(input, 'NOT_MEMBER');
  }

  if (!memberCanManageBusinessModules(membership.role, membership.canManage)) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  return { allow: true, matchedPolicy: 'scheduling_admin' };
}

async function authorizeOrgChartPolicy(
  input: PolicyInput,
  action: string
): Promise<PolicyDecision> {
  const businessId = resolveBusinessIdFromInput(input);
  if (!businessId) {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  if (ORGCHART_READ_ACTIONS.has(action)) {
    return authorizeActiveBusinessMember(input, businessId, action.replace(':', '_'));
  }

  const matchedPolicy = action.replace(':', '_');
  return authorizeBusinessMemberManagement(input, 'manage', matchedPolicy);
}

async function authorizeHRPolicy(input: PolicyInput, action: string): Promise<PolicyDecision> {
  const businessId = resolveBusinessIdFromInput(input);
  if (!businessId) {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  if (HR_MEMBER_ACTIONS.has(action)) {
    return authorizeActiveBusinessMember(input, businessId, 'hr_active_member');
  }

  if (HR_MANAGER_ACTIONS.has(action)) {
    const userId = resolveUserId(input);
    if (!userId) {
      return deny(input, 'INSUFFICIENT_ROLE');
    }

    const membership = await prisma.businessMember.findFirst({
      where: { businessId, userId, isActive: true },
      select: { role: true, canManage: true },
    });

    if (!membership) {
      return deny(input, 'NOT_MEMBER');
    }

    if (
      membership.role === 'ADMIN' ||
      membership.role === 'MANAGER' ||
      membership.canManage
    ) {
      return { allow: true, matchedPolicy: 'hr_manager_or_admin' };
    }

    const employeePosition = await prisma.employeePosition.findFirst({
      where: { userId, businessId, active: true },
      include: {
        position: {
          include: { directReports: true },
        },
      },
    });

    if (employeePosition && employeePosition.position.directReports.length > 0) {
      return { allow: true, matchedPolicy: 'hr_direct_reports_manager' };
    }

    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const membership = await prisma.businessMember.findFirst({
    where: { businessId, userId, isActive: true },
    select: { role: true },
  });

  if (!membership) {
    return deny(input, 'NOT_MEMBER');
  }

  if (membership.role === 'ADMIN' || membership.role === 'MANAGER') {
    return { allow: true, matchedPolicy: 'hr_admin' };
  }

  return deny(input, 'INSUFFICIENT_ROLE');
}

async function authorizeWorkforceCommsPolicy(
  input: PolicyInput,
  action: string
): Promise<PolicyDecision> {
  const businessId = resolveBusinessIdFromInput(input);
  if (!businessId) {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  if (WORKFORCE_COMMS_MEMBER_ACTIONS.has(action)) {
    return authorizeActiveBusinessMember(input, businessId, 'workforce_comms_active_member');
  }

  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  const membership = await prisma.businessMember.findFirst({
    where: { businessId, userId, isActive: true },
    select: { role: true, canManage: true },
  });

  if (!membership) {
    return deny(input, 'NOT_MEMBER');
  }

  const isAdmin = membership.role === 'ADMIN';
  const isManagingManager = membership.role === 'MANAGER' && membership.canManage;

  if (!isAdmin && !isManagingManager) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }

  return { allow: true, matchedPolicy: 'workforce_comms_admin' };
}

export async function enforcePolicy(input: PolicyInput): Promise<PolicyDecision & { allow: true }> {
  const decision = await authorize(input);
  if (!decision.allow) {
    throw new PolicyDeniedError(decision);
  }
  return decision as PolicyDecision & { allow: true };
}
