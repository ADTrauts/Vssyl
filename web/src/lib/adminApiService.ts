import { getSession } from 'next-auth/react';

// Route admin API calls through Next.js API proxy to avoid CORS and centralize auth
const API_BASE = '/api/admin-portal';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}

class AdminApiService {
  private async getAuthHeaders() {
    const session = await getSession();
    console.log('Admin API - Session:', { 
      hasSession: !!session, 
      hasToken: !!session?.accessToken,
      tokenLength: session?.accessToken?.length,
      userRole: session?.user?.role,
      userEmail: session?.user?.email
    });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    } else {
      console.error('Admin API - No access token found in session');
    }
    
    return headers;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      console.log(`Admin API - Making request to ${endpoint}:`, {
        hasHeaders: !!headers,
        hasAuthHeader: !!headers.Authorization,
        authHeaderLength: headers.Authorization?.length,
        apiBase: API_BASE,
        fullUrl: `${API_BASE}${endpoint}`
      });
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        // We rely on Bearer tokens; cookies aren't required for admin API calls
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      console.log(`API Request to ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API Error (${endpoint}):`, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ============================================================================
  // DASHBOARD ANALYTICS
  // ============================================================================

  async getDashboardStats() {
    return this.makeRequest('/dashboard/stats');
  }

  async getRecentActivity() {
    return this.makeRequest('/dashboard/activity');
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.makeRequest(`/users?${searchParams.toString()}`);
  }

  async getUserDetails(userId: string) {
    return this.makeRequest(`/users/${userId}`);
  }

  async updateUserStatus(userId: string, status: string, reason?: string) {
    return this.makeRequest(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async resetUserPassword(userId: string) {
    return this.makeRequest(`/users/${userId}/reset-password`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // CONTENT MODERATION
  // ============================================================================

  async getReportedContent(filters: any) {
    return this.makeRequest('/moderation/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });
  }

  async updateReportStatus(reportId: string, status: string, action: string, reason?: string) {
    return this.makeRequest(`/moderation/reports/${reportId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, action, reason }),
    });
  }

  // ============================================================================
  // PLATFORM ANALYTICS
  // ============================================================================

  async getSystemMetrics(timeRange: string = '24h') {
    return this.makeRequest(`/analytics/system?timeRange=${timeRange}`);
  }

  async getUserAnalytics(timeRange: string = '30d') {
    return this.makeRequest(`/analytics/users?timeRange=${timeRange}`);
  }

  // ============================================================================
  // FINANCIAL MANAGEMENT
  // ============================================================================

  async getSubscriptions(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.makeRequest(`/billing/subscriptions?${searchParams.toString()}`);
  }

  async getPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.makeRequest(`/billing/payments?${searchParams.toString()}`);
  }

  // ============================================================================
  // SECURITY & COMPLIANCE
  // ============================================================================

  async getSecurityEvents(params: {
    page?: number;
    limit?: number;
    severity?: string;
    type?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.makeRequest(`/security/events?${searchParams.toString()}`);
  }

  async getSecurityMetrics() {
    return this.makeRequest('/security/metrics');
  }

  async getComplianceStatus() {
    return this.makeRequest('/security/compliance');
  }

  async resolveSecurityEvent(eventId: string) {
    return this.makeRequest(`/security/events/${eventId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.makeRequest(`/security/audit-logs?${searchParams.toString()}`);
  }

  // ============================================================================
  // SYSTEM ADMINISTRATION
  // ============================================================================

  async getSystemHealth() {
    return this.makeRequest('/system/health');
  }

  async getSystemConfig() {
    return this.makeRequest('/system/config');
  }

  async updateSystemConfig(configKey: string, configValue: any, description: string) {
    return this.makeRequest(`/system/config/${configKey}`, {
      method: 'PATCH',
      body: JSON.stringify({ configValue, description }),
    });
  }

  // System administration methods
  async getBackupStatus() {
    return this.makeRequest('/system/backup');
  }

  async createBackup() {
    return this.makeRequest('/system/backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getMaintenanceMode() {
    return this.makeRequest('/system/maintenance');
  }

  async setMaintenanceMode(enabled: boolean, message?: string) {
    return this.makeRequest('/system/maintenance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled, message }),
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async exportData(endpoint: string, params: Record<string, any> = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE}${endpoint}/export?${searchParams.toString()}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${endpoint.replace('/', '')}_export.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async bulkAction(endpoint: string, action: string, itemIds: string[]) {
    return this.makeRequest(`${endpoint}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ action, itemIds }),
    });
  }

  // Analytics methods
  async getAnalytics(filters: any) {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    return this.makeRequest(`/analytics${query ? `?${query}` : ''}`, {
      method: 'GET'
    });
  }

  async exportAnalytics(filters: any, format: 'csv' | 'json') {
    return this.makeRequest(`/analytics/export?format=${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });
  }

  async getRealTimeMetrics() {
    return this.makeRequest('/analytics/realtime');
  }

  async getCustomReport(reportConfig: any) {
    return this.makeRequest('/analytics/custom-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportConfig),
    });
  }

  // Moderation methods
  async getModerationStats() {
    return this.makeRequest('/moderation/stats');
  }

  async getModerationRules() {
    return this.makeRequest('/moderation/rules');
  }

  async bulkModerationAction(reportIds: string[], action: string) {
    return this.makeRequest('/moderation/bulk-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reportIds, action }),
    });
  }

  // Module Management methods
  async getModuleSubmissions(filters?: any): Promise<ApiResponse<ModuleSubmission[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value as string);
        }
      });
    }

    const endpoint = `/modules/submissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Getting module submissions:', endpoint);
    
    return this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  async getModuleStats(): Promise<ApiResponse<ModuleStats>> {
    console.log('Getting module stats');
    return this.makeRequest(`/modules/stats`, {
      method: 'GET'
    });
  }

  async reviewModuleSubmission(
    submissionId: string, 
    action: 'approve' | 'reject', 
    reviewNotes?: string
  ): Promise<ApiResponse<any>> {
    console.log('Reviewing module submission:', submissionId, action);
    return this.makeRequest(`/modules/submissions/${submissionId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reviewNotes })
    });
  }

  async bulkModuleAction(
    submissionIds: string[], 
    action: 'approve' | 'reject'
  ): Promise<ApiResponse<any>> {
    console.log('Bulk module action:', action, submissionIds);
    return this.makeRequest(`/modules/bulk-action`, {
      method: 'POST',
      body: JSON.stringify({ submissionIds, action })
    });
  }

  async getModuleAnalytics(): Promise<ApiResponse<any>> {
    console.log('Getting module analytics');
    return this.makeRequest(`/modules/analytics`, {
      method: 'GET'
    });
  }

  async getDeveloperStats(): Promise<ApiResponse<any>> {
    console.log('Getting developer stats');
    return this.makeRequest(`/modules/developers/stats`, {
      method: 'GET'
    });
  }

  async updateModuleStatus(
    moduleId: string, 
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  ): Promise<ApiResponse<any>> {
    console.log('Updating module status:', moduleId, status);
    return this.makeRequest(`/modules/${moduleId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async getModuleRevenue(moduleId: string): Promise<ApiResponse<any>> {
    console.log('Getting module revenue:', moduleId);
    return this.makeRequest(`/modules/${moduleId}/revenue`, {
      method: 'GET'
    });
  }

  async exportModuleData(filters?: any): Promise<ApiResponse<Blob>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value as string);
        }
      });
    }

    const endpoint = `/modules/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Exporting module data:', endpoint);
    
    return this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  // Business Intelligence methods
  async getBusinessIntelligence(filters?: any): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value as string);
        }
      });
    }

    const endpoint = `/business-intelligence${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Getting business intelligence data:', endpoint);
    
    return this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  async exportBusinessIntelligence(filters?: any, format: 'csv' | 'pdf' = 'csv'): Promise<ApiResponse<Blob>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value as string);
        }
      });
    }
    queryParams.append('format', format);

    const endpoint = `/business-intelligence/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Exporting business intelligence data:', endpoint);
    
    return this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  async createABTest(testData: any): Promise<ApiResponse<any>> {
    console.log('Creating A/B test:', testData);
    return this.makeRequest(`/business-intelligence/ab-tests`, {
      method: 'POST',
      body: JSON.stringify(testData)
    });
  }

  async getABTestResults(testId: string): Promise<ApiResponse<any>> {
    console.log('Getting A/B test results:', testId);
    return this.makeRequest(`/business-intelligence/ab-tests/${testId}/results`, {
      method: 'GET'
    });
  }

  async updateABTest(testId: string, updates: any): Promise<ApiResponse<any>> {
    console.log('Updating A/B test:', testId, updates);
    return this.makeRequest(`/business-intelligence/ab-tests/${testId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async getUserSegments(): Promise<ApiResponse<any>> {
    console.log('Getting user segments');
    return this.makeRequest(`/business-intelligence/user-segments`, {
      method: 'GET'
    });
  }

  async createUserSegment(segmentData: any): Promise<ApiResponse<any>> {
    console.log('Creating user segment:', segmentData);
    return this.makeRequest(`/business-intelligence/user-segments`, {
      method: 'POST',
      body: JSON.stringify(segmentData)
    });
  }

  async getPredictiveInsights(): Promise<ApiResponse<any>> {
    console.log('Getting predictive insights');
    return this.makeRequest(`/business-intelligence/predictive-insights`, {
      method: 'GET'
    });
  }

  async getCompetitiveAnalysis(): Promise<ApiResponse<any>> {
    console.log('Getting competitive analysis');
    return this.makeRequest(`/business-intelligence/competitive-analysis`, {
      method: 'GET'
    });
  }

  async generateCustomReport(reportConfig: any): Promise<ApiResponse<any>> {
    console.log('Generating custom report:', reportConfig);
    return this.makeRequest(`/business-intelligence/custom-report`, {
      method: 'POST',
      body: JSON.stringify(reportConfig)
    });
  }

  // Customer Support methods
  async getSupportTickets(filters?: any): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value as string);
        }
      });
    }

    const endpoint = `/support/tickets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Getting support tickets:', endpoint);
    
    return this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  async getSupportStats(): Promise<ApiResponse<any>> {
    console.log('Getting support stats');
    return this.makeRequest(`/support/stats`, {
      method: 'GET'
    });
  }

  async updateSupportTicket(ticketId: string, action: string, data?: any): Promise<ApiResponse<any>> {
    console.log('Updating support ticket:', ticketId, action);
    return this.makeRequest(`/support/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, data })
    });
  }

  async getKnowledgeBase(): Promise<ApiResponse<any>> {
    console.log('Getting knowledge base');
    return this.makeRequest(`/support/knowledge-base`, {
      method: 'GET'
    });
  }

  async updateKnowledgeArticle(articleId: string, action: string, data?: any): Promise<ApiResponse<any>> {
    console.log('Updating knowledge article:', articleId, action);
    return this.makeRequest(`/support/knowledge-base/${articleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, data })
    });
  }

  async getLiveChats(): Promise<ApiResponse<any>> {
    console.log('Getting live chats');
    return this.makeRequest(`/support/live-chats`, {
      method: 'GET'
    });
  }

  async joinLiveChat(chatId: string): Promise<ApiResponse<any>> {
    console.log('Joining live chat:', chatId);
    return this.makeRequest(`/support/live-chats/${chatId}/join`, {
      method: 'POST'
    });
  }

  async getSupportAnalytics(): Promise<ApiResponse<any>> {
    console.log('Getting support analytics');
    return this.makeRequest(`/support/analytics`, {
      method: 'GET'
    });
  }

  async createSupportTicket(ticketData: any): Promise<ApiResponse<any>> {
    console.log('Creating support ticket:', ticketData);
    return this.makeRequest(`/support/tickets`, {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  }

  async createKnowledgeArticle(articleData: any): Promise<ApiResponse<any>> {
    console.log('Creating knowledge article:', articleData);
    return this.makeRequest(`/support/knowledge-base`, {
      method: 'POST',
      body: JSON.stringify(articleData)
    });
  }

  async exportSupportData(filters?: any, format: 'csv' | 'pdf' = 'csv'): Promise<ApiResponse<Blob>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value as string);
        }
      });
    }
    queryParams.append('format', format);

    const endpoint = `/support/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Exporting support data:', endpoint);
    
    return this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  // Performance & Scalability methods
  async getPerformanceMetrics(filters?: any): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value as string);
        }
      });
    }

    const endpoint = `/performance/metrics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Getting performance metrics:', endpoint);
    
    return this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  async getScalabilityMetrics(): Promise<ApiResponse<any>> {
    console.log('Getting scalability metrics');
    return this.makeRequest(`/performance/scalability`, {
      method: 'GET'
    });
  }

  async getOptimizationRecommendations(): Promise<ApiResponse<any>> {
    console.log('Getting optimization recommendations');
    return this.makeRequest(`/performance/optimization`, {
      method: 'GET'
    });
  }

  async updateOptimizationRecommendation(recommendationId: string, action: string): Promise<ApiResponse<any>> {
    console.log('Updating optimization recommendation:', recommendationId, action);
    return this.makeRequest(`/performance/optimization/${recommendationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action })
    });
  }

  async getPerformanceAlerts(filters?: any): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value as string);
        }
      });
    }

    const endpoint = `/performance/alerts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Getting performance alerts:', endpoint);
    
    return this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  async updatePerformanceAlert(alertId: string, action: string): Promise<ApiResponse<any>> {
    console.log('Updating performance alert:', alertId, action);
    return this.makeRequest(`/performance/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action })
    });
  }

  async getPerformanceAnalytics(): Promise<ApiResponse<any>> {
    console.log('Getting performance analytics');
    return this.makeRequest(`/performance/analytics`, {
      method: 'GET'
    });
  }

  async configurePerformanceAlert(alertConfig: any): Promise<ApiResponse<any>> {
    console.log('Configuring performance alert:', alertConfig);
    return this.makeRequest(`/performance/alerts/configure`, {
      method: 'POST',
      body: JSON.stringify(alertConfig)
    });
  }

  async exportPerformanceData(filters?: any, format: 'csv' | 'pdf' = 'csv'): Promise<ApiResponse<Blob>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value as string);
        }
      });
    }
    queryParams.append('format', format);

    const endpoint = `/performance/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Exporting performance data:', endpoint);
    
    return this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  async exportSecurityReport(filters: any, format: 'csv' | 'json') {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value as string);
        }
      });
    }
    queryParams.append('format', format);

    const endpoint = `/security/export?${queryParams.toString()}`;
    console.log('Exporting security report:', endpoint);
    
    return this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  // Add type definitions for module management
  async startImpersonation(userId: string, reason?: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/users/${userId}/impersonate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
  }

  async endImpersonation(): Promise<ApiResponse<any>> {
    return this.makeRequest('/impersonation/end', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getCurrentImpersonation(): Promise<ApiResponse<any>> {
    return this.makeRequest('/impersonation/current');
  }

  async getImpersonationHistory(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    return this.makeRequest(`/impersonation/history?${queryParams.toString()}`);
  }
}

// Add type definitions for module management
interface ModuleSubmission {
  id: string;
  moduleId: string;
  submitterId: string;
  submitter: {
    id: string;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  module: {
    id: string;
    name: string;
    description: string;
    version: string;
    category: string;
    developer: {
      id: string;
      name: string;
      email: string;
    };
    manifest: any;
    permissions: string[];
    dependencies: string[];
    downloads?: number;
    rating?: number;
    reviewCount?: number;
    pricingTier?: string;
    revenueSplit?: number;
  };
}

interface ModuleStats {
  totalSubmissions: number;
  pendingReviews: number;
  approvedToday: number;
  rejectedToday: number;
  totalRevenue: number;
  activeDevelopers: number;
  averageRating: number;
  topCategory: string;
}

// Export types for better TypeScript support
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBusinesses: number;
  monthlyRevenue: number;
  systemHealth: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  userNumber: string;
  role: string;
  status: string;
  createdAt: string;
  lastActive: string;
  emailVerified: boolean;
  _count?: {
    businesses: number;
    conversations: number;
    files: number;
  };
}

export interface ContentReport {
  id: string;
  contentType: string;
  reason: string;
  status: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  action?: string;
  reporter: {
    email: string;
    name: string;
  };
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  userId?: string;
  userEmail?: string;
  adminId?: string;
  adminEmail?: string;
  ipAddress: string;
  userAgent: string;
  details: any;
  timestamp: string;
  resolved: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  success: boolean;
  admin?: {
    email: string;
    name: string;
  };
}

export interface SystemConfig {
  id: string;
  configKey: string;
  configValue: any;
  description?: string;
  updatedBy: string;
  updatedAt: string;
} 

// Named instance export for use in admin portal pages
export const adminApiService = new AdminApiService();