import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { getUserFromRequest } from '../../middleware/auth.js';
import { isBuiltInModuleId } from '../../constants/builtInModuleIds.js';
import {
  getPartnerActivityIngest,
  isPartnerActivityIngestModuleEnabled,
} from '../../marketplace/activityIngestRegistry.js';
import { issueActivityIngestJwt, verifyActivityIngestJwt } from '../../marketplace/activityIngestJwt.js';
import { ingestPartnerActivity } from '../../marketplace/partnerActivityIngestService.js';
import type { ActivityIngestTenantScope } from 'vssyl-shared/types/activity-ingest';

function parseActivityIngestToken(req: Request): string {
  if (typeof req.headers.authorization === 'string') {
    const match = req.headers.authorization.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) return match[1].trim();
  }
  if (typeof req.body?.activityIngestToken === 'string') {
    return req.body.activityIngestToken.trim();
  }
  return '';
}

export const postActivityIngestToken = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId } = req.params;
    const scope = (req.body?.scope ?? req.query.scope) as ActivityIngestTenantScope | undefined;
    const businessId =
      typeof req.body?.businessId === 'string'
        ? req.body.businessId
        : typeof req.query.businessId === 'string'
          ? req.query.businessId
          : undefined;
    const dashboardId =
      typeof req.body?.dashboardId === 'string'
        ? req.body.dashboardId
        : typeof req.query.dashboardId === 'string'
          ? req.query.dashboardId
          : undefined;

    if (isBuiltInModuleId(moduleId)) {
      return res.status(400).json({
        success: false,
        error: 'activity_ingest_not_applicable',
        message: 'Built-in modules use native activity emission',
      });
    }

    if (scope !== 'personal' && scope !== 'business' && scope !== 'household') {
      return res.status(400).json({ success: false, error: 'scope must be personal, business, or household' });
    }

    if (scope === 'business' && !businessId) {
      return res.status(400).json({ success: false, error: 'businessId is required for business scope' });
    }

    if (!isPartnerActivityIngestModuleEnabled(moduleId)) {
      return res.status(403).json({
        success: false,
        error: 'activity_ingest_disabled',
        message: 'Partner activity ingest is disabled or module is not allowlisted',
      });
    }

    const registration = getPartnerActivityIngest(moduleId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'activity_not_registered',
        message: 'Module has no certified activity ingest registration',
      });
    }

    if (!registration.supportedContexts.includes(scope)) {
      return res.status(403).json({
        success: false,
        error: 'activity_context_unsupported',
        message: `Module does not support ${scope} activity context`,
      });
    }

    if (scope === 'business' && businessId) {
      const membership = await prisma.businessMember.findFirst({
        where: { businessId, userId: user.id, isActive: true },
      });
      if (!membership) {
        return res.status(403).json({ success: false, error: 'Access denied for this business' });
      }
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

    const issued = issueActivityIngestJwt({
      userId: user.id,
      moduleId,
      moduleVersionId: registration.moduleVersionId,
      scope,
      businessId: scope === 'business' ? businessId : undefined,
      dashboardId,
    });

    return res.json({
      success: true,
      data: {
        token: issued.token,
        expiresAt: issued.expiresAt,
        ttlSeconds: issued.ttlSeconds,
        requestId: issued.requestId,
        jti: issued.jti,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Activity ingest token failed', {
      operation: 'activity_ingest_token',
      error: { message: err.message, stack: err.stack },
    });
    return res.status(500).json({ success: false, error: 'Failed to issue activity ingest token' });
  }
};

export const postActivityIngest = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const token = parseActivityIngestToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Activity ingest JWT required' },
      });
    }

    let claims;
    try {
      claims = verifyActivityIngestJwt(token);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: err.message },
      });
    }

    if (!isPartnerActivityIngestModuleEnabled(moduleId)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Activity ingest disabled for module' },
      });
    }

    const registration = getPartnerActivityIngest(moduleId);
    if (!registration) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Module not registered for activity ingest' },
      });
    }

    const { response, diagnostics } = await ingestPartnerActivity({
      urlModuleId: moduleId,
      claims,
      registration,
      body: req.body,
    });

    if (!response.success) {
      const status =
        response.error.code === 'UNAUTHORIZED'
          ? 401
          : response.error.code === 'RATE_LIMITED'
            ? 429
            : response.error.code === 'INVALID_REQUEST' ||
                response.error.code === 'UNKNOWN_ACTION' ||
                response.error.code === 'UNKNOWN_ENTITY'
              ? 400
              : 403;
      return res.status(status).json(response);
    }

    return res.status(200).json({ ...response, diagnostics });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Activity ingest failed', {
      operation: 'activity_ingest',
      error: { message: err.message, stack: err.stack },
    });
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Activity ingest failed' },
    });
  }
};
