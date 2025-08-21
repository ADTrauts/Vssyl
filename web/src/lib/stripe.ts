import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
};

// Payment intent types
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

// API functions for Stripe integration
export const createPaymentIntent = async (
  request: CreatePaymentIntentRequest
): Promise<PaymentIntentResponse> => {
  const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/payment/intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment intent');
  }

  return response.json();
};

export const createSubscription = async (
  request: CreateSubscriptionRequest
): Promise<SubscriptionResponse> => {
  const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/payment/subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create subscription');
  }

  return response.json();
};

export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  const response = await fetch(
    `${STRIPE_CONFIG.apiUrl}/api/payment/subscription/${subscriptionId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel subscription');
  }
};

export const reactivateSubscription = async (subscriptionId: string): Promise<void> => {
  const response = await fetch(
    `${STRIPE_CONFIG.apiUrl}/api/payment/subscription/${subscriptionId}/reactivate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reactivate subscription');
  }
};

export const getPaymentMethods = async () => {
  const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/payment/methods`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get payment methods');
  }

  return response.json();
};

// Utility functions
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100); // Convert to cents
};

export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100; // Convert from cents
};

export const getStripeError = (error: any): string => {
  if (error.type === 'StripeCardError') {
    return error.message;
  } else if (error.type === 'StripeInvalidRequestError') {
    return 'Invalid request to Stripe.';
  } else if (error.type === 'StripeAPIError') {
    return 'Stripe API error.';
  } else if (error.type === 'StripeConnectionError') {
    return 'Network error with Stripe.';
  } else if (error.type === 'StripeAuthenticationError') {
    return 'Authentication with Stripe failed.';
  } else {
    return 'An unexpected error occurred.';
  }
}; 