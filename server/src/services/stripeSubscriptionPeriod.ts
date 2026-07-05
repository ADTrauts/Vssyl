import type Stripe from 'stripe';

/** Stripe subscription payload — period may be top-level (legacy) or on first item (API 2025+). */
export type StripeSubscriptionPeriodSource = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
  items?: Stripe.Subscription['items'] & {
    data?: Array<
      Stripe.SubscriptionItem & {
        current_period_start?: number;
        current_period_end?: number;
      }
    >;
  };
};

export function getStripeSubscriptionPeriodUnix(subscription: StripeSubscriptionPeriodSource): {
  start: number;
  end: number;
} {
  const topLevelStart = subscription.current_period_start;
  const topLevelEnd = subscription.current_period_end;
  const firstItem = subscription.items?.data?.[0];

  const start = topLevelStart ?? firstItem?.current_period_start;
  const end = topLevelEnd ?? firstItem?.current_period_end;

  if (typeof start !== 'number' || typeof end !== 'number') {
    throw new Error('Stripe subscription is missing current period start/end');
  }

  return { start, end };
}

export function getStripeSubscriptionPeriodDates(subscription: StripeSubscriptionPeriodSource): {
  start: Date;
  end: Date;
} {
  const { start, end } = getStripeSubscriptionPeriodUnix(subscription);
  return {
    start: new Date(start * 1000),
    end: new Date(end * 1000),
  };
}
