import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { PreferenceResolver } from '../ai/preferences/PreferenceResolver';
import { toEffectivePreferencesPreview } from '../ai/preferences/effectivePreferencesPreview';

const router: express.Router = express.Router();
const preferenceResolver = new PreferenceResolver(prisma);

/**
 * GET /api/ai/effective-preferences
 * Preview of communication and action-boundary settings used on the next AI chat turn.
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const businessId =
      typeof req.query.businessId === 'string' && req.query.businessId.trim()
        ? req.query.businessId.trim()
        : undefined;
    const dashboardId =
      typeof req.query.dashboardId === 'string' && req.query.dashboardId.trim()
        ? req.query.dashboardId.trim()
        : undefined;

    const [resolved, profile, autonomy, businessTwin] = await Promise.all([
      preferenceResolver.resolve({ userId, businessId, dashboardId }),
      prisma.aIPersonalityProfile.findUnique({
        where: { userId },
        select: { id: true, personalityData: true },
      }),
      prisma.aIAutonomySettings.findUnique({ where: { userId }, select: { id: true } }),
      businessId
        ? prisma.businessAIDigitalTwin.findUnique({
            where: { businessId },
            select: { id: true, status: true, allowEmployeeInteraction: true },
          })
        : Promise.resolve(null),
    ]);

    const personalityData = profile?.personalityData;
    const hasQuestionnaire =
      personalityData &&
      typeof personalityData === 'object' &&
      !Array.isArray(personalityData) &&
      (personalityData as Record<string, unknown>).questionnaireCompleted === true;

    const preview = toEffectivePreferencesPreview(resolved, {
      hasPersonalityProfile: Boolean(profile && hasQuestionnaire),
      hasAutonomySettings: Boolean(autonomy),
      businessId,
      hasBusinessWorkspacePolicies: Boolean(
        businessTwin?.status === 'active' && businessTwin.allowEmployeeInteraction
      ),
    });

    res.json({ success: true, data: preview });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to load effective AI preferences preview', {
      operation: 'ai_effective_preferences_get_error',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({
      success: false,
      error: 'Failed to load effective preferences',
    });
  }
});

export default router;
