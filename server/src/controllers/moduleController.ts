import { Request, Response } from 'express';
import crypto from 'crypto';
import { Prisma, ModuleCategory } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { ModuleSecurityService } from '../services/moduleSecurityService';
import { initializeHrScheduleForBusiness } from '../services/hrScheduleService';
import { storageService } from '../services/storageService';
import { runBaselineZipScan } from '../services/moduleArtifactBaselineScan';

// Helper function to get user from request
const getUserFromRequest = (req: Request) => {
  return (req as AuthenticatedRequest).user;
};

function asRecordJson(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function getManifestEntryUrl(manifest: Record<string, unknown>): string | null {
  const frontend = asRecordJson(manifest.frontend);
  const value = frontend.entryUrl;
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

function isValidHttpsEntryUrl(value: string | null): boolean {
  if (!value) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Must match `ModuleCategory` in prisma schema */
const VALID_MODULE_CATEGORIES = new Set([
  'PRODUCTIVITY',
  'COMMUNICATION',
  'ANALYTICS',
  'DEVELOPMENT',
  'ENTERTAINMENT',
  'EDUCATION',
  'FINANCE',
  'HEALTH',
  'OTHER',
]);

/** Safe hints for production clients when artifact upload init fails (GCS signing vs DB). */
function classifyArtifactUploadInitError(err: Error): { errorCode: string; hint: string } {
  const msg = err.message;
  const lower = msg.toLowerCase();
  if (/does not exist|relation .* does not exist|table .* does not exist/i.test(msg)) {
    return {
      errorCode: 'DB_SCHEMA_MISSING',
      hint: 'Run prisma migrate deploy on the production database.',
    };
  }
  if (
    /sign|signblob|iamcredentials|token creator|does not have permission to sign|cannot sign/i.test(msg) ||
    (lower.includes('pem') && lower.includes('invalid'))
  ) {
    return {
      errorCode: 'GCS_SIGNING_FAILED',
      hint:
        'Cloud Run needs permission to create GCS V4 signed URLs: grant the runtime service account Storage access on the bucket and signing capability (e.g. roles/storage.objectAdmin on the bucket; roles/iam.serviceAccountTokenCreator on the service account for signBlob).',
    };
  }
  if (/bucket|does not exist|not found|404|no such/i.test(lower) && /storage|gcs|bucket/i.test(lower)) {
    return {
      errorCode: 'GCS_BUCKET_OR_OBJECT',
      hint: 'Verify GOOGLE_CLOUD_STORAGE_BUCKET and GOOGLE_CLOUD_PROJECT_ID point to an existing bucket.',
    };
  }
  if (/permission|denied|forbidden|403|access denied/i.test(lower)) {
    return {
      errorCode: 'GCS_PERMISSION_DENIED',
      hint: 'Grant the Cloud Run runtime service account roles/storage.objectAdmin (or equivalent) on the bucket.',
    };
  }
  if (/default credentials|metadata|application default credentials|could not refresh/i.test(lower)) {
    return {
      errorCode: 'GCP_CREDENTIALS',
      hint: 'Ensure Cloud Run uses a service account with Storage access (ADC on Cloud Run).',
    };
  }
  return {
    errorCode: 'UPLOAD_INIT_FAILED',
    hint: 'Check server logs for operation module_artifact_upload_init.',
  };
}

// Get all installed modules for the current user
export const getInstalledModules = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const scope = (req.query.scope as 'personal' | 'business') || 'personal';
    const businessId = req.query.businessId as string | undefined;

    if (scope === 'business') {
      if (!businessId) {
        return res.status(400).json({ success: false, error: 'businessId is required for business scope' });
      }

      const membership = await prisma.businessMember.findFirst({
        where: { businessId, userId: user.id, isActive: true },
      });
      if (!membership) {
        return res.status(403).json({ success: false, error: 'Access denied for this business' });
      }
      // Require admin/manager or explicit manage permission
      if (!(membership.role === 'ADMIN' || membership.role === 'MANAGER' || membership.canManage)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions to install for this business' });
      }

      const installations = await (prisma as any).businessModuleInstallation.findMany({
        where: { businessId, enabled: true },
        include: {
          module: {
            include: {
              developer: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      const modules = installations.map((installation: Record<string, any>) => ({
        id: installation.module.id,
        name: installation.module.name,
        description: installation.module.description,
        version: installation.module.version,
        category: installation.module.category,
        developer: installation.module.developer.name || installation.module.developer.email,
        rating: installation.module.rating,
        reviewCount: installation.module.reviewCount,
        downloads: installation.module.downloads,
        status: 'installed' as const,
        icon: installation.module.icon,
        configured: installation.configured,
        installedAt: installation.installedAt,
        updatedAt: installation.module.updatedAt,
      }));

      return res.json({ success: true, data: modules });
    }

    // Get explicitly installed modules
    const installations = await prisma.moduleInstallation.findMany({
      where: {
        userId: user.id,
        enabled: true
      },
      include: {
        module: {
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Get built-in modules (always available for personal users)
    const builtInModuleIds = ['drive', 'chat', 'calendar'];
    const builtInModules = await prisma.module.findMany({
      where: {
        id: { in: builtInModuleIds },
        status: 'APPROVED'
      },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Combine explicitly installed modules with built-in modules
    const installedModules = installations.map((installation: {
      module: {
        id: string;
        name: string;
        description: string | null;
        version: string;
        category: string;
        developer: { name: string | null; email: string } | null;
        rating: number;
        reviewCount: number;
        downloads: number;
        icon: string | null;
        updatedAt: Date;
      };
      configured: unknown;
      installedAt: Date;
    }) => ({
      id: installation.module.id,
      name: installation.module.name,
      description: installation.module.description,
      version: installation.module.version,
      category: installation.module.category,
      developer: installation.module.developer?.name || installation.module.developer?.email || 'Unknown',
      rating: installation.module.rating,
      reviewCount: installation.module.reviewCount,
      downloads: installation.module.downloads,
      status: 'installed' as const,
      icon: installation.module.icon,
      configured: installation.configured as any,
      installedAt: installation.installedAt,
      updatedAt: installation.module.updatedAt,
      isBuiltIn: false
    }));

    // Add built-in modules (mark as built-in and always installed)
    const builtInModulesFormatted = builtInModules.map((module: {
      id: string;
      name: string;
      description: string | null;
      version: string;
      category: string;
      developer: { name: string | null; email: string } | null;
      rating: number;
      reviewCount: number;
      downloads: number;
      icon: string | null;
      createdAt: Date;
      updatedAt: Date;
    }) => ({
      id: module.id,
      name: module.name,
      description: module.description,
      version: module.version,
      category: module.category,
      developer: module.developer?.name || module.developer?.email || 'Vssyl',
      rating: module.rating,
      reviewCount: module.reviewCount,
      downloads: module.downloads,
      status: 'installed' as const,
      icon: module.icon,
      configured: {
        enabled: true,
        settings: {},
        permissions: [`${module.id}:read`, `${module.id}:write`]
      },
      installedAt: module.createdAt, // Use module creation date as "installed" date
      updatedAt: module.updatedAt,
      isBuiltIn: true
    }));

    // Combine all modules, avoiding duplicates (built-in modules take precedence)
    const allModules = [...builtInModulesFormatted];
    type ModuleType = typeof builtInModulesFormatted[0];
    const installedModuleIds = new Set(builtInModulesFormatted.map((m: ModuleType) => m.id));
    
    installedModules.forEach((module: ModuleType) => {
      if (!installedModuleIds.has(module.id)) {
        allModules.push(module);
      }
    });

    res.json({ success: true, data: allModules });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const userId = getUserFromRequest(req)?.id;
    logger.error('Failed to get installed modules', {
      operation: 'get_installed_modules',
      userId,
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ success: false, error: 'Failed to get installed modules' });
  }
};

// Get all available modules in the marketplace
export const getMarketplaceModules = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'downloads';
    const sortOrder = typeof req.query.sortOrder === 'string' ? req.query.sortOrder : 'desc';
    const pricingTier = typeof req.query.pricingTier === 'string' ? req.query.pricingTier : undefined;
    
    // Validate scope and businessId query parameters
    const scopeParam = req.query.scope;
    const businessIdParam = req.query.businessId;
    
    if (scopeParam && typeof scopeParam !== 'string') {
      return res.status(400).json({ error: 'scope must be a string' });
    }
    const scope = (scopeParam === 'business' ? 'business' : 'personal') as 'personal' | 'business';
    
    if (businessIdParam && typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId must be a string' });
    }
    const businessId = businessIdParam as string | undefined;

    if (scope === 'business') {
      if (!businessId) {
        return res.status(400).json({ success: false, error: 'businessId is required for business scope' });
      }

      const membership = await prisma.businessMember.findFirst({
        where: { businessId, userId: user.id, isActive: true },
      });

      if (!membership) {
        return res.status(403).json({ success: false, error: 'Access denied for this business' });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      status: 'APPROVED'
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } }
      ];
    }

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // Filter by pricing tier
    if (pricingTier && pricingTier !== 'all') {
      whereClause.pricingTier = pricingTier;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'downloads') {
      orderBy.downloads = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    }

    const modules = await prisma.module.findMany({
      where: whereClause,
      include: {
        developer: { select: { id: true, name: true, email: true } },
        installations: scope === 'personal' ? { where: { userId: user.id } } : false,
        businessInstallations: scope === 'business' && businessId ? { where: { businessId } } : false,
        businessSubscriptions:
          scope === 'business' && businessId
            ? { where: { businessId, status: 'active' } }
            : false,
        subscriptions:
          scope === 'personal'
            ? { where: { userId: user.id, status: 'active' } }
            : businessId
            ? { where: { businessId, status: 'active' } }
            : false,
      } as any,
      orderBy: orderBy
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modulesWithStatus = modules.map((module: any) => {
      // Check if this is a built-in module for personal scope
      const builtInModuleIds = ['drive', 'chat', 'calendar'];
      const isBuiltInModule = builtInModuleIds.includes(module.id);
      
      // Determine status based on scope and installation
      let status: 'installed' | 'available';
      if (scope === 'business') {
        status = (module as any).businessInstallations?.length > 0 ? 'installed' : 'available';
      } else {
        // For personal scope, check both explicit installations and built-in modules
        const hasExplicitInstallation = (module as any).installations?.length > 0;
        const isBuiltInAndPersonal = isBuiltInModule && scope === 'personal';
        status = (hasExplicitInstallation || isBuiltInAndPersonal) ? 'installed' : 'available';
      }

      return {
        id: module.id,
        name: module.name,
        description: module.description,
        version: module.version,
        category: module.category,
        developer: (module as any).developer.name || (module as any).developer.email,
        rating: module.rating,
        reviewCount: module.reviewCount,
        downloads: module.downloads,
        status,
        icon: module.icon,
        screenshots: module.screenshots,
        tags: module.tags,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
        // Pricing data
        pricingTier: module.pricingTier,
        basePrice: module.basePrice,
        enterprisePrice: module.enterprisePrice,
        isProprietary: module.isProprietary,
        revenueSplit: module.revenueSplit,
        // Subscription status
        subscriptionStatus:
          scope === 'business'
            ? (module as any).businessSubscriptions?.[0]?.status || null
            : (module as any).subscriptions?.[0]?.status || null,
        subscriptionAmount:
          scope === 'business'
            ? (module as any).businessSubscriptions?.[0]?.amount || null
            : (module as any).subscriptions?.[0]?.amount || null,
        // Built-in module indicator
        isBuiltIn: isBuiltInModule,
      };
    });

    res.json({ success: true, data: modulesWithStatus });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const userId = getUserFromRequest(req)?.id;
    logger.error('Failed to get marketplace modules', {
      operation: 'get_marketplace_modules',
      userId,
      error: { message: err.message, stack: err.stack },
    });
    // Include error message in response for debugging (only in development)
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Failed to get marketplace modules';
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      message: 'Failed to get marketplace modules',
      ...(process.env.NODE_ENV === 'development' && { details: err.stack })
    });
  }
};

// Install a module
export const installModule = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId } = req.params;
    
    // Validate query parameters
    const scopeParam = req.query.scope;
    const businessIdParam = req.query.businessId;
    
    if (scopeParam && typeof scopeParam !== 'string') {
      return res.status(400).json({ success: false, error: 'scope must be a string' });
    }
    const scope = (scopeParam === 'business' ? 'business' : 'personal') as 'personal' | 'business';
    
    if (businessIdParam && typeof businessIdParam !== 'string') {
      return res.status(400).json({ success: false, error: 'businessId must be a string' });
    }
    const businessId = businessIdParam as string | undefined;

    // Check if module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    // Check if module is approved
    if (module.status !== 'APPROVED') {
      return res.status(400).json({ success: false, error: 'Module is not available for installation' });
    }

    if (scope === 'business') {
      if (!businessId) {
        return res.status(400).json({ success: false, error: 'businessId is required for business scope' });
      }

      // Check business membership and permissions
      const membership = await prisma.businessMember.findFirst({
        where: { businessId, userId: user.id, isActive: true },
      });
      if (!membership) {
        logger.warn('Module installation denied: User not a member of business', {
          operation: 'module_install',
          userId: user.id,
          businessId,
          moduleId,
          reason: 'not_member'
        });
        return res.status(403).json({ 
          success: false, 
          error: 'Access denied for this business',
          details: 'You are not a member of this business'
        });
      }
      if (!(membership.role === 'ADMIN' || membership.role === 'MANAGER' || membership.canManage)) {
        logger.warn('Module installation denied: Insufficient permissions', {
          operation: 'module_install',
          userId: user.id,
          businessId,
          moduleId,
          userRole: membership.role,
          canManage: membership.canManage,
          reason: 'insufficient_permissions'
        });
        return res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions to install for this business',
          details: `Your role (${membership.role}) does not have permission to install modules. Requires ADMIN, MANAGER, or canManage permission.`,
          userRole: membership.role,
          canManage: membership.canManage
        });
      }

      // Check if module is already installed for this business
      const existingInstallation = await (prisma as any).businessModuleInstallation.findUnique({
        where: { moduleId_businessId: { moduleId, businessId } },
      });
      if (existingInstallation) {
        return res.status(400).json({ success: false, error: 'Module is already installed for this business' });
      }

      // Check subscription requirements for paid modules
      // NOTE: Proprietary modules (like HR) are included in business tier, not separately paid
      if (module.pricingTier && module.pricingTier !== 'free' && !module.isProprietary) {
        const subscription = await (prisma as any).businessModuleSubscription.findFirst({
          where: { businessId, moduleId, status: 'active' },
        });
        if (!subscription) {
          return res.status(402).json({
            success: false,
            error: 'Business subscription required',
            requiresSubscription: true,
            moduleId,
            pricingTier: module.pricingTier,
            basePrice: module.basePrice,
            enterprisePrice: module.enterprisePrice,
          });
        }
      }
      
      // For proprietary modules (like HR), check business tier instead
      let businessTier: string | undefined;
      if (module.isProprietary && module.pricingTier && module.pricingTier !== 'free') {
        const business = await prisma.business.findUnique({
          where: { id: businessId },
          include: {
            subscriptions: {
              where: { status: 'active' },
              orderBy: { createdAt: 'desc' }
            }
          }
        });
        
        const activeSub = business?.subscriptions[0];
        businessTier = activeSub?.tier || business?.tier || 'free';
        
        // HR module requires business_advanced or enterprise
        const requiredTiers = ['business_advanced', 'enterprise'];
        const hasRequiredTier = businessTier ? requiredTiers.includes(businessTier) : false;
        
        if (!hasRequiredTier) {
          logger.warn('Module installation denied: Business tier too low', {
            operation: 'module_install',
            userId: user.id,
            businessId,
            moduleId,
            currentTier: businessTier,
            requiredTier: module.pricingTier,
            reason: 'tier_too_low'
          });
          return res.status(403).json({
            success: false,
            error: 'Business tier upgrade required',
            requiresTier: module.pricingTier,
            currentTier: businessTier,
            message: `${module.name} requires Business Advanced or Enterprise tier`,
            upgradeUrl: '/billing/upgrade',
            details: `Your business is on the ${businessTier} tier. This module requires Business Advanced or Enterprise tier.`
          });
        }
      }

      // Log successful permission and tier checks
      logger.info('Module installation checks passed', {
        operation: 'module_install',
        userId: user.id,
        businessId,
        moduleId,
        userRole: membership.role,
        canManage: membership.canManage,
        businessTier: businessTier
      });

      // Install module for business
      let installation;
      try {
        // Create the installation first without includes to avoid relation issues
        installation = await prisma.businessModuleInstallation.create({
          data: { 
            moduleId, 
            businessId, 
            enabled: true,
            installedAt: new Date()
            // Note: installedBy column is optional, so we don't set it
          }
        });
        
        // Then fetch the module details separately
        const moduleWithDeveloper = await prisma.module.findUnique({
          where: { id: moduleId },
          include: {
            developer: {
              select: { id: true, name: true, email: true }
            }
          }
        });
        
        // Combine the installation with module data for response
        installation = {
          ...installation,
          module: moduleWithDeveloper
        } as any;
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
        const errorStack = dbError instanceof Error ? dbError.stack : undefined;
        
        logger.error('Failed to create module installation', {
          operation: 'module_install',
          userId: user.id,
          businessId,
          moduleId,
          error: { message: errorMessage, stack: errorStack }
        });
        
        // Check if it's a unique constraint violation (already installed)
        if (errorMessage.includes('Unique constraint') || 
            errorMessage.includes('duplicate key') ||
            errorMessage.includes('Unique violation')) {
          return res.status(400).json({
            success: false,
            error: 'Module is already installed for this business'
          });
        }
        
        // Check for foreign key constraint violations
        if (errorMessage.includes('Foreign key constraint') || 
            errorMessage.includes('violates foreign key')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid module or business ID',
            details: 'The module or business does not exist'
          });
        }
        
        // Re-throw for other database errors to be caught by outer catch
        throw dbError;
      }

      // Update module download count
      await prisma.module.update({ 
        where: { id: moduleId }, 
        data: { downloads: { increment: 1 } } 
      });

      if (moduleId === 'hr') {
        try {
          await initializeHrScheduleForBusiness(businessId);
        } catch (scheduleError) {
          const errorMessage = scheduleError instanceof Error ? scheduleError.message : String(scheduleError);
          logger.warn('Failed to initialize HR schedule calendar', {
            businessId,
            error: { message: errorMessage }
          });
        }
      }

      return res.json({
        success: true,
        message: 'Module installed for business successfully',
        installation: {
          id: installation.id,
          moduleId: installation.moduleId,
          businessId: installation.businessId,
          installedAt: installation.installedAt,
          configured: installation.configured,
          enabled: installation.enabled,
          module: {
            id: installation.module.id,
            name: installation.module.name,
            description: installation.module.description,
            version: installation.module.version,
            category: installation.module.category,
            developer: installation.module.developer.name || installation.module.developer.email,
            pricingTier: installation.module.pricingTier,
            basePrice: installation.module.basePrice,
            enterprisePrice: installation.module.enterprisePrice,
          },
        },
      });
    } else {
      // Personal installation logic
      const existingInstallation = await prisma.moduleInstallation.findUnique({
        where: { moduleId_userId: { moduleId, userId: user.id } },
      });
      if (existingInstallation) {
        return res.status(400).json({ success: false, error: 'Module is already installed' });
      }

      if (module.pricingTier && module.pricingTier !== 'free') {
        const subscription = await prisma.moduleSubscription.findFirst({
          where: { userId: user.id, moduleId, status: 'active' },
        });
        if (!subscription) {
          return res.status(402).json({
            success: false,
            error: 'Subscription required',
            requiresSubscription: true,
            moduleId,
            pricingTier: module.pricingTier,
            basePrice: module.basePrice,
            enterprisePrice: module.enterprisePrice,
          });
        }
      }

      const installation = await prisma.moduleInstallation.create({
        data: { moduleId, userId: user.id, enabled: true },
        include: { module: { include: { developer: { select: { id: true, name: true, email: true } } } } },
      });

      await prisma.module.update({ where: { id: moduleId }, data: { downloads: { increment: 1 } } });

      return res.json({
        success: true,
        message: 'Module installed successfully',
        installation: {
          id: installation.id,
          moduleId: installation.moduleId,
          userId: installation.userId,
          installedAt: installation.installedAt,
          configured: installation.configured,
          enabled: installation.enabled,
          module: {
            id: installation.module.id,
            name: installation.module.name,
            description: installation.module.description,
            version: installation.module.version,
            category: installation.module.category,
            developer: installation.module.developer.name || installation.module.developer.email,
            pricingTier: installation.module.pricingTier,
            basePrice: installation.module.basePrice,
            enterprisePrice: installation.module.enterprisePrice,
          },
        },
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Error installing module', {
      operation: 'module_install',
      error: { message: errorMessage, stack: errorStack },
      moduleId: req.params.moduleId,
      userId: (req as any).user?.id,
      businessId: typeof req.query.businessId === 'string' ? req.query.businessId : undefined
    });
    
    console.error('Error installing module:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: errorMessage,
      stack: errorStack
    });
    
    // Return more detailed error information in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({ 
      success: false, 
      error: 'Failed to install module',
      ...(isDevelopment && { 
        details: errorMessage,
        stack: errorStack 
      }),
      // Show details always for now (debugging production issue)
      details: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown'
    });
  }
};

