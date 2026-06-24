import type { Request, Response } from 'express';
import type express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { requireAdmin } from './adminPortalShared';
import * as adminModerationService from '../../services/admin/adminModerationService';
import * as adminModuleGovernanceService from '../../services/admin/adminModuleGovernanceService';
import * as adminSecurityService from '../../services/admin/adminSecurityService';
import * as adminBillingService from '../../services/admin/adminBillingService';
import * as adminAnalyticsService from '../../services/admin/adminAnalyticsService';
import * as adminSystemOpsService from '../../services/admin/adminSystemOpsService';

export function registerAdminPortalAnalyticsOpsRoutes(router: express.Router): void {
// ============================================================================
// PLATFORM ANALYTICS
// ============================================================================

// Get system metrics
router.get('/analytics/system', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const timeRange = typeof req.query.timeRange === 'string' ? req.query.timeRange : '24h';
    const metrics = await adminAnalyticsService.getSystemMetricsForTimeRange(timeRange);

    res.json(metrics);
  } catch (error) {
    await logger.error('Failed to fetch system metrics', {
      operation: 'admin_get_system_metrics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
});

// Get user analytics
router.get('/analytics/users', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const timeRange = typeof req.query.timeRange === 'string' ? req.query.timeRange : '30d';
    const userStats = await adminAnalyticsService.getUserAnalyticsGrouped(timeRange);

    res.json(userStats);
  } catch (error) {
    await logger.error('Failed to fetch user analytics', {
      operation: 'admin_get_user_analytics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Analytics routes
router.get('/analytics', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    const analyticsData = await adminAnalyticsService.getAnalytics(filters);
    res.json(analyticsData);
  } catch (error) {
    await logger.error('Failed to fetch analytics', {
      operation: 'admin_get_analytics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

router.post('/analytics/export', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { format } = req.query;
    const filters = req.body;
    const exportData = await adminAnalyticsService.exportAnalytics(filters, format as string);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.json"`);
    }
    
    res.send(exportData);
  } catch (error) {
    await logger.error('Failed to export analytics', {
      operation: 'admin_export_analytics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

router.get('/analytics/realtime', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const realtimeData = await adminAnalyticsService.getRealTimeMetrics();
    res.json(realtimeData);
  } catch (error) {
    await logger.error('Failed to fetch real-time metrics', {
      operation: 'admin_get_realtime_metrics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch real-time metrics' });
  }
});

router.post('/analytics/custom-report', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const reportConfig = req.body;
    const customReport = await adminAnalyticsService.generateCustomReport(reportConfig);
    res.json(customReport);
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

// ============================================================================
// FINANCIAL MANAGEMENT
// ============================================================================

// Get subscription data
router.get('/billing/subscriptions', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await adminBillingService.getSubscriptions({
      page: Number(page),
      limit: Number(limit),
      status: status as string
    });

    if (result.schemaOutOfSync) {
      return res.json({
        subscriptions: [],
        total: 0,
        page: Number(page),
        totalPages: 0,
        schemaOutOfSync: true,
        summary: result.summary
      });
    }

    // Add Stripe URLs and serialize dates
    const { StripeSyncService } = await import('../../services/stripeSyncService');
    const subscriptionsWithUrls = result.subscriptions.map((sub: Record<string, unknown>) => ({
      id: sub.id,
      userId: sub.userId,
      businessId: sub.businessId,
      tier: sub.tier,
      status: sub.status,
      amount: typeof sub.amount === 'number' ? sub.amount : 0,
      currentPeriodStart: (sub.currentPeriodStart as Date).toISOString(),
      currentPeriodEnd: (sub.currentPeriodEnd as Date).toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      stripeCustomerId: sub.stripeCustomerId,
      lastSyncedAt: (sub.lastSyncedAt as Date | null)?.toISOString() ?? null,
      stripeMetadata: sub.stripeMetadata ?? null,
      employeeCount: sub.employeeCount ?? null,
      includedEmployees: sub.includedEmployees ?? null,
      additionalEmployeeCost: sub.additionalEmployeeCost ?? null,
      createdAt: (sub.createdAt as Date).toISOString(),
      updatedAt: (sub.updatedAt as Date).toISOString(),
      userEmail: (sub.user as { email?: string | null } | null)?.email ?? 'Unknown',
      userName: (sub.user as { name?: string | null } | null)?.name ?? null,
      stripeUrls: {
        subscription: StripeSyncService.getStripeSubscriptionUrl(sub.stripeSubscriptionId as string),
        customer: StripeSyncService.getStripeCustomerUrl(sub.stripeCustomerId as string)
      }
    }));

    res.json({
      subscriptions: subscriptionsWithUrls,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      schemaOutOfSync: false,
      summary: result.summary
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    await logger.error('Failed to fetch subscriptions', {
      operation: 'admin_get_subscriptions',
      error: {
        message: errorMessage,
        stack: errorStack
      }
    });
    
    // Include error details in response for debugging (always include message)
    res.status(500).json({ 
      error: 'Failed to fetch subscriptions',
      details: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    });
  }
});

// Get payment data
router.get('/billing/payments', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await adminBillingService.getPayments({
      page: Number(page),
      limit: Number(limit),
      status: status as string
    });
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    await logger.error('Failed to fetch payments', {
      operation: 'admin_get_payments',
      error: {
        message: errorMessage,
        stack: errorStack
      }
    });
    
    // Include error details in response for debugging (always include message)
    res.status(500).json({ 
      error: 'Failed to fetch payments',
      details: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    });
  }
});

// Get developer payouts
router.get('/billing/payouts', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await adminBillingService.getDeveloperPayouts({
      page: Number(page),
      limit: Number(limit),
      status: status as string
    });
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    await logger.error('Failed to fetch developer payouts', {
      operation: 'admin_get_developer_payouts',
      error: {
        message: errorMessage,
        stack: errorStack
      }
    });
    
    // Include error details in response for debugging (always include message)
    res.status(500).json({ 
      error: 'Failed to fetch developer payouts',
      details: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    });
  }
});

// Sync subscription from Stripe
router.post('/billing/subscriptions/:id/sync', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { StripeSyncService } = await import('../../services/stripeSyncService');
    await StripeSyncService.syncSubscriptionFromStripe(id);
    res.json({ success: true, message: 'Subscription synced from Stripe' });
  } catch (error) {
    await logger.error('Failed to sync subscription from Stripe', {
      operation: 'admin_sync_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to sync subscription from Stripe' });
  }
});

// Sync invoice from Stripe
router.post('/billing/invoices/:id/sync', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { StripeSyncService } = await import('../../services/stripeSyncService');
    await StripeSyncService.syncInvoiceFromStripe(id);
    res.json({ success: true, message: 'Invoice synced from Stripe' });
  } catch (error) {
    await logger.error('Failed to sync invoice from Stripe', {
      operation: 'admin_sync_invoice',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to sync invoice from Stripe' });
  }
});

// Sync all subscriptions
router.post('/billing/subscriptions/sync-all', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, businessId } = req.body;
    const { StripeSyncService } = await import('../../services/stripeSyncService');
    const synced = await StripeSyncService.syncAllSubscriptions({ userId, businessId });
    res.json({ success: true, synced, message: `Synced ${synced} subscriptions from Stripe` });
  } catch (error) {
    await logger.error('Failed to sync all subscriptions from Stripe', {
      operation: 'admin_sync_all_subscriptions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to sync subscriptions from Stripe' });
  }
});

