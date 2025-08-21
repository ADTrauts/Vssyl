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

// Create payment intent for module subscription
export const createModulePaymentIntent = async (data: SubscriptionData): Promise<PaymentIntent> => {
  const response = await authenticatedApiCall<{ paymentIntent: PaymentIntent }>('/api/payment/intent', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.paymentIntent;
};

// Create module subscription
export const createModuleSubscription = async (data: SubscriptionData): Promise<{ message: string; subscription: any }> => {
  const response = await authenticatedApiCall<{ message: string; subscription: any }>('/api/payment/subscription', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
};

// Cancel module subscription
export const cancelModuleSubscription = async (subscriptionId: string): Promise<{ message: string; subscription: any }> => {
  const response = await authenticatedApiCall<{ message: string; subscription: any }>(`/api/payment/subscription/${subscriptionId}`, {
    method: 'DELETE',
  });
  return response;
};

// Reactivate module subscription
export const reactivateModuleSubscription = async (subscriptionId: string): Promise<{ message: string; subscription: any }> => {
  const response = await authenticatedApiCall<{ message: string; subscription: any }>(`/api/payment/subscription/${subscriptionId}/reactivate`, {
    method: 'POST',
  });
  return response;
}; 