// Uninstall a module
export const uninstallModule = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId } = req.params;
    const scope = (req.query.scope as 'personal' | 'business') || 'personal';
    const businessId = req.query.businessId as string | undefined;

    if (scope === 'business') {
      if (!businessId) {
        return res.status(400).json({ success: false, error: 'businessId is required for business scope' });
      }
      const membership = await prisma.businessMember.findFirst({ where: { businessId, userId: user.id, isActive: true } });
      if (!membership) {
        return res.status(403).json({ success: false, error: 'Access denied for this business' });
      }
      if (!(membership.role === 'ADMIN' || membership.role === 'MANAGER' || membership.canManage)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions to uninstall for this business' });
      }

      const installation = await (prisma as any).businessModuleInstallation.findUnique({
        where: { moduleId_businessId: { moduleId, businessId } }
      });
      if (!installation) {
        return res.status(404).json({ success: false, error: 'Module is not installed for this business' });
      }

      await (prisma as any).businessModuleInstallation.delete({ where: { moduleId_businessId: { moduleId, businessId } } });
      return res.json({ success: true, data: { message: 'Module uninstalled for business successfully' } });
    }

    const installation = await prisma.moduleInstallation.findUnique({
      where: { moduleId_userId: { moduleId, userId: user.id } }
    });
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Module is not installed' });
    }

    await prisma.moduleInstallation.delete({ where: { moduleId_userId: { moduleId, userId: user.id } } });

    res.json({ success: true, data: { message: 'Module uninstalled successfully' } });
  } catch (error) {
    console.error('Error uninstalling module:', error);
    res.status(500).json({ success: false, error: 'Failed to uninstall module' });
  }
};

