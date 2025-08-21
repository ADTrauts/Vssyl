'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  BarChart3, 
  TrendingUp, 
  MoreHorizontal, 
  Activity,
  FileText,
  MessageCircle,
  Users,
  HardDrive,
  Trash2,
  Calendar,
  Clock
} from 'lucide-react';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import { getPersonalAnalytics } from '../../api/analytics';
import { formatBytes, formatRelativeTime } from '../../utils/format';

interface AnalyticsWidgetProps {
  id: string;
  config?: AnalyticsWidgetConfig;
  onConfigChange?: (config: AnalyticsWidgetConfig) => void;
  onRemove?: () => void;
}

interface AnalyticsWidgetConfig {
  showActivityChart: boolean;
  showUsageStats: boolean;
  showPerformanceMetrics: boolean;
  timeRange: '7d' | '30d' | '90d';
  maxDataPoints: number;
  showTrends: boolean;
  metricsToShow: string[];
}

interface AnalyticsData {
  totalSessions: number;
  moduleInstallations: Array<{
    module: {
      id: string;
      name: string;
      category: string;
    };
  }>;
  files: Array<{
    id: string;
    name: string;
    size: number;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    timestamp: string;
  }>;
  storageUsed: number;
  storageTotal: number;
}

const defaultConfig: AnalyticsWidgetConfig = {
  showActivityChart: true,
  showUsageStats: true,
  showPerformanceMetrics: true,
  timeRange: '30d',
  maxDataPoints: 10,
  showTrends: true,
  metricsToShow: ['files', 'messages', 'storage', 'activity']
};

export default function AnalyticsWidget({ 
  id, 
  config = defaultConfig, 
  onConfigChange, 
  onRemove 
}: AnalyticsWidgetProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Load analytics data
  useEffect(() => {
    if (!session?.accessToken) return;
    
    const loadAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getPersonalAnalytics(config.timeRange as '7d' | '30d' | '90d');

        if (response) {
          // Transform PersonalAnalytics to AnalyticsData format
          const transformedData: AnalyticsData = {
            totalSessions: response.usageStats.totalSessions,
            moduleInstallations: response.moduleUsage.map(usage => ({
              module: {
                id: usage.module,
                name: usage.module,
                category: 'unknown'
              }
            })),
            files: [], // Not available in PersonalAnalytics
            messages: [], // Not available in PersonalAnalytics
            activities: response.recentActivity.map(activity => ({
              id: activity.id,
              type: activity.type,
              timestamp: activity.timestamp
            })),
            storageUsed: 0, // Not available in PersonalAnalytics
            storageTotal: 10 * 1024 * 1024 * 1024 // 10GB default
          };
          setAnalyticsData(transformedData);
        } else {
          setError('Failed to load analytics data');
        }

      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Error loading analytics data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [session?.accessToken, config.timeRange]);

  // Calculate metrics
  const calculateMetrics = () => {
    if (!analyticsData) return null;

    const fileCount = analyticsData.files?.length || 0;
    const messageCount = analyticsData.messages?.length || 0;
    const activityCount = analyticsData.activities?.length || 0;
    const moduleCount = analyticsData.moduleInstallations?.length || 0;
    const storagePercentage = analyticsData.storageTotal > 0 
      ? (analyticsData.storageUsed / analyticsData.storageTotal) * 100 
      : 0;

    return {
      fileCount,
      messageCount,
      activityCount,
      moduleCount,
      storagePercentage,
      storageUsed: analyticsData.storageUsed,
      storageTotal: analyticsData.storageTotal
    };
  };

  // Get activity trend
  const getActivityTrend = () => {
    if (!analyticsData?.activities) return 'stable';
    
    const recentActivities = analyticsData.activities.slice(0, 7);
    const olderActivities = analyticsData.activities.slice(7, 14);
    
    if (recentActivities.length > olderActivities.length * 1.2) return 'increasing';
    if (recentActivities.length < olderActivities.length * 0.8) return 'decreasing';
    return 'stable';
  };

  // Get metric icon
  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'files': return <FileText className="w-4 h-4" />;
      case 'messages': return <MessageCircle className="w-4 h-4" />;
      case 'storage': return <HardDrive className="w-4 h-4" />;
      case 'activity': return <Activity className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  // Get metric color
  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'files': return 'blue';
      case 'messages': return 'green';
      case 'storage': return 'purple';
      case 'activity': return 'orange';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1 hover:bg-red-100 rounded text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Spinner size={24} />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
          </div>
        </div>
        <Alert type="error" title="Error loading analytics">
          {error}
        </Alert>
      </Card>
    );
  }

  const metrics = calculateMetrics();
  const activityTrend = getActivityTrend();

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Analytics</h3>
          {activityTrend !== 'stable' && (
            <Badge size="sm" color={activityTrend === 'increasing' ? 'green' : 'red'}>
              {activityTrend === 'increasing' ? '↗' : '↘'}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.location.href = '/profile/analytics'}
          >
            View Full
          </Button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 hover:bg-red-100 rounded text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Time Range Display */}
      <div className="mb-4 p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Last {config.timeRange === '7d' ? '7 days' : config.timeRange === '30d' ? '30 days' : '90 days'}
            </span>
          </div>
          <Badge size="sm" color="gray">
            {config.timeRange}
          </Badge>
        </div>
      </div>

      {/* Usage Stats */}
      {config.showUsageStats && metrics && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Usage Overview</h4>
          <div className="grid grid-cols-2 gap-3">
            {config.metricsToShow.includes('files') && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Files</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{metrics.fileCount}</div>
                <div className="text-xs text-blue-600">Created</div>
              </div>
            )}
            
            {config.metricsToShow.includes('messages') && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Messages</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{metrics.messageCount}</div>
                <div className="text-xs text-green-600">Sent</div>
              </div>
            )}
            
            {config.metricsToShow.includes('activity') && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Activity className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Activity</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{metrics.activityCount}</div>
                <div className="text-xs text-orange-600">Events</div>
              </div>
            )}
            
            {config.metricsToShow.includes('storage') && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <HardDrive className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Storage</span>
                </div>
                <div className="text-lg font-bold text-purple-900">
                  {formatBytes(metrics.storageUsed)}
                </div>
                <div className="text-xs text-purple-600">
                  {metrics.storagePercentage.toFixed(1)}% used
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {config.showPerformanceMetrics && analyticsData && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Performance</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Active Modules</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{metrics?.moduleCount || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Sessions</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{analyticsData.totalSessions || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {analyticsData?.activities && analyticsData.activities.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {analyticsData.activities.slice(0, 3).map((activity, index) => (
              <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 capitalize">
                    {activity.type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analyticsData && (
        <div className="text-center py-6">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">No analytics data available</p>
          <Button
            size="sm"
            onClick={() => window.location.href = '/profile/analytics'}
          >
            View Analytics
          </Button>
        </div>
      )}

      {/* Configuration Panel */}
      {showConfig && onConfigChange && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Widget Settings</h5>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.showUsageStats}
                onChange={(e) => onConfigChange({
                  ...config,
                  showUsageStats: e.target.checked
                })}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Show usage stats</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.showPerformanceMetrics}
                onChange={(e) => onConfigChange({
                  ...config,
                  showPerformanceMetrics: e.target.checked
                })}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Show performance metrics</span>
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Time range:</span>
              <select
                value={config.timeRange}
                onChange={(e) => onConfigChange({
                  ...config,
                  timeRange: e.target.value as '7d' | '30d' | '90d'
                })}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 