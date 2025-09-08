import { authenticatedApiCall } from '../lib/apiUtils';

export interface PersonalAnalytics {
  usageStats: {
    totalSessions: number;
    totalTime: number;
    modulesUsed: number;
    filesCreated: number;
    messagesSent: number;
    connectionsMade: number;
  };
  moduleUsage: Array<{
    module: string;
    usageCount: number;
    lastUsed: string;
    totalTime: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    module: string;
    description: string;
    timestamp: string;
    duration?: number;
  }>;
}

export interface ModuleAnalytics {
  module: {
    id: string;
    name: string;
    category: string;
  };
  totalUsage: number;
  totalTime: number;
  lastUsed: string;
  activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    duration?: number;
  }>;
}

export interface AnalyticsExportData {
  personalAnalytics: PersonalAnalytics;
  moduleAnalytics: ModuleAnalytics[];
  exportDate: string;
  timeRange: string;
  format: 'csv' | 'json';
}

// Get personal analytics for the current user
export const getPersonalAnalytics = async (timeRange: '7d' | '30d' | '90d' = '30d'): Promise<PersonalAnalytics> => {
  const response = await authenticatedApiCall<{ success: boolean; data: PersonalAnalytics }>(`/api/analytics/personal?timeRange=${timeRange}`, {
    method: 'GET',
  });
  return response.data;
};

// Get module-specific analytics
export const getModuleAnalytics = async (moduleId: string, timeRange: '7d' | '30d' | '90d' = '30d'): Promise<ModuleAnalytics> => {
  const response = await authenticatedApiCall<{ success: boolean; data: ModuleAnalytics }>(`/api/analytics/modules/${moduleId}?timeRange=${timeRange}`, {
    method: 'GET',
  });
  return response.data;
};

// Export analytics data
export const exportAnalytics = async (format: 'csv' | 'json' = 'json', timeRange: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsExportData> => {
  const response = await authenticatedApiCall<{ success: boolean; data: AnalyticsExportData }>(`/api/analytics/export?format=${format}&timeRange=${timeRange}`, {
    method: 'GET',
  });
  return response.data;
}; 