// Configure a module
export const configureModule = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId } = req.params;
    const { configuration } = req.body;
    const scope = (req.query.scope as 'personal' | 'business') || 'personal';
    const businessId = req.query.businessId as string | undefined;

    if (scope === 'business') {
      if (!businessId) {
        return res.status(400).json({ success: false, error: 'businessId is required for business scope' });
      }

      const membership = await prisma.businessMember.findFirst({
        where: { businessId, userId: user.id, isActive: true }
      });

      if (!membership) {
        return res.status(403).json({ success: false, error: 'Access denied for this business' });
      }

      if (!(membership.role === 'ADMIN' || membership.role === 'MANAGER' || membership.canManage)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions to configure this business module' });
      }

      const installation = await (prisma as any).businessModuleInstallation.findUnique({
        where: { moduleId_businessId: { moduleId, businessId } }
      });

      if (!installation) {
        return res.status(404).json({ success: false, error: 'Module is not installed for this business' });
      }

      const updatedInstallation = await (prisma as any).businessModuleInstallation.update({
        where: { moduleId_businessId: { moduleId, businessId } },
        data: {
          configured: configuration
        }
      });

      return res.json({
        success: true,
        data: {
          message: 'Business module configured successfully',
          installation: updatedInstallation
        }
      });
    }

    const installation = await prisma.moduleInstallation.findUnique({
      where: {
        moduleId_userId: {
          moduleId,
          userId: user.id
        }
      }
    });

    if (!installation) {
      return res.status(404).json({ success: false, error: 'Module is not installed' });
    }

    const updatedInstallation = await prisma.moduleInstallation.update({
      where: {
        moduleId_userId: {
          moduleId,
          userId: user.id
        }
      },
      data: {
        configured: configuration
      }
    });

    res.json({ 
      success: true, 
      data: { 
        message: 'Module configured successfully',
        installation: updatedInstallation 
      } 
    });
  } catch (error) {
    console.error('Error configuring module:', error);
    res.status(500).json({ success: false, error: 'Failed to configure module' });
  }
};

