import { prisma } from '../../lib/prisma';

export type WorkspaceHealthStatus = 'healthy' | 'warning' | 'unknown';

export interface OperatorBusinessSummary {
  id: string;
  name: string;
  tier: string;
  industry: string | null;
  size: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  moduleCount: number;
  owners: Array<{ id: string; name: string | null; email: string }>;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  lastActivityAt: string | null;
  workspaceHealth: WorkspaceHealthStatus;
}

function resolveWorkspaceHealth(memberCount: number, moduleCount: number): WorkspaceHealthStatus {
  if (memberCount === 0) return 'unknown';
  if (moduleCount === 0) return 'warning';
  return 'healthy';
}

export async function listBusinessesForOperator(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const page = params.page ?? 1;
  const take = Math.min(params.limit ?? 20, 50);
  const skip = (page - 1) * take;

  const where: Record<string, unknown> = {};
  if (params.search?.trim()) {
    const q = params.search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { industry: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { ein: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.business.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        tier: true,
        industry: true,
        size: true,
        createdAt: true,
        updatedAt: true,
        stripeCustomerId: true,
        _count: {
          select: {
            members: { where: { isActive: true } },
            businessModuleInstallations: true,
          },
        },
        members: {
          where: { isActive: true, role: 'ADMIN' },
          take: 3,
          orderBy: { joinedAt: 'asc' },
          select: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        subscriptions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { tier: true, status: true, updatedAt: true },
        },
      },
    }),
    prisma.business.count({ where }),
  ]);

  const businesses: OperatorBusinessSummary[] = rows.map((b) => {
    const sub = b.subscriptions[0];
    const lastActivity = sub?.updatedAt ?? b.updatedAt;
    return {
      id: b.id,
      name: b.name,
      tier: b.tier,
      industry: b.industry,
      size: b.size,
      status: 'active',
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      memberCount: b._count.members,
      moduleCount: b._count.businessModuleInstallations,
      owners: b.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
      })),
      subscriptionTier: sub?.tier ?? b.tier,
      subscriptionStatus: sub?.status ?? null,
      stripeCustomerId: b.stripeCustomerId,
      lastActivityAt: lastActivity.toISOString(),
      workspaceHealth: resolveWorkspaceHealth(b._count.members, b._count.businessModuleInstallations),
    };
  });

  return { businesses, total, page, totalPages: Math.ceil(total / take) };
}

export async function getBusinessOperatorDetail(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      tier: true,
      industry: true,
      size: true,
      email: true,
      website: true,
      createdAt: true,
      updatedAt: true,
      stripeCustomerId: true,
      billingEmail: true,
      isDeveloperBusiness: true,
      _count: {
        select: {
          members: { where: { isActive: true } },
          businessModuleInstallations: true,
          invitations: { where: { acceptedAt: null } },
        },
      },
      subscriptions: {
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          tier: true,
          status: true,
          stripeSubscriptionId: true,
          currentPeriodEnd: true,
          updatedAt: true,
        },
      },
      members: {
        where: { isActive: true },
        orderBy: { joinedAt: 'desc' },
        take: 25,
        select: {
          id: true,
          role: true,
          title: true,
          joinedAt: true,
          canBilling: true,
          canManage: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      dashboards: { take: 1, select: { id: true } },
    },
  });

  if (!business) return null;

  const sub = business.subscriptions[0];
  const lastActivity = sub?.updatedAt ?? business.updatedAt;

  return {
    id: business.id,
    name: business.name,
    tier: business.tier,
    industry: business.industry,
    size: business.size,
    email: business.email,
    website: business.website,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
    stripeCustomerId: business.stripeCustomerId,
    billingEmail: business.billingEmail,
    isDeveloperBusiness: business.isDeveloperBusiness,
    lastActivityAt: lastActivity.toISOString(),
    workspaceHealth: resolveWorkspaceHealth(
      business._count.members,
      business._count.businessModuleInstallations,
    ),
    _count: business._count,
    subscriptions: business.subscriptions.map((s) => ({
      ...s,
      currentPeriodEnd: s.currentPeriodEnd.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    members: business.members.map((m) => ({
      ...m,
      joinedAt: m.joinedAt.toISOString(),
    })),
    dashboards: business.dashboards,
  };
}
