import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcrypt';

export class AdminService {
  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  static async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }) {
    const { page = 1, limit = 20, search, status, role } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { userNumber: { contains: search } }
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
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

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: {
          include: {
            business: true
          }
        },
        files: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        subscriptions: true,
        activities: {
          take: 20,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    return user;
  }

  static async updateUserStatus(userId: string, status: string, adminId: string, reason?: string) {
    // Note: User model doesn't have a status field, so we'll log this action instead
    console.log(`Admin ${adminId} attempted to update user ${userId} status to ${status}. Reason: ${reason || 'No reason provided'}`);
    
    // For now, return the user without status update since the field doesn't exist
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    return user;
  }

  static async resetUserPassword(userId: string, adminId: string) {
    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    console.log(`Admin ${adminId} reset password for user ${userId}`);

    return { message: 'Password reset successfully' };
  }

  // ============================================================================
  // CONTENT MODERATION
  // ============================================================================

  static async getReportedContent(filters: any) {
    try {
      // Mock reported content - in a real implementation, this would query the database
      const mockReports = [
        {
          id: 'report_1',
          contentType: 'post',
          reason: 'Inappropriate content',
          status: 'pending',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          reporter: {
            email: 'user1@example.com',
            name: 'John Doe'
          },
          content: {
            id: 'content_1',
            title: 'Sample Post',
            description: 'This is a sample post that was reported',
            url: 'https://example.com/post/1'
          },
          severity: 'high' as const,
          autoModerated: false
        },
        {
          id: 'report_2',
          contentType: 'comment',
          reason: 'Spam content',
          status: 'resolved',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          reviewedBy: 'admin@blockonblock.com',
          reviewedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
          action: 'removed',
          reporter: {
            email: 'user2@example.com',
            name: 'Jane Smith'
          },
          content: {
            id: 'content_2',
            title: 'Sample Comment',
            description: 'This is a spam comment',
            url: 'https://example.com/comment/2'
          },
          severity: 'medium' as const,
          autoModerated: true
        }
      ];

      // Apply filters
      let filteredReports = mockReports;
      
      if (filters.status && filters.status !== 'all') {
        filteredReports = filteredReports.filter(report => report.status === filters.status);
      }
      
      if (filters.severity && filters.severity !== 'all') {
        filteredReports = filteredReports.filter(report => report.severity === filters.severity);
      }
      
      if (filters.contentType && filters.contentType !== 'all') {
        filteredReports = filteredReports.filter(report => report.contentType === filters.contentType);
      }

      return {
        reports: filteredReports,
        total: filteredReports.length,
        page: 1,
        totalPages: 1
      };
    } catch (error) {
      console.error('Error getting reported content:', error);
      throw error;
    }
  }

  static async updateReportStatus(reportId: string, status: string, action: string, reason: string, adminId: string) {
    try {
      // Mock update - in a real implementation, this would update the database
      console.log(`Admin ${adminId} updated report ${reportId} to status ${status} with action ${action}`);
      
      // Log the moderation action
      await this.logSecurityEvent({
        eventType: 'content_moderated',
        severity: 'medium',
        adminId: adminId,
        details: {
          reportId: reportId,
          status: status,
          action: action,
          reason: reason,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        reportId: reportId,
        status: status,
        action: action,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  static async getDashboardStats() {
    const [
      totalUsers,
      totalBusinesses,
      moduleRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.moduleSubscription.aggregate({
        _sum: { amount: true },
        where: { status: 'active' }
      })
    ]);

    return {
      totalUsers,
      activeUsers: totalUsers, // Since we don't have status field, assume all are active
      totalBusinesses,
      monthlyRevenue: moduleRevenue._sum.amount || 0,
      systemHealth: 99.9 // Mock value for now
    };
  }

  static async getSystemMetrics(timeRange: string = '24h') {
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

  static async getUserAnalytics(timeRange: string = '30d') {
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

  static async getAnalytics(filters: any) {
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

      // Get engagement data - use createdAt as proxy for activity since no lastLoginAt
      const activeUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

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

      return {
        userGrowth: {
          total: totalUsers,
          newThisMonth: newThisMonth,
          growthRate: totalUsers > 0 ? ((newThisMonth / totalUsers) * 100) : 0,
          monthlyTrend: [] // Would need to implement trend calculation
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          thisMonth: thisMonthRevenue._sum.amount || 0,
          growthRate: 0, // Would need to calculate growth rate
          monthlyTrend: [] // Would need to implement trend calculation
        },
        engagement: {
          activeUsers: activeUsers,
          avgSessionDuration: 15, // Mock data
          retentionRate: 85, // Mock data
          dailyActiveUsers: [] // Would need to implement daily tracking
        },
        system: {
          uptime: latestMetrics?.metricValue || 99.9,
          avgResponseTime: 120, // Mock data
          errorRate: 0.1, // Mock data
          performanceTrend: [] // Would need to implement trend calculation
        }
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  static async exportAnalytics(filters: any, format: string) {
    try {
      const analyticsData = await this.getAnalytics(filters);
      
      if (format === 'csv') {
        // Convert to CSV format
        const csvData = this.convertToCSV(analyticsData);
        return csvData;
      } else {
        // Return JSON format
        return JSON.stringify(analyticsData, null, 2);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  static async getRealTimeMetrics() {
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
      console.error('Error getting real-time metrics:', error);
      throw error;
    }
  }



  private static convertToCSV(data: any): string {
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
  // FINANCIAL MANAGEMENT
  // ============================================================================

  static async getSubscriptions(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true, name: true }
          }
        }
      }),
      prisma.subscription.count({ where })
    ]);

    return {
      subscriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Note: Payment model was removed, so we'll return empty data for now
  static async getPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    return {
      payments: [],
      total: 0,
      page: 1,
      totalPages: 0
    };
  }

  // ============================================================================
  // SECURITY & COMPLIANCE
  // ============================================================================

  static async getSecurityEvents(params: {
    page?: number;
    limit?: number;
    severity?: string;
    type?: string;
  }) {
    const { page = 1, limit = 20, severity, type } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (severity) where.severity = severity;
    if (type) where.eventType = type;

    const [events, total] = await Promise.all([
      prisma.securityEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' }
      }),
      prisma.securityEvent.count({ where })
    ]);

    return {
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getAuditLogs(params: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
  }) {
    const { page = 1, limit = 20, adminId, action } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (adminId) where.adminId = adminId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // ============================================================================
  // SECURITY METHODS
  // ============================================================================

  static async getSecurityMetrics() {
    try {
      // Get total security events
      const totalEvents = await prisma.securityEvent.count();
      
      // Get critical events
      const criticalEvents = await prisma.securityEvent.count({
        where: {
          severity: 'critical'
        }
      });

      // Get resolved events
      const resolvedEvents = await prisma.securityEvent.count({
        where: {
          resolved: true
        }
      });

      // Get active threats (unresolved events)
      const activeThreats = await prisma.securityEvent.count({
        where: {
          resolved: false
        }
      });

      // Calculate security score (mock calculation)
      const securityScore = Math.max(0, 100 - (activeThreats * 10) - (criticalEvents * 5));

      // Get last incident
      const lastIncident = await prisma.securityEvent.findFirst({
        orderBy: {
          timestamp: 'desc'
        }
      });

      return {
        totalEvents,
        criticalEvents,
        resolvedEvents,
        activeThreats,
        securityScore,
        lastIncident: lastIncident?.timestamp || new Date().toISOString(),
        uptime: 99.9 // Mock uptime
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      throw error;
    }
  }

  static async getComplianceStatus() {
    try {
      // Mock compliance status - in a real implementation, this would check actual compliance
      return {
        gdpr: true,
        hipaa: false,
        soc2: true,
        pci: true,
        lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        nextAudit: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
      };
    } catch (error) {
      console.error('Error getting compliance status:', error);
      throw error;
    }
  }

  static async resolveSecurityEvent(eventId: string, adminId: string) {
    try {
      const event = await prisma.securityEvent.update({
        where: { id: eventId },
        data: {
          resolved: true
        }
      });

      // Log the resolution action
      await this.logSecurityEvent({
        eventType: 'security_event_resolved',
        severity: 'low',
        adminId: adminId,
        details: {
          resolvedEventId: eventId,
          resolvedEventType: event.eventType
        }
      });

      return { success: true, event };
    } catch (error) {
      console.error('Error resolving security event:', error);
      throw error;
    }
  }

  static async exportSecurityReport(filters: any, format: string) {
    try {
      const events = await prisma.securityEvent.findMany({
        where: {
          ...(filters.severity && filters.severity !== 'all' ? { severity: filters.severity } : {}),
          ...(filters.status && filters.status !== 'all' ? { resolved: filters.status === 'resolved' } : {}),
          ...(filters.timeRange ? {
            timestamp: {
              gte: new Date(Date.now() - this.getTimeRangeInMs(filters.timeRange))
            }
          } : {})
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      if (format === 'csv') {
        return this.convertSecurityEventsToCSV(events);
      } else {
        return JSON.stringify(events, null, 2);
      }
    } catch (error) {
      console.error('Error exporting security report:', error);
      throw error;
    }
  }

  private static getTimeRangeInMs(timeRange: string): number {
    switch (timeRange) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // Default to 24 hours
    }
  }

  private static convertSecurityEventsToCSV(events: any[]): string {
    const csvRows = [];
    
    // Add headers
    csvRows.push('Event ID,Event Type,Severity,User Email,IP Address,Timestamp,Resolved');
    
    // Add data rows
    events.forEach(event => {
      csvRows.push(`${event.id},${event.eventType},${event.severity},${event.userEmail || ''},${event.ipAddress || ''},${event.timestamp},${event.resolved}`);
    });
    
    return csvRows.join('\n');
  }

  // ============================================================================
  // MODERATION METHODS
  // ============================================================================

  static async getModerationStats() {
    try {
      // Get total reports
      const totalReports = await prisma.contentReport.count();
      
      // Get pending reviews
      const pendingReview = await prisma.contentReport.count({
        where: {
          status: 'pending'
        }
      });

      // Get auto-moderated (mock data for now)
      const autoModerated = Math.floor(totalReports * 0.3); // 30% auto-moderated

      // Get resolved today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const resolvedToday = await prisma.contentReport.count({
        where: {
          status: 'resolved',
          reviewedAt: {
            gte: today
          }
        }
      });

      // Calculate average response time (mock calculation)
      const averageResponseTime = 45; // minutes

      return {
        totalReports,
        pendingReview,
        autoModerated,
        resolvedToday,
        averageResponseTime
      };
    } catch (error) {
      console.error('Error getting moderation stats:', error);
      throw error;
    }
  }

  static async getModerationRules() {
    try {
      // Mock moderation rules - in a real implementation, these would come from a database
      return [
        {
          id: 'rule_1',
          name: 'Spam Detection',
          description: 'Automatically flag content containing spam keywords',
          conditions: ['Contains spam keywords', 'Multiple links', 'Repetitive content'],
          actions: ['Flag for review', 'Send warning'],
          enabled: true,
          priority: 1
        },
        {
          id: 'rule_2',
          name: 'Inappropriate Content',
          description: 'Detect and flag inappropriate or offensive content',
          conditions: ['Contains profanity', 'Hate speech', 'Violent content'],
          actions: ['Remove content', 'Ban user', 'Send warning'],
          enabled: true,
          priority: 2
        },
        {
          id: 'rule_3',
          name: 'Copyright Violation',
          description: 'Identify potential copyright violations',
          conditions: ['Duplicate content', 'Known copyrighted material'],
          actions: ['Flag for review', 'Remove content'],
          enabled: true,
          priority: 3
        },
        {
          id: 'rule_4',
          name: 'Bot Detection',
          description: 'Detect automated bot activity',
          conditions: ['Rapid posting', 'Pattern-based content', 'Suspicious timing'],
          actions: ['Temporary ban', 'Require verification'],
          enabled: true,
          priority: 4
        }
      ];
    } catch (error) {
      console.error('Error getting moderation rules:', error);
      throw error;
    }
  }

  static async bulkModerationAction(reportIds: string[], action: string, adminId: string) {
    try {
      const results = [];

      for (const reportId of reportIds) {
        const result = await this.updateReportStatus(reportId, 'resolved', action, 'Bulk action', adminId);
        results.push(result);
      }

      // Log the bulk action
      await this.logSecurityEvent({
        eventType: 'bulk_moderation_action',
        severity: 'medium',
        adminId: adminId,
        details: {
          action: action,
          reportIds: reportIds,
          count: reportIds.length
        }
      });

      return {
        success: true,
        processed: reportIds.length,
        results: results
      };
    } catch (error) {
      console.error('Error performing bulk moderation action:', error);
      throw error;
    }
  }

  // ============================================================================
  // SYSTEM ADMINISTRATION
  // ============================================================================

  static async getSystemHealth() {
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

    return systemHealth;
  }

  static async getSystemConfig() {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    return configs;
  }

  static async updateSystemConfig(configKey: string, configValue: any, description: string, adminId: string) {
    const config = await prisma.systemConfig.upsert({
      where: { configKey },
      update: {
        configValue,
        description,
        updatedBy: adminId,
        updatedAt: new Date()
      },
      create: {
        configKey,
        configValue,
        description,
        updatedBy: adminId
      }
    });

    console.log(`Admin ${adminId} updated system configuration: ${configKey}`);

    return config;
  }

  // ============================================================================
  // SYSTEM ADMINISTRATION METHODS
  // ============================================================================

  static async getBackupStatus() {
    try {
      // Mock backup status - in a real implementation, this would check actual backup status
      return {
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        backupSize: '2.5 GB',
        status: 'success' as const,
        retentionDays: 30
      };
    } catch (error) {
      console.error('Error getting backup status:', error);
      throw error;
    }
  }

  static async createBackup(adminId: string) {
    try {
      // Mock backup creation - in a real implementation, this would create an actual backup
      console.log(`Admin ${adminId} initiated backup creation`);
      
      // Log the backup action
      await this.logSecurityEvent({
        eventType: 'backup_created',
        severity: 'low',
        adminId: adminId,
        details: {
          backupType: 'manual',
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        backupId: `backup_${Date.now()}`,
        message: 'Backup created successfully'
      };
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  static async getMaintenanceMode() {
    try {
      // Mock maintenance mode - in a real implementation, this would check actual maintenance status
      return {
        enabled: false,
        message: 'System is currently under maintenance. Please try again later.',
        scheduledStart: null,
        scheduledEnd: null
      };
    } catch (error) {
      console.error('Error getting maintenance mode:', error);
      throw error;
    }
  }

  static async setMaintenanceMode(enabled: boolean, message: string, adminId: string) {
    try {
      // Mock maintenance mode setting - in a real implementation, this would update actual maintenance status
      console.log(`Admin ${adminId} ${enabled ? 'enabled' : 'disabled'} maintenance mode`);
      
      // Log the maintenance mode action
      await this.logSecurityEvent({
        eventType: 'maintenance_mode_changed',
        severity: 'high',
        adminId: adminId,
        details: {
          enabled: enabled,
          message: message,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        enabled: enabled,
        message: message,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error setting maintenance mode:', error);
      throw error;
    }
  }

  // ============================================================================
  // USER IMPERSONATION
  // ============================================================================

  static async startImpersonation(adminId: string, targetUserId: string, reason?: string) {
    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true }
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Check if admin is already impersonating someone
    const existingImpersonation = await prisma.adminImpersonation.findFirst({
      where: {
        adminId,
        endedAt: null
      }
    });

    if (existingImpersonation) {
      throw new Error('Admin is already impersonating a user');
    }

    // Create impersonation session
    const impersonation = await prisma.adminImpersonation.create({
      data: {
        adminId,
        targetUserId,
        reason: reason || 'Admin impersonation for debugging/support'
      }
    });

    return {
      impersonation,
      targetUser
    };
  }

  static async endImpersonation(adminId: string) {
    // Find active impersonation session
    const impersonation = await prisma.adminImpersonation.findFirst({
      where: {
        adminId,
        endedAt: null
      },
      include: {
        targetUser: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    if (!impersonation) {
      throw new Error('No active impersonation session found');
    }

    // End the impersonation session
    await prisma.adminImpersonation.update({
      where: { id: impersonation.id },
      data: { endedAt: new Date() }
    });

    return impersonation;
  }

  static async getCurrentImpersonation(adminId: string) {
    const impersonation = await prisma.adminImpersonation.findFirst({
      where: {
        adminId,
        endedAt: null
      },
      include: {
        targetUser: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    return impersonation;
  }

  static async getImpersonationHistory(adminId: string, params: {
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [impersonations, total] = await Promise.all([
      prisma.adminImpersonation.findMany({
        where: { adminId },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          targetUser: {
            select: { id: true, email: true, name: true }
          }
        }
      }),
      prisma.adminImpersonation.count({ where: { adminId } })
    ]);

    return {
      impersonations,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  static async logSecurityEvent(eventData: {
    eventType: string;
    severity: string;
    userId?: string;
    userEmail?: string;
    adminId?: string;
    adminEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }) {
    return await prisma.securityEvent.create({
      data: {
        eventType: eventData.eventType,
        severity: eventData.severity,
        userId: eventData.userId,
        userEmail: eventData.userEmail,
        adminId: eventData.adminId,
        adminEmail: eventData.adminEmail,
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
        details: eventData.details
      }
    });
  }

  static async logSystemMetric(metricData: {
    metricType: string;
    metricName: string;
    metricValue: number;
    metadata?: any;
  }) {
    return await prisma.systemMetrics.create({
      data: {
        metricType: metricData.metricType,
        metricName: metricData.metricName,
        metricValue: metricData.metricValue,
        metadata: metricData.metadata
      }
    });
  }

  // Module Management Methods
  static async getModuleSubmissions(filters: any = {}): Promise<any[]> {
    try {
      const whereClause: any = {};
      
      if (filters.status && filters.status !== 'all') {
        whereClause.status = filters.status;
      }
      
      if (filters.category && filters.category !== 'all') {
        whereClause.module = {
          category: filters.category
        };
      }

      const submissions = await prisma.moduleSubmission.findMany({
        where: whereClause,
        include: {
          module: {
            include: {
              developer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          submitter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });

      return submissions;
    } catch (error) {
      console.error('Error getting module submissions:', error);
      throw new Error('Failed to get module submissions');
    }
  }

  static async getModuleStats(): Promise<any> {
    try {
      const [
        totalSubmissions,
        pendingReviews,
        approvedToday,
        rejectedToday,
        totalRevenue,
        activeDevelopers,
        averageRating,
        topCategory
      ] = await Promise.all([
        prisma.moduleSubmission.count(),
        prisma.moduleSubmission.count({
          where: { status: 'PENDING' }
        }),
        prisma.moduleSubmission.count({
          where: {
            status: 'APPROVED',
            reviewedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        prisma.moduleSubmission.count({
          where: {
            status: 'REJECTED',
            reviewedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        prisma.moduleSubscription.aggregate({
          _sum: {
            amount: true
          },
          where: {
            status: 'active'
          }
        }),
        prisma.user.count({
          where: {
            modules: {
              some: {}
            }
          }
        }),
        prisma.module.aggregate({
          _avg: {
            rating: true
          },
          where: {
            status: 'APPROVED'
          }
        }),
        prisma.module.groupBy({
          by: ['category'],
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 1
        })
      ]);

      return {
        totalSubmissions,
        pendingReviews,
        approvedToday,
        rejectedToday,
        totalRevenue: totalRevenue._sum.amount || 0,
        activeDevelopers,
        averageRating: averageRating._avg.rating || 0,
        topCategory: topCategory[0]?.category || 'N/A'
      };
    } catch (error) {
      console.error('Error getting module stats:', error);
      throw new Error('Failed to get module stats');
    }
  }

  static async reviewModuleSubmission(
    submissionId: string,
    action: 'approve' | 'reject',
    reviewNotes?: string,
    adminId?: string
  ): Promise<any> {
    try {
      const submission = await prisma.moduleSubmission.findUnique({
        where: { id: submissionId },
        include: {
          module: true
        }
      });

      if (!submission) {
        throw new Error('Submission not found');
      }

      if (submission.status !== 'PENDING') {
        throw new Error('Submission has already been reviewed');
      }

      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

      // Update submission
      const updatedSubmission = await prisma.moduleSubmission.update({
        where: { id: submissionId },
        data: {
          status: newStatus,
          reviewNotes,
          reviewerId: adminId,
          reviewedAt: new Date()
        },
        include: {
          module: {
            include: {
              developer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          submitter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // If approved, update module status
      if (action === 'approve') {
        await prisma.module.update({
          where: { id: submission.moduleId },
          data: {
            status: 'APPROVED'
          }
        });
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: `MODULE_${action.toUpperCase()}`,
          details: JSON.stringify({
            submissionId,
            moduleId: submission.moduleId,
            moduleName: submission.module.name,
            action,
            reviewNotes
          }),
          timestamp: new Date()
        }
      });

      return updatedSubmission;
    } catch (error) {
      console.error('Error reviewing module submission:', error);
      throw new Error('Failed to review module submission');
    }
  }

  static async bulkModuleAction(
    submissionIds: string[],
    action: 'approve' | 'reject',
    adminId?: string
  ): Promise<any> {
    try {
      const results = await Promise.all(
        submissionIds.map(submissionId =>
          this.reviewModuleSubmission(submissionId, action, undefined, adminId)
        )
      );

      return {
        message: `Successfully ${action}ed ${submissionIds.length} submissions`,
        results
      };
    } catch (error) {
      console.error('Error performing bulk module action:', error);
      throw new Error('Failed to perform bulk module action');
    }
  }

  static async getModuleAnalytics(): Promise<any> {
    try {
      const [
        categoryStats,
        revenueStats,
        developerStats,
        ratingStats
      ] = await Promise.all([
        prisma.module.groupBy({
          by: ['category'],
          _count: {
            id: true
          },
          _avg: {
            rating: true
          }
        }),
        prisma.moduleSubscription.groupBy({
          by: ['moduleId'],
          _sum: {
            amount: true
          },
          where: {
            status: 'active'
          }
        }),
        prisma.user.groupBy({
          by: ['id'],
          _count: {
            id: true
          },
          where: {
            modules: {
              some: {}
            }
          }
        }),
        prisma.module.aggregate({
          _avg: {
            rating: true
          },
          _count: {
            id: true
          },
          where: {
            status: 'APPROVED'
          }
        })
      ]);

      return {
        categoryStats,
        revenueStats,
        developerStats,
        ratingStats
      };
    } catch (error) {
      console.error('Error getting module analytics:', error);
      throw new Error('Failed to get module analytics');
    }
  }

  static async getDeveloperStats(): Promise<any> {
    try {
      const developers = await prisma.user.findMany({
        where: {
          modules: {
            some: {}
          }
        },
        include: {
          modules: {
            include: {
              submissions: true,
              installations: true,
              subscriptions: {
                where: {
                  status: 'active'
                }
              }
            }
          }
        }
      });

      return developers.map(developer => ({
        id: developer.id,
        name: developer.name,
        email: developer.email,
        totalModules: developer.modules.length,
        approvedModules: developer.modules.filter(m => m.status === 'APPROVED').length,
        totalDownloads: developer.modules.reduce((sum, m) => sum + m.downloads, 0),
        totalRevenue: developer.modules.reduce((sum, m) => 
          sum + m.subscriptions.reduce((s, sub) => s + sub.amount, 0), 0
        ),
        averageRating: developer.modules.length > 0 
          ? developer.modules.reduce((sum, m) => sum + m.rating, 0) / developer.modules.length 
          : 0
      }));
    } catch (error) {
      console.error('Error getting developer stats:', error);
      throw new Error('Failed to get developer stats');
    }
  }

  static async updateModuleStatus(
    moduleId: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED',
    adminId?: string
  ): Promise<any> {
    try {
      const module = await prisma.module.update({
        where: { id: moduleId },
        data: { status },
        include: {
          developer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'MODULE_STATUS_UPDATE',
          details: JSON.stringify({
            moduleId,
            moduleName: module.name,
            oldStatus: 'UNKNOWN',
            newStatus: status
          }),
          timestamp: new Date()
        }
      });

      return module;
    } catch (error) {
      console.error('Error updating module status:', error);
      throw new Error('Failed to update module status');
    }
  }

  static async getModuleRevenue(moduleId: string): Promise<any> {
    try {
      const revenue = await prisma.moduleSubscription.aggregate({
        where: {
          moduleId,
          status: 'active'
        },
        _sum: {
          amount: true,
          platformRevenue: true,
          developerRevenue: true
        },
        _count: {
          id: true
        }
      });

      return {
        totalRevenue: revenue._sum.amount || 0,
        platformRevenue: revenue._sum.platformRevenue || 0,
        developerRevenue: revenue._sum.developerRevenue || 0,
        activeSubscriptions: revenue._count.id
      };
    } catch (error) {
      console.error('Error getting module revenue:', error);
      throw new Error('Failed to get module revenue');
    }
  }

  static async exportModuleData(filters: any = {}): Promise<string> {
    try {
      const submissions = await this.getModuleSubmissions(filters);
      
      const csvHeaders = [
        'ID',
        'Module Name',
        'Developer',
        'Category',
        'Status',
        'Submitted At',
        'Reviewed At',
        'Review Notes',
        'Downloads',
        'Rating',
        'Pricing Tier'
      ];

      const csvRows = submissions.map(submission => [
        submission.id,
        submission.module.name,
        submission.submitter.name,
        submission.module.category,
        submission.status,
        submission.submittedAt,
        submission.reviewedAt || '',
        submission.reviewNotes || '',
        submission.module.downloads || 0,
        submission.module.rating || 0,
        submission.module.pricingTier || 'free'
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting module data:', error);
      throw new Error('Failed to export module data');
    }
  }

  // Business Intelligence Methods
  static async getBusinessIntelligence(filters: any = {}): Promise<any> {
    try {
      // Get date range
      const dateRange = this.getDateRangeFromFilter(filters.dateRange);
      
      // Get user growth metrics
      const userGrowth = await this.getUserGrowthMetrics(dateRange);
      
      // Get revenue metrics
      const revenueMetrics = await this.getRevenueMetrics(dateRange);
      
      // Get engagement metrics
      const engagementMetrics = await this.getEngagementMetrics(dateRange);
      
      // Get predictive insights (AI-powered)
      const predictiveInsights = await this.getPredictiveInsights();
      
      // Get A/B tests
      const abTests = await this.getABTests();
      
      // Get user segments
      const userSegments = await this.getUserSegments();
      
      // Get competitive analysis
      const competitiveAnalysis = await this.getCompetitiveAnalysis();

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
      console.error('Error getting business intelligence data:', error);
      throw new Error('Failed to get business intelligence data');
    }
  }

  static async exportBusinessIntelligence(filters: any = {}): Promise<string> {
    try {
      const data = await this.getBusinessIntelligence(filters);
      
      // Generate CSV content
      const csvHeaders = [
        'Metric',
        'Value',
        'Change',
        'Date Range'
      ];

      const csvRows = [
        ['Total Users', data.userGrowth.totalUsers, `${data.userGrowth.growthRate}%`, filters.dateRange || '30d'],
        ['MRR', `$${data.revenueMetrics.monthlyRecurringRevenue.toLocaleString()}`, `${data.revenueMetrics.revenueGrowth}%`, filters.dateRange || '30d'],
        ['ARPU', `$${data.revenueMetrics.averageRevenuePerUser}`, 'N/A', filters.dateRange || '30d'],
        ['Active Users', data.userGrowth.activeUsers, 'N/A', filters.dateRange || '30d'],
        ['Churn Rate', `${data.userGrowth.churnRate}%`, 'N/A', filters.dateRange || '30d']
      ];

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting business intelligence data:', error);
      throw new Error('Failed to export business intelligence data');
    }
  }

  static async createABTest(testData: any, adminId?: string): Promise<any> {
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
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'AB_TEST_CREATED',
          details: JSON.stringify({
            testId: test.id,
            testName: testData.name,
            variants: testData.variants
          }),
          timestamp: new Date()
        }
      });

      return test;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw new Error('Failed to create A/B test');
    }
  }

  static async getABTestResults(testId: string): Promise<any> {
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
      console.error('Error getting A/B test results:', error);
      throw new Error('Failed to get A/B test results');
    }
  }

  static async updateABTest(testId: string, updates: any, adminId?: string): Promise<any> {
    try {
      // In a real implementation, this would update the A/B test in the database
      const updatedTest = {
        id: testId,
        ...updates,
        updatedAt: new Date(),
        updatedBy: adminId
      };

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'AB_TEST_UPDATED',
          details: JSON.stringify({
            testId,
            updates
          }),
          timestamp: new Date()
        }
      });

      return updatedTest;
    } catch (error) {
      console.error('Error updating A/B test:', error);
      throw new Error('Failed to update A/B test');
    }
  }

  static async getUserSegments(): Promise<any[]> {
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
      console.error('Error getting user segments:', error);
      throw new Error('Failed to get user segments');
    }
  }

  static async createUserSegment(segmentData: any, adminId?: string): Promise<any> {
    try {
      const segment = {
        id: `segment_${Date.now()}`,
        ...segmentData,
        createdAt: new Date(),
        createdBy: adminId
      };

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'USER_SEGMENT_CREATED',
          details: JSON.stringify({
            segmentId: segment.id,
            segmentName: segmentData.name,
            criteria: segmentData.criteria
          }),
          timestamp: new Date()
        }
      });

      return segment;
    } catch (error) {
      console.error('Error creating user segment:', error);
      throw new Error('Failed to create user segment');
    }
  }

  static async getPredictiveInsights(): Promise<any[]> {
    try {
      // In a real implementation, this would use ML models to generate insights
      const insights = [
        {
          type: 'churn',
          title: 'High Churn Risk - Enterprise Users',
          description: 'Enterprise users showing 15% higher churn probability due to feature gaps',
          confidence: 87,
          impact: 'high',
          recommendedAction: 'Implement advanced analytics features and improve enterprise support'
        },
        {
          type: 'upsell',
          title: 'Upsell Opportunity - Free Users',
          description: '45% of free users are ready for premium upgrade based on usage patterns',
          confidence: 92,
          impact: 'medium',
          recommendedAction: 'Targeted email campaign with personalized upgrade offers'
        },
        {
          type: 'growth',
          title: 'Market Expansion - Asia Pacific',
          description: 'Strong growth potential in APAC region with 200% YoY interest increase',
          confidence: 78,
          impact: 'high',
          recommendedAction: 'Launch localized marketing campaigns and partner with regional distributors'
        }
      ];

      return insights;
    } catch (error) {
      console.error('Error getting predictive insights:', error);
      throw new Error('Failed to get predictive insights');
    }
  }

  static async getCompetitiveAnalysis(): Promise<any> {
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
      console.error('Error getting competitive analysis:', error);
      throw new Error('Failed to get competitive analysis');
    }
  }

  static async generateCustomReport(reportConfig: any, adminId?: string): Promise<any> {
    try {
      const report = {
        id: `report_${Date.now()}`,
        name: reportConfig.name,
        type: reportConfig.type,
        data: await this.getBusinessIntelligence(reportConfig.filters),
        generatedAt: new Date(),
        generatedBy: adminId
      };

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'CUSTOM_REPORT_GENERATED',
          details: JSON.stringify({
            reportId: report.id,
            reportName: reportConfig.name,
            reportType: reportConfig.type
          }),
          timestamp: new Date()
        }
      });

      return report;
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw new Error('Failed to generate custom report');
    }
  }

  // Helper methods for business intelligence
  private static async getUserGrowthMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
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

  private static async getRevenueMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
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

  private static async getEngagementMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
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

  private static async getABTests(): Promise<any[]> {
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

  private static getDateRangeFromFilter(dateRange: string): { start: Date; end: Date } {
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

  // Customer Support Methods
  static async getSupportTickets(filters: any = {}): Promise<any[]> {
    try {
      // In a real implementation, this would query the database for support tickets
      const tickets = [
        {
          id: '1',
          title: 'Cannot access premium features',
          description: 'I upgraded to premium but still cannot access advanced features. Please help.',
          status: 'open',
          priority: 'high',
          category: 'Billing',
          customer: {
            id: '1',
            name: 'John Smith',
            email: 'john@example.com',
            plan: 'premium'
          },
          assignedTo: {
            id: '1',
            name: 'Sarah Support',
            email: 'sarah@company.com'
          },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
          responseTime: 2.5,
          satisfaction: 4,
          tags: ['billing', 'premium', 'urgent'],
          attachments: []
        },
        {
          id: '2',
          title: 'Module installation failed',
          description: 'Trying to install the calendar module but getting an error message.',
          status: 'in_progress',
          priority: 'medium',
          category: 'Technical',
          customer: {
            id: '2',
            name: 'Jane Doe',
            email: 'jane@example.com',
            plan: 'free'
          },
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          responseTime: 1.2,
          tags: ['modules', 'installation'],
          attachments: ['error-screenshot.png']
        }
      ];

      // Apply filters
      let filteredTickets = tickets;
      
      if (filters.status && filters.status !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === filters.status);
      }
      
      if (filters.priority && filters.priority !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.priority === filters.priority);
      }
      
      if (filters.category && filters.category !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.category === filters.category);
      }

      return filteredTickets;
    } catch (error) {
      console.error('Error getting support tickets:', error);
      throw new Error('Failed to get support tickets');
    }
  }

  static async getSupportStats(): Promise<any> {
    try {
      return {
        totalTickets: 156,
        openTickets: 23,
        resolvedToday: 8,
        averageResponseTime: 2.3,
        customerSatisfaction: 4.2,
        activeAgents: 5,
        averageResolutionTime: 8.5,
        topCategories: [
          { category: 'Technical', count: 45, percentage: 29 },
          { category: 'Billing', count: 32, percentage: 21 },
          { category: 'Account', count: 28, percentage: 18 },
          { category: 'Features', count: 25, percentage: 16 },
          { category: 'Other', count: 26, percentage: 16 }
        ]
      };
    } catch (error) {
      console.error('Error getting support stats:', error);
      throw new Error('Failed to get support stats');
    }
  }

  static async updateSupportTicket(ticketId: string, action: string, data?: any, adminId?: string): Promise<any> {
    try {
      // In a real implementation, this would update the ticket in the database
      const ticket = {
        id: ticketId,
        action,
        data,
        updatedBy: adminId,
        updatedAt: new Date()
      };

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'SUPPORT_TICKET_UPDATED',
          details: JSON.stringify({
            ticketId,
            action,
            data
          }),
          timestamp: new Date()
        }
      });

      return ticket;
    } catch (error) {
      console.error('Error updating support ticket:', error);
      throw new Error('Failed to update support ticket');
    }
  }

  static async getKnowledgeBase(): Promise<any[]> {
    try {
      return [
        {
          id: '1',
          title: 'How to upgrade to premium',
          content: 'Step-by-step guide to upgrade your account to premium...',
          category: 'Account',
          tags: ['upgrade', 'premium', 'billing'],
          author: {
            id: '1',
            name: 'Support Team'
          },
          status: 'published',
          views: 1250,
          helpful: 89,
          notHelpful: 12,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          title: 'Troubleshooting module installation',
          content: 'Common issues and solutions for module installation problems...',
          category: 'Technical',
          tags: ['modules', 'installation', 'troubleshooting'],
          author: {
            id: '2',
            name: 'Tech Support'
          },
          status: 'published',
          views: 890,
          helpful: 67,
          notHelpful: 8,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
    } catch (error) {
      console.error('Error getting knowledge base:', error);
      throw new Error('Failed to get knowledge base');
    }
  }

  static async updateKnowledgeArticle(articleId: string, action: string, data?: any, adminId?: string): Promise<any> {
    try {
      const article = {
        id: articleId,
        action,
        data,
        updatedBy: adminId,
        updatedAt: new Date()
      };

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'KNOWLEDGE_ARTICLE_UPDATED',
          details: JSON.stringify({
            articleId,
            action,
            data
          }),
          timestamp: new Date()
        }
      });

      return article;
    } catch (error) {
      console.error('Error updating knowledge article:', error);
      throw new Error('Failed to update knowledge article');
    }
  }

  static async getLiveChats(): Promise<any[]> {
    try {
      return [
        {
          id: '1',
          customer: {
            id: '3',
            name: 'Mike Johnson',
            email: 'mike@example.com'
          },
          agent: {
            id: '2',
            name: 'Alex Support'
          },
          status: 'active',
          startedAt: new Date(Date.now() - 1800000).toISOString(),
          lastMessageAt: new Date(Date.now() - 300000).toISOString(),
          messageCount: 12,
          duration: 30
        },
        {
          id: '2',
          customer: {
            id: '4',
            name: 'Lisa Brown',
            email: 'lisa@example.com'
          },
          status: 'waiting',
          startedAt: new Date(Date.now() - 600000).toISOString(),
          lastMessageAt: new Date(Date.now() - 600000).toISOString(),
          messageCount: 1,
          duration: 10
        }
      ];
    } catch (error) {
      console.error('Error getting live chats:', error);
      throw new Error('Failed to get live chats');
    }
  }

  static async joinLiveChat(chatId: string, adminId?: string): Promise<any> {
    try {
      const chat = {
        id: chatId,
        agentId: adminId,
        joinedAt: new Date()
      };

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'LIVE_CHAT_JOINED',
          details: JSON.stringify({
            chatId,
            agentId: adminId
          }),
          timestamp: new Date()
        }
      });

      return chat;
    } catch (error) {
      console.error('Error joining live chat:', error);
      throw new Error('Failed to join live chat');
    }
  }

  static async getSupportAnalytics(): Promise<any> {
    try {
      return {
        responseTime: {
          average: 2.3,
          median: 1.8,
          p95: 4.2
        },
        resolutionTime: {
          average: 8.5,
          median: 6.2,
          p95: 15.8
        },
        satisfaction: {
          average: 4.2,
          totalRatings: 145,
          distribution: {
            '5': 89,
            '4': 32,
            '3': 15,
            '2': 6,
            '1': 3
          }
        },
        volume: {
          daily: 12,
          weekly: 84,
          monthly: 342
        },
        categories: [
          { name: 'Technical', count: 45, percentage: 29 },
          { name: 'Billing', count: 32, percentage: 21 },
          { name: 'Account', count: 28, percentage: 18 },
          { name: 'Features', count: 25, percentage: 16 },
          { name: 'Other', count: 26, percentage: 16 }
        ]
      };
    } catch (error) {
      console.error('Error getting support analytics:', error);
      throw new Error('Failed to get support analytics');
    }
  }

  static async createSupportTicket(ticketData: any, adminId?: string): Promise<any> {
    try {
      const ticket = {
        id: `ticket_${Date.now()}`,
        ...ticketData,
        createdAt: new Date(),
        createdBy: adminId
      };

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'SUPPORT_TICKET_CREATED',
          details: JSON.stringify({
            ticketId: ticket.id,
            title: ticketData.title,
            category: ticketData.category
          }),
          timestamp: new Date()
        }
      });

      return ticket;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw new Error('Failed to create support ticket');
    }
  }

  static async createKnowledgeArticle(articleData: any, adminId?: string): Promise<any> {
    try {
      const article = {
        id: `article_${Date.now()}`,
        ...articleData,
        createdAt: new Date(),
        createdBy: adminId,
        views: 0,
        helpful: 0,
        notHelpful: 0
      };

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'KNOWLEDGE_ARTICLE_CREATED',
          details: JSON.stringify({
            articleId: article.id,
            title: articleData.title,
            category: articleData.category
          }),
          timestamp: new Date()
        }
      });

      return article;
    } catch (error) {
      console.error('Error creating knowledge article:', error);
      throw new Error('Failed to create knowledge article');
    }
  }

  static async exportSupportData(filters: any = {}): Promise<string> {
    try {
      const tickets = await this.getSupportTickets(filters);
      const stats = await this.getSupportStats();

      // Generate CSV content
      const csvHeaders = [
        'Ticket ID',
        'Title',
        'Status',
        'Priority',
        'Category',
        'Customer',
        'Created At',
        'Response Time (hours)',
        'Satisfaction'
      ];

      const csvRows = tickets.map(ticket => [
        ticket.id,
        ticket.title,
        ticket.status,
        ticket.priority,
        ticket.category,
        ticket.customer.name,
        new Date(ticket.createdAt).toLocaleDateString(),
        ticket.responseTime || 'N/A',
        ticket.satisfaction || 'N/A'
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting support data:', error);
      throw new Error('Failed to export support data');
    }
  }

  // Performance & Scalability Methods
  static async getPerformanceMetrics(filters: any = {}): Promise<any> {
    try {
      // In a real implementation, this would collect actual system metrics
      return {
        cpu: {
          usage: Math.floor(Math.random() * 30) + 20, // 20-50%
          cores: 8,
          temperature: Math.floor(Math.random() * 20) + 55, // 55-75°C
          loadAverage: [1.2, 1.1, 1.0]
        },
        memory: {
          total: 16384, // MB
          used: Math.floor(Math.random() * 8000) + 4000, // 4-12GB used
          available: 8192,
          swapUsed: 512,
          swapTotal: 2048
        },
        disk: {
          total: 1000000, // MB
          used: Math.floor(Math.random() * 300000) + 300000, // 300-600GB used
          available: 550000,
          iops: Math.floor(Math.random() * 1000) + 500, // 500-1500 IOPS
          latency: Math.random() * 5 + 1 // 1-6ms latency
        },
        network: {
          bytesIn: Math.floor(Math.random() * 2000000) + 500000, // 500KB-2.5MB/s
          bytesOut: Math.floor(Math.random() * 1000000) + 200000, // 200KB-1.2MB/s
          packetsIn: Math.floor(Math.random() * 20000) + 10000, // 10K-30K packets/s
          packetsOut: Math.floor(Math.random() * 15000) + 8000, // 8K-23K packets/s
          connections: Math.floor(Math.random() * 1000) + 500 // 500-1500 connections
        },
        database: {
          connections: Math.floor(Math.random() * 50) + 50, // 50-100 connections
          queries: Math.floor(Math.random() * 10000) + 5000, // 5K-15K queries/min
          slowQueries: Math.floor(Math.random() * 20) + 5, // 5-25 slow queries
          cacheHitRate: Math.floor(Math.random() * 20) + 80, // 80-100% cache hit rate
          avgResponseTime: Math.random() * 20 + 10 // 10-30ms avg response time
        },
        application: {
          responseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
          throughput: Math.floor(Math.random() * 500) + 500, // 500-1000 req/s
          errorRate: Math.random() * 0.5, // 0-0.5% error rate
          activeUsers: Math.floor(Math.random() * 1000) + 500, // 500-1500 active users
          requestsPerSecond: Math.floor(Math.random() * 50) + 25 // 25-75 req/s
        }
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw new Error('Failed to get performance metrics');
    }
  }

  static async getScalabilityMetrics(): Promise<any> {
    try {
      return {
        autoScaling: {
          enabled: true,
          minInstances: 2,
          maxInstances: 10,
          currentInstances: Math.floor(Math.random() * 6) + 2, // 2-8 instances
          targetCpuUtilization: 70
        },
        loadBalancing: {
          enabled: true,
          healthyInstances: Math.floor(Math.random() * 6) + 2, // 2-8 healthy instances
          totalInstances: Math.floor(Math.random() * 6) + 2, // 2-8 total instances
          distribution: 'round-robin'
        },
        caching: {
          hitRate: Math.floor(Math.random() * 20) + 80, // 80-100% hit rate
          missRate: Math.floor(Math.random() * 20) + 0, // 0-20% miss rate
          totalRequests: Math.floor(Math.random() * 100000) + 50000, // 50K-150K requests
          cacheSize: Math.floor(Math.random() * 2048) + 1024, // 1-3GB cache size
          evictions: Math.floor(Math.random() * 200) + 50 // 50-250 evictions
        },
        database: {
          connections: Math.floor(Math.random() * 100) + 50, // 50-150 connections
          maxConnections: 200,
          replicationLag: Math.random() * 2, // 0-2s replication lag
          readReplicas: 2,
          writeReplicas: 1
        }
      };
    } catch (error) {
      console.error('Error getting scalability metrics:', error);
      throw new Error('Failed to get scalability metrics');
    }
  }

  static async getOptimizationRecommendations(): Promise<any[]> {
    try {
      return [
        {
          id: '1',
          type: 'performance',
          title: 'Optimize Database Queries',
          description: 'Implement query optimization and indexing to reduce database response time by 40%',
          impact: 'high',
          effort: 'medium',
          estimatedSavings: 25000,
          priority: 1,
          status: 'pending'
        },
        {
          id: '2',
          type: 'scalability',
          title: 'Enable Redis Caching',
          description: 'Implement Redis caching layer to improve response times and reduce database load',
          impact: 'high',
          effort: 'low',
          estimatedSavings: 15000,
          priority: 2,
          status: 'in_progress'
        },
        {
          id: '3',
          type: 'cost',
          title: 'Optimize Auto-scaling Configuration',
          description: 'Adjust auto-scaling thresholds to reduce unnecessary instance scaling',
          impact: 'medium',
          effort: 'low',
          estimatedSavings: 8000,
          priority: 3,
          status: 'pending'
        },
        {
          id: '4',
          type: 'performance',
          title: 'Implement CDN',
          description: 'Deploy CDN to reduce latency and improve global performance',
          impact: 'high',
          effort: 'medium',
          estimatedSavings: 12000,
          priority: 4,
          status: 'pending'
        },
        {
          id: '5',
          type: 'security',
          title: 'Enable Rate Limiting',
          description: 'Implement rate limiting to prevent abuse and improve stability',
          impact: 'medium',
          effort: 'low',
          estimatedSavings: 5000,
          priority: 5,
          status: 'completed'
        }
      ];
    } catch (error) {
      console.error('Error getting optimization recommendations:', error);
      throw new Error('Failed to get optimization recommendations');
    }
  }

  static async updateOptimizationRecommendation(recommendationId: string, action: string, adminId?: string): Promise<any> {
    try {
      const recommendation = {
        id: recommendationId,
        action,
        updatedBy: adminId,
        updatedAt: new Date()
      };

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'OPTIMIZATION_RECOMMENDATION_UPDATED',
          details: JSON.stringify({
            recommendationId,
            action
          }),
          timestamp: new Date()
        }
      });

      return recommendation;
    } catch (error) {
      console.error('Error updating optimization recommendation:', error);
      throw new Error('Failed to update optimization recommendation');
    }
  }

  static async getPerformanceAlerts(filters: any = {}): Promise<any[]> {
    try {
      const alerts = [
        {
          id: '1',
          type: 'warning',
          title: 'High CPU Usage',
          description: 'CPU usage has exceeded 80% for the last 5 minutes',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          severity: 'medium',
          acknowledged: false,
          resolved: false
        },
        {
          id: '2',
          type: 'error',
          title: 'Database Connection Pool Exhausted',
          description: 'Database connection pool is at 95% capacity',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          severity: 'high',
          acknowledged: true,
          resolved: false
        },
        {
          id: '3',
          type: 'warning',
          title: 'Memory Usage High',
          description: 'Memory usage has reached 85% of available capacity',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          severity: 'medium',
          acknowledged: false,
          resolved: false
        },
        {
          id: '4',
          type: 'info',
          title: 'Auto-scaling Triggered',
          description: 'Auto-scaling has added 2 new instances due to high load',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          severity: 'low',
          acknowledged: true,
          resolved: true
        }
      ];

      // Apply filters
      let filteredAlerts = alerts;
      
      if (filters.severity && filters.severity !== 'all') {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
      }
      
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'resolved') {
          filteredAlerts = filteredAlerts.filter(alert => alert.resolved);
        } else if (filters.status === 'active') {
          filteredAlerts = filteredAlerts.filter(alert => !alert.resolved);
        }
      }

      return filteredAlerts;
    } catch (error) {
      console.error('Error getting performance alerts:', error);
      throw new Error('Failed to get performance alerts');
    }
  }

  static async updatePerformanceAlert(alertId: string, action: string, adminId?: string): Promise<any> {
    try {
      const alert = {
        id: alertId,
        action,
        updatedBy: adminId,
        updatedAt: new Date()
      };

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'PERFORMANCE_ALERT_UPDATED',
          details: JSON.stringify({
            alertId,
            action
          }),
          timestamp: new Date()
        }
      });

      return alert;
    } catch (error) {
      console.error('Error updating performance alert:', error);
      throw new Error('Failed to update performance alert');
    }
  }

  static async getPerformanceAnalytics(): Promise<any> {
    try {
      return {
        trends: {
          cpu: [45, 52, 48, 55, 42, 58, 51, 47, 53, 49],
          memory: [65, 72, 68, 75, 62, 78, 71, 67, 73, 69],
          responseTime: [125, 118, 132, 115, 128, 110, 135, 120, 125, 118],
          throughput: [850, 920, 780, 950, 820, 980, 760, 890, 840, 910]
        },
        bottlenecks: [
          {
            type: 'database',
            description: 'Slow query execution',
            impact: 'high',
            frequency: 15
          },
          {
            type: 'network',
            description: 'High latency connections',
            impact: 'medium',
            frequency: 8
          },
          {
            type: 'memory',
            description: 'Memory leaks in application',
            impact: 'low',
            frequency: 3
          }
        ],
        recommendations: [
          {
            type: 'immediate',
            title: 'Add database indexes',
            impact: 'high',
            effort: 'low'
          },
          {
            type: 'short-term',
            title: 'Implement connection pooling',
            impact: 'medium',
            effort: 'medium'
          },
          {
            type: 'long-term',
            title: 'Migrate to microservices',
            impact: 'high',
            effort: 'high'
          }
        ]
      };
    } catch (error) {
      console.error('Error getting performance analytics:', error);
      throw new Error('Failed to get performance analytics');
    }
  }

  static async configurePerformanceAlert(alertConfig: any, adminId?: string): Promise<any> {
    try {
      const config = {
        id: `config_${Date.now()}`,
        ...alertConfig,
        createdBy: adminId,
        createdAt: new Date()
      };

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: adminId || 'system',
          action: 'PERFORMANCE_ALERT_CONFIGURED',
          details: JSON.stringify({
            configId: config.id,
            alertType: alertConfig.type,
            thresholds: alertConfig.thresholds
          }),
          timestamp: new Date()
        }
      });

      return config;
    } catch (error) {
      console.error('Error configuring performance alert:', error);
      throw new Error('Failed to configure performance alert');
    }
  }

  static async exportPerformanceData(filters: any = {}): Promise<string> {
    try {
      const metrics = await this.getPerformanceMetrics(filters);
      const alerts = await this.getPerformanceAlerts(filters);
      
      // Generate CSV content
      const csvHeaders = [
        'Metric',
        'Value',
        'Unit',
        'Timestamp'
      ];

      const csvRows = [
        ['CPU Usage', metrics.cpu.usage, '%', new Date().toISOString()],
        ['Memory Usage', ((metrics.memory.used / metrics.memory.total) * 100).toFixed(2), '%', new Date().toISOString()],
        ['Response Time', metrics.application.responseTime, 'ms', new Date().toISOString()],
        ['Throughput', metrics.application.throughput, 'req/s', new Date().toISOString()],
        ['Error Rate', metrics.application.errorRate, '%', new Date().toISOString()],
        ['Active Users', metrics.application.activeUsers, 'users', new Date().toISOString()],
        ['Database Connections', metrics.database.connections, 'connections', new Date().toISOString()],
        ['Cache Hit Rate', metrics.database.cacheHitRate, '%', new Date().toISOString()]
      ];

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting performance data:', error);
      throw new Error('Failed to export performance data');
    }
  }
} 