'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Badge } from 'shared/components';
import { Check, X } from 'lucide-react';

export type Tier = 'free' | 'pro' | 'business_basic' | 'business_advanced' | 'enterprise';

export type TierOrString = Tier | string;

export interface TierFeature {
  name: string;
  tiers: {
    free: boolean | string;
    pro: boolean | string;
    business_basic: boolean | string;
    business_advanced: boolean | string;
    enterprise: boolean | string;
    [key: string]: boolean | string | undefined;
  };
}

interface PricingRow {
  tier: string;
  billingCycle: string;
  basePrice: number;
  perEmployeePrice?: number | null;
  includedEmployees?: number | null;
}

interface PlanComparisonProps {
  currentTier?: TierOrString;
  onSelectTier?: (tier: TierOrString) => void;
  showActions?: boolean;
  userType?: 'personal' | 'business';
  /** When provided (e.g. by BillingModal), use this instead of fetching so pricing stays in sync when modal opens */
  pricingFromParent?: PricingRow[];
}

// Feature definitions for comparison table
const TIER_FEATURES: TierFeature[] = [
  {
    name: 'Price (Monthly)',
    tiers: {
      free: '$0',
      pro: '$29.00',
      business_basic: '$49.99',
      business_advanced: '$69.99',
      enterprise: '$129.99',
    },
  },
  {
    name: 'Price (Yearly)',
    tiers: {
      free: '$0',
      pro: '$290.00',
      business_basic: '$499.99',
      business_advanced: '$699.99',
      enterprise: '$1,299.99',
    },
  },
  {
    name: 'Core Modules',
    tiers: {
      free: true,
      pro: true,
      business_basic: true,
      business_advanced: true,
      enterprise: true,
    },
  },
  {
    name: 'AI Queries (Monthly)',
    tiers: {
      free: '50',
      pro: '1,000 + packs',
      business_basic: '2,000 + packs',
      business_advanced: '5,000 + packs',
      enterprise: 'Unlimited',
    },
  },
  {
    name: 'Storage',
    tiers: {
      free: '5 GB',
      pro: '100 GB',
      business_basic: '500 GB',
      business_advanced: '2 TB',
      enterprise: 'Unlimited',
    },
  },
  {
    name: 'Ad-Free Experience',
    tiers: {
      free: false,
      pro: true,
      business_basic: true,
      business_advanced: true,
      enterprise: true,
    },
  },
  {
    name: 'Team Management',
    tiers: {
      free: false,
      pro: false,
      business_basic: true,
      business_advanced: true,
      enterprise: true,
    },
  },
  {
    name: 'Advanced AI Settings',
    tiers: {
      free: false,
      pro: false,
      business_basic: false,
      business_advanced: true,
      enterprise: true,
    },
  },
  {
    name: 'Advanced Analytics',
    tiers: {
      free: false,
      pro: false,
      business_basic: false,
      business_advanced: true,
      enterprise: true,
    },
  },
  {
    name: 'Data Loss Prevention',
    tiers: {
      free: false,
      pro: false,
      business_basic: false,
      business_advanced: true,
      enterprise: true,
    },
  },
  {
    name: 'Custom Integrations',
    tiers: {
      free: false,
      pro: false,
      business_basic: false,
      business_advanced: false,
      enterprise: true,
    },
  },
  {
    name: 'Dedicated Support',
    tiers: {
      free: false,
      pro: false,
      business_basic: false,
      business_advanced: false,
      enterprise: true,
    },
  },
];

const TIER_NAMES: Record<Tier, string> = {
  free: 'Free',
  pro: 'Pro',
  business_basic: 'Business Basic',
  business_advanced: 'Business Advanced',
  enterprise: 'Enterprise',
};

const TIER_COLORS: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  free: 'gray',
  pro: 'blue',
  business_basic: 'green',
  business_advanced: 'green',
  enterprise: 'yellow',
};

