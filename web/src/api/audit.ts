import { authenticatedApiCall } from '../lib/apiUtils';

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  conversationId?: string;
  resourceType?: string;
  resourceId?: string;
  details: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuditLogResponse {
  success: boolean;
  data: {
    auditLogs: AuditLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface AuditStats {
  totalActions: number;
  actionBreakdown: Array<{
    action: string;
    count: number;
  }>;
  resourceBreakdown: Array<{
    resourceType: string;
    count: number;
  }>;
  recentActivity: number;
}

export interface AuditStatsResponse {
  success: boolean;
  data: AuditStats;
}

// Get personal audit logs
export const getPersonalAuditLogs = async (
  accessToken: string,
  params?: {
    page?: number;
    limit?: number;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<AuditLogResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const response = await authenticatedApiCall<AuditLogResponse>(
    `/audit/personal?${queryParams.toString()}`,
    {},
    accessToken
  );
  
  return response;
};

// Export personal audit logs
export const exportPersonalAuditLogs = async (
  accessToken: string,
  params?: {
    format?: 'json' | 'csv';
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<Blob | AuditLogResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const response = await authenticatedApiCall<AuditLogResponse>(
    `/audit/personal/export?${queryParams.toString()}`,
    {},
    accessToken
  );
  
  return response;
};

// Get personal audit statistics
export const getPersonalAuditStats = async (
  accessToken: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<AuditStatsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const response = await authenticatedApiCall<AuditStatsResponse>(
    `/audit/personal/stats?${queryParams.toString()}`,
    {},
    accessToken
  );
  
  return response;
}; 