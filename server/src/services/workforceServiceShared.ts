import {
  BusinessRole,
  Prisma,
  WorkforceCommunicationStatus,
  WorkforceCommunicationType,
  WorkforceAudienceType,
  WorkforcePriority,
} from '@prisma/client';
import { prisma } from '../lib/prisma';

export const WORKFORCE_COMMS_MODULE_ID = 'workforce_comms' as const;

export const WORKFORCE_NOT_TRASHED = { trashedAt: null } as const;

export class WorkforceCommsWorkflowError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'WorkforceCommsWorkflowError';
  }
}

export class WorkforceCommsValidationError extends WorkforceCommsWorkflowError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(400, message);
    this.name = 'WorkforceCommsValidationError';
  }
}

const isJsonRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

export const COMMUNICATION_LIST_INCLUDE = {
  audience: true,
  campaign: { select: { id: true, name: true, status: true } },
  _count: {
    select: {
      audienceResolutions: true,
      readReceipts: true,
      acknowledgements: true,
    },
  },
} satisfies Prisma.WorkforceCommunicationInclude;

export const COMMUNICATION_DETAIL_INCLUDE = {
  audience: true,
  campaign: { select: { id: true, name: true, status: true, startsAt: true, endsAt: true } },
  attachments: {
    where: WORKFORCE_NOT_TRASHED,
    orderBy: { sortOrder: 'asc' as const },
  },
  bridgeRefs: true,
  _count: {
    select: {
      audienceResolutions: true,
      readReceipts: true,
      acknowledgements: true,
      deliveryLogs: true,
    },
  },
} satisfies Prisma.WorkforceCommunicationInclude;

export const CAMPAIGN_LIST_INCLUDE = {
  _count: { select: { communications: true } },
} satisfies Prisma.WorkforceCampaignInclude;

export type WorkforceBusinessMember = Prisma.BusinessMemberGetPayload<object>;

export async function assertActiveBusinessMember(
  userId: string,
  businessId: string
): Promise<WorkforceBusinessMember> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
  });

  if (!member?.isActive) {
    throw new WorkforceCommsWorkflowError(403, 'Access denied');
  }

  return member;
}

/** Admin or manager-with-canManage — for authoring and publish mutations. */
export async function assertWorkforceCommsAuthor(
  userId: string,
  businessId: string
): Promise<WorkforceBusinessMember> {
  const member = await assertActiveBusinessMember(userId, businessId);
  const isAdmin = member.role === BusinessRole.ADMIN;
  const isManagingManager = member.role === BusinessRole.MANAGER && member.canManage;

  if (!isAdmin && !isManagingManager) {
    throw new WorkforceCommsWorkflowError(
      403,
      'Workforce communications author access required'
    );
  }

  return member;
}

export async function assertCommunicationInBusiness(params: {
  businessId: string;
  communicationId: string;
  includeTrashed?: boolean;
}) {
  const communication = await prisma.workforceCommunication.findFirst({
    where: {
      id: params.communicationId,
      businessId: params.businessId,
      ...(params.includeTrashed ? {} : WORKFORCE_NOT_TRASHED),
    },
  });

  if (!communication) {
    throw new WorkforceCommsWorkflowError(404, 'Communication not found');
  }

  return communication;
}

export async function assertCampaignInBusiness(params: {
  businessId: string;
  campaignId: string;
  includeTrashed?: boolean;
}) {
  const campaign = await prisma.workforceCampaign.findFirst({
    where: {
      id: params.campaignId,
      businessId: params.businessId,
      ...(params.includeTrashed ? {} : WORKFORCE_NOT_TRASHED),
    },
  });

  if (!campaign) {
    throw new WorkforceCommsWorkflowError(404, 'Campaign not found');
  }

  return campaign;
}

