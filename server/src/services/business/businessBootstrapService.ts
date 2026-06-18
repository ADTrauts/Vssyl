import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

const CORE_MODULES = [
  {
    moduleId: 'drive',
    name: 'Drive',
    category: 'PRODUCTIVITY',
    description: 'File management and storage system',
    version: '1.0.0',
  },
  {
    moduleId: 'chat',
    name: 'Chat',
    category: 'COMMUNICATION',
    description: 'Real-time messaging and communication',
    version: '1.0.0',
  },
  {
    moduleId: 'calendar',
    name: 'Calendar',
    category: 'PRODUCTIVITY',
    description: 'Calendar and scheduling system',
    version: '1.0.0',
  },
] as const;

export async function provisionBusinessCalendar(params: {
  businessId: string;
  businessName: string;
  ownerUserId: string;
}): Promise<void> {
  try {
    await prisma.calendar.create({
      data: {
        name: params.businessName,
        contextType: 'BUSINESS',
        contextId: params.businessId,
        isPrimary: true,
        isSystem: false,
        isDeletable: true,
        defaultReminderMinutes: 10,
        members: { create: { userId: params.ownerUserId, role: 'OWNER' } },
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to auto-provision business calendar', {
      operation: 'business_create_calendar',
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function installCoreBusinessModules(params: {
  businessId: string;
  installedByUserId: string;
}): Promise<void> {
  try {
    void logger.info('Auto-installing core modules for business', {
      operation: 'business_core_modules',
      businessId: params.businessId,
    });

    for (const { moduleId, name, category, description, version } of CORE_MODULES) {
      let module = await prisma.module.findUnique({ where: { id: moduleId } });

      if (!module) {
        module = await prisma.module.create({
          data: {
            id: moduleId,
            name,
            description,
            version,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma enum alignment for seed modules
            category: category as any,
            tags: [moduleId, 'core', 'proprietary'],
            icon: moduleId,
            screenshots: [],
            developerId: params.installedByUserId,
            manifest: {
              name,
              version,
              description,
              author: 'Vssyl',
              license: 'proprietary',
              entryPoint: `/${moduleId}`,
              permissions: [`${moduleId}:read`, `${moduleId}:write`],
              dependencies: [],
              runtime: { apiVersion: '1.0' },
              frontend: { entryUrl: `/${moduleId}` },
              settings: {},
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic manifest JSON
            } as any,
            dependencies: [],
            permissions: [`${moduleId}:read`, `${moduleId}:write`],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma enum
            status: 'APPROVED' as any,
            pricingTier: 'free',
            basePrice: 0,
            enterprisePrice: 0,
            isProprietary: true,
            revenueSplit: 0,
            downloads: 0,
            rating: 5.0,
            reviewCount: 0,
          },
        });
      }

      const existingInstallation = await prisma.businessModuleInstallation.findFirst({
        where: { businessId: params.businessId, moduleId },
      });

      if (!existingInstallation) {
        await prisma.businessModuleInstallation.create({
          data: {
            businessId: params.businessId,
            moduleId,
            installedBy: params.installedByUserId,
            installedAt: new Date(),
            enabled: true,
            configured: { permissions: ['view', 'create', 'edit', 'delete'] },
          },
        });
      }
    }

    void logger.info('Core modules auto-install finished', {
      operation: 'business_core_modules',
      businessId: params.businessId,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to auto-install core modules (business creation still succeeded)', {
      operation: 'business_core_modules',
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function provisionNewBusiness(params: {
  businessId: string;
  businessName: string;
  ownerUserId: string;
}): Promise<void> {
  await provisionBusinessCalendar(params);
  await installCoreBusinessModules({
    businessId: params.businessId,
    installedByUserId: params.ownerUserId,
  });
}

export async function ensureMemberBusinessCalendar(params: {
  businessId: string;
  businessName: string;
  userId: string;
}): Promise<void> {
  try {
    const existingCal = await prisma.calendar.findFirst({
      where: { contextType: 'BUSINESS', contextId: params.businessId, isPrimary: true },
    });

    if (!existingCal) {
      await prisma.calendar.create({
        data: {
          name: params.businessName,
          contextType: 'BUSINESS',
          contextId: params.businessId,
          isPrimary: true,
          isSystem: false,
          isDeletable: true,
          defaultReminderMinutes: 10,
          members: { create: { userId: params.userId, role: 'OWNER' } },
        },
      });
      return;
    }

    await prisma.calendarMember.upsert({
      where: { calendarId_userId: { calendarId: existingCal.id, userId: params.userId } },
      update: {},
      create: { calendarId: existingCal.id, userId: params.userId, role: 'READER' },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to ensure business calendar on invitation accept', {
      operation: 'business_invite_calendar',
      error: { message: err.message, stack: err.stack },
    });
  }
}
