import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner } from 'shared/components';
import { authenticatedApiCall } from '../../lib/apiUtils';
import { formatSnakeCase } from '../../lib/formatSnakeCase';

interface RecentInsight {
  id: string;
  type: string;
  description: string;
  confidence: number;
  timestamp: string;
  impact: string;
  significance: number;
}

interface LearningAnalytics {
  totalEvents: number;
  eventTypes: Record<string, number>;
  patterns: number;
  predictions: number;
  confidence: number;
  learningProgress: number;
  recentInsights: RecentInsight[];
}

interface LearningPattern {
  id: string;
  patternType: string;
  confidence: number;
  strength: number;
  frequency: number;
  description: string;
  data: Record<string, unknown>;
}

interface LearningDashboardProps {
  embedded?: boolean;
}

function normalizeEventTypes(eventTypes: unknown): Record<string, number> {
  if (!eventTypes || typeof eventTypes !== 'object') return {};
  if (Array.isArray(eventTypes)) {
    const out: Record<string, number> = {};
    for (const item of eventTypes) {
      if (typeof item === 'string') {
        const key = item || 'unknown';
        out[key] = (out[key] ?? 0) + 1;
        continue;
      }
      if (item && typeof item === 'object') {
        const row = item as { type?: string; eventType?: string; count?: number };
        const key = row.type ?? row.eventType ?? 'unknown';
        out[key] = (out[key] ?? 0) + (typeof row.count === 'number' ? row.count : 1);
      }
    }
    return out;
  }
  const out: Record<string, number> = {};
  for (const [key, count] of Object.entries(eventTypes as Record<string, number>)) {
    if (typeof count !== 'number') continue;
    out[key || 'unknown'] = count;
  }
  return out;
}

function normalizeAnalytics(raw: Partial<LearningAnalytics> | undefined): LearningAnalytics {
  return {
    totalEvents: raw?.totalEvents ?? 0,
    eventTypes: normalizeEventTypes(raw?.eventTypes),
    patterns: raw?.patterns ?? 0,
    predictions: raw?.predictions ?? 0,
    confidence: raw?.confidence ?? 0,
    learningProgress: raw?.learningProgress ?? 0,
    recentInsights: (raw?.recentInsights ?? []).map((insight, index) => {
      const row = insight as RecentInsight & { insightType?: string };
      return {
        id: row.id ?? `insight-${index}`,
        type: row.type ?? row.insightType ?? 'insight',
        description: row.description ?? '',
        confidence: row.confidence ?? 0,
        timestamp: row.timestamp ?? '',
        impact: row.impact ?? '',
        significance: row.significance ?? 0,
      };
    }),
  };
}

function normalizePatterns(raw: LearningPattern[] | undefined): LearningPattern[] {
  return (raw ?? []).map((pattern, index) => ({
    ...pattern,
    id: pattern.id ?? `pattern-${index}`,
    patternType: pattern.patternType ?? 'behavioral',
    description: pattern.description ?? '',
    confidence: pattern.confidence ?? 0,
    strength: pattern.strength ?? 0,
    frequency: pattern.frequency ?? 0,
    data: pattern.data ?? {},
  }));
}

const LearningDashboard: React.FC<LearningDashboardProps> = ({ embedded }) => {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsResponse, patternsResponse] = await Promise.allSettled([
        authenticatedApiCall<{ data: Partial<LearningAnalytics> }>(
          '/api/ai/intelligence/learning/analytics'
        ),
        authenticatedApiCall<{ data: LearningPattern[] }>(
          '/api/ai/intelligence/learning/patterns'
        ),
      ]);

      if (analyticsResponse.status === 'rejected') {
        setAnalytics(
          normalizeAnalytics({
            totalEvents: 0,
            eventTypes: {},
            patterns: 0,
            predictions: 0,
            confidence: 0,
            learningProgress: 0,
            recentInsights: [],
          })
        );
      } else {
        setAnalytics(normalizeAnalytics(analyticsResponse.value.data));
      }

      if (patternsResponse.status === 'rejected') {
        setPatterns([]);
      } else {
        setPatterns(normalizePatterns(patternsResponse.value.data));
      }
    } catch (err) {
      console.error('LearningDashboard: Error loading learning data:', err);
      setError('Learning analytics could not be loaded. Try again later.');
      setAnalytics(null);
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'red';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 0.8) return 'green';
    if (progress >= 0.6) return 'yellow';
    return 'red';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size={32} />
        <span className="ml-2">Loading learning data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error" title="Error">
        {error}
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert type="info" title="No Data">
        No learning analytics available yet.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Learning Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your AI's learning progress and insights</p>
        </div>
        <Button onClick={loadLearningData} variant="secondary">
          Refresh Data
        </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button onClick={loadLearningData} variant="ghost" size="sm">
            Refresh
          </Button>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Learning Events</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalEvents}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Learning Patterns</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.patterns}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">AI Confidence</h3>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(analytics.confidence * 100).toFixed(1)}%
              </p>
              <Badge color={getConfidenceColor(analytics.confidence)} className="ml-2">
                {analytics.confidence >= 0.8 ? 'High' : analytics.confidence >= 0.6 ? 'Medium' : 'Low'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Learning Progress</h3>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(analytics.learningProgress * 100).toFixed(1)}%
              </p>
              <Badge color={getProgressColor(analytics.learningProgress)} className="ml-2">
                {analytics.learningProgress >= 0.8 ? 'Excellent' : analytics.learningProgress >= 0.6 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Types Distribution */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Learning Event Types</h3>
          <div className="space-y-3">
            {Object.entries(analytics.eventTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {formatSnakeCase(type, 'event')}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{
                        width: `${
                          analytics.totalEvents > 0
                            ? (count / analytics.totalEvents) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Learning Patterns */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Learning Patterns</h3>
          {patterns.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No patterns detected yet. Continue using the AI to build patterns.</p>
          ) : (
            <div className="space-y-4">
              {patterns.slice(0, 5).map((pattern) => (
                <div key={pattern.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {formatSnakeCase(pattern.patternType, 'pattern')} Pattern
                    </h4>
                    <Badge color={getConfidenceColor(pattern.confidence)}>
                      {(pattern.confidence * 100).toFixed(1)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{pattern.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Strength: {(pattern.strength * 100).toFixed(1)}%</span>
                    <span>Frequency: {pattern.frequency}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Recent Insights */}
      {analytics.recentInsights && analytics.recentInsights.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Insights</h3>
            <div className="space-y-4">
              {analytics.recentInsights.slice(0, 3).map((insight: RecentInsight, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {formatSnakeCase(insight.type, 'insight')} Insight
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <Badge color={getConfidenceColor(insight.confidence)}>
                      {(insight.confidence * 100).toFixed(1)}% confidence
                    </Badge>
                    <Badge color="blue">
                      {(insight.significance * 100).toFixed(1)}% significance
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Learning Progress Chart */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Learning Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {(analytics.learningProgress * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${analytics.learningProgress * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {analytics.learningProgress >= 0.8 
                ? "Excellent progress! Your AI is learning effectively."
                : analytics.learningProgress >= 0.6
                ? "Good progress. Continue using the AI to improve learning."
                : "Learning in progress. More interactions will improve AI understanding."
              }
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LearningDashboard; 