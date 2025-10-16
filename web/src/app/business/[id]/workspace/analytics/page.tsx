'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, Button, Spinner, Alert, Badge } from 'shared/components';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Folder,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalMembers: number;
    activeMembers: number;
    totalFiles: number;
    totalMessages: number;
    totalEvents: number;
  };
  activity: {
    date: string;
    members: number;
    files: number;
    messages: number;
    events: number;
  }[];
  topUsers: Array<{
    id: string;
    name: string;
    email: string;
    activity: number;
    files: number;
    messages: number;
  }>;
  storage: {
    used: number;
    total: number;
    files: number;
  };
}

export default function WorkAnalyticsPage() {
  const params = useParams();
  const { data: session } = useSession();
  const businessId = params?.id as string;

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadAnalytics();
    }
  }, [businessId, session?.accessToken, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to get business analytics
      // const response = await businessAPI.getBusinessAnalytics(businessId, timeRange);
      
      // Mock data for now
      const mockAnalytics: AnalyticsData = {
        overview: {
          totalMembers: 25,
          activeMembers: 18,
          totalFiles: 156,
          totalMessages: 342,
          totalEvents: 28
        },
        activity: [
          { date: '2024-01-08', members: 15, files: 8, messages: 23, events: 3 },
          { date: '2024-01-09', members: 18, files: 12, messages: 31, events: 2 },
          { date: '2024-01-10', members: 16, files: 6, messages: 28, events: 4 },
          { date: '2024-01-11', members: 20, files: 15, messages: 42, events: 1 },
          { date: '2024-01-12', members: 17, files: 9, messages: 35, events: 3 },
          { date: '2024-01-13', members: 12, files: 4, messages: 18, events: 0 },
          { date: '2024-01-14', members: 14, files: 7, messages: 25, events: 2 }
        ],
        topUsers: [
          { id: '1', name: 'John Doe', email: 'john@company.com', activity: 45, files: 12, messages: 28 },
          { id: '2', name: 'Jane Smith', email: 'jane@company.com', activity: 38, files: 8, messages: 35 },
          { id: '3', name: 'Mike Johnson', email: 'mike@company.com', activity: 32, files: 15, messages: 22 },
          { id: '4', name: 'Sarah Wilson', email: 'sarah@company.com', activity: 28, files: 6, messages: 31 },
          { id: '5', name: 'David Brown', email: 'david@company.com', activity: 25, files: 9, messages: 18 }
        ],
        storage: {
          used: 2.4,
          total: 10,
          files: 156
        }
      };

      setAnalytics(mockAnalytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatStorageSize = (gb: number): string => {
    if (gb < 1) {
      return `${(gb * 1024).toFixed(0)} MB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  const getActivityTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'stable', percentage: number } => {
    if (previous === 0) return { trend: 'stable', percentage: 0 };
    const percentage = ((current - previous) / previous) * 100;
    if (percentage > 5) return { trend: 'up', percentage: Math.abs(percentage) };
    if (percentage < -5) return { trend: 'down', percentage: Math.abs(percentage) };
    return { trend: 'stable', percentage: Math.abs(percentage) };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="error" title="Error Loading Analytics">
          {error}
        </Alert>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="error" title="No Analytics Data">
          No analytics data available for this business.
        </Alert>
      </div>
    );
  }

  const memberTrend = getActivityTrend(analytics.overview.activeMembers, analytics.overview.totalMembers * 0.7);
  const fileTrend = getActivityTrend(analytics.overview.totalFiles, analytics.overview.totalFiles * 0.9);
  const messageTrend = getActivityTrend(analytics.overview.totalMessages, analytics.overview.totalMessages * 0.8);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Analytics</h1>
            <p className="text-gray-600">Business activity and usage insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="secondary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={loadAnalytics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.activeMembers}</p>
                  <div className="flex items-center mt-1">
                    {memberTrend.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500 mr-1" />}
                    {memberTrend.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
                    <span className={`text-xs ${memberTrend.trend === 'up' ? 'text-green-600' : memberTrend.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {memberTrend.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalFiles}</p>
                  <div className="flex items-center mt-1">
                    {fileTrend.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500 mr-1" />}
                    {fileTrend.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
                    <span className={`text-xs ${fileTrend.trend === 'up' ? 'text-green-600' : fileTrend.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {fileTrend.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Folder className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalMessages}</p>
                  <div className="flex items-center mt-1">
                    {messageTrend.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500 mr-1" />}
                    {messageTrend.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
                    <span className={`text-xs ${messageTrend.trend === 'up' ? 'text-green-600' : messageTrend.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {messageTrend.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Events</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalEvents}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">{formatStorageSize(analytics.storage.used)}</p>
                  <p className="text-xs text-gray-500">of {formatStorageSize(analytics.storage.total)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-indigo-500" />
              </div>
            </Card>
          </div>

          {/* Activity Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Over Time</h3>
            <div className="h-64 flex items-end space-x-2">
              {analytics.activity.map((day, index) => {
                const maxActivity = Math.max(...analytics.activity.map(d => d.members + d.files + d.messages));
                const height = ((day.members + day.files + day.messages) / maxActivity) * 200;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}px` }}></div>
                    <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Users and Storage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Users */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Users</h3>
              <div className="space-y-4">
                {analytics.topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{user.activity} activities</p>
                      <p className="text-sm text-gray-500">{user.files} files, {user.messages} messages</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Storage Usage */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Used Storage</span>
                    <span>{formatStorageSize(analytics.storage.used)} / {formatStorageSize(analytics.storage.total)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(analytics.storage.used / analytics.storage.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{analytics.storage.files}</p>
                    <p className="text-sm text-gray-600">Files</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{((analytics.storage.used / analytics.storage.total) * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Used</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}