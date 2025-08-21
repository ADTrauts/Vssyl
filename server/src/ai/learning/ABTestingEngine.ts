import { PrismaClient } from '@prisma/client';
import { CollectiveInsight } from '@prisma/client';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  variants: ABTestVariant[];
  targetAudience: {
    userSegments: string[];
    minUsers: number;
    maxUsers: number;
  };
  metrics: {
    primary: string;
    secondary: string[];
    conversionGoals: string[];
  };
  trafficSplit: {
    control: number; // percentage
    variantA: number;
    variantB: number;
    variantC?: number;
  };
  confidenceLevel: number; // 0.95 for 95% confidence
  minimumSampleSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  type: 'control' | 'variant';
  configuration: any; // Feature configuration for this variant
  isControl: boolean;
}

export interface ABTestResult {
  id: string;
  testId: string;
  variantId: string;
  variantName: string;
  metrics: {
    [key: string]: number;
  };
  sampleSize: number;
  conversionRate: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    marginOfError: number;
  };
  statisticalSignificance: boolean;
  pValue: number;
  effectSize: number;
  recommendations: string[];
  createdAt: Date;
}

export interface ABTestInsight {
  id: string;
  testId: string;
  insightType: 'winner_declared' | 'no_significant_difference' | 'sample_size_insufficient' | 'trend_detected';
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  nextSteps: string[];
  createdAt: Date;
}

