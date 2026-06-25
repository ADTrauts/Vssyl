import { describe, expect, it, vi, beforeEach } from 'vitest';
import { WorkforceCommunicationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as workforcePolicyDual from '../../auth/workforceCommsPolicyDual';
import { searchAccessibleWorkforceComms } from '../workforceVisibilityService';

describe('searchAccessibleWorkforceComms', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(workforcePolicyDual, 'evaluateWorkforceCommsPolicyDual').mockResolvedValue({
      blocked: false,
    });
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      businessId: 'biz-1',
    } as never);
  });

  it('returns empty for short queries', async () => {
    const results = await searchAccessibleWorkforceComms({
      userId: 'u1',
      query: 'a',
      businessId: 'biz-1',
    });
    expect(results).toEqual([]);
  });

  it('returns published communications when policy allows', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findMany').mockResolvedValue([
      {
        id: 'comm-1',
        title: 'Safety briefing',
        summary: 'Weekly update',
        communicationType: 'ANNOUNCEMENT',
        businessId: 'biz-1',
        publishedAt: new Date(),
        updatedAt: new Date(),
        status: WorkforceCommunicationStatus.PUBLISHED,
      },
    ] as never);
    vi.spyOn(prisma.workforceCampaign, 'findMany').mockResolvedValue([] as never);

    const results = await searchAccessibleWorkforceComms({
      userId: 'u1',
      query: 'safety',
      businessId: 'biz-1',
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      entityType: 'communication',
      id: 'comm-1',
      title: 'Safety briefing',
    });
  });

  it('filters communications blocked by policy engine', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findMany').mockResolvedValue([
      {
        id: 'comm-2',
        title: 'Confidential memo',
        summary: null,
        communicationType: 'POLICY',
        businessId: 'biz-1',
        publishedAt: new Date(),
        updatedAt: new Date(),
        status: WorkforceCommunicationStatus.PUBLISHED,
      },
    ] as never);
    vi.spyOn(prisma.workforceCampaign, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(workforcePolicyDual, 'evaluateWorkforceCommsPolicyDual').mockResolvedValue({
      blocked: true,
    });

    const results = await searchAccessibleWorkforceComms({
      userId: 'u1',
      query: 'confidential',
      businessId: 'biz-1',
    });

    expect(results).toEqual([]);
  });
});
