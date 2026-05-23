import {
  BusinessRole,
  VLinkMemberRole,
  VLinkScope,
  type VLink,
  type VLinkMember,
} from '@prisma/client';
import { prisma } from '../lib/prisma';

export type VLinkRoleAction =
  | 'read'
  | 'update_metadata'
  | 'link_entity'
  | 'invite_member'
  | 'archive'
  | 'delete'
  | 'restore'
  | 'transfer_ownership'
  | 'review_suggestion';

const ROLE_PERMISSIONS: Record<VLinkMemberRole, Set<VLinkRoleAction>> = {
  OWNER: new Set([
    'read',
    'update_metadata',
    'link_entity',
    'invite_member',
    'archive',
    'delete',
    'restore',
    'transfer_ownership',
    'review_suggestion',
  ]),
  EDITOR: new Set(['read', 'update_metadata', 'link_entity', 'invite_member', 'review_suggestion']),
  VIEWER: new Set(['read']),
};

export async function getVLinkMembership(
  vlinkId: string,
  userId: string
): Promise<VLinkMember | null> {
  return prisma.vLinkMember.findUnique({
    where: { vlinkId_userId: { vlinkId, userId } },
  });
}

export function memberCanPerform(role: VLinkMemberRole, action: VLinkRoleAction): boolean {
  return ROLE_PERMISSIONS[role].has(action);
}

export async function isBusinessAdminForVLink(userId: string, vlink: VLink): Promise<boolean> {
  if (vlink.scope !== VLinkScope.BUSINESS || !vlink.businessId) {
    return false;
  }
  const member = await prisma.businessMember.findFirst({
    where: {
      userId,
      businessId: vlink.businessId,
      isActive: true,
      role: { in: [BusinessRole.ADMIN, BusinessRole.MANAGER] },
    },
    select: { id: true },
  });
  return Boolean(member);
}

export async function assertVLinkAccess(params: {
  vlink: VLink;
  userId: string;
  action: VLinkRoleAction;
}): Promise<{ allowed: true; membership: VLinkMember | null; isBusinessAdmin: boolean } | { allowed: false }> {
  const membership = await getVLinkMembership(params.vlink.id, params.userId);
  if (membership && memberCanPerform(membership.role, params.action)) {
    return { allowed: true, membership, isBusinessAdmin: false };
  }

  const isBusinessAdmin = await isBusinessAdminForVLink(params.userId, params.vlink);
  if (
    isBusinessAdmin &&
    (params.action === 'archive' ||
      params.action === 'delete' ||
      params.action === 'restore' ||
      params.action === 'transfer_ownership' ||
      params.action === 'read')
  ) {
    return { allowed: true, membership, isBusinessAdmin: true };
  }

  if (params.action === 'read' && membership) {
    return { allowed: true, membership, isBusinessAdmin: false };
  }

  return { allowed: false };
}

export async function assertVLinkMember(params: {
  vlinkId: string;
  userId: string;
}): Promise<VLinkMember | null> {
  return getVLinkMembership(params.vlinkId, params.userId);
}

export function validateScopeFields(scope: VLinkScope, businessId?: string | null, householdId?: string | null): string | null {
  if (scope === VLinkScope.BUSINESS && !businessId) {
    return 'businessId is required for BUSINESS scope';
  }
  if (scope === VLinkScope.HOUSEHOLD && !householdId) {
    return 'householdId is required for HOUSEHOLD scope';
  }
  if (scope === VLinkScope.PERSONAL && (businessId || householdId)) {
    return 'PERSONAL scope cannot include businessId or householdId';
  }
  return null;
}
