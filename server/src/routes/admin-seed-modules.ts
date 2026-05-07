/**
 * ADMIN ENDPOINT: Seed Core Modules
 * 
 * This is a one-time endpoint to create Module records and install them
 * for existing businesses.
 * 
 * SECURITY: Should only be accessible by admins
 */

import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getUserFromRequest } from '../middleware/auth';
import { logger } from '../lib/logger';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}


const router: express.Router = express.Router();

router.post('/seed-core-modules', async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    
    // SECURITY: Only allow admins
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized - Admin access required' 
      });
    }

    const coreModules = [
      {
        moduleId: 'drive',
        name: 'Drive',
        category: 'PRODUCTIVITY',
        description: 'File management and storage system with folder organization and sharing',
        version: '1.0.0'
      },
      {
        moduleId: 'chat',
        name: 'Chat',
        category: 'COMMUNICATION',
        description: 'Real-time messaging and communication system',
        version: '1.0.0'
      },
      {
        moduleId: 'calendar',
        name: 'Calendar',
        category: 'PRODUCTIVITY',
        description: 'Calendar and scheduling system with events and reminders',
        version: '1.0.0'
      }
    ];

    const results = {
      modulesCreated: 0,
      modulesUpdated: 0,
      businessesProcessed: 0,
      installationsCreated: 0,
      errors: [] as string[]
    };

    // STEP 1: Ensure Module records exist
    for (const { moduleId, name, category, description, version } of coreModules) {
      try {
        const existing = await prisma.module.findUnique({
          where: { id: moduleId }
        });

        if (!existing) {
          await prisma.module.create({
            data: {
              id: moduleId,
              name,
              description,
              version,
              category: category as any,
              tags: [moduleId, 'core', 'proprietary'],
              icon: moduleId,
              screenshots: [],
              developerId: user.id,
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
                settings: {}
              } as any,
              dependencies: [],
              permissions: [`${moduleId}:read`, `${moduleId}:write`],
              status: 'APPROVED' as any,
              pricingTier: 'free',
              basePrice: 0,
              enterprisePrice: 0,
              isProprietary: true,
              revenueSplit: 0,
              downloads: 0,
              rating: 5.0,
              reviewCount: 0
            }
          });
          results.modulesCreated++;
          logSrvDebug('admin_seed_module_created', 'Created module', { name, moduleId });
        } else {
          results.modulesUpdated++;
          logSrvDebug('admin_seed_module_exists', 'Module already exists', { name, moduleId });
        }
      } catch (err: unknown) {
        results.errors.push(`Failed to create module ${name}: ${err}`);
        logSrvErr('admin_seed_module_create', `Error creating module ${name}`, err, { name, moduleId });
      }
    }

    // STEP 2: Install modules for all existing businesses
    const businesses = await prisma.business.findMany({
      select: { id: true, name: true }
    });

    for (const business of businesses) {
      results.businessesProcessed++;
      
      for (const { moduleId, name } of coreModules) {
        try {
          const existingInstallation = await prisma.businessModuleInstallation.findFirst({
            where: {
              businessId: business.id,
              moduleId: moduleId
            }
          });

          if (!existingInstallation) {
            await prisma.businessModuleInstallation.create({
              data: {
                businessId: business.id,
                moduleId: moduleId,
                installedBy: user.id,
                installedAt: new Date(),
                enabled: true,
                configured: {
                  permissions: ['view', 'create', 'edit', 'delete']
                }
              }
            });
            results.installationsCreated++;
            logSrvDebug('admin_seed_install', 'Installed module for business', {
              name,
              moduleId,
              businessId: business.id,
              businessName: business.name,
            });
          }
        } catch (err: unknown) {
          results.errors.push(`Failed to install ${name} for ${business.name}: ${err}`);
          logSrvErr('admin_seed_install', `Error installing ${name} for ${business.name}`, err, {
            name,
            moduleId,
            businessId: business.id,
            businessName: business.name,
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Core modules seeded and installed',
      results
    });

  } catch (error) {
    logSrvErr('admin_seed_modules_seed_error', 'Seed error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to seed core modules' 
    });
  }
});

export default router;

