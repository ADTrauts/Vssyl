/**
 * Canonical billing API client — all billing operations use /api/billing (PP-3 Phase 3).
 * Do not call /api/payment from new code.
 */
import { authenticatedApiCall } from '../lib/apiUtils';

const BILLING_PREFIX = '/api/billing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlatformTier =
  | 'free'
  | 'standard'
  | 'pro'
  | 'business_basic'
  | 'business_advanced'
  | 'enterprise';

export type ModuleSubscriptionTier = 'premium' | 'enterprise';

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PlatformSubscription {
  id: string;
  userId: string;
  businessId?: string | null;
  tier: string;
  status: string;
  stripeSubscriptionId?: string | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleSubscription {
  id: string;
  moduleId: string;
  userId: string;
  businessId?: string;
  tier: ModuleSubscriptionTier;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  amount: number;
  currency?: string;
  interval?: 'month' | 'year';
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  autoRenew?: boolean;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault?: boolean;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Platform subscriptions
// ---------------------------------------------------------------------------

export async function getUserSubscription(): Promise<{ subscription: PlatformSubscription | null }> {
  return authenticatedApiCall(`${BILLING_PREFIX}/subscriptions/user`);
}

export async function getSubscription(subscriptionId: string): Promise<{ subscription: PlatformSubscription }> {
  return authenticatedApiCall(`${BILLING_PREFIX}/subscriptions/${subscriptionId}`);
}

export async function createPlatformSubscription(body: {
  tier: PlatformTier;
  businessId?: string | null;
  stripeCustomerId?: string;
}): Promise<{ subscription: PlatformSubscription }> {
  return authenticatedApiCall(`${BILLING_PREFIX}/subscriptions`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updatePlatformSubscription(
  subscriptionId: string,
  body: { tier?: PlatformTier; cancelAtPeriodEnd?: boolean; businessId?: string | null }
): Promise<{ subscription: PlatformSubscription }> {
  return authenticatedApiCall(`${BILLING_PREFIX}/subscriptions/${subscriptionId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function cancelPlatformSubscription(subscriptionId: string): Promise<void> {
  await authenticatedApiCall(`${BILLING_PREFIX}/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  });
}

export async function reactivatePlatformSubscription(
  subscriptionId: string
): Promise<{ subscription: PlatformSubscription }> {
  return authenticatedApiCall(`${BILLING_PREFIX}/subscriptions/${subscriptionId}/reactivate`, {
    method: 'POST',
  });
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export async function createCheckoutSession(body: {
  tier: string;
  billingCycle?: 'monthly' | 'yearly';
  businessId?: string | null;
}): Promise<CheckoutSessionResult> {
  return authenticatedApiCall(`${BILLING_PREFIX}/checkout/session`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Module subscriptions
// ---------------------------------------------------------------------------

export async function subscribeModule(
  moduleId: string,
  tier: ModuleSubscriptionTier,
  businessId?: string
): Promise<{ subscription: ModuleSubscription }> {
  return authenticatedApiCall(`${BILLING_PREFIX}/modules/${moduleId}/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ tier, businessId }),
  });
}

export async function getUserModuleSubscriptions(): Promise<{ subscriptions: ModuleSubscription[] }> {
  return authenticatedApiCall(`${BILLING_PREFIX}/modules/subscriptions`);
}

export async function getModuleSubscriptionById(
  subscriptionId: string
): Promise<{ subscription: ModuleSubscription }> {
  return authenticatedApiCall(`${BILLING_PREFIX}/modules/subscriptions/${subscriptionId}`);
}

export async function cancelModuleSubscription(subscriptionId: string): Promise<void> {
  await authenticatedApiCall(`${BILLING_PREFIX}/modules/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Payment methods
// ---------------------------------------------------------------------------

export async function listPaymentMethods(): Promise<{ paymentMethods: PaymentMethod[] }> {
  return authenticatedApiCall(`${BILLING_PREFIX}/payment-methods`);
}

export async function createSetupIntent(): Promise<{ clientSecret: string }> {
  return authenticatedApiCall(`${BILLING_PREFIX}/payment-methods/setup-intent`, {
    method: 'POST',
  });
}

export async function deletePaymentMethod(paymentMethodId: string): Promise<void> {
  await authenticatedApiCall(`${BILLING_PREFIX}/payment-methods/${paymentMethodId}`, {
    method: 'DELETE',
  });
}

export async function createCustomerPortalSession(): Promise<{ url: string }> {
  return authenticatedApiCall(`${BILLING_PREFIX}/customer-portal`, {
    method: 'POST',
  });
}

// ---------------------------------------------------------------------------
// Payment intents (one-off charges — AI packs, etc.)
// ---------------------------------------------------------------------------

export async function createPaymentIntent(body: {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}): Promise<PaymentIntentResult> {
  return authenticatedApiCall(`${BILLING_PREFIX}/intent`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Usage & invoices
// ---------------------------------------------------------------------------

export async function getBillingUsage(businessId?: string): Promise<unknown> {
  const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
  return authenticatedApiCall(`${BILLING_PREFIX}/usage${query}`);
}

export async function getInvoices(): Promise<unknown> {
  return authenticatedApiCall(`${BILLING_PREFIX}/invoices`);
}
