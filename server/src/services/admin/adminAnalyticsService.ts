import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type {
  AdminABTestPayload,
  AdminABTestResultsPayload,
  AdminCompetitiveAnalysisPayload,
  AdminCustomReportPayload,
  AdminJsonObject,
  AdminUserSegmentPayload,
} from './adminServiceContracts';
import { logAnalyticsAudit } from './adminAuditService';
import { ADMIN_AUDIT_ACTIONS, ADMIN_AUDIT_RESOURCE_TYPES } from './adminAuditTaxonomy';

export interface AnalyticsFilters {
  dateRange?: string;
  userType?: string;
  metric?: string;
  businessId?: string;
  moduleId?: string;
}

export interface BusinessIntelligenceFilters {
  dateRange?: string;
  businessId?: string;
  moduleId?: string;
  userType?: string;
  metric?: string;
}

export interface BusinessIntelligenceData {
  userGrowth: unknown;
  revenueMetrics: unknown;
  engagementMetrics: unknown;
  predictiveInsights: unknown;
  abTests: unknown;
  userSegments: unknown;
  competitiveAnalysis: unknown;
}

interface AnalyticsData {
  userGrowth: { total: number; newThisMonth: number; growthRate: number; monthlyTrend: unknown[] };
  revenue: { total: number; thisMonth: number; growthRate: number; monthlyTrend: unknown[] };
  engagement: { activeUsers: number; avgSessionDuration: number | null; retentionRate: number | null; sessionMetricsStatus: string; dailyActiveUsers: unknown[] };
  system: { status: string; uptime: number | null; avgResponseTime: number | null; errorRate: number | null; performanceTrend: unknown[]; performanceTrendStatus: string };
}

interface ABTestData {
  name: string;
  description: string;
  variantA: Record<string, unknown>;
  variantB: Record<string, unknown>;
  trafficSplit: number;
  metrics: string[];
}

interface UserSegmentData {
  name: string;
  description: string;
  criteria: Record<string, unknown>;
  filters: Record<string, unknown>;
}

interface ReportConfig {
  name: string;
  type: string;
  parameters: Record<string, unknown>;
  format: string;
  filters: Record<string, unknown>;
}

export async function getDashboardSystemHealthSummary(): Promise<{ score: number | null; status: 'available' | 'unavailable' }> {
  try {
    const { SystemMonitoringService } = await import('../systemMonitoringService.js');
    const health = await SystemMonitoringService.getSystemHealth();
    if (typeof health.cpu === 'number' && typeof health.memory === 'number') {
      const pressure = (health.cpu + health.memory) / 2;
      return { score: Math.max(0, Math.min(100, Math.round(100 - pressure))), status: 'available' };
    }
    return { score: null, status: 'unavailable' };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to resolve dashboard system health', {
      operation: 'admin_resolve_dashboard_system_health',
      error: { message: err.message, stack: err.stack },
    });
    return { score: null, status: 'unavailable' };
  }
}

export async function getDashboardStats() {
    const [
      totalUsers,
      totalBusinesses,
      moduleRevenue,
      systemHealthSummary,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.moduleSubscription.aggregate({
        _sum: { amount: true },
        where: { status: 'active' }
      }),
      getDashboardSystemHealthSummary(),
    ]);

    return {
      totalUsers,
      activeUsers: totalUsers, // Since we don't have status field, assume all are active
      totalBusinesses,
      monthlyRevenue: moduleRevenue._sum.amount || 0,
      systemHealth: systemHealthSummary.score,
      systemHealthStatus: systemHealthSummary.status,
    };
  }

export async function getSystemMetrics(timeRange: string = '24h') {
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    
    const metrics = await prisma.systemMetrics.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - hours * 60 * 60 * 1000)
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    return metrics;
  }

export async function getUserAnalytics(timeRange: string = '30d') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    const userStats = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: true,
      where: {
        createdAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      }
    });

    return userStats;
  }

  // ============================================================================
  // ANALYTICS METHODS
  // ============================================================================

