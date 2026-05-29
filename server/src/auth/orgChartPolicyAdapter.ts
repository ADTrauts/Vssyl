import { BusinessRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';

export interface OrgChartMemberContext {
  userId: string;
  businessId: string;
  requiredRole?: 'member' | 'manage';
}

/**
 * Batch 3 bridge: org-chart membership checks feed Policy Engine scope while legacy middleware remains.
 * Returns true when user has active business membership (and manage role when required).
 */
export async function orgChartMemberHasAccess(ctx: OrgChartMemberContext): Promise<boolean> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId: ctx.businessId, userId: ctx.userId } },
    select: { isActive: true, role: true, canManage: true },
  });

  if (!member?.isActive) {
    return false;
  }

  if (ctx.requiredRole === 'manage') {
    return (
      member.role === BusinessRole.ADMIN ||
      member.role === BusinessRole.MANAGER ||
      member.canManage === true
    );
  }

  return true;
}

/** Prefer PE business member actions when implemented; falls back to org-chart membership. */
export async function authorizeBusinessMemberAction(
  userId: string,
  businessId: string,
  action: typeof POLICY_ACTIONS.BUSINESS_MEMBER_MANAGE
): Promise<{ allowed: boolean; via: 'policy_engine' | 'org_chart' }> {
  const decision = await authorize({
    userId,
    action,
    resourceType: 'business',
    resourceId: businessId,
    scope: { businessId },
  });

  if (decision.allow) {
    return { allowed: true, via: 'policy_engine' };
  }

  if (decision.reason !== 'POLICY_NOT_IMPLEMENTED') {
    return { allowed: false, via: 'policy_engine' };
  }

  const legacy = await orgChartMemberHasAccess({
    userId,
    businessId,
    requiredRole: 'manage',
  });
  return { allowed: legacy, via: 'org_chart' };
}
