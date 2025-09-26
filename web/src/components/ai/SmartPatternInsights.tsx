'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger, ProgressBar } from 'shared/components';
import { 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  Clock, 
  Activity, 
  Target,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { authenticatedApiCall } from '../../lib/apiUtils';

interface UserPattern {
  id: string;
  type: 'temporal' | 'behavioral' | 'communication' | 'decision';
  pattern: string;
  confidence: number;
  frequency: number;
  metadata: any;
}

interface PatternPrediction {
  type: string;
  description: string;
  confidence: number;
  suggestedAction?: string;
  reasoning: string;
}

interface SmartSuggestion {
  id: string;
  type: 'action' | 'optimization' | 'reminder' | 'insight';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions: string[];
}

interface PatternAnalysis {
  patterns: UserPattern[];
  predictions: PatternPrediction[];
  suggestions: SmartSuggestion[];
}

interface PatternInsights {
  totalInteractions: number;
  averageConfidence: number;
  mostActiveHour: number;
  mostCommonQueryType: string;
  productivityScore: number;
  trends: {
    interactionTrend: 'increasing' | 'decreasing' | 'stable';
    confidenceTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export default function SmartPatternInsights() {
  const { data: session } = useSession();
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [insights, setInsights] = useState<PatternInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [error, setError] = useState<string | null>(null);

  const loadPatternAnalysis = async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const [analysisResponse, insightsResponse] = await Promise.all([
        authenticatedApiCall(
          `/api/ai/patterns/analysis`,
          { method: 'GET' },
          session.accessToken
        ),
        authenticatedApiCall(
          `/api/ai/patterns/insights/${selectedTimeframe}`,
          { method: 'GET' },
          session.accessToken
        )
      ]);

      if ((analysisResponse as any)?.success) {
        setAnalysis((analysisResponse as any).analysis);
      }

      if ((insightsResponse as any)?.success) {
        setInsights((insightsResponse as any).insights);
      }
    } catch (error) {
      console.error('Error loading pattern analysis:', error);
      setError('Failed to load pattern analysis');
    } finally {
      setLoading(false);
    }
  };

  const forceRediscovery = async () => {
    if (!session?.accessToken) return;

    try {
      setRefreshing(true);
      const response = await authenticatedApiCall(
        '/api/ai/patterns/rediscover',
        { method: 'POST' },
        session.accessToken
      );

      if ((response as any)?.success) {
        // Reload analysis after rediscovery
        await loadPatternAnalysis();
      }
    } catch (error) {
      console.error('Error rediscovering patterns:', error);
      setError('Failed to rediscover patterns');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatternAnalysis();
  }, [session, selectedTimeframe]);

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'temporal': return <Clock className="h-4 w-4" />;
      case 'behavioral': return <Activity className="h-4 w-4" />;
      case 'communication': return <Target className="h-4 w-4" />;
      case 'decision': return <Brain className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case 'stable': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Analyzing your patterns...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={loadPatternAnalysis} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Smart Pattern Intelligence</h3>
          <p className="text-sm text-gray-600">
            AI-discovered insights about your behavior and preferences
          </p>
        </div>
        <Button 
          onClick={forceRediscovery} 
          variant="ghost" 
          size="sm" 
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Discovering...' : 'Rediscover Patterns'}
        </Button>
      </div>

      {/* Overview Stats */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interactions</p>
                <p className="text-2xl font-bold">{insights.totalInteractions}</p>
              </div>
              {getTrendIcon(insights.trends.interactionTrend)}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold">{insights.averageConfidence}%</p>
              </div>
              {getTrendIcon(insights.trends.confidenceTrend)}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Peak Hour</p>
                <p className="text-2xl font-bold">{insights.mostActiveHour}:00</p>
              </div>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Productivity</p>
                <p className="text-2xl font-bold">{insights.productivityScore}%</p>
              </div>
              <Target className="h-5 w-5 text-green-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patterns">Discovered Patterns</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="suggestions">Smart Suggestions</TabsTrigger>
        </TabsList>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          {analysis?.patterns && analysis.patterns.length > 0 ? (
            <div className="grid gap-4">
              {analysis.patterns.map((pattern) => (
                <Card key={pattern.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getPatternIcon(pattern.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{pattern.pattern}</h4>
                          <Badge color="blue">
                            {pattern.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Observed {pattern.frequency} times
                        </p>
                        {pattern.metadata && Object.keys(pattern.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {pattern.metadata.percentage && (
                              <span>{pattern.metadata.percentage}% of your activity</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16">
                        <ProgressBar value={pattern.confidence} />
                      </div>
                      <span className="text-sm text-gray-600">
                        {pattern.confidence}%
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h4 className="font-medium mb-2">Learning Your Patterns</h4>
              <p className="text-sm text-gray-600">
                Keep using the AI system to discover personalized patterns and insights.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {analysis?.predictions && analysis.predictions.length > 0 ? (
            <div className="grid gap-4">
              {analysis.predictions.map((prediction, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{prediction.description}</h4>
                        <Badge color="blue">
                          {prediction.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {prediction.reasoning}
                      </p>
                      {prediction.suggestedAction && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">
                            Suggested Action:
                          </p>
                          <p className="text-sm text-blue-700">
                            {prediction.suggestedAction}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h4 className="font-medium mb-2">Building Predictions</h4>
              <p className="text-sm text-gray-600">
                More interactions will enable better predictions about your needs.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          {analysis?.suggestions && analysis.suggestions.length > 0 ? (
            <div className="grid gap-4">
              {analysis.suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge color={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority}
                          </Badge>
                          {suggestion.actionable && (
                            <Badge color="green">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Actionable
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {suggestion.description}
                      </p>
                      {suggestion.suggestedActions && suggestion.suggestedActions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Suggested Actions:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {suggestion.suggestedActions.map((action, actionIndex) => (
                              <li key={actionIndex} className="flex items-center space-x-2">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h4 className="font-medium mb-2">Generating Suggestions</h4>
              <p className="text-sm text-gray-600">
                Smart suggestions will appear as we learn more about your preferences.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
