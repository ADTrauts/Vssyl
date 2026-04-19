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
import {
  asRecordJson,
  getManifestEntryUrl,
  isValidHttpsEntryUrl,
  VALID_MODULE_CATEGORIES,
  classifyArtifactUploadInitError,
} from './moduleShared';


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
