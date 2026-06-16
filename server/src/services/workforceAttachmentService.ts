import { prisma } from '../lib/prisma';
import {
  WORKFORCE_NOT_TRASHED,
  WorkforceCommsValidationError,
  WorkforceCommsWorkflowError,
  assertCommunicationInBusiness,
  assertDraftEditableStatus,
  assertWorkforceCommsAuthor,
} from './workforceServiceShared';

export async function listAttachmentsForCommunication(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  return prisma.workforceAttachment.findMany({
    where: {
      communicationId: params.communicationId,
      ...WORKFORCE_NOT_TRASHED,
    },
    orderBy: { sortOrder: 'asc' },
  });
}

async function assertDriveFileAccessible(params: { fileId: string }) {
  const file = await prisma.file.findFirst({
    where: {
      id: params.fileId,
      trashedAt: null,
    },
    select: { id: true },
  });

  if (!file) {
    throw new WorkforceCommsValidationError('Drive file not found or not accessible', 'fileId');
  }
}

export async function addAttachmentToCommunication(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
  fileId?: string | null;
  url?: string | null;
  label?: string | null;
  mimeType?: string | null;
  sortOrder?: number;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  const communication = await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: params.communicationId,
  });
  assertDraftEditableStatus(communication.status);

  if (!params.fileId && !params.url) {
    throw new WorkforceCommsValidationError('fileId or url is required');
  }

  if (params.fileId) {
    await assertDriveFileAccessible({ fileId: params.fileId });
  }

  if (params.url) {
    try {
      // eslint-disable-next-line no-new -- URL constructor validates shape
      new URL(params.url);
    } catch {
      throw new WorkforceCommsValidationError('url must be a valid URL', 'url');
    }
  }

  return prisma.workforceAttachment.create({
    data: {
      communicationId: params.communicationId,
      fileId: params.fileId ?? null,
      url: params.url ?? null,
      label: params.label ?? null,
      mimeType: params.mimeType ?? null,
      sortOrder: params.sortOrder ?? 0,
    },
  });
}

export async function removeAttachmentFromCommunication(params: {
  businessId: string;
  actorUserId: string;
  attachmentId: string;
  communicationId?: string;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);

  const attachment = await prisma.workforceAttachment.findFirst({
    where: {
      id: params.attachmentId,
      ...(params.communicationId ? { communicationId: params.communicationId } : {}),
      communication: { businessId: params.businessId, ...WORKFORCE_NOT_TRASHED },
      ...WORKFORCE_NOT_TRASHED,
    },
    select: { id: true, communicationId: true },
  });

  if (!attachment) {
    throw new WorkforceCommsWorkflowError(404, 'Attachment not found');
  }

  const communication = await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: attachment.communicationId,
  });
  assertDraftEditableStatus(communication.status);

  return prisma.workforceAttachment.update({
    where: { id: params.attachmentId },
    data: { trashedAt: new Date() },
  });
}
