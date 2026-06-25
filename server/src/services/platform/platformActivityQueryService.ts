/**
 * Platform Activity Query Layer — canonical read path for module_activity_event log rows.
 * PK-W3-IMP-1 (ACT-R1 P0)
 */
import { prisma } from '../../lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  MODULE_ACTIVITY_OPERATION,
  type ModuleActivityEnvelope,
  type PlatformActivityRecord,
} from './platformActivityTypes';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const FETCH_BUFFER_MULTIPLIER = 5;

function clampLimit(limit?: number): number {
  const n = limit ?? DEFAULT_LIMIT;
  return Math.min(Math.max(1, n), MAX_LIMIT);
}

export function parseModuleActivityLogRow(log: {
  id: string;
  userId: string | null;
  timestamp: Date;
  module: string | null;
  metadata: Prisma.JsonValue;
}): PlatformActivityRecord | null {
  const envelope = log.metadata as ModuleActivityEnvelope | null;
  if (!envelope?.action || !envelope.target?.type || !envelope.target.id) {
    return null;
  }

  const context = envelope.context ?? {};
  const moduleId =
    typeof context.moduleId === 'string'
      ? context.moduleId
      : typeof log.module === 'string'
        ? log.module
        : 'system';

  const ts = envelope.timestamp ? new Date(envelope.timestamp) : log.timestamp;
  if (Number.isNaN(ts.getTime())) {
    return null;
  }

  const visibilityScope =
    typeof envelope.visibility?.scope === 'string' ? envelope.visibility.scope : undefined;

  return {
    logId: log.id,
    eventId: envelope.eventId ?? log.id,
    timestamp: ts,
    moduleId,
    action: envelope.action,
    targetType: envelope.target.type,
    targetId: envelope.target.id,
    dashboardId: typeof context.dashboardId === 'string' ? context.dashboardId : undefined,
    businessId: typeof context.businessId === 'string' ? context.businessId : undefined,
    householdId: typeof context.householdId === 'string' ? context.householdId : undefined,
    visibilityScope,
    metadata: (envelope.metadata ?? {}) as Record<string, unknown>,
    actorUserId: envelope.actor?.userId ?? log.userId ?? '',
  };
}

function matchesDashboardScope(
  record: PlatformActivityRecord,
  dashboardId: string | undefined
): boolean {
  if (!dashboardId) return true;
  return record.dashboardId === dashboardId;
}

function matchesBusinessScope(
  record: PlatformActivityRecord,
  businessId: string | undefined
): boolean {
  if (!businessId) return true;
  return record.businessId === businessId;
}

function matchesHouseholdScope(
  record: PlatformActivityRecord,
  householdId: string | undefined
): boolean {
  if (!householdId) return true;
  return record.householdId === householdId;
}

function sortRecordsNewestFirst(records: PlatformActivityRecord[]): PlatformActivityRecord[] {
  return [...records].sort((a, b) => {
    const delta = b.timestamp.getTime() - a.timestamp.getTime();
    if (delta !== 0) return delta;
    return b.logId.localeCompare(a.logId);
  });
}

function applyScopeFilters(
  records: PlatformActivityRecord[],
  scope: {
    dashboardId?: string;
    businessId?: string;
    householdId?: string;
  }
): PlatformActivityRecord[] {
  return records.filter(
    (r) =>
      matchesDashboardScope(r, scope.dashboardId) &&
      matchesBusinessScope(r, scope.businessId) &&
      matchesHouseholdScope(r, scope.householdId)
  );
}

function matchesTimeRange(
  record: PlatformActivityRecord,
  since?: Date,
  until?: Date
): boolean {
  const t = record.timestamp.getTime();
  if (since && t < since.getTime()) return false;
  if (until && t > until.getTime()) return false;
  return true;
}

async function fetchNormalizedLogs(params: {
  userId: string;
  moduleId?: string;
  moduleIds?: string[];
  since?: Date;
  until?: Date;
  take: number;
}): Promise<PlatformActivityRecord[]> {
  const where: Prisma.LogWhereInput = {
    userId: params.userId,
    operation: MODULE_ACTIVITY_OPERATION,
  };

  if (params.moduleId) {
    where.module = params.moduleId;
  } else if (params.moduleIds?.length) {
    where.module = { in: params.moduleIds };
  }

  if (params.since || params.until) {
    where.timestamp = {
      ...(params.since ? { gte: params.since } : {}),
      ...(params.until ? { lte: params.until } : {}),
    };
  }

  const logs = await prisma.log.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: params.take,
    select: {
      id: true,
      userId: true,
      timestamp: true,
      module: true,
      metadata: true,
    },
  });

  const records: PlatformActivityRecord[] = [];
  for (const log of logs) {
    const parsed = parseModuleActivityLogRow(log);
    if (parsed) {
      records.push(parsed);
    }
  }
  return records;
}

/** Federated activity feed for a user (optional tenant scope). */
export async function getFeedForUser(params: {
  userId: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  limit?: number;
}): Promise<PlatformActivityRecord[]> {
  const limit = clampLimit(params.limit);
  const fetchTake = Math.min(limit * FETCH_BUFFER_MULTIPLIER, 500);

  const records = await fetchNormalizedLogs({
    userId: params.userId,
    take: fetchTake,
  });

  return sortRecordsNewestFirst(
    applyScopeFilters(records, {
      dashboardId: params.dashboardId,
      businessId: params.businessId,
      householdId: params.householdId,
    })
  ).slice(0, limit);
}

