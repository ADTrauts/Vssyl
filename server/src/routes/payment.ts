import express from 'express';
import { paymentApiDeprecation } from '../middleware/paymentApiDeprecation';
import { paymentRouteRetired } from '../middleware/paymentRouteRetired';

const router: express.Router = express.Router();

router.use(paymentApiDeprecation);

// PP-3 Phase 3: JWT-gated routes retired — clients use /api/billing.
// Webhook remains on POST /api/payment/webhook in index.ts (raw body, no JWT).
router.post('/intent', paymentRouteRetired);
router.post('/subscription', paymentRouteRetired);
router.delete('/subscription/:subscriptionId', paymentRouteRetired);
router.post('/subscription/:subscriptionId/reactivate', paymentRouteRetired);
router.get('/methods', paymentRouteRetired);

// Stripe webhook is mounted in index.ts before express.json() (raw body + no JWT).

export default router; 