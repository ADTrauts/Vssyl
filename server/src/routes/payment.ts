import express from 'express';
import {
  createPaymentIntent,
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  getPaymentMethods,
} from '../controllers/paymentController';

const router: express.Router = express.Router();

// Create payment intent
router.post('/intent', createPaymentIntent);

// Create subscription
router.post('/subscription', createSubscription);

// Cancel subscription
router.delete('/subscription/:subscriptionId', cancelSubscription);

// Reactivate subscription
router.post('/subscription/:subscriptionId/reactivate', reactivateSubscription);

// Get payment methods
router.get('/methods', getPaymentMethods);

// Stripe webhook is mounted in index.ts before express.json() (raw body + no JWT).

export default router; 