// Get enhanced subscription data with Stripe info
router.get('/billing/subscriptions/:id/enhanced', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subscription = await adminBillingService.getEnhancedSubscription(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const { StripeSyncService } = await import('../../services/stripeSyncService');
    const stripeUrls = {
      subscription: StripeSyncService.getStripeSubscriptionUrl(subscription.stripeSubscriptionId),
      customer: StripeSyncService.getStripeCustomerUrl(subscription.stripeCustomerId)
    };

    res.json({
      ...subscription,
      stripeUrls,
      metadata: subscription.stripeMetadata || {}
    });
  } catch (error) {
    await logger.error('Failed to fetch enhanced subscription data', {
      operation: 'admin_get_enhanced_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch subscription data' });
  }
});

// Get enhanced invoice data with Stripe info
router.get('/billing/invoices/:id/enhanced', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await adminBillingService.getEnhancedInvoice(id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const { StripeSyncService } = await import('../../services/stripeSyncService');
    const stripeUrls = {
      invoice: StripeSyncService.getStripeInvoiceUrl(invoice.stripeInvoiceId),
      charge: invoice.stripeChargeId 
        ? `https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test'}/payments/${invoice.stripeChargeId}`
        : null,
      customer: StripeSyncService.getStripeCustomerUrl(invoice.stripeCustomerId)
    };

    res.json({
      ...invoice,
      stripeUrls,
      metadata: invoice.stripeMetadata || {},
      netAmount: invoice.stripeNetAmount || invoice.amount,
      fees: invoice.stripeFee || 0
    });
  } catch (error) {
    await logger.error('Failed to fetch enhanced invoice data', {
      operation: 'admin_get_enhanced_invoice',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch invoice data' });
  }
});

// ============================================================================
// SECURITY & COMPLIANCE
// ============================================================================

// Get security events
router.get('/security/events', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const severity = typeof req.query.severity === 'string' ? req.query.severity : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;

    const result = await adminSecurityService.listSecurityEventsPaginated({
      page,
      limit,
      severity,
      type,
    });
    res.json(result);
  } catch (error) {
    await logger.error('Failed to fetch security events', {
      operation: 'admin_get_security_events',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

// Get audit logs
router.get('/security/audit-logs', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const adminId = typeof req.query.adminId === 'string' ? req.query.adminId : undefined;
    const action = typeof req.query.action === 'string' ? req.query.action : undefined;

    const result = await adminSecurityService.listAdminAuditLogsPaginated({
      page,
      limit,
      adminId,
      action,
    });
    res.json(result);
  } catch (error) {
    await logger.error('Failed to fetch audit logs', {
      operation: 'admin_get_audit_logs',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Security routes (metrics, compliance, resolve — events handler is defined once above)
router.get('/security/metrics', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const securityMetrics = await adminSecurityService.getSecurityMetrics();
    res.json(securityMetrics);
  } catch (error) {
    await logger.error('Failed to fetch security metrics', {
      operation: 'admin_get_security_metrics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch security metrics' });
  }
});

router.get('/security/compliance', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const complianceStatus = await adminSecurityService.getComplianceStatus();
    res.json(complianceStatus);
  } catch (error) {
    await logger.error('Failed to fetch compliance status', {
      operation: 'admin_get_compliance_status',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch compliance status' });
  }
});

router.post('/security/events/:eventId/resolve', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const result = await adminSecurityService.resolveSecurityEvent(eventId, adminUser.id);
    res.json(result);
  } catch (error) {
    await logger.error('Failed to resolve security event', {
      operation: 'admin_resolve_security_event',
      eventId: req.params.eventId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to resolve security event' });
  }
});

router.post('/security/export', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { format } = req.query;
    const filters = req.body;
    const exportData = await adminSecurityService.exportSecurityReport(filters, format as string);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="security-report-${new Date().toISOString().split('T')[0]}.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="security-report-${new Date().toISOString().split('T')[0]}.json"`);
    }
    
    res.send(exportData);
  } catch (error) {
    await logger.error('Failed to export security report', {
      operation: 'admin_export_security_report',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to export security report' });
  }
});

// ============================================================================
// SYSTEM ADMINISTRATION
// ============================================================================

// Get system health
router.get('/system/health', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const health = await adminSystemOpsService.getSystemHealth();

    if (health.status === 'unavailable') {
      return res.status(503).json({
        status: 'unavailable',
        error: 'System health metrics are not available',
      });
    }

    const { status: _healthStatus, ...metrics } = health;

    res.json({
      status: 'available',
      ...metrics,
    });
  } catch (error) {
    await logger.error('Failed to fetch system health', {
      operation: 'admin_get_system_health',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// Get system configuration
router.get('/system/config', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const configs = await adminSystemOpsService.getSystemConfig();

    res.json(configs);
  } catch (error) {
    await logger.error('Failed to fetch system configuration', {
      operation: 'admin_get_system_config',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch system configuration' });
  }
});

// Update system configuration
router.patch('/system/config/:configKey', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { configKey } = req.params;
    const { configValue, description } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const config = await adminSystemOpsService.updateSystemConfig(
      configKey,
      configValue,
      description,
      adminUser.id,
    );

    res.json(config);
  } catch (error) {
    await logger.error('Failed to update system configuration', {
      operation: 'admin_update_system_config',
      configKey: req.params.configKey,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update system configuration' });
  }
});

// Moderation routes
router.get('/moderation/stats', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await adminModerationService.getModerationStats();
    res.json(stats);
  } catch (error) {
    await logger.error('Failed to fetch moderation statistics', {
      operation: 'admin_get_moderation_stats',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch moderation stats' });
  }
});

router.get('/moderation/rules', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const rules = await adminModerationService.getModerationRules();
    res.json(rules);
  } catch (error) {
    await logger.error('Failed to fetch moderation rules', {
      operation: 'admin_get_moderation_rules',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch moderation rules' });
  }
});

router.post('/moderation/bulk-action', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { reportIds, action } = req.body;
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(500).json({ error: 'User not authenticated' });
    }
    
    const result = await adminModerationService.bulkModerationAction(reportIds, action, adminUser.id);
    res.json(result);
  } catch (error) {
    await logger.error('Failed to perform bulk moderation action', {
      operation: 'admin_bulk_moderate',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to perform bulk moderation action' });
  }
});

router.post('/moderation/reports', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const filters = req.body;
    const reports = await adminModerationService.getReportedContent(filters);
    res.json(reports);
  } catch (error) {
    await logger.error('Failed to fetch reported content', {
      operation: 'admin_get_reported_content',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch reported content' });
  }
});

router.put('/moderation/reports/:reportId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status, action, reason } = req.body;
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(500).json({ error: 'User not authenticated' });
    }
    
    const result = await adminModerationService.updateReportStatus(reportId, status, action, reason, adminUser.id);
    res.json(result);
  } catch (error) {
    await logger.error('Failed to update report status', {
      operation: 'admin_update_report_status',
      reportId: req.params.reportId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// System administration routes
router.get('/system/backup', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const backupStatus = await adminSystemOpsService.getBackupStatus();
    res.json(backupStatus);
  } catch (error) {
    await logger.error('Failed to fetch backup status', {
      operation: 'admin_get_backup_status',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch backup status' });
  }
});

router.post('/system/backup', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(500).json({ error: 'User not authenticated' });
    }
    
    const result = await adminSystemOpsService.createBackup(adminUser.id);
    res.json(result);
  } catch (error) {
    await logger.error('Failed to create backup', {
      operation: 'admin_create_backup',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

router.get('/system/maintenance', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const maintenanceMode = await adminSystemOpsService.getMaintenanceMode();
    res.json(maintenanceMode);
  } catch (error) {
    await logger.error('Failed to fetch maintenance mode', {
      operation: 'admin_get_maintenance_mode',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch maintenance mode' });
  }
});

router.post('/system/maintenance', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { enabled, message } = req.body;
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(500).json({ error: 'User not authenticated' });
    }
    
    const result = await adminSystemOpsService.setMaintenanceMode(enabled, message, adminUser.id);
    res.json(result);
  } catch (error) {
    await logger.error('Failed to set maintenance mode', {
      operation: 'admin_set_maintenance_mode',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to set maintenance mode' });
  }
});

// Module Management Routes
router.get('/modules/submissions', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, category, developer, dateRange } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const submissions = await adminModuleGovernanceService.getModuleSubmissions({
      status: status as string,
      category: category as string,
      developerId: developer as string,
      dateRange: dateRange as string
    });

    await logger.info('Admin retrieved module submissions', {
      operation: 'admin_get_module_submissions',
      adminId: adminUser.id,
      filters: req.query
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    await logger.error('Failed to get module submissions', {
      operation: 'admin_get_module_submissions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get module submissions' });
  }
});

router.get('/modules/stats', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const stats = await adminModuleGovernanceService.getModuleStats();

    await logger.info('Admin retrieved module statistics', {
      operation: 'admin_get_module_stats',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    await logger.error('Failed to get module statistics', {
      operation: 'admin_get_module_stats',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get module stats' });
  }
});

router.post('/modules/submissions/:submissionId/review', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { action, reviewNotes } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await adminModuleGovernanceService.reviewModuleSubmission(
      submissionId,
      action,
      reviewNotes,
      adminUser.id
    );

    await logger.info('Admin reviewed module submission', {
      operation: 'admin_review_module_submission',
      adminId: adminUser.id,
      submissionId,
      action
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    const { ModuleVersionCertificationBlockedError } = await import(
      '../../services/moduleVersionCertificationGate.js'
    );
    if (error instanceof ModuleVersionCertificationBlockedError) {
      return res.status(400).json({
        success: false,
        error: error.message,
        details: { certification: error.certification },
      });
    }
    if (error instanceof Error && error.message === 'Module artifact scan must pass before approval') {
      return res.status(400).json({ success: false, error: error.message });
    }
    await logger.error('Failed to review module submission', {
      operation: 'admin_review_module_submission',
      submissionId: req.params.submissionId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to review module submission' });
  }
});

router.post('/modules/bulk-action', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { submissionIds, action } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await adminModuleGovernanceService.bulkModuleAction(
      submissionIds,
      action,
      adminUser.id
    );

    await logger.info('Admin performed bulk action on module submissions', {
      operation: 'admin_bulk_module_action',
      adminId: adminUser.id,
      submissionCount: submissionIds.length,
      action
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to perform bulk module action', {
      operation: 'admin_bulk_module_action',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to perform bulk module action' });
  }
});

router.get('/modules/:moduleId/versions', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const versions = await adminModuleGovernanceService.getModuleVersions(moduleId);

    await logger.info('Admin retrieved module versions', {
      operation: 'admin_get_module_versions',
      adminId: adminUser.id,
      moduleId,
    });

    res.json({
      success: true,
      data: { versions },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get module versions';
    const status = message === 'Module not found' ? 404 : 500;
    await logger.error('Failed to get module versions', {
      operation: 'admin_get_module_versions',
      moduleId: req.params.moduleId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(status).json({ error: message });
  }
});

router.post(
  '/modules/:moduleId/versions/promote-previous',
  authenticateJWT,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await adminModuleGovernanceService.promotePreviousModuleVersion(moduleId, adminUser.id);

      await logger.info('Admin promoted previous module version', {
        operation: 'admin_promote_previous_module_version',
        adminId: adminUser.id,
        moduleId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const { ModuleVersionCertificationBlockedError } = await import(
        '../../services/moduleVersionCertificationGate.js'
      );
      if (error instanceof ModuleVersionCertificationBlockedError) {
        return res.status(400).json({
          success: false,
          error: error.message,
          details: { certification: error.certification },
        });
      }
      const message =
        error instanceof Error ? error.message : 'Failed to promote previous module version';
      const status =
        message === 'Module not found'
          ? 404
          : /No previous|must pass|No current|certification/.test(message)
            ? 400
            : 500;
      await logger.error('Failed to promote previous module version', {
        operation: 'admin_promote_previous_module_version',
        moduleId: req.params.moduleId,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      res.status(status).json({ success: false, error: message });
    }
  }
);

router.post(
  '/modules/:moduleId/versions/:version/promote',
  authenticateJWT,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { moduleId, version } = req.params;
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await adminModuleGovernanceService.promoteModuleVersion(moduleId, version, adminUser.id);

      await logger.info('Admin promoted module version', {
        operation: 'admin_promote_module_version',
        adminId: adminUser.id,
        moduleId,
        version,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const { ModuleVersionCertificationBlockedError } = await import(
        '../../services/moduleVersionCertificationGate.js'
      );
      if (error instanceof ModuleVersionCertificationBlockedError) {
        return res.status(400).json({
          success: false,
          error: error.message,
          details: { certification: error.certification },
        });
      }
      const message = error instanceof Error ? error.message : 'Failed to promote module version';
      const status =
        message === 'Module not found' || message === 'Target version not found for this module'
          ? 404
          : /must pass|certification/.test(message)
            ? 400
            : 500;
      await logger.error('Failed to promote module version', {
        operation: 'admin_promote_module_version',
        moduleId: req.params.moduleId,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      res.status(status).json({ success: false, error: message });
    }
  }
);

router.get('/modules/analytics', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const analytics = await adminModuleGovernanceService.getModuleAnalytics();

    await logger.info('Admin retrieved module analytics', {
      operation: 'admin_get_module_analytics',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    await logger.error('Failed to get module analytics', {
      operation: 'admin_get_module_analytics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get module analytics' });
  }
});

router.get('/modules/developers/stats', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const stats = await adminModuleGovernanceService.getDeveloperStats();

    await logger.info('Admin retrieved developer statistics', {
      operation: 'admin_get_developer_stats',
      adminId: adminUser.id
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    await logger.error('Failed to get developer statistics', {
      operation: 'admin_get_developer_stats',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get developer stats' });
  }
});

router.patch('/modules/:moduleId/status', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { status } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await adminModuleGovernanceService.updateModuleStatus(moduleId, status, adminUser.id);

    await logger.info('Admin updated module status', {
      operation: 'admin_update_module_status',
      adminId: adminUser.id,
      moduleId,
      status
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Failed to update module status', {
      operation: 'admin_update_module_status',
      moduleId: req.params.moduleId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update module status' });
  }
});

router.get('/modules/:moduleId/revenue', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const revenue = await adminModuleGovernanceService.getModuleRevenue(moduleId);

    await logger.info('Admin retrieved module revenue', {
      operation: 'admin_get_module_revenue',
      adminId: adminUser.id,
      moduleId
    });

    res.json({
      success: true,
      data: revenue
    });
  } catch (error) {
    await logger.error('Failed to get module revenue', {
      operation: 'admin_get_module_revenue',
      moduleId: req.params.moduleId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get module revenue' });
  }
});

router.get('/modules/export', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, category, developer, dateRange } = req.query;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const csvData = await adminModuleGovernanceService.exportModuleData({
      status: status as string,
      category: category as string,
      developerId: developer as string,
      dateRange: dateRange as string
    });

    await logger.info('Admin exported module data', {
      operation: 'admin_export_module_data',
      adminId: adminUser.id
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="module-data.csv"');
    res.send(csvData);
  } catch (error) {
    await logger.error('Failed to export module data', {
      operation: 'admin_export_module_data',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to export module data' });
  }
});

router.get('/modules/:moduleId/search-delegate-probe', async (req, res) => {
  try {
    const adminUser = req.user;
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const moduleId = typeof req.params.moduleId === 'string' ? req.params.moduleId : '';
    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId is required' });
    }

    const { probeSearchDelegate } = await import('../../marketplace/searchDelegateProbe.js');
    const { getPartnerSearchDelegate } = await import('../../marketplace/searchDelegateRegistry.js');
    const { getSandboxPilotManifestSnapshot } = await import(
      '../../marketplace/registerSandboxPilotSearchDelegate.js'
    );
    const { getPublishedModuleManifest } = await import('../../marketplace/marketplaceReadinessService.js');
    const { SANDBOX_PILOT_ASSETS_MODULE_ID } = await import('shared/types/search-delegate');

    const manifest =
      moduleId === SANDBOX_PILOT_ASSETS_MODULE_ID
        ? getSandboxPilotManifestSnapshot()
        : await getPublishedModuleManifest(moduleId);

    if (!manifest) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const executeLiveProbe = req.query.live === 'true';
    const probeBusinessId =
      typeof req.query.businessId === 'string' ? req.query.businessId : 'sandbox-business-a';

    const result = await probeSearchDelegate({
      moduleId,
      manifest,
      registration: getPartnerSearchDelegate(moduleId),
      probeUserId: adminUser.id,
      probeBusinessId,
      executeLiveProbe,
    });

    res.json({ success: true, probe: result });
  } catch (error) {
    await logger.error('Search delegate probe failed', {
      operation: 'admin_search_delegate_probe',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Search delegate probe failed' });
  }
});

router.get('/modules/:moduleId/workspace-bridge-probe', async (req, res) => {
  try {
    const adminUser = req.user;
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const moduleId = typeof req.params.moduleId === 'string' ? req.params.moduleId : '';
    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId is required' });
    }

    const { probeWorkspaceBridge } = await import('../../marketplace/workspaceBridgeProbe.js');
    const { getPartnerWorkspaceParticipation } = await import(
      '../../marketplace/workspaceParticipationRegistry.js'
    );
    const { getSandboxPilotWorkspaceManifestSnapshot } = await import(
      '../../marketplace/registerSandboxPilotWorkspaceParticipation.js'
    );
    const { getPublishedModuleManifest } = await import('../../marketplace/marketplaceReadinessService.js');
    const { SANDBOX_PILOT_WORKSPACE_MODULE_ID } = await import('shared/types/workspace-bridge');

    const manifest =
      moduleId === SANDBOX_PILOT_WORKSPACE_MODULE_ID
        ? getSandboxPilotWorkspaceManifestSnapshot()
        : await getPublishedModuleManifest(moduleId);

    if (!manifest) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const issueTestToken = req.query.issueToken === 'true';
    const probeBusinessId =
      typeof req.query.businessId === 'string' ? req.query.businessId : 'sandbox-business-a';

    const result = await probeWorkspaceBridge({
      moduleId,
      manifest,
      registration: getPartnerWorkspaceParticipation(moduleId),
      probeUserId: adminUser.id,
      probeBusinessId,
      issueTestToken,
    });

    res.json({ success: true, probe: result });
  } catch (error) {
    await logger.error('Workspace bridge probe failed', {
      operation: 'admin_workspace_bridge_probe',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Workspace bridge probe failed' });
  }
});

router.get('/modules/:moduleId/business-billing-probe', async (req, res) => {
  try {
    const adminUser = req.user;
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const moduleId = typeof req.params.moduleId === 'string' ? req.params.moduleId : '';
    const businessId =
      typeof req.query.businessId === 'string' ? req.query.businessId : 'sandbox-business-a';

    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId is required' });
    }

    const { probeBusinessModuleBilling } = await import('../../marketplace/businessBillingProbe.js');
    const result = await probeBusinessModuleBilling({ moduleId, businessId });
    res.json({ success: true, probe: result });
  } catch (error) {
    await logger.error('Business billing probe failed', {
      operation: 'admin_business_billing_probe',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Business billing probe failed' });
  }
});

router.get('/modules/:moduleId/activity-ingest-probe', async (req, res) => {
  try {
    const adminUser = req.user;
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const moduleId = typeof req.params.moduleId === 'string' ? req.params.moduleId : '';
    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId is required' });
    }

    const { probeActivityIngest } = await import('../../marketplace/activityIngestProbe.js');
    const { getPartnerActivityIngest } = await import('../../marketplace/activityIngestRegistry.js');
    const { getSandboxPilotActivityManifestSnapshot } = await import(
      '../../marketplace/registerSandboxPilotActivityIngest.js'
    );
    const { getSandboxPilotManifestSnapshot } = await import(
      '../../marketplace/registerSandboxPilotSearchDelegate.js'
    );
    const { getPublishedModuleManifest } = await import('../../marketplace/marketplaceReadinessService.js');
    const { SANDBOX_PILOT_ASSETS_MODULE_ID } = await import('shared/types/search-delegate');

    const manifest =
      moduleId === SANDBOX_PILOT_ASSETS_MODULE_ID
        ? {
            ...getSandboxPilotManifestSnapshot(),
            ...getSandboxPilotActivityManifestSnapshot(),
          }
        : await getPublishedModuleManifest(moduleId);

    if (!manifest) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const executeLiveProbe = req.query.live === 'true';
    const probeBusinessId =
      typeof req.query.businessId === 'string' ? req.query.businessId : 'sandbox-business-a';

    const result = await probeActivityIngest({
      moduleId,
      manifest,
      registration: getPartnerActivityIngest(moduleId),
      probeUserId: adminUser.id,
      probeBusinessId,
      executeLiveProbe,
    });

    res.json({ success: true, probe: result });
  } catch (error) {
    await logger.error('Activity ingest probe failed', {
      operation: 'admin_activity_ingest_probe',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Activity ingest probe failed' });
  }
});

router.get('/modules/:moduleId/marketplace-readiness', async (req, res) => {
  try {
    const adminUser = req.user;
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const moduleId = typeof req.params.moduleId === 'string' ? req.params.moduleId : '';
    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId is required' });
    }

    const { getMarketplaceReadiness } = await import('../../marketplace/marketplaceReadinessService.js');
    const readiness = await getMarketplaceReadiness(moduleId);
    if (!readiness) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json({ success: true, readiness });
  } catch (error) {
    await logger.error('Marketplace readiness failed', {
      operation: 'admin_marketplace_readiness',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Marketplace readiness failed' });
  }
});

}
