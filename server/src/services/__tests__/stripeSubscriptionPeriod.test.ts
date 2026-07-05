import { describe, expect, it } from 'vitest';
import {
  getStripeSubscriptionPeriodDates,
  getStripeSubscriptionPeriodUnix,
  type StripeSubscriptionPeriodSource,
} from '../stripeSubscriptionPeriod';

describe('stripeSubscriptionPeriod', () => {
  it('reads period from top-level subscription fields (legacy shape)', () => {
    const period = getStripeSubscriptionPeriodUnix({
      current_period_start: 1000,
      current_period_end: 2000,
    } as StripeSubscriptionPeriodSource);
    expect(period).toEqual({ start: 1000, end: 2000 });
  });

  it('reads period from first subscription item (Stripe API 2025+ shape)', () => {
    const period = getStripeSubscriptionPeriodUnix({
      items: {
        data: [{ current_period_start: 3000, current_period_end: 4000 }],
      },
    } as StripeSubscriptionPeriodSource);
    expect(period).toEqual({ start: 3000, end: 4000 });
  });

  it('prefers top-level fields when both are present', () => {
    const period = getStripeSubscriptionPeriodUnix({
      current_period_start: 1000,
      current_period_end: 2000,
      items: {
        data: [{ current_period_start: 3000, current_period_end: 4000 }],
      },
    } as StripeSubscriptionPeriodSource);
    expect(period).toEqual({ start: 1000, end: 2000 });
  });

  it('converts unix seconds to Date objects', () => {
    const { start, end } = getStripeSubscriptionPeriodDates({
      current_period_start: 0,
      current_period_end: 86400,
    } as StripeSubscriptionPeriodSource);
    expect(start.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('1970-01-02T00:00:00.000Z');
  });

  it('throws when period fields are missing', () => {
    expect(() =>
      getStripeSubscriptionPeriodUnix({ items: { data: [{}] } } as StripeSubscriptionPeriodSource)
    ).toThrow('missing current period');
  });
});
