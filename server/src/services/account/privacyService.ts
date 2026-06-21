import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { assertIdentitySelfPolicy } from '../../auth/identityPolicyDual';
import { recordPrivacyUpdated } from './identityActivityService';

export class PrivacyServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'PrivacyServiceError';
  }
}

export async function getOrCreatePrivacySettings(userId: string) {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PRIVACY_READ,
  });
  let settings = await prisma.userPrivacySettings.findUnique({
    where: { userId },
  });
  if (!settings) {
    settings = await prisma.userPrivacySettings.create({
      data: {
        userId,
        profileVisibility: 'PUBLIC',
        activityVisibility: 'PUBLIC',
        allowDataProcessing: true,
        allowMarketingEmails: false,
        allowAnalytics: true,
        allowAuditLogs: true,
        dataRetentionPeriod: 2555,
      },
    });
  }
  return settings;
}

export async function updatePrivacySettings(
  userId: string,
  body: Record<string, unknown>
) {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PRIVACY_UPDATE,
  });
  const {
    profileVisibility,
    activityVisibility,
    allowDataProcessing,
    allowMarketingEmails,
    allowAnalytics,
    allowAuditLogs,
    dataRetentionPeriod,
    allowCollectiveLearning,
  } = body;

  const settings = await prisma.userPrivacySettings.upsert({
    where: { userId },
    update: {
      profileVisibility: profileVisibility as string | undefined,
      activityVisibility: activityVisibility as string | undefined,
      allowDataProcessing: allowDataProcessing as boolean | undefined,
      allowMarketingEmails: allowMarketingEmails as boolean | undefined,
      allowAnalytics: allowAnalytics as boolean | undefined,
      allowAuditLogs: allowAuditLogs as boolean | undefined,
      dataRetentionPeriod: dataRetentionPeriod as number | undefined,
      ...(typeof allowCollectiveLearning === 'boolean' ? { allowCollectiveLearning } : {}),
    },
    create: {
      userId,
      profileVisibility: (profileVisibility as string) || 'PUBLIC',
      activityVisibility: (activityVisibility as string) || 'PUBLIC',
      allowDataProcessing: allowDataProcessing !== undefined ? Boolean(allowDataProcessing) : true,
      allowMarketingEmails: allowMarketingEmails !== undefined ? Boolean(allowMarketingEmails) : false,
      allowAnalytics: allowAnalytics !== undefined ? Boolean(allowAnalytics) : true,
      allowAuditLogs: allowAuditLogs !== undefined ? Boolean(allowAuditLogs) : true,
      dataRetentionPeriod: (dataRetentionPeriod as number) || 2555,
      allowCollectiveLearning:
        typeof allowCollectiveLearning === 'boolean' ? allowCollectiveLearning : false,
    },
  });
  await recordPrivacyUpdated(userId);
  return settings;
}

export async function listUserConsents(userId: string) {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PRIVACY_READ,
  });
  return prisma.userConsent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function grantConsent(
  userId: string,
  consentType: string,
  version: string,
  ipAddress?: string,
  userAgent?: string
) {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PRIVACY_UPDATE,
  });
  return prisma.userConsent.upsert({
    where: {
      userId_consentType_version: { userId, consentType, version },
    },
    update: {
      granted: true,
      grantedAt: new Date(),
      revokedAt: null,
      ipAddress,
      userAgent,
    },
    create: {
      userId,
      consentType,
      version,
      granted: true,
      grantedAt: new Date(),
      ipAddress,
      userAgent,
    },
  });
}

export async function revokeConsent(userId: string, consentType: string, version: string) {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PRIVACY_UPDATE,
  });
  return prisma.userConsent.update({
    where: {
      userId_consentType_version: { userId, consentType, version },
    },
    data: {
      granted: false,
      revokedAt: new Date(),
    },
  });
}

export async function requestDataDeletion(userId: string, reason?: string) {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PRIVACY_UPDATE,
  });
  const existingRequest = await prisma.dataDeletionRequest.findFirst({
    where: {
      userId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
  });
  if (existingRequest) {
    throw new PrivacyServiceError('You already have a pending data deletion request', 400);
  }
  return prisma.dataDeletionRequest.create({
    data: {
      userId,
      reason,
      status: 'PENDING',
    },
  });
}

export async function listDeletionRequests(userId: string) {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PRIVACY_READ,
  });
  return prisma.dataDeletionRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function exportUserData(userId: string) {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PRIVACY_READ,
  });
  const [userData, files, conversations, dashboards, modules, auditLogs, consents, privacySettings] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.file.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          size: true,
          type: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.conversation.findMany({
        where: {
          participants: {
            some: { userId },
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.dashboard.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.moduleInstallation.findMany({
        where: { userId },
        include: {
          module: {
            select: {
              id: true,
              name: true,
              description: true,
              version: true,
            },
          },
        },
      }),
      prisma.auditLog.findMany({
        where: { userId },
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          timestamp: true,
        },
      }),
      prisma.userConsent.findMany({ where: { userId } }),
      prisma.userPrivacySettings.findUnique({ where: { userId } }),
    ]);

  return {
    user: userData,
    files,
    conversations,
    dashboards,
    modules,
    auditLogs,
    consents,
    privacySettings,
    exportedAt: new Date().toISOString(),
  };
}
