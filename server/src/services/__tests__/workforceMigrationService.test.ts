import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessRole, WorkforceCommunicationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { importFrontPageAnnouncements } from '../workforceMigrationService';

const authorMember = {
  businessId: 'biz-1',
  userId: 'admin-1',
  role: BusinessRole.ADMIN,
  isActive: true,
  canManage: true,
};

describe('workforceMigrationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue(authorMember as never);
  });

  it('previewFrontPageMigration dry-run reports import candidates', async () => {
    vi.spyOn(prisma.businessFrontPageConfig, 'findFirst').mockResolvedValue({
      companyAnnouncements: [
        {
          id: 'ann-1',
          title: 'Welcome',
          content: 'Hello team',
          priority: 'high',
        },
      ],
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'findMany').mockResolvedValue([] as never);
    const createSpy = vi.spyOn(prisma.workforceCommunication, 'create');

    const result = await importFrontPageAnnouncements({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      dryRun: true,
    });

    expect(result.dryRun).toBe(true);
    expect(result.importCount).toBe(1);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('importFrontPageAnnouncements creates published communications with legacy ids', async () => {
    vi.spyOn(prisma.businessFrontPageConfig, 'findFirst').mockResolvedValue({
      companyAnnouncements: [
        {
          id: 'ann-1',
          title: 'Welcome',
          content: 'Hello team',
          priority: 'urgent',
        },
      ],
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.workforceCommunication, 'create').mockResolvedValue({
      id: 'comm-1',
    } as never);
    vi.spyOn(prisma.workforceAudience, 'create').mockResolvedValue({ id: 'aud-1' } as never);
    vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([
      { id: 'ep-1', userId: 'user-1' },
    ] as never);
    vi.spyOn(prisma.workforceAudienceResolution, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.workforceAudienceResolution, 'createMany').mockResolvedValue({ count: 1 });

    const result = await importFrontPageAnnouncements({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
    });

    expect(result.importCount).toBe(1);
    expect(prisma.workforceCommunication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: 'biz-1',
          status: WorkforceCommunicationStatus.PUBLISHED,
          legacyFrontPageId: 'ann-1',
          showOnFrontPage: true,
        }),
      })
    );
  });
});
