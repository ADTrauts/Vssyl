import type { DomainEventEmitInput } from './types';

/** Stable domain event type strings — use these instead of literals at emit sites. */
export const DOMAIN_EVENT_TYPES = {
  USER_PREFERENCE_UPDATED: 'user.preference.updated',
  MODULE_INSTALLED: 'module.installed',
  MODULE_UNINSTALLED: 'module.uninstalled',
  MODULE_ENABLED: 'module.enabled',
  MODULE_DISABLED: 'module.disabled',
  BUSINESS_MEMBER_ADDED: 'business.member.added',
  BUSINESS_MEMBER_REMOVED: 'business.member.removed',
  BUSINESS_UPDATED: 'business.updated',
  FILE_UPLOADED: 'file.uploaded',
  FILE_DELETED: 'file.deleted',
  FILE_SHARED: 'file.shared',
  FOLDER_SHARED: 'folder.shared',
  CHAT_MESSAGE_SENT: 'chat.message.sent',
  CALENDAR_EVENT_CREATED: 'calendar.event.created',
} as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[keyof typeof DOMAIN_EVENT_TYPES];

export interface DomainEventContract {
  type: DomainEventType;
  entityType: string;
  defaultAction: string;
  version: number;
  description: string;
  recommendedMetadataFields: readonly string[];
  disallowedMetadataFields: readonly string[];
}

const GLOBAL_DISALLOWED_METADATA = [
  'password',
  'token',
  'secret',
  'accessToken',
  'refreshToken',
  'value',
  'rawValue',
  'configuration',
  'configured',
  'fileContent',
  'content',
  'body',
  'email',
] as const;

export const DOMAIN_EVENT_CONTRACTS: Record<DomainEventType, DomainEventContract> = {
  [DOMAIN_EVENT_TYPES.USER_PREFERENCE_UPDATED]: {
    type: DOMAIN_EVENT_TYPES.USER_PREFERENCE_UPDATED,
    entityType: 'UserPreference',
    defaultAction: 'update',
    version: 1,
    description: 'User updated a preference key (value not included in metadata).',
    recommendedMetadataFields: ['key'],
    disallowedMetadataFields: ['value', 'rawValue'],
  },
  [DOMAIN_EVENT_TYPES.MODULE_INSTALLED]: {
    type: DOMAIN_EVENT_TYPES.MODULE_INSTALLED,
    entityType: 'ModuleInstallation',
    defaultAction: 'install',
    version: 1,
    description: 'Module installed for personal or business scope.',
    recommendedMetadataFields: ['moduleId', 'installScope', 'businessId', 'installationId'],
    disallowedMetadataFields: ['configured', 'configuration'],
  },
  [DOMAIN_EVENT_TYPES.MODULE_UNINSTALLED]: {
    type: DOMAIN_EVENT_TYPES.MODULE_UNINSTALLED,
    entityType: 'ModuleInstallation',
    defaultAction: 'uninstall',
    version: 1,
    description: 'Module uninstalled from personal or business scope.',
    recommendedMetadataFields: ['moduleId', 'installScope', 'businessId'],
    disallowedMetadataFields: ['configured', 'configuration'],
  },
  [DOMAIN_EVENT_TYPES.MODULE_ENABLED]: {
    type: DOMAIN_EVENT_TYPES.MODULE_ENABLED,
    entityType: 'ModuleInstallation',
    defaultAction: 'enable',
    version: 1,
    description: 'Module installation enabled.',
    recommendedMetadataFields: ['moduleId', 'installScope', 'businessId', 'installationId'],
    disallowedMetadataFields: [],
  },
  [DOMAIN_EVENT_TYPES.MODULE_DISABLED]: {
    type: DOMAIN_EVENT_TYPES.MODULE_DISABLED,
    entityType: 'ModuleInstallation',
    defaultAction: 'disable',
    version: 1,
    description: 'Module installation disabled.',
    recommendedMetadataFields: ['moduleId', 'installScope', 'businessId', 'installationId'],
    disallowedMetadataFields: [],
  },
  [DOMAIN_EVENT_TYPES.BUSINESS_MEMBER_ADDED]: {
    type: DOMAIN_EVENT_TYPES.BUSINESS_MEMBER_ADDED,
    entityType: 'BusinessMember',
    defaultAction: 'add',
    version: 1,
    description: 'User became an active business member.',
    recommendedMetadataFields: ['memberUserId', 'role'],
    disallowedMetadataFields: ['email', 'token'],
  },
  [DOMAIN_EVENT_TYPES.BUSINESS_MEMBER_REMOVED]: {
    type: DOMAIN_EVENT_TYPES.BUSINESS_MEMBER_REMOVED,
    entityType: 'BusinessMember',
    defaultAction: 'remove',
    version: 1,
    description: 'User removed from business (adopted on remove member paths).',
    recommendedMetadataFields: ['memberUserId', 'role'],
    disallowedMetadataFields: ['email'],
  },
  [DOMAIN_EVENT_TYPES.BUSINESS_UPDATED]: {
    type: DOMAIN_EVENT_TYPES.BUSINESS_UPDATED,
    entityType: 'Business',
    defaultAction: 'update',
    version: 1,
    description: 'Business profile or branding updated.',
    recommendedMetadataFields: ['changedFields', 'updateKind'],
    disallowedMetadataFields: [
      'ein',
      'logo',
      'logoUrl',
      'settings',
      'manifest',
      'configuration',
      'configured',
      'website',
      'description',
    ],
  },
  [DOMAIN_EVENT_TYPES.FILE_UPLOADED]: {
    type: DOMAIN_EVENT_TYPES.FILE_UPLOADED,
    entityType: 'File',
    defaultAction: 'upload',
    version: 1,
    description: 'File uploaded to Drive.',
    recommendedMetadataFields: ['folderId', 'fileType', 'sizeBytes', 'dashboardId'],
    disallowedMetadataFields: ['content', 'fileContent', 'url', 'path', 'signedUrl'],
  },
  [DOMAIN_EVENT_TYPES.FILE_DELETED]: {
    type: DOMAIN_EVENT_TYPES.FILE_DELETED,
    entityType: 'File',
    defaultAction: 'delete',
    version: 1,
    description: 'File moved to trash or removed from Drive.',
    recommendedMetadataFields: ['folderId', 'softDelete', 'dashboardId'],
    disallowedMetadataFields: ['content', 'url', 'path', 'signedUrl'],
  },
  [DOMAIN_EVENT_TYPES.FILE_SHARED]: {
    type: DOMAIN_EVENT_TYPES.FILE_SHARED,
    entityType: 'File',
    defaultAction: 'share',
    version: 1,
    description: 'File permission granted to another user.',
    recommendedMetadataFields: ['recipientUserId', 'canRead', 'canWrite', 'shareRole'],
    disallowedMetadataFields: ['url', 'path', 'signedUrl', 'email'],
  },
  [DOMAIN_EVENT_TYPES.FOLDER_SHARED]: {
    type: DOMAIN_EVENT_TYPES.FOLDER_SHARED,
    entityType: 'Folder',
    defaultAction: 'share',
    version: 1,
    description: 'Folder permission granted to another user.',
    recommendedMetadataFields: ['recipientUserId', 'canRead', 'canWrite', 'shareRole'],
    disallowedMetadataFields: ['url', 'path', 'signedUrl', 'email'],
  },
  [DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT]: {
    type: DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT,
    entityType: 'Message',
    defaultAction: 'send',
    version: 1,
    description: 'Chat message sent.',
    recommendedMetadataFields: [
      'moduleId',
      'conversationId',
      'threadId',
      'attachmentCount',
      'hasAttachments',
    ],
    disallowedMetadataFields: ['content', 'body'],
  },
  [DOMAIN_EVENT_TYPES.CALENDAR_EVENT_CREATED]: {
    type: DOMAIN_EVENT_TYPES.CALENDAR_EVENT_CREATED,
    entityType: 'CalendarEvent',
    defaultAction: 'create',
    version: 1,
    description: 'Calendar event created.',
    recommendedMetadataFields: ['moduleId', 'calendarId', 'allDay', 'startAt', 'endAt'],
    disallowedMetadataFields: ['description', 'body', 'title'],
  },
};

