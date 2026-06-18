'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Alert, Spinner } from 'shared/components';
import { adminApiService, type BusinessIntelligenceData } from '../../lib/adminApiService';
import {
  TrendingUp,
  Download,
  RefreshCw,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from 'lucide-react';

interface FilterOptions extends Record<string, unknown> {
  dateRange: string;
  userType: string;
  metricType: string;
  segment: string;
}

export default function AdminPlatformAnalyticsInsightsPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BusinessIntelligenceData | null>(null);
  const [filters] = useState<FilterOptions>({
    dateRange: '30d',
    userType: 'all',
    metricType: 'all',
    segment: 'all',
  });
  const [exportLoading, setExportLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiService.getBusinessIntelligence(filters);
      setData(response.data ?? null);
    } catch (err: unknown) {
      console.error('Error loading strategic insights:', err);
      setError('Failed to load strategic insights. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExportLoading(true);
    try {
      await adminApiService.exportBusinessIntelligence(filters, format);
    } catch (err: unknown) {
      console.error('Error exporting insights:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'churn':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'upsell':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'growth':
        return <Target className="w-5 h-5 text-blue-500" />;
      case 'risk':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'blue';
      case 'completed':
        return 'green';
      case 'paused':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-v-text-secondary">
          Strategic insights, A/B tests, segments, and competitive analysis — served via{' '}
          <code className="text-xs">adminAnalyticsService.getBusinessIntelligence</code>
        </p>
        <div className="flex items-center space-x-2">
          <Button onClick={loadData} disabled={loading} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('csv')}
            disabled={exportLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={48} />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-v-text-primary">Predictive Insights</h2>
              <Badge color="blue" size="sm">
                AI-Powered
              </Badge>
            </div>
            <div className="space-y-4">
              {data.predictiveInsights.map((insight, index) => (
                <div key={index} className="border border-v-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h3 className="font-medium text-v-text-primary">{insight.title}</h3>
                        <p className="text-sm text-v-text-secondary mt-1">{insight.description}</p>
                        <p className="text-sm text-v-text-secondary mt-2">
                          <strong>Recommended Action:</strong> {insight.recommendedAction}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge color={getImpactColor(insight.impact)} size="sm">
                        {insight.impact} impact
                      </Badge>
                      <span className="text-sm text-v-text-secondary">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-v-text-primary mb-6">A/B Testing</h2>
            <div className="space-y-4">
              {data.abTests.map((test) => (
                <div key={test.id} className="border border-v-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-v-text-primary">{test.name}</h3>
                    <Badge color={getTestStatusColor(test.status)} size="sm">
                      {test.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-v-surface-muted rounded-lg p-3">
                      <h4 className="font-medium text-v-text-primary mb-2">{test.variantA.name}</h4>
                      <div className="space-y-1 text-sm">
                        <p>Users: {test.variantA.users.toLocaleString()}</p>
                        <p>Conversion: {test.variantA.conversionRate}%</p>
                        <p>Revenue: ${test.variantA.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="bg-v-surface-muted rounded-lg p-3">
                      <h4 className="font-medium text-v-text-primary mb-2">{test.variantB.name}</h4>
                      <div className="space-y-1 text-sm">
                        <p>Users: {test.variantB.users.toLocaleString()}</p>
                        <p>Conversion: {test.variantB.conversionRate}%</p>
                        <p>Revenue: ${test.variantB.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  {test.winner && (
                    <div className="mt-3 p-2 bg-green-50 rounded">
                      <p className="text-sm text-green-800">
                        <strong>Winner:</strong> Variant {test.winner} ({test.confidence}% confidence)
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-v-text-primary mb-6">User Segments</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.userSegments.map((segment) => (
                <div key={segment.id} className="border border-v-border rounded-lg p-4">
                  <h3 className="font-medium text-v-text-primary mb-2">{segment.name}</h3>
                  <p className="text-sm text-v-text-secondary mb-3">{segment.criteria}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Users:</span>
                      <span className="font-medium">{segment.userCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Value:</span>
                      <span className="font-medium">${segment.averageValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Growth:</span>
                      <span className="font-medium text-green-600">+{segment.growthRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-v-text-primary mb-6">Competitive Analysis</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-v-text-primary mb-4">Market Position</h3>
                <Badge color="green" size="lg">
                  {data.competitiveAnalysis.marketPosition}
                </Badge>
                <div className="mt-6">
                  <h4 className="font-medium text-v-text-primary mb-3">Opportunities</h4>
                  <ul className="space-y-2">
                    {data.competitiveAnalysis.opportunities.map((opportunity, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {opportunity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-v-text-primary mb-4">Key Competitors</h3>
                <div className="space-y-4">
                  {data.competitiveAnalysis.keyCompetitors.map((competitor, index) => (
                    <div key={index} className="border border-v-border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-v-text-primary">{competitor.name}</h4>
                        <span className="text-sm text-v-text-secondary">
                          {competitor.marketShare}% share
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Alert>
          <div className="flex items-start space-x-2">
            <BarChart3 className="h-4 w-4 mt-0.5" />
            <div>
              No strategic insights data available. Overview metrics are on the Overview tab; infrastructure
              metrics remain on Performance &amp; Scalability.
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}
