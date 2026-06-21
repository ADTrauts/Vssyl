/**
 * @deprecated Use `web/src/api/billing.ts` — legacy payment API client (PP-3 Phase 3 retirement).
 * Re-exports canonical billing paths for backward compatibility only.
 */
import {
  createPaymentIntent as billingCreatePaymentIntent,
  subscribeModule,
  cancelPlatformSubscription,
  reactivatePlatformSubscription,
  type ModuleSubscription,
  type ModuleSubscriptionTier,
} from './billing';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface SubscriptionData {
  moduleId: string;
  tier: ModuleSubscriptionTier;
  interval?: 'month' | 'year';
}

export type { ModuleSubscription };

function warnDeprecated(fn: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[deprecated] web/src/api/payment.ts:${fn} — use web/src/api/billing.ts`);
  }
}

export const createModulePaymentIntent = async (data: SubscriptionData): Promise<PaymentIntent> => {
  warnDeprecated('createModulePaymentIntent');
  const result = await billingCreatePaymentIntent({
    amount: 0,
    metadata: { moduleId: data.moduleId, tier: data.tier },
  });
  return {
    id: result.paymentIntentId,
    amount: 0,
    currency: 'usd',
    status: 'requires_payment_method',
    client_secret: result.clientSecret,
  };
};

export const createModuleSubscription = async (
  data: SubscriptionData
): Promise<{ message: string; subscription: ModuleSubscription }> => {
  warnDeprecated('createModuleSubscription');
  const { subscription } = await subscribeModule(data.moduleId, data.tier);
  return { message: 'Subscription created', subscription };
};

export const cancelModuleSubscription = async (
  subscriptionId: string
): Promise<{ message: string; subscription: ModuleSubscription }> => {
  warnDeprecated('cancelModuleSubscription');
  await cancelPlatformSubscription(subscriptionId);
  return {
    message: 'Subscription cancelled',
    subscription: { id: subscriptionId } as ModuleSubscription,
  };
};

export const reactivateModuleSubscription = async (
  subscriptionId: string
): Promise<{ message: string; subscription: ModuleSubscription }> => {
  warnDeprecated('reactivateModuleSubscription');
  const { subscription } = await reactivatePlatformSubscription(subscriptionId);
  return {
    message: 'Subscription reactivated',
    subscription: subscription as unknown as ModuleSubscription,
  };
};
