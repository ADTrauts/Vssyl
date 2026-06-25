export type SubscriptionAmountStatus = 'known' | 'free' | 'unknown';

export function formatSubscriptionAmountDisplay(
  amount: number | null | undefined,
  amountStatus?: SubscriptionAmountStatus,
  tier?: string,
): string {
  const status =
    amountStatus ??
    (tier?.toLowerCase() === 'free' ? 'free' : amount === null || amount === undefined ? 'unknown' : 'known');

  if (status === 'free') {
    return 'Free';
  }
  if (status === 'unknown' || amount === null || amount === undefined) {
    return 'Unavailable';
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function sumDisplayableSubscriptionAmounts(
  subscriptions: Array<{ amount?: number | null; amountStatus?: SubscriptionAmountStatus }>,
): { total: number; hasUnknown: boolean } {
  let total = 0;
  let hasUnknown = false;
  for (const sub of subscriptions) {
    if (sub.amountStatus === 'unknown' || sub.amount === null || sub.amount === undefined) {
      if (sub.amountStatus !== 'free') {
        hasUnknown = true;
      }
      continue;
    }
    total += sub.amount;
  }
  return { total, hasUnknown };
}
