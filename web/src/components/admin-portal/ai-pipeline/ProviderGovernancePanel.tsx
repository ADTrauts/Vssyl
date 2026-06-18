'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Brain, Cloud, Database } from 'lucide-react';
import ProviderUsageView from '../ProviderUsageView';

type ProviderTab = 'combined' | 'openai' | 'anthropic';

const TABS: Array<{ id: ProviderTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'combined', label: 'Combined View', icon: Database },
  { id: 'openai', label: 'OpenAI Official', icon: Brain },
  { id: 'anthropic', label: 'Anthropic Official', icon: Cloud },
];

export default function ProviderGovernancePanel() {
  const [activeTab, setActiveTab] = useState<ProviderTab>('combined');

  const dateRange = {
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm text-v-text-muted">
            Official usage from OpenAI and Anthropic admin APIs. Operating expenses are also
            available under Financial Management.
          </p>
        </div>
        <Link
          href="/admin-portal/billing"
          className="text-sm text-indigo-600 hover:underline shrink-0"
        >
          View provider expenses →
        </Link>
      </div>

      <div className="border-b border-v-border">
        <nav className="-mb-px flex flex-wrap gap-x-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-v-text-secondary hover:text-v-text-secondary hover:border-v-border'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <ProviderUsageView provider={activeTab} dateRange={dateRange} />
    </div>
  );
}
