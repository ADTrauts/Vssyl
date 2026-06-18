'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import { 
  Brain, 
  Globe,
  Activity,
  Target,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  GitBranch,
  FlaskConical,
  Cloud,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { adminApiService } from '../../../lib/adminApiService';
import { ADMIN_CANONICAL_ANALYTICS_PATH } from '../../../lib/adminAnalyticsOwnership';

interface Pattern {
  id: string;
  type: string;
  description: string;
  frequency?: number;
  confidence?: number;
  source: 'ai-learning' | 'business-ai';
  modules?: string[];
  affectedBusinesses?: string[];
}

interface Insight {
  id: string;
  title: string;
  description: string;
  type: string;
  confidence?: number;
  source: 'ai-learning' | 'business-ai';
  impact?: string;
}

interface AISystemOverview {
  aiLearning: {
    globalPatterns: number;
    collectiveInsights: number;
    systemHealth: number;
    consentingUsers: number;
  };
  businessAI: {
    totalBusinessAIs: number;
    activeBusinessAIs: number;
    totalInteractions: number;
    centralizedLearningEnabled: number;
  };
  context: {
    totalContexts: number;
    validatedContexts: number;
    crossModuleConnections: number;
  };
  unifiedPatterns: Pattern[];
  unifiedInsights: Insight[];
}

