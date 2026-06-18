import * as adminUserService from './admin/adminUserService';
import * as adminImpersonationService from './admin/adminImpersonationService';
import * as adminModerationService from './admin/adminModerationService';
import * as adminModuleGovernanceService from './admin/adminModuleGovernanceService';
import * as adminSecurityService from './admin/adminSecurityService';
import * as adminBillingService from './admin/adminBillingService';
import * as adminSupportService from './admin/adminSupportService';
import * as adminAnalyticsService from './admin/adminAnalyticsService';
import * as adminSystemOpsService from './admin/adminSystemOpsService';
import * as adminPerformanceService from './admin/adminPerformanceService';
import type {
  AdminABTestPayload,
  AdminABTestResultsPayload,
  AdminCompetitiveAnalysisPayload,
  AdminCustomReportPayload,
  AdminDeveloperStatsPayload,
  AdminJsonObject,
  AdminKnowledgeArticleCreateResult,
  AdminKnowledgeArticleMutationResult,
  AdminLiveChatJoinResult,
  AdminModuleAnalyticsPayload,
  AdminModuleRevenuePayload,
  AdminModuleStatsPayload,
  AdminOptimizationRecommendationMutation,
  AdminPerformanceAlertConfigureResult,
  AdminPerformanceAlertMutation,
  AdminPerformanceAnalyticsPayload,
  AdminPerformanceMetricsPayload,
  AdminScalabilityMetricsPayload,
  AdminSupportAnalyticsPayload,
  AdminSupportStatsPayload,
  AdminSupportTicketCreateResult,
  AdminSupportTicketMutationResult,
  AdminUserSegmentPayload,
} from './admin/adminServiceContracts';

// ============================================================================
// INTERFACES
// ============================================================================

interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}

interface ContentReport {
  id: string;
  contentType: 'post' | 'comment' | 'file' | 'message';
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  reporter: {
    email: string;
    name: string;
  };
  content: {
    id: string;
    title: string;
    description: string;
    url: string;
  };
  severity: 'low' | 'medium' | 'high';
  autoModerated: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  action?: string;
}

interface ContentReportFilters {
  status?: string;
  severity?: string;
  contentType?: string;
  page?: number;
  limit?: number;
}

interface AnalyticsFilters {
  dateRange?: string;
  userType?: string;
  metric?: string;
  businessId?: string;
  moduleId?: string;
}

interface SecurityEventData {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  adminId: string;
  adminEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

interface SystemConfig {
  configKey: string;
  configValue: string | number | boolean | Record<string, unknown>;
  description: string;
}

interface ABTestData {
  name: string;
  description: string;
  variantA: Record<string, unknown>;
  variantB: Record<string, unknown>;
  trafficSplit: number;
  metrics: string[];
}

interface UserSegmentData {
  name: string;
  description: string;
  criteria: Record<string, unknown>;
  filters: Record<string, unknown>;
}

interface ReportConfig {
  name: string;
  type: string;
  parameters: Record<string, unknown>;
  format: string;
  filters: Record<string, unknown>;
}

interface SupportTicketData {
  title: string;
  description: string;
  priority: string;
  category: string;
  userId?: string;
  customerId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  customer: {
    id: string;
    name: string;
    email: string;
    plan: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  responseTime: number;
  satisfaction?: number;
  tags: string[];
  attachments: string[];
}

interface SupportTicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  dateRange?: string;
}

interface KnowledgeArticleData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  metadata?: Record<string, unknown>;
}

interface PerformanceAlertConfig {
  metric: string;
  threshold: number;
  condition: 'above' | 'below';
  severity: string;
  notificationChannels: string[];
}

interface SecurityReportFilters {
  severity?: string;
  status?: string;
  timeRange?: string;
}

