import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { getUserFromRequest } from '../../middleware/auth.js';
import { isBuiltInModuleId } from '../../constants/builtInModuleIds.js';
import {
  getPartnerWorkspaceParticipation,
  isPartnerWorkspaceModuleEnabled,
} from '../../marketplace/workspaceParticipationRegistry.js';
import { buildWorkspaceBridgeInitPayload } from '../../marketplace/workspaceBridgeProbe.js';
import {
  consumeWorkspaceBridgeJti,
  verifyWorkspaceBridgeJwt,
} from '../../marketplace/workspaceBridgeJwt.js';

export const getWorkspaceBridgeInit = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId } = req.params;
    const scope = (req.query.scope as 'personal' | 'business') || 'business';
    const businessId = req.query.businessId as string | undefined;
    const dashboardId = req.query.dashboardId as string | undefined;

    if (isBuiltInModuleId(moduleId)) {
      return res.status(400).json({
        success: false,
        error: 'workspace_bridge_not_applicable',
        message: 'Built-in modules use native workspace embedding',
      });
    }

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

    if (!isPartnerWorkspaceModuleEnabled(moduleId)) {
      return res.status(403).json({
        success: false,
        error: 'workspace_bridge_disabled',
        message: 'Partner workspace bridge is disabled or module is not allowlisted',
      });
    }

    const registration = getPartnerWorkspaceParticipation(moduleId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'workspace_not_registered',
        message: 'Module has no certified workspace participation',
      });
    }

    const tenantScope = scope === 'business' ? 'business' : 'personal';
    if (!registration.supportedContexts.includes(tenantScope)) {
      return res.status(403).json({
        success: false,
        error: 'workspace_context_unsupported',
        message: `Module does not support ${tenantScope} workspace context`,
      });
    }

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        installations: scope === 'personal' ? { where: { userId: user.id }, take: 1 } : false,
        businessInstallations:
          scope === 'business' && businessId ? { where: { businessId }, take: 1 } : false,
      } as Record<string, unknown>,
    });

    if (!mod || mod.status !== 'APPROVED') {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    const isInstalled =
      scope === 'business'
        ? Boolean((mod as { businessInstallations?: unknown[] }).businessInstallations?.length)
        : Boolean((mod as { installations?: unknown[] }).installations?.length);

    if (!isInstalled) {
      return res.status(403).json({ success: false, error: 'Module not installed' });
    }

    const themeMode =
      typeof req.query.theme === 'string' &&
      (req.query.theme === 'light' || req.query.theme === 'dark' || req.query.theme === 'system')
        ? req.query.theme
        : 'system';

    const init = buildWorkspaceBridgeInitPayload({
      userId: user.id,
      moduleId,
      moduleName: mod.name,
      moduleVersionId: registration.moduleVersionId,
      registration,
      tenant: {
        scope,
        businessId: scope === 'business' ? businessId : undefined,
        dashboardId,
      },
      theme: { mode: themeMode },
      capabilities: ['workspace', ...registration.lifecycleEvents],
    });

    return res.json({ success: true, data: init });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Workspace bridge init failed', {
      operation: 'workspace_bridge_init',
      error: { message: err.message, stack: err.stack },
    });
    return res.status(500).json({ success: false, error: 'Failed to issue workspace bridge init' });
  }
};

export const verifyWorkspaceBridgeToken = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token =
      typeof req.body?.bridgeToken === 'string'
        ? req.body.bridgeToken
        : typeof req.headers.authorization === 'string'
          ? req.headers.authorization.replace(/^Bearer\s+/i, '')
          : '';

    if (!token) {
      return res.status(400).json({ success: false, error: 'bridgeToken is required' });
    }

    const claims = verifyWorkspaceBridgeJwt(token);

    if (claims.sub !== user.id) {
      return res.status(403).json({ success: false, error: 'Token subject mismatch' });
    }

    consumeWorkspaceBridgeJti(claims.jti);

    return res.json({
      success: true,
      data: {
        moduleId: claims.moduleId,
        moduleVersionId: claims.moduleVersionId,
        lifecycleId: claims.lifecycleId,
        scope: claims.scope,
        businessId: claims.businessId,
        dashboardId: claims.dashboardId,
        userRef: claims.userRef,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return res.status(401).json({ success: false, error: err.message });
  }
};
