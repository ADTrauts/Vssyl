import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../../lib/prisma';
import { installCoreBusinessModules, provisionBusinessCalendar } from '../businessBootstrapService';

describe('businessBootstrapService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provisionBusinessCalendar creates primary business calendar', async () => {
    const createSpy = vi.spyOn(prisma.calendar, 'create').mockResolvedValue({ id: 'cal-1' } as never);

    await provisionBusinessCalendar({
      businessId: 'biz-1',
      businessName: 'Acme',
      ownerUserId: 'user-1',
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contextType: 'BUSINESS',
          contextId: 'biz-1',
          isPrimary: true,
        }),
      })
    );
  });

  it('installCoreBusinessModules installs drive, chat, and calendar', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({ id: 'drive' } as never);
    vi.spyOn(prisma.businessModuleInstallation, 'findFirst').mockResolvedValue(null);
    const installSpy = vi
      .spyOn(prisma.businessModuleInstallation, 'create')
      .mockResolvedValue({ id: 'inst-1' } as never);

    await installCoreBusinessModules({
      businessId: 'biz-1',
      installedByUserId: 'user-1',
    });

    expect(installSpy).toHaveBeenCalledTimes(3);
  });
});
