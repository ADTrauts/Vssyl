'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from 'shared/components';
import { BarChart3, DollarSign, Package, Brain, Gauge, ExternalLink } from 'lucide-react';
import { ADMIN_ANALYTICS_SURFACES } from '../../lib/adminAnalyticsOwnership';

interface FederatedLink {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  backendService?: string;
}

const FEDERATED_LINKS: FederatedLink[] = [
  {
    id: 'billing-metrics',
    label: 'Billing & Revenue',
    description: 'Subscription tiers, Stripe customers, and financial management.',
    path: '/admin-portal/billing',
    icon: DollarSign,
    backendService: 'adminBillingService',
  },
  {
    id: 'marketplace-metrics',
    label: 'Marketplace & Modules',
    description: 'Module installs, certification readiness, and developer activity.',
    path: '/admin-portal/modules',
    icon: Package,
    backendService: 'adminModuleGovernanceService',
  },
  {
    id: 'ai-metrics',
    label: 'AI Pipeline Metrics',
    description: 'Grounding quality, provider usage, and diagnostics — not platform BI.',
    path: '/admin-portal/ai-pipeline',
    icon: Brain,
  },
  {
    id: 'performance-metrics',
    label: 'Performance & Infrastructure',
    description: 'Response times, scalability probes, and system resource metrics.',
    path: '/admin-portal/performance',
    icon: Gauge,
    backendService: 'adminPerformanceService',
  },
  {
    id: 'platform-adoption',
    label: 'Platform Adoption',
    description: 'Module adoption signals and program health across workspaces.',
    path: '/admin-portal/platform-adoption',
    icon: BarChart3,
  },
];

/** Consolidated satellite analytics — links to existing surfaces without duplicate dashboards. */
export function AdminAnalyticsFederatedPanel() {
  const satellites = ADMIN_ANALYTICS_SURFACES.filter((s) => s.role === 'satellite');

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-v-text-primary mb-2">Analytics Federation</h2>
        <p className="text-sm text-v-text-secondary">
          Platform Analytics is the canonical destination for business and user metrics. Specialized
          metrics remain on their owning surfaces — use the links below instead of duplicate dashboards.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEDERATED_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Card key={link.id} className="p-5 hover:border-blue-300 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-v-text-primary">{link.label}</h3>
                  <p className="text-sm text-v-text-secondary mt-1">{link.description}</p>
                  {link.backendService && (
                    <p className="text-xs text-v-text-muted mt-1">{link.backendService}</p>
                  )}
                  <Link
                    href={link.path}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3"
                  >
                    Open surface <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-v-text-muted uppercase mb-3">
          Registered satellite surfaces ({satellites.length})
        </h3>
        <ul className="space-y-2 text-sm">
          {satellites.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-1 border-b border-v-border last:border-0">
              <span className="text-v-text-primary">{s.label}</span>
              <Link href={s.path} className="text-blue-600 hover:underline text-xs">
                {s.path}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