export function assertDraftEditableStatus(status: WorkforceCommunicationStatus): void {
  if (status !== WorkforceCommunicationStatus.DRAFT && status !== WorkforceCommunicationStatus.SCHEDULED) {
    throw new WorkforceCommsWorkflowError(
      409,
      'Only draft or scheduled communications can be edited'
    );
  }
}

export function assertPublishableStatus(status: WorkforceCommunicationStatus): void {
  if (status !== WorkforceCommunicationStatus.DRAFT && status !== WorkforceCommunicationStatus.SCHEDULED) {
    throw new WorkforceCommsWorkflowError(409, 'Communication cannot be published from current status');
  }
}

export function assertCancellableStatus(status: WorkforceCommunicationStatus): void {
  if (
    status === WorkforceCommunicationStatus.CANCELLED ||
    status === WorkforceCommunicationStatus.EXPIRED
  ) {
    throw new WorkforceCommsWorkflowError(409, 'Communication is already closed');
  }
}

export function parseCommunicationType(value: unknown): WorkforceCommunicationType {
  if (typeof value !== 'string') {
    throw new WorkforceCommsValidationError('communicationType is required', 'communicationType');
  }
  const normalized = value.toUpperCase();
  if (!(normalized in WorkforceCommunicationType)) {
    throw new WorkforceCommsValidationError('Invalid communicationType', 'communicationType');
  }
  return normalized as WorkforceCommunicationType;
}

export function parseWorkforcePriority(value: unknown): WorkforcePriority | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new WorkforceCommsValidationError('Invalid priority', 'priority');
  }
  const normalized = value.toUpperCase();
  if (!(normalized in WorkforcePriority)) {
    throw new WorkforceCommsValidationError('Invalid priority', 'priority');
  }
  return normalized as WorkforcePriority;
}

export function mapFrontPagePriorityToWorkforce(value: unknown): WorkforcePriority {
  if (typeof value !== 'string') {
    return WorkforcePriority.NORMAL;
  }
  const normalized = value.toLowerCase();
  if (normalized === 'urgent') return WorkforcePriority.URGENT;
  if (normalized === 'high') return WorkforcePriority.HIGH;
  if (normalized === 'low') return WorkforcePriority.LOW;
  return WorkforcePriority.NORMAL;
}

export function parseAudienceType(value: unknown): WorkforceAudienceType {
  if (typeof value !== 'string') {
    throw new WorkforceCommsValidationError('audienceType is required', 'audienceType');
  }
  const normalized = value.toUpperCase();
  if (!(normalized in WorkforceAudienceType)) {
    throw new WorkforceCommsValidationError('Invalid audienceType', 'audienceType');
  }
  return normalized as WorkforceAudienceType;
}

export function parseStringArrayField(
  spec: Record<string, unknown>,
  field: string,
  required = true
): string[] {
  const raw = spec[field];
  if (raw === undefined || raw === null) {
    if (required) {
      throw new WorkforceCommsValidationError(`${field} is required`, field);
    }
    return [];
  }
  if (!Array.isArray(raw) || raw.some((item) => typeof item !== 'string')) {
    throw new WorkforceCommsValidationError(`${field} must be a string array`, field);
  }
  return raw;
}

export function parseAudienceSpecRecord(spec: unknown): Record<string, unknown> {
  if (!isJsonRecord(spec)) {
    throw new WorkforceCommsValidationError('Audience spec must be a JSON object', 'spec');
  }
  return spec;
}

export type ResolvedAudienceMember = {
  userId: string;
  employeePositionId: string | null;
};

export function dedupeResolvedAudience(members: ResolvedAudienceMember[]): ResolvedAudienceMember[] {
  const byUser = new Map<string, ResolvedAudienceMember>();
  for (const member of members) {
    const existing = byUser.get(member.userId);
    if (!existing) {
      byUser.set(member.userId, member);
      continue;
    }
    if (!existing.employeePositionId && member.employeePositionId) {
      byUser.set(member.userId, member);
    }
  }
  return Array.from(byUser.values());
}
