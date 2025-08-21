'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import { 
  BarChart3, 
  Users, 
  Folder, 
  MessageSquare, 
  HardDrive,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Calendar,
  Download,
  Upload,
  Eye,
  Star
} from 'lucide-react';

interface BusinessAnalyticsProps {
  businessId: string;
  timeRange?: '7d' | '30d' | '90d';
}

interface BusinessStats {
  memberCount: number;
  dashboardCount: number;
  fileCount: number;
  conversationCount: number;
  storageUsed: number;
  timeRange: string;
  startDate: string;
  endDate: string;
}

interface ModuleAnalytics {
  modules: Array<{
    id: string;
    name: string;
    category: string;
    developer: {
      id: string;
      name: string;
      email: string;
    };
    totalInstallations: number;
    activeInstallations: number;
    adoptionRate: number;
  }>;
  totalModules: number;
  totalInstallations: number;
  activeInstallations: number;
  memberCount: number;
  moduleAdoptionRate: number;
}

export default function BusinessAnalyticsDashboard({ 
  businessId, 
  timeRange = '30d' 
}: BusinessAnalyticsProps) {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [moduleAnalytics, setModuleAnalytics] = useState<ModuleAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>(timeRange);

  useEffect(() => {
    loadAnalytics();
  }, [businessId, selectedTimeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, moduleResponse] = await Promise.all([
        fetch(`/api/business/${businessId}/analytics?timeRange=${selectedTimeRange}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }),
        fetch(`/api/business/${businessId}/module-analytics`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      if (moduleResponse.ok) {
        const moduleData = await moduleResponse.json();
        setModuleAnalytics(moduleData.data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatStorageSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Last 30 days';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size={32} />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error" title="Error" className="mb-6">
        {error}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Analytics</h2>
          <p className="text-gray-600 mt-1">
            {getTimeRangeLabel(selectedTimeRange)} • Last updated just now
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats ? formatNumber(stats.memberCount) : '0'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Folder className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Files Created</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats ? formatNumber(stats.fileCount) : '0'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversations</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats ? formatNumber(stats.conversationCount) : '0'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <HardDrive className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats ? formatStorageSize(stats.storageUsed) : '0 B'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Module Analytics */}
      {moduleAnalytics && moduleAnalytics.totalModules > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Module Performance</h3>
              <p className="text-sm text-gray-600">
                {moduleAnalytics.totalModules} modules • {moduleAnalytics.totalInstallations} total installations
              </p>
            </div>
            <Badge color="green" size="sm">
              {moduleAnalytics.moduleAdoptionRate.toFixed(1)}% Adoption Rate
            </Badge>
          </div>

          <div className="space-y-4">
            {moduleAnalytics.modules.map((module) => (
              <div key={module.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{module.name}</h4>
                    <p className="text-sm text-gray-600">
                      by {module.developer.name} • {module.category}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {module.activeInstallations}
                    </p>
                    <p className="text-xs text-gray-600">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {module.adoptionRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-600">Adoption</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {module.adoptionRate > 50 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No Modules State */}
      {moduleAnalytics && moduleAnalytics.totalModules === 0 && (
        <Card className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Modules Yet</h3>
          <p className="text-gray-600 mb-4">
            Your business doesn't have any modules yet. Create or link modules to see performance analytics.
          </p>
          <Button variant="secondary">
            <Upload className="w-4 h-4 mr-2" />
            Submit Module
          </Button>
        </Card>
      )}

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-1 bg-blue-100 rounded">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New team member joined</p>
                <p className="text-xs text-gray-600">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-1 bg-green-100 rounded">
                <Folder className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">5 files uploaded</p>
                <p className="text-xs text-gray-600">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-1 bg-purple-100 rounded">
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New conversation started</p>
                <p className="text-xs text-gray-600">6 hours ago</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Button variant="secondary" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Invite Team Member
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Detailed Analytics
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Review
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 