import type { PricingTierContent } from './landingContent';

export type BillingCycle = 'monthly' | 'yearly';

export interface PricingApiRow {
  tier: string;
  billingCycle: string;
  basePrice: number;
}

/** Merge /api/pricing rows into per-tier monthly/yearly amounts (tier keys lowercase). */
export function buildTierPriceMap(rows: PricingApiRow[]): Record<string, { monthly?: number; yearly?: number }> {
  const map: Record<string, { monthly?: number; yearly?: number }> = {};
  for (const p of rows) {
    const t = typeof p.tier === 'string' ? p.tier.toLowerCase() : '';
    if (!t) continue;
    if (!map[t]) map[t] = {};
    if (p.billingCycle === 'monthly') map[t].monthly = p.basePrice;
    if (p.billingCycle === 'yearly') map[t].yearly = p.basePrice;
  }
  return map;
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/**
 * Landing card label: prefer live API amounts; otherwise static fallbacks per billing cycle.
 */
export function getTierPriceDisplay(
  tier: PricingTierContent,
  cycle: BillingCycle,
  map: Record<string, { monthly?: number; yearly?: number }> | null,
  apiReturned: boolean
): { main: string; suffix: string } {
  const key = tier.tierKey.toLowerCase();
  const entry = apiReturned && map ? map[key] : null;
  const amt =
    entry != null ? (cycle === 'monthly' ? entry.monthly : entry.yearly) : undefined;

  if (key === 'free') {
    return { main: '$0', suffix: cycle === 'monthly' ? '/month' : '/year' };
  }

  if (amt != null && !Number.isNaN(amt)) {
    const low = tier.name.toLowerCase();
    if (low.includes('enterprise') && amt === 0) {
      return { main: 'Custom', suffix: '' };
    }
    return {
      main: usd.format(amt),
      suffix: cycle === 'monthly' ? '/month' : '/year',
    };
  }

  const fb = cycle === 'monthly' ? tier.fallbackPriceLabel : tier.fallbackYearlyLabel;
  const fbLower = fb.toLowerCase();
  if (fbLower.includes('custom')) {
    return { main: 'Custom', suffix: '' };
  }
  return { main: fb, suffix: '' };
}
