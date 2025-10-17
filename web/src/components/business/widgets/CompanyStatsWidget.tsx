'use client';

import React, { useState, useEffect } from 'react';
import { Users, FileText, MessageSquare, TrendingUp } from 'lucide-react';
import { WidgetProps, WidgetContainer, WidgetLoading, WidgetError } from './WidgetRegistry';

interface CompanyStats {
  totalEmployees: number;
  activeProjects: number;
  totalConversations: number;
  growthRate: number;
}

export default function CompanyStatsWidget({ businessId, settings, theme }: WidgetProps) {
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [businessId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implement actual API call
      setTimeout(() => {
        setStats({
          totalEmployees: 48,
          activeProjects: 12,
          totalConversations: 256,
          growthRate: 24,
        });
        setLoading(false);
      }, 800);
    } catch (err) {
      setError('Failed to load company statistics');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <WidgetContainer title="Company Statistics" icon="📊" theme={theme}>
        <WidgetLoading message="Loading statistics..." />
      </WidgetContainer>
    );
  }

  if (error) {
    return (
      <WidgetContainer title="Company Statistics" icon="📊" theme={theme}>
        <WidgetError message={error} onRetry={loadStats} />
      </WidgetContainer>
    );
  }

  const statItems = [
    {
      icon: Users,
      label: 'Total Employees',
      value: stats?.totalEmployees || 0,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      icon: FileText,
      label: 'Active Projects',
      value: stats?.activeProjects || 0,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      icon: MessageSquare,
      label: 'Conversations',
      value: stats?.totalConversations || 0,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
    {
      icon: TrendingUp,
      label: 'Growth Rate',
      value: `+${stats?.growthRate || 0}%`,
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
    },
  ];

  return (
    <WidgetContainer
      title={(settings?.title as string) || 'Company Statistics'}
      icon="📊"
      description={(settings?.description as string) || undefined}
      theme={theme}
    >
      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 ${item.bgColor} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${item.textColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-sm text-gray-600 mt-1">{item.label}</p>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
}

