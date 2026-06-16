import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessRole, WorkforceCommunicationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  addAttachmentToCommunication,
  removeAttachmentFromCommunication,
} from '../workforceAttachmentService';

const authorMember = {
  businessId: 'biz-1',
  userId: 'admin-1',
  role: BusinessRole.ADMIN,
  isActive: true,
  canManage: true,
};

describe('workforceAttachmentService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue(authorMember as never);
  });

  it('addAttachmentToCommunication links Drive file on draft communication', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
      status: WorkforceCommunicationStatus.DRAFT,
    } as never);
    vi.spyOn(prisma.file, 'findFirst').mockResolvedValue({ id: 'file-1' } as never);
    vi.spyOn(prisma.workforceAttachment, 'create').mockResolvedValue({
      id: 'att-1',
      communicationId: 'comm-1',
      fileId: 'file-1',
    } as never);

    const attachment = await addAttachmentToCommunication({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      communicationId: 'comm-1',
      fileId: 'file-1',
      label: 'Policy PDF',
    });

    expect(attachment.fileId).toBe('file-1');
  });

  it('addAttachmentToCommunication requires fileId or url', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
      status: WorkforceCommunicationStatus.DRAFT,
    } as never);

    await expect(
      addAttachmentToCommunication({
        businessId: 'biz-1',
        actorUserId: 'admin-1',
        communicationId: 'comm-1',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('removeAttachmentFromCommunication soft-trashes attachment', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
      status: WorkforceCommunicationStatus.DRAFT,
    } as never);
    vi.spyOn(prisma.workforceAttachment, 'findFirst').mockResolvedValue({ id: 'att-1' } as never);
    vi.spyOn(prisma.workforceAttachment, 'update').mockResolvedValue({
      id: 'att-1',
      trashedAt: new Date(),
    } as never);

    const removed = await removeAttachmentFromCommunication({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      communicationId: 'comm-1',
      attachmentId: 'att-1',
    });

    expect(removed.trashedAt).toBeTruthy();
  });
});
