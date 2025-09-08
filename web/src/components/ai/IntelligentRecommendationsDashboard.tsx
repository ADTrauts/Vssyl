import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner } from 'shared/components';
import { authenticatedApiCall } from '../../lib/apiUtils';

interface RecommendationAnalytics {
  totalRecommendations: number;
  acceptedRecommendations: number;
  implementedRecommendations: number;
  averageConfidence: number;
  categoryDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  recentRecommendations: IntelligentRecommendation[];
}

interface IntelligentRecommendation {
  id: string;
  type: string;
  category: string;
  priority: string;
  confidence: number;
  relevance: number;
  title: string;
  description: string;
  reasoning: string;
  suggestedActions: string[];
  expectedBenefits: string[];
  estimatedImpact: string;
  timeToImplement: string;
  status: string;
  createdAt: string;
}

const IntelligentRecommendationsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<RecommendationAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<IntelligentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadRecommendationsData();
  }, []);

  const loadRecommendationsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load data with error handling
      const [analyticsResponse, recommendationsResponse] = await Promise.allSettled([
        authenticatedApiCall<{ data: RecommendationAnalytics }>(
          '/api/ai/intelligence/recommendations/analytics'
        ),
        authenticatedApiCall<{ data: IntelligentRecommendation[] }>(
          '/api/ai/intelligence/recommendations/generate',
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context: {} }) }
        )
      ]);

      // Handle analytics response
      if (analyticsResponse.status === 'rejected') {
        console.warn('Recommendations analytics endpoint not available yet');
        setAnalytics({
          totalRecommendations: 0,
          acceptedRecommendations: 0,
          implementedRecommendations: 0,
          averageConfidence: 0.7,
          categoryDistribution: {},
          priorityDistribution: {},
          recentRecommendations: []
        });
      } else {
        setAnalytics(analyticsResponse.value.data);
      }

      // Handle recommendations response
      if (recommendationsResponse.status === 'rejected') {
        console.warn('Recommendations generate endpoint not available yet');
        setRecommendations([]);
      } else {
        setRecommendations(recommendationsResponse.value.data || []);
      }
    } catch (err) {
      console.error('Error loading recommendations data:', err);
      setError('Intelligent recommendations features are not available yet. This is a Phase 3 feature that will be available soon.');
      
      // Set default data to prevent crashes
      setAnalytics({
        totalRecommendations: 0,
        acceptedRecommendations: 0,
        implementedRecommendations: 0,
        averageConfidence: 0.7,
        categoryDistribution: {},
        priorityDistribution: {},
        recentRecommendations: []
      });
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const generateNewRecommendations = async () => {
    try {
      setGenerating(true);
      setError(null);

      const data = await authenticatedApiCall<{ data: IntelligentRecommendation[] }>(
        '/api/ai/intelligence/recommendations/generate',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context: {} }) }
      );
      setRecommendations(data.data);
      
      // Reload analytics
      await loadRecommendationsData();
    } catch (err) {
      console.error('Error generating new recommendations:', err);
      setError('Recommendations generation is not available yet. This is a Phase 3 feature that will be available soon.');
    } finally {
      setGenerating(false);
    }
  };

  const updateRecommendationStatus = async (recommendationId: string, status: string) => {
    try {
      const response = await fetch(`/api/ai/intelligence/recommendations/${recommendationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update recommendation status');
      }

      // Update local state
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId ? { ...rec, status } : rec
        )
      );

      // Reload analytics
      await loadRecommendationsData();
    } catch (err) {
      console.error('Error updating recommendation status:', err);
      setError('Recommendation status updates are not available yet. This is a Phase 3 feature that will be available soon.');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'red';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'yellow';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'action': return 'blue';
      case 'suggestion': return 'green';
      case 'optimization': return 'blue';
      case 'prevention': return 'yellow';
      case 'opportunity': return 'green';
      default: return 'gray';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productivity': return 'blue';
      case 'communication': return 'green';
      case 'organization': return 'blue';
      case 'learning': return 'yellow';
      case 'wellness': return 'red';
      case 'efficiency': return 'blue';
      default: return 'gray';
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size={32} />
        <span className="ml-2">Loading intelligent recommendations...</span>
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
        No recommendation analytics available yet.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Intelligent Recommendations</h2>
          <p className="text-gray-600">AI-powered suggestions to optimize your experience</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadRecommendationsData} variant="secondary">
            Refresh
          </Button>
          <Button onClick={generateNewRecommendations} disabled={generating}>
            {generating ? (
              <>
                <Spinner size={16} />
                <span className="ml-2">Generating...</span>
              </>
            ) : (
              'Generate Recommendations'
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Recommendations</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalRecommendations}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Accepted</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics.acceptedRecommendations}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Implemented</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics.implementedRecommendations}</p>
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
      </div>

      {/* Category Filter */}
      <Card>
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </Button>
            {Object.keys(analytics.categoryDistribution).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Category Distribution */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(analytics.categoryDistribution).map(([category, count]) => (
              <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                <Badge color={getCategoryColor(category)} className="mb-2">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Badge>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">recommendations</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Priority Distribution */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations by Priority</h3>
          <div className="space-y-3">
            {Object.entries(analytics.priorityDistribution).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge color={getPriorityColor(priority)}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-700">
                    {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${(count / analytics.totalRecommendations) * 100}%`,
                        backgroundColor: getPriorityColor(priority) === 'red' ? '#ef4444' :
                                      getPriorityColor(priority) === 'yellow' ? '#f97316' : '#3b82f6'
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recommendations List */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedCategory === 'all' ? 'All Recommendations' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Recommendations`}
          </h3>
          {filteredRecommendations.length === 0 ? (
            <p className="text-gray-500">No recommendations available for this category.</p>
          ) : (
            <div className="space-y-4">
              {filteredRecommendations.map((recommendation) => (
                <div key={recommendation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge color={getTypeColor(recommendation.type)}>
                          {recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)}
                        </Badge>
                        <Badge color={getCategoryColor(recommendation.category)}>
                          {recommendation.category.charAt(0).toUpperCase() + recommendation.category.slice(1)}
                        </Badge>
                        <Badge color={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)}
                        </Badge>
                        <Badge color={getImpactColor(recommendation.estimatedImpact)}>
                          {recommendation.estimatedImpact.charAt(0).toUpperCase() + recommendation.estimatedImpact.slice(1)} Impact
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{recommendation.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                      <p className="text-xs text-gray-500 mb-3">{recommendation.reasoning}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge color={getConfidenceColor(recommendation.confidence)}>
                        {(recommendation.confidence * 100).toFixed(1)}% confidence
                      </Badge>
                      <Badge color="blue">
                        {(recommendation.relevance * 100).toFixed(1)}% relevant
                      </Badge>
                    </div>
                  </div>

                  {/* Suggested Actions */}
                  {recommendation.suggestedActions && recommendation.suggestedActions.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Suggested Actions:</h5>
                      <div className="space-y-1">
                        {recommendation.suggestedActions.map((action, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            • {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expected Benefits */}
                  {recommendation.expectedBenefits && recommendation.expectedBenefits.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Expected Benefits:</h5>
                      <div className="space-y-1">
                        {recommendation.expectedBenefits.map((benefit, index) => (
                          <div key={index} className="text-xs text-green-600 bg-green-50 p-2 rounded">
                            ✓ {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Time to implement: {recommendation.timeToImplement.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Status: {recommendation.status}</span>
                    </div>
                    <div className="flex space-x-2">
                      {recommendation.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => updateRecommendationStatus(recommendation.id, 'accepted')}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateRecommendationStatus(recommendation.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {recommendation.status === 'accepted' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateRecommendationStatus(recommendation.id, 'implemented')}
                        >
                          Mark Implemented
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default IntelligentRecommendationsDashboard; 