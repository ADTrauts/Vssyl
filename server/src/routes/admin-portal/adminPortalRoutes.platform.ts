import type { Request, Response } from 'express';
import type express from 'express';
import type { Prisma } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { authenticateJWT } from '../../middleware/auth';
import { AdminService } from '../../services/adminService';
import { logger } from '../../lib/logger';
import { requireAdmin, ALLOWED_CONTENT_REPORT_STATUSES } from './adminPortalShared';

export function registerAdminPortalPlatformRoutes(router: express.Router): void {
// Business Intelligence Routes
router.get('/business-intelligence', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { dateRange, userType } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const data = await AdminService.getBusinessIntelligence({
      dateRange: dateRange as string,
      userType: userType as string
    });

    await logger.info('Admin retrieved business intelligence data', {
      operation: 'admin_get_business_intelligence',
      adminId: adminUser.id,
      filters: req.query
    });

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    await logger.error('Failed to get business intelligence data', {
      operation: 'admin_get_business_intelligence',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get business intelligence data' });
  }
});

router.get('/business-intelligence/export', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { dateRange, userType, format } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const exportData = await AdminService.exportBusinessIntelligence({
      dateRange: dateRange as string,
      userType: userType as string
    });

    await logger.info('Admin exported business intelligence data', {
      operation: 'admin_export_business_intelligence',
      adminId: adminUser.id
    });

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="business-intelligence-report.pdf"');
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="business-intelligence-report.csv"');
    }
    
    res.send(exportData);
  } catch (error) {
    await logger.error('Failed to export business intelligence data', {
      operation: 'admin_export_business_intelligence',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to export business intelligence data' });
  }
});

router.post('/business-intelligence/ab-tests', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const testData = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await AdminService.createABTest(testData, adminUser.id);

    await logger.info('Admin created A/B test', {
      operation: 'admin_create_ab_test',
      adminId: adminUser.id,
      testName: testData.name
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to create A/B test', {
      operation: 'admin_create_ab_test',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to create A/B test' });
  }
});

