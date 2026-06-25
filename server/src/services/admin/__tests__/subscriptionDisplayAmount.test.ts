import { describe, expect, it } from 'vitest';
import {
  resolveModuleSubscriptionAmount,
  resolveTierSubscriptionAmount,
  sumKnownSubscriptionAmounts,
} from '../subscriptionDisplayAmount';

describe('subscriptionDisplayAmount', () => {
  it('resolveTierSubscriptionAmount returns free for free tier', () => {
    expect(resolveTierSubscriptionAmount({ tier: 'free' })).toEqual({
      amount: 0,
      status: 'free',
    });
  });

  it('resolveTierSubscriptionAmount sums stripeMetadata.items', () => {
    expect(
      resolveTierSubscriptionAmount({
        tier: 'pro',
        stripeMetadata: {
          items: [
            { amount: 29, quantity: 1 },
            { amount: 10, quantity: 2 },
          ],
        },
      }),
    ).toEqual({ amount: 49, status: 'known' });
  });

  it('resolveTierSubscriptionAmount returns unknown without metadata (not $0)', () => {
    expect(resolveTierSubscriptionAmount({ tier: 'pro' })).toEqual({
      amount: null,
      status: 'unknown',
    });
  });

  it('resolveModuleSubscriptionAmount preserves free module $0', () => {
    expect(resolveModuleSubscriptionAmount({ tier: 'free', amount: 0 })).toEqual({
      amount: 0,
      status: 'free',
    });
  });

  it('resolveModuleSubscriptionAmount returns known paid amount', () => {
    expect(resolveModuleSubscriptionAmount({ tier: 'premium', amount: 9.99 })).toEqual({
      amount: 9.99,
      status: 'known',
    });
  });

  it('sumKnownSubscriptionAmounts excludes unknown rows', () => {
    const result = sumKnownSubscriptionAmounts([
      { amount: 10, status: 'known' },
      { amount: null, status: 'unknown' },
      { amount: 0, status: 'free' },
    ]);
    expect(result).toEqual({ knownTotal: 10, unknownCount: 1 });
  });
});
