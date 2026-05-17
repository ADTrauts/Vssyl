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
  sizeBytes?: number;
  dashboardId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.FILE_UPLOADED, {
      actorUserId: params.actorUserId,
      entityId: params.fileId,
      metadata: {
        ...(params.folderId != null ? { folderId: params.folderId } : {}),
        ...(params.fileType ? { fileType: params.fileType } : {}),
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
