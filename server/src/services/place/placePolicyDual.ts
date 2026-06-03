import { logger } from '../../lib/logger';
import { authorize } from '../../auth/policyEngine';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import type { PolicyAction } from '../../auth/policyActions';
import type { PolicyDenyReason, PolicyResourceType } from '../../auth/policyTypes';
import { PlaceServiceError } from './placeErrors';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
  'NOT_MEMBER',
];

export type PlacePolicyAction =
  | typeof POLICY_ACTIONS.PLACE_READ
  | typeof POLICY_ACTIONS.PLACE_WRITE
  | typeof POLICY_ACTIONS.PLACE_SETTINGS_UPDATE
  | typeof POLICY_ACTIONS.PLACE_SETUP_COMPLETE
  | typeof POLICY_ACTIONS.PLACE_INTERESTS_UPDATE
  | typeof POLICY_ACTIONS.PLACE_FOLLOW_VISIBILITY_UPDATE
  | typeof POLICY_ACTIONS.PLACE_NODE_CREATE
  | typeof POLICY_ACTIONS.PLACE_NODE_UPDATE
  | typeof POLICY_ACTIONS.PLACE_NODE_DELETE
  | typeof POLICY_ACTIONS.PLACE_NODE_READ
  | typeof POLICY_ACTIONS.PLACE_LISTING_READ
  | typeof POLICY_ACTIONS.PLACE_LISTING_WRITE
  | typeof POLICY_ACTIONS.PLACE_LISTING_PUBLISH
  | typeof POLICY_ACTIONS.PLACE_LISTING_UNPUBLISH
  | typeof POLICY_ACTIONS.PLACE_LISTING_IMAGE_UPDATE
  | typeof POLICY_ACTIONS.PLACE_LISTING_INTERACTION_LINK_WRITE
  | typeof POLICY_ACTIONS.PLACE_LISTING_REPORT
  | typeof POLICY_ACTIONS.PLACE_DISCOVERY_READ
  | typeof POLICY_ACTIONS.PLACE_MEETING_READ
  | typeof POLICY_ACTIONS.PLACE_MEETING_CREATE
  | typeof POLICY_ACTIONS.PLACE_MEETING_UPDATE
  | typeof POLICY_ACTIONS.PLACE_MEETING_CANCEL
  | typeof POLICY_ACTIONS.PLACE_MEETING_RSVP
  | typeof POLICY_ACTIONS.PLACE_MEETING_LINK_CALENDAR;

export interface PlacePolicyDualParams {
  userId: string;
  action: PlacePolicyAction;
  resourceType: Extract<
    PolicyResourceType,
    'place' | 'place_node' | 'place_listing' | 'place_meeting'
  >;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

export interface PlacePolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement for Place graph mutations. Security denies block;
 * POLICY_NOT_IMPLEMENTED does not block (legacy permission remains authoritative).
 */
export async function evaluatePlacePolicyDual(
  params: PlacePolicyDualParams
): Promise<PlacePolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    metadata: params.metadata,
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Place policy denied (dual enforcement)', {
    operation: 'policy_place_dual_enforce',
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

export async function assertPlacePolicyAllowed(params: PlacePolicyDualParams): Promise<void> {
  const result = await evaluatePlacePolicyDual(params);
  if (result.blocked) {
    throw new PlaceServiceError('Not authorized', 'forbidden', 403);
  }
}

/** Read helper when policy engine implements place:place.read. */
export async function placePolicyAllowsRead(
  userId: string,
  resourceId: string
): Promise<boolean> {
  const result = await evaluatePlacePolicyDual({
    userId,
    action: POLICY_ACTIONS.PLACE_READ,
    resourceType: 'place',
    resourceId,
  });
  return !result.blocked;
}
