import * as bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

export interface AdminUserListFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export async function listUsers(filters: AdminUserListFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
      { userNumber: { contains: filters.search } },
    ];
  }
  if (filters.role) {
    where.role = filters.role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        userNumber: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        _count: {
          select: {
            businesses: true,
            files: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserDetailsForAdmin(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      businesses: true,
      files: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function recordUserStatusUpdateAttempt(params: {
  adminId: string;
  userId: string;
  status: string;
  reason?: string;
}) {
  await logger.info('Admin attempted to update user status', {
    operation: 'admin_update_user_status',
    adminId: params.adminId,
    userId: params.userId,
    status: params.status,
    reason: params.reason || 'No reason provided',
  });

  return prisma.user.findUnique({
    where: { id: params.userId },
  });
}

export async function initiatePasswordReset(params: { adminId: string; userId: string }) {
  await logger.logSecurityEvent('password_reset_initiated', 'medium', {
    operation: 'admin_reset_user_password',
    adminId: params.adminId,
    userId: params.userId,
  });

  return { message: 'Password reset initiated' as const };
}

/** Legacy AdminService.resetUserPassword behavior (actual hash + return message). */
export async function resetUserPasswordLegacy(userId: string, adminId: string) {
  const newPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await logger.logSecurityEvent('password_reset_by_admin', 'medium', {
    operation: 'admin_reset_user_password',
    adminId,
    userId,
  });

  return { message: 'Password reset successfully' as const };
}

/** Extended details shape used by AdminService facade callers. */
export async function getUserDetailsExtended(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      businesses: {
        include: {
          business: true,
        },
      },
      files: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      subscriptions: true,
      activities: {
        take: 20,
        orderBy: { timestamp: 'desc' },
      },
    },
  });
}

export async function updateUserStatusLegacy(
  userId: string,
  status: string,
  adminId: string,
  reason?: string,
) {
  await logger.info('Admin attempted to update user status', {
    operation: 'admin_update_user_status',
    adminId,
    userId,
    status,
    reason: reason || 'No reason provided',
  });

  return prisma.user.findUnique({
    where: { id: userId },
  });
}
