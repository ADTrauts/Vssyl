/**
 * Workforce Communications module automatic seeding on server startup.
 */

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export async function seedWorkforceCommsModuleOnStartup(): Promise<void> {
  try {
    void logger.debug('Checking Workforce Communications module registration', {
      operation: 'seed_workforce_comms_module_start',
    });

    let existing;
    try {
      existing = await prisma.module.findUnique({
        where: { id: 'workforce_comms' },
      });
    } catch (dbError: unknown) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
        void logger.warn('Workforce comms module seed skipped — database unavailable', {
          operation: 'seed_workforce_comms_module_db_unavailable',
        });
        return;
      }
      throw dbError;
    }

    if (existing) {
      void logger.debug('Workforce Communications module already registered', {
        operation: 'seed_workforce_comms_module_exists',
      });
      return;
    }

    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!systemUser) {
      void logger.warn('No admin user found; workforce comms seed will retry on next startup', {
        operation: 'seed_workforce_comms_module_no_admin',
      });
      return;
    }

    await prisma.module.create({
      data: {
        id: 'workforce_comms',
        name: 'Workforce Communications',
        description:
          'Operational workforce broadcast lifecycle with audience targeting, acknowledgements, and reporting',
        version: '1.0.0',
        category: 'PRODUCTIVITY',
        tags: ['workforce', 'communications', 'announcements', 'broadcast', 'business'],
        icon: 'megaphone',
        screenshots: [],
        developerId: systemUser.id,
        status: 'APPROVED',
        downloads: 0,
        rating: 5.0,
        reviewCount: 0,
        pricingTier: 'business-basic',
        basePrice: 0,
        enterprisePrice: 0,
        isProprietary: true,
        revenueSplit: 0,
        manifest: {
          name: 'Workforce Communications',
          version: '1.0.0',
          description: 'Workforce broadcast and acknowledgement platform',
          author: 'Vssyl',
          license: 'proprietary',
          entryPoint: '/business/[id]/workspace/workforce-comms',
          permissions: ['workforce_comms:read', 'workforce_comms:write', 'workforce_comms:admin'],
          dependencies: [],
          runtime: { apiVersion: '1.0' },
          frontend: { entryUrl: '/business/[id]/workspace/workforce-comms' },
          settings: {
            requiresBusinessContext: true,
            minimumTier: 'business-basic',
          },
        },
        dependencies: [],
        permissions: ['workforce_comms:read', 'workforce_comms:write', 'workforce_comms:admin'],
      },
    });

    void logger.info('Workforce Communications module registered successfully', {
      operation: 'seed_workforce_comms_module_success',
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Workforce comms module seed failed (non-critical)', {
      operation: 'seed_workforce_comms_module_failure',
      error: { message: err.message, stack: err.stack },
    });
  }
}
