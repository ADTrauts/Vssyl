import { authorize, PolicyDeniedError } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyAction } from './policyActions';

export async function assertEntitlementReadPolicy(params: {
  userId: string;
  businessId?: string;
}): Promise<void> {
  const decision = await authorize({
    userId: params.userId,
    action: POLICY_ACTIONS.ENTITLEMENT_READ,
    resourceType: params.businessId ? 'business' : 'user',
    resourceId: params.businessId ?? params.userId,
    scope: {
      userId: params.userId,
      businessId: params.businessId,
    },
  });
  if (!decision.allow) {
    throw new PolicyDeniedError(decision);
  }
}

export async function assertEntitlementWritePolicy(params: {
  userId: string;
  userRole: string;
  userEmail: string;
  businessId?: string;
}): Promise<void> {
  const decision = await authorize({
    userId: params.userId,
    user: { id: params.userId, role: params.userRole, email: params.userEmail },
    action: POLICY_ACTIONS.ENTITLEMENT_WRITE,
    resourceType: params.businessId ? 'business' : 'subscription',
    resourceId: params.businessId ?? params.userId,
    scope: {
      userId: params.userId,
      businessId: params.businessId,
    },
  });
  if (!decision.allow) {
    throw new PolicyDeniedError(decision);
  }
}

export async function evaluateEntitlementReadPolicyDual(params: {
  userId: string;
  businessId?: string;
}): Promise<{ blocked: boolean; reason?: string }> {
  try {
    await assertEntitlementReadPolicy(params);
    return { blocked: false };
  } catch (error: unknown) {
    if (error instanceof PolicyDeniedError) {
      const reason =
        typeof error.decision.reason === 'string' ? error.decision.reason : 'Policy denied';
      return { blocked: true, reason };
    }
    throw error;
  }
}

export function entitlementReadAction(): PolicyAction {
  return POLICY_ACTIONS.ENTITLEMENT_READ;
}

export function entitlementWriteAction(): PolicyAction {
  return POLICY_ACTIONS.ENTITLEMENT_WRITE;
}
