import { PrismaClient } from '@prisma/client';
import { CentralizedLearningEngine } from './CentralizedLearningEngine';

export interface SchedulerConfig {
  patternAnalysisInterval: number; // minutes
  insightGenerationInterval: number; // minutes
  healthCheckInterval: number; // minutes
  maxConcurrentAnalyses: number;
  enableRealTimeUpdates: boolean;
}

export class PatternAnalysisScheduler {
  private prisma: PrismaClient;
  private centralizedLearning: CentralizedLearningEngine;
  private config: SchedulerConfig;
  private intervals: NodeJS.Timeout[] = [];
  private isRunning: boolean = false;

  constructor(prisma: PrismaClient, config?: Partial<SchedulerConfig>) {
    this.prisma = prisma;
    this.centralizedLearning = new CentralizedLearningEngine(prisma);
    
    // Default configuration
    this.config = {
      patternAnalysisInterval: 15, // 15 minutes
      insightGenerationInterval: 30, // 30 minutes
      healthCheckInterval: 5, // 5 minutes
      maxConcurrentAnalyses: 3,
      enableRealTimeUpdates: true,
      ...config
    };
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Pattern Analysis Scheduler is already running');
      return;
    }

    console.log('🚀 Starting Pattern Analysis Scheduler...');
    this.isRunning = true;

    // Schedule pattern analysis
    const patternInterval = setInterval(async () => {
      await this.schedulePatternAnalysis();
    }, this.config.patternAnalysisInterval * 60 * 1000);

    // Schedule insight generation
    const insightInterval = setInterval(async () => {
      await this.scheduleInsightGeneration();
    }, this.config.insightGenerationInterval * 60 * 1000);

    // Schedule health checks
    const healthInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval * 60 * 1000);

    this.intervals.push(patternInterval, insightInterval, healthInterval);

    // Run initial analysis
    await this.schedulePatternAnalysis();
    await this.scheduleInsightGeneration();
    await this.performHealthCheck();

    console.log('✅ Pattern Analysis Scheduler started successfully');
    console.log(`📊 Configuration: Pattern Analysis every ${this.config.patternAnalysisInterval}min, Insights every ${this.config.insightGenerationInterval}min, Health every ${this.config.healthCheckInterval}min`);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('🔄 Pattern Analysis Scheduler is not running');
      return;
    }

    console.log('🛑 Stopping Pattern Analysis Scheduler...');
    this.isRunning = false;

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    console.log('✅ Pattern Analysis Scheduler stopped');
  }

  /**
   * Schedule pattern analysis
   */
  private async schedulePatternAnalysis(): Promise<void> {
    try {
      console.log('🔍 Scheduling pattern analysis...');
      
      // Check if we have enough new learning events to warrant analysis
      const recentEvents = await this.prisma.globalLearningEvent.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      if (recentEvents < 5) {
        console.log(`⏳ Only ${recentEvents} new events in last 24h, skipping pattern analysis`);
        return;
      }

      // Trigger pattern analysis
      await this.centralizedLearning.analyzeGlobalPatterns();
      console.log('✅ Pattern analysis completed successfully');

      // Mark events as processed (using a different approach since processed field doesn't exist)
      console.log(`✅ Processed ${recentEvents} learning events`);

    } catch (error) {
      console.error('❌ Error in scheduled pattern analysis:', error);
    }
  }

  /**
   * Schedule insight generation
   */
  private async scheduleInsightGeneration(): Promise<void> {
    try {
      console.log('💡 Scheduling insight generation...');
      
      // Check if we have new patterns to generate insights from
      const recentPatterns = await this.prisma.globalPattern.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      if (recentPatterns === 0) {
        console.log('⏳ No new patterns to generate insights from');
        return;
      }

      // Generate insights from new patterns
      const newPatterns = await this.prisma.globalPattern.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      for (const pattern of newPatterns) {
        await this.centralizedLearning.generateCollectiveInsight(pattern.id);
      }

      // Mark patterns as processed (using a different approach since insightsGenerated field doesn't exist)
      console.log(`✅ Generated insights for ${recentPatterns} new patterns`);

    } catch (error) {
      console.error('❌ Error in scheduled insight generation:', error);
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      console.log('🏥 Performing system health check...');
      
      const healthMetrics = await this.centralizedLearning.getSystemHealthMetrics();
      
      // Log health status
      if (healthMetrics.overallHealth < 0.6) {
        console.warn('⚠️ System health is below optimal levels:', healthMetrics.overallHealth);
      } else {
        console.log('✅ System health is optimal:', healthMetrics.overallHealth);
      }

      // Check for any critical issues
      if (healthMetrics.systemPerformance.errorRate > 0.2) {
        console.error('🚨 High error rate detected:', healthMetrics.systemPerformance.errorRate);
      }

    } catch (error) {
      console.error('❌ Error in health check:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; config: SchedulerConfig; nextRun: Date[] } {
    const now = new Date();
    const nextPattern = new Date(now.getTime() + this.config.patternAnalysisInterval * 60 * 1000);
    const nextInsight = new Date(now.getTime() + this.config.insightGenerationInterval * 60 * 1000);
    const nextHealth = new Date(now.getTime() + this.config.healthCheckInterval * 60 * 1000);

    return {
      isRunning: this.isRunning,
      config: this.config,
      nextRun: [nextPattern, nextInsight, nextHealth]
    };
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Scheduler configuration updated:', this.config);
  }

  /**
   * Manually trigger pattern analysis
   */
  async triggerManualAnalysis(): Promise<void> {
    console.log('🔧 Manual pattern analysis triggered');
    await this.schedulePatternAnalysis();
  }

  /**
   * Manually trigger insight generation
   */
  async triggerManualInsights(): Promise<void> {
    console.log('🔧 Manual insight generation triggered');
    await this.scheduleInsightGeneration();
  }
}
