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
  PRO: 'prod_pro',
  BUSINESS_BASIC: 'prod_business_basic',
  BUSINESS_ADVANCED: 'prod_business_advanced',
  ENTERPRISE: 'prod_enterprise',
};

// Stripe price IDs for different tiers
export const STRIPE_PRICES = {
  PRO_MONTHLY: 'price_pro_monthly',
  PRO_YEARLY: 'price_pro_yearly',
  BUSINESS_BASIC_MONTHLY: 'price_business_basic_monthly',
  BUSINESS_BASIC_YEARLY: 'price_business_basic_yearly',
  BUSINESS_ADVANCED_MONTHLY: 'price_business_advanced_monthly',
  BUSINESS_ADVANCED_YEARLY: 'price_business_advanced_yearly',
  ENTERPRISE_MONTHLY: 'price_enterprise_monthly',
  ENTERPRISE_YEARLY: 'price_enterprise_yearly',
};

// Pricing configuration
export const PRICING_CONFIG = {
  FREE: {
    monthly: 0,
    yearly: 0,
    features: ['basic_modules', 'limited_ai', 'ads_supported'],
  },
  PRO: {
    monthly: 29.00,
    yearly: 290.00, // ~17% discount
    features: ['all_modules', 'unlimited_ai', 'no_ads'],
  },
  BUSINESS_BASIC: {
    monthly: 49.99,
    yearly: 499.99, // ~17% discount
    perEmployee: 5.00,
    includedEmployees: 10,
    features: ['all_modules', 'basic_ai', 'team_management', 'enterprise_features'],
  },
  BUSINESS_ADVANCED: {
    monthly: 69.99,
    yearly: 699.99, // ~17% discount
    perEmployee: 5.00,
    includedEmployees: 10,
    features: ['all_modules', 'advanced_ai', 'team_management', 'enterprise_features', 'advanced_analytics'],
  },
  ENTERPRISE: {
    monthly: 129.99,
    yearly: 1299.99, // ~17% discount
    perEmployee: 5.00,
    includedEmployees: 10,
    features: ['all_modules', 'unlimited_ai', 'team_management', 'enterprise_features', 'advanced_analytics', 'custom_integrations', 'dedicated_support'],
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