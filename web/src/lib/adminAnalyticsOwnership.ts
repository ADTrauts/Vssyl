/**
 * Admin Portal analytics ownership registry (Stage 0C — AP-F-007).
 * Single canonical operator destination for platform/business metrics.
 */

export const ADMIN_CANONICAL_ANALYTICS_PATH = '/admin-portal/analytics' as const;

export const ADMIN_CANONICAL_ANALYTICS_INSIGHTS_PATH =
  '/admin-portal/analytics?tab=insights' as const;

/** Legacy BI route — redirects to canonical insights tab. */
export const ADMIN_RETIRED_BI_PATH = '/admin-portal/business-intelligence' as const;

export type AdminAnalyticsSurfaceRole = 'canonical' | 'satellite' | 'retired';

export interface AdminAnalyticsSurface {
  id: string;
  label: string;
  path: string;
  role: AdminAnalyticsSurfaceRole;
  owner: string;
  backendService?: string;
  notes?: string;
}

export const ADMIN_ANALYTICS_SURFACES: AdminAnalyticsSurface[] = [
  {
    id: 'platform-analytics',
    label: 'Platform Analytics',
    path: ADMIN_CANONICAL_ANALYTICS_PATH,
    role: 'canonical',
    owner: 'Admin Portal',
    backendService: 'adminAnalyticsService',
    notes: 'Canonical UI for platform metrics, business overview, and strategic insights tab.',
  },
  {
    id: 'business-intelligence',
    label: 'Business Intelligence (legacy)',
    path: ADMIN_RETIRED_BI_PATH,
    role: 'retired',
    owner: 'Admin Portal',
    backendService: 'adminAnalyticsService.getBusinessIntelligence',
    notes: 'Redirects to Platform Analytics insights tab; API routes remain as satellite endpoints.',
  },
  {
    id: 'ai-system',
    label: 'AI System',
    path: '/admin-portal/ai-system',
    role: 'satellite',
    owner: 'Admin Portal (AI launcher)',
    notes: 'Navigation hub only — no platform trend charts or BI fetches.',
  },
  {
    id: 'performance',
    label: 'Performance & Scalability',
    path: '/admin-portal/performance',
    role: 'satellite',
    owner: 'Admin Portal',
    backendService: 'adminPerformanceService',
    notes: 'Infrastructure/ops metrics — distinct from platform business analytics.',
  },
  {
    id: 'dashboard',
    label: 'Admin Dashboard',
    path: '/admin-portal/dashboard',
    role: 'satellite',
    owner: 'Admin Portal',
    backendService: 'adminAnalyticsService.getDashboardStats',
    notes: 'Summary cards only; deep metrics link to Platform Analytics.',
  },
  {
    id: 'ai-pipeline-metrics',
    label: 'AI Pipeline quality metrics',
    path: '/admin-portal/ai-pipeline',
    role: 'satellite',
    owner: 'Admin Portal (AI control plane)',
    notes: 'AI grounding/diagnostics metrics — not platform user/revenue analytics.',
  },
];

export function isCanonicalAnalyticsPath(path: string): boolean {
  return path === ADMIN_CANONICAL_ANALYTICS_PATH || path.startsWith(`${ADMIN_CANONICAL_ANALYTICS_PATH}?`);
}

export function resolveAnalyticsTab(
  tab: string | null | undefined,
): 'overview' | 'insights' {
  return tab === 'insights' ? 'insights' : 'overview';
}
