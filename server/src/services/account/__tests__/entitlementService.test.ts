import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  compareTiers,
  isPlatformTier,
  normalizeTier,
} from '../entitlementTypes';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    subscription: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    business: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    businessMember: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../entitlementActivityService', () => ({
  recordSubscriptionTierChanged: vi.fn(),
  recordEntitlementGranted: vi.fn(),
  recordBusinessEntitlementsUpdated: vi.fn(),
}));

vi.mock('../entitlementDomainEventService', () => ({
  emitSubscriptionTierChangedEvent: vi.fn(),
  emitEntitlementGrantedEvent: vi.fn(),
  emitBusinessEntitlementsUpdatedEvent: vi.fn(),
}));

vi.mock('../../featureGatingService', () => ({
  FeatureGatingService: {
    getAllFeatures: vi.fn(() => ({
      basic_modules: {
        name: 'Basic Modules',
        requiredTier: 'free',
        module: 'core',
        category: 'personal',
        description: 'Core modules',
      },
      all_modules: {
        name: 'All Modules',
        requiredTier: 'pro',
        module: 'core',
        category: 'personal',
        description: 'All modules',
      },
      team_management: {
        name: 'Team Management',
        requiredTier: 'business_basic',
        module: 'business',
        category: 'business',
        description: 'Team management',
      },
    })),
    getFeatureConfig: vi.fn((key: string) => {
      const map: Record<string, { requiredTier: string }> = {
        all_modules: { requiredTier: 'pro' },
        team_management: { requiredTier: 'business_basic' },
      };
      return map[key] ? { requiredTier: map[key].requiredTier } : null;
    }),
    checkModuleAccess: vi.fn(async () => ({
      hasAccess: true,
      missingFeatures: [],
      availableFeatures: ['basic_modules'],
    })),
  },
}));

import { prisma } from '../../../lib/prisma';
import {
  resolveTier,
  resolveEffectiveEntitlements,
  hasFeature,
  setBusinessTierAuthority,
  syncBusinessTierCache,
} from '../entitlementService';

describe('entitlementTypes', () => {
  it('normalizeTier maps legacy standard to pro for personal context', () => {
    expect(normalizeTier('standard', false)).toBe('pro');
  });

  it('normalizeTier maps legacy standard to business_basic for business context', () => {
    expect(normalizeTier('standard', true)).toBe('business_basic');
  });

  it('compareTiers respects hierarchy', () => {
    expect(compareTiers('enterprise', 'business_basic')).toBe(true);
    expect(compareTiers('free', 'pro')).toBe(false);
  });

  it('isPlatformTier validates canonical tiers', () => {
    expect(isPlatformTier('business_advanced')).toBe(true);
    expect(isPlatformTier('standard')).toBe(false);
  });
});

describe('entitlementService.resolveTier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns subscription tier as authoritative for business context', async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
      id: 'sub-1',
      tier: 'business_advanced',
      status: 'active',
    } as Awaited<ReturnType<typeof prisma.subscription.findFirst>>);

    const result = await resolveTier({ userId: 'user-1', businessId: 'biz-1' });

    expect(result.tier).toBe('business_advanced');
    expect(result.source).toBe('subscription');
    expect(result.subscriptionId).toBe('sub-1');
  });

  it('falls back to business cache when no active subscription', async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.business.findUnique).mockResolvedValue({
      tier: 'enterprise',
    } as Awaited<ReturnType<typeof prisma.business.findUnique>>);

    const result = await resolveTier({ userId: 'user-1', businessId: 'biz-1' });

    expect(result.tier).toBe('enterprise');
    expect(result.source).toBe('business_cache');
  });

  it('defaults to free for personal context without subscription', async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

    const result = await resolveTier({ userId: 'user-1' });

    expect(result.tier).toBe('free');
    expect(result.source).toBe('default');
  });
});

describe('entitlementService.resolveEffectiveEntitlements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes personal features for pro tier', async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
      id: 'sub-2',
      tier: 'pro',
      status: 'active',
    } as Awaited<ReturnType<typeof prisma.subscription.findFirst>>);

    const result = await resolveEffectiveEntitlements({ userId: 'user-1' });

    expect(result.tier).toBe('pro');
    expect(result.features).toContain('basic_modules');
    expect(result.features).toContain('all_modules');
    expect(result.features).not.toContain('team_management');
  });
});

describe('entitlementService.hasFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('denies feature when tier is insufficient', async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

    const result = await hasFeature({ userId: 'user-1' }, 'all_modules');

    expect(result.allowed).toBe(false);
    expect(result.tier).toBe('free');
  });
});

describe('entitlementService.setBusinessTierAuthority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates existing subscription and syncs business cache', async () => {
    vi.mocked(prisma.business.findUnique).mockResolvedValue({
      id: 'biz-1',
      name: 'Acme',
    } as Awaited<ReturnType<typeof prisma.business.findUnique>>);
    vi.mocked(prisma.businessMember.findFirst).mockResolvedValue({
      userId: 'admin-1',
    } as Awaited<ReturnType<typeof prisma.businessMember.findFirst>>);
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
      id: 'sub-existing',
      tier: 'free',
    } as Awaited<ReturnType<typeof prisma.subscription.findFirst>>);
    vi.mocked(prisma.subscription.update).mockResolvedValue({
      id: 'sub-existing',
      tier: 'enterprise',
    } as Awaited<ReturnType<typeof prisma.subscription.update>>);
    vi.mocked(prisma.business.update).mockResolvedValue({
      id: 'biz-1',
      tier: 'enterprise',
    } as Awaited<ReturnType<typeof prisma.business.update>>);

    const result = await setBusinessTierAuthority({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      tier: 'enterprise',
    });

    expect(result.subscriptionId).toBe('sub-existing');
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-existing' },
      data: { tier: 'enterprise' },
    });
    expect(prisma.business.update).toHaveBeenCalledWith({
      where: { id: 'biz-1' },
      data: { tier: 'enterprise' },
    });
  });
});

describe('entitlementService.syncBusinessTierCache', () => {
  it('writes derived tier to business row', async () => {
    vi.mocked(prisma.business.update).mockResolvedValue({
      id: 'biz-1',
      tier: 'business_basic',
    } as Awaited<ReturnType<typeof prisma.business.update>>);

    await syncBusinessTierCache('biz-1', 'business_basic');

    expect(prisma.business.update).toHaveBeenCalledWith({
      where: { id: 'biz-1' },
      data: { tier: 'business_basic' },
    });
  });
});
