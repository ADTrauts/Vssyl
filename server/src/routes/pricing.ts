import express from 'express';
import { body } from 'express-validator';
import { authenticateJWT, getUserFromRequest } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';
import {
  getAllPricing,
  getPricing,
  getPricingInfo,
  upsertPricing,
  createTier,
  getPriceHistory,
  getAllPriceHistory,
  calculatePriceImpact,
  clearPricingCache,
  seedPricing,
  stripeStatus,
} from '../controllers/pricingController';

const router: express.Router = express.Router();

// Helper middleware to check admin role
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Public routes (for frontend to display pricing)
router.get('/', getAllPricing);
// Admin Stripe connectivity check (must be before /:tier)
router.get('/stripe-status', authenticateJWT, requireAdmin, stripeStatus);
router.get('/:tier', getPricing);
router.get('/:tier/info', getPricingInfo);

// Admin-only routes (specific paths before /:tier)
router.post('/seed', authenticateJWT, requireAdmin, seedPricing);
router.post('/tiers', authenticateJWT, requireAdmin, createTier);
router.post('/', authenticateJWT, requireAdmin, upsertPricing);
router.post(
  '/calculate-impact',
  authenticateJWT,
  requireAdmin,
  validate([
    body('tier').isString().notEmpty().trim(),
    body('newBasePrice').isFloat({ min: 0 }),
    body('billingCycle').optional().isIn(['monthly', 'yearly']),
  ]),
  calculatePriceImpact
);
router.get('/history/all', authenticateJWT, requireAdmin, getAllPriceHistory);
router.get('/:pricingConfigId/history', authenticateJWT, requireAdmin, getPriceHistory);
router.post('/clear-cache', authenticateJWT, requireAdmin, clearPricingCache);

export default router;

