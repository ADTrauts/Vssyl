import express from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validateRequest';
import {
  createSubscription,
  getSubscription,
  getUserSubscription,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  updateSubscriptionEmployeeCount,
  createCheckoutSession,
  createModuleSubscription,
  getModuleSubscription,
  getUserModuleSubscriptions,
  updateModuleSubscription,
  cancelModuleSubscription,
  getUsage,
  recordUsage,
  getInvoices,
  getInvoice,
  getDeveloperRevenue,
  listPaymentMethods,
  createSetupIntent,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  createCustomerPortalSession,
} from '../controllers/billingController';
import { createPaymentIntent } from '../controllers/paymentController';

const router: express.Router = express.Router();

// Payment intent (canonical — migrated from /api/payment/intent)
router.post(
  '/intent',
  validate([
    body('amount').isFloat({ min: 0.01 }),
    body('currency').optional().isString(),
    body('metadata').optional().isObject(),
  ]),
  createPaymentIntent
);

const subscriptionIdParam = validate([param('id').isUUID()]);
const moduleSubscriptionIdParam = validate([param('id').isUUID()]);
const moduleIdParam = validate([param('moduleId').isUUID()]);

// Core subscription routes
router.post(
  '/subscriptions',
  validate([
    body('tier').isIn(['free', 'standard', 'enterprise']),
    body('businessId').optional({ values: 'null' }).isUUID(),
    body('stripeCustomerId').optional().isString(),
  ]),
  createSubscription
);
router.get('/subscriptions/user', getUserSubscription);
router.get('/subscriptions/:id', subscriptionIdParam, getSubscription);
router.put(
  '/subscriptions/:id',
  subscriptionIdParam,
  validate([
    body('tier').optional().isIn([
      'free',
      'standard',
      'pro',
      'business_basic',
      'business_advanced',
      'enterprise',
    ]),
    body('cancelAtPeriodEnd').optional().isBoolean(),
    body('businessId').optional({ values: 'null' }).isUUID(),
  ]),
  updateSubscription
);
router.put(
  '/subscriptions/:id/employee-count',
  subscriptionIdParam,
  validate([body('employeeCount').isInt({ min: 0 })]),
  updateSubscriptionEmployeeCount
);
router.delete('/subscriptions/:id', subscriptionIdParam, cancelSubscription);
router.post('/subscriptions/:id/reactivate', subscriptionIdParam, reactivateSubscription);

// Checkout routes
router.post(
  '/checkout/session',
  validate([
    body('tier').isIn(['pro', 'business_basic', 'business_advanced', 'enterprise']),
    body('billingCycle').optional().isIn(['monthly', 'yearly']),
    body('businessId').optional({ values: 'null' }).isUUID(),
  ]),
  createCheckoutSession
);

// Module subscription routes
router.post(
  '/modules/:moduleId/subscribe',
  moduleIdParam,
  validate([
    body('tier').optional().isIn(['premium', 'enterprise']),
    body('businessId').optional({ values: 'null' }).isUUID(),
  ]),
  createModuleSubscription
);
router.get('/modules/subscriptions', getUserModuleSubscriptions);
router.get('/modules/subscriptions/:id', moduleSubscriptionIdParam, getModuleSubscription);
router.put(
  '/modules/subscriptions/:id',
  moduleSubscriptionIdParam,
  validate([
    body('tier').optional().isIn(['premium', 'enterprise']),
    body('status').optional().isString(),
  ]),
  updateModuleSubscription
);
router.delete('/modules/subscriptions/:id', moduleSubscriptionIdParam, cancelModuleSubscription);

// Usage tracking routes
router.get('/usage', validate([query('businessId').optional().isUUID()]), getUsage);
router.post(
  '/usage',
  validate([
    body('subscriptionId').isUUID(),
    body('metric').isString().notEmpty().trim(),
    body('quantity').isInt({ min: 0 }),
    body('cost').isFloat({ min: 0 }),
  ]),
  recordUsage
);

// Invoice routes
router.get('/invoices', getInvoices);
router.get('/invoices/:id', validate([param('id').isUUID()]), getInvoice);

// Developer revenue routes
router.get('/developer/revenue', getDeveloperRevenue);

// Payment method routes
router.get('/payment-methods', listPaymentMethods);
router.post('/payment-methods/setup-intent', createSetupIntent);
router.delete(
  '/payment-methods/:paymentMethodId',
  validate([param('paymentMethodId').isString().notEmpty()]),
  deletePaymentMethod
);
router.post(
  '/payment-methods/default',
  validate([body('paymentMethodId').isString().notEmpty()]),
  setDefaultPaymentMethod
);
router.post('/customer-portal', createCustomerPortalSession);

export default router;
