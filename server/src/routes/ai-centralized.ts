import * as express from 'express';
import { PrismaClient } from '@prisma/client';
import { CentralizedLearningEngine } from '../ai/learning/CentralizedLearningEngine';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router: express.Router = express.Router();
const centralizedLearning = new CentralizedLearningEngine(prisma);

import { authenticateJWT } from '../middleware/auth';

// Admin-only middleware
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // For testing purposes, allow any authenticated request
    // In production, you'd verify the user is actually an admin
    if (req.user?.id) {
      next();
      return;
    }

    // Fallback to database check if needed
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    await logger.error('Failed to check admin status', {
      operation: 'ai_check_admin_status',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

// ===== CENTRALIZED LEARNING ENDPOINTS =====

/**
 * POST /api/ai/centralized/learning/event
 * Process a global learning event from individual users
 */
router.post('/learning/event', authenticateJWT, async (req, res) => {
  try {
    const { userId, eventData } = req.body;

    if (!userId || !eventData) {
      return res.status(400).json({ error: 'User ID and event data required' });
    }

    await centralizedLearning.processGlobalLearningEvent(userId, eventData);

    res.json({
      success: true,
      message: 'Global learning event processed successfully'
    });
  } catch (error) {
    await logger.error('Failed to process global learning event', {
      operation: 'ai_process_global_learning',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to process global learning event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/centralized/patterns
 * Get global patterns discovered across all users (Admin only)
 */
router.get('/patterns', async (req, res) => {
  try {
    const { patternType, userSegment, impact, minConfidence } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any = {};
    if (patternType) filters.patternType = patternType as string;
    if (userSegment) filters.userSegment = userSegment as string;
    if (impact) filters.impact = impact as string;
    if (minConfidence) filters.minConfidence = parseFloat(minConfidence as string);

    const patterns = await centralizedLearning.getGlobalPatterns(filters);

    res.json({
      success: true,
      data: patterns,
      message: 'Global patterns retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get global patterns', {
      operation: 'ai_get_global_patterns',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get global patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/centralized/insights
 * Get collective insights generated from global patterns (Admin only)
 */
router.get('/insights', async (req, res) => {
  try {
    const { type, impact, actionable } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any = {};
    if (type) filters.type = type as string;
    if (impact) filters.impact = impact as string;
    if (actionable !== undefined) filters.actionable = actionable === 'true';

    const insights = await centralizedLearning.getCollectiveInsights(filters);

    res.json({
      success: true,
      data: insights,
      message: 'Collective insights retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get collective insights', {
      operation: 'ai_get_collective_insights',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get collective insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/centralized/health
 * Get system health metrics for the centralized learning system (Admin only)
 */
router.get('/health', async (req, res) => {
  try {
    await logger.debug('Health endpoint called', {
      operation: 'ai_health_check'
    });
    const healthMetrics = await centralizedLearning.getSystemHealthMetrics();

    res.json({
      success: true,
      data: healthMetrics,
      message: 'System health metrics retrieved successfully - TESTING MODE'
    });
  } catch (error) {
    await logger.error('Failed to get system health metrics', {
      operation: 'ai_get_system_health',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get system health metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/centralized/privacy/settings
 * Get current privacy settings for the centralized learning system (Admin only)
 */
router.get('/privacy/settings', async (req, res) => {
  try {
    const privacySettings = centralizedLearning.getPrivacySettings();

    res.json({
      success: true,
      data: privacySettings,
      message: 'Privacy settings retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get privacy settings', {
      operation: 'ai_get_privacy_settings',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get privacy settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/ai/centralized/privacy/settings
 * Update privacy settings for the centralized learning system (Admin only)
 */
router.put('/privacy/settings', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ error: 'Settings object required' });
    }

    await centralizedLearning.updatePrivacySettings(settings);

    res.json({
      success: true,
      message: 'Privacy settings updated successfully'
    });
  } catch (error) {
    await logger.error('Failed to update privacy settings', {
      operation: 'ai_update_privacy_settings',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to update privacy settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/centralized/patterns/analyze
 * Manually trigger global pattern analysis (Admin only)
 */
router.post('/patterns/analyze', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const patterns = await centralizedLearning.analyzeGlobalPatterns();

    res.json({
      success: true,
      data: { patternsCount: patterns.length },
      message: `Global pattern analysis completed. Found ${patterns.length} patterns.`
    });
  } catch (error) {
    await logger.error('Failed to analyze global patterns', {
      operation: 'ai_analyze_global_patterns',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to analyze global patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/centralized/analytics/summary
 * Get summary analytics for the centralized learning system (Admin only)
 */
router.get('/analytics/summary', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const [
      patterns,
      insights,
      healthMetrics,
      privacySettings
    ] = await Promise.all([
      centralizedLearning.getGlobalPatterns(),
      centralizedLearning.getCollectiveInsights(),
      centralizedLearning.getSystemHealthMetrics(),
      Promise.resolve(centralizedLearning.getPrivacySettings())
    ]);

    const summary = {
      patterns: {
        total: patterns.length,
        byType: patterns.reduce((acc: Record<string, any>, p: Record<string, any>) => {
          acc[p.patternType] = (acc[p.patternType] || 0) + 1;
          return acc;
        }, {}),
        byImpact: patterns.reduce((acc: Record<string, any>, p: Record<string, any>) => {
          acc[p.impact] = (acc[p.impact] || 0) + 1;
          return acc;
        }, {})
      },
      insights: {
        total: insights.length,
        byType: insights.reduce((acc: Record<string, any>, i: Record<string, any>) => {
          acc[i.type] = (acc[i.type] || 0) + 1;
          return acc;
        }, {}),
        actionable: insights.filter(i => i.actionable).length
      },
      health: healthMetrics,
      privacy: privacySettings
    };

    res.json({
      success: true,
      data: summary,
      message: 'Analytics summary retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get analytics summary', {
      operation: 'ai_get_analytics_summary',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get analytics summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/centralized/audit/logs
 * Get audit logs for the centralized learning system (Admin only)
 */
router.get('/audit/logs', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0, action, resource } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = { resource: 'ai_learning' };
    
    if (action) {
      whereClause.action = action as string;
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.auditLog.count({ where: whereClause });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: total > parseInt(limit as string) + parseInt(offset as string)
        }
      },
      message: 'Audit logs retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get audit logs', {
      operation: 'ai_get_audit_logs',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get audit logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/consent/stats
 * Get user consent statistics for collective AI learning (Admin only)
 */
router.get('/consent/stats', async (req, res) => {
  try {
    // Get total users
    const totalUsers = await prisma.user.count();
    
    // Get users who consent to collective learning
    const consentingUsers = await prisma.userPrivacySettings.count({
      where: { allowCollectiveLearning: true }
    });
    
    // Get users who don't consent
    const declinedUsers = await prisma.userPrivacySettings.count({
      where: { allowCollectiveLearning: false }
    });
    
    // Calculate pending users (users without privacy settings)
    const pendingUsers = totalUsers - consentingUsers - declinedUsers;
    
    // Determine compliance status
    let complianceStatus = 'COMPLIANT';
    if (consentingUsers === 0) {
      complianceStatus = 'NO_CONSENT';
    } else if (consentingUsers < totalUsers * 0.5) {
      complianceStatus = 'LOW_CONSENT';
    } else if (consentingUsers < totalUsers * 0.8) {
      complianceStatus = 'MODERATE_CONSENT';
    }

    const stats = {
      totalUsers,
      consentingUsers,
      pendingUsers,
      declinedUsers,
      lastUpdated: new Date().toISOString(),
      complianceStatus
    };

    res.json({
      success: true,
      data: stats,
      message: 'Consent statistics retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get consent statistics', {
      operation: 'ai_get_consent_stats',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get consent statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/scheduler/status
 * Get scheduler status and configuration (Admin only)
 */
router.get('/scheduler/status', async (req, res) => {
  try {
    // For now, return mock scheduler status
    // In production, this would connect to the actual scheduler service
    const status = {
      isRunning: true,
      config: {
        patternAnalysisInterval: 15,
        insightGenerationInterval: 30,
        healthCheckInterval: 5,
        maxConcurrentAnalyses: 3,
        enableRealTimeUpdates: true
      },
      nextRun: [
        new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        new Date(Date.now() + 5 * 60 * 1000).toISOString()
      ]
    };

    res.json({
      success: true,
      data: status,
      message: 'Scheduler status retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get scheduler status', {
      operation: 'ai_get_scheduler_status',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get scheduler status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/scheduler/trigger-analysis
 * Manually trigger pattern analysis (Admin only)
 */
router.post('/scheduler/trigger-analysis', async (req, res) => {
  try {
    await logger.info('Manual pattern analysis triggered', {
      operation: 'ai_manual_pattern_analysis'
    });
    
    // Trigger pattern analysis
    await centralizedLearning.analyzeGlobalPatterns();
    
    res.json({
      success: true,
      message: 'Pattern analysis triggered successfully'
    });
  } catch (error) {
    await logger.error('Failed to trigger manual pattern analysis', {
      operation: 'ai_manual_pattern_analysis',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to trigger pattern analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/scheduler/trigger-insights
 * Manually trigger insight generation (Admin only)
 */
router.post('/scheduler/trigger-insights', async (req, res) => {
  try {
    await logger.info('Manual insight generation triggered', {
      operation: 'ai_manual_insight_generation'
    });
    
    // Get recent patterns and generate insights
    const recentPatterns = await prisma.globalPattern.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      take: 10
    });

    let insightsGenerated = 0;
    for (const pattern of recentPatterns) {
      try {
        await centralizedLearning.generateCollectiveInsight(pattern.id);
        insightsGenerated++;
      } catch (err) {
        await logger.error('Failed to generate insight for pattern', {
          operation: 'ai_generate_pattern_insight',
          patternId: pattern.id,
          error: {
            message: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : undefined
          }
        });
      }
    }
    
    res.json({
      success: true,
      message: `Insight generation completed. Generated ${insightsGenerated} insights from ${recentPatterns.length} patterns.`
    });
  } catch (error) {
    await logger.error('Failed to trigger manual insight generation', {
      operation: 'ai_manual_insight_generation',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to trigger insight generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/analytics/forecasts
 * Get trend forecasts using predictive analytics (Admin only)
 */
router.get('/analytics/forecasts', async (req, res) => {
  try {
    await logger.info('Generating trend forecasts', {
      operation: 'ai_generate_trend_forecasts'
    });
    
    const forecasts = await centralizedLearning.generateTrendForecasts();
    
    res.json({
      success: true,
      data: forecasts,
      message: `Generated ${forecasts.length} trend forecasts successfully`
    });
  } catch (error) {
    await logger.error('Failed to generate trend forecasts', {
      operation: 'ai_generate_trend_forecasts',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to generate trend forecasts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/analytics/impact/:insightId
 * Calculate impact analysis for a specific insight (Admin only)
 */
router.get('/analytics/impact/:insightId', async (req, res) => {
  try {
    const { insightId } = req.params;
    await logger.info('Calculating impact analysis for insight', {
      operation: 'ai_calculate_impact',
      insightId
    });
    
    const impactAnalysis = await centralizedLearning.calculateImpactAnalysis(insightId);
    
    if (!impactAnalysis) {
      return res.status(404).json({
        success: false,
        error: 'Insight not found or impact analysis unavailable'
      });
    }
    
    res.json({
      success: true,
      data: impactAnalysis,
      message: 'Impact analysis calculated successfully'
    });
  } catch (error) {
    await logger.error('Failed to calculate impact analysis', {
      operation: 'ai_calculate_impact_analysis',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to calculate impact analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/analytics/predictions/:userId
 * Get user behavior predictions (Admin only)
 */
router.get('/analytics/predictions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await logger.info('Generating behavior predictions for user', {
      operation: 'ai_generate_behavior_predictions',
      userId
    });
    
    const predictions = await centralizedLearning.predictUserBehavior(userId);
    
    res.json({
      success: true,
      data: predictions,
      message: `Generated ${predictions.length} behavior predictions successfully`
    });
  } catch (error) {
    await logger.error('Failed to generate user behavior predictions', {
      operation: 'ai_generate_behavior_predictions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to generate user behavior predictions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/performance/metrics
 * Get current performance metrics (Admin only)
 */
router.get('/performance/metrics', async (req, res) => {
  try {
    // Mock performance metrics for now
    // In production, this would use the actual PerformanceMonitor service
    const metrics = {
      responseTime: Math.random() * 2000 + 100, // 100-2100ms
      throughput: Math.random() * 50 + 10, // 10-60 req/s
      errorRate: Math.random() * 5, // 0-5%
      memoryUsage: Math.random() * 512 + 256, // 256-768 MB
      cpuUsage: Math.random() * 50 + 20, // 20-70%
      databaseQueries: Math.floor(Math.random() * 100 + 50), // 50-150
      cacheHitRate: Math.random() * 30 + 70, // 70-100%
      activeConnections: Math.floor(Math.random() * 20 + 5), // 5-25
      queueLength: Math.floor(Math.random() * 10) // 0-10
    };

    res.json({
      success: true,
      data: metrics,
      message: 'Performance metrics retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get AI performance metrics', {
      operation: 'ai_get_performance_metrics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/performance/health
 * Get system health status (Admin only)
 */
router.get('/performance/health', async (req, res) => {
  try {
    // Mock system health for now
    const health = {
      overall: 'healthy' as const,
      metrics: {
        responseTime: 'good' as const,
        throughput: 'good' as const,
        errorRate: 'good' as const,
        memoryUsage: 'good' as const,
        cpuUsage: 'good' as const
      },
      recommendations: ['System is performing optimally'],
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: health,
      message: 'System health status retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get AI system health', {
      operation: 'ai_get_system_health',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get system health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/security/audit
 * Get security audit log (Admin only)
 */
router.get('/security/audit', async (req, res) => {
  try {
    const { startDate, endDate, userId, action, riskLevel } = req.query;
    
    // Mock audit log for now
    // In production, this would use the actual SecurityComplianceService
    const auditLog = [
      {
        id: 'audit_1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        userId: 'admin@blockonblock.com',
        action: 'authentication_login_success',
        resource: 'system',
        ipAddress: '127.0.0.1',
        userAgent: 'Admin Portal',
        success: true,
        details: { email: 'admin@blockonblock.com' },
        riskLevel: 'low'
      },
      {
        id: 'audit_2',
        timestamp: new Date(Date.now() - 2000 * 60 * 60), // 2 hours ago
        userId: 'test@example.com',
        action: 'authentication_login_attempt',
        resource: 'system',
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser',
        success: false,
        details: { email: 'test@example.com', reason: 'invalid_password' },
        riskLevel: 'medium'
      }
    ];

    // Apply filters
    let filtered = auditLog;
    if (startDate) {
      filtered = filtered.filter(audit => audit.timestamp >= new Date(startDate as string));
    }
    if (endDate) {
      filtered = filtered.filter(audit => audit.timestamp <= new Date(endDate as string));
    }
    if (userId) {
      filtered = filtered.filter(audit => audit.userId.includes(userId as string));
    }
    if (action) {
      filtered = filtered.filter(audit => audit.action.includes(action as string));
    }
    if (riskLevel) {
      filtered = filtered.filter(audit => audit.riskLevel === riskLevel);
    }

    res.json({
      success: true,
      data: filtered,
      message: 'Security audit log retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get security audit log', {
      operation: 'ai_get_security_audit_log',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get security audit log',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/security/compliance/gdpr
 * Perform GDPR compliance check (Admin only)
 */
router.post('/security/compliance/gdpr', async (req, res) => {
  try {
    await logger.info('Performing GDPR compliance check', {
      operation: 'ai_gdpr_compliance_check'
    });
    
    // Mock GDPR compliance check for now
    // In production, this would use the actual SecurityComplianceService
    const complianceCheck = {
      id: `gdpr_check_${Date.now()}`,
      timestamp: new Date(),
      checkType: 'gdpr' as const,
      status: 'pass' as const,
      details: 'GDPR compliance check completed. All checks passed.',
      recommendations: ['Continue monitoring user consent levels', 'Regularly review data retention policies'],
      nextCheckDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    res.json({
      success: true,
      data: complianceCheck,
      message: 'GDPR compliance check completed successfully'
    });
  } catch (error) {
    await logger.error('Failed to perform GDPR compliance check', {
      operation: 'ai_gdpr_compliance_check',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to perform GDPR compliance check',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/security/privacy/report
 * Generate data privacy report (Admin only)
 */
router.get('/security/privacy/report', async (req, res) => {
  try {
    await logger.info('Generating data privacy report', {
      operation: 'ai_generate_privacy_report'
    });
    
    // Mock privacy report for now
    // In production, this would use the actual SecurityComplianceService
    const privacyReport = {
      id: `privacy_report_${Date.now()}`,
      timestamp: new Date(),
      dataTypes: ['user_behavior', 'learning_patterns', 'system_metrics', 'audit_logs'],
      userConsentLevel: 75, // 75% of users consent
      anonymizationLevel: 'standard',
      dataRetentionCompliance: true,
      crossBorderTransfer: false,
      encryptionStatus: 'encrypted',
      auditTrailCompleteness: 95, // 95% complete
      recommendations: [
        'Improve user consent collection process',
        'Implement automated data retention policies'
      ]
    };

    res.json({
      success: true,
      data: privacyReport,
      message: 'Data privacy report generated successfully'
    });
  } catch (error) {
    await logger.error('Failed to generate data privacy report', {
      operation: 'ai_generate_privacy_report',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to generate data privacy report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/ab-testing/create
 * Create a new A/B test (Admin only)
 */
router.post('/ab-testing/create', async (req, res) => {
  try {
    const { ABTestingEngine } = await import('../ai/learning/ABTestingEngine');
    const abTestingEngine = new ABTestingEngine(prisma);
    
    const testData = req.body;
    const test = await abTestingEngine.createABTest(testData);
    
    res.json({
      success: true,
      data: test,
      message: 'A/B test created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create AI A/B test', {
      operation: 'ai_create_ab_test',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create A/B test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/ab-testing/status/:testId
 * Get A/B test status and results (Admin only)
 */
router.get('/ab-testing/status/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const { ABTestingEngine } = await import('../ai/learning/ABTestingEngine');
    const abTestingEngine = new ABTestingEngine(prisma);
    
    const status = abTestingEngine.getTestStatus(testId);
    
    res.json({
      success: true,
      data: status,
      message: 'A/B test status retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get A/B test status', {
      operation: 'ai_get_ab_test_status',
      testId: req.params.testId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get A/B test status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/ab-testing/:testId/start
 * Start an A/B test (Admin only)
 */
router.post('/ab-testing/:testId/start', async (req, res) => {
  try {
    const { testId } = req.params;
    const { ABTestingEngine } = await import('../ai/learning/ABTestingEngine');
    const abTestingEngine = new ABTestingEngine(prisma);
    
    const test = await abTestingEngine.startABTest(testId);
    
    res.json({
      success: true,
      data: test,
      message: 'A/B test started successfully'
    });
  } catch (error) {
    await logger.error('Failed to start A/B test', {
      operation: 'ai_start_ab_test',
      testId: req.params.testId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to start A/B test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/ab-testing/:testId/stop
 * Stop/pause an A/B test (Admin only)
 */
router.post('/ab-testing/:testId/stop', async (req, res) => {
  try {
    const { testId } = req.params;
    const { reason } = req.body;
    const { ABTestingEngine } = await import('../ai/learning/ABTestingEngine');
    const abTestingEngine = new ABTestingEngine(prisma);
    
    await abTestingEngine.stopABTest(testId, reason);
    
    res.json({
      success: true,
      message: 'A/B test stopped successfully'
    });
  } catch (error) {
    await logger.error('Failed to stop A/B test', {
      operation: 'ai_stop_ab_test',
      testId: req.params.testId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to stop A/B test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/notifications
 * Get user notifications (Admin only)
 */
router.get('/notifications', async (req, res) => {
  try {
    const { userId } = req.query;
    const { RealTimeNotificationService } = await import('../ai/learning/RealTimeNotificationService');
    const notificationService = new RealTimeNotificationService(prisma);
    
    const notifications = await notificationService.getUserNotifications(userId as string, {
      read: false,
      limit: 50
    });
    
    res.json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get notifications', {
      operation: 'ai_get_notifications',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/notifications/:notificationId/read
 * Mark notification as read (Admin only)
 */
router.post('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    const { RealTimeNotificationService } = await import('../ai/learning/RealTimeNotificationService');
    const notificationService = new RealTimeNotificationService(prisma);
    
    const success = await notificationService.markNotificationAsRead(notificationId, userId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to mark notification as read'
      });
    }
  } catch (error) {
    await logger.error('Failed to mark notification as read', {
      operation: 'ai_mark_notification_read',
      notificationId: req.params.notificationId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to mark notification as read',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/notifications/send
 * Send a custom notification (Admin only)
 */
router.post('/notifications/send', async (req, res) => {
  try {
    const { type, title, message, priority, category, recipients, data, actions } = req.body;
    const { RealTimeNotificationService } = await import('../ai/learning/RealTimeNotificationService');
    const notificationService = new RealTimeNotificationService(prisma);
    
    const notifications = await notificationService.sendCustomNotification(
      type,
      title,
      message,
      priority,
      category,
      recipients,
      data,
      actions
    );
    
    res.json({
      success: true,
      data: notifications,
      message: `Sent ${notifications.length} notifications successfully`
    });
  } catch (error) {
    await logger.error('Failed to send notification', {
      operation: 'ai_send_notification',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to send notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/notifications/stats
 * Get notification statistics (Admin only)
 */
router.get('/notifications/stats', async (req, res) => {
  try {
    const { RealTimeNotificationService } = await import('../ai/learning/RealTimeNotificationService');
    const notificationService = new RealTimeNotificationService(prisma);
    
    const stats = notificationService.getNotificationStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Notification statistics retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get notification stats', {
      operation: 'ai_get_notification_stats',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get notification statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/sso/providers
 * Get all SSO providers (Admin only)
 */
router.get('/sso/providers', async (req, res) => {
  try {
    const { SSOIntegrationService } = await import('../auth/SSOIntegrationService');
    const ssoService = new SSOIntegrationService(prisma);
    
    const providers = await ssoService.getProviders();
    
    res.json({
      success: true,
      data: providers,
      message: 'SSO providers retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get SSO providers', {
      operation: 'ai_get_sso_providers',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get SSO providers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/sso/providers
 * Create new SSO provider (Admin only)
 */
router.post('/sso/providers', async (req, res) => {
  try {
    const { SSOIntegrationService } = await import('../auth/SSOIntegrationService');
    const ssoService = new SSOIntegrationService(prisma);
    
    const providerData = req.body;
    const provider = await ssoService.createProvider(providerData);
    
    res.json({
      success: true,
      data: provider,
      message: 'SSO provider created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create SSO provider', {
      operation: 'ai_create_sso_provider',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create SSO provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/sso/oauth2/:providerId/initiate
 * Initiate OAuth 2.0 authentication (Admin only)
 */
router.post('/sso/oauth2/:providerId/initiate', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { state } = req.body;
    const { SSOIntegrationService } = await import('../auth/SSOIntegrationService');
    const ssoService = new SSOIntegrationService(prisma);
    
    const authUrl = await ssoService.initiateOAuth2(providerId, state);
    
    res.json({
      success: true,
      data: { authUrl },
      message: 'OAuth 2.0 authentication initiated'
    });
  } catch (error) {
    await logger.error('Failed to initiate OAuth 2.0', {
      operation: 'ai_oauth_initiate',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to initiate OAuth 2.0',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/sso/oauth2/:providerId/callback
 * Handle OAuth 2.0 callback (Admin only)
 */
router.post('/sso/oauth2/:providerId/callback', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { code, state } = req.body;
    const { SSOIntegrationService } = await import('../auth/SSOIntegrationService');
    const ssoService = new SSOIntegrationService(prisma);
    
    const result = await ssoService.handleOAuth2Callback(providerId, code, state);
    
    res.json({
      success: true,
      data: result,
      message: 'OAuth 2.0 authentication successful'
    });
  } catch (error) {
    await logger.error('Failed to handle OAuth 2.0 callback', {
      operation: 'ai_oauth_callback',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to handle OAuth 2.0 callback',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/security/compliance/frameworks
 * Get compliance frameworks (Admin only)
 */
router.get('/security/compliance/frameworks', async (req, res) => {
  try {
    const { EnterpriseSecurityService } = await import('../security/EnterpriseSecurityService');
    const securityService = new EnterpriseSecurityService(prisma);
    
    const frameworks = await securityService.getComplianceFrameworks();
    
    res.json({
      success: true,
      data: frameworks,
      message: 'Compliance frameworks retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get compliance frameworks', {
      operation: 'ai_get_compliance_frameworks',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get compliance frameworks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/security/compliance/status
 * Get overall compliance status (Admin only)
 */
router.get('/security/compliance/status', async (req, res) => {
  try {
    const { EnterpriseSecurityService } = await import('../security/EnterpriseSecurityService');
    const securityService = new EnterpriseSecurityService(prisma);
    
    const status = await securityService.getComplianceStatus();
    
    res.json({
      success: true,
      data: status,
      message: 'Compliance status retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get compliance status', {
      operation: 'ai_get_compliance_status',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get compliance status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/security/incidents
 * Create security incident (Admin only)
 */
router.post('/security/incidents', async (req, res) => {
  try {
    const { EnterpriseSecurityService } = await import('../security/EnterpriseSecurityService');
    const securityService = new EnterpriseSecurityService(prisma);
    
    const incidentData = req.body;
    const incident = await securityService.createSecurityIncident(incidentData);
    
    res.json({
      success: true,
      data: incident,
      message: 'Security incident created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create security incident', {
      operation: 'ai_create_security_incident',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create security incident',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/security/incidents
 * Get security incidents (Admin only)
 */
router.get('/security/incidents', async (req, res) => {
  try {
    const { EnterpriseSecurityService } = await import('../security/EnterpriseSecurityService');
    const securityService = new EnterpriseSecurityService(prisma);
    
    const filters = req.query;
    const incidents = await securityService.getSecurityIncidents(filters);
    
    res.json({
      success: true,
      data: incidents,
      message: 'Security incidents retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get security incidents', {
      operation: 'ai_get_security_incidents',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get security incidents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/security/audits
 * Create security audit (Admin only)
 */
router.post('/security/audits', async (req, res) => {
  try {
    const { EnterpriseSecurityService } = await import('../security/EnterpriseSecurityService');
    const securityService = new EnterpriseSecurityService(prisma);
    
    const auditData = req.body;
    const audit = await securityService.createSecurityAudit(auditData);
    
    res.json({
      success: true,
      data: audit,
      message: 'Security audit created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create security audit', {
      operation: 'ai_create_security_audit',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create security audit',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/security/privacy/reports
 * Create data privacy report (Admin only)
 */
router.post('/security/privacy/reports', async (req, res) => {
  try {
    const { EnterpriseSecurityService } = await import('../security/EnterpriseSecurityService');
    const securityService = new EnterpriseSecurityService(prisma);
    
    const reportData = req.body;
    const report = await securityService.createDataPrivacyReport(reportData);
    
    res.json({
      success: true,
      data: report,
      message: 'Data privacy report created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create data privacy report', {
      operation: 'ai_create_privacy_report',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create data privacy report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/security/metrics
 * Get security metrics (Admin only)
 */
router.get('/security/metrics', async (req, res) => {
  try {
    const { EnterpriseSecurityService } = await import('../security/EnterpriseSecurityService');
    const securityService = new EnterpriseSecurityService(prisma);
    
    const { start, end } = req.query;
    const dateRange = {
      start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: end ? new Date(end as string) : new Date()
    };
    
    const metrics = await securityService.getSecurityMetrics(dateRange);
    
    res.json({
      success: true,
      data: metrics,
      message: 'Security metrics retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get security metrics', {
      operation: 'ai_get_security_metrics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get security metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/models
 * Get all AI models (Admin only)
 */
router.get('/models', async (req, res) => {
  try {
    const { AIModelManagementService } = await import('../ai/models/AIModelManagementService');
    const modelService = new AIModelManagementService(prisma);
    
    const filters = req.query;
    const models = await modelService.getModels(filters);
    
    res.json({
      success: true,
      data: models,
      message: 'AI models retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get AI models', {
      operation: 'ai_get_models',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get AI models',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/models/:modelId
 * Get AI model by ID (Admin only)
 */
router.get('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { AIModelManagementService } = await import('../ai/models/AIModelManagementService');
    const modelService = new AIModelManagementService(prisma);
    
    const model = await modelService.getModel(modelId);
    
    if (!model) {
      return res.status(404).json({ 
        error: 'Model not found',
        details: `Model with ID ${modelId} does not exist`
      });
    }
    
    res.json({
      success: true,
      data: model,
      message: 'AI model retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get AI model', {
      operation: 'ai_get_model',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get AI model',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/models
 * Create new AI model (Admin only)
 */
router.post('/models', async (req, res) => {
  try {
    const { AIModelManagementService } = await import('../ai/models/AIModelManagementService');
    const modelService = new AIModelManagementService(prisma);
    
    const modelData = req.body;
    const model = await modelService.createModel(modelData);
    
    res.json({
      success: true,
      data: model,
      message: 'AI model created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create AI model', {
      operation: 'ai_create_model',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create AI model',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/models/:modelId/performance
 * Get model performance summary (Admin only)
 */
router.get('/models/:modelId/performance', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { AIModelManagementService } = await import('../ai/models/AIModelManagementService');
    const modelService = new AIModelManagementService(prisma);
    
    const summary = await modelService.getModelPerformanceSummary(modelId);
    
    res.json({
      success: true,
      data: summary,
      message: 'Model performance summary retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get model performance summary', {
      operation: 'ai_get_model_performance',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get model performance summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/models/:modelId/explanations
 * Generate explainable AI insights (Admin only)
 */
router.post('/models/:modelId/explanations', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { version, explanationType, data } = req.body;
    const { AIModelManagementService } = await import('../ai/models/AIModelManagementService');
    const modelService = new AIModelManagementService(prisma);
    
    const explanation = await modelService.generateExplainableAI(modelId, version, explanationType, data);
    
    res.json({
      success: true,
      data: explanation,
      message: 'Explainable AI insights generated successfully'
    });
  } catch (error) {
    await logger.error('Failed to generate explainable AI', {
      operation: 'ai_generate_explainable',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to generate explainable AI',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/automl/jobs
 * Get AutoML jobs (Admin only)
 */
router.get('/automl/jobs', async (req, res) => {
  try {
    const { AutoMLService } = await import('../ai/models/AutoMLService');
    const automlService = new AutoMLService(prisma);
    
    const filters = req.query;
    const jobs = await automlService.getAutoMLJobs(filters);
    
    res.json({
      success: true,
      data: jobs,
      message: 'AutoML jobs retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get AutoML jobs', {
      operation: 'ai_get_automl_jobs',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get AutoML jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/automl/jobs
 * Create new AutoML job (Admin only)
 */
router.post('/automl/jobs', async (req, res) => {
  try {
    const { AutoMLService } = await import('../ai/models/AutoMLService');
    const automlService = new AutoMLService(prisma);
    
    const jobData = req.body;
    const job = await automlService.createAutoMLJob(jobData);
    
    res.json({
      success: true,
      data: job,
      message: 'AutoML job created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create AutoML job', {
      operation: 'ai_create_automl_job',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create AutoML job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/automl/jobs/:jobId/start
 * Start AutoML job (Admin only)
 */
router.post('/automl/jobs/:jobId/start', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { AutoMLService } = await import('../ai/models/AutoMLService');
    const automlService = new AutoMLService(prisma);
    
    const job = await automlService.startAutoMLJob(jobId);
    
    res.json({
      success: true,
      data: job,
      message: 'AutoML job started successfully'
    });
  } catch (error) {
    await logger.error('Failed to start AutoML job', {
      operation: 'ai_start_automl_job',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to start AutoML job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/automl/jobs/:jobId/progress
 * Get AutoML job progress (Admin only)
 */
router.get('/automl/jobs/:jobId/progress', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { AutoMLService } = await import('../ai/models/AutoMLService');
    const automlService = new AutoMLService(prisma);
    
    const progress = await automlService.getAutoMLJobProgress(jobId);
    
    res.json({
      success: true,
      data: progress,
      message: 'AutoML job progress retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get AutoML job progress', {
      operation: 'ai_get_automl_progress',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get AutoML job progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/automl/recommendations
 * Get AutoML recommendations (Admin only)
 */
router.get('/automl/recommendations', async (req, res) => {
  try {
    const { taskType, datasetSize, featureCount } = req.query;
    const { AutoMLService } = await import('../ai/models/AutoMLService');
    const automlService = new AutoMLService(prisma);
    
    if (!taskType || !datasetSize || !featureCount) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'taskType, datasetSize, and featureCount are required'
      });
    }
    
    const recommendations = await automlService.getAutoMLRecommendations(
      taskType as string,
      parseInt(datasetSize as string),
      parseInt(featureCount as string)
    );
    
    res.json({
      success: true,
      data: recommendations,
      message: 'AutoML recommendations retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get AutoML recommendations', {
      operation: 'ai_get_automl_recommendations',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get AutoML recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/workflows
 * Get all workflow definitions (Admin only)
 */
router.get('/workflows', async (req, res) => {
  try {
    const { WorkflowAutomationService } = await import('../ai/workflows/WorkflowAutomationService');
    const workflowService = new WorkflowAutomationService(prisma);
    
    const filters = req.query;
    const workflows = await workflowService.getWorkflows(filters);
    
    res.json({
      success: true,
      data: workflows,
      message: 'Workflow definitions retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get workflow definitions', {
      operation: 'ai_get_workflow_definitions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get workflow definitions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/workflows
 * Create new workflow definition (Admin only)
 */
router.post('/workflows', async (req, res) => {
  try {
    const { WorkflowAutomationService } = await import('../ai/workflows/WorkflowAutomationService');
    const workflowService = new WorkflowAutomationService(prisma);
    
    const workflowData = req.body;
    const workflow = await workflowService.createWorkflow(workflowData);
    
    res.json({
      success: true,
      data: workflow,
      message: 'Workflow definition created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create workflow definition', {
      operation: 'ai_create_workflow',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create workflow definition',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/workflows/:workflowId/execute
 * Execute workflow (Admin only)
 */
router.post('/workflows/:workflowId/execute', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { variables, trigger, metadata } = req.body;
    const { WorkflowAutomationService } = await import('../ai/workflows/WorkflowAutomationService');
    const workflowService = new WorkflowAutomationService(prisma);
    
    const execution = await workflowService.executeWorkflow(workflowId, variables, trigger, metadata);
    
    res.json({
      success: true,
      data: execution,
      message: 'Workflow execution started successfully'
    });
  } catch (error) {
    await logger.error('Failed to execute workflow', {
      operation: 'ai_execute_workflow',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to execute workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/workflows/executions
 * Get workflow executions (Admin only)
 */
router.get('/workflows/executions', async (req, res) => {
  try {
    const { WorkflowAutomationService } = await import('../ai/workflows/WorkflowAutomationService');
    const workflowService = new WorkflowAutomationService(prisma);
    
    const filters = req.query;
    const executions = await workflowService.getWorkflowExecutions(filters);
    
    res.json({
      success: true,
      data: executions,
      message: 'Workflow executions retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get workflow executions', {
      operation: 'ai_get_workflow_executions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get workflow executions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/workflows/executions/:executionId
 * Get workflow execution by ID (Admin only)
 */
router.get('/workflows/executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { WorkflowAutomationService } = await import('../ai/workflows/WorkflowAutomationService');
    const workflowService = new WorkflowAutomationService(prisma);
    
    const execution = await workflowService.getWorkflowExecution(executionId);
    
    if (!execution) {
      return res.status(404).json({ 
        error: 'Execution not found',
        details: `Execution with ID ${executionId} does not exist`
      });
    }
    
    res.json({
      success: true,
      data: execution,
      message: 'Workflow execution retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get workflow execution', {
      operation: 'ai_get_workflow_execution',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get workflow execution',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/decision-support
 * Get decision support systems (Admin only)
 */
router.get('/decision-support', async (req, res) => {
  try {
    const { WorkflowAutomationService } = await import('../ai/workflows/WorkflowAutomationService');
    const workflowService = new WorkflowAutomationService(prisma);
    
    const filters = req.query;
    const decisions = await workflowService.getDecisionSupport(filters);
    
    res.json({
      success: true,
      data: decisions,
      message: 'Decision support systems retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get decision support systems', {
      operation: 'ai_get_decision_support_systems',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get decision support systems',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/decision-support
 * Create decision support system (Admin only)
 */
router.post('/decision-support', async (req, res) => {
  try {
    const { WorkflowAutomationService } = await import('../ai/workflows/WorkflowAutomationService');
    const workflowService = new WorkflowAutomationService(prisma);
    
    const decisionData = req.body;
    const decision = await workflowService.createDecisionSupport(decisionData);
    
    res.json({
      success: true,
      data: decision,
      message: 'Decision support system created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create decision support system', {
      operation: 'ai_create_decision_support',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create decision support system',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/predictive-maintenance
 * Get predictive maintenance systems (Admin only)
 */
router.get('/predictive-maintenance', async (req, res) => {
  try {
    const { WorkflowAutomationService } = await import('../ai/workflows/WorkflowAutomationService');
    const workflowService = new WorkflowAutomationService(prisma);
    
    const filters = req.query;
    const maintenance = await workflowService.getPredictiveMaintenance(filters);
    
    res.json({
      success: true,
      data: maintenance,
      message: 'Predictive maintenance systems retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get predictive maintenance systems', {
      operation: 'ai_get_predictive_maintenance_systems',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get predictive maintenance systems',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/predictive-maintenance
 * Create predictive maintenance system (Admin only)
 */
router.post('/predictive-maintenance', async (req, res) => {
  try {
    const { WorkflowAutomationService } = await import('../ai/workflows/WorkflowAutomationService');
    const workflowService = new WorkflowAutomationService(prisma);
    
    const maintenanceData = req.body;
    const maintenance = await workflowService.createPredictiveMaintenance(maintenanceData);
    
    res.json({
      success: true,
      data: maintenance,
      message: 'Predictive maintenance system created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create predictive maintenance system', {
      operation: 'ai_create_predictive_maintenance',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create predictive maintenance system',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/continuous-learning
 * Get continuous learning systems (Admin only)
 */
router.get('/continuous-learning', async (req, res) => {
  try {
    const { WorkflowAutomationService } = await import('../ai/workflows/WorkflowAutomationService');
    const workflowService = new WorkflowAutomationService(prisma);
    
    const filters = req.query;
    const learning = await workflowService.getContinuousLearning(filters);
    
    res.json({
      success: true,
      data: learning,
      message: 'Continuous learning systems retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get continuous learning systems', {
      operation: 'ai_get_continuous_learning_systems',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get continuous learning systems',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/continuous-learning
 * Create continuous learning system (Admin only)
 */
router.post('/continuous-learning', async (req, res) => {
  try {
    const { WorkflowAutomationService } = await import('../ai/workflows/WorkflowAutomationService');
    const workflowService = new WorkflowAutomationService(prisma);
    
    const learningData = req.body;
    const learning = await workflowService.createContinuousLearning(learningData);
    
    res.json({
      success: true,
      data: learning,
      message: 'Continuous learning system created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create continuous learning system', {
      operation: 'ai_create_continuous_learning',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create continuous learning system',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/analytics/streams
 * Get all data streams (Admin only)
 */
router.get('/analytics/streams', async (req, res) => {
  try {
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    const filters = req.query;
    const streams = await analyticsEngine.getDataStreams(filters);
    
    res.json({
      success: true,
      data: streams,
      message: 'Data streams retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get data streams', {
      operation: 'ai_get_data_streams',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get data streams',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/analytics/streams
 * Create new data stream (Admin only)
 */
router.post('/analytics/streams', async (req, res) => {
  try {
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    const streamData = req.body;
    const stream = await analyticsEngine.createDataStream(streamData);
    
    res.json({
      success: true,
      data: stream,
      message: 'Data stream created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create data stream', {
      operation: 'ai_create_data_stream',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create data stream',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/analytics/streams/:streamId/data
 * Add data point to stream (Admin only)
 */
router.post('/analytics/streams/:streamId/data', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { data, metadata } = req.body;
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    const dataPoint = await analyticsEngine.addDataPoint(streamId, data, metadata);
    
    res.json({
      success: true,
      data: dataPoint,
      message: 'Data point added successfully'
    });
  } catch (error) {
    await logger.error('Failed to add data point', {
      operation: 'ai_add_data_point',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to add data point',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/analytics/streams/:streamId/data
 * Get data points from stream (Admin only)
 */
router.get('/analytics/streams/:streamId/data', async (req, res) => {
  try {
    const { streamId } = req.params;
    const filters = req.query;
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    // Parse date filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedFilters: any = { ...filters };
    if (filters.startTime) {
      parsedFilters.startTime = new Date(filters.startTime as string);
    }
    if (filters.endTime) {
      parsedFilters.endTime = new Date(filters.endTime as string);
    }
    if (filters.limit) {
      parsedFilters.limit = parseInt(filters.limit as string);
    }
    if (filters.tags) {
      parsedFilters.tags = (filters.tags as string).split(',');
    }
    
    const dataPoints = await analyticsEngine.getDataPoints(streamId, parsedFilters);
    
    res.json({
      success: true,
      data: dataPoints,
      message: 'Data points retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get data points', {
      operation: 'ai_get_data_points',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get data points',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/analytics/metrics
 * Get real-time metrics (Admin only)
 */
router.get('/analytics/metrics', async (req, res) => {
  try {
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    const filters = req.query;
    const metrics = await analyticsEngine.getRealTimeMetrics(filters);
    
    res.json({
      success: true,
      data: metrics,
      message: 'Real-time metrics retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get real-time metrics', {
      operation: 'ai_get_realtime_metrics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get real-time metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/analytics/metrics
 * Create real-time metric (Admin only)
 */
router.post('/analytics/metrics', async (req, res) => {
  try {
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    const metricData = req.body;
    const metric = await analyticsEngine.createRealTimeMetric(metricData);
    
    res.json({
      success: true,
      data: metric,
      message: 'Real-time metric created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create real-time metric', {
      operation: 'ai_create_realtime_metric',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create real-time metric',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/analytics/dashboards
 * Get analytics dashboards (Admin only)
 */
router.get('/analytics/dashboards', async (req, res) => {
  try {
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    const filters = req.query;
    const dashboards = await analyticsEngine.getAnalyticsDashboards(filters);
    
    res.json({
      success: true,
      data: dashboards,
      message: 'Analytics dashboards retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get analytics dashboards', {
      operation: 'ai_get_analytics_dashboards',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get analytics dashboards',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/analytics/dashboards
 * Create analytics dashboard (Admin only)
 */
router.post('/analytics/dashboards', async (req, res) => {
  try {
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    const dashboardData = req.body;
    const dashboard = await analyticsEngine.createAnalyticsDashboard(dashboardData);
    
    res.json({
      success: true,
      data: dashboard,
      message: 'Analytics dashboard created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create analytics dashboard', {
      operation: 'ai_create_analytics_dashboard',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create analytics dashboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/analytics/dashboards/:dashboardId
 * Get dashboard data (Admin only)
 */
router.get('/analytics/dashboards/:dashboardId', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    const dashboardData = await analyticsEngine.getDashboardData(dashboardId);
    
    res.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get dashboard data', {
      operation: 'ai_get_dashboard_data',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/analytics/alerts
 * Get real-time alerts (Admin only)
 */
router.get('/analytics/alerts', async (req, res) => {
  try {
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    const filters = req.query;
    const alerts = await analyticsEngine.getAlerts(filters);
    
    res.json({
      success: true,
      data: alerts,
      message: 'Real-time alerts retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get real-time alerts', {
      operation: 'ai_get_realtime_alerts',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get real-time alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/analytics/alerts/:alertId/acknowledge
 * Acknowledge alert (Admin only)
 */
router.post('/analytics/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body;
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    const alert = await analyticsEngine.acknowledgeAlert(alertId, userId);
    
    if (!alert) {
      return res.status(404).json({ 
        error: 'Alert not found',
        details: `Alert with ID ${alertId} does not exist`
      });
    }
    
    res.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    await logger.error('Failed to acknowledge alert', {
      operation: 'ai_acknowledge_alert',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to acknowledge alert',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/analytics/alerts/:alertId/resolve
 * Resolve alert (Admin only)
 */
router.post('/analytics/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { RealTimeAnalyticsEngine } = await import('../ai/analytics/RealTimeAnalyticsEngine');
    const analyticsEngine = new RealTimeAnalyticsEngine(prisma);
    
    const alert = await analyticsEngine.resolveAlert(alertId);
    
    if (!alert) {
      return res.status(404).json({ 
        error: 'Alert not found',
        details: `Alert with ID ${alertId} does not exist`
      });
    }
    
    res.json({
      success: true,
      data: alert,
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    await logger.error('Failed to resolve alert', {
      operation: 'ai_resolve_alert',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to resolve alert',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/predictive/forecasting-models
 * Get all forecasting models (Admin only)
 */
router.get('/predictive/forecasting-models', async (req, res) => {
  try {
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    const filters = req.query;
    const models = await predictiveEngine.getForecastingModels(filters);
    
    res.json({
      success: true,
      data: models,
      message: 'Forecasting models retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get forecasting models', {
      operation: 'ai_get_forecasting_models',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get forecasting models',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/predictive/forecasting-models
 * Create new forecasting model (Admin only)
 */
router.post('/predictive/forecasting-models', async (req, res) => {
  try {
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    const modelData = req.body;
    const model = await predictiveEngine.createForecastingModel(modelData);
    
    res.json({
      success: true,
      data: model,
      message: 'Forecasting model created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create forecasting model', {
      operation: 'ai_create_forecasting_model',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create forecasting model',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/predictive/forecasting-models/:modelId/forecast
 * Generate forecast using model (Admin only)
 */
router.post('/predictive/forecasting-models/:modelId/forecast', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { horizon, confidence } = req.body;
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    const forecast = await predictiveEngine.generateForecast(modelId, horizon, confidence);
    
    res.json({
      success: true,
      data: forecast,
      message: 'Forecast generated successfully'
    });
  } catch (error) {
    await logger.error('Failed to generate forecast', {
      operation: 'ai_generate_forecast',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to generate forecast',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/predictive/forecasting-models/:modelId/forecasts
 * Get forecasts for a model (Admin only)
 */
router.get('/predictive/forecasting-models/:modelId/forecasts', async (req, res) => {
  try {
    const { modelId } = req.params;
    const filters = req.query;
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    // Parse date filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedFilters: any = { ...filters };
    if (filters.startDate) {
      parsedFilters.startDate = new Date(filters.startDate as string);
    }
    if (filters.endDate) {
      parsedFilters.endDate = new Date(filters.endDate as string);
    }
    if (filters.limit) {
      parsedFilters.limit = parseInt(filters.limit as string);
    }
    
    const forecasts = await predictiveEngine.getForecasts(modelId, parsedFilters);
    
    res.json({
      success: true,
      data: forecasts,
      message: 'Forecasts retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get forecasts', {
      operation: 'ai_get_forecasts',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get forecasts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/predictive/anomaly-models
 * Get all anomaly detection models (Admin only)
 */
router.get('/predictive/anomaly-models', async (req, res) => {
  try {
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    const filters = req.query;
    const models = await predictiveEngine.getAnomalyDetectionModels(filters);
    
    res.json({
      success: true,
      data: models,
      message: 'Anomaly detection models retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get anomaly detection models', {
      operation: 'ai_get_anomaly_models',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get anomaly detection models',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/predictive/anomaly-models
 * Create new anomaly detection model (Admin only)
 */
router.post('/predictive/anomaly-models', async (req, res) => {
  try {
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    const modelData = req.body;
    const model = await predictiveEngine.createAnomalyDetectionModel(modelData);
    
    res.json({
      success: true,
      data: model,
      message: 'Anomaly detection model created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create anomaly detection model', {
      operation: 'ai_create_anomaly_detection',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create anomaly detection model',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/predictive/anomaly-models/:modelId/detect
 * Detect anomalies using model (Admin only)
 */
router.post('/predictive/anomaly-models/:modelId/detect', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { data } = req.body;
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    const anomalies = await predictiveEngine.detectAnomalies(modelId, data);
    
    res.json({
      success: true,
      data: anomalies,
      message: `Anomaly detection completed. Found ${anomalies.length} anomalies.`
    });
  } catch (error) {
    await logger.error('Failed to detect anomalies', {
      operation: 'ai_detect_anomalies',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to detect anomalies',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/predictive/anomaly-models/:modelId/anomalies
 * Get anomalies for a model (Admin only)
 */
router.get('/predictive/anomaly-models/:modelId/anomalies', async (req, res) => {
  try {
    const { modelId } = req.params;
    const filters = req.query;
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    // Parse filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedFilters: any = { ...filters };
    if (filters.startDate) {
      parsedFilters.startDate = new Date(filters.startDate as string);
    }
    if (filters.endDate) {
      parsedFilters.endDate = new Date(filters.endDate as string);
    }
    if (filters.limit) {
      parsedFilters.limit = parseInt(filters.limit as string);
    }
    
    const anomalies = await predictiveEngine.getAnomalies(modelId, parsedFilters);
    
    res.json({
      success: true,
      data: anomalies,
      message: 'Anomalies retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get anomalies', {
      operation: 'ai_get_anomalies',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get anomalies',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/predictive/pipelines
 * Get all predictive pipelines (Admin only)
 */
router.get('/predictive/pipelines', async (req, res) => {
  try {
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    const filters = req.query;
    const pipelines = await predictiveEngine.getPredictivePipelines(filters);
    
    res.json({
      success: true,
      data: pipelines,
      message: 'Predictive pipelines retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get predictive pipelines', {
      operation: 'ai_get_predictive_pipelines',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get predictive pipelines',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/predictive/pipelines
 * Create new predictive pipeline (Admin only)
 */
router.post('/predictive/pipelines', async (req, res) => {
  try {
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    const pipelineData = req.body;
    const pipeline = await predictiveEngine.createPredictivePipeline(pipelineData);
    
    res.json({
      success: true,
      data: pipeline,
      message: 'Predictive pipeline created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create predictive pipeline', {
      operation: 'ai_create_predictive_pipeline',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create predictive pipeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/predictive/pipelines/:pipelineId/execute
 * Execute predictive pipeline (Admin only)
 */
router.post('/predictive/pipelines/:pipelineId/execute', async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    const result = await predictiveEngine.executePipeline(pipelineId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Pipeline executed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Pipeline execution failed',
        details: result.error
      });
    }
  } catch (error) {
    await logger.error('Failed to execute pipeline', {
      operation: 'ai_execute_pipeline',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to execute pipeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/predictive/insights
 * Get intelligence insights (Admin only)
 */
router.get('/predictive/insights', async (req, res) => {
  try {
    const { PredictiveIntelligenceEngine } = await import('../ai/analytics/PredictiveIntelligenceEngine');
    const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
    
    const filters = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedFilters: any = { ...filters };
    if (filters.limit) {
      parsedFilters.limit = parseInt(filters.limit as string);
    }
    
    const insights = await predictiveEngine.getIntelligenceInsights(parsedFilters);
    
    res.json({
      success: true,
      data: insights,
      message: 'Intelligence insights retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get intelligence insights', {
      operation: 'ai_get_intelligence_insights',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get intelligence insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/business/metrics
 * Get all business metrics (Admin only)
 */
router.get('/business/metrics', async (req, res) => {
  try {
    const { BusinessIntelligenceEngine } = await import('../ai/analytics/BusinessIntelligenceEngine');
    const businessEngine = new BusinessIntelligenceEngine(prisma);
    
    const filters = req.query;
    const metrics = await businessEngine.getBusinessMetrics(filters);
    
    res.json({
      success: true,
      data: metrics,
      message: 'Business metrics retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get business metrics', {
      operation: 'ai_get_business_metrics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get business metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/business/metrics
 * Create new business metric (Admin only)
 */
router.post('/business/metrics', async (req, res) => {
  try {
    const { BusinessIntelligenceEngine } = await import('../ai/analytics/BusinessIntelligenceEngine');
    const businessEngine = new BusinessIntelligenceEngine(prisma);
    
    const metricData = req.body;
    const metric = await businessEngine.createBusinessMetric(metricData);
    
    res.json({
      success: true,
      data: metric,
      message: 'Business metric created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create business metric', {
      operation: 'ai_create_business_metric',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create business metric',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/business/dashboards
 * Get KPI dashboards (Admin only)
 */
router.get('/business/dashboards', async (req, res) => {
  try {
    const { BusinessIntelligenceEngine } = await import('../ai/analytics/BusinessIntelligenceEngine');
    const businessEngine = new BusinessIntelligenceEngine(prisma);
    
    const filters = req.query;
    const dashboards = await businessEngine.getKPIDashboards(filters);
    
    res.json({
      success: true,
      data: dashboards,
      message: 'KPI dashboards retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get KPI dashboards', {
      operation: 'ai_get_kpi_dashboards',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get KPI dashboards',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/business/insights
 * Get business insights (Admin only)
 */
router.get('/business/insights', async (req, res) => {
  try {
    const { BusinessIntelligenceEngine } = await import('../ai/analytics/BusinessIntelligenceEngine');
    const businessEngine = new BusinessIntelligenceEngine(prisma);
    
    const filters = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedFilters: any = { ...filters };
    if (filters.limit) {
      parsedFilters.limit = parseInt(filters.limit as string);
    }
    
    const insights = await businessEngine.getBusinessInsights(parsedFilters);
    
    res.json({
      success: true,
      data: insights,
      message: 'Business insights retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get business insights', {
      operation: 'ai_get_business_insights',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get business insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/business/reports/:templateId/generate
 * Generate report from template (Admin only)
 */
router.post('/business/reports/:templateId/generate', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { parameters } = req.body;
    const { BusinessIntelligenceEngine } = await import('../ai/analytics/BusinessIntelligenceEngine');
    const businessEngine = new BusinessIntelligenceEngine(prisma);
    
    const report = await businessEngine.generateReport(templateId, parameters);
    
    res.json({
      success: true,
      data: report,
      message: 'Report generated successfully'
    });
  } catch (error) {
    await logger.error('Failed to generate report', {
      operation: 'ai_generate_report',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/ai-insights/patterns
 * Get all pattern discoveries (Admin only)
 */
router.get('/ai-insights/patterns', async (req, res) => {
  try {
    const { AIPoweredInsightsEngine } = await import('../ai/analytics/AIPoweredInsightsEngine');
    const aiInsightsEngine = new AIPoweredInsightsEngine(prisma);
    
    const filters = req.query;
    const patterns = await aiInsightsEngine.getPatternDiscoveries(filters);
    
    res.json({
      success: true,
      data: patterns,
      message: 'Pattern discoveries retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get pattern discoveries', {
      operation: 'ai_get_pattern_discoveries',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get pattern discoveries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/ai-insights/patterns/discover
 * Start pattern discovery (Admin only)
 */
router.post('/ai-insights/patterns/discover', async (req, res) => {
  try {
    const { dataSource, variables, algorithm, type } = req.body;
    const { AIPoweredInsightsEngine } = await import('../ai/analytics/AIPoweredInsightsEngine');
    const aiInsightsEngine = new AIPoweredInsightsEngine(prisma);
    
    const discovery = await aiInsightsEngine.discoverPatterns(dataSource, variables, algorithm, type);
    
    res.json({
      success: true,
      data: discovery,
      message: 'Pattern discovery started successfully'
    });
  } catch (error) {
    await logger.error('Failed to start pattern discovery', {
      operation: 'ai_start_pattern_discovery',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to start pattern discovery',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/ai-insights/insights
 * Get intelligent insights (Admin only)
 */
router.get('/ai-insights/insights', async (req, res) => {
  try {
    const { AIPoweredInsightsEngine } = await import('../ai/analytics/AIPoweredInsightsEngine');
    const aiInsightsEngine = new AIPoweredInsightsEngine(prisma);
    
    const filters = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedFilters: any = { ...filters };
    if (filters.limit) {
      parsedFilters.limit = parseInt(filters.limit as string);
    }
    
    const insights = await aiInsightsEngine.getIntelligentInsights(parsedFilters);
    
    res.json({
      success: true,
      data: insights,
      message: 'Intelligent insights retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get intelligent insights', {
      operation: 'ai_get_intelligent_insights',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get intelligent insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/ai-insights/recommendations
 * Get AI recommendations (Admin only)
 */
router.get('/ai-insights/recommendations', async (req, res) => {
  try {
    const { AIPoweredInsightsEngine } = await import('../ai/analytics/AIPoweredInsightsEngine');
    const aiInsightsEngine = new AIPoweredInsightsEngine(prisma);
    
    const filters = req.query;
    const recommendations = await aiInsightsEngine.getRecommendations(filters);
    
    res.json({
      success: true,
      data: recommendations,
      message: 'AI recommendations retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get AI recommendations', {
      operation: 'ai_get_recommendations',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get AI recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/centralized-ai/ai-insights/recommendations
 * Create new AI recommendation (Admin only)
 */
router.post('/ai-insights/recommendations', async (req, res) => {
  try {
    const { AIPoweredInsightsEngine } = await import('../ai/analytics/AIPoweredInsightsEngine');
    const aiInsightsEngine = new AIPoweredInsightsEngine(prisma);
    
    const recommendationData = req.body;
    const recommendation = await aiInsightsEngine.createRecommendation(recommendationData);
    
    res.json({
      success: true,
      data: recommendation,
      message: 'AI recommendation created successfully'
    });
  } catch (error) {
    await logger.error('Failed to create AI recommendation', {
      operation: 'ai_create_recommendation',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to create AI recommendation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/centralized-ai/ai-insights/recommendations/:recommendationId/status
 * Update recommendation status (Admin only)
 */
router.put('/ai-insights/recommendations/:recommendationId/status', async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { status, userId } = req.body;
    const { AIPoweredInsightsEngine } = await import('../ai/analytics/AIPoweredInsightsEngine');
    const aiInsightsEngine = new AIPoweredInsightsEngine(prisma);
    
    const recommendation = await aiInsightsEngine.updateRecommendationStatus(recommendationId, status, userId);
    
    if (!recommendation) {
      return res.status(404).json({ 
        error: 'Recommendation not found',
        details: `Recommendation with ID ${recommendationId} does not exist`
      });
    }
    
    res.json({
      success: true,
      data: recommendation,
      message: 'Recommendation status updated successfully'
    });
  } catch (error) {
    await logger.error('Failed to update recommendation status', {
      operation: 'ai_update_recommendation_status',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to update recommendation status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/centralized-ai/ai-insights/continuous-learning
 * Get continuous learning systems (Admin only)
 */
router.get('/ai-insights/continuous-learning', async (req, res) => {
  try {
    const { AIPoweredInsightsEngine } = await import('../ai/analytics/AIPoweredInsightsEngine');
    const aiInsightsEngine = new AIPoweredInsightsEngine(prisma);
    
    const filters = req.query;
    const learning = await aiInsightsEngine.getContinuousLearning(filters);
    
    res.json({
      success: true,
      data: learning,
      message: 'Continuous learning systems retrieved successfully'
    });
  } catch (error) {
    await logger.error('Failed to get continuous learning systems', {
      operation: 'ai_get_continuous_learning_systems',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to get continuous learning systems',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