// Get module categories
export const getModuleCategories = async (req: Request, res: Response) => {
  try {
    const categories = Object.values(require('@prisma/client').ModuleCategory);
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error getting module categories:', error);
    res.status(500).json({ success: false, error: 'Failed to get module categories' });
  }
};

// Get module details
export const getModuleDetails = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId } = req.params;

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        installations: {
          where: {
            userId: user.id
          }
        },
        moduleReviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    const moduleData = {
      id: module.id,
      name: module.name,
      description: module.description,
      version: module.version,
      category: module.category,
      developer: module.developer.name || module.developer.email,
      rating: module.rating,
      reviewCount: module.reviewCount,
      downloads: module.downloads,
      status: module.status,
      icon: module.icon,
      screenshots: module.screenshots,
      tags: module.tags,
      manifest: module.manifest,
      dependencies: module.dependencies,
      permissions: module.permissions,
      isInstalled: module.installations.length > 0,
      installation: module.installations[0] || null,
      reviews: module.moduleReviews,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt
    };

    res.json({ success: true, data: moduleData });
  } catch (error) {
    console.error('Error getting module details:', error);
    res.status(500).json({ success: false, error: 'Failed to get module details' });
  }
}; 

// Submit a module for review
export const submitModule = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      name,
      description,
      version,
      category,
      tags,
      manifest,
      dependencies,
      permissions,
      readme,
      license,
      screenshots: screenshotsBody,
    } = req.body;

    // Validate required fields
    if (!name || !description || !version || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, description, version, category' 
      });
    }

    if (typeof category !== 'string' || !VALID_MODULE_CATEGORIES.has(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Use one of: ${[...VALID_MODULE_CATEGORIES].join(', ')}`,
      });
    }

    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
      return res.status(400).json({
        success: false,
        error: 'Manifest is required and must be a JSON object',
      });
    }

    // Enhanced security validation
    const securityService = new ModuleSecurityService(prisma);
    const securityValidation = await securityService.validateModuleSubmission(req.body);
    
    if (!securityValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Module failed security validation',
        details: {
          errors: securityValidation.errors,
          warnings: securityValidation.warnings,
          securityScore: securityValidation.securityScore,
          recommendations: securityValidation.recommendations
        }
      });
    }

    // Log security warnings if any
    if (securityValidation.warnings.length > 0) {
      console.warn('⚠️ Module submission has security warnings:', securityValidation.warnings);
    }

    // Create the module
    const screenshots =
      Array.isArray(screenshotsBody) && screenshotsBody.every((s: unknown) => typeof s === 'string')
        ? (screenshotsBody as string[])
        : [];

    const module = await prisma.module.create({
      data: {
        name,
        description,
        version,
        category: category as ModuleCategory,
        tags: tags || [],
        screenshots,
        manifest,
        dependencies: dependencies || [],
        permissions: permissions || [],
        developerId: user.id,
        status: 'PENDING'
      }
    });

    // Create the submission record
    const submission = await prisma.moduleSubmission.create({
      data: {
        moduleId: module.id,
        submitterId: user.id,
        status: 'PENDING'
      },
      include: {
        module: {
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        message: 'Module submitted successfully for review',
        submission,
        securityValidation: {
          securityScore: securityValidation.securityScore,
          status: securityValidation.validationDetails.securityStatus,
          warnings: securityValidation.warnings,
          recommendations: securityValidation.recommendations,
        },
        /** Phase 4 Day 0 — soft deprecation (see THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md). */
        submissionPolicy: {
          hostedUrlOnlyDeprecation: 'soft' as const,
          message:
            'Hosted-URL-only module delivery is deprecated. Prefer uploading a zip artifact after submit (GCS pipeline). Mandatory artifact cutoff per platform policy.',
          mandatoryArtifactCutoffDays: 90,
        },
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error submitting module:', err);
    void logger.error('Error submitting module', {
      operation: 'submit_module',
      error: { message: err.message, stack: err.stack },
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        return res.status(503).json({
          success: false,
          error:
            'Database is missing required tables or columns. Deploy the latest migrations, then retry.',
          code: error.code,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to submit module',
        code: error.code,
      });
    }

    const exposeMessage = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      error: exposeMessage ? err.message : 'Failed to submit module',
      ...(exposeMessage && { stack: err.stack }),
    });
  }
};

// Get all module submissions (admin only)
export const getModuleSubmissions = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const submissions = await prisma.moduleSubmission.findMany({
      include: {
        module: {
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error getting module submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to get module submissions' });
  }
};

// Review a module submission (admin only)
export const reviewModuleSubmission = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { submissionId } = req.params;
    const { action, reviewNotes } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid action. Must be "approve" or "reject"' 
      });
    }

    const submission = await prisma.moduleSubmission.findUnique({
      where: { id: submissionId },
      include: {
        module: true
      }
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    if (submission.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false, 
        error: 'Submission has already been reviewed' 
      });
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // If approved/rejected, update module version status when available
    const latestVersion = await prisma.moduleVersion.findFirst({
      where: {
        moduleId: submission.moduleId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (action === 'approve') {
      if (latestVersion) {
        const artifact = await prisma.moduleArtifact.findUnique({
          where: { moduleVersionId: latestVersion.id },
          select: { scanStatus: true },
        });
        if (!artifact || artifact.scanStatus !== 'PASSED') {
          return res.status(400).json({
            success: false,
            error: 'Module artifact scan must pass before approval',
          });
        }
      }
    }

    // Update submission only after pre-approval guards pass.
    const updatedSubmission = await prisma.moduleSubmission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        reviewNotes,
        reviewerId: user.id,
        reviewedAt: new Date()
      },
      include: {
        module: {
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (action === 'approve') {
      if (latestVersion) {

        await prisma.moduleVersion.updateMany({
          where: { moduleId: submission.moduleId, isCurrent: true },
          data: { isCurrent: false, status: 'ARCHIVED' },
        });

        await prisma.moduleVersion.update({
          where: { id: latestVersion.id },
          data: {
            status: 'PUBLISHED',
            isCurrent: true,
            approvedBy: user.id,
            approvedAt: new Date(),
            reviewNotes: reviewNotes || undefined,
          },
        });
      }

      await prisma.module.update({
        where: { id: submission.moduleId },
        data: {
          status: 'APPROVED',
          version: latestVersion?.version || submission.module.version,
        },
      });

      // Sync module AI context to registry (non-blocking)
      try {
        const { moduleRegistrySyncService } = await import('../services/ModuleRegistrySyncService');
        await moduleRegistrySyncService.syncModule(submission.moduleId);
        console.log(`✅ Module AI context synced for: ${submission.module.name}`);
      } catch (syncError) {
        // Log error but don't fail the approval
        console.error(`⚠️  Failed to sync AI context for module ${submission.module.name}:`, syncError);
        console.error('   Module is approved, but AI context may need manual sync');
      }
    } else if (latestVersion) {
      await prisma.moduleVersion.update({
        where: { id: latestVersion.id },
        data: {
          status: 'REJECTED',
          rejectedBy: user.id,
          rejectedAt: new Date(),
          reviewNotes: reviewNotes || undefined,
        },
      });
    }

    res.json({ 
      success: true, 
      data: { 
        message: `Module ${action}d successfully`,
        submission: updatedSubmission 
      } 
    });
  } catch (error) {
    console.error('Error reviewing module submission:', error);
    res.status(500).json({ success: false, error: 'Failed to review module submission' });
  }
};

// Promote a previous module version to current (admin only)
export const promoteModuleVersion = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { moduleId, version } = req.params;
    if (!moduleId || !version) {
      return res.status(400).json({ success: false, error: 'moduleId and version are required' });
    }

    const moduleRecord = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true, name: true, version: true },
    });
    if (!moduleRecord) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    const targetVersion = await prisma.moduleVersion.findUnique({
      where: { moduleId_version: { moduleId, version } },
      select: { id: true, version: true, isCurrent: true },
    });
    if (!targetVersion) {
      return res.status(404).json({ success: false, error: 'Target version not found for this module' });
    }

    const targetArtifact = await prisma.moduleArtifact.findUnique({
      where: { moduleVersionId: targetVersion.id },
      select: { scanStatus: true },
    });
    if (!targetArtifact || targetArtifact.scanStatus !== 'PASSED') {
      return res.status(400).json({ success: false, error: 'Target version artifact scan must pass before promotion' });
    }

    if (targetVersion.isCurrent) {
      return res.status(200).json({
        success: true,
        data: {
          message: `Version ${version} is already the current published version`,
          moduleId,
          version,
        },
      });
    }

    await prisma.$transaction(async tx => {
      await tx.moduleVersion.updateMany({
        where: { moduleId, isCurrent: true },
        data: { isCurrent: false, status: 'ARCHIVED' },
      });

      await tx.moduleVersion.update({
        where: { id: targetVersion.id },
        data: {
          isCurrent: true,
          status: 'PUBLISHED',
          approvedBy: user.id,
          approvedAt: new Date(),
        },
      });

      await tx.module.update({
        where: { id: moduleId },
        data: {
          status: 'APPROVED',
          version: targetVersion.version,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'MODULE_PROMOTE_PREVIOUS_VERSION',
          details: JSON.stringify({
            moduleId,
            moduleName: moduleRecord.name,
            promotedVersion: targetVersion.version,
            previousCurrentVersion: moduleRecord.version,
          }),
          timestamp: new Date(),
        },
      });
    });

    return res.json({
      success: true,
      data: {
        message: `Promoted version ${version} successfully`,
        moduleId,
        version,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to promote module version', {
      operation: 'module_promote_previous_version',
      error: { message: err.message, stack: err.stack },
    });
    return res.status(500).json({ success: false, error: 'Failed to promote module version' });
  }
};

// Get user's submitted modules
export const getUserSubmissions = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const submissions = await prisma.moduleSubmission.findMany({
      where: {
        submitterId: user.id
      },
      include: {
        module: {
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error getting user submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to get user submissions' });
  }
};

// Link a module to a business
export const linkModuleToBusiness = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const moduleId =
      typeof req.body?.moduleId === 'string' ? req.body.moduleId.trim() : '';
    const businessId =
      typeof req.body?.businessId === 'string' ? req.body.businessId.trim() : '';

    if (!moduleId || !businessId) {
      return res.status(400).json({ success: false, error: 'Module ID and Business ID are required' });
    }

    // Verify the module exists, then enforce developer ownership
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true, name: true, developerId: true, businessId: true },
    });

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    if (module.developerId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied for this module' });
    }

    // Upload/link policy: any active business member (including employees) can link modules.
    const businessMember = await prisma.businessMember.findFirst({
      where: {
        businessId,
        userId: user.id,
        isActive: true,
      },
      include: {
        business: true,
      },
    });

    if (!businessMember) {
      return res.status(403).json({ success: false, error: 'Access denied for this business' });
    }

    // Ensure linked business is designated for developer module workflows.
    const markDeveloperBusiness = async () => {
      await (prisma as any).business.update({
        where: { id: businessId },
        data: {
          isDeveloperBusiness: true,
          developerBusinessLinkedAt: new Date(),
          developerBusinessLinkedBy: user.id,
        },
      });
    };

    // Idempotent behavior: if already linked to this business, return success without changing state.
    if (module.businessId === businessId) {
      const currentBusiness = await (prisma as any).business.findUnique({
        where: { id: businessId },
        select: { isDeveloperBusiness: true },
      });
      if (!currentBusiness?.isDeveloperBusiness) {
        await markDeveloperBusiness();
      }

      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'MODULE_LINK_BUSINESS_NOOP',
            details: JSON.stringify({
              moduleId,
              moduleName: module.name,
              businessId,
              businessName: businessMember.business.name,
              reason: 'already_linked',
            }),
            timestamp: new Date(),
          },
        });
      } catch (auditError: unknown) {
        const err = auditError instanceof Error ? auditError : new Error(String(auditError));
        await logger.warn('Audit logging failed for module business link noop', {
          operation: 'module_link_business',
          moduleId,
          businessId,
          error: { message: err.message, stack: err.stack },
        });
      }

      return res.json({
        success: true,
        data: {
          message: 'Module is already linked to this business',
          module: {
            id: module.id,
            businessId,
            business: {
              id: businessMember.business.id,
              name: businessMember.business.name,
              isDeveloperBusiness: true,
            },
          },
        },
      });
    }

    const previousBusinessId = module.businessId ?? null;

    // Update module linkage and business designation in one transaction.
    const [, updatedModule] = await (prisma as any).$transaction([
      (prisma as any).business.update({
        where: { id: businessId },
        data: {
          isDeveloperBusiness: true,
          developerBusinessLinkedAt: new Date(),
          developerBusinessLinkedBy: user.id,
        },
      }),
      prisma.module.update({
        where: {
          id: moduleId,
        },
        data: {
          businessId,
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'MODULE_LINK_BUSINESS',
          details: JSON.stringify({
            moduleId,
            moduleName: module.name,
            previousBusinessId,
            linkedBusinessId: businessId,
            linkedBusinessName: businessMember.business.name,
            developerBusinessDesignated: true,
          }),
          timestamp: new Date(),
        },
      });
    } catch (auditError: unknown) {
      const err = auditError instanceof Error ? auditError : new Error(String(auditError));
      await logger.warn('Audit logging failed for module business link', {
        operation: 'module_link_business',
        moduleId,
        businessId,
        error: { message: err.message, stack: err.stack },
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Module linked to business successfully',
        module: updatedModule,
      },
    });
  } catch (error) {
    console.error('Error linking module to business:', error);
    res.status(500).json({ success: false, error: 'Failed to link module to business' });
  }
};

// Get modules for a specific business
export const getBusinessModules = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { businessId } = req.params;

    // Verify the business exists and user has access
    const businessMember = await prisma.businessMember.findFirst({
      where: {
        businessId: businessId,
        userId: user.id,
        isActive: true
      },
      include: {
        business: true
      }
    });

    if (!businessMember) {
      return res.status(404).json({ success: false, error: 'Business not found or access denied' });
    }

    // Get all modules linked to this business
    const modules = await prisma.module.findMany({
      where: {
        businessId: businessId
      },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ success: true, data: modules });
  } catch (error) {
    console.error('Error getting business modules:', error);
    res.status(500).json({ success: false, error: 'Failed to get business modules' });
  }
}; 

// Get runtime configuration for a module (sanitized manifest for frontend runtime)
export const getModuleRuntimeConfig = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId } = req.params;
    const scope = (req.query.scope as 'personal' | 'business') || 'personal';
    const businessId = req.query.businessId as string | undefined;

    if (scope !== 'personal' && scope !== 'business') {
      return res.status(400).json({ success: false, error: 'scope must be personal or business' });
    }

    if (scope === 'business') {
      if (!businessId) {
        return res.status(400).json({ success: false, error: 'businessId is required for business scope' });
      }

      const membership = await prisma.businessMember.findFirst({
        where: { businessId, userId: user.id, isActive: true },
      });

      if (!membership) {
        return res.status(403).json({ success: false, error: 'Access denied for this business' });
      }
    }

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        installations: scope === 'personal' ? { where: { userId: user.id }, take: 1 } : false,
        businessInstallations: scope === 'business' && businessId ? { where: { businessId }, take: 1 } : false,
        businessSubscriptions:
          scope === 'business' && businessId
            ? { where: { businessId, status: 'active' }, take: 1 }
            : false,
        subscriptions:
          scope === 'personal'
            ? { where: { userId: user.id, status: 'active' }, take: 1 }
            : businessId
            ? { where: { businessId, status: 'active' }, take: 1 }
            : false,
      } as any,
    });

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    if (module.status !== 'APPROVED') {
      return res.status(400).json({ success: false, error: 'Module not approved' });
    }

    const isInstalled = scope === 'business' ? Boolean((module as any).businessInstallations?.length) : Boolean((module as any).installations?.length);
    if (!isInstalled) {
      return res.status(403).json({ success: false, error: scope === 'business' ? 'Module not installed for business' : 'Module not installed by user' });
    }

    // For paid modules, ensure an active subscription exists
    if (module.pricingTier && module.pricingTier !== 'free') {
      const hasActiveSubscription =
        scope === 'business'
          ? Boolean((module as any).businessSubscriptions?.length)
          : Boolean((module as any).subscriptions?.length);
      if (!hasActiveSubscription) {
        return res.status(402).json({ success: false, error: 'Active subscription required' });
      }
    }

    const currentPublished = await prisma.moduleVersion.findFirst({
      where: {
        moduleId,
        isCurrent: true,
        status: 'PUBLISHED',
      },
      include: { artifact: true },
    });

    const legacyManifestRecord = asRecordJson(module.manifest);
    const snapshotManifestRecord = currentPublished
      ? asRecordJson(currentPublished.manifestSnapshot)
      : {};

    const runtimeSource: 'artifact_version' | 'legacy_manifest' = currentPublished
      ? 'artifact_version'
      : 'legacy_manifest';

    /** Prefer published snapshot; fall back to module.manifest for hosted-only modules. */
    const effectiveManifest =
      currentPublished && Object.keys(snapshotManifestRecord).length > 0
        ? snapshotManifestRecord
        : legacyManifestRecord;

    const runtimeSection = asRecordJson(effectiveManifest.runtime);
    const frontendSection = asRecordJson(effectiveManifest.frontend);

    let entryUrl: string | undefined =
      typeof frontendSection.entryUrl === 'string' ? frontendSection.entryUrl.trim() : undefined;

    const legacyFrontendOnly = asRecordJson(legacyManifestRecord.frontend);
    const legacyEntryUrl =
      typeof legacyFrontendOnly.entryUrl === 'string' ? legacyFrontendOnly.entryUrl.trim() : undefined;

    if (!entryUrl && currentPublished && legacyEntryUrl) {
      entryUrl = legacyEntryUrl;
    }

    let bundleRuntime = false;
    let bundleEntryPath = 'index.html';
    if (!entryUrl && currentPublished?.artifact) {
      if (currentPublished.artifact.scanStatus !== 'PASSED') {
        return res.status(503).json({
          success: false,
          error: 'Module artifact scan must pass before this module can run from the bundle',
        });
      }
      bundleRuntime = true;
      const ep = frontendSection.entryPath;
      if (typeof ep === 'string' && ep.trim()) {
        bundleEntryPath = ep.trim().replace(/^\/+/u, '');
      }
    }

    if (!entryUrl && !bundleRuntime) {
      return res.status(400).json({
        success: false,
        error:
          'Module manifest missing frontend.entryUrl. Add an HTTPS entry URL or provide a passing zip artifact with an HTML entry (use frontend.entryPath inside the manifest when needed).',
      });
    }

    const resolvedVersion = currentPublished ? currentPublished.version : module.version;

    const permissionsFromManifest = effectiveManifest.permissions;
    const permissions = Array.isArray(permissionsFromManifest)
      ? (permissionsFromManifest as string[])
      : Array.isArray(module.permissions)
        ? module.permissions
        : [];

    const settings =
      effectiveManifest.settings && typeof effectiveManifest.settings === 'object'
        ? (effectiveManifest.settings as Record<string, unknown>)
        : {};

    let artifactAccess:
      | {
          signedUrl: string;
          expiresAt: string;
          sha256: string;
          contentType: string;
        }
      | undefined;

    if (currentPublished?.artifact) {
      try {
        const expiresInSeconds = 900;
        const signedUrl = await storageService.getSignedUrl(
          currentPublished.artifact.objectPath,
          expiresInSeconds
        );
        artifactAccess = {
          signedUrl,
          expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
          sha256: currentPublished.artifact.sha256,
          contentType: currentPublished.artifact.contentType,
        };
      } catch (signErr: unknown) {
        const err = signErr instanceof Error ? signErr : new Error(String(signErr));
        await logger.warn('Failed to sign module artifact for runtime', {
          operation: 'get_module_runtime_config',
          moduleId,
          error: { message: err.message, stack: err.stack },
        });
      }
    }

    if (bundleRuntime && !artifactAccess) {
      return res.status(503).json({
        success: false,
        error: 'Module bundle is not available (artifact URL could not be signed). Try again shortly.',
      });
    }

    const runtimeConfig = {
      id: module.id,
      name: module.name,
      version: resolvedVersion,
      runtime: {
        apiVersion:
          typeof runtimeSection.apiVersion === 'string' ? runtimeSection.apiVersion : 'v1',
      },
      frontend: {
        entryUrl: entryUrl || '',
        entryPath: bundleRuntime ? bundleEntryPath : undefined,
        bundleRuntime,
      },
      permissions,
      settings,
      accessContext: { scope, businessId: scope === 'business' ? businessId : undefined },
      artifactAccess,
      runtimeResolution: {
        source: runtimeSource,
        moduleVersionId: currentPublished?.id,
        semver: resolvedVersion,
        legacyHostedFallback:
          runtimeSource === 'artifact_version' &&
          Boolean(legacyEntryUrl && entryUrl && entryUrl === legacyEntryUrl),
        bundleRuntime,
        bundleEntryPath: bundleRuntime ? bundleEntryPath : undefined,
      },
    };

    return res.json({ success: true, data: runtimeConfig });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Error getting module runtime config', {
      operation: 'get_module_runtime_config',
      error: { message: err.message, stack: err.stack },
    });
    return res.status(500).json({ success: false, error: 'Failed to get module runtime config' });
  }
};

// Initialize direct-to-GCS upload for module artifacts
export const initModuleArtifactUpload = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId } = req.params;
    const { version, fileName, contentType, sizeBytes } = req.body as {
      version?: string;
      fileName?: string;
      contentType?: string;
      sizeBytes?: number;
    };

    if (!version || !fileName || !contentType || typeof sizeBytes !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'version, fileName, contentType, and sizeBytes are required',
      });
    }

    const maxSizeBytes = 500 * 1024 * 1024; // 500MB hard limit
    if (sizeBytes <= 0 || sizeBytes > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        error: 'Artifact size exceeds allowed limit',
        maxSizeBytes,
      });
    }

    const lowerName = fileName.toLowerCase();
    const looksLikeZip =
      contentType.includes('zip') ||
      contentType.includes('x-zip-compressed') ||
      lowerName.endsWith('.zip');
    if (!looksLikeZip) {
      return res.status(400).json({
        success: false,
        error: 'Only ZIP artifacts are supported (use a .zip file or application/zip content type)',
      });
    }

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true, developerId: true, name: true },
    });

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    if (module.developerId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only the module developer can upload artifacts' });
    }

    if (storageService.getProvider() !== 'gcs' || !storageService.isGCSConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Artifact upload requires configured Google Cloud Storage',
      });
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectPath = `modules/${moduleId}/versions/${version}/${Date.now()}-${safeName}`;
    const uploadSessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const signedUpload = await storageService.getSignedUploadUrl(objectPath, contentType, 15 * 60);

    await prisma.moduleUploadSession.create({
      data: {
        id: uploadSessionId,
        moduleId,
        targetVersion: version,
        uploaderId: user.id,
        bucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET || '',
        objectPath,
        status: 'INITIATED',
        expiresAt,
      },
    });

    return res.json({
      success: true,
      data: {
        uploadSessionId,
        signedUploadUrl: signedUpload.url,
        method: signedUpload.method,
        requiredHeaders: signedUpload.requiredHeaders,
        objectPath,
        expiresAt: signedUpload.expiresAt,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to initialize module artifact upload', {
      operation: 'module_artifact_upload_init',
      error: { message: err.message, stack: err.stack },
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        return res.status(503).json({
          success: false,
          error:
            'Database is missing module upload tables. Apply the latest Prisma migrations on this environment.',
          code: error.code,
          errorCode: 'DB_SCHEMA_MISSING',
          hint: 'Run prisma migrate deploy against the production DATABASE_URL.',
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize artifact upload',
        code: error.code,
        errorCode: `PRISMA_${error.code}`,
        hint:
          'Database error while creating upload session. Confirm migrations are applied and module_upload_sessions exists.',
      });
    }

    const expose = process.env.NODE_ENV !== 'production';
    const classified = classifyArtifactUploadInitError(err);
    return res.status(500).json({
      success: false,
      error: expose ? err.message : 'Failed to initialize artifact upload',
      errorCode: classified.errorCode,
      hint: classified.hint,
      ...(expose && { detail: err.message, stack: err.stack }),
    });
  }
};

// Finalize a GCS upload and persist artifact/version metadata
export const finalizeModuleArtifactUpload = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId, uploadSessionId } = req.params;
    const { version, manifest, permissions, dependencies } = req.body as {
      version?: string;
      manifest?: Record<string, unknown>;
      permissions?: string[];
      dependencies?: string[];
    };

    if (!version || !manifest || typeof manifest !== 'object') {
      return res.status(400).json({ success: false, error: 'version and manifest are required' });
    }

    const session = await prisma.moduleUploadSession.findUnique({
      where: { id: uploadSessionId },
    });

    if (!session || session.moduleId !== moduleId) {
      return res.status(404).json({ success: false, error: 'Upload session not found' });
    }

    if (session.uploaderId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied for this upload session' });
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await prisma.moduleUploadSession.update({
        where: { id: uploadSessionId },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ success: false, error: 'Upload session expired' });
    }

    const exists = await storageService.fileExists(session.objectPath);
    if (!exists) {
      return res.status(400).json({ success: false, error: 'Artifact not found in storage for this session' });
    }

    const fileBuffer = await storageService.getFileBuffer(session.objectPath);
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const sizeBytes = fileBuffer.length;

    const manifestRecord = asRecordJson(manifest);
    const entryUrl = getManifestEntryUrl(manifestRecord);
    const baseline = runBaselineZipScan(
      fileBuffer,
      { objectPath: session.objectPath },
      { requireHtmlEntry: !isValidHttpsEntryUrl(entryUrl) }
    );
    const scanStatus = baseline.scanStatus;
    const scanSummary = baseline.scanSummary as Prisma.InputJsonValue;

    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: {
        version,
        manifest: manifest as Prisma.InputJsonValue,
        permissions: Array.isArray(permissions) ? permissions : [],
        dependencies: Array.isArray(dependencies) ? dependencies : [],
        status: 'PENDING',
      },
      select: { id: true, name: true, version: true },
    });

    const moduleVersion = await prisma.moduleVersion.upsert({
      where: { moduleId_version: { moduleId, version } },
      update: {
        status: 'READY_FOR_REVIEW',
        manifestSnapshot: manifest as Prisma.InputJsonValue,
        submittedBy: user.id,
      },
      create: {
        moduleId,
        version,
        status: 'READY_FOR_REVIEW',
        manifestSnapshot: manifest as Prisma.InputJsonValue,
        submittedBy: user.id,
      },
    });

    const artifact = await prisma.moduleArtifact.upsert({
      where: { moduleVersionId: moduleVersion.id },
      update: {
        bucket: session.bucket,
        objectPath: session.objectPath,
        contentType: 'application/zip',
        sizeBytes,
        sha256,
        uploadedBy: user.id,
        uploadedAt: new Date(),
        scanStatus,
        scanSummary,
      },
      create: {
        moduleVersionId: moduleVersion.id,
        bucket: session.bucket,
        objectPath: session.objectPath,
        contentType: 'application/zip',
        sizeBytes,
        sha256,
        uploadedBy: user.id,
        uploadedAt: new Date(),
        scanStatus,
        scanSummary,
      },
    });

    await prisma.moduleUploadSession.update({
      where: { id: uploadSessionId },
      data: { status: 'FINALIZED' },
    });

    return res.json({
      success: true,
      data: {
        message: 'Module artifact upload finalized',
        module: updatedModule,
        moduleVersionId: moduleVersion.id,
        artifactId: artifact.id,
        scanStatus: artifact.scanStatus,
        scanSummary: baseline.scanSummary,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to finalize module artifact upload', {
      operation: 'module_artifact_upload_finalize',
      error: { message: err.message, stack: err.stack },
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        return res.status(503).json({
          success: false,
          error:
            'Database is missing module artifact tables. Apply the latest Prisma migrations on this environment.',
          code: error.code,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to finalize artifact upload',
        code: error.code,
      });
    }

    const expose = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      success: false,
      error: expose ? err.message : 'Failed to finalize artifact upload',
      ...(expose && { stack: err.stack }),
    });
  }
};