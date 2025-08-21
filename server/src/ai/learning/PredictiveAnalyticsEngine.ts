import { PrismaClient } from '@prisma/client';
import { GlobalPattern, CollectiveInsight, GlobalLearningEvent } from '@prisma/client';

export interface TrendForecast {
  id: string;
  type: 'user_behavior' | 'system_performance' | 'feature_adoption' | 'workflow_optimization';
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: '1_day' | '1_week' | '1_month' | '3_months';
  trend: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
  factors: string[];
  recommendations: string[];
  createdAt: Date;
  expiresAt: Date;
}

export interface ImpactAnalysis {
  id: string;
  insightId: string;
  metric: string;
  baselineValue: number;
  currentValue: number;
  improvement: number; // percentage
  roi: number; // return on investment
  confidence: number;
  timeframe: string;
  affectedUsers: number;
  estimatedSavings: number;
  implementationCost: number;
  netBenefit: number;
}

export interface UserBehaviorPrediction {
  userId: string;
  behavior: string;
  probability: number;
  nextOccurrence: Date;
  confidence: number;
  influencingFactors: string[];
  recommendations: string[];
}

export class PredictiveAnalyticsEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate trend forecasts based on historical data
   */
  async generateTrendForecasts(): Promise<TrendForecast[]> {
    try {
      console.log('🔮 Generating trend forecasts...');
      const forecasts: TrendForecast[] = [];

      // Analyze user engagement trends
      const engagementForecast = await this.forecastUserEngagement();
      if (engagementForecast) forecasts.push(engagementForecast);

      // Analyze system performance trends
      const performanceForecast = await this.forecastSystemPerformance();
      if (performanceForecast) forecasts.push(performanceForecast);

      // Analyze feature adoption trends
      const adoptionForecast = await this.forecastFeatureAdoption();
      if (adoptionForecast) forecasts.push(adoptionForecast);

      // Analyze workflow optimization trends
      const workflowForecast = await this.forecastWorkflowOptimization();
      if (workflowForecast) forecasts.push(workflowForecast);

      console.log(`✅ Generated ${forecasts.length} trend forecasts`);
      return forecasts;

    } catch (error) {
      console.error('❌ Error generating trend forecasts:', error);
      return [];
    }
  }

  /**
   * Forecast user engagement trends
   */
  private async forecastUserEngagement(): Promise<TrendForecast | null> {
    try {
      // Get recent learning events to analyze engagement patterns
      const recentEvents = await this.prisma.globalLearningEvent.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (recentEvents.length < 10) return null;

      // Calculate daily engagement rates
      const dailyEngagement = this.calculateDailyEngagement(recentEvents);
      
      // Simple linear regression for trend prediction
      const trend = this.calculateLinearTrend(dailyEngagement);
      
      // Predict next week's engagement
      const currentEngagement = dailyEngagement[dailyEngagement.length - 1];
      const predictedEngagement = currentEngagement + (trend.slope * 7);

      return {
        id: `forecast_engagement_${Date.now()}`,
        type: 'user_behavior',
        metric: 'daily_engagement_rate',
        currentValue: currentEngagement,
        predictedValue: Math.max(0, predictedEngagement),
        confidence: Math.min(0.95, Math.max(0.5, 1 - Math.abs(trend.rSquared))),
        timeframe: '1_week',
        trend: trend.slope > 0.1 ? 'increasing' : trend.slope < -0.1 ? 'decreasing' : 'stable',
        factors: ['user_activity_patterns', 'feature_usage', 'time_of_day'],
        recommendations: this.generateEngagementRecommendations(trend),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
      };

    } catch (error) {
      console.error('Error forecasting user engagement:', error);
      return null;
    }
  }

  /**
   * Forecast system performance trends
   */
  private async forecastSystemPerformance(): Promise<TrendForecast | null> {
    try {
      // Analyze response times and error rates from learning events
      const recentEvents = await this.prisma.globalLearningEvent.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (recentEvents.length < 5) return null;

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(recentEvents);
      
      // Predict performance degradation or improvement
      const currentPerformance = performanceMetrics[performanceMetrics.length - 1];
      const avgPerformance = performanceMetrics.reduce((a, b) => a + b, 0) / performanceMetrics.length;
      
      const trend = currentPerformance > avgPerformance ? 'improving' : 'degrading';
      const predictedPerformance = currentPerformance + (currentPerformance - avgPerformance) * 0.1;

      return {
        id: `forecast_performance_${Date.now()}`,
        type: 'system_performance',
        metric: 'system_efficiency',
        currentValue: currentPerformance,
        predictedValue: Math.max(0, Math.min(1, predictedPerformance)),
        confidence: 0.8,
        timeframe: '1_day',
        trend: trend === 'improving' ? 'increasing' : 'decreasing',
        factors: ['system_load', 'user_activity', 'resource_utilization'],
        recommendations: this.generatePerformanceRecommendations(trend),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
      };

    } catch (error) {
      console.error('Error forecasting system performance:', error);
      return null;
    }
  }

  /**
   * Forecast feature adoption trends
   */
  private async forecastFeatureAdoption(): Promise<TrendForecast | null> {
    try {
      // Analyze which features are being used in learning events
      const recentEvents = await this.prisma.globalLearningEvent.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (recentEvents.length < 5) return null;

      // Calculate feature usage patterns
      const featureUsage = this.calculateFeatureUsage(recentEvents);
      
      // Predict adoption growth
      const currentAdoption = featureUsage.current;
      const growthRate = featureUsage.growthRate;
      const predictedAdoption = currentAdoption * (1 + growthRate);

      return {
        id: `forecast_adoption_${Date.now()}`,
        type: 'feature_adoption',
        metric: 'feature_usage_rate',
        currentValue: currentAdoption,
        predictedValue: Math.min(1, predictedAdoption),
        confidence: 0.85,
        timeframe: '1_month',
        trend: growthRate > 0.05 ? 'increasing' : growthRate < -0.05 ? 'decreasing' : 'stable',
        factors: ['user_feedback', 'feature_complexity', 'integration_ease'],
        recommendations: this.generateAdoptionRecommendations(growthRate),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month
      };

    } catch (error) {
      console.error('Error forecasting feature adoption:', error);
      return null;
    }
  }

  /**
   * Forecast workflow optimization trends
   */
  private async forecastWorkflowOptimization(): Promise<TrendForecast | null> {
    try {
      // Analyze workflow patterns from insights
      const recentInsights = await this.prisma.collectiveInsight.findMany({
        where: {
          type: 'optimization',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (recentInsights.length < 3) return null;

      // Calculate optimization potential
      const optimizationMetrics = this.calculateOptimizationMetrics(recentInsights);
      
      const currentOptimization = optimizationMetrics.current;
      const optimizationTrend = optimizationMetrics.trend;
      const predictedOptimization = currentOptimization + optimizationTrend;

      return {
        id: `forecast_optimization_${Date.now()}`,
        type: 'workflow_optimization',
        metric: 'workflow_efficiency',
        currentValue: currentOptimization,
        predictedValue: Math.max(0, Math.min(1, predictedOptimization)),
        confidence: 0.9,
        timeframe: '3_months',
        trend: optimizationTrend > 0.02 ? 'increasing' : optimizationTrend < -0.02 ? 'decreasing' : 'stable',
        factors: ['process_automation', 'user_training', 'system_integration'],
        recommendations: this.generateOptimizationRecommendations(optimizationTrend),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months
      };

    } catch (error) {
      console.error('Error forecasting workflow optimization:', error);
      return null;
    }
  }

  /**
   * Calculate impact analysis for insights
   */
  async calculateImpactAnalysis(insightId: string): Promise<ImpactAnalysis | null> {
    try {
      const insight = await this.prisma.collectiveInsight.findUnique({
        where: { id: insightId }
      });

      if (!insight) return null;

      // Get baseline data (before insight implementation)
      const baselineData = await this.getBaselineData(insight);
      
      // Get current data (after insight implementation)
      const currentData = await this.getCurrentData(insight);
      
      // Calculate improvements
      const improvement = ((currentData.value - baselineData.value) / baselineData.value) * 100;
      const roi = (improvement * currentData.affectedUsers) / baselineData.implementationCost;
      const netBenefit = (improvement * currentData.affectedUsers) - baselineData.implementationCost;

      return {
        id: `impact_${insightId}_${Date.now()}`,
        insightId,
        metric: insight.title,
        baselineValue: baselineData.value,
        currentValue: currentData.value,
        improvement,
        roi,
        confidence: insight.confidence,
        timeframe: '3_months',
        affectedUsers: currentData.affectedUsers,
        estimatedSavings: improvement * currentData.affectedUsers * 0.1, // $0.10 per user per improvement
        implementationCost: baselineData.implementationCost,
        netBenefit
      };

    } catch (error) {
      console.error('Error calculating impact analysis:', error);
      return null;
    }
  }

  /**
   * Predict user behavior patterns
   */
  async predictUserBehavior(userId: string): Promise<UserBehaviorPrediction[]> {
    try {
      // Get user's learning history
      const userEvents = await this.prisma.globalLearningEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      if (userEvents.length < 5) return [];

      const predictions: UserBehaviorPrediction[] = [];

      // Predict next activity time
      const activityPrediction = this.predictNextActivity(userEvents);
      if (activityPrediction) predictions.push(activityPrediction);

      // Predict preferred features
      const featurePrediction = this.predictPreferredFeatures(userEvents);
      if (featurePrediction) predictions.push(featurePrediction);

      // Predict workflow preferences
      const workflowPrediction = this.predictWorkflowPreferences(userEvents);
      if (workflowPrediction) predictions.push(workflowPrediction);

      return predictions;

    } catch (error) {
      console.error('Error predicting user behavior:', error);
      return [];
    }
  }

  // Helper methods for calculations
  private calculateDailyEngagement(events: GlobalLearningEvent[]): number[] {
    const dailyCounts = new Map<string, number>();
    
    events.forEach(event => {
      const date = event.createdAt.toISOString().split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    return Array.from(dailyCounts.values());
  }

  private calculateLinearTrend(values: number[]): { slope: number; rSquared: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + (b * values[i]), 0);
    const sumXX = x.reduce((a, b) => a + (b * b), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = values.reduce((a, b, i) => a + Math.pow(b - (slope * i + intercept), 2), 0);
    const ssTot = values.reduce((a, b) => a + Math.pow(b - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    return { slope, rSquared };
  }

  private calculatePerformanceMetrics(events: GlobalLearningEvent[]): number[] {
    // Mock performance calculation - in real implementation, this would analyze actual performance data
    return events.map((_, i) => 0.7 + (Math.random() * 0.3));
  }

  private calculateFeatureUsage(events: GlobalLearningEvent[]): { current: number; growthRate: number } {
    // Mock feature usage calculation
    return {
      current: 0.6 + (Math.random() * 0.4),
      growthRate: (Math.random() - 0.5) * 0.2
    };
  }

  private calculateOptimizationMetrics(insights: CollectiveInsight[]): { current: number; trend: number } {
    // Mock optimization metrics
    return {
      current: 0.75 + (Math.random() * 0.25),
      trend: (Math.random() - 0.5) * 0.1
    };
  }

  private async getBaselineData(insight: CollectiveInsight): Promise<{ value: number; implementationCost: number }> {
    // Mock baseline data - in real implementation, this would query historical data
    return {
      value: 0.5 + (Math.random() * 0.3),
      implementationCost: 1000 + (Math.random() * 5000)
    };
  }

  private async getCurrentData(insight: CollectiveInsight): Promise<{ value: number; affectedUsers: number }> {
    // Mock current data
    return {
      value: 0.7 + (Math.random() * 0.3),
      affectedUsers: 50 + Math.floor(Math.random() * 200)
    };
  }

  private predictNextActivity(events: GlobalLearningEvent[]): UserBehaviorPrediction | null {
    // Mock prediction - in real implementation, this would use ML models
    return {
      userId: events[0].userId,
      behavior: 'next_activity_time',
      probability: 0.8,
      nextOccurrence: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      confidence: 0.75,
      influencingFactors: ['time_of_day', 'day_of_week', 'recent_activity'],
      recommendations: ['Schedule important tasks during peak hours', 'Set reminders for optimal times']
    };
  }

  private predictPreferredFeatures(events: GlobalLearningEvent[]): UserBehaviorPrediction | null {
    return {
      userId: events[0].userId,
      behavior: 'preferred_features',
      probability: 0.9,
      nextOccurrence: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      confidence: 0.85,
      influencingFactors: ['feature_usage_history', 'user_feedback', 'workflow_patterns'],
      recommendations: ['Enable feature shortcuts', 'Customize default settings', 'Provide feature tutorials']
    };
  }

  private predictWorkflowPreferences(events: GlobalLearningEvent[]): UserBehaviorPrediction | null {
    return {
      userId: events[0].userId,
      behavior: 'workflow_preferences',
      probability: 0.7,
      nextOccurrence: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      confidence: 0.6,
      influencingFactors: ['workflow_efficiency', 'user_skill_level', 'task_complexity'],
      recommendations: ['Optimize workflow steps', 'Add automation options', 'Provide workflow templates']
    };
  }

  // Recommendation generators
  private generateEngagementRecommendations(trend: { slope: number; rSquared: number }): string[] {
    if (trend.slope > 0.1) {
      return ['Maintain current engagement strategies', 'Scale successful features', 'Reward active users'];
    } else if (trend.slope < -0.1) {
      return ['Investigate engagement drop causes', 'Implement re-engagement campaigns', 'Simplify user workflows'];
    } else {
      return ['Test new engagement strategies', 'Analyze user feedback', 'Optimize feature discoverability'];
    }
  }

  private generatePerformanceRecommendations(trend: string): string[] {
    if (trend === 'improving') {
      return ['Monitor performance gains', 'Document successful optimizations', 'Plan for scale'];
    } else {
      return ['Investigate performance issues', 'Optimize resource allocation', 'Implement performance monitoring'];
    }
  }

  private generateAdoptionRecommendations(growthRate: number): string[] {
    if (growthRate > 0.05) {
      return ['Accelerate feature development', 'Expand user training', 'Celebrate adoption success'];
    } else if (growthRate < -0.05) {
      return ['Analyze adoption barriers', 'Improve feature usability', 'Provide better onboarding'];
    } else {
      return ['Test feature variations', 'Gather user feedback', 'Optimize feature placement'];
    }
  }

  private generateOptimizationRecommendations(trend: number): string[] {
    if (trend > 0.02) {
      return ['Continue optimization efforts', 'Document best practices', 'Train users on new workflows'];
    } else if (trend < -0.02) {
      return ['Review optimization strategies', 'Identify workflow bottlenecks', 'Implement user training'];
    } else {
      return ['Explore new optimization opportunities', 'Benchmark against industry standards', 'Gather optimization ideas'];
    }
  }
}
