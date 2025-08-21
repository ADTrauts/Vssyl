'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { businessAPI } from '../../../../../api/business';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import { 
  BarChart3, 
  Users, 
  Folder, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Activity,
  Download
} from 'lucide-react';

interface AnalyticsData {
  memberCount: number;
  fileCount: number;
  conversationCount: number;
  storageUsed: number;
  memberGrowth: number;
  fileGrowth: number;
  conversationGrowth: number;
  storageGrowth: number;
  topMembers: Array<{
    id: string;
    name: string;
    email: string;
    activityCount: number;
    lastActive: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: {
      name: string;
      email: string;
    };
  }>;
  monthlyStats: Array<{
    month: string;
    members: number;
    files: number;
    conversations: number;
    storage: number;
  }>;
}

export default function BusinessAnalyticsPage() {
  const params = useParams();
  const { data: session } = useSession();
  const businessId = params.id as string;

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

      const response = await businessAPI.getBusinessAnalytics(businessId);
      
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatStorageSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {Math.abs(growth)}%
      </span>
    );
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
      <div className="p-6">
        <Alert type="error" title="Error Loading Analytics">
          {error}
        </Alert>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <Alert type="error" title="Analytics Not Available">
          Analytics data is not available for this business.
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into your business performance and team activity
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex border rounded-lg">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                } ${range === '7d' ? 'rounded-l-lg' : ''} ${range === '90d' ? 'rounded-r-lg' : ''}`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.memberCount}</p>
              <div className="mt-2">
                {formatGrowth(analytics.memberGrowth)}
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.fileCount}</p>
              <div className="mt-2">
                {formatGrowth(analytics.fileGrowth)}
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Folder className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.conversationCount}</p>
              <div className="mt-2">
                {formatGrowth(analytics.conversationGrowth)}
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">{formatStorageSize(analytics.storageUsed)}</p>
              <div className="mt-2">
                {formatGrowth(analytics.storageGrowth)}
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Active Members */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Most Active Members</h2>
          <div className="space-y-4">
            {analytics.topMembers.slice(0, 5).map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{member.activityCount} activities</p>
                  <p className="text-sm text-gray-500">
                    {new Date(member.lastActive).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {analytics.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={activity.id || index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Activity className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()} • {activity.user?.name || 'System'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Trends</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Month</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Members</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Files</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Conversations</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Storage</th>
              </tr>
            </thead>
            <tbody>
              {analytics.monthlyStats.map((stat, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{stat.month}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{stat.members}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{stat.files}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{stat.conversations}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{formatStorageSize(stat.storage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 