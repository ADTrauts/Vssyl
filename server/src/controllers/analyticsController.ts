import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Helper function to get user from request
const getUserFromRequest = (req: Request) => {
  return (req as any).user;
};

// Get personal analytics for the current user
export const getPersonalAnalytics = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get user's activities
    const activities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50, // Limit to recent activities
    });

    // Get user's module installations
    const moduleInstallations = await prisma.moduleInstallation.findMany({
      where: {
        userId: user.id,
        enabled: true,
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    // Get user's files
    const files = await prisma.file.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
          lte: now,
        },
        trashedAt: null,
      },
    });

    // Get user's messages
    const messages = await prisma.message.findMany({
      where: {
        senderId: user.id,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
    });

    // Calculate usage statistics
    const totalSessions = activities.length;
    const totalTime = activities.reduce((sum, activity) => {
      const details = activity.details as any;
      return sum + (details?.duration || 0);
    }, 0) / 3600; // Convert to hours

    const modulesUsed = moduleInstallations.length;
    const filesCreated = files.length;
    const messagesSent = messages.length;

    // Get module usage statistics
    const moduleUsage = moduleInstallations.map(installation => {
      const moduleActivities = activities.filter(
        activity => {
          const details = activity.details as any;
          return details?.moduleId === installation.moduleId;
        }
      );
      
      return {
        module: installation.module.name,
        usageCount: moduleActivities.length,
        lastUsed: moduleActivities[0]?.timestamp || installation.installedAt,
        totalTime: moduleActivities.reduce((sum, activity) => {
          const details = activity.details as any;
          return sum + (details?.duration || 0);
        }, 0) / 3600, // Convert to hours
      };
    });

    // Format activity data
    const formattedActivities = activities.map(activity => {
      const details = activity.details as any;
      return {
        id: activity.id,
        type: activity.type,
        module: details?.moduleName || 'Unknown',
        description: getActivityDescription(activity),
        timestamp: activity.timestamp.toISOString(),
        duration: details?.duration,
      };
    });

    const analytics = {
      usageStats: {
        totalSessions,
        totalTime: Math.round(totalTime * 10) / 10, // Round to 1 decimal
        modulesUsed,
        filesCreated,
        messagesSent,
        connectionsMade: 0, // TODO: Implement when connections are available
      },
      moduleUsage,
      recentActivity: formattedActivities,
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error getting personal analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get personal analytics' });
  }
};

// Helper function to generate activity descriptions
const getActivityDescription = (activity: any): string => {
  const { type, details } = activity;
  
  switch (type) {
    case 'file_created':
      return `Created ${details?.fileName || 'a file'}`;
    case 'file_edited':
      return `Edited ${details?.fileName || 'a file'}`;
    case 'file_shared':
      return `Shared ${details?.fileName || 'a file'}`;
    case 'message_sent':
      return `Sent message in ${details?.conversationName || 'a conversation'}`;
    case 'module_accessed':
      return `Accessed ${details?.moduleName || 'a module'}`;
    case 'connection_made':
      return `Connected with ${details?.userName || 'a user'}`;
    default:
      return 'Performed an action';
  }
};

// Get module-specific analytics for a user
export const getModuleAnalytics = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get module installation
    const installation = await prisma.moduleInstallation.findFirst({
      where: {
        userId: user.id,
        moduleId,
        enabled: true,
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    if (!installation) {
      return res.status(404).json({ success: false, error: 'Module not found or not installed' });
    }

    // Get module-specific activities
    const activities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: startDate,
          lte: now,
        },
        details: {
          path: ['moduleId'],
          equals: moduleId,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Calculate module statistics
    const totalUsage = activities.length;
    const totalTime = activities.reduce((sum, activity) => {
      const details = activity.details as any;
      return sum + (details?.duration || 0);
    }, 0) / 3600; // Convert to hours

    const lastUsed = activities[0]?.timestamp || installation.installedAt;

    const moduleAnalytics = {
      module: installation.module,
      totalUsage,
      totalTime: Math.round(totalTime * 10) / 10,
      lastUsed: lastUsed.toISOString(),
      activities: activities.map(activity => {
        const details = activity.details as any;
        return {
          id: activity.id,
          type: activity.type,
          description: getActivityDescription(activity),
          timestamp: activity.timestamp.toISOString(),
          duration: details?.duration,
        };
      }),
    };

    res.json({ success: true, data: moduleAnalytics });
  } catch (error) {
    console.error('Error getting module analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get module analytics' });
  }
};

// Export analytics data
export const exportAnalytics = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { format = 'csv', timeRange = '30d' } = req.query;

    // Get analytics data
    const analyticsResponse = await getPersonalAnalytics(req, res);
    
    if (format === 'json') {
      return analyticsResponse;
    }

    // TODO: Implement CSV export
    res.json({ success: false, error: 'Export format not yet implemented' });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to export analytics' });
  }
}; 