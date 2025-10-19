import { logger } from '../lib/logger';

interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  service: 'vssyl-server' | 'vssyl-web';
  environment: string;
}

interface LogFilters {
  level?: 'debug' | 'info' | 'warn' | 'error';
  service?: 'vssyl-server' | 'vssyl-web';
  operation?: string;
  userId?: string;
  businessId?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface LogResult {
  entries: LogEntry[];
  total: number;
  hasMore: boolean;
}

interface LogAnalytics {
  totalLogs: number;
  errorRate: number;
  logsByLevel: Record<string, number>;
  logsByService: Record<string, number>;
  logsByOperation: Record<string, number>;
  topErrors: Array<{ message: string; count: number }>;
  performanceMetrics: {
    averageResponseTime: number;
    slowestOperations: Array<{ operation: string; avgDuration: number }>;
  };
}

interface LogAlert {
  id: string;
  name: string;
  description: string;
  conditions: {
    level?: string[];
    operation?: string[];
    message?: string;
  };
  actions: {
    email?: string[];
    webhook?: string;
    threshold?: number;
  };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RetentionSettings {
  defaultRetentionDays: number;
  errorRetentionDays: number;
  auditRetentionDays: number;
  enabled: boolean;
  autoCleanup: boolean;
}

class LogService {
  private logs: LogEntry[] = [];
  private alerts: LogAlert[] = [];
  private retentionSettings: RetentionSettings = {
    defaultRetentionDays: 30,
    errorRetentionDays: 90,
    auditRetentionDays: 365,
    enabled: true,
    autoCleanup: true
  };

  constructor() {
    // Initialize with some mock data for development
    this.initializeMockData();
    
    // Set up periodic cleanup if auto-cleanup is enabled
    if (this.retentionSettings.autoCleanup) {
      setInterval(() => {
        this.cleanupOldLogs(this.retentionSettings.defaultRetentionDays);
      }, 24 * 60 * 60 * 1000); // Run daily
    }
  }

  private initializeMockData(): void {
    // Add some mock logs for demonstration
    const now = new Date();
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        level: 'info',
        message: 'User logged in successfully',
        metadata: {
          userId: 'user123',
          operation: 'user_login',
          ipAddress: '192.168.1.100'
        },
        timestamp: new Date(now.getTime() - 300000).toISOString(), // 5 minutes ago
        service: 'vssyl-server',
        environment: 'production'
      },
      {
        id: '2',
        level: 'error',
        message: 'Database connection failed',
        metadata: {
          operation: 'database_connection',
          error: {
            message: 'Connection timeout',
            code: 'TIMEOUT'
          }
        },
        timestamp: new Date(now.getTime() - 600000).toISOString(), // 10 minutes ago
        service: 'vssyl-server',
        environment: 'production'
      },
      {
        id: '3',
        level: 'warn',
        message: 'Slow database query detected',
        metadata: {
          operation: 'database_query',
          duration: 3200,
          query: 'SELECT * FROM users WHERE...'
        },
        timestamp: new Date(now.getTime() - 900000).toISOString(), // 15 minutes ago
        service: 'vssyl-server',
        environment: 'production'
      },
      {
        id: '4',
        level: 'info',
        message: 'File uploaded successfully',
        metadata: {
          userId: 'user456',
          operation: 'file_upload',
          fileName: 'document.pdf',
          fileSize: 2048000
        },
        timestamp: new Date(now.getTime() - 1200000).toISOString(), // 20 minutes ago
        service: 'vssyl-server',
        environment: 'production'
      },
      {
        id: '5',
        level: 'error',
        message: 'Component error in Dashboard',
        metadata: {
          operation: 'component_error',
          component: 'Dashboard',
          error: {
            message: 'Cannot read property of undefined',
            stack: 'TypeError: Cannot read property...'
          }
        },
        timestamp: new Date(now.getTime() - 1500000).toISOString(), // 25 minutes ago
        service: 'vssyl-web',
        environment: 'production'
      }
    ];

    this.logs = mockLogs;
  }

