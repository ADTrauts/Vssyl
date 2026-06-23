import type { PlatformActivityRecord } from './platformActivityTypes';

export interface ActivityFeedItem {
  id: string;
  type: string;
  action: string;
  description: string;
  module: string;
  createdAt: string;
  user?: { name?: string; email?: string };
  metadata?: Record<string, unknown>;
}

function capitalize(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function humanizeAction(action: string): string {
  return action.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function feedDescriptionFromRecord(record: PlatformActivityRecord): string {
  const meta = record.metadata;
  const name =
    meta.fileName ??
    meta.folderName ??
    meta.title ??
    meta.taskTitle ??
    meta.conversationName;

  if (typeof name === 'string' && name.length > 0) {
    return `${humanizeAction(record.action)} ${name}`;
  }

  if (record.action === 'message') {
    return `Message in ${String(meta.conversationName ?? 'conversation')}`;
  }

  if (record.action === 'complete') {
    return `Completed ${record.targetType}`;
  }

  return `${humanizeAction(record.action)} ${record.targetType}`;
}

export function toActivityFeedItem(
  record: PlatformActivityRecord,
  user?: { name?: string | null; email?: string | null }
): ActivityFeedItem {
  return {
    id: record.eventId,
    type: record.targetType,
    action: record.action,
    description: feedDescriptionFromRecord(record),
    module: record.moduleId,
    createdAt: record.timestamp.toISOString(),
    user: user
      ? {
          name: user.name ?? undefined,
          email: user.email ?? undefined,
        }
      : undefined,
    metadata: {
      source: 'normalized_event',
      targetId: record.targetId,
      logId: record.logId,
      dashboardId: record.dashboardId,
      ...record.metadata,
    },
  };
}

export function analyticsDescriptionFromRecord(record: PlatformActivityRecord): string {
  const meta = record.metadata;

  if (record.action === 'message' || record.action === 'message_sent') {
    return `Sent message in ${String(meta.conversationName ?? 'a conversation')}`;
  }
  if (
    record.targetType === 'file' &&
    (record.action === 'create' ||
      record.action === 'upload' ||
      record.action.includes('upload'))
  ) {
    return `Created ${String(meta.fileName ?? 'a file')}`;
  }
  if (record.action === 'share' || record.action.includes('share')) {
    return `Shared ${String(meta.fileName ?? record.targetType)}`;
  }
  if (record.action === 'complete') {
    return `Completed ${String(meta.title ?? meta.taskTitle ?? 'a task')}`;
  }

  return feedDescriptionFromRecord(record);
}

export function durationHoursFromRecord(record: PlatformActivityRecord): number {
  const duration = record.metadata.duration;
  return typeof duration === 'number' ? duration / 3600 : 0;
}
