// Frontend API utilities for log management
import { authenticatedApiCall } from '../lib/apiUtils';

export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  service: 'vssyl-server' | 'vssyl-web';
  environment: string;
}

export interface LogFilters {
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

export interface LogResult {
  logs: LogEntry[];
  total: number;
  hasMore: boolean;
}

export interface LogAnalytics {
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

export interface LogAlert {
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

export const logsApi = {
  // Get logs with filtering
  async getLogs(filters: LogFilters, token: string): Promise<LogResult> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return authenticatedApiCall<LogResult>(`/admin/logs?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }, token);
  },

  // Export logs
  async exportLogs(filters: LogFilters, format: 'json' | 'csv', token: string): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    queryParams.append('format', format);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://vssyl-server-235369681725.us-central1.run.app'}/api/admin/logs/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  },

  // Get log analytics
  async getLogAnalytics(filters: Partial<LogFilters>, token: string): Promise<LogAnalytics> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return authenticatedApiCall<LogAnalytics>(`/admin/logs/analytics?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }, token);
  },

  // Get log alerts
  async getLogAlerts(token: string): Promise<LogAlert[]> {
    return authenticatedApiCall<LogAlert[]>('/admin/logs/alerts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }, token);
  },

  // Create log alert
  async createLogAlert(alertData: Omit<LogAlert, 'id' | 'createdAt' | 'updatedAt'>, token: string): Promise<LogAlert> {
    return authenticatedApiCall<LogAlert>('/admin/logs/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(alertData),
    }, token);
  },

  // Update log alert
  async updateLogAlert(alertId: string, updateData: Partial<Omit<LogAlert, 'id' | 'createdAt'>>, token: string): Promise<LogAlert> {
    return authenticatedApiCall<LogAlert>(`/admin/logs/alerts/${alertId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    }, token);
  },

  // Delete log alert
  async deleteLogAlert(alertId: string, token: string): Promise<void> {
    return authenticatedApiCall<void>(`/admin/logs/alerts/${alertId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }, token);
  },

  // Get log stream (for real-time updates)
  async getLogStream(filters: Partial<LogFilters>, token: string): Promise<{ logs: LogEntry[]; timestamp: string }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return authenticatedApiCall<{ logs: LogEntry[]; timestamp: string }>(`/admin/logs/stream?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }, token);
  },

  // Cleanup old logs
  async cleanupOldLogs(daysToKeep: number, token: string): Promise<{ deletedCount: number }> {
    return authenticatedApiCall<{ deletedCount: number }>('/admin/logs/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ daysToKeep }),
    }, token);
  },

  // Get retention settings
  async getRetentionSettings(token: string): Promise<{
    defaultRetentionDays: number;
    errorRetentionDays: number;
    auditRetentionDays: number;
    enabled: boolean;
    autoCleanup: boolean;
  }> {
    return authenticatedApiCall<{
      defaultRetentionDays: number;
      errorRetentionDays: number;
      auditRetentionDays: number;
      enabled: boolean;
      autoCleanup: boolean;
    }>('/admin/logs/retention', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }, token);
  },

  // Update retention settings
  async updateRetentionSettings(settings: {
    defaultRetentionDays?: number;
    errorRetentionDays?: number;
    auditRetentionDays?: number;
    enabled?: boolean;
    autoCleanup?: boolean;
  }, token: string): Promise<void> {
    return authenticatedApiCall<void>('/admin/logs/retention', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    }, token);
  }
};
