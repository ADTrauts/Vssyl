import { prisma } from '../../lib/prisma';

export type OperatorSearchResultType =
  | 'business'
  | 'user'
  | 'module'
  | 'ticket'
  | 'subscription'
  | 'invitation'
  | 'setting';

export interface OperatorSearchResult {
  type: OperatorSearchResultType;
  id: string;
  label: string;
  subtitle?: string;
  href: string;
}

const MAX_PER_TYPE = 8;

export async function searchOperatorConsole(query: string): Promise<OperatorSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const contains = { contains: q, mode: 'insensitive' as const };

  const [businesses, users, modules, tickets, subscriptions, invitations, configs] = await Promise.all([
    prisma.business.findMany({
      where: {
        OR: [{ name: contains }, { email: contains }, { ein: contains }],
      },
      take: MAX_PER_TYPE,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, tier: true },
    }),
    prisma.user.findMany({
      where: {
        OR: [{ email: contains }, { name: contains }, { userNumber: contains }],
      },
      take: MAX_PER_TYPE,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, role: true },
    }),
    prisma.module.findMany({
      where: {
        OR: [{ name: contains }, { id: contains }, { description: contains }],
      },
      take: MAX_PER_TYPE,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, status: true },
    }),
    prisma.supportTicket.findMany({
      where: {
        OR: [{ title: contains }, { description: contains }, { category: contains }],
      },
      take: MAX_PER_TYPE,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, status: true },
    }),
    prisma.subscription.findMany({
      where: {
        OR: [
          { stripeCustomerId: contains },
          { stripeSubscriptionId: contains },
          { tier: contains },
          { user: { email: contains } },
        ],
      },
      take: MAX_PER_TYPE,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        tier: true,
        status: true,
        stripeCustomerId: true,
        user: { select: { email: true } },
      },
    }),
    prisma.businessInvitation.findMany({
      where: { email: contains },
      take: MAX_PER_TYPE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        acceptedAt: true,
        expiresAt: true,
        business: { select: { id: true, name: true } },
      },
    }),
    prisma.systemConfig.findMany({
      where: {
        OR: [{ configKey: contains }, { description: contains }],
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: { configKey: true, description: true },
    }),
  ]);

  const results: OperatorSearchResult[] = [];

  for (const b of businesses) {
    results.push({
      type: 'business',
      id: b.id,
      label: b.name,
      subtitle: `Tier: ${b.tier}`,
      href: `/admin-portal/businesses?highlight=${b.id}`,
    });
  }

  for (const u of users) {
    results.push({
      type: 'user',
      id: u.id,
      label: u.email,
      subtitle: u.name ?? u.role,
      href: `/admin-portal/users?highlight=${u.id}`,
    });
  }

  for (const m of modules) {
    results.push({
      type: 'module',
      id: m.id,
      label: m.name,
      subtitle: m.status,
      href: `/admin-portal/modules?search=${encodeURIComponent(m.id)}`,
    });
  }

  for (const t of tickets) {
    results.push({
      type: 'ticket',
      id: t.id,
      label: t.title,
      subtitle: t.status,
      href: `/admin-portal/support?ticket=${t.id}`,
    });
  }

  for (const s of subscriptions) {
    const customerQuery = s.stripeCustomerId ? `?customer=${s.stripeCustomerId}` : `?subscription=${s.id}`;
    results.push({
      type: 'subscription',
      id: s.id,
      label: s.user.email,
      subtitle: `${s.tier} · ${s.status}${s.stripeCustomerId ? ` · ${s.stripeCustomerId}` : ''}`,
      href: `/admin-portal/billing${customerQuery}`,
    });
  }

  for (const inv of invitations) {
    const status = inv.acceptedAt ? 'accepted' : inv.expiresAt < new Date() ? 'expired' : 'pending';
    results.push({
      type: 'invitation',
      id: inv.id,
      label: inv.email,
      subtitle: `${status} · ${inv.business.name}`,
      href: `/admin-portal/businesses?highlight=${inv.business.id}&invitationSearch=${encodeURIComponent(inv.email)}`,
    });
  }

  for (const c of configs) {
    results.push({
      type: 'setting',
      id: c.configKey,
      label: c.configKey,
      subtitle: c.description ?? 'System configuration',
      href: '/admin-portal/system',
    });
  }

  return results;
}
