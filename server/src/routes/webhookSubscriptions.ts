import express, { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validateRequest';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createWebhookSubscription,
  deleteWebhookSubscription,
  listWebhookSubscriptions,
  sendWebhookSubscriptionTest,
  SUPPORTED_WEBHOOK_EVENT_TYPES,
} from '../services/webhookSubscriptionService';

const router: express.Router = express.Router();

const businessIdParam = validate([param('businessId').isUUID()]);
const subscriptionIdParam = validate([param('subscriptionId').isUUID()]);

const createBody = validate([
  body('url').isString().trim().isURL({ require_protocol: true }),
  body('eventTypes').isArray({ min: 1 }),
  body('eventTypes.*').isString(),
  body('description').optional().isString(),
]);

function requireUserId(req: Request, res: Response): string | null {
  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return userId;
}

router.get('/supported-events', (_req: Request, res: Response) => {
  res.json({ eventTypes: SUPPORTED_WEBHOOK_EVENT_TYPES });
});

router.get('/:businessId/webhook-subscriptions', businessIdParam, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { businessId } = req.params;
    const { assertBusinessAdmin } = await import('../services/webhookSubscriptionService');
    await assertBusinessAdmin(userId, businessId);

    const subscriptions = await listWebhookSubscriptions(businessId);
    res.json({ success: true, subscriptions });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const status = err.message.includes('admin') ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/:businessId/webhook-subscriptions', businessIdParam, createBody, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { businessId } = req.params;
    const body = req.body as { url: string; eventTypes: string[]; description?: string };

    const result = await createWebhookSubscription({
      businessId,
      createdByUserId: userId,
      url: body.url,
      eventTypes: body.eventTypes,
      description: body.description,
    });

    res.status(201).json({ success: true, ...result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const status = err.message.includes('admin') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

router.delete(
  '/:businessId/webhook-subscriptions/:subscriptionId',
  businessIdParam,
  subscriptionIdParam,
  async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req, res);
      if (!userId) return;

      await deleteWebhookSubscription({
        businessId: req.params.businessId,
        subscriptionId: req.params.subscriptionId,
        userId,
      });

      res.json({ success: true });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = err.message.includes('not found')
        ? 404
        : err.message.includes('admin')
          ? 403
          : 500;
      res.status(status).json({ error: err.message });
    }
  }
);

router.post(
  '/:businessId/webhook-subscriptions/:subscriptionId/test',
  businessIdParam,
  subscriptionIdParam,
  async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req, res);
      if (!userId) return;

      const result = await sendWebhookSubscriptionTest({
        businessId: req.params.businessId,
        subscriptionId: req.params.subscriptionId,
        userId,
      });

      res.json({ success: true, ...result });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = err.message.includes('not found')
        ? 404
        : err.message.includes('admin')
          ? 403
          : 500;
      res.status(status).json({ error: err.message });
    }
  }
);

export default router;
