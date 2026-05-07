/**
 * Scheduling Module Automatic Seeding
 * 
 * Runs on server startup to ensure Scheduling module exists in database
 * Similar to registerBuiltInModules but for the module record itself
 */

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export async function seedSchedulingModuleOnStartup(): Promise<void> {
  try {
    void logger.debug('Checking Scheduling module registration', { operation: 'seed_scheduling_module_start' });
    
    // Check if Scheduling module already exists
    let existing;
    try {
      existing = await prisma.module.findUnique({
        where: { id: 'scheduling' }
      });
    } catch (dbError) {
      // Database might not be available during startup
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
        void logger.warn('Scheduling module seed skipped because database is not available during startup', {
          operation: 'seed_scheduling_module_db_unavailable',
        });
        return;
      }
      // Re-throw if it's a different database error
      throw dbError;
    }
    
    if (existing) {
      void logger.debug('Scheduling module already registered', { operation: 'seed_scheduling_module_exists' });
      return;
    }
    
    void logger.info('Creating Scheduling module record', { operation: 'seed_scheduling_module_create' });
    
    // Get a user to be the developer (first admin)
    let systemUser;
    try {
      systemUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
    } catch (dbError) {
      // Database connection lost during seeding
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
        void logger.warn('Scheduling module seed skipped because database connection was lost during seeding', {
          operation: 'seed_scheduling_module_db_lost',
        });
        return;
      }
      throw dbError;
    }
    
    if (!systemUser) {
      void logger.warn('No admin user found; Scheduling module seed will retry on next startup', {
        operation: 'seed_scheduling_module_no_admin',
      });
      return;
    }
    
    // Create Scheduling module
    await prisma.module.create({
      data: {
        id: 'scheduling',
        name: 'Employee Scheduling',
        description: 'Employee shift scheduling and workforce planning for businesses with shift management, availability, and swap requests',
        version: '1.0.0',
        category: 'PRODUCTIVITY',
        tags: ['scheduling', 'shifts', 'roster', 'staffing', 'coverage', 'business', 'workforce'],
        icon: 'calendar-clock',
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
          name: 'Employee Scheduling',
          version: '1.0.0',
          description: 'Employee shift scheduling system',
          author: 'Vssyl',
          license: 'proprietary',
          entryPoint: '/business/[id]/admin/scheduling',
          permissions: ['scheduling:admin', 'scheduling:schedules:write', 'scheduling:team:view', 'scheduling:swaps:approve', 'scheduling:self:view'],
          dependencies: [],
          runtime: { apiVersion: '1.0' },
          frontend: { entryUrl: '/business/[id]/admin/scheduling' },
          settings: {
            requiresBusinessContext: true,
            minimumTier: 'business-basic'
          }
        },
        dependencies: [],
        permissions: ['scheduling:admin', 'scheduling:schedules:write', 'scheduling:team:view', 'scheduling:swaps:approve', 'scheduling:self:view']
      }
    });
    
    void logger.info('Scheduling module registered successfully', { operation: 'seed_scheduling_module_success' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Scheduling module seed failed; server will continue but Scheduling module may not be available', {
      operation: 'seed_scheduling_module_failure',
      error: { message: err.message, stack: err.stack },
    });
  }
}