/**
 * Module-scoped activity for one or more actor user ids (e.g. Place social feed).
 * Does not apply dashboard/business/household filters — callers enforce visibility.
 */
export async function getModuleActivityForUserIds(params: {
  userIds: string[];
  moduleId: string;
  limit?: number;
  since?: Date;
  until?: Date;
}): Promise<PlatformActivityRecord[]> {
  const uniqueIds = [...new Set(params.userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const limit = clampLimit(params.limit);
  const fetchTake = Math.min(limit * FETCH_BUFFER_MULTIPLIER, 500);

  const where: Prisma.LogWhereInput = {
    operation: MODULE_ACTIVITY_OPERATION,
    module: params.moduleId,
    userId: { in: uniqueIds },
  };

  if (params.since || params.until) {
    where.timestamp = {
      ...(params.since ? { gte: params.since } : {}),
      ...(params.until ? { lte: params.until } : {}),
    };
  }

  const logs = await prisma.log.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: fetchTake,
    select: {
      id: true,
      userId: true,
      timestamp: true,
      module: true,
      metadata: true,
    },
  });

  const records: PlatformActivityRecord[] = [];
  for (const log of logs) {
    const parsed = parseModuleActivityLogRow(log);
    if (parsed) records.push(parsed);
  }

  return sortRecordsNewestFirst(records).slice(0, limit);
}

/** Recent normalized activity for analytics / AI context (time-bounded). */
export async function getRecentActivity(params: {
  userId: string;
  since: Date;
  until?: Date;
  limit?: number;
  moduleId?: string;
}): Promise<PlatformActivityRecord[]> {
  const limit = clampLimit(params.limit ?? 50);
  const records = await fetchNormalizedLogs({
    userId: params.userId,
    moduleId: params.moduleId,
    since: params.since,
    until: params.until,
    take: limit,
  });

  return sortRecordsNewestFirst(
    records.filter((r) => matchesTimeRange(r, params.since, params.until))
  ).slice(0, limit);
}

/** Activity history for a specific entity (module + target type/id). */
export async function getActivityForEntity(params: {
  userId: string;
  moduleId: string;
  targetType: string;
  targetId: string;
  limit?: number;
}): Promise<PlatformActivityRecord[]> {
  const limit = clampLimit(params.limit ?? 100);
  const records = await fetchNormalizedLogs({
    userId: params.userId,
    moduleId: params.moduleId,
    take: Math.min(limit * FETCH_BUFFER_MULTIPLIER, 500),
  });

  return records
    .filter(
      (r) =>
        r.targetType === params.targetType &&
        r.targetId === params.targetId
    )
    .slice(0, limit);
}

/** Module-scoped activity in a time range (analytics module view). */
export async function getModuleActivity(params: {
  userId: string;
  moduleId: string;
  since: Date;
  until?: Date;
  limit?: number;
}): Promise<PlatformActivityRecord[]> {
  return getRecentActivity({
    userId: params.userId,
    since: params.since,
    until: params.until,
    limit: params.limit ?? MAX_LIMIT,
    moduleId: params.moduleId,
  });
}

/** Aggregate counts by module for analytics usage stats. */
export async function getActivitySummary(params: {
  userId: string;
  since: Date;
  until?: Date;
  moduleIds?: string[];
}): Promise<{ totalEvents: number; byModule: Record<string, number> }> {
  const records = await fetchNormalizedLogs({
    userId: params.userId,
    moduleIds: params.moduleIds,
    since: params.since,
    until: params.until,
    take: 500,
  });

  const byModule: Record<string, number> = {};
  for (const r of records) {
    byModule[r.moduleId] = (byModule[r.moduleId] ?? 0) + 1;
  }

  return {
    totalEvents: records.length,
    byModule,
  };
}

/** Alias for time-ordered activity list (analytics export / timelines). */
export async function getActivityTimeline(params: {
  userId: string;
  since: Date;
  until?: Date;
  limit?: number;
  moduleId?: string;
}): Promise<PlatformActivityRecord[]> {
  return getRecentActivity(params);
}

/** Count module activity events (workforce / metrics pattern). */
export async function countModuleActivity(params: {
  userId?: string;
  businessId?: string;
  moduleId: string;
  since?: Date;
  until?: Date;
  action?: string;
  targetType?: string;
}): Promise<number> {
  const where: Prisma.LogWhereInput = {
    operation: MODULE_ACTIVITY_OPERATION,
    module: params.moduleId,
  };
  if (params.userId) where.userId = params.userId;
  if (params.businessId) where.businessId = params.businessId;
  if (params.since || params.until) {
    where.timestamp = {
      ...(params.since ? { gte: params.since } : {}),
      ...(params.until ? { lte: params.until } : {}),
    };
  }

  if (params.action && params.targetType) {
    const logs = await prisma.log.findMany({
      where,
      select: { metadata: true },
      take: 500,
    });
    return logs.filter((log) => {
      const parsed = parseModuleActivityLogRow({
        id: 'count',
        userId: params.userId ?? null,
        timestamp: new Date(),
        module: params.moduleId,
        metadata: log.metadata,
      });
      if (!parsed) return false;
      return (
        parsed.action === params.action &&
        parsed.targetType === params.targetType
      );
    }).length;
  }

  return prisma.log.count({ where });
}