router.get('/business-intelligence/ab-tests/:testId/results', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const results = await AdminService.getABTestResults(testId);

    await logger.info('Admin retrieved A/B test results', {
      operation: 'admin_get_ab_test_results',
      adminId: adminUser.id,
      testId
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    await logger.error('Failed to get A/B test results', {
      operation: 'admin_get_ab_test_results',
      testId: req.params.testId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get A/B test results' });
  }
});

router.patch('/business-intelligence/ab-tests/:testId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const updates = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await AdminService.updateABTest(testId, updates, adminUser.id);

    await logger.info('Admin updated A/B test', {
      operation: 'admin_update_ab_test',
      adminId: adminUser.id,
      testId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to update A/B test', {
      operation: 'admin_update_ab_test',
      testId: req.params.testId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update A/B test' });
  }
});

router.get('/business-intelligence/user-segments', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const segments = await AdminService.getUserSegments();

    await logger.info('Admin retrieved user segments', {
      operation: 'admin_get_user_segments',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    await logger.error('Failed to get user segments', {
      operation: 'admin_get_user_segments',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get user segments' });
  }
});

router.post('/business-intelligence/user-segments', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const segmentData = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await AdminService.createUserSegment(segmentData, adminUser.id);

    await logger.info('Admin created user segment', {
      operation: 'admin_create_user_segment',
      adminId: adminUser.id,
      segmentName: segmentData.name
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to create user segment', {
      operation: 'admin_create_user_segment',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to create user segment' });
  }
});

router.get('/business-intelligence/predictive-insights', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const insights = await AdminService.getPredictiveInsights();

    await logger.info('Admin retrieved predictive insights', {
      operation: 'admin_get_predictive_insights',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    await logger.error('Failed to get predictive insights', {
      operation: 'admin_get_predictive_insights',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get predictive insights' });
  }
});

router.get('/business-intelligence/competitive-analysis', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const analysis = await AdminService.getCompetitiveAnalysis();

    await logger.info('Admin retrieved competitive analysis', {
      operation: 'admin_get_competitive_analysis',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    await logger.error('Failed to get competitive analysis', {
      operation: 'admin_get_competitive_analysis',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get competitive analysis' });
  }
});

router.post('/business-intelligence/custom-report', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const reportConfig = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const report = await AdminService.generateCustomReport(reportConfig, adminUser.id);

    await logger.info('Admin generated custom report', {
      operation: 'admin_generate_custom_report',
      adminId: adminUser.id,
      reportName: reportConfig.name
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    await logger.error('Failed to generate custom report', {
      operation: 'admin_generate_custom_report',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to generate custom report' });
  }
});

// Customer Support Routes
router.get('/support/tickets', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, priority, category, dateRange } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const tickets = await AdminService.getSupportTickets({
      status: status as string,
      priority: priority as string,
      category: category as string,
      dateRange: dateRange as string
    });

    await logger.info('Admin retrieved support tickets', {
      operation: 'admin_get_support_tickets',
      adminId: adminUser.id,
      filters: req.query
    });

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    await logger.error('Failed to get support tickets', {
      operation: 'admin_get_support_tickets',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get support tickets' });
  }
});

router.get('/support/stats', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const stats = await AdminService.getSupportStats();

    await logger.info('Admin retrieved support statistics', {
      operation: 'admin_get_support_stats',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    await logger.error('Failed to get support statistics', {
      operation: 'admin_get_support_stats',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get support stats' });
  }
});

router.patch('/support/tickets/:ticketId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { action, data } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await AdminService.updateSupportTicket(ticketId, action, data, adminUser.id);

    await logger.info('Admin updated support ticket', {
      operation: 'admin_update_support_ticket',
      adminId: adminUser.id,
      ticketId,
      action
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to update support ticket', {
      operation: 'admin_update_support_ticket',
      ticketId: req.params.ticketId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update support ticket' });
  }
});

router.get('/support/knowledge-base', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const articles = await AdminService.getKnowledgeBase();

    await logger.info('Admin retrieved knowledge base', {
      operation: 'admin_get_knowledge_base',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    await logger.error('Failed to get knowledge base', {
      operation: 'admin_get_knowledge_base',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get knowledge base' });
  }
});

router.patch('/support/knowledge-base/:articleId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    const { action, data } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await AdminService.updateKnowledgeArticle(articleId, action, data, adminUser.id);

    await logger.info('Admin updated knowledge article', {
      operation: 'admin_update_knowledge_article',
      adminId: adminUser.id,
      articleId,
      action
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to update knowledge article', {
      operation: 'admin_update_knowledge_article',
      articleId: req.params.articleId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update knowledge article' });
  }
});

router.get('/support/live-chats', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const chats = await AdminService.getLiveChats();

    await logger.info('Admin retrieved live chats', {
      operation: 'admin_get_live_chats',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    await logger.error('Failed to get live chats', {
      operation: 'admin_get_live_chats',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get live chats' });
  }
});

router.post('/support/live-chats/:chatId/join', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await AdminService.joinLiveChat(chatId, adminUser.id);

    await logger.info('Admin joined live chat', {
      operation: 'admin_join_live_chat',
      adminId: adminUser.id,
      chatId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to join live chat', {
      operation: 'admin_join_live_chat',
      chatId: req.params.chatId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to join live chat' });
  }
});

router.get('/support/analytics', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const analytics = await AdminService.getSupportAnalytics();

    await logger.info('Admin retrieved support analytics', {
      operation: 'admin_get_support_analytics',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    await logger.error('Failed to get support analytics', {
      operation: 'admin_get_support_analytics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get support analytics' });
  }
});

router.post('/support/tickets', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const ticketData = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await AdminService.createSupportTicket(ticketData, adminUser.id);

    await logger.info('Admin created support ticket', {
      operation: 'admin_create_support_ticket',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to create support ticket', {
      operation: 'admin_create_support_ticket',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// Customer-facing support ticket creation (no authentication required)
router.post('/support/tickets/customer', async (req: Request, res: Response) => {
  try {
    const { title, description, category, priority, contactEmail, contactPhone, userId, userName } = req.body;

    // Validate required fields
    if (!title || !description || !category || !priority || !contactEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create the ticket using AdminService
    const ticketData = {
      title,
      description,
      category,
      priority,
      status: 'open',
      customerId: userId || null,
      customerEmail: contactEmail,
      customerPhone: contactPhone,
      customerName: userName || 'Anonymous',
    };

    const result = await AdminService.createSupportTicket(ticketData);

    await logger.info('Customer support ticket created', {
      operation: 'customer_create_support_ticket',
      ticketId: (result as any).id
    });

    res.json({
      success: true,
      data: {
        ticketId: (result as any).id,
        message: 'Support ticket created successfully'
      }
    });
  } catch (error) {
    await logger.error('Failed to create customer support ticket', {
      operation: 'customer_create_support_ticket',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

router.post('/support/knowledge-base', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const articleData = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await AdminService.createKnowledgeArticle(articleData, adminUser.id);

    await logger.info('Admin created knowledge article', {
      operation: 'admin_create_knowledge_article',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to create knowledge article', {
      operation: 'admin_create_knowledge_article',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to create knowledge article' });
  }
});

router.get('/support/export', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, priority, category, dateRange, format } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const exportData = await AdminService.exportSupportData({
      status: status as string,
      priority: priority as string,
      category: category as string,
      dateRange: dateRange as string
    });

    await logger.info('Admin exported support data', {
      operation: 'admin_export_support_data',
      adminId: adminUser.id
    });

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="support-report.pdf"');
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="support-report.csv"');
    }
    
    res.send(exportData);
  } catch (error) {
    await logger.error('Failed to export support data', {
      operation: 'admin_export_support_data',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to export support data' });
  }
});

// Performance & Scalability Routes
router.get('/performance/metrics', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { timeRange, metricType } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const metrics = await AdminService.getPerformanceMetrics({
      timeRange: timeRange as string,
      metricType: metricType as string
    });

    await logger.info('Admin retrieved performance metrics', {
      operation: 'admin_get_performance_metrics',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    await logger.error('Failed to get performance metrics', {
      operation: 'admin_get_performance_metrics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

router.get('/performance/scalability', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const scalability = await AdminService.getScalabilityMetrics();

    await logger.info('Admin retrieved scalability metrics', {
      operation: 'admin_get_scalability_metrics',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: scalability
    });
  } catch (error) {
    await logger.error('Failed to get scalability metrics', {
      operation: 'admin_get_scalability_metrics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get scalability metrics' });
  }
});

router.get('/performance/optimization', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const recommendations = await AdminService.getOptimizationRecommendations();

    await logger.info('Admin retrieved optimization recommendations', {
      operation: 'admin_get_optimization_recommendations',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    await logger.error('Failed to get optimization recommendations', {
      operation: 'admin_get_optimization_recommendations',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get optimization recommendations' });
  }
});

router.patch('/performance/optimization/:recommendationId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { recommendationId } = req.params;
    const { action } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await AdminService.updateOptimizationRecommendation(recommendationId, action, adminUser.id);

    await logger.info('Admin updated optimization recommendation', {
      operation: 'admin_update_optimization_recommendation',
      adminId: adminUser.id,
      recommendationId,
      action
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to update optimization recommendation', {
      operation: 'admin_update_optimization_recommendation',
      recommendationId: req.params.recommendationId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update optimization recommendation' });
  }
});

router.get('/performance/alerts', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { severity, status } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const alerts = await AdminService.getPerformanceAlerts({
      severity: severity as string,
      status: status as string
    });

    await logger.info('Admin retrieved performance alerts', {
      operation: 'admin_get_performance_alerts',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    await logger.error('Failed to get performance alerts', {
      operation: 'admin_get_performance_alerts',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get performance alerts' });
  }
});

router.patch('/performance/alerts/:alertId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { action } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await AdminService.updatePerformanceAlert(alertId, action, adminUser.id);

    await logger.info('Admin updated performance alert', {
      operation: 'admin_update_performance_alert',
      adminId: adminUser.id,
      alertId,
      action
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to update performance alert', {
      operation: 'admin_update_performance_alert',
      alertId: req.params.alertId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update performance alert' });
  }
});

router.get('/performance/analytics', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const analytics = await AdminService.getPerformanceAnalytics();

    await logger.info('Admin retrieved performance analytics', {
      operation: 'admin_get_performance_analytics',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    await logger.error('Failed to get performance analytics', {
      operation: 'admin_get_performance_analytics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get performance analytics' });
  }
});

router.post('/performance/alerts/configure', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const alertConfig = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await AdminService.configurePerformanceAlert(alertConfig, adminUser.id);

    await logger.info('Admin configured performance alert', {
      operation: 'admin_configure_performance_alert',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to configure performance alert', {
      operation: 'admin_configure_performance_alert',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to configure performance alert' });
  }
});

// Database schema diagnostic endpoint
router.get('/database/schema-check', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check critical tables that are causing 500 errors
    const criticalTables = [
      'pricing_configs',
      'price_changes',
      'module_ai_context_registry',
      'subscriptions',
      'invoices',
      'developer_revenues',
      'content_reports',
      'security_events',
      'module_subscriptions'
    ];

    const tableChecks = await Promise.all(
      criticalTables.map(async (tableName) => {
        try {
          const result = await prisma.$queryRaw<Array<{table_name: string}>>`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName};
          `;
          return {
            table: tableName,
            exists: result.length > 0,
            error: null
          };
        } catch (error) {
          return {
            table: tableName,
            exists: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Check migration status
    let migrationStatus = 'unknown';
    let appliedMigrations = 0;
    try {
      const migrations = await prisma.$queryRaw<Array<{migration_name: string}>>`
        SELECT migration_name 
        FROM _prisma_migrations 
        ORDER BY finished_at DESC 
        LIMIT 10;
      `;
      appliedMigrations = migrations.length;
      migrationStatus = 'connected';
    } catch (error) {
      migrationStatus = 'error';
    }

    // Get all tables for reference
    let allTables: string[] = [];
    try {
      const tables = await prisma.$queryRaw<Array<{table_name: string}>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;
      allTables = tables.map(t => t.table_name);
    } catch (error) {
      // Ignore error
    }

    await logger.info('Admin checked database schema', {
      operation: 'admin_database_schema_check',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      criticalTables: tableChecks,
      migrationStatus,
      appliedMigrations,
      allTables: allTables.slice(0, 50), // Limit to first 50 for readability
      totalTables: allTables.length,
      missingTables: tableChecks.filter(t => !t.exists).map(t => t.table)
    });
  } catch (error) {
    await logger.error('Failed to check database schema', {
      operation: 'admin_database_schema_check',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to check database schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual migration trigger endpoint
router.post('/database/run-migrations', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { execSync } = require('child_process');
    const path = require('path');
    const fs = require('fs');

    const projectRoot = path.join(__dirname, '../..');
    const schemaPath = path.join(projectRoot, 'prisma/schema.prisma');
    const migrationsDir = path.join(projectRoot, 'prisma/migrations');

    // Verify paths exist
    if (!fs.existsSync(schemaPath)) {
      return res.status(500).json({ 
        success: false,
        error: 'Prisma schema not found',
        path: schemaPath
      });
    }

    if (!fs.existsSync(migrationsDir)) {
      return res.status(500).json({ 
        success: false,
        error: 'Migrations directory not found',
        path: migrationsDir
      });
    }

    // Build schema first
    const buildScriptPath = path.join(projectRoot, 'scripts/build-prisma-schema.js');
    try {
      execSync(`node ${buildScriptPath}`, {
        stdio: 'pipe',
        env: process.env,
        cwd: projectRoot,
        timeout: 30000
      });
    } catch (buildError) {
      await logger.warn('Schema build failed, continuing anyway', {
        operation: 'admin_run_migrations',
        error: {
          message: buildError instanceof Error ? buildError.message : 'Unknown error',
          stack: buildError instanceof Error ? buildError.stack : undefined,
        }
      });
    }

    // Run migrations
    const migrationUrl = process.env.DATABASE_MIGRATE_URL || process.env.DATABASE_URL;
    const migrationEnv = {
      ...process.env,
      DATABASE_URL: migrationUrl
    };

    let migrationOutput = '';
    let migrationSuccess = false;
    try {
      const output = execSync(`npx prisma migrate deploy --schema ${schemaPath}`, {
        stdio: 'pipe',
        env: migrationEnv,
        cwd: projectRoot,
        timeout: 120000,
        encoding: 'utf-8'
      });
      migrationOutput = output.toString();
      migrationSuccess = true;
    } catch (migrationError: unknown) {
      const errorMessage = migrationError instanceof Error ? migrationError.message : String(migrationError);
      migrationOutput = errorMessage;
      migrationSuccess = false;
    }

    await logger.info('Admin triggered manual migration', {
      operation: 'admin_run_migrations',
      adminId: adminUser.id,
      success: migrationSuccess
    });

    res.json({
      success: migrationSuccess,
      message: migrationSuccess ? 'Migrations applied successfully' : 'Migration failed',
      output: migrationOutput,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await logger.error('Failed to run migrations', {
      operation: 'admin_run_migrations',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to run migrations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// View all migrations and their status
router.get('/database/migrations', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Query the _prisma_migrations table
    const migrations = await prisma.$queryRaw<Array<{
      id: string;
      migration_name: string;
      started_at: Date;
      finished_at: Date | null;
      checksum: string;
      applied_steps_count: number;
      rolled_back_at: Date | null;
      logs: string | null;
    }>>`
      SELECT id, migration_name, started_at, finished_at, checksum, applied_steps_count, rolled_back_at, logs
      FROM "_prisma_migrations"
      ORDER BY started_at DESC;
    `;

    // Determine status for each migration
    const migrationsWithStatus = migrations.map(m => ({
      ...m,
      status: m.rolled_back_at 
        ? 'rolled_back' 
        : m.finished_at 
          ? 'applied' 
          : 'failed',
      startedAt: m.started_at,
      finishedAt: m.finished_at,
      rolledBackAt: m.rolled_back_at
    }));

    const failedMigrations = migrationsWithStatus.filter(m => m.status === 'failed');
    const appliedMigrations = migrationsWithStatus.filter(m => m.status === 'applied');

    await logger.info('Admin viewed migration status', {
      operation: 'admin_view_migrations',
      adminId: adminUser.id,
      totalMigrations: migrations.length,
      failedCount: failedMigrations.length
    });

    res.json({
      success: true,
      totalMigrations: migrations.length,
      appliedCount: appliedMigrations.length,
      failedCount: failedMigrations.length,
      migrations: migrationsWithStatus,
      failedMigrations: failedMigrations.map(m => m.migration_name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await logger.error('Failed to view migrations', {
      operation: 'admin_view_migrations',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to view migrations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fix failed migrations by marking them as applied
router.post('/database/migrations/fix-failed', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { migrationName } = req.body;

    // Find failed migrations
    const failedMigrations = await prisma.$queryRaw<Array<{
      id: string;
      migration_name: string;
      started_at: Date;
    }>>`
      SELECT id, migration_name, started_at
      FROM "_prisma_migrations"
      WHERE finished_at IS NULL AND rolled_back_at IS NULL;
    `;

    if (failedMigrations.length === 0) {
      return res.json({
        success: true,
        message: 'No failed migrations found',
        fixed: []
      });
    }

    // If a specific migration name is provided, only fix that one
    const migrationsToFix = migrationName 
      ? failedMigrations.filter(m => m.migration_name === migrationName)
      : failedMigrations;

    if (migrationsToFix.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Migration ${migrationName} not found or not in failed state`,
        failedMigrations: failedMigrations.map(m => m.migration_name)
      });
    }

    // Mark each failed migration as applied by setting finished_at
    const fixed: string[] = [];
    for (const migration of migrationsToFix) {
      await prisma.$executeRaw`
        UPDATE "_prisma_migrations"
        SET finished_at = NOW(),
            logs = COALESCE(logs, '') || E'\n[ADMIN FIX] Marked as applied by admin at ' || NOW()::text
        WHERE id = ${migration.id};
      `;
      fixed.push(migration.migration_name);
    }

    await logger.info('Admin fixed failed migrations', {
      operation: 'admin_fix_migrations',
      adminId: adminUser.id,
      fixedMigrations: fixed
    });

    res.json({
      success: true,
      message: `Fixed ${fixed.length} failed migration(s)`,
      fixed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await logger.error('Failed to fix migrations', {
      operation: 'admin_fix_migrations',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to fix migrations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete orphaned or problematic migration records
router.post('/database/migrations/delete', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { migrationName, deleteAll } = req.body;

    if (!migrationName && !deleteAll) {
      return res.status(400).json({
        success: false,
        error: 'Either migrationName or deleteAll must be provided'
      });
    }

    let deleted: string[] = [];

    if (deleteAll) {
      // Nuclear option: delete all migration records (use with caution!)
      const allMigrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name FROM "_prisma_migrations";
      `;
      
      await prisma.$executeRaw`DELETE FROM "_prisma_migrations";`;
      deleted = allMigrations.map(m => m.migration_name);

      await logger.warn('Admin deleted ALL migration records', {
        operation: 'admin_delete_all_migrations',
        adminId: adminUser.id,
        deletedCount: deleted.length
      });
    } else {
      // Delete specific migration record
      const migration = await prisma.$queryRaw<Array<{ id: string; migration_name: string }>>`
        SELECT id, migration_name FROM "_prisma_migrations"
        WHERE migration_name = ${migrationName};
      `;

      if (migration.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Migration ${migrationName} not found`
        });
      }

      await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations"
        WHERE migration_name = ${migrationName};
      `;
      deleted = [migrationName];

      await logger.info('Admin deleted migration record', {
        operation: 'admin_delete_migration',
        adminId: adminUser.id,
        migrationName
      });
    }

    res.json({
      success: true,
      message: `Deleted ${deleted.length} migration record(s)`,
      deleted,
      warning: deleteAll 
        ? 'All migration records deleted. Run migrations again to re-apply them.' 
        : undefined,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await logger.error('Failed to delete migration', {
      operation: 'admin_delete_migration',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reset migrations and mark baseline as applied (for fresh database starts)
router.post('/database/migrations/reset-baseline', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const fs = require('fs');
    const path = require('path');
    const projectRoot = path.join(__dirname, '../..');
    const migrationsDir = path.join(projectRoot, 'prisma/migrations');

    // Get all migration directories
    const migrationDirs = fs.readdirSync(migrationsDir)
      .filter((f: string) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
      .sort();

    // Clear existing migration records
    await prisma.$executeRaw`DELETE FROM "_prisma_migrations";`;

    // Insert fresh records for each migration, marking them as applied
    const applied: string[] = [];
    for (const migrationName of migrationDirs) {
      const migrationPath = path.join(migrationsDir, migrationName, 'migration.sql');
      
      if (fs.existsSync(migrationPath)) {
        // Read the migration file to get its checksum
        const content = fs.readFileSync(migrationPath, 'utf-8');
        const crypto = require('crypto');
        const checksum = crypto.createHash('sha256').update(content).digest('hex');

        // Insert the migration record as applied
        await prisma.$executeRaw`
          INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
          VALUES (
            ${crypto.randomUUID()},
            ${checksum},
            ${migrationName},
            NOW(),
            NOW(),
            1
          );
        `;
        applied.push(migrationName);
      }
    }

    await logger.info('Admin reset migrations to baseline', {
      operation: 'admin_reset_baseline',
      adminId: adminUser.id,
      appliedMigrations: applied
    });

    res.json({
      success: true,
      message: `Reset migration table and marked ${applied.length} migrations as applied`,
      appliedMigrations: applied,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await logger.error('Failed to reset migrations', {
      operation: 'admin_reset_baseline',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to reset migrations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/performance/export', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { timeRange, metricType, format } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const exportData = await AdminService.exportPerformanceData({
      timeRange: timeRange as string,
      metricType: metricType as string,
      format: format as string
    });

    await logger.info('Admin exported performance data', {
      operation: 'admin_export_performance_data',
      adminId: adminUser.id
    });

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="performance-report.pdf"');
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="performance-report.csv"');
    }

    res.send(exportData);
  } catch (error) {
    await logger.error('Failed to export performance data', {
      operation: 'admin_export_performance_data',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to export performance data' });
  }
});

// ============================================================================
// INTEGRATION STATUS & DIAGNOSTICS
// ============================================================================

/**
 * Helper: Run a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutError: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutError)), ms))
  ]);
}

/**
 * GET /api/admin-portal/integrations/status
 * Comprehensive diagnostic endpoint for all external integrations
 * Tests Stripe, OpenAI, and Anthropic connectivity (with timeouts)
 */
router.get('/integrations/status', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  const TIMEOUT_MS = 5000; // 5 second timeout for each check
  
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all env vars upfront
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // Initialize results structure
    const integrations: Record<string, {
      configured: boolean;
      status: 'healthy' | 'error' | 'not_configured' | 'timeout';
      error?: string;
      details?: Record<string, unknown>;
    }> = {
      stripe: {
        configured: !!(stripeKey && stripeKey.length > 10),
        status: 'not_configured',
        details: {
          keyPrefix: stripeKey ? stripeKey.substring(0, 12) + '...' : null,
          keyLength: stripeKey?.length || 0,
          isTestMode: stripeKey?.startsWith('sk_test_') || false,
          isLiveMode: stripeKey?.startsWith('sk_live_') || false,
          webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET
        }
      },
      openai: {
        configured: !!(openaiKey && openaiKey.length > 10),
        status: 'not_configured',
        details: {
          keyPrefix: openaiKey ? openaiKey.substring(0, 10) + '...' : null,
          keyLength: openaiKey?.length || 0,
          adminKeyConfigured: !!process.env.OPENAI_ADMIN_API_KEY
        }
      },
      anthropic: {
        configured: !!(anthropicKey && anthropicKey.length > 10),
        status: 'not_configured',
        details: {
          keyPrefix: anthropicKey ? anthropicKey.substring(0, 10) + '...' : null,
          keyLength: anthropicKey?.length || 0
        }
      },
      database: {
        configured: !!process.env.DATABASE_URL,
        status: 'not_configured',
        details: {
          urlConfigured: !!process.env.DATABASE_URL,
          directUrlConfigured: !!process.env.DIRECT_URL
        }
      },
      storage: {
        configured: process.env.STORAGE_PROVIDER === 'gcs',
        status: 'not_configured',
        details: {
          provider: process.env.STORAGE_PROVIDER || 'local',
          bucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET || null,
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || null
        }
      }
    };

    // Run all checks in parallel with timeouts
    const checks = await Promise.allSettled([
      // 1. Stripe check
      (async () => {
        if (!stripeKey || stripeKey.length < 10) return;
        const Stripe = require('stripe');
        // Use default API version (SDK version) and longer timeout
        const stripe = new Stripe(stripeKey, { 
          timeout: 10000, // 10 second timeout
          maxNetworkRetries: 1 // Reduce retries for faster feedback
        });
        await withTimeout(stripe.customers.list({ limit: 1 }), TIMEOUT_MS, 'Stripe API timeout');
        integrations.stripe.status = 'healthy';
      })(),
      
      // 2. OpenAI check
      (async () => {
        if (!openaiKey || openaiKey.length < 10) return;
        const OpenAI = require('openai');
        const client = new OpenAI({ apiKey: openaiKey, timeout: TIMEOUT_MS });
        await withTimeout(client.models.list(), TIMEOUT_MS, 'OpenAI API timeout');
        integrations.openai.status = 'healthy';
      })(),
      
      // 3. Anthropic check - just verify key format, don't make API call (costs money)
      (async () => {
        if (!anthropicKey || anthropicKey.length < 10) return;
        // Anthropic keys start with 'sk-ant-'
        if (anthropicKey.startsWith('sk-ant-')) {
          integrations.anthropic.status = 'healthy';
          integrations.anthropic.details = {
            ...integrations.anthropic.details,
            keyFormat: 'valid'
          };
        } else {
          integrations.anthropic.status = 'error';
          integrations.anthropic.error = 'Invalid key format (should start with sk-ant-)';
        }
      })(),
      
      // 4. Database check
      (async () => {
        await withTimeout(prisma.$queryRaw`SELECT 1`, TIMEOUT_MS, 'Database connection timeout');
        integrations.database.status = 'healthy';
      })(),
      
      // 5. Storage check
      (async () => {
        if (process.env.STORAGE_PROVIDER !== 'gcs') {
          integrations.storage.status = 'healthy'; // Local storage always works
          return;
        }
        const { Storage } = require('@google-cloud/storage');
        const storage = new Storage();
        const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);
        await withTimeout(bucket.exists(), TIMEOUT_MS, 'GCS connection timeout');
        integrations.storage.status = 'healthy';
      })()
    ]);

    // Process results and capture errors with full details
    const checkNames = ['stripe', 'openai', 'anthropic', 'database', 'storage'];
    checks.forEach((result, index) => {
      const name = checkNames[index];
      if (result.status === 'rejected') {
        const error = result.reason;
        if (integrations[name].configured) {
          if (error.message?.includes('timeout')) {
            integrations[name].status = 'timeout';
          } else {
            integrations[name].status = 'error';
          }
          // Capture full error details
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorCode = (error as any)?.code || (error as any)?.type || null;
          const errorStatus = (error as any)?.statusCode || (error as any)?.status || null;
          integrations[name].error = errorMessage;
          integrations[name].details = {
            ...integrations[name].details,
            errorCode,
            errorStatus,
            errorType: error?.constructor?.name || 'Unknown'
          };
        }
      }
    });

    // Calculate overall status
    const statuses = Object.values(integrations).map(i => i.status);
    const overallStatus = statuses.every(s => s === 'healthy') 
      ? 'healthy' 
      : statuses.some(s => s === 'error' || s === 'timeout') 
        ? 'degraded' 
        : 'partial';

    // Log the check
    await logger.info('Integration status check performed', {
      operation: 'admin_integration_status_check',
      adminId: adminUser.id,
      overallStatus
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      overallStatus,
      integrations,
      recommendations: generateRecommendations(integrations)
    });

  } catch (error) {
    await logger.error('Failed to check integration status', {
      operation: 'admin_integration_status_check',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ 
      error: 'Failed to check integration status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Helper function to generate recommendations based on integration status
 */
function generateRecommendations(integrations: Record<string, { configured: boolean; status: string; error?: string; details?: Record<string, unknown> }>): string[] {
  const recommendations: string[] = [];

  if (!integrations.stripe?.configured) {
    recommendations.push('Stripe: Add STRIPE_SECRET_KEY to GCP Secret Manager as "stripe-secret-key"');
  } else if (integrations.stripe?.status === 'error' || integrations.stripe?.status === 'timeout') {
    recommendations.push(`Stripe: ${integrations.stripe.error || 'Check API key validity'}`);
  }

  if (!integrations.openai?.configured) {
    recommendations.push('OpenAI: Add OPENAI_API_KEY to GCP Secret Manager as "openai-api-key"');
  } else if (integrations.openai?.status === 'error' || integrations.openai?.status === 'timeout') {
    recommendations.push(`OpenAI: ${integrations.openai.error || 'Check API key validity'}`);
  }

  if (!integrations.anthropic?.configured) {
    recommendations.push('Anthropic: Add ANTHROPIC_API_KEY to GCP Secret Manager as "anthropic-api-key"');
  } else if (integrations.anthropic?.status === 'error') {
    recommendations.push(`Anthropic: ${integrations.anthropic.error || 'Check API key validity'}`);
  }

  if (integrations.database?.status === 'error' || integrations.database?.status === 'timeout') {
    recommendations.push('Database: Check DATABASE_URL connection string and VPC connectivity');
  }

  if (integrations.storage?.status === 'error' || integrations.storage?.status === 'timeout') {
    recommendations.push('Storage: Check GCS bucket permissions and service account');
  }

  if (recommendations.length === 0) {
    recommendations.push('All integrations are healthy!');
  }

  return recommendations;
}

}
