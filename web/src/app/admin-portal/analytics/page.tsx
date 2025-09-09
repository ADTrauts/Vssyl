'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Alert, Spinner, Modal, Input } from 'shared/components';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { adminApiService } from '../../../lib/adminApiService';

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

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: '30d',
    userType: 'all',
    metric: 'all'
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, realtimeRes] = await Promise.all([
        adminApiService.getAnalytics(filters),
        adminApiService.getRealTimeMetrics()
      ]);
      
      if (analyticsRes.error) {
        setError(analyticsRes.error);
        return;
      }

      if (realtimeRes.error) {
        setError(realtimeRes.error);
        return;
      }

      setAnalyticsData(analyticsRes.data as AnalyticsData);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAnalyticsData();
    
    if (autoRefresh) {
      const interval = setInterval(loadAnalyticsData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [filters, autoRefresh, loadAnalyticsData]);

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const response = await adminApiService.exportAnalytics(filters, format);
      if (response.error) {
        setError(response.error);
        return;
      }

      // Create download link
      const blob = new Blob([response.data as string], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  if (loading && !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="text-gray-600 mt-2">Real-time platform metrics and insights</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600 mt-2">Real-time platform metrics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
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
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <select
            value={filters.userType}
            onChange={(e) => setFilters({ ...filters, userType: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All users</option>
            <option value="active">Active users</option>
            <option value="premium">Premium users</option>
            <option value="new">New users</option>
          </select>

          <select
            value={filters.metric}
            onChange={(e) => setFilters({ ...filters, metric: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All metrics</option>
            <option value="users">User metrics</option>
            <option value="revenue">Revenue metrics</option>
            <option value="engagement">Engagement metrics</option>
            <option value="system">System metrics</option>
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

      {/* Error Alert */}
      {error && (
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
              </div>
              <span className={`text-sm font-medium ${
                analyticsData.userGrowth.growthRate > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analyticsData.userGrowth.growthRate > 0 ? '+' : ''}{analyticsData.userGrowth.growthRate}%
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Users</span>
                <span className="font-semibold">{analyticsData.userGrowth.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New This Month</span>
                <span className="font-semibold text-green-600">
                  +{analyticsData.userGrowth.newThisMonth.toLocaleString()}
                </span>
              </div>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm">Chart: Monthly User Growth</span>
              </div>
            </div>
          </Card>

          {/* Revenue */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
              </div>
              <span className={`text-sm font-medium ${
                analyticsData.revenue.growthRate > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analyticsData.revenue.growthRate > 0 ? '+' : ''}{analyticsData.revenue.growthRate}%
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-semibold">${analyticsData.revenue.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold text-green-600">
                  ${analyticsData.revenue.thisMonth.toLocaleString()}
                </span>
              </div>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm">Chart: Monthly Revenue</span>
              </div>
            </div>
          </Card>

          {/* Engagement */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Engagement</h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold">{analyticsData.engagement.activeUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Session</span>
                <span className="font-semibold">{Math.round(analyticsData.engagement.avgSessionDuration)} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Retention Rate</span>
                <span className="font-semibold text-green-600">{analyticsData.engagement.retentionRate}%</span>
              </div>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm">Chart: Daily Active Users</span>
              </div>
            </div>
          </Card>

          {/* System Performance */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime</span>
                <span className="font-semibold text-green-600">{analyticsData.system.uptime}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Response Time</span>
                <span className="font-semibold">{analyticsData.system.avgResponseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Error Rate</span>
                <span className={`font-semibold ${
                  analyticsData.system.errorRate < 1 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analyticsData.system.errorRate}%
                </span>
              </div>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm">Chart: Response Time Trend</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Real-time Activity Feed */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Real-time Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm">New user registered: john.doe@example.com</span>
            </div>
            <span className="text-xs text-gray-500">2 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">Premium subscription activated: user_123</span>
            </div>
            <span className="text-xs text-gray-500">5 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-sm">Content reported for review: post_456</span>
            </div>
            <span className="text-xs text-gray-500">8 min ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
} 