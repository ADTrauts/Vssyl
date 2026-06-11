import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

/**
 * @deprecated Autonomy de-emphasis — Wave 1B retirement (June 2026)
 *
 * `/api/ai/autonomous/*` write paths are **disabled**. Use:
 * - Conversational actions: `POST /api/ai/twin` (tool loop + LifeTwin actions)
 * - Approvals: `GET /api/ai/approvals`, `POST /api/ai/approvals/:id/respond`
 *
 * `GET /history` remains read-only for audit visibility of legacy rows.
 */

const router: express.Router = express.Router();

const AUTONOMOUS_RETIRED_BODY = {
  error: 'autonomous_path_retired',
  message:
    'The /api/ai/autonomous API is retired. Use POST /api/ai/twin for governed actions and /api/ai/approvals for approval flows.',
  replacement: {
    twin: 'POST /api/ai/twin',
    approvals: 'GET /api/ai/approvals',
    approvalRespond: 'POST /api/ai/approvals/:id/respond',
  },
  wave: 'AI Platform 1B',
};

function respondAutonomousRetired(res: express.Response, operation: string): void {
  void logger.warn('Autonomous API path invoked after retirement', {
    operation: `autonomous_retired_${operation}`,
  });
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', '</api/ai/twin>; rel="successor-version"');
  res.status(410).json(AUTONOMOUS_RETIRED_BODY);
}

router.post('/execute', authenticateJWT, (_req, res) => {
  respondAutonomousRetired(res, 'execute');
});

router.get('/pending-approvals', authenticateJWT, (_req, res) => {
  respondAutonomousRetired(res, 'pending_approvals');
});

router.post('/approval/:actionId', authenticateJWT, (_req, res) => {
  respondAutonomousRetired(res, 'approval');
});

router.post('/suggest', authenticateJWT, (_req, res) => {
  respondAutonomousRetired(res, 'suggest');
});

/**
 * Read-only audit visibility for legacy autonomous conversation rows.
 */
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const limit =
      typeof limitRaw === 'string' && /^\d+$/.test(limitRaw) ? parseInt(limitRaw, 10) : 20;
    const offset =
      typeof offsetRaw === 'string' && /^\d+$/.test(offsetRaw) ? parseInt(offsetRaw, 10) : 0;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', '</api/ai/history>; rel="successor-version"');

    const history = await prisma.aIConversationHistory.findMany({
      where: {
        userId,
        userQuery: { contains: 'Action:' },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const formattedHistory = history.map((item) => {
      const data =
        typeof item.aiResponse === 'string'
          ? (JSON.parse(item.aiResponse) as Record<string, unknown>)
          : (item.aiResponse as Record<string, unknown>);
      return {
        id: item.id,
        timestamp: item.createdAt,
        action: data.action || item.userQuery,
        result: data.result,
        success: data.success,
        legacySource: 'autonomous',
      };
    });

    res.json({
      success: true,
      deprecated: true,
      message: 'Autonomous writes are retired; this endpoint is read-only audit visibility.',
      history: formattedHistory,
      count: formattedHistory.length,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Autonomous history read failed', {
      operation: 'autonomous_history_read',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({
      error: 'Failed to get autonomous history',
      details: err.message,
    });
  }
});

export default router;
