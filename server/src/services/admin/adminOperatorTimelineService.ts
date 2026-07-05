import { prisma } from '../../lib/prisma';

export interface OperatorTimelineEntry {
  id: string;
  timestamp: string;
  category: 'admin' | 'security' | 'platform' | 'billing' | 'module' | 'email';
  title: string;
  detail?: string;
  href?: string;
}

function mapAuditAction(action: string): { category: OperatorTimelineEntry['category']; title: string } {
  if (action.includes('BILLING') || action.includes('STRIPE') || action.includes('SUBSCRIPTION')) {
    return { category: 'billing', title: action.replace(/_/g, ' ').toLowerCase() };
  }
  if (action.includes('MODULE') || action.includes('CERTIFICATION')) {
    return { category: 'module', title: action.replace(/_/g, ' ').toLowerCase() };
  }
  if (action.includes('EMAIL') || action.includes('SMTP')) {
    return { category: 'email', title: action.replace(/_/g, ' ').toLowerCase() };
  }
  if (action.includes('SECURITY') || action.includes('IMPERSONATION')) {
    return { category: 'security', title: action.replace(/_/g, ' ').toLowerCase() };
  }
  return { category: 'admin', title: action.replace(/_/g, ' ').toLowerCase() };
}

export async function getOperatorTimeline(limit = 25): Promise<OperatorTimelineEntry[]> {
  const take = Math.min(limit, 50);
  const entries: OperatorTimelineEntry[] = [];

  const [auditLogs, securityEvents, recentBusinesses] = await Promise.all([
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
  ]);

  for (const log of auditLogs) {
    const mapped = mapAuditAction(log.action);
    entries.push({
      id: `audit-${log.id}`,
      timestamp: log.timestamp.toISOString(),
      category: mapped.category,
      title: mapped.title,
      detail: log.user?.email ?? undefined,
      href:
        mapped.category === 'module'
          ? '/admin-portal/modules'
          : mapped.category === 'billing'
            ? '/admin-portal/billing'
            : '/admin-portal/security',
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
      category: 'platform',
      title: 'Business created',
      detail: b.name,
      href: `/admin-portal/businesses?highlight=${b.id}`,
    });
  }

  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return entries.slice(0, take);
}
