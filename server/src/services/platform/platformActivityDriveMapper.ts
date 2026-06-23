import type { PlatformActivityRecord } from './platformActivityTypes';

/** Log row shape returned by Drive activity APIs (metadata holds full envelope). */
export interface NormalizedModuleActivityLogRow {
  id: string;
  timestamp: Date;
  module?: string;
  metadata: Record<string, unknown>;
}

export function toNormalizedModuleActivityLogRow(
  record: PlatformActivityRecord
): NormalizedModuleActivityLogRow {
  return {
    id: record.logId,
    timestamp: record.timestamp,
    module: record.moduleId,
    metadata: {
      eventId: record.eventId,
      action: record.action,
      target: { type: record.targetType, id: record.targetId },
      context: {
        dashboardId: record.dashboardId,
        businessId: record.businessId,
        householdId: record.householdId,
        moduleId: record.moduleId,
      },
      actor: { userId: record.actorUserId },
      ...record.metadata,
    },
  };
}

const DRIVE_ACTION_TYPES = new Set([
  'create',
  'edit',
  'delete',
  'share',
  'download',
]);

/** Map normalized drive action to legacy Activity.type for Drive recent UI. */
export function mapDriveLegacyActionType(
  action: string
): 'create' | 'edit' | 'delete' | 'share' | 'download' {
  const a = action.toLowerCase();
  if (a.includes('download')) return 'download';
  if (a.includes('share')) return 'share';
  if (a.includes('delete') || a.includes('trash')) return 'delete';
  if (a.includes('rename') || a.includes('edit') || a.includes('move')) return 'edit';
  if (a.includes('upload') || a.includes('create')) return 'create';
  if (DRIVE_ACTION_TYPES.has(a as 'create')) {
    return a as 'create' | 'edit' | 'delete' | 'share' | 'download';
  }
  return 'edit';
}

export interface DriveLegacyActivityRow {
  id: string;
  type: 'create' | 'edit' | 'delete' | 'share' | 'download';
  timestamp: Date;
  details?: Record<string, unknown>;
  user: { id: string; name: string; email: string };
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    path: string;
    url: string;
    starred: boolean;
    folderId?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export function toDriveLegacyActivityRow(params: {
  record: PlatformActivityRecord;
  user: { id: string; name: string | null; email: string };
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    path: string | null;
    url: string;
    starred: boolean;
    folderId: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}): DriveLegacyActivityRow {
  const { record, user, file } = params;
  return {
    id: record.logId,
    type: mapDriveLegacyActionType(record.action),
    timestamp: record.timestamp,
    details: record.metadata,
    user: {
      id: user.id,
      name: user.name ?? '',
      email: user.email,
    },
    file: {
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path ?? '',
      url: file.url,
      starred: file.starred,
      folderId: file.folderId ?? undefined,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    },
  };
}
