import { prisma } from '../../lib/prisma';
import { assertActiveMember } from './businessAccessService';

function resolveStartDate(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function getBusinessAnalytics(params: {
  userId: string;
  businessId: string;
  timeRange?: string;
}) {
  await assertActiveMember(params.userId, params.businessId);

  const timeRange = typeof params.timeRange === 'string' ? params.timeRange : '30d';
  const now = new Date();
  const startDate = resolveStartDate(timeRange);

  const [memberCount, dashboardCount, fileCount, conversationCount, storageUsed] =
    await Promise.all([
      prisma.businessMember.count({
        where: { businessId: params.businessId, isActive: true },
      }),
      prisma.dashboard.count({ where: { businessId: params.businessId } }),
      prisma.file.count({
        where: {
          user: {
            businesses: {
              some: { businessId: params.businessId, isActive: true },
            },
          },
          createdAt: { gte: startDate },
        },
      }),
      prisma.conversation.count({
        where: {
          participants: {
            some: {
              user: {
                businesses: {
                  some: { businessId: params.businessId, isActive: true },
                },
              },
            },
          },
          createdAt: { gte: startDate },
        },
      }),
      prisma.file.aggregate({
        where: {
          user: {
            businesses: {
              some: { businessId: params.businessId, isActive: true },
            },
          },
        },
        _sum: { size: true },
      }),
    ]);

  return {
    memberCount,
    dashboardCount,
    fileCount,
    conversationCount,
    storageUsed: storageUsed._sum?.size || 0,
    timeRange,
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
  };
}

export async function getBusinessModuleAnalytics(userId: string, businessId: string) {
  await assertActiveMember(userId, businessId);

  return {
    modules: [],
    totalModules: 0,
    totalInstallations: 0,
    activeInstallations: 0,
    memberCount: 0,
    moduleAdoptionRate: 0,
  };
}
