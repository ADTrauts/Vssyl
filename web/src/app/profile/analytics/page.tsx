'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, Alert, Spinner } from 'shared/components';
import { getPersonalAnalytics, PersonalAnalytics } from '../../../api/analytics';
import PersonalAuditTrail from '../../../components/PersonalAuditTrail';
import PrivacySettings from '../../../components/PrivacySettings';
import { 
  BarChart3, 
  Activity, 
  Clock, 
  Download, 
  Upload,
  MessageSquare,
  Folder,
  Users,
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Shield
} from 'lucide-react';



export default function PersonalAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analyticsData, setAnalyticsData] = useState<PersonalAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'audit' | 'privacy'>('analytics');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPersonalAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'file_created':
      case 'file_shared':
        return <Upload className="w-4 h-4" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4" />;
      case 'module_accessed':
        return <Activity className="w-4 h-4" />;
      case 'connection_made':
        return <Users className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'Dashboard':
        return <BarChart3 className="w-4 h-4" />;
      case 'Drive':
        return <Folder className="w-4 h-4" />;
      case 'Chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'Members':
        return <Users className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
            <span className="ml-2">Loading your analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/dashboard')}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Personal Analytics</h1>
          <p className="text-gray-600 mt-2">
            Your activity and usage insights
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert type="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'audit'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Audit Trail
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'privacy'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Privacy & Rights
              </button>
            </nav>
          </div>
        </div>

        {/* Time Range Filter - Only show for analytics tab */}
        {activeTab === 'analytics' && (
          <div className="mb-6">
            <div className="flex space-x-2">
              {[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
              ].map((range) => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTimeRange(range.value as any)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <>
            {/* Usage Statistics */}
            {analyticsData?.usageStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-blue-500 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.usageStats.totalSessions}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-green-500 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Time</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTime(analyticsData.usageStats.totalTime)}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-500 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Modules Used</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.usageStats.modulesUsed}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <Upload className="w-8 h-8 text-orange-500 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Files Created</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.usageStats.filesCreated}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <MessageSquare className="w-8 h-8 text-indigo-500 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.usageStats.messagesSent}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-pink-500 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Connections</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.usageStats.connectionsMade}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Module Usage */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Usage</h2>
            <div className="space-y-4">
              {analyticsData?.moduleUsage.map((module) => (
                <div key={module.module} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getModuleIcon(module.module)}
                    <div>
                      <p className="font-medium text-gray-900">{module.module}</p>
                      <p className="text-sm text-gray-500">
                        {module.usageCount} uses • {formatTime(module.totalTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatDate(module.lastUsed)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {analyticsData?.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.module} • {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Export Section */}
        <div className="mt-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h2>
            <p className="text-gray-600 mb-4">
              Download your analytics data for personal use or backup.
            </p>
            <div className="flex space-x-3">
              <Button variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
              <Button variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
            </div>
          </Card>
        </div>
          </>
        )}

        {/* Audit Trail Tab Content */}
        {activeTab === 'audit' && (
          <PersonalAuditTrail />
        )}

        {/* Privacy Settings Tab Content */}
        {activeTab === 'privacy' && (
          <PrivacySettings />
        )}
      </div>
    </div>
  );
} 