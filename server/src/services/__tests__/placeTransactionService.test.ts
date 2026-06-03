import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as placePolicyDual from '../place/placePolicyDual';
import * as placePermission from '../place/placePermissionService';
import { PlaceServiceError } from '../place/placeErrors';
import {
  createTransaction,
  getInteractionStats,
  getTransaction,
  listTransactions,
  trackInteractionClick,
} from '../place/placeTransactionService';

describe('placeTransactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(placePolicyDual, 'assertPlacePolicyAllowed').mockResolvedValue(undefined);
    vi.spyOn(placePermission, 'assertCanReadListingAdmin').mockResolvedValue({
      id: 'member-1',
      userId: 'u1',
      businessId: 'biz-1',
      role: 'ADMIN',
      isActive: true,
      title: null,
      department: null,
      jobId: null,
      joinedAt: new Date(),
      leftAt: null,
      canInvite: true,
      canManage: true,
      canBilling: false,
    });
  });

  it('creates external click transaction with policy check', async () => {
    vi.spyOn(prisma.placeTransaction, 'create').mockResolvedValue({ id: 'tx-1' } as never);

    const tx = await createTransaction({
      userId: 'u1',
      businessId: 'biz-1',
      type: 'EXTERNAL_CLICK',
    });

    expect(tx).toEqual({ id: 'tx-1' });
    expect(placePolicyDual.assertPlacePolicyAllowed).toHaveBeenCalled();
  });

  it('lists transactions for owner', async () => {
    vi.spyOn(prisma.placeTransaction, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.placeTransaction, 'count').mockResolvedValue(0);

    const result = await listTransactions({ userId: 'u1' });

    expect(result.transactions).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it('denies getTransaction for non-owner', async () => {
    vi.spyOn(prisma.placeTransaction, 'findUnique').mockResolvedValue({
      id: 'tx-1',
      userId: 'other',
    } as never);

    await expect(getTransaction({ userId: 'u1', transactionId: 'tx-1' })).rejects.toBeInstanceOf(
      PlaceServiceError
    );
  });

  it('tracks interaction click and creates telemetry transaction', async () => {
    vi.spyOn(prisma.placeInteractionClick, 'create').mockResolvedValue({ id: 'click-1' } as never);
    vi.spyOn(prisma.placeTransaction, 'create').mockResolvedValue({ id: 'tx-1' } as never);

    await trackInteractionClick({
      userId: 'u1',
      businessId: 'biz-1',
      url: 'https://example.com',
    });

    expect(prisma.placeInteractionClick.create).toHaveBeenCalled();
    expect(prisma.placeTransaction.create).toHaveBeenCalled();
  });

  it('requires listing admin for interaction stats', async () => {
    vi.spyOn(placePermission, 'assertCanReadListingAdmin').mockRejectedValue(
      new PlaceServiceError('Forbidden', 'forbidden', 403)
    );

    await expect(
      getInteractionStats({ userId: 'u1', businessId: 'biz-1' })
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});
