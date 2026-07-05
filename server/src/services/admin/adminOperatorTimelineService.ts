import { prisma } from '../../lib/prisma';

export type TimelineCategory =
  | 'platform'
  | 'billing'
  | 'businesses'
  | 'ai'
  | 'security'
  | 'deployments'
  | 'search'
  | 'email'
  | 'module'
  | 'admin';

export interface OperatorTimelineEntry {
  id: string;
  timestamp: string;
  category: TimelineCategory;
  title: string;
  detail?: string;
  href?: string;
  entityId?: string;
}

export interface OperatorTimelineGroup {
  category: TimelineCategory;
  label: string;
  count: number;
  entries: OperatorTimelineEntry[];
}

const CATEGORY_LABELS: Record<TimelineCategory, string> = {
  platform: 'Platform',
  billing: 'Billing',
  businesses: 'Businesses',
  ai: 'AI',
  security: 'Security',
  deployments: 'Deployments',
  search: 'Search',
  email: 'Email',
  module: 'Modules',
  admin: 'Admin',
};

const CATEGORY_ORDER: TimelineCategory[] = [
  'platform',
  'billing',
  'businesses',
  'ai',
  'security',
  'deployments',
  'search',
  'email',
  'module',
  'admin',
];

function mapAuditAction(action: string): { category: TimelineCategory; title: string; href: string } {
  const upper = action.toUpperCase();
  if (upper.includes('BILLING') || upper.includes('STRIPE') || upper.includes('SUBSCRIPTION')) {
    return { category: 'billing', title: action.replace(/_/g, ' ').toLowerCase(), href: '/admin-portal/billing' };
  }
  if (upper.includes('MODULE') || upper.includes('CERTIFICATION')) {
    return { category: 'module', title: action.replace(/_/g, ' ').toLowerCase(), href: '/admin-portal/modules' };
  }
  if (upper.includes('EMAIL') || upper.includes('SMTP')) {
    return { category: 'email', title: action.replace(/_/g, ' ').toLowerCase(), href: '/admin-portal/email-operations' };
  }
  if (upper.includes('SECURITY') || upper.includes('IMPERSONATION')) {
    return { category: 'security', title: action.replace(/_/g, ' ').toLowerCase(), href: '/admin-portal/security' };
  }
  if (upper.includes('AI') || upper.includes('OPENAI') || upper.includes('ANTHROPIC') || upper.includes('PIPELINE')) {
    return { category: 'ai', title: action.replace(/_/g, ' ').toLowerCase(), href: '/admin-portal/ai-pipeline' };
  }
  if (upper.includes('SEARCH') || upper.includes('RETRIEVAL')) {
    return { category: 'search', title: action.replace(/_/g, ' ').toLowerCase(), href: '/admin-portal/platform-programs' };
  }
  if (upper.includes('DEPLOY') || upper.includes('MIGRATION') || upper.includes('RESTART')) {
    return { category: 'deployments', title: action.replace(/_/g, ' ').toLowerCase(), href: '/admin-portal/system' };
  }
  if (upper.includes('BUSINESS')) {
    return { category: 'businesses', title: action.replace(/_/g, ' ').toLowerCase(), href: '/admin-portal/businesses' };
  }
  return { category: 'admin', title: action.replace(/_/g, ' ').toLowerCase(), href: '/admin-portal/security' };
}

function hrefForResource(
  category: TimelineCategory,
  resourceType: string | null,
  resourceId: string | null,
): string | undefined {
  if (!resourceId) return undefined;
  if (category === 'businesses' || resourceType === 'business') {
    return `/admin-portal/businesses?highlight=${resourceId}`;
  }
  if (resourceType === 'user') return `/admin-portal/users?highlight=${resourceId}`;
  if (resourceType === 'module') return `/admin-portal/modules?search=${encodeURIComponent(resourceId)}`;
  return undefined;
}

export async function getOperatorTimeline(limit = 25): Promise<OperatorTimelineEntry[]> {
  const grouped = await getOperatorTimelineGrouped(limit);
  return grouped.flatMap((g) => g.entries).slice(0, limit);
}

export async function getOperatorTimelineGrouped(limit = 30): Promise<OperatorTimelineGroup[]> {
  const take = Math.min(limit, 50);
  const entries: OperatorTimelineEntry[] = [];

  const [auditLogs, securityEvents, recentBusinesses, emailErrors] = await Promise.all([
    prisma.auditLog.findMany({
      take,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { email: true } } },
    }),
    prisma.securityEvent.findMany({
      take: Math.min(10, take),
      orderBy: { timestamp: 'desc' },
    }),
    prisma.business.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.log
      .findMany({
        where: { operation: 'send_email', level: 'error' },
        take: 3,
        orderBy: { timestamp: 'desc' },
        select: { id: true, message: true, timestamp: true },
      })
      .catch(() => []),
  ]);

  for (const log of auditLogs) {
    const mapped = mapAuditAction(log.action);
    entries.push({
      id: `audit-${log.id}`,
      timestamp: log.timestamp.toISOString(),
      category: mapped.category,
      title: mapped.title,
      detail: log.user?.email ?? undefined,
      href: hrefForResource(mapped.category, log.resourceType, log.resourceId) ?? mapped.href,
      entityId: log.resourceId ?? undefined,
    });
  }

  for (const event of securityEvents) {
    entries.push({
      id: `sec-${event.id}`,
      timestamp: event.timestamp.toISOString(),
      category: 'security',
      title: event.eventType,
      detail: event.severity,
      href: '/admin-portal/security',
    });
  }

  for (const b of recentBusinesses) {
    entries.push({
      id: `biz-${b.id}`,
      timestamp: b.createdAt.toISOString(),
      category: 'businesses',
      title: 'Business created',
      detail: b.name,
      href: `/admin-portal/businesses?highlight=${b.id}`,
      entityId: b.id,
    });
  }

  for (const err of emailErrors) {
    entries.push({
      id: `email-${err.id}`,
      timestamp: err.timestamp.toISOString(),
      category: 'email',
      title: 'SMTP send failure',
      detail: err.message.slice(0, 80),
      href: '/admin-portal/email-operations',
    });
  }

  if (process.env.K_REVISION) {
    entries.push({
      id: `deploy-${process.env.K_REVISION}`,
      timestamp: new Date().toISOString(),
      category: 'deployments',
      title: 'Active Cloud Run revision',
      detail: process.env.K_REVISION,
      href: '/admin-portal/system',
    });
  }

  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const sliced = entries.slice(0, take);

  const byCategory = new Map<TimelineCategory, OperatorTimelineEntry[]>();
  for (const entry of sliced) {
    const list = byCategory.get(entry.category) ?? [];
    list.push(entry);
    byCategory.set(entry.category, list);
  }

  return CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    count: byCategory.get(category)!.length,
    entries: byCategory.get(category)!,
  }));
}
