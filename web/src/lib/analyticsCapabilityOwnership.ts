/**
 * Platform Analytics Capability ownership registry (Phase 1).
 * Canonical tenant reads vs satellites — mirrors adminAnalyticsOwnership pattern.
 */

export const ANALYTICS_CAPABILITY_API_BASE = '/api/analytics' as const;

export type AnalyticsSurfaceRole = 'canonical' | 'satellite' | 'consumer' | 'retired';

export interface AnalyticsCapabilitySurface {
  id: string;
  label: string;
  path: string;
  role: AnalyticsSurfaceRole;
  owner: string;
  backendService?: string;
  notes?: string;
}

export const ANALYTICS_CAPABILITY_SURFACES: AnalyticsCapabilitySurface[] = [
  {
    id: 'dashboard-summary',
    label: 'Dashboard summary',
    path: `${ANALYTICS_CAPABILITY_API_BASE}/dashboard-summary`,
    role: 'canonical',
    owner: 'Platform Analytics Capability',
    backendService: 'analyticsCapabilityService.getDashboardSummaryCapability',
    notes: 'Primary cross-module tenant rollup contract.',
  },
  {
    id: 'personal',
    label: 'Personal analytics',
    path: `${ANALYTICS_CAPABILITY_API_BASE}/personal`,
    role: 'canonical',
    owner: 'Platform Analytics Capability',
    backendService: 'analyticsCapabilityService.getPersonalAnalyticsCapability',
  },
  {
    id: 'module',
    label: 'Module analytics read',
    path: `${ANALYTICS_CAPABILITY_API_BASE}/modules/:moduleId`,
    role: 'canonical',
    owner: 'Platform Analytics Capability',
    backendService: 'analyticsCapabilityService.getModuleAnalyticsCapability',
  },
  {
    id: 'export',
    label: 'Analytics export',
    path: `${ANALYTICS_CAPABILITY_API_BASE}/export`,
    role: 'canonical',
    owner: 'Platform Analytics Capability',
    backendService: 'analyticsCapabilityService.exportAnalyticsCapability',
  },
  {
    id: 'dashboard-facade',
    label: 'Dashboard analytics facade',
    path: 'web/src/lib/dashboardAnalyticsFacade.ts',
    role: 'consumer',
    owner: 'Dashboard Module',
    backendService: 'fetchDashboardAnalyticsSummary',
    notes: 'Must not aggregate module APIs directly for cross-module metrics.',
  },
  {
    id: 'ai-quick-stats',
    label: 'AI dashboard quick-stats',
    path: '/api/dashboard/ai/context/quick-stats',
    role: 'consumer',
    owner: 'Dashboard Module (route) / Analytics Capability (data)',
    backendService: 'analyticsDashboardSummaryService.getDashboardAnalyticsSummaryForAI',
  },
  {
    id: 'business-workspace',
    label: 'Business workspace analytics',
    path: '/business/:id/workspace/analytics',
    role: 'consumer',
    owner: 'Business Workspace shell',
    backendService: 'businessAnalyticsService via business API',
    notes: 'Real business analytics only — no mock data.',
  },
  {
    id: 'admin-portal-analytics',
    label: 'Admin Portal operator analytics',
    path: '/admin-portal/analytics',
    role: 'satellite',
    owner: 'Admin Portal',
    backendService: 'adminAnalyticsService',
  },
  {
    id: 'chat-module-analytics',
    label: 'Chat module analytics',
    path: '/api/chat/analytics',
    role: 'satellite',
    owner: 'Chat module',
    backendService: 'chatAnalyticsService',
  },
  {
    id: 'hr-analytics',
    label: 'HR domain analytics',
    path: '/api/hr/admin/analytics/*',
    role: 'satellite',
    owner: 'HR module',
    backendService: 'hrAnalyticsService',
  },
];

export function isCanonicalAnalyticsCapabilityPath(path: string): boolean {
  return ANALYTICS_CAPABILITY_SURFACES.some(
    (s) => s.role === 'canonical' && path.startsWith(s.path.replace(':moduleId', ''))
  );
}

export function getAnalyticsCapabilitySurface(id: string): AnalyticsCapabilitySurface | undefined {
  return ANALYTICS_CAPABILITY_SURFACES.find((s) => s.id === id);
}
