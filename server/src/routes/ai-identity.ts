import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { aiIdentitySnapshotBuilder } from '../ai/preferences/aiIdentitySnapshot';

const router: express.Router = express.Router();

/**
 * GET /api/ai/identity
 * Unified AI Identity snapshot for the Control Center home tab.
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

    if (businessId) {
      const member = await prisma.businessMember.findFirst({
        where: { userId, businessId, isActive: true },
        select: { id: true },
      });
      if (!member) {
        return res.status(403).json({
          success: false,
          error: 'Not a member of this business workspace',
        });
      }
    }

    const data = await aiIdentitySnapshotBuilder.build({
      userId,
      businessId,
      dashboardId,
    });

    res.json({ success: true, data });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to load AI identity snapshot', {
      operation: 'ai_identity_get_error',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({
      success: false,
      error: 'Failed to load AI identity',
    });
  }
});

export default router;
