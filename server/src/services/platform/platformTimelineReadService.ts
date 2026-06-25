/**
 * Platform Timeline Read Service — unified read facade for Kernel activity (ACT-R1 Wave 1).
 *
 * All platform consumers that need user-visible activity timelines should import from here
 * rather than querying legacy module tables or ad hoc Log queries.
 */
export type {
  ActivityVisibilityScope,
  ModuleActivityEnvelope,
  PlatformActivityRecord,
} from './platformActivityTypes';
export { MODULE_ACTIVITY_OPERATION } from './platformActivityTypes';

export {
  countModuleActivity,
  getActivityForEntity,
  getActivitySummary,
  getActivityTimeline,
  getFeedForUser,
  getModuleActivity,
  getModuleActivityForUserIds,
  getRecentActivity,
  parseModuleActivityLogRow,
} from './platformActivityQueryService';

export {
  analyticsDescriptionFromRecord,
  feedDescriptionFromRecord,
  toActivityFeedItem,
  type ActivityFeedItem,
} from './platformActivityFeedMapper';

export {
  toAiContextActivityRow,
  toAiRecentActivityDebugRow,
  type AiContextActivityRow,
  type AiRecentActivityDebugRow,
} from './platformActivityContextMapper';

export {
  mapDriveLegacyActionType,
  toDriveLegacyActivityRow,
  toNormalizedModuleActivityLogRow,
  type NormalizedModuleActivityLogRow,
} from './platformActivityDriveMapper';

import { getFeedForUser } from './platformActivityQueryService';
import type { PlatformActivityRecord } from './platformActivityTypes';

/** Canonical federated timeline for dashboard / AI / analytics consumers. */
export async function getUnifiedTimelineForUser(params: {
  userId: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  limit?: number;
}): Promise<PlatformActivityRecord[]> {
  return getFeedForUser(params);
}
