/**
 * Resolves subscription amounts for admin display without false $0 precision.
 */

export type SubscriptionAmountStatus = 'known' | 'free' | 'unknown';

export interface ResolvedSubscriptionAmount {
  amount: number | null;
  status: SubscriptionAmountStatus;
}

interface StripeMetadataItem {
  amount?: number;
  quantity?: number;
}

function parseStripeMetadataItems(stripeMetadata: unknown): StripeMetadataItem[] {
  if (!stripeMetadata || typeof stripeMetadata !== 'object') {
    return [];
  }
  const items = (stripeMetadata as { items?: unknown }).items;
  if (!Array.isArray(items)) {
    return [];
  }
  return items.filter((item): item is StripeMetadataItem => typeof item === 'object' && item !== null);
}

/** Tier (platform) subscription — amount may live in stripeMetadata after Stripe sync. */
export function resolveTierSubscriptionAmount(sub: {
  tier?: string | null;
  stripeMetadata?: unknown;
}): ResolvedSubscriptionAmount {
  const tier = (sub.tier ?? '').toLowerCase();
  if (tier === 'free') {
    return { amount: 0, status: 'free' };
  }

  const items = parseStripeMetadataItems(sub.stripeMetadata);
  if (items.length > 0) {
    const total = items.reduce((sum, item) => {
      const qty = typeof item.quantity === 'number' ? item.quantity : 1;
      const unit = typeof item.amount === 'number' && Number.isFinite(item.amount) ? item.amount : 0;
      return sum + unit * qty;
    }, 0);
    return { amount: total, status: 'known' };
  }

  return { amount: null, status: 'unknown' };
}

/** Module subscription — amount column is authoritative when present. */
export function resolveModuleSubscriptionAmount(sub: {
  amount?: number | null;
  tier?: string | null;
}): ResolvedSubscriptionAmount {
  const tier = (sub.tier ?? '').toLowerCase();
  if (tier === 'free') {
    return { amount: 0, status: 'free' };
  }

  if (typeof sub.amount === 'number' && Number.isFinite(sub.amount)) {
    if (sub.amount === 0) {
      return { amount: 0, status: 'free' };
    }
    return { amount: sub.amount, status: 'known' };
  }

  return { amount: null, status: 'unknown' };
}

export function sumKnownSubscriptionAmounts(
  resolved: ResolvedSubscriptionAmount[],
): { knownTotal: number; unknownCount: number } {
  let knownTotal = 0;
  let unknownCount = 0;
  for (const row of resolved) {
    if (row.status === 'unknown') {
      unknownCount += 1;
      continue;
    }
    knownTotal += row.amount ?? 0;
  }
  return { knownTotal, unknownCount };
}
