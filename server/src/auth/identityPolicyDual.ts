import { authorize, PolicyDeniedError } from './policyEngine';
import type { PolicyAction } from './policyActions';

export async function assertIdentitySelfPolicy(params: {
  userId: string;
  action: PolicyAction;
  resourceId?: string;
}): Promise<void> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action,
    resourceType: 'user',
    resourceId: params.resourceId ?? params.userId,
    scope: { userId: params.userId },
  });
  if (!decision.allow) {
    throw new PolicyDeniedError(decision);
  }
}

export async function evaluateIdentitySelfPolicyDual(params: {
  userId: string;
  action: PolicyAction;
  resourceId?: string;
}): Promise<{ blocked: boolean; reason?: string }> {
  try {
    await assertIdentitySelfPolicy(params);
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
