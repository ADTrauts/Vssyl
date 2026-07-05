'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, Badge } from 'shared/components';
import { Flag, RefreshCw } from 'lucide-react';
import { adminApiService } from '../../../lib/adminApiService';
import { AdminPortalPageShell } from '../../../components/admin-portal/AdminPortalPageShell';
import { AdminPortalBreadcrumbs } from '../../../components/admin-portal/AdminPortalBreadcrumbs';

interface FeatureFlag {
  key: string;
  label: string;
  category: string;
  source: string;
  enabled: boolean;
  value: string | null;
  description?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  environment: 'bg-blue-100 text-blue-800',
  platform: 'bg-purple-100 text-purple-800',
  experimental: 'bg-amber-100 text-amber-800',
  beta: 'bg-green-100 text-green-800',
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApiService.getFeatureFlags();
      if (!res.error && res.data) setFlags(res.data as FeatureFlag[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = flags.reduce<Record<string, FeatureFlag[]>>((acc, f) => {
    const list = acc[f.category] ?? [];
    list.push(f);
    acc[f.category] = list;
    return acc;
  }, {});

  return (
    <AdminPortalPageShell
      title="Feature Flags"
      description="Read-only view of environment and platform configuration — no flag framework, existing sources only."
      actions={
        <button type="button" onClick={() => void load()} className="text-sm text-v-text-muted hover:text-v-text-primary flex items-center gap-1">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      }
    >
      <AdminPortalBreadcrumbs />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <Card key={category} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Flag className="w-5 h-5 text-v-text-muted" />
                <h2 className="text-lg font-semibold capitalize">{category}</h2>
                <Badge className={CATEGORY_COLORS[category] ?? 'bg-gray-100'}>{items.length}</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-v-text-muted border-b border-v-border">
                      <th className="py-2 pr-4">Flag</th>
                      <th className="py-2 pr-4">Source</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((f) => (
                      <tr key={f.key} className="border-b border-v-border last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-v-text-primary">{f.label}</p>
                          <p className="text-xs text-v-text-muted font-mono">{f.key}</p>
                        </td>
                        <td className="py-3 pr-4 capitalize">{f.source.replace('_', ' ')}</td>
                        <td className="py-3 pr-4">
                          <Badge className={f.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
                            {f.enabled ? 'On' : 'Off'}
                          </Badge>
                        </td>
                        <td className="py-3 text-v-text-secondary">{f.description ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminPortalPageShell>
  );
}
