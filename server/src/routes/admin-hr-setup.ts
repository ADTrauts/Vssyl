/**
 * Admin endpoint to manually seed HR module if needed
 */

import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router: express.Router = express.Router();

/**
 * Manually seed HR module
 * POST /api/admin/hr-setup/seed
 */
router.post('/seed', async (req: Request, res: Response) => {
  try {
    // Check if user is admin (basic check)
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('Manual HR module seeding requested...');
    
    // Check if HR module already exists
    const existing = await prisma.module.findUnique({
      where: { id: 'hr' }
    });
    
    if (existing) {
      return res.json({
        success: true,
        message: 'HR module already exists',
        module: {
          id: existing.id,
          name: existing.name,
          status: existing.status,
          pricingTier: existing.pricingTier
        }
      });
    }
    
    // Get an admin user to be the developer
    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!systemUser) {
      return res.status(500).json({
        error: 'No admin user found to assign as module developer'
      });
    }
    
    // Create HR module
    const hrModule = await prisma.module.create({
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
          ]
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
    
    console.log('✅ HR module created successfully');
    
    return res.json({
      success: true,
      message: 'HR module created successfully',
      module: {
        id: hrModule.id,
        name: hrModule.name,
        status: hrModule.status,
        pricingTier: hrModule.pricingTier
      }
    });
    
  } catch (error) {
    console.error('Error seeding HR module:', error);
    return res.status(500).json({
      error: 'Failed to seed HR module',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Check HR module and installation status
 * GET /api/admin/hr-setup/status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    
    // Check if HR module exists
    const hrModule = await prisma.module.findUnique({
      where: { id: 'hr' }
    });
    
    let installation = null;
    let businessTier = null;
    
    if (businessId) {
      // Check installation
      installation = await (prisma as any).businessModuleInstallation.findFirst({
        where: {
          moduleId: 'hr',
          businessId: businessId
        }
      });
      
      // Check business tier
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          subscriptions: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
      
      businessTier = business?.subscriptions[0]?.tier || business?.tier || 'free';
    }
    
    return res.json({
      success: true,
      moduleExists: !!hrModule,
      module: hrModule ? {
        id: hrModule.id,
        name: hrModule.name,
        status: hrModule.status,
        pricingTier: hrModule.pricingTier,
        isProprietary: hrModule.isProprietary
      } : null,
      installation: installation ? {
        id: installation.id,
        installedAt: installation.installedAt,
        enabled: installation.enabled
      } : null,
      businessTier,
      canInstall: !!hrModule && !installation && ['business_advanced', 'enterprise'].includes(businessTier || '')
    });
    
  } catch (error) {
    console.error('Error checking HR status:', error);
    return res.status(500).json({
      error: 'Failed to check HR status',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

