import type { Request, Response } from 'express';
import type express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { requireAdmin, ALLOWED_CONTENT_REPORT_STATUSES } from './adminPortalShared';
import { auditContextFromRequest } from '../../services/admin/adminAuditService';
import * as adminImpersonationService from '../../services/admin/adminImpersonationService';
import * as adminUserService from '../../services/admin/adminUserService';
import * as adminModerationService from '../../services/admin/adminModerationService';
import * as adminAnalyticsService from '../../services/admin/adminAnalyticsService';

export function registerAdminPortalCoreRoutes(router: express.Router): void {
router.get('/test', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    res.json({ 
      message: 'Admin authentication working!',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    await logger.error('Admin test endpoint failed', {
      operation: 'admin_test',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

// ============================================================================
// DASHBOARD ANALYTICS
// ============================================================================

// Get dashboard overview statistics
router.get('/dashboard/stats', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await adminAnalyticsService.getDashboardStatsWithTrends();
    res.json({ success: true, data });
  } catch (error) {
    await logger.error('Failed to fetch dashboard statistics', {
      operation: 'admin_dashboard_stats',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent activity
router.get('/dashboard/activity', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const recentActivity = await adminAnalyticsService.getRecentDashboardActivity();
    res.json({ success: true, data: recentActivity });
  } catch (error) {
    await logger.error('Failed to fetch recent activity', {
      operation: 'admin_recent_activity',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// ============================================================================
// USER IMPERSONATION
// ============================================================================

// Start impersonating a user
router.post('/users/:userId/impersonate', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { reason, businessId, context, expiresInMinutes } = req.body as {
      reason?: string;
      businessId?: string | null;
      context?: string | null;
      expiresInMinutes?: number;
    };

    const result = await adminImpersonationService.beginImpersonation({
      adminUser,
      targetUserId: req.params.userId,
      reason,
      businessId,
      context,
      expiresInMinutes,
      request: auditContextFromRequest(req),
    });

    if (result.kind === 'denied') {
      return res.status(result.statusCode).json({ error: result.error });
    }

    res.json({
      message: result.message,
      impersonation: result.impersonation,
      token: result.token,
    });
  } catch (error) {
    if (error instanceof adminImpersonationService.ImpersonationAlreadyActiveError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof adminImpersonationService.ImpersonationBusinessMembershipError) {
      return res.status(400).json({ error: error.message });
    }
    await logger.error('Failed to start user impersonation', {
      operation: 'admin_impersonate_start',
      userId: req.params.userId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to start impersonation' });
  }
});

// End impersonation session
router.post('/impersonation/end', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await adminImpersonationService.endActiveImpersonation({
      adminUser,
      request: auditContextFromRequest(req),
    });

    res.json(result);
  } catch (error) {
    if (error instanceof adminImpersonationService.NoActiveImpersonationError) {
      return res.status(404).json({ error: error.message });
    }
    await logger.error('Failed to end user impersonation', {
      operation: 'admin_impersonate_end',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to end impersonation' });
  }
});

// Get current impersonation session
router.get('/impersonation/current', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await adminImpersonationService.getActiveImpersonationSession(adminUser.id);
    res.json(result);
  } catch (error) {
    await logger.error('Failed to get current impersonation session', {
      operation: 'admin_impersonate_get_current',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to get current impersonation' });
  }
});

router.get('/impersonation/businesses', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 12);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const result = await adminImpersonationService.listImpersonationBusinesses({
      page,
      limit,
      search,
    });

    res.json(result);
  } catch (error) {
    await logger.error('Failed to fetch impersonation business list', {
      operation: 'admin_impersonate_list_businesses',
      filters: req.query,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to load businesses' });
  }
});

router.get('/impersonation/businesses/:businessId/members', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await adminImpersonationService.getImpersonationBusinessMembers(req.params.businessId);
    if (!result) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(result);
  } catch (error) {
    await logger.error('Failed to fetch impersonation business members', {
      operation: 'admin_impersonate_business_members',
      businessId: req.params.businessId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to load business members' });
  }
});

router.post('/impersonation/businesses/:businessId/seed', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await adminImpersonationService.seedImpersonationBusinessPersonas(
      req.params.businessId,
      adminUser.id,
    );

    if (!result) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(result);
  } catch (error) {
    await logger.error('Failed to seed impersonation personas', {
      operation: 'admin_impersonate_seed_personas',
      businessId: req.params.businessId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to seed impersonation personas' });
  }
});

// Get impersonation history for admin
router.get('/impersonation/history', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await adminImpersonationService.getImpersonationHistory(adminUser.id, { page, limit });
    res.json(result);
  } catch (error) {
    await logger.error('Failed to get impersonation history', {
      operation: 'admin_impersonate_history',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to get impersonation history' });
  }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

// Get all users with pagination and filtering
router.get('/users', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;

    const result = await adminUserService.listUsers({ page, limit, search, role });
    res.json(result);
  } catch (error) {
    await logger.error('Failed to fetch users list', {
      operation: 'admin_get_users',
      filters: req.query,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/users/:userId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = await adminUserService.getUserDetailsForAdmin(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    await logger.error('Failed to fetch user details', {
      operation: 'admin_get_user_details',
      userId: req.params.userId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user status (ban, suspend, activate)
router.patch('/users/:userId/status', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { status, reason } = req.body as { status?: string; reason?: string };
    const user = await adminUserService.recordUserStatusUpdateAttempt({
      adminId: adminUser.id,
      userId: req.params.userId,
      status: status ?? '',
      reason,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    await logger.error('Failed to update user status', {
      operation: 'admin_update_user_status',
      userId: req.params.userId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Reset user password
router.post('/users/:userId/reset-password', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await adminUserService.initiatePasswordReset({
      adminId: adminUser.id,
      userId: req.params.userId,
    });

    res.json(result);
  } catch (error) {
    await logger.error('Failed to reset user password', {
      operation: 'admin_reset_user_password',
      userId: req.params.userId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to reset user password' });
  }
});

// ============================================================================
// CONTENT MODERATION
// ============================================================================

// Get reported content
router.get('/moderation/reported', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;

    const result = await adminModerationService.listReportedContentPaginated({
      page,
      limit,
      status,
      type,
    });
    res.json(result);
  } catch (error) {
    await logger.error('Failed to fetch reported content', {
      operation: 'admin_get_reported_content_paginated',
      filters: req.query,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to fetch reported content' });
  }
});

// Update report status
router.patch('/moderation/reports/:reportId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { status, action, reason, adminNotes } = req.body as {
      status?: unknown;
      action?: unknown;
      reason?: unknown;
      adminNotes?: unknown;
    };

    if (typeof status !== 'string' || !ALLOWED_CONTENT_REPORT_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid or missing status' });
    }

    const result = await adminModerationService.patchContentReport({
      reportId: req.params.reportId,
      adminId: adminUser.id,
      status,
      action: typeof action === 'string' ? action : undefined,
      reason: typeof reason === 'string' ? reason : undefined,
      adminNotes: typeof adminNotes === 'string' ? adminNotes : undefined,
      request: auditContextFromRequest(req),
    });

    res.json(result);
  } catch (error) {
    await logger.error('Failed to update content report', {
      operation: 'admin_update_report',
      reportId: req.params.reportId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to update report' });
  }
});

}
