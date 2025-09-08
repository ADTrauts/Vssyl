import { authenticatedApiCall } from '../lib/apiUtils';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface SubscriptionData {
  moduleId: string;
  tier: 'premium' | 'enterprise';
  interval?: 'month' | 'year';
}

export interface ModuleSubscription {
  id: string;
  moduleId: string;
  userId: string;
  businessId?: string;
  tier: 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  startDate: string;
  endDate?: string;
  nextBillingDate: string;
  autoRenew: boolean;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Create payment intent for module subscription
export const createModulePaymentIntent = async (data: SubscriptionData): Promise<PaymentIntent> => {
  const response = await authenticatedApiCall<{ paymentIntent: PaymentIntent }>('/api/payment/intent', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.paymentIntent;
};

// Create module subscription
export const createModuleSubscription = async (data: SubscriptionData): Promise<{ message: string; subscription: ModuleSubscription }> => {
  const response = await authenticatedApiCall<{ message: string; subscription: ModuleSubscription }>('/api/payment/subscription', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
};

// Cancel module subscription
export const cancelModuleSubscription = async (subscriptionId: string): Promise<{ message: string; subscription: ModuleSubscription }> => {
  const response = await authenticatedApiCall<{ message: string; subscription: ModuleSubscription }>(`/api/payment/subscription/${subscriptionId}`, {
    method: 'DELETE',
  });
  return response;
};

// Reactivate module subscription
export const reactivateModuleSubscription = async (subscriptionId: string): Promise<{ message: string; subscription: ModuleSubscription }> => {
  const response = await authenticatedApiCall<{ message: string; subscription: ModuleSubscription }>(`/api/payment/subscription/${subscriptionId}/reactivate`, {
    method: 'POST',
  });
  return response;
}; 