export function getDomainEventContract(type: string): DomainEventContract | undefined {
  return DOMAIN_EVENT_CONTRACTS[type as DomainEventType];
}

export function isRegisteredDomainEventType(type: string): type is DomainEventType {
  return type in DOMAIN_EVENT_CONTRACTS;
}

/** Strip sensitive / disallowed metadata keys before persistence and fan-out. */
export function sanitizeDomainEventMetadata(
  type: string,
  metadata: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!metadata) return {};
  const contract = getDomainEventContract(type);
  const disallowed = new Set<string>([
    ...GLOBAL_DISALLOWED_METADATA,
    ...(contract?.disallowedMetadataFields ?? []),
  ]);
  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(metadata)) {
    if (disallowed.has(key)) continue;
    if (val === undefined) continue;
    sanitized[key] = val;
  }
  return sanitized;
}

export type TypedDomainEventInput = Omit<DomainEventEmitInput, 'type' | 'entityType' | 'action'> & {
  entityType?: string;
  action?: string;
  metadata?: Record<string, unknown>;
};

/** Build emit input from registry contract (type-safe at call sites). */
export function buildTypedDomainEventInput(
  eventType: DomainEventType,
  input: TypedDomainEventInput
): DomainEventEmitInput {
  const contract = DOMAIN_EVENT_CONTRACTS[eventType];
  return {
    type: contract.type,
    actorUserId: input.actorUserId,
    dashboardId: input.dashboardId,
    businessId: input.businessId,
    householdId: input.householdId,
    entityType: input.entityType ?? contract.entityType,
    entityId: input.entityId,
    action: input.action ?? contract.defaultAction,
    metadata: sanitizeDomainEventMetadata(contract.type, input.metadata),
  };
}
