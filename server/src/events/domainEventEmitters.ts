import { emitDomainEvent } from './emitDomainEvent';
import { buildTypedDomainEventInput, DOMAIN_EVENT_TYPES } from './domainEventRegistry';
import type { DomainEvent } from './types';

export function emitUserPreferenceUpdatedEvent(params: {
  actorUserId: string;
  preferenceKey: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.USER_PREFERENCE_UPDATED, {
      actorUserId: params.actorUserId,
      entityId: params.preferenceKey,
      metadata: { key: params.preferenceKey },
    })
  );
}

export function emitModuleInstalledEvent(params: {
  actorUserId: string;
  moduleId: string;
  installationId: string;
  installScope: 'personal' | 'business';
  businessId?: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.MODULE_INSTALLED, {
      actorUserId: params.actorUserId,
      entityId: params.installationId,
      businessId: params.installScope === 'business' ? params.businessId ?? null : null,
      metadata: {
        moduleId: params.moduleId,
        installScope: params.installScope,
        installationId: params.installationId,
        ...(params.businessId ? { businessId: params.businessId } : {}),
      },
    })
  );
}

export function emitModuleUninstalledEvent(params: {
  actorUserId: string;
  moduleId: string;
  installScope: 'personal' | 'business';
  businessId?: string;
  installationId?: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.MODULE_UNINSTALLED, {
      actorUserId: params.actorUserId,
      entityId: params.installationId ?? params.moduleId,
      businessId: params.installScope === 'business' ? params.businessId ?? null : null,
      metadata: {
        moduleId: params.moduleId,
        installScope: params.installScope,
        ...(params.businessId ? { businessId: params.businessId } : {}),
        ...(params.installationId ? { installationId: params.installationId } : {}),
      },
    })
  );
}

export function emitBusinessMemberAddedEvent(params: {
  actorUserId: string;
  memberId: string;
  businessId: string;
  memberUserId: string;
  role: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.BUSINESS_MEMBER_ADDED, {
      actorUserId: params.actorUserId,
      entityId: params.memberId,
      businessId: params.businessId,
      metadata: {
        memberUserId: params.memberUserId,
        role: params.role,
      },
    })
  );
}

export function emitBusinessMemberRemovedEvent(params: {
  actorUserId: string;
  memberId: string;
  businessId: string;
  memberUserId: string;
  role: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.BUSINESS_MEMBER_REMOVED, {
      actorUserId: params.actorUserId,
      entityId: params.memberId,
      businessId: params.businessId,
      metadata: {
        memberUserId: params.memberUserId,
        role: params.role,
      },
    })
  );
}

export function emitFileUploadedEvent(params: {
  actorUserId: string;
  fileId: string;
  folderId?: string | null;
  fileType?: string;
  fileName?: string;
  sizeBytes?: number;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FILE_UPLOADED, {
      actorUserId: params.actorUserId,
      entityId: params.fileId,
      dashboardId: params.dashboardId,
      metadata: {
        ...(params.folderId != null ? { folderId: params.folderId } : {}),
        ...(params.fileType ? { fileType: params.fileType } : {}),
        ...(params.fileName ? { fileName: params.fileName } : {}),
        ...(params.sizeBytes !== undefined ? { sizeBytes: params.sizeBytes } : {}),
        ...(params.dashboardId != null ? { dashboardId: params.dashboardId } : {}),
      },
    })
  );
}

export function emitFileDeletedEvent(params: {
  actorUserId: string;
  fileId: string;
  folderId?: string | null;
  softDelete?: boolean;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FILE_DELETED, {
      actorUserId: params.actorUserId,
      entityId: params.fileId,
      metadata: {
        softDelete: params.softDelete ?? true,
        ...(params.folderId != null ? { folderId: params.folderId } : {}),
        ...(params.dashboardId != null ? { dashboardId: params.dashboardId } : {}),
      },
    })
  );
}

export function emitFileSharedEvent(params: {
  actorUserId: string;
  fileId: string;
  recipientUserId: string;
  canRead: boolean;
  canWrite: boolean;
}): DomainEvent {
  const shareRole =
    params.canRead && params.canWrite ? 'read_write' : params.canRead ? 'read' : 'write';
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FILE_SHARED, {
      actorUserId: params.actorUserId,
      entityId: params.fileId,
      metadata: {
        recipientUserId: params.recipientUserId,
        canRead: params.canRead,
        canWrite: params.canWrite,
        shareRole,
      },
    })
  );
}

