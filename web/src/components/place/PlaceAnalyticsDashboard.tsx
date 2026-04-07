'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner, Card } from 'shared/components';
import { getPersonalAnalytics, exportPlaceData } from '@/api/placeAnalytics';
import type { PersonalAnalytics } from '@/api/placeAnalytics';
import {
  TrendingUp, DollarSign, MousePointerClick, Store, Users,
  Calendar, BarChart3, Download, Network,
} from 'lucide-react';

export default function PlaceAnalyticsDashboard() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  const [analytics, setAnalytics] = useState<PersonalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [exporting, setExporting] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getPersonalAnalytics(period, token);
      setAnalytics(data);
    } catch { /* */ }
    finally { setLoading(false); }
  }, [token, period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleExport = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const blob = await exportPlaceData(token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vssyl-place-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* */ }
    finally { setExporting(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16 px-4">
        <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">No analytics data yet</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Start using your Main Street and analytics will appear.</p>
      </div>
    );
  }

  const maxGrowth = Math.max(...analytics.network.weeklyGrowth, 1);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header with period selector + export */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Your Place Analytics</h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
            {['week', 'month', 'all'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p === 'all' ? 'All Time' : p === 'week' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-3 h-3" />
            {exporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
      </div>

      {/* Network overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <div className="p-3 text-center">
            <Network className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{analytics.network.totalNodes}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Nodes</p>
          </div>
        </Card>
        <Card>
          <div className="p-3 text-center">
            <Store className="w-4 h-4 text-orange-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{analytics.network.businessNodes}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Businesses</p>
          </div>
        </Card>
        <Card>
          <div className="p-3 text-center">
            <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{analytics.network.userConnections}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Connections</p>
          </div>
        </Card>
        <Card>
          <div className="p-3 text-center">
            <Calendar className="w-4 h-4 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{analytics.engagement.meetingsCreated + analytics.engagement.meetingsAttended}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Meetings</p>
          </div>
        </Card>
        <Card>
          <div className="p-3 text-center">
            <Users className="w-4 h-4 text-purple-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{analytics.network.communitiesJoined}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Communities</p>
          </div>
        </Card>
      </div>

      {/* Spending + Growth row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spending */}
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Spending</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">${analytics.spending.totalSpent.toFixed(2)}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Spent</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{analytics.spending.purchaseCount}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Purchases</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{analytics.spending.externalClicks}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">External Visits</p>
              </div>
            </div>
            {analytics.spending.topCategories.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Top Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {analytics.spending.topCategories.map(c => (
                    <span key={c.category} className="text-xs px-2 py-1 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-slate-700">
                      {c.category.toLowerCase().replace('_', ' ')} ({c.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Network Growth (mini bar chart) */}
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Network Growth (4 weeks)</h3>
            </div>
            <div className="flex items-end gap-2 h-24">
              {analytics.network.weeklyGrowth.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-indigo-500 rounded-t transition-all"
                    style={{ height: `${Math.max((val / maxGrowth) * 80, 4)}px` }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{val}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">W{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Top Businesses */}
      {analytics.topBusinesses.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MousePointerClick className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Most Interacted Businesses</h3>
            </div>
            <div className="space-y-2">
              {analytics.topBusinesses.map((biz, i) => (
                <div key={biz.businessId} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{biz.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{biz.category.toLowerCase().replace('_', ' ')}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{biz.interactions}x</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