function formatTierDisplayName(tier: string): string {
  return tier
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function PlanComparison({ currentTier, onSelectTier, showActions = true, userType, pricingFromParent }: PlanComparisonProps) {
  const [pricingFetched, setPricingFetched] = useState<PricingRow[]>([]);

  useEffect(() => {
    if (pricingFromParent != null) return;
    let cancelled = false;
    fetch('/api/pricing')
      .then((res) => (res.ok ? res.json() : { pricing: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data.pricing)) setPricingFetched(data.pricing);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pricingFromParent]);

  const pricing = pricingFromParent ?? pricingFetched;

  const pricesByTier = useMemo(() => {
    const map: Record<string, { monthly: number; yearly: number }> = {};
    pricing.forEach((p) => {
      if (!map[p.tier]) map[p.tier] = { monthly: 0, yearly: 0 };
      if (p.billingCycle === 'monthly') map[p.tier].monthly = p.basePrice;
      else map[p.tier].yearly = p.basePrice;
    });
    return map;
  }, [pricing]);

  const uniqueTiersFromApi = useMemo(() => {
    const tiers = Array.from(new Set(pricing.map((p) => p.tier))).filter((t) => t !== 'free');
    return ['free', ...tiers.sort((a, b) => a.localeCompare(b))];
  }, [pricing]);

  const availableTiers = useMemo((): TierOrString[] => {
    const businessTiers = ['business_basic', 'business_advanced', 'enterprise'];
    const personalTiers = ['pro'];
    if (userType === 'business') {
      return uniqueTiersFromApi.filter(
        (t) => t === 'free' || businessTiers.includes(t) || !personalTiers.includes(t)
      );
    }
    if (userType === 'personal') {
      return uniqueTiersFromApi.filter(
        (t) => t === 'free' || personalTiers.includes(t) || !businessTiers.includes(t)
      );
    }
    return uniqueTiersFromApi.length > 0 ? uniqueTiersFromApi : ['free', 'pro', 'business_basic', 'business_advanced', 'enterprise'];
  }, [userType, uniqueTiersFromApi]);

  const renderFeatureValue = (value: boolean | string | undefined) => {
    if (value === undefined) return <span className="text-sm text-gray-500 dark:text-gray-400">—</span>;
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-600" />
      ) : (
        <X className="h-5 w-5 text-gray-400" />
      );
    }
    return <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>;
  };

  const isCurrentTier = (tier: TierOrString) => tier === currentTier;

  const getTierName = (tier: TierOrString) => {
    const key = tier as Tier;
    return (TIER_NAMES as Record<string, string>)[tier] ?? formatTierDisplayName(tier);
  };

  const getTierColor = (tier: TierOrString): 'gray' | 'blue' | 'green' | 'yellow' | 'red' =>
    tier in TIER_COLORS ? TIER_COLORS[tier] : 'blue';

  const getFeatureValueForTier = (featureName: string, tier: TierOrString): boolean | string | undefined => {
    if (featureName === 'Price (Monthly)') {
      const prices = pricesByTier[tier];
      return prices ? formatCurrency(prices.monthly) : (TIER_FEATURES[0].tiers[tier] as string | undefined);
    }
    if (featureName === 'Price (Yearly)') {
      const prices = pricesByTier[tier];
      return prices ? formatCurrency(prices.yearly) : (TIER_FEATURES[1].tiers[tier] as string | undefined);
    }
    const feature = TIER_FEATURES.find((f) => f.name === featureName);
    if (!feature) return undefined;
    const val = feature.tiers[tier];
    return val !== undefined ? val : undefined;
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Choose Your Plan</h3>
        <p className="text-gray-600 dark:text-gray-400">Compare features and find the perfect plan for your needs</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border-b border-gray-200 dark:border-slate-700 font-semibold text-gray-900 dark:text-gray-100">Feature</th>
                {availableTiers.map((tier) => (
                  <th key={tier} className="text-center p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{getTierName(tier)}</span>
                        {isCurrentTier(tier) && (
                          <Badge color={getTierColor(tier)} className="text-xs">Current</Badge>
                        )}
                      </div>
                      {showActions && onSelectTier && !isCurrentTier(tier) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onSelectTier(tier)}
                          className="mt-2"
                        >
                          {currentTier && ['free', 'pro'].includes(currentTier) && ['business_basic', 'business_advanced', 'enterprise'].includes(tier)
                            ? 'Upgrade'
                            : currentTier && ['business_basic', 'business_advanced', 'enterprise'].includes(currentTier) && ['free', 'pro'].includes(tier)
                            ? 'Downgrade'
                            : currentTier && tier === 'enterprise'
                            ? 'Upgrade'
                            : 'Select'}
                        </Button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIER_FEATURES.map((feature, index) => (
                <tr key={feature.name} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-4 border-b border-gray-200 dark:border-slate-700 font-medium text-gray-900 dark:text-gray-100">{feature.name}</td>
                  {availableTiers.map((tier) => (
                    <td key={tier} className="p-4 border-b border-gray-200 dark:border-slate-700 text-center">
                      {renderFeatureValue(getFeatureValueForTier(feature.name, tier))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
        <p>All prices are in USD. Business plans include 10 employees, additional employees are $5/month each.</p>
        <p className="mt-1">Yearly plans save approximately 17% compared to monthly billing.</p>
      </div>
    </div>
  );
}