export function emitFolderSharedEvent(params: {
  actorUserId: string;
  folderId: string;
  recipientUserId: string;
  canRead: boolean;
  canWrite: boolean;
}): DomainEvent {
  const shareRole =
    params.canRead && params.canWrite ? 'read_write' : params.canRead ? 'read' : 'write';
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FOLDER_SHARED, {
      actorUserId: params.actorUserId,
      entityId: params.folderId,
      metadata: {
        recipientUserId: params.recipientUserId,
        canRead: params.canRead,
        canWrite: params.canWrite,
        shareRole,
      },
    })
  );
}

export function emitFileRenamedEvent(params: {
  actorUserId: string;
  fileId: string;
  fileName: string;
  previousName: string;
  folderId?: string | null;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FILE_RENAMED, {
      actorUserId: params.actorUserId,
      entityId: params.fileId,
      dashboardId: params.dashboardId,
      metadata: {
        fileName: params.fileName,
        previousName: params.previousName,
        ...(params.folderId != null ? { folderId: params.folderId } : {}),
      },
    })
  );
}

export function emitFileMovedEvent(params: {
  actorUserId: string;
  fileId: string;
  fileName?: string;
  folderId?: string | null;
  previousFolderId?: string | null;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FILE_MOVED, {
      actorUserId: params.actorUserId,
      entityId: params.fileId,
      dashboardId: params.dashboardId,
      metadata: {
        ...(params.fileName ? { fileName: params.fileName } : {}),
        ...(params.folderId != null ? { folderId: params.folderId } : {}),
        ...(params.previousFolderId != null ? { previousFolderId: params.previousFolderId } : {}),
      },
    })
  );
}

export function emitFileRestoredEvent(params: {
  actorUserId: string;
  fileId: string;
  fileName?: string;
  folderId?: string | null;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FILE_RESTORED, {
      actorUserId: params.actorUserId,
      entityId: params.fileId,
      dashboardId: params.dashboardId,
      metadata: {
        ...(params.fileName ? { fileName: params.fileName } : {}),
        ...(params.folderId != null ? { folderId: params.folderId } : {}),
      },
    })
  );
}

export function emitFileUnsharedEvent(params: {
  actorUserId: string;
  fileId: string;
  recipientUserId: string;
  fileName?: string;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FILE_UNSHARED, {
      actorUserId: params.actorUserId,
      entityId: params.fileId,
      dashboardId: params.dashboardId,
      metadata: {
        recipientUserId: params.recipientUserId,
        ...(params.fileName ? { fileName: params.fileName } : {}),
      },
    })
  );
}

export function emitFolderCreatedEvent(params: {
  actorUserId: string;
  folderId: string;
  folderName: string;
  parentId?: string | null;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FOLDER_CREATED, {
      actorUserId: params.actorUserId,
      entityId: params.folderId,
      dashboardId: params.dashboardId,
      metadata: {
        folderName: params.folderName,
        ...(params.parentId != null ? { parentId: params.parentId } : {}),
      },
    })
  );
}

export function emitFolderRenamedEvent(params: {
  actorUserId: string;
  folderId: string;
  folderName: string;
  previousName: string;
  parentId?: string | null;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FOLDER_RENAMED, {
      actorUserId: params.actorUserId,
      entityId: params.folderId,
      dashboardId: params.dashboardId,
      metadata: {
        folderName: params.folderName,
        previousName: params.previousName,
        ...(params.parentId != null ? { parentId: params.parentId } : {}),
      },
    })
  );
}

export function emitFolderMovedEvent(params: {
  actorUserId: string;
  folderId: string;
  folderName?: string;
  parentId?: string | null;
  previousParentId?: string | null;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FOLDER_MOVED, {
      actorUserId: params.actorUserId,
      entityId: params.folderId,
      dashboardId: params.dashboardId,
      metadata: {
        ...(params.folderName ? { folderName: params.folderName } : {}),
        ...(params.parentId != null ? { parentId: params.parentId } : {}),
        ...(params.previousParentId != null ? { previousParentId: params.previousParentId } : {}),
      },
    })
  );
}

