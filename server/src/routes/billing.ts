import express from 'express';
import {
  // Core subscription endpoints
  createSubscription,
  getSubscription,
  getUserSubscription,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  // Module subscription endpoints
  createModuleSubscription,
  getModuleSubscription,
  getUserModuleSubscriptions,
  updateModuleSubscription,
  cancelModuleSubscription,
  // Usage tracking endpoints
  getUsage,
  recordUsage,
  // Invoice endpoints
  getInvoices,
  getInvoice,
  // Developer revenue endpoints
  getDeveloperRevenue,
} from '../controllers/billingController';

const router = express.Router();

// Core subscription routes
router.post('/subscriptions', createSubscription);
router.get('/subscriptions/user', getUserSubscription);
router.get('/subscriptions/:id', getSubscription);
router.put('/subscriptions/:id', updateSubscription);
router.delete('/subscriptions/:id', cancelSubscription);
router.post('/subscriptions/:id/reactivate', reactivateSubscription);

// Module subscription routes
router.post('/modules/:moduleId/subscribe', createModuleSubscription);
router.get('/modules/subscriptions', getUserModuleSubscriptions);
router.get('/modules/subscriptions/:id', getModuleSubscription);
router.put('/modules/subscriptions/:id', updateModuleSubscription);
router.delete('/modules/subscriptions/:id', cancelModuleSubscription);

// Usage tracking routes
router.get('/usage', getUsage);
router.post('/usage', recordUsage);

// Invoice routes
router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoice);

// Developer revenue routes
router.get('/developer/revenue', getDeveloperRevenue);

export default router; 