interface ModuleSubmission {
  id: string;
  status: string;
  submittedAt: Date;
  reviewedAt?: Date | null;
  reviewNotes?: string | null;
  module: {
    id: string;
    name: string;
    category: string;
    description?: string | null;
    version?: string | null;
    manifest?: Record<string, unknown> | null;
    permissions?: string[] | null;
    dependencies?: string[] | null;
    downloads?: number | null;
    rating?: number | null;
    pricingTier?: string | null;
    latestVersion?: {
      id: string;
      version: string;
      status: string;
      isCurrent: boolean;
      artifact?: {
        scanStatus: string;
        scanSummary?: Record<string, unknown> | null;
        sha256: string;
        sizeBytes: number;
      } | null;
    } | null;
    business?: {
      id: string;
      name: string;
      isDeveloperBusiness: boolean;
      developerBusinessLinkedAt?: Date | null;
      developerBusinessLinkedBy?: string | null;
    } | null;
    developer: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  submitter: {
    id: string;
    name: string | null;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface AnalyticsData {
  userGrowth: {
    total: number;
    newThisMonth: number;
    growthRate: number;
    monthlyTrend: unknown[];
  };
  revenue: {
    total: number;
    thisMonth: number;
    growthRate: number;
    monthlyTrend: unknown[];
  };
  engagement: {
    activeUsers: number;
    avgSessionDuration: number | null;
    retentionRate: number | null;
    sessionMetricsStatus?: 'available' | 'unavailable';
    dailyActiveUsers: unknown[];
  };
  system: {
    status?: 'available' | 'unavailable';
    uptime: number | null;
    avgResponseTime: number | null;
    errorRate: number | null;
    performanceTrend: unknown[];
    performanceTrendStatus?: 'available' | 'unavailable';
  };
}

interface SystemMetricData {
  metricType: string;
  metricName: string;
  metricValue: number;
  metadata?: Record<string, unknown>;
}

interface ModuleDataFilters {
  status?: string;
  category?: string;
  dateRange?: string;
  developerId?: string;
}

interface BusinessIntelligenceFilters {
  dateRange?: string;
  businessId?: string;
  moduleId?: string;
  userType?: string;
  metric?: string;
}

interface BusinessIntelligenceData {
  userGrowth: unknown; // Will be defined by getUserGrowthMetrics return type
  revenueMetrics: unknown; // Will be defined by getRevenueMetrics return type
  engagementMetrics: unknown; // Will be defined by getEngagementMetrics return type
  predictiveInsights: unknown; // Will be defined by getPredictiveInsights return type
  abTests: unknown; // Will be defined by getABTests return type
  userSegments: unknown; // Will be defined by getUserSegments return type
  competitiveAnalysis: unknown; // Will be defined by getCompetitiveAnalysis return type
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
  };
  status: string;
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
}

interface PerformanceAlertFilters {
  severity?: string;
  status?: string;
  type?: string;
}

interface PerformanceAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  severity: string;
  acknowledged: boolean;
  resolved: boolean;
}

interface LiveChat {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  agent?: {
    id: string;
    name: string;
  };
  status: string;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  duration: number;
}

interface OptimizationRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
  estimatedSavings: number;
  priority: number;
  status: string;
}

export class AdminService {
  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  static async getUsers(params: UserFilters) {
    return adminUserService.listUsers(params);
  }

  static async getUserDetails(userId: string) {
    return adminUserService.getUserDetailsExtended(userId);
  }

  static async updateUserStatus(userId: string, status: string, adminId: string, reason?: string) {
    return adminUserService.updateUserStatusLegacy(userId, status, adminId, reason);
  }

  static async resetUserPassword(userId: string, adminId: string) {
    return adminUserService.resetUserPasswordLegacy(userId, adminId);
  }

  // ============================================================================
  // CONTENT MODERATION
  // ============================================================================

  static async getReportedContent(filters: ContentReportFilters) {
    return adminModerationService.getReportedContent(filters);
  }

  static async updateReportStatus(reportId: string, status: string, action: string, reason: string, adminId: string) {
    return adminModerationService.updateReportStatus(reportId, status, action, reason, adminId);
  }

