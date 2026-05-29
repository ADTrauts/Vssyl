import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../lib/prisma';

export type EntityAccessLevel = 'full' | 'restricted';

export interface ResolvedVLinkEntity {
  id: string;
  entityType: VLinkEntityType;
  entityId: string;
  moduleId: string | null;
  access: EntityAccessLevel;
  title?: string;
  url?: string;
  linkedAt: Date;
}

async function userCanReadFile(userId: string, fileId: string): Promise<boolean> {
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      trashedAt: null,
      OR: [
        { userId },
        { permissions: { some: { userId, canRead: true } } },
        {
          folder: {
            permissions: { some: { userId, canRead: true } },
          },
        },
      ],
    },
    select: { id: true, name: true },
  });
  return Boolean(file);
}

async function userCanReadFolder(userId: string, folderId: string): Promise<boolean> {
  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      trashedAt: null,
      OR: [
        { userId },
        { permissions: { some: { userId, canRead: true } } },
      ],
    },
    select: { id: true, name: true },
  });
  return Boolean(folder);
}

async function userCanReadCalendarEvent(userId: string, eventId: string): Promise<{ allowed: boolean; title?: string }> {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      trashedAt: null,
      calendar: {
        OR: [
          { members: { some: { userId } } },
          {
            contextType: 'PERSONAL',
            contextId: userId,
          },
        ],
      },
    },
    select: { id: true, title: true },
  });
  if (!event) {
    return { allowed: false };
  }
  return { allowed: true, title: event.title };
}

async function userCanReadTask(userId: string, taskId: string): Promise<{ allowed: boolean; title?: string }> {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      trashedAt: null,
      OR: [{ createdById: userId }, { assignedToId: userId }],
    },
    select: { id: true, title: true },
  });
  if (!task) {
    return { allowed: false };
  }
  return { allowed: true, title: task.title };
}

async function userCanReadNote(userId: string, noteId: string): Promise<{ allowed: boolean; title?: string }> {
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      trashedAt: null,
      OR: [
        { createdById: userId },
        { shares: { some: { sharedWithUserId: userId } } },
      ],
    },
    select: { id: true, title: true },
  });
  if (!note) {
    return { allowed: false };
  }
  return { allowed: true, title: note.title };
}

async function userCanReadChatConversation(
  userId: string,
  conversationId: string
): Promise<{ allowed: boolean; title?: string }> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      trashedAt: null,
      participants: { some: { userId, isActive: true } },
    },
    select: { id: true, name: true },
  });
  if (!conversation) {
    return { allowed: false };
  }
  return { allowed: true, title: conversation.name ?? 'Conversation' };
}

export async function resolveEntityAccess(
  userId: string,
  entityType: VLinkEntityType,
  entityId: string
): Promise<{ access: EntityAccessLevel; title?: string; url?: string }> {
  switch (entityType) {
    case VLinkEntityType.FILE: {
      const file = await prisma.file.findFirst({
        where: {
          id: entityId,
          trashedAt: null,
          OR: [
            { userId },
            { permissions: { some: { userId, canRead: true } } },
            { folder: { permissions: { some: { userId, canRead: true } } } },
          ],
        },
        select: { id: true, name: true },
      });
      if (!file) {
        return { access: 'restricted' };
      }
      return { access: 'full', title: file.name, url: `/drive?file=${file.id}` };
    }
    case VLinkEntityType.FOLDER: {
      const folder = await prisma.folder.findFirst({
        where: {
          id: entityId,
          trashedAt: null,
          OR: [
            { userId },
            { permissions: { some: { userId, canRead: true } } },
          ],
        },
        select: { id: true, name: true },
      });
      if (!folder) {
        return { access: 'restricted' };
      }
      return { access: 'full', title: folder.name, url: `/drive?folder=${folder.id}` };
    }
    case VLinkEntityType.CALENDAR_EVENT: {
      const result = await userCanReadCalendarEvent(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted' };
      }
      return { access: 'full', title: result.title, url: `/calendar?event=${entityId}` };
    }
    case VLinkEntityType.TASK:
    case VLinkEntityType.TODO: {
      const result = await userCanReadTask(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted' };
      }
      return { access: 'full', title: result.title, url: `/todo?task=${entityId}` };
    }
    case VLinkEntityType.NOTE: {
      const result = await userCanReadNote(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted' };
      }
      return { access: 'full', title: result.title, url: `/notes?note=${entityId}` };
    }
    case VLinkEntityType.CHAT_CONVERSATION: {
      const result = await userCanReadChatConversation(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted' };
      }
      return { access: 'full', title: result.title, url: `/chat?conversation=${entityId}` };
    }
    default:
      return { access: 'restricted' };
  }
}

export async function userCanLinkEntity(
  userId: string,
  entityType: VLinkEntityType,
  entityId: string
): Promise<boolean> {
  switch (entityType) {
    case VLinkEntityType.FILE:
      return userCanReadFile(userId, entityId);
    case VLinkEntityType.FOLDER:
      return userCanReadFolder(userId, entityId);
    case VLinkEntityType.CALENDAR_EVENT:
      return (await userCanReadCalendarEvent(userId, entityId)).allowed;
    case VLinkEntityType.TASK:
    case VLinkEntityType.TODO:
      return (await userCanReadTask(userId, entityId)).allowed;
    case VLinkEntityType.NOTE:
      return (await userCanReadNote(userId, entityId)).allowed;
    case VLinkEntityType.CHAT_CONVERSATION:
      return (await userCanReadChatConversation(userId, entityId)).allowed;
    default:
      return false;
  }
}

export function entityTypeLabel(entityType: VLinkEntityType): string {
  switch (entityType) {
    case VLinkEntityType.FILE:
      return 'File';
    case VLinkEntityType.FOLDER:
      return 'Folder';
    case VLinkEntityType.CALENDAR_EVENT:
      return 'Calendar event';
    case VLinkEntityType.CHAT_CONVERSATION:
      return 'Conversation';
    case VLinkEntityType.CHAT_THREAD:
      return 'Thread';
    case VLinkEntityType.TASK:
    case VLinkEntityType.TODO:
      return 'Task';
    case VLinkEntityType.NOTE:
      return 'Note';
    default:
      return 'Item';
  }
}
