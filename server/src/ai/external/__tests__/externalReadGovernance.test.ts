import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUnique } = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    businessAIDigitalTwin: {
      findUnique,
    },
  },
}));

import { assertBusinessExternalReadAllowed } from '../externalReadGovernance';

describe('assertBusinessExternalReadAllowed', () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it('allows personal scope without business twin lookup', async () => {
    const result = await assertBusinessExternalReadAllowed({ userId: 'u1' });
    expect(result.allowed).toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('denies when business externalAPIAccess is false', async () => {
    findUnique.mockResolvedValue({
      restrictions: { externalAPIAccess: false },
      status: 'active',
      allowEmployeeInteraction: true,
    });

    const result = await assertBusinessExternalReadAllowed({
      userId: 'u1',
      businessId: 'biz-1',
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('business_external_api_denied');
  });

  it('allows when business externalAPIAccess is not false', async () => {
    findUnique.mockResolvedValue({
      restrictions: { externalAPIAccess: true },
      status: 'active',
      allowEmployeeInteraction: true,
    });

    const result = await assertBusinessExternalReadAllowed({
      userId: 'u1',
      businessId: 'biz-1',
    });

    expect(result.allowed).toBe(true);
  });
});
