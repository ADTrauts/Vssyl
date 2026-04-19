/**
 * Typed JSON-shaped contracts for AdminService methods that previously returned Promise<unknown>.
 * Admin portal HTTP handlers serialize these as JSON; use Record<string, unknown> only where
 * payloads are intentionally dynamic (AB tests, segments, synthetic performance metrics).
 */

export type AdminJsonObject = Record<string, unknown>;

/** Module marketplace aggregate stats returned by getModuleStats */
export interface AdminModuleStatsPayload {
  totalSubmissions: number;
  pendingReviews: number;
  approvedToday: number;
  rejectedToday: number;
  totalRevenue: number;
  activeDevelopers: number;
  averageRating: number;
  topCategory: string;
}

/** Synthetic / placeholder analytics bundle for admin module overview */
export type AdminModuleAnalyticsPayload = AdminJsonObject;

export type AdminDeveloperStatsPayload = AdminJsonObject;

export type AdminModuleRevenuePayload = AdminJsonObject;

export type AdminABTestPayload = AdminJsonObject;

export type AdminABTestResultsPayload = AdminJsonObject;

export type AdminUserSegmentPayload = AdminJsonObject;

export type AdminCompetitiveAnalysisPayload = AdminJsonObject;

export type AdminCustomReportPayload = AdminJsonObject;

export type AdminSupportStatsPayload = AdminJsonObject;

export type AdminSupportTicketMutationResult = AdminJsonObject;

export type AdminKnowledgeArticleMutationResult = AdminJsonObject;

export type AdminLiveChatJoinResult = AdminJsonObject;

export type AdminSupportAnalyticsPayload = AdminJsonObject;

export type AdminSupportTicketCreateResult = AdminJsonObject;

export type AdminKnowledgeArticleCreateResult = AdminJsonObject;

/** Synthetic CPU/memory/disk/network metrics object */
export type AdminPerformanceMetricsPayload = AdminJsonObject;

export type AdminScalabilityMetricsPayload = AdminJsonObject;

export type AdminOptimizationRecommendationMutation = AdminJsonObject;

export type AdminPerformanceAlertMutation = AdminJsonObject;

export type AdminPerformanceAnalyticsPayload = AdminJsonObject;

export type AdminPerformanceAlertConfigureResult = AdminJsonObject;
