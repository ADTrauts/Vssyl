import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyDenyReason } from './policyTypes';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'NOT_MEMBER',
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
];

export interface ModuleInstallPolicyDualParams {
  userId: string;
  moduleId: string;
  installScope: 'personal' | 'business';
  businessId?: string;
}

export interface ModuleInstallPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement: call after legacy install checks pass.
 * Blocks on policy security denies; logs warning when policy disagrees with legacy allow.
 */
export async function evaluateModuleInstallPolicyDual(
  params: ModuleInstallPolicyDualParams
): Promise<ModuleInstallPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: POLICY_ACTIONS.MODULE_INSTALL,
    resourceType: 'module',
    resourceId: params.moduleId,
    scope: params.businessId ? { businessId: params.businessId } : undefined,
    metadata: { installScope: params.installScope },
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Module install policy denied (dual enforcement)', {
    operation: 'policy_legacy_dual_enforce',
    userId: params.userId,
    moduleId: params.moduleId,
    installScope: params.installScope,
    businessId: params.businessId,
    reason,
    matchedPolicy: decision.matchedPolicy,
    blockRequest: isSecurityDeny,
  });

  if (isSecurityDeny) {
    return { blocked: true, reason };
  }

  return { blocked: false, reason };
}