  async storeClientLog(logEntry: Omit<LogEntry, 'id'>): Promise<void> {
    const entry: LogEntry = {
      ...logEntry,
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.logs.unshift(entry); // Add to beginning for newest first

    // In production, this would also store to Google Cloud Logging
    await logger.info('Client log stored', {
      operation: 'store_client_log',
      logId: entry.id,
      level: entry.level,
      service: entry.service
    });
  }

  async getLogs(filters: LogFilters): Promise<LogResult> {
    let filteredLogs = [...this.logs];

    // Apply filters
    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }

    if (filters.service) {
      filteredLogs = filteredLogs.filter(log => log.service === filters.service);
    }

    if (filters.operation) {
      filteredLogs = filteredLogs.filter(log => 
        log.metadata?.operation === filters.operation
      );
    }

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => 
        log.metadata?.userId === filters.userId
      );
    }

    if (filters.businessId) {
      filteredLogs = filteredLogs.filter(log => 
        log.metadata?.businessId === filters.businessId
      );
    }

    if (filters.module) {
      filteredLogs = filteredLogs.filter(log => 
        log.metadata?.module === filters.module
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= endDate
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.metadata).toLowerCase().includes(searchLower)
      );
    }

    const total = filteredLogs.length;
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      entries: paginatedLogs,
      total,
      hasMore
    };
  }

  async exportLogs(filters: LogFilters, format: string): Promise<string | LogEntry[]> {
    const result = await this.getLogs({ ...filters, limit: 10000 }); // Get up to 10k logs for export

    if (format === 'csv') {
      const headers = ['Timestamp', 'Level', 'Service', 'Message', 'Operation', 'User ID', 'Business ID', 'Module'];
      const rows = result.entries.map(log => [
        log.timestamp,
        log.level,
        log.service,
        log.message,
        log.metadata?.operation || '',
        log.metadata?.userId || '',
        log.metadata?.businessId || '',
        log.metadata?.module || ''
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    }

    return result.entries;
  }

  async getLogAnalytics(filters: LogFilters): Promise<LogAnalytics> {
    const result = await this.getLogs({ ...filters, limit: 10000 });
    const logs = result.entries;

    const totalLogs = logs.length;
    const errorLogs = logs.filter(log => log.level === 'error').length;
    const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;

    // Logs by level
    const logsByLevel = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Logs by service
    const logsByService = logs.reduce((acc, log) => {
      acc[log.service] = (acc[log.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Logs by operation
    const logsByOperation = logs.reduce((acc, log) => {
      const operation = log.metadata?.operation as string || 'unknown';
      acc[operation] = (acc[operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top errors
    const errorMessages = logs
      .filter(log => log.level === 'error')
      .map(log => log.message);
    
    const errorCounts = errorMessages.reduce((acc, message) => {
      acc[message] = (acc[message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Performance metrics
    const performanceLogs = logs.filter(log => 
      log.metadata?.duration && typeof log.metadata.duration === 'number'
    );

    const averageResponseTime = performanceLogs.length > 0
      ? performanceLogs.reduce((sum, log) => sum + (log.metadata?.duration as number), 0) / performanceLogs.length
      : 0;

    const operationDurations = performanceLogs.reduce((acc, log) => {
      const operation = log.metadata?.operation as string || 'unknown';
      if (!acc[operation]) {
        acc[operation] = [];
      }
      acc[operation].push(log.metadata?.duration as number);
      return acc;
    }, {} as Record<string, number[]>);

    const slowestOperations = Object.entries(operationDurations)
      .map(([operation, durations]) => ({
        operation,
        avgDuration: durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return {
      totalLogs,
      errorRate,
      logsByLevel,
      logsByService,
      logsByOperation,
      topErrors,
      performanceMetrics: {
        averageResponseTime,
        slowestOperations
      }
    };
  }

  async getLogAlerts(): Promise<LogAlert[]> {
    return this.alerts;
  }

  async createLogAlert(alertData: Omit<LogAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<LogAlert> {
    const alert: LogAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.alerts.push(alert);

    await logger.info('Log alert created', {
      operation: 'create_log_alert',
      alertId: alert.id,
      alertName: alert.name
    });

    return alert;
  }

  async updateLogAlert(alertId: string, updateData: Partial<Omit<LogAlert, 'id' | 'createdAt'>>): Promise<LogAlert> {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex === -1) {
      throw new Error('Log alert not found');
    }

    this.alerts[alertIndex] = {
      ...this.alerts[alertIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await logger.info('Log alert updated', {
      operation: 'update_log_alert',
      alertId: alertId
    });

    return this.alerts[alertIndex];
  }

  async deleteLogAlert(alertId: string): Promise<void> {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex === -1) {
      throw new Error('Log alert not found');
    }

    this.alerts.splice(alertIndex, 1);

    await logger.info('Log alert deleted', {
      operation: 'delete_log_alert',
      alertId: alertId
    });
  }

  async cleanupOldLogs(daysToKeep: number): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const initialCount = this.logs.length;

    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffDate);
    
    const deletedCount = initialCount - this.logs.length;

    await logger.info('Log cleanup completed', {
      operation: 'cleanup_old_logs',
      daysToKeep,
      deletedCount,
      remainingCount: this.logs.length
    });

    return { deletedCount };
  }

  async getRetentionSettings(): Promise<RetentionSettings> {
    return this.retentionSettings;
  }

  async updateRetentionSettings(settings: Partial<RetentionSettings>): Promise<RetentionSettings> {
    this.retentionSettings = {
      ...this.retentionSettings,
      ...settings
    };

    await logger.info('Retention settings updated', {
      operation: 'update_retention_settings',
      settings: this.retentionSettings
    });

    return this.retentionSettings;
  }
}

// Export singleton instance
export const logService = new LogService();
