'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, Button, Spinner, Alert } from 'shared/components';
import {
  BarChart3,
  Users,
  MessageSquare,
  Folder,
  LayoutDashboard,
  RefreshCw,
} from 'lucide-react';
import { getBusinessAnalytics, getBusinessModuleAnalytics } from '@/api/business';

interface BusinessAnalyticsData {
  memberCount: number;
  dashboardCount: number;
  fileCount: number;
  conversationCount: number;
  storageUsed: number;
  timeRange: string;
}

export default function WorkAnalyticsPage() {
  const params = useParams();
  const { data: session } = useSession();
  const businessId = params?.id as string;

  const [analytics, setAnalytics] = useState<BusinessAnalyticsData | null>(null);
  const [moduleCount, setModuleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const loadAnalytics = useCallback(async () => {
    if (!businessId || !session?.accessToken) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [statsRes, modulesRes] = await Promise.all([
        getBusinessAnalytics(businessId, session.accessToken as string, timeRange),
        getBusinessModuleAnalytics(businessId, session.accessToken as string),
      ]);

      if (!statsRes.success || !statsRes.data) {
        setAnalytics(null);
        setError('Business analytics unavailable for this workspace.');
        return;
      }

      const raw = statsRes.data as unknown as BusinessAnalyticsData;
      setAnalytics({
        memberCount: raw.memberCount ?? 0,
        dashboardCount: raw.dashboardCount ?? 0,
        fileCount: raw.fileCount ?? 0,
        conversationCount: raw.conversationCount ?? 0,
        storageUsed: raw.storageUsed ?? 0,
        timeRange: raw.timeRange ?? timeRange,
      });
      setModuleCount(Array.isArray(modulesRes.data) ? modulesRes.data.length : 0);
    } catch (err) {
      setAnalytics(null);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [businessId, session?.accessToken, timeRange]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const formatStorage = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="error" title="Analytics unavailable">
          {error ?? 'No analytics data is available for this business workspace.'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Work Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Business metrics from the Analytics capability federation layer
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button size="sm" onClick={() => void loadAnalytics()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.memberCount}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dashboard tabs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.dashboardCount}</p>
              </div>
              <LayoutDashboard className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Files created ({timeRange})</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.fileCount}</p>
              </div>
              <Folder className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conversations ({timeRange})</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.conversationCount}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Storage used</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatStorage(analytics.storageUsed)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Modules with usage data</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{moduleCount}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-gray-500" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
