import { describe, expect, it, vi, beforeEach } from 'vitest';
import { probeBusinessModuleBilling } from '../businessBillingProbe';
import { prisma } from '../../lib/prisma';

describe('businessBillingProbe', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reports ready for free installed module', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      id: 'free-mod',
      pricingTier: 'free',
      isProprietary: false,
      status: 'APPROVED',
      basePrice: 0,
      stripePriceId: null,
    } as never);
    vi.spyOn(prisma.businessModuleInstallation, 'findUnique').mockResolvedValue({
      enabled: true,
    } as never);
    vi.spyOn(prisma.businessModuleSubscription, 'findUnique').mockResolvedValue(null);

    const result = await probeBusinessModuleBilling({
      moduleId: 'free-mod',
      businessId: 'biz-1',
    });

    expect(result.installReady).toBe(true);
    expect(result.requiresBusinessSubscription).toBe(false);
  });

  it('blocks paid module without subscription', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      id: 'paid-mod',
      pricingTier: 'premium',
      isProprietary: false,
      status: 'APPROVED',
      basePrice: 9.99,
      stripePriceId: null,
    } as never);
    vi.spyOn(prisma.businessModuleInstallation, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.businessModuleSubscription, 'findUnique').mockResolvedValue(null);

    const result = await probeBusinessModuleBilling({
      moduleId: 'paid-mod',
      businessId: 'biz-1',
    });

    expect(result.ok).toBe(false);
    expect(result.blockers).toContain('missing_active_business_subscription');
  });
});
