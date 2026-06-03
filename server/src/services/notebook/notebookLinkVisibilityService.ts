import type { Prisma } from '@prisma/client';
import {
  NotebookLinkEntityType,
  NotebookLinkRelationshipType,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { getTaskByIdIfAccessible } from '../todoVisibilityService';
import { fetchAccessibleActiveFiles } from '../driveVisibilityService';
import type { NotebookLinkListItem, NotebookLinkTargetDto } from './notebookLinkTypes';

export async function userCanAccessCalendarEvent(userId: string, eventId: string): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      calendar: {
        include: {
          members: { where: { userId } },
        },
      },
    },
  });
  if (!event) return false;
  return event.calendar.members.some(
    (m) =>
      m.role === 'OWNER' ||
      m.role === 'ADMIN' ||
      m.role === 'EDITOR' ||
      m.role === 'READER'
  );
}

function metadataRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export async function hydrateLinkTarget(
  userId: string,
  targetType: NotebookLinkEntityType,
  targetId: string
): Promise<NotebookLinkTargetDto | undefined> {
  switch (targetType) {
    case 'TASK': {
      const task = await getTaskByIdIfAccessible(userId, targetId);
      if (!task) return undefined;
      return {
        kind: 'task',
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        trashed: task.trashedAt != null,
      };
    }
    case 'FILE': {
      const activeFiles = await fetchAccessibleActiveFiles(userId, [targetId]);
      if (activeFiles.length === 0) return undefined;
      const file = activeFiles[0];
      const owner = await prisma.user.findUnique({
        where: { id: file.userId },
        select: { name: true, email: true },
      });
      const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : undefined;
      return {
        kind: 'file',
        id: file.id,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        extension: ext ?? null,
        createdAt: file.createdAt?.toISOString() ?? null,
        updatedAt: file.updatedAt?.toISOString() ?? null,
        ownerName: owner?.name ?? owner?.email ?? null,
        dashboardId: file.dashboardId,
        trashed: false,
      };
    }
    case 'CALENDAR_EVENT': {
      const allowed = await userCanAccessCalendarEvent(userId, targetId);
      if (!allowed) return undefined;
      const event = await prisma.event.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          location: true,
          onlineMeetingLink: true,
          allDay: true,
          trashedAt: true,
          attendees: { select: { email: true, userId: true } },
        },
      });
      if (!event) return undefined;
      const attendeeLabels = event.attendees
        .map((a) => a.email || a.userId)
        .filter((v): v is string => Boolean(v));
      const attendeesSummary =
        attendeeLabels.length === 0
          ? null
          : attendeeLabels.length <= 3
            ? attendeeLabels.join(', ')
            : `${attendeeLabels.slice(0, 3).join(', ')} +${attendeeLabels.length - 3}`;
      return {
        kind: 'event',
        id: event.id,
        title: event.title,
        startTime: event.startAt.toISOString(),
        endTime: event.endAt.toISOString(),
        location: event.location,
        onlineMeetingLink: event.onlineMeetingLink,
        allDay: event.allDay,
        attendeesSummary,
        trashed: event.trashedAt != null,
      };
    }
    default:
      return undefined;
  }
}

export async function toListItemsWithTargets(
  userId: string,
  rows: Array<{
    id: string;
    sourceType: NotebookLinkEntityType;
    sourceId: string;
    targetType: NotebookLinkEntityType;
    targetId: string;
    relationshipType: NotebookLinkRelationshipType;
    direction: import('@prisma/client').NotebookLinkDirection;
    createdById: string;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }>
): Promise<NotebookLinkListItem[]> {
  const items: NotebookLinkListItem[] = [];
  for (const row of rows) {
    const target = await hydrateLinkTarget(userId, row.targetType, row.targetId);
    items.push({
      id: row.id,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      targetType: row.targetType,
      targetId: row.targetId,
      relationshipType: row.relationshipType,
      direction: row.direction,
      createdById: row.createdById,
      metadata: metadataRecord(row.metadata),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      target,
      targetAccessible: target != null,
    });
  }
  return items;
}
