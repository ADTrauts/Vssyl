import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import {
  getUserDetailsForAdmin,
  initiatePasswordReset,
  listUsers,
  recordUserStatusUpdateAttempt,
} from '../admin/adminUserService';

describe('adminUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listUsers applies search and pagination', async () => {
    vi.spyOn(prisma.user, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.user, 'count').mockResolvedValue(42);

    const result = await listUsers({ page: 2, limit: 10, search: 'alice', role: 'USER' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: expect.objectContaining({
          role: 'USER',
          OR: expect.arrayContaining([
            expect.objectContaining({ email: expect.objectContaining({ contains: 'alice' }) }),
          ]),
        }),
      }),
    );
    expect(result).toEqual({
      users: [],
      total: 42,
      page: 2,
      totalPages: 5,
    });
  });

  it('getUserDetailsForAdmin includes businesses and limited files', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'user-1' } as never);

    await getUserDetailsForAdmin('user-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      include: {
        businesses: true,
        files: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  });

  it('recordUserStatusUpdateAttempt logs and returns user', async () => {
    vi.spyOn(logger, 'info').mockResolvedValue(undefined as never);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'user-1', email: 'u@test.com' } as never);

    const user = await recordUserStatusUpdateAttempt({
      adminId: 'admin-1',
      userId: 'user-1',
      status: 'suspended',
      reason: 'policy',
    });

    expect(logger.info).toHaveBeenCalledWith(
      'Admin attempted to update user status',
      expect.objectContaining({
        operation: 'admin_update_user_status',
        adminId: 'admin-1',
        userId: 'user-1',
        status: 'suspended',
      }),
    );
    expect(user).toEqual({ id: 'user-1', email: 'u@test.com' });
  });

  it('initiatePasswordReset logs security event and returns message', async () => {
    vi.spyOn(logger, 'logSecurityEvent').mockResolvedValue(undefined as never);

    const result = await initiatePasswordReset({ adminId: 'admin-1', userId: 'user-1' });

    expect(logger.logSecurityEvent).toHaveBeenCalledWith(
      'password_reset_initiated',
      'medium',
      expect.objectContaining({
        operation: 'admin_reset_user_password',
        adminId: 'admin-1',
        userId: 'user-1',
      }),
    );
    expect(result).toEqual({ message: 'Password reset initiated' });
  });
});
