import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POLICY_ACTIONS } from '../../../auth/policyActions';

const { mockCancelSubscription } = vi.hoisted(() => ({
  mockCancelSubscription: vi.fn(),
}));

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    business: {
      update: vi.fn(),
    },
  },
}));

vi.mock('../../subscriptionService', () => ({
  SubscriptionService: vi.fn().mockImplementation(() => ({
    createSubscription: vi.fn(),
    updateSubscription: vi.fn(),
    cancelSubscription: mockCancelSubscription,
    reactivateSubscription: vi.fn(),
  })),
}));

vi.mock('../../stripeSyncService', () => ({
  StripeSyncService: {
    syncSubscriptionFromStripe: vi.fn(),
  },
}));

vi.mock('../../../auth/billingPolicyDual', () => ({
  assertBillingReadPolicy: vi.fn(),
  assertBillingWritePolicy: vi.fn(),
}));

vi.mock('../entitlementService', () => ({
  syncBusinessTierCache: vi.fn(),
}));

vi.mock('../billingActivityService', () => ({
  recordSubscriptionCreated: vi.fn(),
  recordSubscriptionUpdated: vi.fn(),
  recordSubscriptionCancelled: vi.fn(),
  recordSubscriptionResumed: vi.fn(),
  recordBillingSyncCompleted: vi.fn(),
}));

vi.mock('../billingDomainEventService', () => ({
  emitSubscriptionCreatedEvent: vi.fn(),
  emitSubscriptionUpdatedEvent: vi.fn(),
  emitSubscriptionCancelledEvent: vi.fn(),
  emitSubscriptionResumedEvent: vi.fn(),
  emitBillingSyncCompletedEvent: vi.fn(),
}));

import { prisma } from '../../../lib/prisma';
import { assertBillingWritePolicy } from '../../../auth/billingPolicyDual';
import { syncBusinessTierCache } from '../entitlementService';
import {
  resolveSubscription,
  cancelSubscription,
  upsertSubscriptionFromCheckout,
} from '../billingService';

describe('billingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolveSubscription returns personal active subscription', async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
      id: 'sub-1',
      tier: 'pro',
      userId: 'user-1',
      businessId: null,
      status: 'active',
    } as Awaited<ReturnType<typeof prisma.subscription.findFirst>>);

    const result = await resolveSubscription({ userId: 'user-1' });
    expect(result?.id).toBe('sub-1');
  });

  it('cancelSubscription authorizes, cancels, and emits lifecycle', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      businessId: 'biz-1',
      tier: 'business_advanced',
      status: 'active',
    } as Awaited<ReturnType<typeof prisma.subscription.findUnique>>);

    mockCancelSubscription.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      businessId: 'biz-1',
      tier: 'business_advanced',
      status: 'cancelled',
    });

    const result = await cancelSubscription({
      actorUserId: 'user-1',
      userId: 'user-1',
      subscriptionId: 'sub-1',
    });

    expect(assertBillingWritePolicy).toHaveBeenCalled();
    expect(mockCancelSubscription).toHaveBeenCalledWith('sub-1');
    expect(result.status).toBe('cancelled');
  });

  it('upsertSubscriptionFromCheckout syncs business entitlement cache', async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.subscription.create).mockResolvedValue({
      id: 'sub-new',
      userId: 'user-1',
      businessId: 'biz-1',
      tier: 'enterprise',
      status: 'active',
    } as Awaited<ReturnType<typeof prisma.subscription.create>>);

    await upsertSubscriptionFromCheckout('user-1', {
      userId: 'user-1',
      businessId: 'biz-1',
      tier: 'enterprise',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      stripeSubscriptionId: 'stripe-sub-1',
      stripeCustomerId: 'cus_1',
      cancelAtPeriodEnd: false,
    });

    expect(syncBusinessTierCache).toHaveBeenCalledWith('biz-1', 'enterprise');
  });
});

describe('billing policy actions', () => {
  it('registers billing read/write actions', () => {
    expect(POLICY_ACTIONS.BILLING_READ).toBe('billing:read');
    expect(POLICY_ACTIONS.BILLING_WRITE).toBe('billing:write');
  });
});
