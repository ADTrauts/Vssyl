import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkforceCommunicationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as workforcePolicyDual from '../../auth/workforceCommsPolicyDual';
import {
  resolveWorkforceCampaignForVLink,
  resolveWorkforceCommunicationForVLink,
  userCanLinkWorkforceCampaign,
  userCanLinkWorkforceCommunication,
} from '../workforceVlinkAccessService';

describe('workforceVlinkAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(workforcePolicyDual, 'evaluateWorkforceCommsPolicyDual').mockResolvedValue({
      blocked: false,
    });
  });

  it('allows admin to resolve active communication', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findUnique').mockResolvedValue({
      id: 'comm-1',
      title: 'Q3 Update',
      businessId: 'biz-1',
      createdById: 'author-1',
      status: WorkforceCommunicationStatus.PUBLISHED,
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: 'ADMIN',
      canManage: true,
    } as never);

    const result = await resolveWorkforceCommunicationForVLink('admin-1', 'comm-1');

    expect(result).toEqual({
      allowed: true,
      state: 'active',
      title: 'Q3 Update',
      url: '/business/biz-1/workspace/workforce-comms/communications/comm-1',
      ownerUserId: 'author-1',
      businessId: 'biz-1',
    });
    expect(await userCanLinkWorkforceCommunication('admin-1', 'comm-1')).toBe(true);
  });

  it('denies trashed communication (fail closed)', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findUnique').mockResolvedValue({
      id: 'comm-1',
      title: 'Old Update',
      businessId: 'biz-1',
      createdById: 'author-1',
      status: WorkforceCommunicationStatus.PUBLISHED,
      trashedAt: new Date(),
    } as never);

    const result = await resolveWorkforceCommunicationForVLink('admin-1', 'comm-1');

    expect(result).toMatchObject({
      allowed: false,
      state: 'trashed',
      title: 'Old Update',
      ownerUserId: 'author-1',
      businessId: 'biz-1',
    });
    expect(await userCanLinkWorkforceCommunication('admin-1', 'comm-1')).toBe(false);
  });

  it('denies expired communication', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findUnique').mockResolvedValue({
      id: 'comm-1',
      title: 'Expired',
      businessId: 'biz-1',
      createdById: 'author-1',
      status: WorkforceCommunicationStatus.EXPIRED,
      trashedAt: null,
    } as never);

    const result = await resolveWorkforceCommunicationForVLink('admin-1', 'comm-1');

    expect(result.allowed).toBe(false);
    expect(result.state).toBe('active');
  });

  it('allows audience member for published communication', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findUnique').mockResolvedValue({
      id: 'comm-1',
      title: 'Team Note',
      businessId: 'biz-1',
      createdById: 'author-1',
      status: WorkforceCommunicationStatus.PUBLISHED,
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: 'MEMBER',
      canManage: false,
    } as never);
    vi.spyOn(prisma.workforceAudienceResolution, 'findFirst').mockResolvedValue({
      id: 'res-1',
    } as never);

    const result = await resolveWorkforceCommunicationForVLink('member-1', 'comm-1');

    expect(result.allowed).toBe(true);
    expect(result.url).toContain('communications/comm-1');
  });

  it('allows author to resolve active campaign', async () => {
    vi.spyOn(prisma.workforceCampaign, 'findUnique').mockResolvedValue({
      id: 'camp-1',
      name: 'Onboarding Series',
      businessId: 'biz-1',
      createdById: 'author-1',
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: 'MEMBER',
      canManage: false,
    } as never);

    const result = await resolveWorkforceCampaignForVLink('author-1', 'camp-1');

    expect(result).toEqual({
      allowed: true,
      state: 'active',
      title: 'Onboarding Series',
      url: '/business/biz-1/workspace/workforce-comms/campaigns/camp-1',
      ownerUserId: 'author-1',
      businessId: 'biz-1',
    });
    expect(await userCanLinkWorkforceCampaign('author-1', 'camp-1')).toBe(true);
  });

  it('denies trashed campaign (fail closed)', async () => {
    vi.spyOn(prisma.workforceCampaign, 'findUnique').mockResolvedValue({
      id: 'camp-1',
      name: 'Old Campaign',
      businessId: 'biz-1',
      createdById: 'author-1',
      trashedAt: new Date(),
    } as never);

    const result = await resolveWorkforceCampaignForVLink('author-1', 'camp-1');

    expect(result).toMatchObject({
      allowed: false,
      state: 'trashed',
      title: 'Old Campaign',
    });
    expect(await userCanLinkWorkforceCampaign('author-1', 'camp-1')).toBe(false);
  });

  it('fails closed for missing communication', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findUnique').mockResolvedValue(null);

    const result = await resolveWorkforceCommunicationForVLink('user-1', 'missing');

    expect(result).toEqual({ allowed: false, state: 'deleted' });
  });
});