  static async createContentReport(data: {
    reporterId: string;
    contentId: string;
    contentType: string;
    reason: string;
    severity?: string;
    contentTitle?: string;
    contentDescription?: string;
    contentUrl?: string;
  }) {
    return adminModerationService.createContentReport(data);
  }

  static async getModerationStats() {
    return adminModerationService.getModerationStats();
  }

  static async getModerationRules() {
    return adminModerationService.getModerationRules();
  }

  static async bulkModerationAction(reportIds: string[], action: string, adminId: string) {
    return adminModerationService.bulkModerationAction(reportIds, action, adminId);
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  static async getDashboardStats() { return adminAnalyticsService.getDashboardStats(); }
  static async getDashboardSystemHealthSummary() { return adminAnalyticsService.getDashboardSystemHealthSummary(); }
  static async getSystemMetrics(timeRange: string = '24h') { return adminAnalyticsService.getSystemMetrics(timeRange); }
  static async getUserAnalytics(timeRange: string = '30d') { return adminAnalyticsService.getUserAnalytics(timeRange); }
  static async getAnalytics(filters: AnalyticsFilters) { return adminAnalyticsService.getAnalytics(filters); }
  static async exportAnalytics(filters: AnalyticsFilters, format: string) { return adminAnalyticsService.exportAnalytics(filters, format); }
  static async getRealTimeMetrics() { return adminAnalyticsService.getRealTimeMetrics(); }

    // ============================================================================
  // FINANCIAL MANAGEMENT
  // ============================================================================

  static async getSubscriptions(params: { page?: number; limit?: number; status?: string }) {
    return adminBillingService.getSubscriptions(params);
  }
  static async getPayments(params: { page?: number; limit?: number; status?: string }) {
    return adminBillingService.getPayments(params);
  }
  static async getDeveloperPayouts(params: { page?: number; limit?: number; status?: string }) {
    return adminBillingService.getDeveloperPayouts(params);
  }

    // ============================================================================
  // SECURITY & COMPLIANCE
  // ============================================================================

  static async getSecurityEvents(params: {
    page?: number;
    limit?: number;
    severity?: string;
    type?: string;
    resolved?: boolean;
    timeRange?: string;
  }) {
    return adminSecurityService.getSecurityEvents(params);
  }

  static async getAuditLogs(params: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
  }) {
    return adminSecurityService.getAuditLogs(params);
  }

  // ============================================================================
  // SECURITY METHODS
  // ============================================================================

  static async getSecurityMetrics() {
    return adminSecurityService.getSecurityMetrics();
  }

  static async getComplianceStatus() {
    return adminSecurityService.getComplianceStatus();
  }

  static async resolveSecurityEvent(eventId: string, adminId: string) {
    return adminSecurityService.resolveSecurityEvent(eventId, adminId);
  }

  static async exportSecurityReport(filters: SecurityReportFilters, format: string) {
    return adminSecurityService.exportSecurityReport(filters, format);
  }

    // ============================================================================
  // SYSTEM ADMINISTRATION
  // ============================================================================

  static async getSystemHealth() { return adminSystemOpsService.getSystemHealth(); }
  static async getSystemConfig() { return adminSystemOpsService.getSystemConfig(); }
  static async updateSystemConfig(configKey: string, configValue: string | number | boolean, description: string, adminId: string) {
    return adminSystemOpsService.updateSystemConfig(configKey, configValue, description, adminId);
  }
  static async getBackupStatus() { return adminSystemOpsService.getBackupStatus(); }
  static async createBackup(adminId: string) { return adminSystemOpsService.createBackup(adminId); }
  static async getMaintenanceMode() { return adminSystemOpsService.getMaintenanceMode(); }
  static async setMaintenanceMode(enabled: boolean, message: string, adminId: string) {
    return adminSystemOpsService.setMaintenanceMode(enabled, message, adminId);
  }