export async function getAnalytics(filters: AnalyticsFilters) {
    try {
      const dateRange = filters.dateRange || '30d';
      const userType = filters.userType || 'all';
      const metric = filters.metric || 'all';

      // Get user growth data
      const totalUsers = await prisma.user.count();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const newThisMonth = await prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonth
          }
        }
      });

      // Generate monthly user trend (last 6 months)
      const monthlyUserTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        const monthUsers = await prisma.user.count({
          where: {
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            }
          }
        });
        
        monthlyUserTrend.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          count: monthUsers
        });
      }

      // Get revenue data
      const totalRevenue = await prisma.moduleSubscription.aggregate({
        _sum: {
          amount: true
        }
      });

      const thisMonthRevenue = await prisma.moduleSubscription.aggregate({
        _sum: {
          amount: true
        },
        where: {
          createdAt: {
            gte: lastMonth
          }
        }
      });

      // Generate monthly revenue trend (last 6 months)
      const monthlyRevenueTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        const monthRevenue = await prisma.moduleSubscription.aggregate({
          _sum: {
            amount: true
          },
          where: {
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            }
          }
        });
        
        monthlyRevenueTrend.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          amount: monthRevenue._sum.amount || 0
        });
      }

      // Get engagement data - use createdAt as proxy for activity since no lastLoginAt
      const activeUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      // Generate daily active users trend (last 14 days)
      const dailyActiveUsersTrend = [];
      for (let i = 13; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const dayUsers = await prisma.user.count({
          where: {
            createdAt: {
              gte: dayStart,
              lt: dayEnd
            }
          }
        });
        
        dailyActiveUsersTrend.push({
          date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: dayUsers
        });
      }

      // Get system metrics - use the SystemMetrics structure
      const systemMetrics = await prisma.systemMetrics.findMany({
        where: {
          metricType: 'system_performance'
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 1
      });

      const latestMetrics = systemMetrics[0];

      const historicalMetrics = await prisma.systemMetrics.findMany({
        where: {
          metricType: 'system_performance',
          metricName: 'response_time',
          timestamp: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { timestamp: 'asc' },
        take: 14,
      });

      const performanceTrend = historicalMetrics.map((metric) => ({
        date: metric.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        responseTime: metric.metricValue,
      }));

      const systemMetricsAvailable = Boolean(latestMetrics);
      const performanceTrendAvailable = performanceTrend.length > 0;

      // Calculate growth rates
      const previousMonthUsers = monthlyUserTrend.length >= 2 
        ? monthlyUserTrend[monthlyUserTrend.length - 2].count 
        : 0;
      const userGrowthRate = previousMonthUsers > 0 
        ? Math.round(((newThisMonth - previousMonthUsers) / previousMonthUsers) * 100)
        : 0;

      const previousMonthRevenue = monthlyRevenueTrend.length >= 2
        ? monthlyRevenueTrend[monthlyRevenueTrend.length - 2].amount
        : 0;
      const revenueGrowthRate = previousMonthRevenue > 0
        ? Math.round(((thisMonthRevenue._sum.amount || 0) - previousMonthRevenue) / previousMonthRevenue * 100)
        : 0;

      return {
        userGrowth: {
          total: totalUsers,
          newThisMonth: newThisMonth,
          growthRate: userGrowthRate,
          monthlyTrend: monthlyUserTrend
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          thisMonth: thisMonthRevenue._sum.amount || 0,
          growthRate: revenueGrowthRate,
          monthlyTrend: monthlyRevenueTrend
        },
        engagement: {
          activeUsers: activeUsers,
          avgSessionDuration: null,
          retentionRate: null,
          sessionMetricsStatus: 'unavailable' as const,
          dailyActiveUsers: dailyActiveUsersTrend
        },
        system: {
          status: systemMetricsAvailable ? ('available' as const) : ('unavailable' as const),
          uptime: latestMetrics?.metricValue ?? null,
          avgResponseTime: null,
          errorRate: null,
          performanceTrend,
          performanceTrendStatus: performanceTrendAvailable ? ('available' as const) : ('unavailable' as const),
        }
      };
    } catch (error) {
      await logger.error('Failed to get analytics', {
        operation: 'admin_get_analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw error;
    }
  }

export async function exportAnalytics(filters: AnalyticsFilters, format: string) {
    try {
      const analyticsData = await getAnalytics(filters);
      
      if (format === 'csv') {
        // Convert to CSV format
        const csvData = convertToCSV(analyticsData);
        return csvData;
      } else {
        // Return JSON format
        return JSON.stringify(analyticsData, null, 2);
      }
    } catch (error) {
      await logger.error('Failed to export analytics', {
        operation: 'admin_export_analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw error;
    }
  }

export async function getRealTimeMetrics() {
    try {
      // Get real-time system metrics
      const currentMetrics = await prisma.systemMetrics.findMany({
        where: {
          metricType: 'system_performance'
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 1
      });

      // Get recent user activity - use recent users as proxy
      const recentUsers = await prisma.user.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });

      return {
        system: currentMetrics[0] || {
          metricType: 'system_performance',
          metricName: 'uptime',
          metricValue: 99.9,
          timestamp: new Date()
        },
        recentActivity: recentUsers.map(user => ({
          type: 'user_registration',
          user: user.name || user.email,
          timestamp: user.createdAt
        }))
      };
    } catch (error) {
      await logger.error('Failed to get real-time metrics', {
        operation: 'admin_get_realtime_metrics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw error;
    }
  }



function convertToCSV(data: AnalyticsData): string {
    // Simple CSV conversion - in a real implementation, this would be more sophisticated
    const csvRows = [];
    
    // Add headers
    csvRows.push('Metric,Value,Change');
    
    // Add data rows
    csvRows.push(`Total Users,${data.userGrowth.total},${data.userGrowth.growthRate}%`);
    csvRows.push(`New Users This Month,${data.userGrowth.newThisMonth},`);
    csvRows.push(`Total Revenue,$${data.revenue.total},${data.revenue.growthRate}%`);
    csvRows.push(`Monthly Revenue,$${data.revenue.thisMonth},`);
    csvRows.push(`Active Users,${data.engagement.activeUsers},`);
    csvRows.push(`System Uptime,${data.system.uptime}%,`);
    csvRows.push(`Avg Response Time,${data.system.avgResponseTime}ms,`);
    csvRows.push(`Error Rate,${data.system.errorRate}%,`);
    
    return csvRows.join('\n');
  }

  // ============================================================================

  // Business Intelligence Methods
export async function getBusinessIntelligence(filters: BusinessIntelligenceFilters = {}): Promise<BusinessIntelligenceData> {
    try {
      // Get date range
      const dateRange = getDateRangeFromFilter(filters.dateRange || '30d');
      
      // Get user growth metrics
      const userGrowth = await getUserGrowthMetrics(dateRange);
      
      // Get revenue metrics
      const revenueMetrics = await getRevenueMetrics(dateRange);
      
      // Get engagement metrics
      const engagementMetrics = await getEngagementMetrics(dateRange);
      
      // Get predictive insights (AI-powered)
      const predictiveInsights = await getPredictiveInsights();
      
      // Get A/B tests
      const abTests = await getABTests();
      
      // Get user segments
      const userSegments = await getUserSegments();
      
      // Get competitive analysis
      const competitiveAnalysis = await getCompetitiveAnalysis();

      return {
        userGrowth,
        revenueMetrics,
        engagementMetrics,
        predictiveInsights,
        abTests,
        userSegments,
        competitiveAnalysis
      };
    } catch (error) {
      await logger.error('Failed to get business intelligence data', {
        operation: 'admin_get_business_intelligence',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to get business intelligence data');
    }
  }

export async function exportBusinessIntelligence(filters: BusinessIntelligenceFilters = {}): Promise<string> {
    try {
      const data = await getBusinessIntelligence(filters);
      
      // Generate CSV content
      const csvHeaders = [
        'Metric',
        'Value',
        'Change',
        'Trend'
      ];

      const csvRows = [
        ['User Growth', (data.userGrowth as any)?.totalUsers || 0, (data.userGrowth as any)?.growthRate || 0, (data.userGrowth as any)?.trend || 'stable'],
        ['Revenue', (data.revenueMetrics as any)?.totalRevenue || 0, (data.revenueMetrics as any)?.growthRate || 0, (data.revenueMetrics as any)?.trend || 'stable'],
        ['Engagement', (data.engagementMetrics as any)?.activeUsers || 0, (data.engagementMetrics as any)?.changeRate || 0, (data.engagementMetrics as any)?.trend || 'stable']
      ];

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      await logger.error('Failed to export business intelligence data', {
        operation: 'admin_export_business_intelligence',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to export business intelligence data');
    }
  }

export async function createABTest(testData: ABTestData, adminId?: string): Promise<AdminABTestPayload> {
    try {
      // In a real implementation, this would create an A/B test in the database
      const test = {
        id: `test_${Date.now()}`,
        ...testData,
        status: 'running',
        createdAt: new Date(),
        createdBy: adminId
      };

      // Log the action
      await logAnalyticsAudit({
        adminId: adminId || 'system',
        action: ADMIN_AUDIT_ACTIONS.AB_TEST_CREATE,
        resourceId: test.id,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.AB_TEST,
        details: { testId: test.id, testName: testData.name },
      });

      return test;
    } catch (error) {
      await logger.error('Failed to create A/B test', {
        operation: 'admin_create_ab_test',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to create A/B test');
    }
  }

export async function getABTestResults(testId: string): Promise<AdminABTestResultsPayload> {
    try {
      // Mock A/B test results
      return {
        testId,
        status: 'running',
        results: {
          variantA: {
            users: 5000,
            conversionRate: 3.2,
            revenue: 16000
          },
          variantB: {
            users: 5000,
            conversionRate: 4.1,
            revenue: 20500
          },
          confidence: 95,
          winner: 'B'
        }
      };
    } catch (error) {
      await logger.error('Failed to get A/B test results', {
        operation: 'admin_get_ab_test_results',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to get A/B test results');
    }
  }

export async function updateABTest(testId: string, updates: Partial<ABTestData>, adminId?: string): Promise<AdminABTestPayload> {
    try {
      // In a real implementation, this would update the A/B test in the database
      const updatedTest = {
        id: testId,
        ...updates,
        updatedAt: new Date(),
        updatedBy: adminId
      };

      // Log the action
      await logAnalyticsAudit({
        adminId: adminId || 'system',
        action: ADMIN_AUDIT_ACTIONS.AB_TEST_UPDATE,
        resourceId: testId,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.AB_TEST,
        details: { testId, updates },
      });

      return updatedTest;
    } catch (error) {
      await logger.error('Failed to update A/B test', {
        operation: 'admin_update_ab_test',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to update A/B test');
    }
  }

export async function getUserSegments(): Promise<AdminJsonObject[]> {
    try {
      // Get user segments based on behavior and demographics
      const segments = await prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      });

      return segments.map(segment => ({
        id: segment.role,
        name: `${segment.role.charAt(0).toUpperCase() + segment.role.slice(1)} Users`,
        criteria: `Role: ${segment.role}`,
        userCount: segment._count.id,
        averageValue: 0, // Would calculate based on subscription data
        growthRate: 0 // Would calculate based on historical data
      }));
    } catch (error) {
      await logger.error('Failed to get user segments', {
        operation: 'admin_get_user_segments',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to get user segments');
    }
  }

export async function createUserSegment(segmentData: UserSegmentData, adminId?: string): Promise<AdminUserSegmentPayload> {
    try {
      const segment = {
        id: `segment_${Date.now()}`,
        ...segmentData,
        createdAt: new Date(),
        createdBy: adminId
      };

      // Log the action
      await logAnalyticsAudit({
        adminId: adminId || 'system',
        action: ADMIN_AUDIT_ACTIONS.USER_SEGMENT_CREATE,
        resourceId: segment.id,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.USER_SEGMENT,
        details: { segmentId: segment.id, segmentName: segmentData.name },
      });

      return segment;
    } catch (error) {
      await logger.error('Failed to create user segment', {
        operation: 'admin_create_user_segment',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to create user segment');
    }
  }

export async function getPredictiveInsights(): Promise<AdminJsonObject[]> {
    try {
      // Get real predictive insights from CollectiveInsight database
      const collectiveInsights = await prisma.collectiveInsight.findMany({
        where: {
          actionable: true,
          confidence: { gte: 0.6 } // Only high-confidence insights
        },
        orderBy: [
          { confidence: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 10 // Limit to top 10 insights
      });

      // Convert CollectiveInsight to predictive insights format
      const insights = collectiveInsights.map((insight) => {
        // Map insight type to predictive insight type
        let predictiveType: 'churn' | 'upsell' | 'growth' | 'risk' = 'growth';
        if (insight.type === 'risk' || insight.type === 'optimization') {
          predictiveType = 'risk';
        } else if (insight.type === 'trend' || insight.type === 'best_practice') {
          predictiveType = 'growth';
        }

        // Map impact level
        let impact: 'high' | 'medium' | 'low' = 'medium';
        if (insight.impact === 'high' || insight.impact === 'critical') {
          impact = 'high';
        } else if (insight.impact === 'low' || insight.impact === 'minimal') {
          impact = 'low';
        }

        return {
          type: predictiveType,
          title: insight.title || 'Predictive Insight',
          description: insight.description || 'Generated from platform-wide learning patterns',
          confidence: Math.round((insight.confidence || 0.7) * 100),
          impact: impact,
          recommendedAction: insight.recommendations?.[0] || 'Review this insight and take appropriate action'
        };
      });

      // If no real insights available, return empty array instead of mock data
      // This ensures the UI shows "No insights available" rather than misleading mock data
      return insights;
    } catch (error) {
      await logger.error('Failed to get predictive insights', {
        operation: 'admin_get_predictive_insights',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      // Return empty array on error instead of throwing
      // This prevents the entire BI page from breaking if insights fail to load
      return [];
    }
  }

export async function getCompetitiveAnalysis(): Promise<AdminCompetitiveAnalysisPayload> {
    try {
      // In a real implementation, this would gather data from market research
      return {
        marketPosition: 'Emerging Leader',
        keyCompetitors: [
          {
            name: 'Competitor A',
            marketShare: 35,
            strengths: ['Established brand', 'Large user base'],
            weaknesses: ['Outdated UI', 'Poor mobile experience']
          },
          {
            name: 'Competitor B',
            marketShare: 25,
            strengths: ['Advanced features', 'Good mobile app'],
            weaknesses: ['High pricing', 'Complex onboarding']
          }
        ],
        opportunities: [
          'Mobile-first approach',
          'AI-powered features',
          'Better pricing strategy',
          'Improved user experience'
        ],
        threats: [
          'Large tech companies entering market',
          'Economic downturn affecting spending',
          'Regulatory changes',
          'Rapid technological changes'
        ]
      };
    } catch (error) {
      await logger.error('Failed to get competitive analysis', {
        operation: 'admin_get_competitive_analysis',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to get competitive analysis');
    }
  }

export async function generateCustomReport(reportConfig: ReportConfig, adminId?: string): Promise<AdminCustomReportPayload> {
    try {
      const report = {
        id: `report_${Date.now()}`,
        name: reportConfig.name,
        type: reportConfig.type,
        data: await getBusinessIntelligence(reportConfig.filters),
        generatedAt: new Date(),
        generatedBy: adminId
      };

      // Log the action
      await logAnalyticsAudit({
        adminId: adminId || 'system',
        action: ADMIN_AUDIT_ACTIONS.CUSTOM_REPORT_GENERATE,
        resourceId: report.id,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.ANALYTICS_REPORT,
        details: { reportId: report.id, reportName: reportConfig.name, reportType: reportConfig.type },
      });

      return report;
    } catch (error) {
      await logger.error('Failed to generate custom report', {
        operation: 'admin_generate_custom_report',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to generate custom report');
    }
  }

  // Helper methods for business intelligence
async function getUserGrowthMetrics(dateRange: { start: Date; end: Date }): Promise<AdminJsonObject> {
    const [totalUsers, newUsers, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
          }
        }
      })
    ]);

    const growthRate = totalUsers > 0 ? ((newUsers / totalUsers) * 100) : 0;
    const churnRate = 2.3; // Mock churn rate

    return {
      totalUsers,
      newUsersThisMonth: newUsers,
      activeUsers,
      churnRate,
      growthRate
    };
  }

async function getRevenueMetrics(dateRange: { start: Date; end: Date }): Promise<AdminJsonObject> {
    const revenue = await prisma.moduleSubscription.aggregate({
      _sum: {
        amount: true
      },
      where: {
        status: 'active',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    });

    const totalRevenue = revenue._sum.amount || 0;
    const monthlyRecurringRevenue = totalRevenue;
    const averageRevenuePerUser = totalRevenue / 15420; // Mock user count
    const revenueGrowth = 12.5; // Mock growth rate

    return {
      totalRevenue,
      monthlyRecurringRevenue,
      averageRevenuePerUser,
      revenueGrowth,
      topRevenueSources: [
        { source: 'Premium Subscriptions', amount: totalRevenue * 0.68, percentage: 68 },
        { source: 'Module Marketplace', amount: totalRevenue * 0.20, percentage: 20 },
        { source: 'Enterprise Licenses', amount: totalRevenue * 0.12, percentage: 12 }
      ]
    };
  }

async function getEngagementMetrics(dateRange: { start: Date; end: Date }): Promise<AdminJsonObject> {
    return {
      averageSessionDuration: 24.5,
      dailyActiveUsers: 3420,
      weeklyActiveUsers: 8923,
      monthlyActiveUsers: 15420,
      featureUsage: [
        { feature: 'Chat', usageCount: 12500, percentage: 81 },
        { feature: 'Drive', usageCount: 9800, percentage: 64 },
        { feature: 'Analytics', usageCount: 7200, percentage: 47 },
        { feature: 'Modules', usageCount: 5600, percentage: 36 }
      ]
    };
  }

async function getABTests(): Promise<AdminJsonObject[]> {
    return [
      {
        id: '1',
        name: 'Pricing Page Redesign',
        status: 'running',
        startDate: '2024-01-15',
        variantA: {
          name: 'Control (Current)',
          users: 5000,
          conversionRate: 3.2,
          revenue: 16000
        },
        variantB: {
          name: 'New Design',
          users: 5000,
          conversionRate: 4.1,
          revenue: 20500
        },
        confidence: 95
      },
      {
        id: '2',
        name: 'Onboarding Flow',
        status: 'completed',
        startDate: '2023-12-01',
        endDate: '2024-01-15',
        variantA: {
          name: 'Original Flow',
          users: 3000,
          conversionRate: 65,
          revenue: 19500
        },
        variantB: {
          name: 'Simplified Flow',
          users: 3000,
          conversionRate: 78,
          revenue: 23400
        },
        winner: 'B',
        confidence: 99
      }
    ];
  }

function getDateRangeFromFilter(dateRange: string): { start: Date; end: Date } {
    const end = new Date();
    let start: Date;

    switch (dateRange) {
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }


export async function getDashboardStatsWithTrends() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const [
    totalUsers, usersLast30Days, usersPrevious30Days,
    totalBusinesses, businessesLast30Days, businessesPrevious30Days,
    monthlyRevenue, revenueLast30Days, revenuePrevious30Days, systemHealthSummary,
  ] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(() => 0),
    prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }).catch(() => 0),
    prisma.business.count().catch(() => 0),
    prisma.business.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(() => 0),
    prisma.business.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }).catch(() => 0),
    prisma.moduleSubscription.aggregate({ _sum: { amount: true }, where: { status: 'active' } }).catch(() => ({ _sum: { amount: null } })),
    prisma.moduleSubscription.aggregate({ _sum: { amount: true }, where: { status: 'active', createdAt: { gte: thirtyDaysAgo } } }).catch(() => ({ _sum: { amount: null } })),
    prisma.moduleSubscription.aggregate({ _sum: { amount: true }, where: { status: 'active', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }).catch(() => ({ _sum: { amount: null } })),
    getDashboardSystemHealthSummary(),
  ]);
  const calculateTrend = (current: number, previous: number) => (previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100));
  return {
    totalUsers, activeUsers: totalUsers, totalBusinesses,
    monthlyRevenue: monthlyRevenue._sum.amount || 0,
    systemHealth: systemHealthSummary.score, systemHealthStatus: systemHealthSummary.status,
    userGrowthTrend: calculateTrend(usersLast30Days, usersPrevious30Days),
    businessGrowthTrend: calculateTrend(businessesLast30Days, businessesPrevious30Days),
    revenueGrowthTrend: calculateTrend(revenueLast30Days._sum.amount || 0, revenuePrevious30Days._sum.amount || 0),
  };
}

export async function getRecentDashboardActivity() {
  return prisma.auditLog.findMany({ take: 10, orderBy: { timestamp: 'desc' }, include: { user: { select: { email: true, name: true } } } });
}

export async function getSystemMetricsForTimeRange(timeRange: string) {
  const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
  return prisma.systemMetrics.findMany({ where: { timestamp: { gte: new Date(Date.now() - hours * 60 * 60 * 1000) } }, orderBy: { timestamp: 'desc' } });
}

export async function getUserAnalyticsGrouped(timeRange: string) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  return prisma.user.groupBy({ by: ['createdAt'], _count: true, where: { createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } } });
}
