import { loadStripe } from '@stripe/stripe-js';
import {
  createPaymentIntent as billingCreatePaymentIntent,
  createPlatformSubscription,
  cancelPlatformSubscription,
  reactivatePlatformSubscription,
  listPaymentMethods,
} from '../api/billing';

// Initialize Stripe.js for client-side confirmation flows
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};

// Payment intent types (legacy shape for PaymentModal compatibility)
export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionRequest {
  tier: 'standard' | 'enterprise';
  interval: 'month' | 'year';
  moduleId?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface SubscriptionResponse {
  subscriptionId: string;
  stripeSubscriptionId: string;
  status: string;
  clientSecret?: string;
}

/** @deprecated Prefer `createPaymentIntent` from `web/src/api/billing.ts` */
export const createPaymentIntent = async (
  request: CreatePaymentIntentRequest
): Promise<PaymentIntentResponse> => {
  const result = await billingCreatePaymentIntent({
    amount: request.amount,
    currency: request.currency,
    metadata: request.metadata,
  });
  return {
    clientSecret: result.clientSecret,
    paymentIntentId: result.paymentIntentId,
  };
};

/**
 * Platform subscription create — use billing checkout or subscribeModule for modules.
 * @deprecated For modules use `subscribeModule` from `web/src/api/billing.ts`.
 */
export const createSubscription = async (
  request: CreateSubscriptionRequest
): Promise<SubscriptionResponse> => {
  if (request.moduleId) {
    const { subscribeModule } = await import('../api/billing');
    const tier = request.tier === 'enterprise' ? 'enterprise' : 'premium';
    const { subscription } = await subscribeModule(request.moduleId, tier);
    return {
      subscriptionId: subscription.id,
      stripeSubscriptionId: subscription.stripeSubscriptionId || '',
      status: subscription.status,
    };
  }

  const tier = request.tier === 'enterprise' ? 'enterprise' : 'standard';
  const { subscription } = await createPlatformSubscription({ tier });
  return {
    subscriptionId: subscription.id,
    stripeSubscriptionId: subscription.stripeSubscriptionId || '',
    status: subscription.status,
  };
};

export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  await cancelPlatformSubscription(subscriptionId);
};

export const reactivateSubscription = async (subscriptionId: string): Promise<void> => {
  await reactivatePlatformSubscription(subscriptionId);
};

export const getPaymentMethods = async () => {
  return listPaymentMethods();
};

export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100;
};

export interface StripeError {
  type:
    | 'StripeCardError'
    | 'StripeInvalidRequestError'
    | 'StripeAPIError'
    | 'StripeConnectionError'
    | 'StripeAuthenticationError'
    | string;
  message?: string;
  code?: string;
}

export const getStripeError = (error: StripeError): string => {
  if (error.type === 'StripeCardError') {
    return error.message || 'Card error occurred';
  } else if (error.type === 'StripeInvalidRequestError') {
    return 'Invalid request to Stripe.';
  } else if (error.type === 'StripeAPIError') {
    return 'Stripe API error.';
  } else if (error.type === 'StripeConnectionError') {
    return 'Network error with Stripe.';
  } else if (error.type === 'StripeAuthenticationError') {
    return 'Authentication with Stripe failed.';
  }
  return 'An unexpected error occurred.';
};