export function emitFolderDeletedEvent(params: {
  actorUserId: string;
  folderId: string;
  folderName?: string;
  parentId?: string | null;
  softDelete?: boolean;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FOLDER_DELETED, {
      actorUserId: params.actorUserId,
      entityId: params.folderId,
      dashboardId: params.dashboardId,
      metadata: {
        softDelete: params.softDelete ?? true,
        ...(params.folderName ? { folderName: params.folderName } : {}),
        ...(params.parentId != null ? { parentId: params.parentId } : {}),
      },
    })
  );
}

export function emitFolderRestoredEvent(params: {
  actorUserId: string;
  folderId: string;
  folderName?: string;
  parentId?: string | null;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FOLDER_RESTORED, {
      actorUserId: params.actorUserId,
      entityId: params.folderId,
      dashboardId: params.dashboardId,
      metadata: {
        ...(params.folderName ? { folderName: params.folderName } : {}),
        ...(params.parentId != null ? { parentId: params.parentId } : {}),
      },
    })
  );
}

export function emitFolderUnsharedEvent(params: {
  actorUserId: string;
  folderId: string;
  recipientUserId: string;
  folderName?: string;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FOLDER_UNSHARED, {
      actorUserId: params.actorUserId,
      entityId: params.folderId,
      dashboardId: params.dashboardId,
      metadata: {
        recipientUserId: params.recipientUserId,
        ...(params.folderName ? { folderName: params.folderName } : {}),
      },
    })
  );
}

export function emitBusinessUpdatedEvent(params: {
  actorUserId: string;
  businessId: string;
  changedFields: string[];
  updateKind?: 'profile' | 'branding';
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.BUSINESS_UPDATED, {
      actorUserId: params.actorUserId,
      entityId: params.businessId,
      businessId: params.businessId,
      metadata: {
        changedFields: params.changedFields,
        ...(params.updateKind ? { updateKind: params.updateKind } : {}),
      },
    })
  );
}

export function emitModuleEnabledEvent(params: {
  actorUserId: string;
  moduleId: string;
  installationId: string;
  installScope: 'personal' | 'business';
  businessId?: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.MODULE_ENABLED, {
      actorUserId: params.actorUserId,
      entityId: params.installationId,
      businessId: params.installScope === 'business' ? params.businessId ?? null : null,
      metadata: {
        moduleId: params.moduleId,
        installScope: params.installScope,
        installationId: params.installationId,
        ...(params.businessId ? { businessId: params.businessId } : {}),
      },
    })
  );
}

export function emitModuleDisabledEvent(params: {
  actorUserId: string;
  moduleId: string;
  installationId: string;
  installScope: 'personal' | 'business';
  businessId?: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.MODULE_DISABLED, {
      actorUserId: params.actorUserId,
      entityId: params.installationId,
      businessId: params.installScope === 'business' ? params.businessId ?? null : null,
      metadata: {
        moduleId: params.moduleId,
        installScope: params.installScope,
        installationId: params.installationId,
        ...(params.businessId ? { businessId: params.businessId } : {}),
      },
    })
  );
}

export function emitChatConversationCreatedEvent(params: {
  actorUserId: string;
  conversationId: string;
  conversationType?: string;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CHAT_CONVERSATION_CREATED, {
      actorUserId: params.actorUserId,
      entityId: params.conversationId,
      dashboardId: params.dashboardId ?? null,
      metadata: {
        moduleId: 'chat',
        ...(params.conversationType ? { conversationType: params.conversationType } : {}),
        ...(params.dashboardId != null ? { dashboardId: params.dashboardId } : {}),
      },
    })
  );
}

export function emitChatConversationTrashedEvent(params: {
  actorUserId: string;
  conversationId: string;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CHAT_CONVERSATION_TRASHED, {
      actorUserId: params.actorUserId,
      entityId: params.conversationId,
      dashboardId: params.dashboardId ?? null,
      metadata: {
        moduleId: 'chat',
        ...(params.dashboardId != null ? { dashboardId: params.dashboardId } : {}),
      },
    })
  );
}

export function emitChatConversationRestoredEvent(params: {
  actorUserId: string;
  conversationId: string;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CHAT_CONVERSATION_RESTORED, {
      actorUserId: params.actorUserId,
      entityId: params.conversationId,
      dashboardId: params.dashboardId ?? null,
      metadata: {
        moduleId: 'chat',
        ...(params.dashboardId != null ? { dashboardId: params.dashboardId } : {}),
      },
    })
  );
}

