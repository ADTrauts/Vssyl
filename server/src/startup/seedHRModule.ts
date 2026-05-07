/**
 * HR Module Automatic Seeding
 * 
 * Runs on server startup to ensure HR module exists in database
 * Similar to registerBuiltInModules but for the module record itself
 */

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export async function seedHRModuleOnStartup(): Promise<void> {
  try {
    void logger.debug('Checking HR module registration', { operation: 'seed_hr_module_start' });
    
    // Check if HR module already exists
    let existing;
    try {
      existing = await prisma.module.findUnique({
        where: { id: 'hr' }
      });
    } catch (dbError) {
      // Database might not be available during startup
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
        void logger.warn('HR module seed skipped because database is not available during startup', {
          operation: 'seed_hr_module_db_unavailable',
        });
        return;
      }
      // Re-throw if it's a different database error
      throw dbError;
    }
    
    if (existing) {
      void logger.debug('HR module already registered', { operation: 'seed_hr_module_exists' });
      return;
    }
    
    void logger.info('Creating HR module record', { operation: 'seed_hr_module_create' });
    
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
        void logger.warn('HR module seed skipped because database connection was lost during seeding', {
          operation: 'seed_hr_module_db_lost',
        });
        return;
      }
      throw dbError;
    }
    
    if (!systemUser) {
      void logger.warn('No admin user found; HR module seed will retry on next startup', {
        operation: 'seed_hr_module_no_admin',
      });
      return;
    }
    
    // Create HR module
    await prisma.module.create({
      data: {
        id: 'hr',
        name: 'HR Management',
        description: 'Complete human resources management system for employee lifecycle, attendance, payroll, and performance management',
        version: '1.0.0',
        category: 'PRODUCTIVITY',
        tags: ['hr', 'human-resources', 'business', 'enterprise', 'proprietary'],
        icon: 'Users',
        screenshots: [],
        developerId: systemUser.id,
        status: 'APPROVED',
        downloads: 0,
        rating: 5.0,
        reviewCount: 0,
        pricingTier: 'business_advanced',
        basePrice: 0,
        enterprisePrice: 0,
        isProprietary: true,
        revenueSplit: 0,
        manifest: {
          name: 'HR Management',
          version: '1.0.0',
          description: 'Human resources management system',
          author: 'Vssyl',
          license: 'proprietary',
          businessOnly: true,
          requiresOrgChart: true,
          minimumTier: 'business_advanced',
          routes: {
            admin: '/business/[id]/admin/hr',
            employee: '/business/[id]/workspace/hr/me',
            manager: '/business/[id]/workspace/hr/team'
          },
          permissions: [
            'hr:admin',
            'hr:employees:read',
            'hr:employees:write',
            'hr:team:view',
            'hr:team:approve',
            'hr:self:view',
            'hr:self:update'
          ],
          tierFeatures: {
            business_advanced: {
              employees: { enabled: true, limit: 50, customFields: false },
              attendance: { enabled: true, clockInOut: false, geolocation: false },
              payroll: false,
              recruitment: false,
              performance: false,
              benefits: false
            },
            enterprise: {
              employees: { enabled: true, limit: null, customFields: true },
              attendance: { enabled: true, clockInOut: true, geolocation: true },
              payroll: true,
              recruitment: true,
              performance: true,
              benefits: true
            }
          },
          dependencies: [],
          runtime: {
            apiVersion: '1.0',
            endpoints: {
              admin: '/api/hr/admin',
              manager: '/api/hr/team',
              employee: '/api/hr/me',
              ai: '/api/hr/ai'
            }
          },
          frontend: {
            entryUrl: '/business/[id]/admin/hr',
            adminUrl: '/business/[id]/admin/hr',
            employeeUrl: '/business/[id]/workspace/hr/me',
            managerUrl: '/business/[id]/workspace/hr/team'
          },
          settings: {
            features: {
              employees: true,
              attendance: false,
              payroll: false,
              recruitment: false,
              performance: false,
              benefits: false
            }
          }
        },
        dependencies: [],
        permissions: [
          'hr:admin',
          'hr:employees:read',
          'hr:employees:write',
          'hr:team:view',
          'hr:self:view'
        ]
      }
    });
    
    void logger.info('HR module registered successfully', { operation: 'seed_hr_module_success' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('HR module seed failed; server will continue but HR module may not be available', {
      operation: 'seed_hr_module_failure',
      error: { message: err.message, stack: err.stack },
    });
  }
}

