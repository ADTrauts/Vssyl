'use client';

import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'shared/components';
import { BarChart3, Sparkles, TrendingUp, Brain } from 'lucide-react';
import { authenticatedApiCall } from '../../lib/apiUtils';

interface LearningAnalyticsSummary {
  totalEvents: number;
  patterns: number;
  predictions: number;
  confidence: number;
  learningProgress: number;
}

export default function InsightsActivityStrip() {
  const [summary, setSummary] = useState<LearningAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await authenticatedApiCall<{ data: LearningAnalyticsSummary }>(
          '/api/ai/intelligence/learning/analytics'
        );
        if (!cancelled && res.data) {
          setSummary(res.data);
        }
      } catch {
        if (!cancelled) {
          setSummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size={24} />
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const items = [
    {
      icon: Brain,
      label: 'Learning events',
      value: String(summary.totalEvents),
    },
    {
      icon: Sparkles,
      label: 'Patterns',
      value: String(summary.patterns),
    },
    {
      icon: TrendingUp,
      label: 'Predictions',
      value: String(summary.predictions),
    },
    {
      icon: BarChart3,
      label: 'Confidence',
      value: `${(summary.confidence * 100).toFixed(0)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ icon: Icon, label, value }) => (
        <Card key={label} className="p-3 border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium">{label}</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </Card>
      ))}
    </div>
  );
}
