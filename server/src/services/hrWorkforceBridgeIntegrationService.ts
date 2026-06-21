/**
 * HR → Workforce Communications domain bridge (BO-1A).
 * HR remains source of truth; WC receives bridge drafts via domain integration contract.
 */

import {
  onHrAnnouncementBroadcastRequested,
  onHrPolicyBroadcastRequested,
} from './workforceBridgeService.js';

export async function requestHrPolicyWorkforceBroadcast(params: {
  businessId: string;
  actorUserId: string;
  policyId: string;
  policyName: string;
  policySummary?: string;
  requiresAck?: boolean;
}) {
  return onHrPolicyBroadcastRequested(params);
}

export async function requestHrAnnouncementWorkforceBroadcast(params: {
  businessId: string;
  actorUserId: string;
  announcementId: string;
  title: string;
  body: string;
  summary?: string;
  audienceType?: string;
  audienceSpec?: Record<string, unknown>;
  requiresAck?: boolean;
}) {
  return onHrAnnouncementBroadcastRequested(params);
}
