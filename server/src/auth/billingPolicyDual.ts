import { authorize, PolicyDeniedError } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';

export async function assertBillingReadPolicy(params: {
  userId: string;
  subscriptionUserId: string;
  businessId?: string | null;
}): Promise<void> {
  const decision = await authorize({
    userId: params.userId,
    action: POLICY_ACTIONS.BILLING_READ,
    resourceType: 'subscription',
    resourceId: params.subscriptionUserId,
    scope: {
      userId: params.userId,
      businessId: params.businessId ?? undefined,
    },
  });
  if (!decision.allow) {
    throw new PolicyDeniedError(decision);
  }
}

export async function assertBillingWritePolicy(params: {
  userId: string;
  subscriptionUserId: string;
  businessId?: string | null;
}): Promise<void> {
  const decision = await authorize({
    userId: params.userId,
    action: POLICY_ACTIONS.BILLING_WRITE,
    resourceType: 'subscription',
    resourceId: params.subscriptionUserId,
    scope: {
      userId: params.userId,
      businessId: params.businessId ?? undefined,
    },
  });
  if (!decision.allow) {
    throw new PolicyDeniedError(decision);
  }
}
