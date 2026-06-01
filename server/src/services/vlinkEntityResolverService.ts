import { VLinkEntityType } from '@prisma/client';
import {
  resolveCalendarEventForVLink,
  userCanLinkCalendarEvent,
} from './calendarVlinkAccessService';
import {
  resolveChatConversationForVLink,
  userCanLinkChatConversation,
} from './chatVlinkAccessService';
import {
  resolveDriveFileForVLink,
  resolveDriveFolderForVLink,
  userCanLinkDriveFile,
  userCanLinkDriveFolder,
} from './driveVlinkAccessService';

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

export async function resolveEntityAccess(
  userId: string,
  entityType: VLinkEntityType,
  entityId: string
): Promise<{ access: EntityAccessLevel; title?: string; url?: string }> {
  switch (entityType) {
    case VLinkEntityType.FILE: {
      const result = await resolveDriveFileForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return { access: 'full', title: result.title, url: result.url };
    }
    case VLinkEntityType.FOLDER: {
      const result = await resolveDriveFolderForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return { access: 'full', title: result.title, url: result.url };
    }
    case VLinkEntityType.CHAT_CONVERSATION: {
      const result = await resolveChatConversationForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.CALENDAR_EVENT: {
      const result = await resolveCalendarEventForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    default:
      return resolveNonDriveEntityAccess(userId, entityType, entityId);
  }
}

async function resolveNonDriveEntityAccess(
  userId: string,
  entityType: VLinkEntityType,
  entityId: string
): Promise<{ access: EntityAccessLevel; title?: string; url?: string }> {
  // Non-drive types remain in this file until their modules adopt platform entity adapters.
  const { prisma } = await import('../lib/prisma');

  switch (entityType) {
    case VLinkEntityType.TASK:
    case VLinkEntityType.TODO: {
      const task = await prisma.task.findFirst({
        where: {
          id: entityId,
          trashedAt: null,
          OR: [{ createdById: userId }, { assignedToId: userId }],
        },
        select: { id: true, title: true },
      });
      if (!task) return { access: 'restricted' };
      return { access: 'full', title: task.title, url: `/todo?task=${entityId}` };
    }
    case VLinkEntityType.NOTE: {
      const note = await prisma.note.findFirst({
        where: {
          id: entityId,
          trashedAt: null,
          OR: [{ createdById: userId }, { shares: { some: { sharedWithUserId: userId } } }],
        },
        select: { id: true, title: true },
      });
      if (!note) return { access: 'restricted' };
      return { access: 'full', title: note.title, url: `/notes?note=${entityId}` };
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
      return userCanLinkDriveFile(userId, entityId);
    case VLinkEntityType.FOLDER:
      return userCanLinkDriveFolder(userId, entityId);
    case VLinkEntityType.CHAT_CONVERSATION:
      return userCanLinkChatConversation(userId, entityId);
    case VLinkEntityType.CALENDAR_EVENT:
      return userCanLinkCalendarEvent(userId, entityId);
    default: {
      const resolved = await resolveEntityAccess(userId, entityType, entityId);
      return resolved.access === 'full';
    }
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