export function emitChatConversationPermanentlyDeletedEvent(params: {
  actorUserId: string;
  conversationId: string;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CHAT_CONVERSATION_PERMANENTLY_DELETED, {
      actorUserId: params.actorUserId,
      entityId: params.conversationId,
      dashboardId: params.dashboardId ?? null,
      metadata: {
        moduleId: 'chat',
        ...(params.dashboardId != null ? { dashboardId: params.dashboardId } : {}),
      },
    })
  );
}

export function emitChatMessageSentEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
  threadId?: string | null;
  attachmentCount?: number;
  dashboardId?: string | null;
  businessId?: string | null;
}): DomainEvent {
  const attachmentCount = params.attachmentCount ?? 0;
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT, {
      actorUserId: params.actorUserId,
      entityId: params.messageId,
      dashboardId: params.dashboardId ?? null,
      businessId: params.businessId ?? null,
      metadata: {
        moduleId: 'chat',
        conversationId: params.conversationId,
        ...(params.threadId ? { threadId: params.threadId } : {}),
        attachmentCount,
        hasAttachments: attachmentCount > 0,
      },
    })
  );
}

export function emitChatMessageDeletedEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
  softDelete?: boolean;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CHAT_MESSAGE_DELETED, {
      actorUserId: params.actorUserId,
      entityId: params.messageId,
      metadata: {
        moduleId: 'chat',
        conversationId: params.conversationId,
        softDelete: params.softDelete ?? true,
      },
    })
  );
}

export function emitChatMessageRestoredEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CHAT_MESSAGE_RESTORED, {
      actorUserId: params.actorUserId,
      entityId: params.messageId,
      metadata: {
        moduleId: 'chat',
        conversationId: params.conversationId,
      },
    })
  );
}

export function emitChatMessagePermanentlyDeletedEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CHAT_MESSAGE_PERMANENTLY_DELETED, {
      actorUserId: params.actorUserId,
      entityId: params.messageId,
      metadata: {
        moduleId: 'chat',
        conversationId: params.conversationId,
      },
    })
  );
}

export function emitChatMessageReactionAddedEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
  emoji: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CHAT_MESSAGE_REACTION_ADDED, {
      actorUserId: params.actorUserId,
      entityId: params.messageId,
      metadata: {
        moduleId: 'chat',
        conversationId: params.conversationId,
        messageId: params.messageId,
        emoji: params.emoji,
      },
    })
  );
}

export function emitChatMessageReadEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CHAT_MESSAGE_READ, {
      actorUserId: params.actorUserId,
      entityId: params.messageId,
      metadata: {
        moduleId: 'chat',
        conversationId: params.conversationId,
        messageId: params.messageId,
      },
    })
  );
}

function calendarScopeIds(calendar: {
  contextType: string;
  contextId: string;
}): { businessId: string | null; householdId: string | null } {
  return {
    businessId: calendar.contextType === 'BUSINESS' ? calendar.contextId : null,
    householdId: calendar.contextType === 'HOUSEHOLD' ? calendar.contextId : null,
  };
}

export function emitCalendarCreatedEvent(params: {
  actorUserId: string;
  calendarId: string;
  contextType: string;
  contextId: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CALENDAR_CREATED, {
      actorUserId: params.actorUserId,
      entityId: params.calendarId,
      ...calendarScopeIds(params),
      metadata: {
        moduleId: 'calendar',
        contextType: params.contextType,
      },
    })
  );
}

export function emitCalendarUpdatedEvent(params: {
  actorUserId: string;
  calendarId: string;
  contextType: string;
  contextId: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CALENDAR_UPDATED, {
      actorUserId: params.actorUserId,
      entityId: params.calendarId,
      ...calendarScopeIds(params),
      metadata: {
        moduleId: 'calendar',
        contextType: params.contextType,
      },
    })
  );
}

export function emitCalendarDeletedEvent(params: {
  actorUserId: string;
  calendarId: string;
  contextType: string;
  contextId: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CALENDAR_DELETED, {
      actorUserId: params.actorUserId,
      entityId: params.calendarId,
      ...calendarScopeIds(params),
      metadata: {
        moduleId: 'calendar',
        contextType: params.contextType,
      },
    })
  );
}

export function emitCalendarEventCreatedEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  allDay?: boolean;
  startAt: string;
  endAt: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CALENDAR_EVENT_CREATED, {
      actorUserId: params.actorUserId,
      entityId: params.eventId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'calendar',
        calendarId: params.calendarId,
        allDay: Boolean(params.allDay),
        startAt: params.startAt,
        endAt: params.endAt,
      },
    })
  );
}

export function emitCalendarEventUpdatedEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  allDay?: boolean;
  startAt: string;
  endAt: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CALENDAR_EVENT_UPDATED, {
      actorUserId: params.actorUserId,
      entityId: params.eventId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'calendar',
        calendarId: params.calendarId,
        allDay: Boolean(params.allDay),
        startAt: params.startAt,
        endAt: params.endAt,
      },
    })
  );
}

export function emitCalendarEventDeletedEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  softDelete?: boolean;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CALENDAR_EVENT_DELETED, {
      actorUserId: params.actorUserId,
      entityId: params.eventId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'calendar',
        calendarId: params.calendarId,
        softDelete: Boolean(params.softDelete ?? true),
      },
    })
  );
}

export function emitCalendarEventTrashedEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CALENDAR_EVENT_TRASHED, {
      actorUserId: params.actorUserId,
      entityId: params.eventId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'calendar',
        calendarId: params.calendarId,
      },
    })
  );
}

export function emitCalendarEventRestoredEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CALENDAR_EVENT_RESTORED, {
      actorUserId: params.actorUserId,
      entityId: params.eventId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'calendar',
        calendarId: params.calendarId,
      },
    })
  );
}

export function emitCalendarEventPermanentlyDeletedEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CALENDAR_EVENT_PERMANENTLY_DELETED, {
      actorUserId: params.actorUserId,
      entityId: params.eventId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'calendar',
        calendarId: params.calendarId,
      },
    })
  );
}

export function emitCalendarEventRsvpUpdatedEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  response: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CALENDAR_EVENT_RSVP_UPDATED, {
      actorUserId: params.actorUserId,
      entityId: params.eventId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'calendar',
        calendarId: params.calendarId,
        eventId: params.eventId,
        response: params.response,
      },
    })
  );
}

export function emitCalendarEventReminderDispatchedEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  reminderId: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.CALENDAR_EVENT_REMINDER_DISPATCHED, {
      actorUserId: params.actorUserId,
      entityId: params.reminderId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'calendar',
        calendarId: params.calendarId,
        eventId: params.eventId,
        reminderId: params.reminderId,
      },
    })
  );
}

export function emitTodoTaskCreatedEvent(params: {
  actorUserId: string;
  taskId: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  status?: string;
  priority?: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.TODO_TASK_CREATED, {
      actorUserId: params.actorUserId,
      entityId: params.taskId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'todo',
        ...(params.status ? { status: params.status } : {}),
        ...(params.priority ? { priority: params.priority } : {}),
      },
    })
  );
}

export function emitTodoTaskUpdatedEvent(params: {
  actorUserId: string;
  taskId: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  status?: string;
  priority?: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.TODO_TASK_UPDATED, {
      actorUserId: params.actorUserId,
      entityId: params.taskId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'todo',
        ...(params.status ? { status: params.status } : {}),
        ...(params.priority ? { priority: params.priority } : {}),
      },
    })
  );
}

export function emitTodoTaskCompletedEvent(params: {
  actorUserId: string;
  taskId: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.TODO_TASK_COMPLETED, {
      actorUserId: params.actorUserId,
      entityId: params.taskId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: { moduleId: 'todo' },
    })
  );
}

export function emitTodoTaskReopenedEvent(params: {
  actorUserId: string;
  taskId: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  status?: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.TODO_TASK_REOPENED, {
      actorUserId: params.actorUserId,
      entityId: params.taskId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'todo',
        ...(params.status ? { status: params.status } : {}),
      },
    })
  );
}

export function emitTodoTaskAssignedEvent(params: {
  actorUserId: string;
  taskId: string;
  dashboardId: string;
  assigneeUserId: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.TODO_TASK_ASSIGNED, {
      actorUserId: params.actorUserId,
      entityId: params.taskId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        moduleId: 'todo',
        assigneeUserId: params.assigneeUserId,
      },
    })
  );
}

export function emitTodoTaskUnassignedEvent(params: {
  actorUserId: string;
  taskId: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.TODO_TASK_UNASSIGNED, {
      actorUserId: params.actorUserId,
      entityId: params.taskId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: { moduleId: 'todo' },
    })
  );
}

