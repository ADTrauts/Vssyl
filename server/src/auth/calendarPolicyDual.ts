import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyAction } from './policyActions';
import type { PolicyDenyReason, PolicyResourceType } from './policyTypes';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
  'NOT_MEMBER',
];

export type CalendarPolicyAction =
  | typeof POLICY_ACTIONS.CALENDAR_READ
  | typeof POLICY_ACTIONS.CALENDAR_CREATE
  | typeof POLICY_ACTIONS.CALENDAR_UPDATE
  | typeof POLICY_ACTIONS.CALENDAR_DELETE
  | typeof POLICY_ACTIONS.CALENDAR_EVENT_READ
  | typeof POLICY_ACTIONS.CALENDAR_EVENT_CREATE
  | typeof POLICY_ACTIONS.CALENDAR_EVENT_UPDATE
  | typeof POLICY_ACTIONS.CALENDAR_EVENT_DELETE
  | typeof POLICY_ACTIONS.CALENDAR_EVENT_RSVP
  | typeof POLICY_ACTIONS.CALENDAR_AVAILABILITY_READ;

export interface CalendarPolicyDualParams {
  userId: string;
  action: CalendarPolicyAction;
  resourceType: Extract<PolicyResourceType, 'calendar' | 'calendar_event'>;
  resourceId: string;
  scope?: { dashboardId?: string };
  metadata?: Record<string, unknown>;
}

export interface CalendarPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement for Calendar paths. Call after legacy membership checks pass on mutations.
 * Read paths use calendarPassesReadPolicy / eventPassesReadPolicy helpers in visibility service.
 */
export async function evaluateCalendarPolicyDual(
  params: CalendarPolicyDualParams
): Promise<CalendarPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    scope: params.scope,
    metadata: params.metadata,
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Calendar policy denied (dual enforcement)', {
    operation: 'policy_legacy_dual_enforce',
    userId: params.userId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    reason,
    matchedPolicy: decision.matchedPolicy,
    blockRequest: isSecurityDeny,
  });

  if (isSecurityDeny) {
    return { blocked: true, reason };
  }

  return { blocked: false, reason };
}
