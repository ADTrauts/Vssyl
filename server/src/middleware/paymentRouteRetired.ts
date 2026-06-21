import { Request, Response } from 'express';

const RETIRED_MESSAGE =
  'This /api/payment endpoint has been retired. Use the canonical /api/billing API.';

/**
 * Returns 410 Gone for retired legacy payment routes after client migration (PP-3 Phase 3).
 * Stripe webhooks remain on POST /api/payment/webhook (index.ts mount).
 */
export function paymentRouteRetired(req: Request, res: Response): void {
  const successor = `/api/billing${req.path.replace(/^\/subscription/, '/subscriptions')}`;
  res.status(410).json({
    error: RETIRED_MESSAGE,
    retired: true,
    successor,
    documentation: '/api/billing',
  });
}
