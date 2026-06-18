import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../../lib/prisma';
import * as bootstrap from '../businessBootstrapService';
import * as activity from '../businessActivityService';
import { createBusiness } from '../businessProfileService';

describe('businessProfileService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(activity, 'recordBusinessCreated').mockResolvedValue(undefined);
    vi.spyOn(bootstrap, 'provisionNewBusiness').mockResolvedValue(undefined);
  });

  it('createBusiness rejects duplicate EIN', async () => {
    vi.spyOn(prisma.business, 'findUnique').mockResolvedValue({ id: 'existing' } as never);

    await expect(
      createBusiness({
        actorUserId: 'user-1',
        data: { name: 'Acme', ein: '12-3456789' },
      })
    ).rejects.toMatchObject({ message: 'Business with this EIN already exists', httpStatus: 400 });
  });

  it('createBusiness provisions bootstrap and records activity', async () => {
    vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.business, 'create').mockResolvedValue({
      id: 'biz-1',
      name: 'Acme',
      members: [],
      dashboards: [],
    } as never);

    const result = await createBusiness({
      actorUserId: 'user-1',
      data: { name: 'Acme', ein: '12-3456789' },
    });

    expect(result.id).toBe('biz-1');
    expect(bootstrap.provisionNewBusiness).toHaveBeenCalledWith({
      businessId: 'biz-1',
      businessName: 'Acme',
      ownerUserId: 'user-1',
    });
    expect(activity.recordBusinessCreated).toHaveBeenCalledWith({
      actorUserId: 'user-1',
      businessId: 'biz-1',
      name: 'Acme',
    });
  });
});
