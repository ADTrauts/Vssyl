import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  getDeveloperPayouts,
  getPayments,
  getSubscriptions,
} from '../admin/adminBillingService';

describe('adminBillingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSubscriptions returns paginated subscriptions with summary', async () => {
    vi.spyOn(prisma.subscription, 'findMany').mockResolvedValue([
      {
        id: 'sub-1',
        status: 'active',
        additionalEmployeeCost: 25,
        createdAt: new Date('2026-06-01'),
        user: { email: 'user@test.com', name: 'User' },
      },
    ] as never);
    vi.spyOn(prisma.subscription, 'count').mockResolvedValue(1);
    vi.spyOn(prisma.subscription, 'aggregate').mockResolvedValue({
      _sum: { additionalEmployeeCost: 25 },
      _count: { id: 1 },
    } as never);
    vi.spyOn(prisma.subscription, 'groupBy').mockResolvedValue([
      { status: 'active', _count: { id: 1 } },
    ] as never);

    const result = await getSubscriptions({ page: 1, limit: 10, status: 'active' });

    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'active' },
        take: 10,
        skip: 0,
      }),
    );
    expect(result.total).toBe(1);
    expect(result.summary.activeCount).toBe(1);
    expect(result.summary.totalAmount).toBe(25);
    expect(result.schemaOutOfSync).toBe(false);
  });

  it('getSubscriptions returns schemaOutOfSync fallback on drift errors', async () => {
    vi.spyOn(prisma.subscription, 'findMany').mockRejectedValue(
      new Error('column "foo" does not exist in the current database'),
    );

    const result = await getSubscriptions({ page: 1, limit: 20 });

    expect(result.schemaOutOfSync).toBe(true);
    expect(result.subscriptions).toEqual([]);
    expect(result.summary.totalSubscriptions).toBe(0);
  });

  it('getPayments queries invoices with pagination', async () => {
    vi.spyOn(prisma.invoice, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.invoice, 'count').mockResolvedValue(0);

    const result = await getPayments({ page: 2, limit: 5, status: 'paid' });

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'paid' },
        take: 5,
        skip: 5,
      }),
    );
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(0);
  });

  it('getDeveloperPayouts returns payout rows and summary', async () => {
    vi.spyOn(prisma.developerRevenue, 'findMany').mockResolvedValue([
      {
        id: 'rev-1',
        developerId: 'dev-1',
        developerRevenue: 100,
        totalRevenue: 120,
        platformRevenue: 20,
        payoutStatus: 'pending',
        createdAt: new Date('2026-06-01'),
        periodStart: new Date('2026-05-01'),
        periodEnd: new Date('2026-05-31'),
        payoutDate: null,
        developer: { id: 'dev-1', name: 'Dev', email: 'dev@test.com' },
        module: { id: 'mod-1', name: 'Module' },
      },
    ] as never);
    vi.spyOn(prisma.developerRevenue, 'count').mockResolvedValue(1);
    vi.spyOn(prisma.developerRevenue, 'aggregate').mockResolvedValue({
      _sum: { totalRevenue: 100, platformRevenue: 20, developerRevenue: 80 },
    } as never);
    vi.spyOn(prisma.developerRevenue, 'groupBy').mockResolvedValue([
      { payoutStatus: 'pending', _count: { id: 1 }, _sum: { developerRevenue: 100 } },
    ] as never);

    const result = await getDeveloperPayouts({ page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.summary.pendingAmount).toBe(100);
    expect(result.summary.pendingCount).toBe(1);
  });
});
