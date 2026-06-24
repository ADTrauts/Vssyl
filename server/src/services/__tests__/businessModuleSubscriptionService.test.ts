import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  moduleRequiresBusinessSubscription,
  ensureFreeBusinessModuleSubscription,
  upsertPaidBusinessModuleSubscription,
  evaluateBusinessModuleEntitlement,
} from '../businessModuleSubscriptionService';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/logger.js', () => ({
  logger: {
    info: vi.fn().mockResolvedValue(undefined),
    warn: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('businessModuleSubscriptionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      manifest: {
        moduleScope: 'business',
        supportedContexts: ['business'],
      },
    } as never);
  });

  it('moduleRequiresBusinessSubscription excludes free and proprietary', () => {
    expect(moduleRequiresBusinessSubscription({ pricingTier: 'free' })).toBe(false);
    expect(
      moduleRequiresBusinessSubscription({ pricingTier: 'premium', isProprietary: true })
    ).toBe(false);
    expect(
      moduleRequiresBusinessSubscription({ pricingTier: 'premium', isProprietary: false })
    ).toBe(true);
  });

  it('ensureFreeBusinessModuleSubscription is idempotent', async () => {
    const upsertSpy = vi.spyOn(prisma.businessModuleSubscription, 'upsert').mockResolvedValue({
      id: 'sub-1',
      moduleId: 'partner-a',
      businessId: 'biz-1',
      tier: 'free',
      amount: 0,
      status: 'active',
      stripeSubscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(prisma.businessModuleSubscription, 'findUnique').mockResolvedValue(null);

    const first = await ensureFreeBusinessModuleSubscription({
      businessId: 'biz-1',
      moduleId: 'partner-a',
      actorUserId: 'user-1',
    });
    expect(first.created).toBe(true);
    expect(upsertSpy).toHaveBeenCalledTimes(1);

    vi.spyOn(prisma.businessModuleSubscription, 'findUnique').mockResolvedValue({
      id: 'sub-1',
      moduleId: 'partner-a',
      businessId: 'biz-1',
      tier: 'free',
      amount: 0,
      status: 'active',
      stripeSubscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const second = await ensureFreeBusinessModuleSubscription({
      businessId: 'biz-1',
      moduleId: 'partner-a',
      actorUserId: 'user-1',
    });
    expect(second.created).toBe(false);
    expect(second.subscriptionId).toBe('sub-1');
  });

  it('upsertPaidBusinessModuleSubscription writes active paid row', async () => {
    vi.spyOn(prisma.businessModuleSubscription, 'findUnique').mockResolvedValue(null);
    const upsertSpy = vi.spyOn(prisma.businessModuleSubscription, 'upsert').mockResolvedValue({
      id: 'paid-sub',
      moduleId: 'partner-paid',
      businessId: 'biz-2',
      tier: 'premium',
      amount: 9.99,
      status: 'active',
      stripeSubscriptionId: 'sub_stripe_1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await upsertPaidBusinessModuleSubscription({
      businessId: 'biz-2',
      moduleId: 'partner-paid',
      tier: 'premium',
      amount: 9.99,
      stripeSubscriptionId: 'sub_stripe_1',
      actorUserId: 'user-2',
    });

    expect(result.subscriptionId).toBe('paid-sub');
    expect(upsertSpy).toHaveBeenCalled();
  });

  it('evaluateBusinessModuleEntitlement denies without active subscription for paid modules', async () => {
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      id: 'm1',
      businessId: 'biz-1',
      userId: 'u1',
      isActive: true,
    } as never);
    vi.spyOn(prisma.businessModuleSubscription, 'findUnique').mockResolvedValue({
      id: 's1',
      status: 'cancelled',
      moduleId: 'paid-mod',
      businessId: 'biz-1',
      tier: 'premium',
      amount: 10,
      stripeSubscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await evaluateBusinessModuleEntitlement({
      businessId: 'biz-1',
      moduleId: 'paid-mod',
      module: { pricingTier: 'premium', isProprietary: false, status: 'APPROVED' },
      installation: { enabled: true },
      userId: 'u1',
    });

    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(402);
  });

  it('evaluateBusinessModuleEntitlement denies when module scope is not business-compatible', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      manifest: {
        moduleScope: 'personal',
        supportedContexts: ['personal'],
      },
    } as never);
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      id: 'm1',
      businessId: 'biz-1',
      userId: 'u1',
      isActive: true,
    } as never);

    const result = await evaluateBusinessModuleEntitlement({
      businessId: 'biz-1',
      moduleId: 'personal-mod',
      module: { pricingTier: 'free', status: 'APPROVED' },
      installation: { enabled: true },
      userId: 'u1',
    });

    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.reason).toContain('scope');
  });

  it('evaluateBusinessModuleEntitlement allows free modules without subscription row', async () => {
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      id: 'm1',
      businessId: 'biz-1',
      userId: 'u1',
      isActive: true,
    } as never);

    const result = await evaluateBusinessModuleEntitlement({
      businessId: 'biz-1',
      moduleId: 'free-mod',
      module: { pricingTier: 'free', status: 'APPROVED' },
      installation: { enabled: true },
      userId: 'u1',
    });

    expect(result.allowed).toBe(true);
  });

  it('evaluateBusinessModuleEntitlement denies disabled installation', async () => {
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      id: 'm1',
      businessId: 'biz-1',
      userId: 'u1',
      isActive: true,
    } as never);

    const result = await evaluateBusinessModuleEntitlement({
      businessId: 'biz-1',
      moduleId: 'free-mod',
      module: { pricingTier: 'free', status: 'APPROVED' },
      installation: { enabled: false },
      userId: 'u1',
    });

    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(403);
  });
});
