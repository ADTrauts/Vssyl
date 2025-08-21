import Stripe from 'stripe';

// Stripe configuration
export const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  apiVersion: '2025-07-30.basil' as const,
};

// Initialize Stripe client
export const stripe = STRIPE_CONFIG.secretKey 
  ? new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: STRIPE_CONFIG.apiVersion,
    })
  : null;

// Stripe product IDs for different tiers
export const STRIPE_PRODUCTS = {
  FREE: 'prod_free',
  STANDARD: 'prod_standard',
  ENTERPRISE: 'prod_enterprise',
  MODULE_PREMIUM: 'prod_module_premium',
  MODULE_ENTERPRISE: 'prod_module_enterprise',
};

// Stripe price IDs for different tiers
export const STRIPE_PRICES = {
  STANDARD_MONTHLY: 'price_standard_monthly',
  STANDARD_YEARLY: 'price_standard_yearly',
  ENTERPRISE_MONTHLY: 'price_enterprise_monthly',
  ENTERPRISE_YEARLY: 'price_enterprise_yearly',
  MODULE_PREMIUM_MONTHLY: 'price_module_premium_monthly',
  MODULE_PREMIUM_YEARLY: 'price_module_premium_yearly',
  MODULE_ENTERPRISE_MONTHLY: 'price_module_enterprise_monthly',
  MODULE_ENTERPRISE_YEARLY: 'price_module_enterprise_yearly',
};

// Pricing configuration
export const PRICING_CONFIG = {
  STANDARD: {
    monthly: 29.99,
    yearly: 299.99, // ~17% discount
  },
  ENTERPRISE: {
    monthly: 99.99,
    yearly: 999.99, // ~17% discount
  },
  MODULE_PREMIUM: {
    monthly: 9.99,
    yearly: 99.99, // ~17% discount
  },
  MODULE_ENTERPRISE: {
    monthly: 29.99,
    yearly: 299.99, // ~17% discount
  },
};

// Revenue split configuration
export const REVENUE_SPLIT = {
  PLATFORM_SHARE: 0.3, // 30% to platform
  DEVELOPER_SHARE: 0.7, // 70% to developer
};

// Stripe webhook events to handle
export const STRIPE_WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'transfer.created',
  'transfer.failed',
] as const;

export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[number];

// Helper function to check if Stripe is configured
export const isStripeConfigured = (): boolean => {
  return !!(STRIPE_CONFIG.secretKey && STRIPE_CONFIG.publishableKey);
};

// Helper function to get Stripe client
export const getStripeClient = (): Stripe | null => {
  return stripe;
}; 