import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkforceAudienceType, WorkforceCommunicationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  estimateAudienceCount,
  resolveAudienceForPublish,
  resolveAudienceMembers,
  validateAudienceSpec,
} from '../workforceAudienceService';

describe('workforceAudienceService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('validateAudienceSpec accepts BUSINESS audience', () => {
    const validated = validateAudienceSpec({
      audienceType: WorkforceAudienceType.BUSINESS,
      spec: {},
    });
    expect(validated.audienceType).toBe(WorkforceAudienceType.BUSINESS);
  });

  it('validateAudienceSpec requires departmentIds for DEPARTMENT', () => {
    expect(() =>
      validateAudienceSpec({
        audienceType: WorkforceAudienceType.DEPARTMENT,
        spec: {},
      })
    ).toThrow(/departmentIds/);
  });

  it('resolveAudienceMembers scopes BUSINESS audience to active employee positions', async () => {
    vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([
      { id: 'ep-1', userId: 'user-1' },
      { id: 'ep-2', userId: 'user-2' },
    ] as never);

    const members = await resolveAudienceMembers({
      businessId: 'biz-1',
      audienceType: WorkforceAudienceType.BUSINESS,
      spec: {},
    });

    expect(members).toHaveLength(2);
    expect(prisma.employeePosition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'biz-1',
          active: true,
        }),
      })
    );
  });

  it('resolveAudienceMembers resolves DEPARTMENT audience via position.departmentId', async () => {
    vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([
      { id: 'ep-3', userId: 'user-3' },
    ] as never);

    await resolveAudienceMembers({
      businessId: 'biz-1',
      audienceType: WorkforceAudienceType.DEPARTMENT,
      spec: { departmentIds: ['dept-1'] },
    });

    expect(prisma.employeePosition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          position: { departmentId: { in: ['dept-1'] } },
        }),
      })
    );
  });

  it('resolveAudienceMembers resolves BUSINESS_ROLE audience via business members', async () => {
    vi.spyOn(prisma.businessMember, 'findMany').mockResolvedValue([
      { userId: 'admin-1' },
    ] as never);
    vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([
      { id: 'ep-admin', userId: 'admin-1' },
    ] as never);

    const members = await resolveAudienceMembers({
      businessId: 'biz-1',
      audienceType: WorkforceAudienceType.BUSINESS_ROLE,
      spec: { roles: ['ADMIN'] },
    });

    expect(members).toEqual([{ userId: 'admin-1', employeePositionId: 'ep-admin' }]);
  });

  it('resolveAudienceForPublish materializes audience resolutions', async () => {
    vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([
      { id: 'ep-1', userId: 'user-1' },
    ] as never);
    vi.spyOn(prisma.workforceAudienceResolution, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.workforceAudienceResolution, 'createMany').mockResolvedValue({ count: 1 });

    const members = await resolveAudienceForPublish({
      businessId: 'biz-1',
      communicationId: 'comm-1',
      audienceType: WorkforceAudienceType.BUSINESS,
      spec: {},
    });

    expect(members).toHaveLength(1);
    expect(prisma.workforceAudienceResolution.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            communicationId: 'comm-1',
            userId: 'user-1',
            employeePositionId: 'ep-1',
          }),
        ],
      })
    );
  });

  it('estimateAudienceCount returns deduped member count', async () => {
    vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([
      { id: 'ep-1', userId: 'user-1' },
      { id: 'ep-2', userId: 'user-1' },
    ] as never);

    const count = await estimateAudienceCount({
      businessId: 'biz-1',
      audienceType: WorkforceAudienceType.BUSINESS,
      spec: {},
    });

    expect(count).toBe(1);
  });
});
