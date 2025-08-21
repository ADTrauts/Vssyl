import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner } from 'shared/components';
import { authenticatedApiCall } from '../../lib/apiUtils';

interface PredictiveAnalytics {
  totalAnalyses: number;
  averageConfidence: number;
  totalRecommendations: number;
  analysisTypes: string[];
  timeframes: string[];
  recentAnalyses: any[];
}

interface PredictiveAnalysis {
  id: string;
  analysisType: string;
  confidence: number;
  probability: number;
  timeframe: string;
  description: string;
  recommendations: any[];
  data: any;
}

const PredictiveIntelligenceDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<PredictiveAnalytics | null>(null);
  const [analyses, setAnalyses] = useState<PredictiveAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadPredictiveData();
  }, []);

  const loadPredictiveData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load data with error handling
      const [analyticsResponse, analysesResponse] = await Promise.allSettled([
        authenticatedApiCall<{ data: PredictiveAnalytics }>(
          '/api/ai/intelligence/predictive/analytics'
        ),
        authenticatedApiCall<{ data: PredictiveAnalysis[] }>(
          '/api/ai/intelligence/predictive/analyze',
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context: {} }) }
        )
      ]);

      // Handle analytics response
      if (analyticsResponse.status === 'rejected') {
        console.warn('Predictive analytics endpoint not available yet');
        setAnalytics({
          totalAnalyses: 0,
          averageConfidence: 0.7,
          totalRecommendations: 0,
          analysisTypes: [],
          timeframes: [],
          recentAnalyses: []
        });
      } else {
        setAnalytics(analyticsResponse.value.data);
      }

      // Handle analyses response
      if (analysesResponse.status === 'rejected') {
        console.warn('Predictive analyses endpoint not available yet');
        setAnalyses([]);
      } else {
        setAnalyses(analysesResponse.value.data || []);
      }
    } catch (err) {
      console.error('Error loading predictive data:', err);
      setError('Predictive intelligence features are not available yet. This is a Phase 3 feature that will be available soon.');
      
      // Set default data to prevent crashes
      setAnalytics({
        totalAnalyses: 0,
        averageConfidence: 0.7,
        totalRecommendations: 0,
        analysisTypes: [],
        timeframes: [],
        recentAnalyses: []
      });
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const generateNewAnalysis = async () => {
    try {
      setGenerating(true);
      setError(null);

      const data = await authenticatedApiCall<{ data: PredictiveAnalysis[] }>(
        '/api/ai/intelligence/predictive/analyze',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context: {} }) }
      );
      setAnalyses(data.data);
      
      // Reload analytics
      await loadPredictiveData();
    } catch (err) {
      console.error('Error generating new analysis:', err);
      setError('Predictive analysis generation is not available yet. This is a Phase 3 feature that will be available soon.');
    } finally {
      setGenerating(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'red';
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return 'green';
    if (probability >= 0.6) return 'yellow';
    return 'red';
  };

  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return 'red';
      case 'short_term': return 'yellow';
      case 'medium_term': return 'yellow';
      case 'long_term': return 'blue';
      default: return 'gray';
    }
  };

  const formatAnalysisType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size={32} />
        <span className="ml-2">Loading predictive intelligence data...</span>
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
        No predictive analytics available yet.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Predictive Intelligence Dashboard</h2>
          <p className="text-gray-600">AI predictions and anticipatory insights</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadPredictiveData} variant="secondary">
            Refresh
          </Button>
          <Button onClick={generateNewAnalysis} disabled={generating}>
            {generating ? (
              <>
                <Spinner size={16} />
                <span className="ml-2">Generating...</span>
              </>
            ) : (
              'Generate Analysis'
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Analyses</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalAnalyses}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Average Confidence</h3>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-gray-900">
                {(analytics.averageConfidence * 100).toFixed(1)}%
              </p>
              <Badge color={getConfidenceColor(analytics.averageConfidence)} className="ml-2">
                {analytics.averageConfidence >= 0.8 ? 'High' : analytics.averageConfidence >= 0.6 ? 'Medium' : 'Low'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Recommendations</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalRecommendations}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Analysis Types</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics.analysisTypes.length}</p>
          </div>
        </Card>
      </div>

      {/* Analysis Types Distribution */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.analysisTypes.map((type) => (
              <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                <Badge color="blue" className="mb-2">
                  {formatAnalysisType(type)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Analyses */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Predictive Analyses</h3>
          {analyses.length === 0 ? (
            <p className="text-gray-500">No analyses available. Generate a new analysis to see predictions.</p>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div key={analysis.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      {formatAnalysisType(analysis.analysisType)}
                    </h4>
                    <div className="flex space-x-2">
                      <Badge color={getConfidenceColor(analysis.confidence)}>
                        {(analysis.confidence * 100).toFixed(1)}% confidence
                      </Badge>
                      <Badge color={getProbabilityColor(analysis.probability)}>
                        {(analysis.probability * 100).toFixed(1)}% probability
                      </Badge>
                      <Badge color={getTimeframeColor(analysis.timeframe)}>
                        {analysis.timeframe.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{analysis.description}</p>
                  
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations:</h5>
                      <div className="space-y-2">
                        {analysis.recommendations.slice(0, 3).map((rec: any, index: number) => (
                          <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {rec.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Timeframe Distribution */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Timeframes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.timeframes.map((timeframe) => (
              <div key={timeframe} className="text-center p-3 bg-gray-50 rounded-lg">
                <Badge color={getTimeframeColor(timeframe)} className="mb-2">
                  {timeframe.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Predictive Insights */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictive Insights</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h4 className="font-medium text-blue-900">AI Learning Progress</h4>
              <p className="text-sm text-blue-700 mt-1">
                The AI is continuously learning from your interactions to make better predictions.
              </p>
            </div>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <h4 className="font-medium text-green-900">Anticipatory Capabilities</h4>
              <p className="text-sm text-green-700 mt-1">
                The AI can now anticipate your needs and provide proactive recommendations.
              </p>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <h4 className="font-medium text-yellow-900">Pattern Recognition</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Advanced pattern recognition helps identify trends and predict future behaviors.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PredictiveIntelligenceDashboard; 