export class ABTestingEngine {
  private prisma: PrismaClient;
  private activeTests: Map<string, ABTest> = new Map();
  private testResults: Map<string, ABTestResult[]> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new A/B test
   */
  async createABTest(testData: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ABTest> {
    try {
      const test: ABTest = {
        ...testData,
        id: `abtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate test configuration
      this.validateTestConfiguration(test);

      // Store test in memory for active tests
      if (test.status === 'active') {
        this.activeTests.set(test.id, test);
      }

      console.log(`✅ Created A/B test: ${test.name}`);
      return test;

    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  /**
   * Start an A/B test
   */
  async startABTest(testId: string): Promise<ABTest> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      if (test.status !== 'draft') {
        throw new Error(`Test ${testId} cannot be started (current status: ${test.status})`);
      }

      // Update test status
      test.status = 'active';
      test.startDate = new Date();
      test.updatedAt = new Date();

      // Add to active tests
      this.activeTests.set(testId, test);

      console.log(`🚀 Started A/B test: ${test.name}`);
      return test;

    } catch (error) {
      console.error('Error starting A/B test:', error);
      throw error;
    }
  }

  /**
   * Assign user to test variant
   */
  assignUserToVariant(testId: string, userId: string): ABTestVariant | null {
    try {
      const test = this.activeTests.get(testId);
      if (!test || test.status !== 'active') {
        return null;
      }

      // Check if user is in target audience
      if (!this.isUserInTargetAudience(test, userId)) {
        return null;
      }

      // Use consistent hashing for user assignment
      const userHash = this.hashUserId(userId);
      const variantIndex = userHash % this.getTotalTrafficSplit(test);
      
      let cumulativeSplit = 0;
      for (const variant of test.variants) {
        const variantSplit = this.getVariantSplit(test, variant);
        cumulativeSplit += variantSplit;
        
        if (variantIndex < cumulativeSplit) {
          return variant;
        }
      }

      // Fallback to control
      return test.variants.find(v => v.isControl) || null;

    } catch (error) {
      console.error('Error assigning user to variant:', error);
      return null;
    }
  }

  /**
   * Record test event/metric
   */
  async recordTestEvent(testId: string, variantId: string, userId: string, event: string, value: number = 1): Promise<void> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) return;

      // Store event for analysis
      const eventKey = `${testId}_${variantId}_${event}`;
      if (!this.testResults.has(eventKey)) {
        this.testResults.set(eventKey, []);
      }

      const results = this.testResults.get(eventKey)!;
      results.push({
        id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        testId,
        variantId,
        variantName: test.variants.find(v => v.id === variantId)?.name || 'Unknown',
        metrics: { [event]: value },
        sampleSize: 1,
        conversionRate: 0,
        confidenceInterval: { lower: 0, upper: 0, marginOfError: 0 },
        statisticalSignificance: false,
        pValue: 1,
        effectSize: 0,
        recommendations: [],
        createdAt: new Date()
      });

    } catch (error) {
      console.error('Error recording test event:', error);
    }
  }

  /**
   * Analyze test results and generate insights
   */
  async analyzeTestResults(testId: string): Promise<ABTestInsight[]> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      const insights: ABTestInsight[] = [];
      const results = this.aggregateTestResults(testId);

      if (results.length === 0) {
        return [{
          id: `insight_${Date.now()}`,
          testId,
          insightType: 'sample_size_insufficient',
          description: 'No data available for analysis yet',
          confidence: 0,
          actionable: false,
          recommendations: ['Continue collecting data', 'Monitor test progress'],
          nextSteps: ['Wait for minimum sample size', 'Check data collection'],
          createdAt: new Date()
        }];
      }

      // Check if we have enough data
      const totalSampleSize = results.reduce((sum, r) => sum + r.sampleSize, 0);
      if (totalSampleSize < test.minimumSampleSize) {
        insights.push({
          id: `insight_${Date.now()}_1`,
          testId,
          insightType: 'sample_size_insufficient',
          description: `Insufficient sample size (${totalSampleSize}/${test.minimumSampleSize})`,
          confidence: totalSampleSize / test.minimumSampleSize,
          actionable: false,
          recommendations: ['Continue collecting data', 'Monitor test progress'],
          nextSteps: ['Wait for minimum sample size', 'Check data collection'],
          createdAt: new Date()
        });
        return insights;
      }

      // Perform statistical analysis
      const analysis = this.performStatisticalAnalysis(results, test.confidenceLevel);
      
      if (analysis.winner) {
        insights.push({
          id: `insight_${Date.now()}_2`,
          testId,
          insightType: 'winner_declared',
          description: `Variant ${analysis.winner.variantName} shows significant improvement`,
          confidence: analysis.confidence,
          actionable: true,
          recommendations: [
            `Implement ${analysis.winner.variantName} variant`,
            'Monitor post-implementation metrics',
            'Document learnings for future tests'
          ],
          nextSteps: [
            'Plan implementation rollout',
            'Set up monitoring for new variant',
            'Schedule post-implementation review'
          ],
          createdAt: new Date()
        });
      } else if (analysis.significantDifference) {
        insights.push({
          id: `insight_${Date.now()}_3`,
          testId,
          insightType: 'no_significant_difference',
          description: 'No statistically significant difference between variants',
          confidence: analysis.confidence,
          actionable: true,
          recommendations: [
            'Choose variant based on business criteria',
            'Consider running test longer',
            'Analyze secondary metrics'
          ],
          nextSteps: [
            'Evaluate business impact of each variant',
            'Consider extending test duration',
            'Review secondary metric performance'
          ],
          createdAt: new Date()
        });
      }

      // Check for trends
      if (this.detectTrends(results)) {
        insights.push({
          id: `insight_${Date.now()}_4`,
          testId,
          insightType: 'trend_detected',
          description: 'Trends detected in test data',
          confidence: 0.7,
          actionable: false,
          recommendations: [
            'Continue monitoring trends',
            'Consider extending test duration',
            'Analyze trend drivers'
          ],
          nextSteps: [
            'Monitor trend continuation',
            'Investigate trend causes',
            'Plan trend-based decisions'
          ],
          createdAt: new Date()
        });
      }

      return insights;

    } catch (error) {
      console.error('Error analyzing test results:', error);
      return [];
    }
  }

  /**
   * Generate AI-powered recommendations for test optimization
   */
  async generateAIRecommendations(testId: string): Promise<string[]> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) return [];

      const results = this.aggregateTestResults(testId);
      const insights = await this.analyzeTestResults(testId);

      const recommendations: string[] = [];

      // Based on test performance
      if (results.length > 0) {
        const bestVariant = results.reduce((best, current) => 
          current.conversionRate > best.conversionRate ? current : best
        );

        if (bestVariant.conversionRate > 0.1) { // 10% conversion rate
          recommendations.push(`High-performing variant ${bestVariant.variantName} - consider early implementation`);
        }

        if (bestVariant.sampleSize < test.minimumSampleSize * 0.5) {
          recommendations.push('Increase traffic allocation to underperforming variants for faster results');
        }
      }

      // Based on insights
      insights.forEach(insight => {
        if (insight.insightType === 'winner_declared') {
          recommendations.push('Statistical winner detected - prepare for implementation');
        } else if (insight.insightType === 'no_significant_difference') {
          recommendations.push('Consider business factors beyond statistical significance');
        }
      });

      // Based on test configuration
      if (test.trafficSplit.control > 50) {
        recommendations.push('Control group is too large - consider rebalancing traffic');
      }

      if (test.variants.length > 3) {
        recommendations.push('Multiple variants may slow down statistical significance - consider reducing variants');
      }

      return recommendations;

    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return [];
    }
  }

  /**
   * Get test status and summary
   */
  getTestStatus(testId: string): {
    test: ABTest | null;
    results: ABTestResult[];
    insights: ABTestInsight[];
    recommendations: string[];
    progress: number; // 0-100
  } {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        return {
          test: null,
          results: [],
          insights: [],
          recommendations: [],
          progress: 0
        };
      }

      const results = this.aggregateTestResults(testId);
      const totalSampleSize = results.reduce((sum, r) => sum + r.sampleSize, 0);
      const progress = Math.min(100, (totalSampleSize / test.minimumSampleSize) * 100);

      return {
        test,
        results,
        insights: [], // Would be populated from database in real implementation
        recommendations: [], // Would be populated from AI analysis
        progress
      };

    } catch (error) {
      console.error('Error getting test status:', error);
      return {
        test: null,
        results: [],
        insights: [],
        recommendations: [],
        progress: 0
      };
    }
  }

  /**
   * Stop/pause A/B test
   */
  async stopABTest(testId: string, reason: string = 'Manual stop'): Promise<void> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) return;

      test.status = 'paused';
      test.updatedAt = new Date();

      console.log(`⏸️ Paused A/B test: ${test.name} - Reason: ${reason}`);

    } catch (error) {
      console.error('Error stopping A/B test:', error);
    }
  }

  /**
   * Complete A/B test
   */
  async completeABTest(testId: string): Promise<void> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) return;

      test.status = 'completed';
      test.endDate = new Date();
      test.updatedAt = new Date();

      // Remove from active tests
      this.activeTests.delete(testId);

      console.log(`✅ Completed A/B test: ${test.name}`);

    } catch (error) {
      console.error('Error completing A/B test:', error);
    }
  }

  // Private helper methods
  private validateTestConfiguration(test: ABTest): void {
    if (test.variants.length < 2) {
      throw new Error('A/B test must have at least 2 variants');
    }

    if (!test.variants.some(v => v.isControl)) {
      throw new Error('A/B test must have a control variant');
    }

    const totalSplit = this.getTotalTrafficSplit(test);
    if (Math.abs(totalSplit - 100) > 0.01) {
      throw new Error(`Traffic split must equal 100% (current: ${totalSplit}%)`);
    }

    if (test.minimumSampleSize < 100) {
      throw new Error('Minimum sample size must be at least 100 users');
    }
  }

  private getTotalTrafficSplit(test: ABTest): number {
    return test.trafficSplit.control + test.trafficSplit.variantA + test.trafficSplit.variantB + (test.trafficSplit.variantC || 0);
  }

  private getVariantSplit(test: ABTest, variant: ABTestVariant): number {
    if (variant.isControl) return test.trafficSplit.control;
    if (variant.name.includes('A')) return test.trafficSplit.variantA;
    if (variant.name.includes('B')) return test.trafficSplit.variantB;
    if (variant.name.includes('C')) return test.trafficSplit.variantC || 0;
    return 0;
  }

  private isUserInTargetAudience(test: ABTest, userId: string): boolean {
    // Mock implementation - in real system, this would check user attributes
    return true;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private aggregateTestResults(testId: string): ABTestResult[] {
    const aggregated: ABTestResult[] = [];
    const variantResults = new Map<string, ABTestResult>();

    // Aggregate results by variant
    for (const [eventKey, results] of this.testResults.entries()) {
      if (eventKey.startsWith(testId + '_')) {
        const variantId = eventKey.split('_')[1];
        
        if (!variantResults.has(variantId)) {
          variantResults.set(variantId, {
            id: `aggregated_${variantId}`,
            testId,
            variantId,
            variantName: 'Unknown',
            metrics: {},
            sampleSize: 0,
            conversionRate: 0,
            confidenceInterval: { lower: 0, upper: 0, marginOfError: 0 },
            statisticalSignificance: false,
            pValue: 1,
            effectSize: 0,
            recommendations: [],
            createdAt: new Date()
          });
        }

        const aggregatedResult = variantResults.get(variantId)!;
        aggregatedResult.sampleSize += results.length;
        
        // Aggregate metrics
        results.forEach(result => {
          Object.entries(result.metrics).forEach(([metric, value]) => {
            if (!aggregatedResult.metrics[metric]) {
              aggregatedResult.metrics[metric] = 0;
            }
            aggregatedResult.metrics[metric] += value;
          });
        });
      }
    }

    // Calculate conversion rates
    variantResults.forEach(result => {
      if (result.sampleSize > 0) {
        result.conversionRate = result.metrics['conversion'] / result.sampleSize;
      }
    });

    return Array.from(variantResults.values());
  }

  private performStatisticalAnalysis(results: ABTestResult[], confidenceLevel: number): {
    winner: ABTestResult | null;
    significantDifference: boolean;
    confidence: number;
  } {
    if (results.length < 2) {
      return { winner: null, significantDifference: false, confidence: 0 };
    }

    // Mock statistical analysis - in real implementation, this would use proper statistical tests
    const control = results.find(r => r.variantName.includes('Control'));
    const variants = results.filter(r => !r.variantName.includes('Control'));

    if (!control || variants.length === 0) {
      return { winner: null, significantDifference: false, confidence: 0 };
    }

    let winner: ABTestResult | null = null;
    let maxImprovement = 0;

    variants.forEach(variant => {
      const improvement = variant.conversionRate - control.conversionRate;
      if (improvement > maxImprovement && improvement > 0.05) { // 5% minimum improvement
        maxImprovement = improvement;
        winner = variant;
      }
    });

    const confidence = Math.min(0.95, 0.8 + (maxImprovement * 2)); // Mock confidence calculation

    return {
      winner,
      significantDifference: winner !== null,
      confidence
    };
  }

  private detectTrends(results: ABTestResult[]): boolean {
    // Mock trend detection - in real implementation, this would analyze time series data
    return results.some(r => r.sampleSize > 1000); // Assume trends if large sample size
  }
}