export function emitTodoTaskTrashedEvent(params: {
  actorUserId: string;
  taskId: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.TODO_TASK_TRASHED, {
      actorUserId: params.actorUserId,
      entityId: params.taskId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: { moduleId: 'todo', softDelete: true },
    })
  );
}

export function emitTodoTaskRestoredEvent(params: {
  actorUserId: string;
  taskId: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.TODO_TASK_RESTORED, {
      actorUserId: params.actorUserId,
      entityId: params.taskId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: { moduleId: 'todo' },
    })
  );
}

export function emitTodoTaskPermanentlyDeletedEvent(params: {
  actorUserId: string;
  taskId: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.TODO_TASK_PERMANENTLY_DELETED, {
      actorUserId: params.actorUserId,
      entityId: params.taskId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: { moduleId: 'todo' },
    })
  );
}

export function emitNotesPageCreatedEvent(params: {
  actorUserId: string;
  pageId: string;
  dashboardId: string;
  businessId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.NOTES_PAGE_CREATED, {
      actorUserId: params.actorUserId,
      entityId: params.pageId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      metadata: { moduleId: 'notes' },
    })
  );
}

export function emitNotesPageUpdatedEvent(params: {
  actorUserId: string;
  pageId: string;
  dashboardId: string;
  businessId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.NOTES_PAGE_UPDATED, {
      actorUserId: params.actorUserId,
      entityId: params.pageId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      metadata: { moduleId: 'notes' },
    })
  );
}

export function emitNotesPageTrashedEvent(params: {
  actorUserId: string;
  pageId: string;
  dashboardId: string;
  businessId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.NOTES_PAGE_TRASHED, {
      actorUserId: params.actorUserId,
      entityId: params.pageId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      metadata: { moduleId: 'notes', softDelete: true },
    })
  );
}

export function emitNotesPageRestoredEvent(params: {
  actorUserId: string;
  pageId: string;
  dashboardId: string;
  businessId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.NOTES_PAGE_RESTORED, {
      actorUserId: params.actorUserId,
      entityId: params.pageId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      metadata: { moduleId: 'notes' },
    })
  );
}

export function emitNotesPagePermanentlyDeletedEvent(params: {
  actorUserId: string;
  pageId: string;
  dashboardId: string;
  businessId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.NOTES_PAGE_PERMANENTLY_DELETED, {
      actorUserId: params.actorUserId,
      entityId: params.pageId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      metadata: { moduleId: 'notes' },
    })
  );
}

export function emitNotesPageSharedEvent(params: {
  actorUserId: string;
  pageId: string;
  dashboardId: string;
  businessId?: string | null;
  sharedWithUserId: string;
  role: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.NOTES_PAGE_SHARED, {
      actorUserId: params.actorUserId,
      entityId: params.pageId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      metadata: {
        moduleId: 'notes',
        sharedWithUserId: params.sharedWithUserId,
        role: params.role,
      },
    })
  );
}

export function emitNotesPageUnsharedEvent(params: {
  actorUserId: string;
  pageId: string;
  dashboardId: string;
  businessId?: string | null;
  sharedWithUserId: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.NOTES_PAGE_UNSHARED, {
      actorUserId: params.actorUserId,
      entityId: params.pageId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      metadata: { moduleId: 'notes', sharedWithUserId: params.sharedWithUserId },
    })
  );
}

export function emitNotebookLinkCreatedEvent(params: {
  actorUserId: string;
  linkId: string;
  pageId: string;
  targetType: string;
  targetId: string;
  relationshipType: string;
  dashboardId: string;
  businessId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.NOTEBOOK_LINK_CREATED, {
      actorUserId: params.actorUserId,
      entityId: params.linkId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      metadata: {
        moduleId: 'notebook',
        pageId: params.pageId,
        targetType: params.targetType,
        targetId: params.targetId,
        relationshipType: params.relationshipType,
      },
    })
  );
}

export function emitNotebookLinkArchivedEvent(params: {
  actorUserId: string;
  linkId: string;
  pageId: string;
  targetType: string;
  targetId: string;
  dashboardId: string;
  businessId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.NOTEBOOK_LINK_ARCHIVED, {
      actorUserId: params.actorUserId,
      entityId: params.linkId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      metadata: {
        moduleId: 'notebook',
        pageId: params.pageId,
        targetType: params.targetType,
        targetId: params.targetId,
      },
    })
  );
}
