import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

function hasUserId(user: unknown): user is { id: string } {
  return typeof user === 'object' && user !== null && 'id' in user && typeof (user as Record<string, unknown>).id === 'string';
}

/**
 * GET /api/dashboards/ai/context/overview
 * Returns dashboard overview for AI context
 */
export async function getDashboardOverview(req: Request, res: Response): Promise<void> {
  try {
    const userId = hasUserId(req.user) ? req.user.id : null;
    const { dashboardId } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Get all user dashboards or specific one
    const whereClause = dashboardId && typeof dashboardId === 'string'
      ? { id: dashboardId, userId }
      : { userId };

    const dashboards = await prisma.dashboard.findMany({
      where: whereClause,
      include: {
        widgets: {
          select: {
            id: true,
            type: true,
            config: true,
            position: true,
          },
        },
        business: { select: { id: true, name: true } },
        institution: { select: { id: true, name: true } },
        household: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const summary = {
      totalDashboards: dashboards.length,
      totalWidgets: dashboards.reduce((sum, d) => sum + d.widgets.length, 0),
      dashboardTypes: {
        personal: dashboards.filter(d => !d.businessId && !d.institutionId && !d.householdId).length,
        business: dashboards.filter(d => d.businessId).length,
        educational: dashboards.filter(d => d.institutionId).length,
        household: dashboards.filter(d => d.householdId).length,
      },
      widgetTypeBreakdown: {} as Record<string, number>,
    };

    // Count widget types
    for (const dashboard of dashboards) {
      for (const widget of dashboard.widgets) {
        summary.widgetTypeBreakdown[widget.type] = (summary.widgetTypeBreakdown[widget.type] || 0) + 1;
      }
    }

    const context = {
      summary,
      dashboards: dashboards.map(d => ({
        id: d.id,
        name: d.name,
        type: d.businessId ? 'business' : d.institutionId ? 'educational' : d.householdId ? 'household' : 'personal',
        contextName: d.business?.name || d.institution?.name || d.household?.name || null,
        widgetCount: d.widgets.length,
        widgetTypes: d.widgets.map(w => w.type),
        preferences: d.preferences,
        createdAt: d.createdAt,
      })),
    };

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'dashboard',
        endpoint: 'overview',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Error in getDashboardOverview', {
      operation: 'dashboard_ai_context_overview',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard overview' });
  }
}

/**
 * GET /api/dashboards/ai/context/quick-stats
 * Returns aggregated quick stats from modules for AI context
 */
export async function getDashboardQuickStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = hasUserId(req.user) ? req.user.id : null;
    const { dashboardId } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Get dashboard for context
    let dashboard = null;
    if (dashboardId && typeof dashboardId === 'string') {
      dashboard = await prisma.dashboard.findFirst({
        where: { id: dashboardId, userId },
      });
    }

    // Aggregate stats from various modules
    const [
      taskStats,
      conversationStats,
      fileStats,
      notificationStats,
    ] = await Promise.all([
      // Task stats (use createdById for user's tasks)
      prisma.task.groupBy({
        by: ['status'],
        where: { createdById: userId },
        _count: { id: true },
      }).catch(() => []),
      
      // Conversation stats (unread messages)
      prisma.conversation.count({
        where: {
          participants: { some: { id: userId } },
        },
      }).catch(() => 0),
      
      // File stats
      prisma.file.count({
        where: { userId, trashedAt: null },
      }).catch(() => 0),
      
      // Notification stats
      prisma.notification.count({
        where: { userId, read: false },
      }).catch(() => 0),
    ]);

    // Process task stats
    const taskStatusCounts = (taskStats as Array<{ status: string; _count: { id: number } }>).reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    const pendingTasks = (taskStatusCounts['TODO'] || 0) + (taskStatusCounts['IN_PROGRESS'] || 0);
    const completedTasks = taskStatusCounts['DONE'] || 0;

    const context = {
      summary: {
        pendingTasks,
        completedTasks,
        totalConversations: conversationStats as number,
        totalFiles: fileStats as number,
        unreadNotifications: notificationStats as number,
      },
      details: {
        tasks: {
          byStatus: taskStatusCounts,
          total: Object.values(taskStatusCounts).reduce((a, b) => a + b, 0),
        },
      },
      dashboardContext: dashboard ? {
        id: dashboard.id,
        name: dashboard.name,
      } : null,
    };

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'dashboard',
        endpoint: 'quick-stats',
        dashboardId: dashboardId || null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Error in getDashboardQuickStats', {
      operation: 'dashboard_ai_context_quick_stats',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ success: false, message: 'Failed to fetch quick stats' });
  }
}

/**
 * GET /api/dashboards/ai/context/widgets
 * Returns widget summary for AI context
 */
export async function getDashboardWidgets(req: Request, res: Response): Promise<void> {
  try {
    const userId = hasUserId(req.user) ? req.user.id : null;
    const { dashboardId } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ success: false, message: 'dashboardId is required' });
      return;
    }

    const dashboard = await prisma.dashboard.findFirst({
      where: { id: dashboardId, userId },
      include: {
        widgets: {
          select: {
            id: true,
            type: true,
            config: true,
            position: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dashboard) {
      res.status(404).json({ success: false, message: 'Dashboard not found' });
      return;
    }

    // Widget type descriptions
    const widgetDescriptions: Record<string, string> = {
      chat: 'Recent conversations and quick messaging',
      drive: 'Recent files and storage overview',
      calendar: 'Upcoming events and schedule',
      todo: 'Tasks, deadlines, and priorities',
      ai: 'AI assistant for quick queries',
      notifications: 'Latest alerts and updates',
      quickstats: 'Key metrics at a glance',
      quicknotes: 'Quick notes and scratchpad',
      bookmarks: 'Quick links and saved pages',
      activityfeed: 'Recent activity across modules',
      hr: 'HR metrics and employee info',
      scheduling: 'Shifts, coverage, and availability',
    };

    const context = {
      dashboardId: dashboard.id,
      dashboardName: dashboard.name,
      widgetCount: dashboard.widgets.length,
      widgets: dashboard.widgets.map(w => ({
        id: w.id,
        type: w.type,
        description: widgetDescriptions[w.type] || 'Custom widget',
        hasConfig: w.config !== null,
        position: w.position,
        addedAt: w.createdAt,
      })),
      widgetTypes: [...new Set(dashboard.widgets.map(w => w.type))],
      availableWidgetTypes: Object.keys(widgetDescriptions),
    };

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'dashboard',
        endpoint: 'widgets',
        dashboardId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Error in getDashboardWidgets', {
      operation: 'dashboard_ai_context_widgets',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ success: false, message: 'Failed to fetch widget summary' });
  }
}
