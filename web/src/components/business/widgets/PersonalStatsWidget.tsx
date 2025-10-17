'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Target, Star } from 'lucide-react';
import { WidgetProps, WidgetContainer, WidgetLoading, WidgetError } from './WidgetRegistry';

interface PersonalStats {
  tasksCompleted: number;
  hoursWorked: number;
  goalsAchieved: number;
  performanceScore: number;
}

export default function PersonalStatsWidget({ businessId, userId, settings, theme }: WidgetProps) {
  const [stats, setStats] = useState<PersonalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [businessId, userId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implement actual API call
      setTimeout(() => {
        setStats({
          tasksCompleted: 34,
          hoursWorked: 156,
          goalsAchieved: 8,
          performanceScore: 92,
        });
        setLoading(false);
      }, 800);
    } catch (err) {
      setError('Failed to load personal statistics');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <WidgetContainer title="Your Statistics" icon="👤" theme={theme}>
        <WidgetLoading message="Loading your stats..." />
      </WidgetContainer>
    );
  }

  if (error) {
    return (
      <WidgetContainer title="Your Statistics" icon="👤" theme={theme}>
        <WidgetError message={error} onRetry={loadStats} />
      </WidgetContainer>
    );
  }

  const statItems = [
    {
      icon: CheckCircle,
      label: 'Tasks Completed',
      value: stats?.tasksCompleted || 0,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      icon: Clock,
      label: 'Hours Worked',
      value: stats?.hoursWorked || 0,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      icon: Target,
      label: 'Goals Achieved',
      value: stats?.goalsAchieved || 0,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
    {
      icon: Star,
      label: 'Performance Score',
      value: `${stats?.performanceScore || 0}%`,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <WidgetContainer
      title={(settings?.title as string) || 'Your Statistics'}
      icon="👤"
      description={((settings?.description as string) || 'Your personal performance metrics')}
      theme={theme}
    >
      <div className="space-y-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${item.bgColor} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${item.textColor}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{item.value}</span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold" style={{ color: theme?.primaryColor }}>
            {stats?.performanceScore}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${stats?.performanceScore}%`,
              backgroundColor: theme?.primaryColor || '#3B82F6',
            }}
          ></div>
        </div>
      </div>
    </WidgetContainer>
  );
}

