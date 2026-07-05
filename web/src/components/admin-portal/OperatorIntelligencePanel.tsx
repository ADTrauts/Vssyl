'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Badge } from 'shared/components';
import {
  Building2,
  Mail,
  DollarSign,
  Brain,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { adminApiService } from '../../lib/adminApiService';

interface IntelligenceDomain {
  status: string;
  href?: string;
  attention?: string[];
  summary?: string;
  lastSendRelative?: string | null;
  failuresLast24h?: number;
  mode?: string;
  mrr?: number;
  renewalsToday?: number;
  total?: number;
  createdThisWeek?: number;
  billingIssues?: number;
  inactiveWorkspaces?: number;
}

interface IntelligenceSummary {
  overallStatus: string;
  attentionCount: number;
  businesses: IntelligenceDomain;
  email: IntelligenceDomain;
  stripe: IntelligenceDomain;
  ai: IntelligenceDomain;
}

const STATUS_STYLES: Record<string, string> = {
  healthy: 'bg-green-100 text-green-800 border-green-200',
  attention: 'bg-amber-100 text-amber-800 border-amber-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  offline: 'bg-red-100 text-red-800 border-red-200',
  unknown: 'bg-gray-100 text-gray-800 border-gray-200',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'healthy') return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (status === 'attention' || status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-600" />;
  return <AlertTriangle className="w-4 h-4 text-red-600" />;
}

export function OperatorIntelligencePanel() {
  const [data, setData] = useState<IntelligenceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApiService.getOperatorIntelligence();
      if (!res.error && res.data) setData(res.data as IntelligenceSummary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      key: 'businesses',
      label: 'Businesses',
      icon: Building2,
      domain: data.businesses,
      lines: [
        `${data.businesses.total ?? 0} total`,
        data.businesses.createdThisWeek != null ? `+${data.businesses.createdThisWeek} this week` : null,
        ...(data.businesses.attention ?? []),
      ].filter(Boolean) as string[],
    },
    {
      key: 'email',
      label: 'Email',
      icon: Mail,
      domain: data.email,
      lines: [
        data.email.status === 'healthy' ? 'Healthy' : 'Needs attention',
        data.email.lastSendRelative ? `Last send ${data.email.lastSendRelative}` : 'No recent sends',
        `${data.email.failuresLast24h ?? 0} failures (24h)`,
      ],
    },
    {
      key: 'stripe',
      label: 'Stripe',
      icon: DollarSign,
      domain: data.stripe,
      lines: [
        data.stripe.status === 'healthy' ? 'Healthy' : 'Review billing',
        data.stripe.mrr != null ? `MRR $${Number(data.stripe.mrr).toLocaleString()}` : null,
        data.stripe.renewalsToday != null ? `${data.stripe.renewalsToday} renewals today` : null,
        ...(data.stripe.attention ?? []),
      ].filter(Boolean) as string[],
    },
    {
      key: 'ai',
      label: 'AI',
      icon: Brain,
      domain: data.ai,
      lines: [
        data.ai.status === 'healthy' ? 'Healthy' : 'Provider attention needed',
        ...(data.ai.attention ?? []),
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-v-text-primary">Operational Intelligence</h2>
          <p className="text-sm text-v-text-secondary">
            What needs attention — not raw metrics. {data.attentionCount > 0 ? `${data.attentionCount} signal(s) require review.` : 'All domains nominal.'}
          </p>
        </div>
        <button type="button" onClick={() => void load()} className="p-2 text-v-text-muted hover:text-v-text-primary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ key, label, icon: Icon, domain, lines }) => (
          <Link key={key} href={domain.href ?? '#'}>
            <Card className={`p-4 border h-full hover:border-blue-300 transition-colors ${STATUS_STYLES[domain.status] ?? STATUS_STYLES.unknown}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{label}</span>
                </div>
                <StatusIcon status={domain.status} />
              </div>
              <ul className="space-y-1 text-sm">
                {lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