export default function AISystemPage() {
  const { data: session, status } = useSession();
  const [overview, setOverview] = useState<AISystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPatternsSection, setShowPatternsSection] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      loadOverviewData();
    }
  }, [status, session]);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data from all AI systems in parallel
      // Note: Some endpoints may not exist yet, so we gracefully handle failures
      const [businessAIRes, patternsRes] = await Promise.all([
        adminApiService.getBusinessAIGlobal().catch(() => ({ data: null, error: null })),
        adminApiService.getBusinessAIPatterns().catch(() => ({ data: null, error: null })),
      ]);

      const businessAIData = businessAIRes.data as Record<string, unknown> | null;
      const patternsData = patternsRes.data as Record<string, unknown> | null;

      // Combine patterns from different sources
      const unifiedPatterns: Pattern[] = [];
      if (patternsData?.patterns && Array.isArray(patternsData.patterns)) {
        patternsData.patterns.forEach((p: any) => {
          unifiedPatterns.push({
            id: p.id || `pattern-${unifiedPatterns.length}`,
            type: p.patternType || p.type || 'unknown',
            description: p.description || p.pattern || 'No description',
            frequency: p.frequency,
            confidence: p.confidence,
            source: 'business-ai',
            modules: p.modules || [],
            affectedBusinesses: p.affectedBusinesses || []
          });
        });
      }
      
      // Handle case where patternsData might be null or have different structure
      if (!patternsData && businessAIData?.globalMetrics) {
        // If we have business AI data but no patterns, that's okay
      }

      // Combine insights from Business AI only (platform metrics live in Platform Analytics)
      const unifiedInsights: Insight[] = [];

      if (patternsData?.insights && Array.isArray(patternsData.insights)) {
        patternsData.insights.forEach((insight: Record<string, unknown>) => {
          unifiedInsights.push({
            id: (insight.id as string) || `bai-${unifiedInsights.length}`,
            title: (insight.title as string) || (insight.insight as string) || 'Cross-Business Insight',
            description: (insight.description as string) || '',
            type: (insight.type as string) || 'cross-business',
            confidence: insight.confidence as number | undefined,
            source: 'business-ai',
            impact: insight.impact as string | undefined,
          });
        });
      }

      const globalMetrics = (businessAIData?.globalMetrics ?? {}) as Record<string, number>;

      setOverview({
        aiLearning: {
          globalPatterns: 0, // Will be loaded when AI Learning endpoints are available through admin API
          collectiveInsights: 0,
          systemHealth: 95, // Default value
          consentingUsers: 0
        },
        businessAI: {
          totalBusinessAIs: globalMetrics.totalBusinessAIs || 0,
          activeBusinessAIs: globalMetrics.activeBusinessAIs || 0,
          totalInteractions: globalMetrics.totalInteractions || 0,
          centralizedLearningEnabled: globalMetrics.centralizedLearningEnabled || 0,
        },
        context: {
          totalContexts: 0, // Would need context stats endpoint
          validatedContexts: 0,
          crossModuleConnections: 0
        },
        unifiedPatterns,
        unifiedInsights,
      });
    } catch (err) {
      console.error('Error loading AI System overview:', err);
      setError('Failed to load AI System overview');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-v-text-secondary">Loading session...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-v-text-secondary">Loading AI System overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-v-text-primary">AI System</h1>
          <p className="text-v-text-secondary mt-2">
            AI launcher and cross-system overview — platform metrics live in Platform Analytics
          </p>
        </div>
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      </div>
    );
  }

  const systemCards = [
    {
      id: 'ai-pipeline',
      title: 'AI Pipeline',
      description: 'Canonical AI control plane — grounding, diagnostics, and compliance',
      icon: GitBranch,
      color: 'indigo',
      path: '/admin-portal/ai-pipeline',
      metrics: [
        { label: 'Intents', value: 10 },
        { label: 'Diagnostics', value: 'Live' },
        { label: 'Test Lab', value: 'Dry-run' },
        { label: 'Providers', value: 'Official APIs' }
      ]
    },
    {
      id: 'test-lab',
      title: 'AI Test Lab',
      description: 'Dry-run prompts and suggestion evaluation',
      icon: FlaskConical,
      color: 'purple',
      path: '/admin-portal/ai-pipeline/test-lab',
      metrics: [
        { label: 'Twin dry-run', value: 'Live' },
        { label: 'Suggestions', value: 'Fixtures' },
        { label: 'Module probes', value: 'Health' },
        { label: 'Side effects', value: 'None' }
      ]
    },
    {
      id: 'provider-governance',
      title: 'Provider Governance',
      description: 'OpenAI and Anthropic official usage and costs',
      icon: Cloud,
      color: 'blue',
      path: '/admin-portal/ai-pipeline#provider-governance',
      metrics: [
        { label: 'OpenAI', value: 'Official' },
        { label: 'Anthropic', value: 'Official' },
        { label: 'Usage', value: 'Combined' },
        { label: 'Expenses', value: 'Billing' }
      ]
    },
    {
      id: 'platform-analytics',
      title: 'Platform Analytics',
      description: 'Canonical platform user, revenue, and strategic insights',
      icon: BarChart3,
      color: 'orange',
      path: ADMIN_CANONICAL_ANALYTICS_PATH,
      metrics: [
        { label: 'Users & Revenue', value: 'Overview' },
        { label: 'Strategic', value: 'Insights tab' },
        { label: 'Activity', value: 'Live feed' },
        { label: 'Infra detail', value: 'Performance' },
      ],
    },
    {
      id: 'business-ai',
      title: 'Business AI Global',
      description: 'Manage all business AI digital twins across the platform',
      icon: Globe,
      color: 'green',
      path: '/admin-portal/business-ai',
      metrics: [
        { label: 'Total Business AIs', value: overview?.businessAI.totalBusinessAIs || 0 },
        { label: 'Active Business AIs', value: overview?.businessAI.activeBusinessAIs || 0 },
        { label: 'Total Interactions', value: overview?.businessAI.totalInteractions.toLocaleString() || '0' },
        { label: 'Centralized Learning', value: overview?.businessAI.centralizedLearningEnabled || 0 }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-v-text-primary">AI System</h1>
          <p className="text-v-text-secondary mt-2">
            AI launcher and cross-system overview — platform metrics live in Platform Analytics
          </p>
        </div>
        <Button onClick={loadOverviewData} variant="secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systemCards.map((system) => {
          const Icon = system.icon;
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
            green: { bg: 'bg-green-100', text: 'text-green-600' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
            indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
          };
          const colors = colorClasses[system.color as keyof typeof colorClasses] || colorClasses.blue;
          
          return (
            <Link key={system.id} href={system.path}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${colors.bg}`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-v-text-primary">{system.title}</h3>
                      <p className="text-sm text-v-text-secondary mt-1">{system.description}</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-5 h-5 ${colors.text}`} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {system.metrics.map((metric, idx) => (
                    <div key={idx} className="border-t border-v-border pt-3">
                      <p className="text-xs text-v-text-secondary mb-1">{metric.label}</p>
                      <p className="text-lg font-semibold text-v-text-primary">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Combined Analytics Summary */}
      {overview && (
        <div>
          <h2 className="text-xl font-semibold text-v-text-primary mb-4">Combined Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-v-text-secondary mb-1">Total AI Systems</p>
                  <p className="text-2xl font-bold text-v-text-primary">
                    {overview.businessAI.totalBusinessAIs + (overview.aiLearning.systemHealth > 0 ? 1 : 0)}
                  </p>
                  <p className="text-xs text-v-text-secondary mt-1">
                    {overview.businessAI.activeBusinessAIs} active
                  </p>
                </div>
                <Brain className="w-8 h-8 text-purple-600 opacity-50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-v-text-secondary mb-1">Total Insights</p>
                  <p className="text-2xl font-bold text-v-text-primary">
                    {overview?.unifiedInsights?.length ?? 0}
                  </p>
                  <p className="text-xs text-v-text-secondary mt-1">
                    Across all systems
                  </p>
                </div>
                <Lightbulb className="w-8 h-8 text-yellow-600 opacity-50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-v-text-secondary mb-1">Total Patterns</p>
                  <p className="text-2xl font-bold text-v-text-primary">
                    {overview?.unifiedPatterns?.length ?? 0}
                  </p>
                  <p className="text-xs text-v-text-secondary mt-1">
                    Discovered patterns
                  </p>
                </div>
                <Target className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-v-text-secondary mb-1">AI Interactions</p>
                  <p className="text-2xl font-bold text-v-text-primary">
                    {overview.businessAI.totalInteractions.toLocaleString()}
                  </p>
                  <p className="text-xs text-v-text-secondary mt-1">
                    Total conversations
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </Card>
          </div>
        </div>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-v-text-primary">Platform Analytics</h2>
            <p className="text-sm text-v-text-secondary mt-1">
              User growth, revenue, engagement, and strategic insights are owned by Platform Analytics — not duplicated on this launcher.
            </p>
          </div>
          <Link href="/admin-portal/analytics">
            <Button variant="secondary">
              Open Platform Analytics
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Unified Patterns & Insights Section */}
      {((overview?.unifiedPatterns?.length ?? 0) > 0 || (overview?.unifiedInsights?.length ?? 0) > 0) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-v-text-primary">Patterns & Insights</h2>
            <Button
              variant="secondary"
              onClick={() => setShowPatternsSection(!showPatternsSection)}
            >
              {showPatternsSection ? 'Hide' : 'Show'}
            </Button>
          </div>
          
          {showPatternsSection && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patterns Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-v-text-primary">Unified Patterns</h3>
                  </div>
                  <Badge color="blue" size="sm">
                    {overview?.unifiedPatterns?.length ?? 0} patterns
                  </Badge>
                </div>
                
                {(overview?.unifiedPatterns?.length ?? 0) > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {overview?.unifiedPatterns?.slice(0, 5).map((pattern) => (
                      <div key={pattern.id} className="border border-v-border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge color="blue" size="sm">
                                {pattern.source === 'ai-learning' ? 'AI Learning' : 'Business AI'}
                              </Badge>
                              <span className="text-xs text-v-text-secondary font-medium">{pattern.type}</span>
                            </div>
                            <p className="text-sm text-v-text-primary font-medium">{pattern.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-v-text-secondary">
                          {pattern.frequency !== undefined && (
                            <span>Frequency: {pattern.frequency}</span>
                          )}
                          {pattern.confidence !== undefined && (
                            <span>Confidence: {Math.round(pattern.confidence * 100)}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {(overview?.unifiedPatterns?.length ?? 0) > 5 && (
                      <Link href="/admin-portal/business-ai">
                        <div className="text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                          View all {overview?.unifiedPatterns?.length ?? 0} patterns →
                        </div>
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-v-text-secondary text-center py-4">No patterns discovered yet</p>
                )}
              </Card>

              {/* Insights Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-v-text-primary">Unified Insights</h3>
                  </div>
                  <Badge color="yellow" size="sm">
                    {overview?.unifiedInsights?.length ?? 0} insights
                  </Badge>
                </div>
                
                {(overview?.unifiedInsights?.length ?? 0) > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {overview?.unifiedInsights?.slice(0, 5).map((insight) => {
                      const sourceColors = {
                        'business-ai': 'green',
                        'ai-learning': 'purple',
                      };
                      const sourceLabels = {
                        'business-ai': 'Business AI',
                        'ai-learning': 'AI Learning',
                      };
                      const color = sourceColors[insight.source] || 'gray';
                      
                      return (
                        <div key={insight.id} className="border border-v-border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge color={color as any} size="sm">
                                  {sourceLabels[insight.source]}
                                </Badge>
                                {insight.impact && (
                                  <Badge 
                                    color={insight.impact === 'high' ? 'red' : insight.impact === 'medium' ? 'yellow' : 'green'} 
                                    size="sm"
                                  >
                                    {insight.impact} impact
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-v-text-primary font-medium">{insight.title}</p>
                              {insight.description && (
                                <p className="text-xs text-v-text-secondary mt-1">{insight.description}</p>
                              )}
                            </div>
                          </div>
                          {insight.confidence !== undefined && (
                            <div className="mt-2 text-xs text-v-text-secondary">
                              Confidence: {Math.round(insight.confidence)}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {(overview?.unifiedInsights?.length ?? 0) > 5 && (
                      <div className="text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                        <Link href="/admin-portal/analytics?tab=insights">View strategic insights →</Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-v-text-secondary text-center py-4">No insights available yet</p>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-v-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin-portal/ai-pipeline">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <GitBranch className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-medium text-v-text-primary">AI Pipeline</h3>
                  <p className="text-sm text-v-text-secondary">Control plane hub</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/admin-portal/ai-pipeline/test-lab">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <FlaskConical className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-medium text-v-text-primary">AI Test Lab</h3>
                  <p className="text-sm text-v-text-secondary">Evaluation dry-runs</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/admin-portal/ai-pipeline#provider-governance">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <Cloud className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-v-text-primary">Provider Governance</h3>
                  <p className="text-sm text-v-text-secondary">Official provider usage</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/admin-portal/business-ai">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-v-text-primary">Business AI Management</h3>
                  <p className="text-sm text-v-text-secondary">Digital twins and patterns</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

