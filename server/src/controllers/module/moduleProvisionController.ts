import { Request, Response } from 'express';
import crypto from 'crypto';
import { Prisma, ModuleCategory } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { getUserFromRequest } from '../../middleware/auth';
import { ModuleSecurityService } from '../../services/moduleSecurityService';
import { initializeHrScheduleForBusiness } from '../../services/hrScheduleService';
import { storageService } from '../../services/storageService';
import { runBaselineZipScan } from '../../services/moduleArtifactBaselineScan';
import { runSmartModuleScan } from '../../services/moduleArtifactSmartScan';
import { evaluateModuleInstallPolicyDual } from '../../auth/moduleInstallPolicyDual';
import { evaluateModuleUninstallPolicyDual } from '../../auth/moduleUninstallPolicyDual';
import {
  emitModuleInstalledEvent,
  emitModuleUninstalledEvent,
  emitModuleEnabledEvent,
  emitModuleDisabledEvent,
} from '../../events/domainEventEmitters';
import { BUILT_IN_MODULE_IDS } from '../../constants/builtInModuleIds';
import {
  moduleRequiresBusinessSubscription,
  hasActiveBusinessModuleSubscription,
  ensureFreeBusinessModuleSubscription,
} from '../../services/businessModuleSubscriptionService';
import { asRecordJson } from './moduleShared';
import {
  assertModuleInstallScopeAllowed,
  builtInModuleAvailableForPersonalScope,
  moduleScopeVisibleInMarketplace,
  resolveEffectiveModuleScope,
} from '../../marketplace/moduleScopeService';
import { isBuiltInModuleId } from '../../constants/builtInModuleIds';

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

      const modules = installations
        .filter((installation: Record<string, unknown>) => {
          const mod = installation.module as { id: string; manifest: unknown };
          const manifest = asRecordJson(mod.manifest);
          const resolved = resolveEffectiveModuleScope(manifest, mod.id);
          return resolved ? moduleScopeVisibleInMarketplace(resolved.moduleScope, 'business') : false;
        })
        .map((installation: Record<string, any>) => ({
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

    // Get built-in modules available for personal scope
    const builtInModuleIds = BUILT_IN_MODULE_IDS.filter((id) =>
      builtInModuleAvailableForPersonalScope(id)
    );
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
    const installedModules = installations
      .filter((installation) => {
        const manifest = asRecordJson(installation.module.manifest);
        const resolved = resolveEffectiveModuleScope(manifest, installation.module.id);
        return resolved ? moduleScopeVisibleInMarketplace(resolved.moduleScope, 'personal') : false;
      })
      .map((installation: {
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

    const scopeVisibleModules = modules.filter((module: { id: string; manifest: unknown }) => {
      const manifest = asRecordJson(module.manifest);
      const resolved = resolveEffectiveModuleScope(manifest, module.id);
      if (!resolved) return false;
      return moduleScopeVisibleInMarketplace(resolved.moduleScope, scope);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modulesWithStatus = scopeVisibleModules.map((module: any) => {
      const resolvedScope = resolveEffectiveModuleScope(asRecordJson(module.manifest), module.id);
      // Check if this is a built-in module for personal scope
      const isBuiltInModule = isBuiltInModuleId(module.id);
      
      // Determine status based on scope and installation
      let status: 'installed' | 'available';
      if (scope === 'business') {
        status = (module as any).businessInstallations?.length > 0 ? 'installed' : 'available';
      } else {
        // For personal scope, check both explicit installations and built-in modules
        const hasExplicitInstallation = (module as any).installations?.length > 0;
        const isBuiltInAndPersonal =
          isBuiltInModule && scope === 'personal' && builtInModuleAvailableForPersonalScope(module.id);
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
        moduleScope: resolvedScope?.moduleScope ?? null,
        supportedContexts: resolvedScope?.supportedContexts ?? [],
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

    const installManifest = asRecordJson(module.manifest);
    const scopeCheck = assertModuleInstallScopeAllowed({
      manifest: installManifest,
      moduleId,
      installScope: scope,
    });
    if (!scopeCheck.allowed) {
      logger.warn('Module installation denied: scope mismatch', {
        operation: 'module_install',
        userId: user.id,
        businessId,
        moduleId,
        installScope: scope,
        moduleScope: scopeCheck.moduleScope,
        reason: scopeCheck.reason,
      });
      return res.status(403).json({
        success: false,
        error: scopeCheck.reason ?? 'Module scope does not support this installation target',
        moduleScope: scopeCheck.moduleScope,
      });
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

      const policyDual = await evaluateModuleInstallPolicyDual({
        userId: user.id,
        moduleId,
        installScope: 'business',
        businessId,
      });
      if (policyDual.blocked) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          reason: policyDual.reason,
        });
      }

      // Check if module is already installed for this business
      const existingInstallation = await (prisma as any).businessModuleInstallation.findUnique({
        where: { moduleId_businessId: { moduleId, businessId } },
      });
      if (existingInstallation) {
        return res.status(400).json({ success: false, error: 'Module is already installed for this business' });
      }

      // Check subscription requirements for paid partner modules
      if (moduleRequiresBusinessSubscription(module)) {
        const hasSubscription = await hasActiveBusinessModuleSubscription(businessId, moduleId);
        if (!hasSubscription) {
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
            installedAt: new Date(),
            installedBy: user.id,
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

      if (!moduleRequiresBusinessSubscription(module)) {
        await ensureFreeBusinessModuleSubscription({
          businessId,
          moduleId,
          actorUserId: user.id,
        });
      }

      emitModuleInstalledEvent({
        actorUserId: user.id,
        moduleId,
        installationId: installation.id,
        installScope: 'business',
        businessId,
      });

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
      const policyDual = await evaluateModuleInstallPolicyDual({
        userId: user.id,
        moduleId,
        installScope: 'personal',
      });
      if (policyDual.blocked) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          reason: policyDual.reason,
        });
      }

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

      emitModuleInstalledEvent({
        actorUserId: user.id,
        moduleId,
        installationId: installation.id,
        installScope: 'personal',
      });

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
    
    void logger.error('Error installing module', {
      operation: 'module_install',
      error: { message: errorMessage, stack: errorStack },
      moduleId: req.params.moduleId,
      userId: getUserFromRequest(req)?.id,
      businessId: typeof req.query.businessId === 'string' ? req.query.businessId : undefined
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

      const policyDual = await evaluateModuleUninstallPolicyDual({
        userId: user.id,
        moduleId,
        uninstallScope: 'business',
        businessId,
      });
      if (policyDual.blocked) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          reason: policyDual.reason,
        });
      }

      const installation = await (prisma as any).businessModuleInstallation.findUnique({
        where: { moduleId_businessId: { moduleId, businessId } }
      });
      if (!installation) {
        return res.status(404).json({ success: false, error: 'Module is not installed for this business' });
      }

      await (prisma as any).businessModuleInstallation.delete({ where: { moduleId_businessId: { moduleId, businessId } } });

      emitModuleUninstalledEvent({
        actorUserId: user.id,
        moduleId,
        installationId: installation.id,
        installScope: 'business',
        businessId,
      });

      return res.json({ success: true, data: { message: 'Module uninstalled for business successfully' } });
    }

    const installation = await prisma.moduleInstallation.findUnique({
      where: { moduleId_userId: { moduleId, userId: user.id } }
    });
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Module is not installed' });
    }

    const policyDual = await evaluateModuleUninstallPolicyDual({
      userId: user.id,
      moduleId,
      uninstallScope: 'personal',
    });
    if (policyDual.blocked) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        reason: policyDual.reason,
      });
    }

    await prisma.moduleInstallation.delete({ where: { moduleId_userId: { moduleId, userId: user.id } } });

    emitModuleUninstalledEvent({
      actorUserId: user.id,
      moduleId,
      installationId: installation.id,
      installScope: 'personal',
    });

    res.json({ success: true, data: { message: 'Module uninstalled successfully' } });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error uninstalling module', {
      operation: 'module_uninstall',
      error: { message: err.message, stack: err.stack },
    });
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
    const { configuration, enabled } = req.body as {
      configuration?: unknown;
      enabled?: boolean;
    };
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
          ...(configuration !== undefined
            ? {
                configured:
                  configuration === null
                    ? Prisma.JsonNull
                    : (configuration as Prisma.InputJsonValue),
              }
            : {}),
          ...(typeof enabled === 'boolean' ? { enabled } : {}),
        },
      });

      if (typeof enabled === 'boolean' && enabled !== installation.enabled) {
        if (enabled) {
          emitModuleEnabledEvent({
            actorUserId: user.id,
            moduleId,
            installationId: updatedInstallation.id,
            installScope: 'business',
            businessId,
          });
        } else {
          emitModuleDisabledEvent({
            actorUserId: user.id,
            moduleId,
            installationId: updatedInstallation.id,
            installScope: 'business',
            businessId,
          });
        }
      }

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
        ...(configuration !== undefined
          ? {
              configured:
                configuration === null
                  ? Prisma.JsonNull
                  : (configuration as Prisma.InputJsonValue),
            }
          : {}),
        ...(typeof enabled === 'boolean' ? { enabled } : {}),
      }
    });

    if (typeof enabled === 'boolean' && enabled !== installation.enabled) {
      if (enabled) {
        emitModuleEnabledEvent({
          actorUserId: user.id,
          moduleId,
          installationId: updatedInstallation.id,
          installScope: 'personal',
        });
      } else {
        emitModuleDisabledEvent({
          actorUserId: user.id,
          moduleId,
          installationId: updatedInstallation.id,
          installScope: 'personal',
        });
      }
    }

    res.json({ 
      success: true, 
      data: { 
        message: 'Module configured successfully',
        installation: updatedInstallation 
      } 
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error configuring module', {
      operation: 'module_configure',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ success: false, error: 'Failed to configure module' });
  }
};
