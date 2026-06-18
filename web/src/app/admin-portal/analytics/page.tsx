'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Alert } from 'shared/components';
import {
  BarChart3,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Users,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { adminApiService } from '../../../lib/adminApiService';
import { resolveAnalyticsTab } from '../../../lib/adminAnalyticsOwnership';
import AdminPlatformAnalyticsInsightsPanel from '../../../components/admin-portal/AdminPlatformAnalyticsInsightsPanel';
import { AdminPortalEmptyState } from '../../../components/admin-portal/AdminPortalEmptyState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  userGrowth: {
    total: number;
    newThisMonth: number;
    growthRate: number;
    monthlyTrend: Array<{ month: string; count: number }>;
  };
  revenue: {
    total: number;
    thisMonth: number;
    growthRate: number;
    monthlyTrend: Array<{ month: string; amount: number }>;
  };
  engagement: {
    activeUsers: number;
    avgSessionDuration: number;
    retentionRate: number;
    dailyActiveUsers: Array<{ date: string; count: number }>;
  };
  system: {
    uptime: number;
    avgResponseTime: number;
    errorRate: number;
    performanceTrend: Array<{ date: string; responseTime: number }>;
  };
}

interface FilterOptions {
  dateRange: string;
  userType: string;
  metric: string;
}

interface RecentActivity {
  id: string;
  action: string;
  userId: string;
  resourceType: string | null;
  resourceId: string | null;
  details: string;
  timestamp: string;
  user?: {
    email: string;
    name: string | null;
  };
}

function AnalyticsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = resolveAnalyticsTab(searchParams?.get('tab'));

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: '30d',
    userType: 'all',
    metric: 'all',
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  const setTab = (tab: 'overview' | 'insights') => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    router.replace(query ? `/admin-portal/analytics?${query}` : '/admin-portal/analytics');
  };

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, activityRes] = await Promise.all([
        adminApiService.getAnalytics(filters),
        adminApiService.getRecentActivity(),
      ]);

      if (analyticsRes.error) {
        setError(analyticsRes.error);
        return;
      }

      setAnalyticsData(analyticsRes.data as AnalyticsData);

      if (activityRes.error) {
        console.error('Error loading recent activity:', activityRes.error);
        setRecentActivity([]);
      } else {
        setRecentActivity((activityRes.data as RecentActivity[]) || []);
      }

      setError(null);
    } catch (err: unknown) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadAnalyticsData();
    }
  }, [filters, activeTab, loadAnalyticsData]);

  useEffect(() => {
    if (!autoRefresh || activeTab !== 'overview') return;
    const interval = setInterval(loadAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, [filters, autoRefresh, activeTab, loadAnalyticsData]);

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const response = await adminApiService.exportAnalytics(filters, format);
      if (response.error) {
        setError(response.error);
        return;
      }

      const blob = new Blob([response.data as string], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError('Failed to export data');
    }
  };

  if (loading && !analyticsData && activeTab === 'overview') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-v-text-primary">Platform Analytics</h1>
          <p className="text-v-text-secondary mt-2">Canonical platform metrics and strategic insights</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-v-text-primary">Platform Analytics</h1>
          <p className="text-v-text-secondary mt-2">
            Canonical operator destination for platform business metrics and strategic insights
          </p>
        </div>
        {activeTab === 'overview' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                autoRefresh
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-v-surface-muted bg-v-surface-muted text-v-text-secondary border border-v-border'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </span>
            </button>
            <button
              onClick={loadAnalyticsData}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex space-x-2 border-b border-v-border">
        <button
          type="button"
          onClick={() => setTab('overview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-v-text-muted hover:text-v-text-primary dark:hover:text-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab('insights')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'insights'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-v-text-muted hover:text-v-text-primary dark:hover:text-gray-200'
          }`}
        >
          Strategic Insights
        </button>
      </div>

      {error && (
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {activeTab === 'insights' ? (
        <AdminPlatformAnalyticsInsightsPanel />
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-v-text-muted" />
                <span className="text-sm font-medium text-v-text-secondary">Filters:</span>
              </div>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="px-3 py-2 border border-v-border bg-v-surface text-v-text-primary rounded-lg text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <select
                value={filters.userType}
                onChange={(e) => setFilters({ ...filters, userType: e.target.value })}
                className="px-3 py-2 border border-v-border bg-v-surface text-v-text-primary rounded-lg text-sm"
              >
                <option value="all">All users</option>
                <option value="active">Active users</option>
                <option value="premium">Premium users</option>
                <option value="new">New users</option>
              </select>
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  onClick={() => exportData('csv')}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export CSV</span>
                </button>
                <button
                  onClick={() => exportData('json')}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export JSON</span>
                </button>
              </div>
            </div>
          </Card>

          {analyticsData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-v-text-secondary">Total Users</p>
                      <p className="text-2xl font-bold text-v-text-primary">
                        {analyticsData.userGrowth.total.toLocaleString()}
                      </p>
                      <p className="text-sm text-v-text-secondary">
                        +{analyticsData.userGrowth.newThisMonth} this month
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-v-text-secondary">Revenue (MTD)</p>
                      <p className="text-2xl font-bold text-v-text-primary">
                        ${analyticsData.revenue.thisMonth.toLocaleString()}
                      </p>
                      <p className="text-sm text-v-text-secondary">
                        {analyticsData.revenue.growthRate > 0 ? '+' : ''}
                        {analyticsData.revenue.growthRate}% growth
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-v-text-secondary">Active Users</p>
                      <p className="text-2xl font-bold text-v-text-primary">
                        {analyticsData.engagement.activeUsers.toLocaleString()}
                      </p>
                      <p className="text-sm text-v-text-secondary">
                        {analyticsData.engagement.retentionRate}% retention
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-v-text-secondary">User Growth</p>
                      <p className="text-2xl font-bold text-v-text-primary">
                        {analyticsData.userGrowth.growthRate > 0 ? '+' : ''}
                        {analyticsData.userGrowth.growthRate}%
                      </p>
                      <p className="text-sm text-v-text-secondary">Period trend</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analyticsData.userGrowth.monthlyTrend.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-v-text-primary mb-4">User Growth Trend</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.userGrowth.monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
                {analyticsData.revenue.monthlyTrend.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-v-text-primary mb-4">Revenue Trend</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.revenue.monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-v-text-primary">System Performance</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-v-text-secondary">Uptime</span>
                      <span className="font-semibold text-green-600">{analyticsData.system.uptime}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-v-text-secondary">Avg Response Time</span>
                      <span className="font-semibold">{analyticsData.system.avgResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-v-text-secondary">Error Rate</span>
                      <span className={`font-semibold ${
                        analyticsData.system.errorRate < 1 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analyticsData.system.errorRate}%
                      </span>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 lg:col-span-2">
                  <p className="text-sm text-v-text-secondary">
                    Deep infrastructure and scalability metrics live on{' '}
                    <a href="/admin-portal/performance" className="text-blue-600 hover:underline font-medium">
                      Performance &amp; Scalability
                    </a>
                    . Strategic insights (A/B tests, segments, competitive analysis) are on the{' '}
                    <button
                      type="button"
                      onClick={() => setTab('insights')}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Strategic Insights
                    </button>{' '}
                    tab.
                  </p>
                </Card>
              </div>

              {analyticsData.system.performanceTrend.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-v-text-primary mb-4">Response Time Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.system.performanceTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `${value}ms`} />
                        <Tooltip formatter={(value: number) => `${value}ms`} />
                        <Line type="monotone" dataKey="responseTime" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </div>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-v-text-primary">Real-time Activity</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-v-text-secondary">Live</span>
              </div>
            </div>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-v-surface-muted rounded-lg"
                  >
                    <span className="text-sm font-medium text-v-text-primary">{activity.action}</span>
                    <span className="text-xs text-v-text-muted">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <AdminPortalEmptyState
                icon={<Activity className="w-12 h-12" />}
                title="No recent activity"
                description=""
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AnalyticsPageContent />
    </Suspense>
  );
}
