import express from 'express';
import paymentRouter from '../../routes/payment';
import { authenticateJWT } from '../../middleware/auth';
import { handleWebhook } from '../../controllers/paymentController';

/**
 * Mirrors production middleware order in index.ts for the payment webhook path.
 * Shared by Stripe webhook tests and Phase D high-risk coverage.
 */
export function createAppWithStripeWebhookMount(): express.Application {
  const app = express();

  app.post(
    '/api/payment/webhook',
    express.raw({ type: 'application/json' }),
    (req, res, next) => {
      void handleWebhook(req, res).catch(next);
    }
  );

  app.use(express.json());
  app.use('/api/payment', authenticateJWT, paymentRouter);

  return app;
}
