import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyDenyReason } from './policyTypes';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'NOT_MEMBER',
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
];

export interface ModuleUninstallPolicyDualParams {
  userId: string;
  moduleId: string;
  uninstallScope: 'personal' | 'business';
  businessId?: string;
}

export interface ModuleUninstallPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement: call after legacy uninstall checks pass.
 * Blocks on policy security denies; logs warning when policy disagrees with legacy allow.
 */
export async function evaluateModuleUninstallPolicyDual(
  params: ModuleUninstallPolicyDualParams
): Promise<ModuleUninstallPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: POLICY_ACTIONS.MODULE_UNINSTALL,
    resourceType: 'module',
    resourceId: params.moduleId,
    scope: params.businessId ? { businessId: params.businessId } : undefined,
    metadata: { uninstallScope: params.uninstallScope },
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Module uninstall policy denied (dual enforcement)', {
    operation: 'policy_legacy_dual_enforce',
    userId: params.userId,
    moduleId: params.moduleId,
    uninstallScope: params.uninstallScope,
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
