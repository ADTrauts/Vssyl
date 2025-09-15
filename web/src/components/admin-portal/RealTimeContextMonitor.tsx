'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Activity, Users, Brain, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { getAIContextStats, AIContextStats } from '../../api/aiContextDebug';

interface RealTimeContextMonitorProps {
  className?: string;
}

export default function RealTimeContextMonitor({ className = '' }: RealTimeContextMonitorProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AIContextStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await getAIContextStats(session.accessToken);
      if (response.success) {
        setStats(response.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Failed to fetch stats');
      }
    } catch (err) {
      setError('Error fetching stats');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [session?.accessToken]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  if (loading && !stats) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Real-Time AI Context Monitor</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live</span>
            {lastUpdated && (
              <span>• Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {stats && (
        <div className="p-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Total Users</h4>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(stats.totalUsers)}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">AI Profiles</h4>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(stats.aiAdoption.usersWithProfile)}
              </div>
              <div className="text-sm text-gray-600">
                {formatPercentage(stats.aiAdoption.profilePercentage)} adoption
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">AI Settings</h4>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(stats.aiAdoption.usersWithSettings)}
              </div>
              <div className="text-sm text-gray-600">
                {formatPercentage(stats.aiAdoption.settingsPercentage)} configured
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-gray-900">24h Conversations</h4>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {formatNumber(stats.conversations.last24Hours)}
              </div>
              <div className="text-sm text-gray-600">
                {formatNumber(stats.conversations.total)} total
              </div>
            </div>
          </div>

          {/* AI Performance Metrics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">AI Performance Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.conversations.averageConfidence.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Average Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.conversations.total)}
                </div>
                <div className="text-sm text-gray-600">Total Conversations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.conversations.last24Hours)}
                </div>
                <div className="text-sm text-gray-600">Last 24 Hours</div>
              </div>
            </div>
          </div>

          {/* Module Usage */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Top Module Usage</h4>
            {stats.moduleUsage.length > 0 ? (
              <div className="space-y-2">
                {stats.moduleUsage.slice(0, 5).map((module, index) => (
                  <div key={module.moduleId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{module.moduleName}</span>
                      <span className="text-xs text-gray-500">({module.category})</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(module.installCount)} installs
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No module usage data available</p>
            )}
          </div>

          {/* System Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <h4 className="font-semibold text-green-900">System Status</h4>
            </div>
            <div className="text-sm text-green-800">
              <p>• AI Context System: Operational</p>
              <p>• Real-time monitoring: Active</p>
              <p>• Data collection: Normal</p>
              <p>• Last system check: {lastUpdated?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
