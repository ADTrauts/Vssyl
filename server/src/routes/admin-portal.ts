import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';
import { AdminService } from '../services/adminService';
import { logger } from '../lib/logger';

const router: express.Router = express.Router();

// Middleware to require admin role
const requireAdmin = (req: Request, res: Response, next: () => void) => {
  const user = req.user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Test endpoint to verify authentication
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
    const [
      totalUsers,
      totalBusinesses,
      monthlyRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.moduleSubscription.aggregate({
        _sum: { amount: true },
        where: { status: 'active' }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers,
        activeUsers: totalUsers, // Since we don't have status field, assume all are active
        totalBusinesses: totalBusinesses,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        systemHealth: 99.9 // Mock value for now
      }
    });
  } catch (error) {
    await logger.error('Failed to fetch dashboard statistics', {
      operation: 'admin_dashboard_stats',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent activity
router.get('/dashboard/activity', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' }
    });

    res.json({
      success: true,
      data: recentActivity
    });
  } catch (error) {
    await logger.error('Failed to fetch recent activity', {
      operation: 'admin_recent_activity',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
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
    const { userId } = req.params;
    const { reason } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if admin is already impersonating someone
    const existingImpersonation = await prisma.adminImpersonation.findFirst({
      where: {
        adminId: adminUser.id,
        endedAt: null
      }
    });

    if (existingImpersonation) {
      return res.status(400).json({ error: 'Admin is already impersonating a user' });
    }

    // Create impersonation session
    const impersonation = await prisma.adminImpersonation.create({
      data: {
        adminId: adminUser.id,
        targetUserId: userId,
        reason: reason || 'Admin impersonation for debugging/support'
      }
    });

    // Log the impersonation action
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_IMPERSONATION_START',
        resourceType: 'user',
        resourceId: userId,
        details: JSON.stringify({
          adminEmail: adminUser.email,
          targetUserEmail: targetUser.email,
          reason: reason || 'Admin impersonation for debugging/support'
        }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Impersonation started successfully',
      impersonation: {
        id: impersonation.id,
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name
        },
        startedAt: impersonation.startedAt,
        reason: impersonation.reason
      }
    });
  } catch (error) {
    await logger.error('Failed to start user impersonation', {
      operation: 'admin_impersonate_start',
      userId: req.params.userId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
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

    // Find active impersonation session
    const impersonation = await prisma.adminImpersonation.findFirst({
      where: {
        adminId: adminUser.id,
        endedAt: null
      },
      include: {
        targetUser: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    if (!impersonation) {
      return res.status(404).json({ error: 'No active impersonation session found' });
    }

    // End the impersonation session
    await prisma.adminImpersonation.update({
      where: { id: impersonation.id },
      data: { endedAt: new Date() }
    });

    // Log the end of impersonation
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_IMPERSONATION_END',
        resourceType: 'user',
        resourceId: impersonation.targetUserId,
        details: JSON.stringify({
          adminEmail: adminUser.email,
          targetUserEmail: impersonation.targetUser.email,
          duration: Date.now() - impersonation.startedAt.getTime()
        }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Impersonation ended successfully',
      impersonation: {
        id: impersonation.id,
        targetUser: impersonation.targetUser,
        startedAt: impersonation.startedAt,
        endedAt: new Date(),
        duration: Date.now() - impersonation.startedAt.getTime()
      }
    });
  } catch (error) {
    await logger.error('Failed to end user impersonation', {
      operation: 'admin_impersonate_end',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
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

    const impersonation = await prisma.adminImpersonation.findFirst({
      where: {
        adminId: adminUser.id,
        endedAt: null
      },
      include: {
        targetUser: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    if (!impersonation) {
      return res.json({ active: false });
    }

    res.json({
      active: true,
      impersonation: {
        id: impersonation.id,
        targetUser: impersonation.targetUser,
        startedAt: impersonation.startedAt,
        reason: impersonation.reason,
        duration: Date.now() - impersonation.startedAt.getTime()
      }
    });
  } catch (error) {
    await logger.error('Failed to get current impersonation session', {
      operation: 'admin_impersonate_get_current',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get current impersonation' });
  }
});

// Get impersonation history for admin
router.get('/impersonation/history', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [impersonations, total] = await Promise.all([
      prisma.adminImpersonation.findMany({
        where: { adminId: adminUser.id },
        skip,
        take: Number(limit),
        orderBy: { startedAt: 'desc' },
        include: {
          targetUser: {
            select: { id: true, email: true, name: true }
          }
        }
      }),
      prisma.adminImpersonation.count({ where: { adminId: adminUser.id } })
    ]);

    res.json({
      impersonations,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    await logger.error('Failed to get impersonation history', {
      operation: 'admin_impersonate_history',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
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
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { userNumber: { contains: search as string } }
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          userNumber: true,
          role: true,
          createdAt: true,
          emailVerified: true,
          _count: {
            select: {
              businesses: true,
              files: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    await logger.error('Failed to fetch users list', {
      operation: 'admin_get_users',
      filters: req.query,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/users/:userId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: true,
        files: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

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
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user status (ban, suspend, activate)
router.patch('/users/:userId/status', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Note: User model doesn't have a status field, so we'll just log the action
    await logger.info('Admin attempted to update user status', {
      operation: 'admin_update_user_status',
      adminId: adminUser.id,
      userId,
      status,
      reason: reason || 'No reason provided'
    });

    const user = await prisma.user.findUnique({
      where: { id: userId }
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
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Reset user password
router.post('/users/:userId/reset-password', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // In a real implementation, you would hash the password and send it via email
    // For now, we'll just log the action
    await logger.logSecurityEvent('password_reset_initiated', 'medium', {
      operation: 'admin_reset_user_password',
      adminId: adminUser.id,
      userId
    });

    res.json({ message: 'Password reset initiated' });
  } catch (error) {
    await logger.error('Failed to reset user password', {
      operation: 'admin_reset_user_password',
      userId: req.params.userId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
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
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.contentType = type;

    const [reports, total] = await Promise.all([
      prisma.contentReport.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { email: true, name: true }
          }
        }
      }),
      prisma.contentReport.count({ where })
    ]);

    res.json({
      reports,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    await logger.error('Failed to fetch reported content', {
      operation: 'admin_get_reported_content_paginated',
      filters: req.query,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch reported content' });
  }
});

// Update report status
router.patch('/moderation/reports/:reportId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status, action, reason } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const report = await prisma.contentReport.update({
      where: { id: reportId },
      data: {
        status,
        action,
        reviewedBy: adminUser.id,
        reviewedAt: new Date()
      }
    });

    await logger.info('Admin updated content report', {
      operation: 'admin_update_report',
      adminId: adminUser.id,
      reportId,
      status,
      action,
      reason: reason || 'No reason provided'
    });

    res.json(report);
  } catch (error) {
    await logger.error('Failed to update content report', {
      operation: 'admin_update_report',
      reportId: req.params.reportId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// ============================================================================
// PLATFORM ANALYTICS
// ============================================================================

// Get system metrics
router.get('/analytics/system', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const metrics = await prisma.systemMetrics.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - (timeRange === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000))
        }
      },
      orderBy: { timestamp: 'desc' }
    });

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
    const { timeRange = '30d' } = req.query;
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
    const analyticsData = await AdminService.getAnalytics(filters);
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
    const exportData = await AdminService.exportAnalytics(filters, format as string);
    
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
    const realtimeData = await AdminService.getRealTimeMetrics();
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
    const customReport = await AdminService.generateCustomReport(reportConfig);
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
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true, name: true }
          }
        }
      }),
      prisma.subscription.count({ where })
    ]);

    res.json({
      subscriptions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    await logger.error('Failed to fetch subscriptions', {
      operation: 'admin_get_subscriptions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get payment data
router.get('/billing/payments', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await AdminService.getPayments({
      page: Number(page),
      limit: Number(limit),
      status: status as string
    });
    res.json(result);
  } catch (error) {
    await logger.error('Failed to fetch payments', {
      operation: 'admin_get_payments',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get developer payouts
router.get('/billing/payouts', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (status) where.payoutStatus = status;

    const [payouts, total] = await Promise.all([
      prisma.developerRevenue.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          developer: {
            select: { email: true, name: true }
          },
          module: {
            select: { name: true }
          }
        }
      }),
      prisma.developerRevenue.count({ where })
    ]);

    res.json({
      payouts: payouts.map(payout => ({
        id: payout.id,
        developerId: payout.developerId,
        developerName: payout.developer.name || payout.developer.email,
        amount: payout.developerRevenue,
        status: payout.payoutStatus,
        requestedAt: payout.createdAt,
        paidAt: payout.payoutDate
      })),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    await logger.error('Failed to fetch developer payouts', {
      operation: 'admin_get_developer_payouts',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch developer payouts' });
  }
});

// ============================================================================
// SECURITY & COMPLIANCE
// ============================================================================

// Get security events
router.get('/security/events', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, severity, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (severity) where.severity = severity;
    if (type) where.eventType = type;

    const [events, total] = await Promise.all([
      prisma.securityEvent.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { timestamp: 'desc' }
      }),
      prisma.securityEvent.count({ where })
    ]);

    res.json({
      events,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    await logger.error('Failed to fetch security events', {
      operation: 'admin_get_security_events',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

// Get audit logs
router.get('/security/audit-logs', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, adminId, action } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (adminId) where.adminId = adminId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { timestamp: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    await logger.error('Failed to fetch audit logs', {
      operation: 'admin_get_audit_logs',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Security routes
router.get('/security/events', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    const securityEvents = await AdminService.getSecurityEvents(filters);
    res.json(securityEvents);
  } catch (error) {
    await logger.error('Failed to fetch security events', {
      operation: 'admin_get_security_events',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

router.get('/security/metrics', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const securityMetrics = await AdminService.getSecurityMetrics();
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
    const complianceStatus = await AdminService.getComplianceStatus();
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
    
    const result = await AdminService.resolveSecurityEvent(eventId, adminUser.id);
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
    const exportData = await AdminService.exportSecurityReport(filters, format as string);
    
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
    // In a real implementation, you would collect actual system metrics
    // For now, we'll return mock data
    const systemHealth = {
      cpu: Math.floor(Math.random() * 30) + 20, // 20-50%
      memory: Math.floor(Math.random() * 40) + 40, // 40-80%
      disk: Math.floor(Math.random() * 30) + 50, // 50-80%
      network: Math.floor(Math.random() * 50) + 10, // 10-60 Mbps
      uptime: '99.9%',
      responseTime: Math.floor(Math.random() * 50) + 100, // 100-150ms
      errorRate: (Math.random() * 0.1).toFixed(3) // 0-0.1%
    };

    res.json(systemHealth);
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
    const configs = await prisma.systemConfig.findMany({
      orderBy: { updatedAt: 'desc' }
    });

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

    const config = await prisma.systemConfig.upsert({
      where: { configKey },
      update: {
        configValue,
        description,
        updatedBy: adminUser.id,
        updatedAt: new Date()
      },
      create: {
        configKey,
        configValue,
        description,
        updatedBy: adminUser.id
      }
    });

    await logger.info('Admin updated system configuration', {
      operation: 'admin_update_system_config',
      adminId: adminUser.id,
      configKey
    });

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
    const stats = await AdminService.getModerationStats();
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
    const rules = await AdminService.getModerationRules();
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
    
    const result = await AdminService.bulkModerationAction(reportIds, action, adminUser.id);
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
    const reports = await AdminService.getReportedContent(filters);
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
    
    const result = await AdminService.updateReportStatus(reportId, status, action, reason, adminUser.id);
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
    const backupStatus = await AdminService.getBackupStatus();
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
    
    const result = await AdminService.createBackup(adminUser.id);
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
    const maintenanceMode = await AdminService.getMaintenanceMode();
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
    
    const result = await AdminService.setMaintenanceMode(enabled, message, adminUser.id);
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

    const submissions = await AdminService.getModuleSubmissions({
      status: status as string,
      category: category as string,
      developerId: developer as string,
      dateRange: dateRange as string
    });

    console.log(`Admin ${adminUser.id} retrieved module submissions with filters:`, req.query);

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
    
    const stats = await AdminService.getModuleStats();

    console.log(`Admin ${adminUser.id} retrieved module stats`);

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

    const result = await AdminService.reviewModuleSubmission(
      submissionId,
      action,
      reviewNotes,
      adminUser.id
    );

    console.log(`Admin ${adminUser.id} reviewed module submission ${submissionId}: ${action}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
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

    const result = await AdminService.bulkModuleAction(
      submissionIds,
      action,
      adminUser.id
    );

    console.log(`Admin ${adminUser.id} performed bulk action on ${submissionIds.length} submissions: ${action}`);

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

router.get('/modules/analytics', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const analytics = await AdminService.getModuleAnalytics();

    console.log(`Admin ${adminUser.id} retrieved module analytics`);

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
    
    const stats = await AdminService.getDeveloperStats();

    console.log(`Admin ${adminUser.id} retrieved developer stats`);

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

    const result = await AdminService.updateModuleStatus(moduleId, status, adminUser.id);

    console.log(`Admin ${adminUser.id} updated module ${moduleId} status to ${status}`);

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

    const revenue = await AdminService.getModuleRevenue(moduleId);

    console.log(`Admin ${adminUser.id} retrieved revenue for module ${moduleId}`);

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

    const csvData = await AdminService.exportModuleData({
      status: status as string,
      category: category as string,
      developerId: developer as string,
      dateRange: dateRange as string
    });

    console.log(`Admin ${adminUser.id} exported module data`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="module-data.csv"');
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting module data:', error);
    res.status(500).json({ error: 'Failed to export module data' });
  }
});

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

    console.log(`Admin ${adminUser.id} retrieved business intelligence data with filters:`, req.query);

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error getting business intelligence data:', error);
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

    console.log(`Admin ${adminUser.id} exported business intelligence data`);

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="business-intelligence-report.pdf"');
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="business-intelligence-report.csv"');
    }
    
    res.send(exportData);
  } catch (error) {
    console.error('Error exporting business intelligence data:', error);
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

    console.log(`Admin ${adminUser.id} created A/B test:`, testData.name);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating A/B test:', error);
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

    console.log(`Admin ${adminUser.id} retrieved A/B test results for test ${testId}`);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error getting A/B test results:', error);
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

    console.log(`Admin ${adminUser.id} updated A/B test ${testId}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating A/B test:', error);
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

    console.log(`Admin ${adminUser.id} retrieved user segments`);

    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    console.error('Error getting user segments:', error);
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

    console.log(`Admin ${adminUser.id} created user segment:`, segmentData.name);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating user segment:', error);
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

    console.log(`Admin ${adminUser.id} retrieved predictive insights`);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting predictive insights:', error);
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

    console.log(`Admin ${adminUser.id} retrieved competitive analysis`);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error getting competitive analysis:', error);
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

    console.log(`Admin ${adminUser.id} generated custom report:`, reportConfig.name);

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

    console.log(`Admin ${adminUser.id} retrieved support tickets with filters:`, req.query);

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error('Error getting support tickets:', error);
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

    console.log(`Admin ${adminUser.id} retrieved support stats`);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting support stats:', error);
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

    console.log(`Admin ${adminUser.id} updated support ticket ${ticketId}: ${action}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
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

    console.log(`Admin ${adminUser.id} retrieved knowledge base`);

    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('Error getting knowledge base:', error);
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

    console.log(`Admin ${adminUser.id} updated knowledge article ${articleId}: ${action}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating knowledge article:', error);
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

    console.log(`Admin ${adminUser.id} retrieved live chats`);

    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('Error getting live chats:', error);
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

    console.log(`Admin ${adminUser.id} joined live chat ${chatId}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error joining live chat:', error);
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

    console.log(`Admin ${adminUser.id} retrieved support analytics`);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting support analytics:', error);
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

    console.log(`Admin ${adminUser.id} created support ticket`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
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

    console.log(`Customer support ticket created: ${(result as any).id}`);

    res.json({
      success: true,
      data: {
        ticketId: (result as any).id,
        message: 'Support ticket created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating customer support ticket:', error);
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

    console.log(`Admin ${adminUser.id} created knowledge article`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating knowledge article:', error);
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

    console.log(`Admin ${adminUser.id} exported support data`);

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="support-report.pdf"');
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="support-report.csv"');
    }
    
    res.send(exportData);
  } catch (error) {
    console.error('Error exporting support data:', error);
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

    console.log(`Admin ${adminUser.id} retrieved performance metrics`);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
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

    console.log(`Admin ${adminUser.id} retrieved scalability metrics`);

    res.json({
      success: true,
      data: scalability
    });
  } catch (error) {
    console.error('Error getting scalability metrics:', error);
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

    console.log(`Admin ${adminUser.id} retrieved optimization recommendations`);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting optimization recommendations:', error);
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

    console.log(`Admin ${adminUser.id} updated optimization recommendation ${recommendationId}: ${action}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating optimization recommendation:', error);
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

    console.log(`Admin ${adminUser.id} retrieved performance alerts`);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error getting performance alerts:', error);
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

    console.log(`Admin ${adminUser.id} updated performance alert ${alertId}: ${action}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating performance alert:', error);
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

    console.log(`Admin ${adminUser.id} retrieved performance analytics`);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting performance analytics:', error);
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

    console.log(`Admin ${adminUser.id} configured performance alert`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error configuring performance alert:', error);
    res.status(500).json({ error: 'Failed to configure performance alert' });
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

    console.log(`Admin ${adminUser.id} exported performance data`);

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="performance-report.pdf"');
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="performance-report.csv"');
    }

    res.send(exportData);
  } catch (error) {
    console.error('Error exporting performance data:', error);
    res.status(500).json({ error: 'Failed to export performance data' });
  }
});

export default router; 