  // ============================================================================
  // USER IMPERSONATION
  // ============================================================================

  static async startImpersonation(
    adminId: string,
    targetUserId: string,
    options: {
      reason?: string;
      businessId?: string | null;
      context?: string | null;
      sessionTokenHash?: string | null;
      expiresAt?: Date | null;
    } = {}
  ) {
    const existingImpersonation = await adminImpersonationService.findActiveImpersonation(adminId);
    if (existingImpersonation) {
      throw new Error('Admin is already impersonating a user');
    }

    return adminImpersonationService.createImpersonationSession({
      adminId,
      targetUserId,
      reason: options.reason,
      businessId: options.businessId,
      context: options.context,
      sessionTokenHash: options.sessionTokenHash,
      expiresAt: options.expiresAt,
    });
  }

  static async endImpersonation(adminId: string) {
    return adminImpersonationService.endImpersonationLegacy(adminId);
  }

  static async getCurrentImpersonation(adminId: string) {
    return adminImpersonationService.getCurrentImpersonationLegacy(adminId);
  }

  static async getImpersonationHistory(adminId: string, params: {
    page?: number;
    limit?: number;
  }) {
    return adminImpersonationService.getImpersonationHistoryLegacy(adminId, params);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  static async logSecurityEvent(eventData: SecurityEventData) {
    return adminSecurityService.logSecurityEvent(eventData);
  }

    // Module Management Methods
  static async getModuleSubmissions(filters: ModuleDataFilters = {}): Promise<ModuleSubmission[]> {
    return adminModuleGovernanceService.getModuleSubmissions(filters) as Promise<ModuleSubmission[]>;
  }

  static async getModuleStats(): Promise<AdminModuleStatsPayload> {
    return adminModuleGovernanceService.getModuleStats();
  }

  static async reviewModuleSubmission(
    submissionId: string,
    action: 'approve' | 'reject',
    reviewNotes?: string,
    adminId?: string
  ): Promise<AdminJsonObject> {
    return adminModuleGovernanceService.reviewModuleSubmission(submissionId, action, reviewNotes, adminId);
  }

  static async bulkModuleAction(
    submissionIds: string[],
    action: 'approve' | 'reject',
    adminId?: string
  ): Promise<AdminJsonObject> {
    return adminModuleGovernanceService.bulkModuleAction(submissionIds, action, adminId);
  }

  static async promoteModuleVersion(
    moduleId: string,
    version: string,
    adminId: string
  ) {
    return adminModuleGovernanceService.promoteModuleVersion(moduleId, version, adminId);
  }

  static async getModuleVersions(moduleId: string) {
    return adminModuleGovernanceService.getModuleVersions(moduleId);
  }

  static async promotePreviousModuleVersion(moduleId: string, adminId: string) {
    return adminModuleGovernanceService.promotePreviousModuleVersion(moduleId, adminId);
  }
  static async getModuleAnalytics() { return adminModuleGovernanceService.getModuleAnalytics(); }
  static async getDeveloperStats() { return adminModuleGovernanceService.getDeveloperStats(); }
  static async updateModuleStatus(
    moduleId: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED',
    adminId?: string,
  ) {
    return adminModuleGovernanceService.updateModuleStatus(moduleId, status, adminId);
  }
  static async getModuleRevenue(moduleId: string) {
    return adminModuleGovernanceService.getModuleRevenue(moduleId);
  }
  static async exportModuleData(filters: ModuleDataFilters = {}) {
    return adminModuleGovernanceService.exportModuleData(filters);
  }

  // Business Intelligence Methods
  static async getBusinessIntelligence(filters: BusinessIntelligenceFilters = {}) {
    return adminAnalyticsService.getBusinessIntelligence(filters);
  }
  static async exportBusinessIntelligence(filters: BusinessIntelligenceFilters = {}) {
    return adminAnalyticsService.exportBusinessIntelligence(filters);
  }
  static async createABTest(testData: ABTestData, adminId?: string) {
    return adminAnalyticsService.createABTest(testData, adminId);
  }
  static async getABTestResults(testId: string) {
    return adminAnalyticsService.getABTestResults(testId);
  }
  static async updateABTest(testId: string, updates: Partial<ABTestData>, adminId?: string) {
    return adminAnalyticsService.updateABTest(testId, updates, adminId);
  }
  static async getUserSegments() { return adminAnalyticsService.getUserSegments(); }
  static async createUserSegment(segmentData: UserSegmentData, adminId?: string) {
    return adminAnalyticsService.createUserSegment(segmentData, adminId);
  }
  static async getPredictiveInsights() { return adminAnalyticsService.getPredictiveInsights(); }
  static async getCompetitiveAnalysis() { return adminAnalyticsService.getCompetitiveAnalysis(); }
  static async generateCustomReport(reportConfig: ReportConfig, adminId?: string) {
    return adminAnalyticsService.generateCustomReport(reportConfig, adminId);
  }

    // Customer Support Methods
  static async getSupportTickets(filters: SupportTicketFilters = {}) {
    return adminSupportService.getSupportTickets(filters) as Promise<SupportTicket[]>;
  }
  static async getSupportStats() { return adminSupportService.getSupportStats(); }
  static async updateSupportTicket(ticketId: string, action: string, data?: Record<string, unknown>, adminId?: string) {
    return adminSupportService.updateSupportTicket(ticketId, action, data, adminId);
  }
  static async getKnowledgeBase() { return adminSupportService.getKnowledgeBase(); }
  static async updateKnowledgeArticle(articleId: string, action: string, data?: Record<string, unknown>, adminId?: string) {
    return adminSupportService.updateKnowledgeArticle(articleId, action, data, adminId);
  }
  static async getLiveChats() { return adminSupportService.getLiveChats(); }
  static async joinLiveChat(chatId: string, adminId?: string) { return adminSupportService.joinLiveChat(chatId, adminId); }
  static async getSupportAnalytics() { return adminSupportService.getSupportAnalytics(); }
  static async createSupportTicket(ticketData: SupportTicketData, adminId?: string) {
    return adminSupportService.createSupportTicket(ticketData, adminId);
  }
  static async createKnowledgeArticle(articleData: KnowledgeArticleData, adminId?: string) {
    return adminSupportService.createKnowledgeArticle(articleData, adminId);
  }
  static async exportSupportData(filters: SupportTicketFilters = {}) {
    return adminSupportService.exportSupportData(filters);
  }

  static async getPerformanceMetrics(filters: Record<string, unknown> = {}) {
    return adminPerformanceService.getPerformanceMetrics(filters);
  }
  static async getScalabilityMetrics() { return adminPerformanceService.getScalabilityMetrics(); }
  static async getOptimizationRecommendations() { return adminPerformanceService.getOptimizationRecommendations(); }
  static async updateOptimizationRecommendation(recommendationId: string, action: string, adminId?: string) {
    return adminPerformanceService.updateOptimizationRecommendation(recommendationId, action, adminId);
  }
  static async getPerformanceAlerts(filters: PerformanceAlertFilters = {}) {
    return adminPerformanceService.getPerformanceAlerts(filters);
  }
  static async updatePerformanceAlert(alertId: string, action: string, adminId?: string) {
    return adminPerformanceService.updatePerformanceAlert(alertId, action, adminId);
  }
  static async getPerformanceAnalytics() { return adminPerformanceService.getPerformanceAnalytics(); }
  static async configurePerformanceAlert(alertConfig: Record<string, unknown>, adminId?: string) {
    return adminPerformanceService.configurePerformanceAlert(alertConfig, adminId);
  }
  static async exportPerformanceData(filters: Record<string, unknown> = {}) {
    return adminPerformanceService.exportPerformanceData(filters);
  }
} 