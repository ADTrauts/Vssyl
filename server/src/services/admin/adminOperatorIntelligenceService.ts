import { prisma } from '../../lib/prisma';
import * as adminPlatformOperationsService from './adminPlatformOperationsService';
import * as adminEmailOpsService from './adminEmailOpsService';

const BILLING_ISSUE_STATUSES = ['past_due', 'unpaid', 'cancelled', 'canceled'];
const INACTIVE_DAYS = 30;

function relativeMinutes(iso: string | null): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export async function getBusinessIntelligenceSummary() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const inactiveCutoff = new Date(now.getTime() - INACTIVE_DAYS * 24 * 60 * 60 * 1000);

  const [total, createdThisWeek, billingIssues, inactiveCount, warningCount] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.subscription.count({
      where: { status: { in: BILLING_ISSUE_STATUSES } },
    }),
    prisma.business.count({
      where: {
        updatedAt: { lt: inactiveCutoff },
        members: { some: { isActive: true } },
      },
    }),
    prisma.business.count({
      where: {
        members: { none: { isActive: true } },
      },
    }),
  ]);

  const status =
    billingIssues > 0 || warningCount > 0 ? 'attention' : inactiveCount > 0 ? 'warning' : 'healthy';

  return {
    status,
    total,
    createdThisWeek,
    billingIssues,
    inactiveWorkspaces: inactiveCount,
    emptyWorkspaces: warningCount,
    summary: `${total} businesses · +${createdThisWeek} this week`,
    attention: [
      ...(billingIssues > 0 ? [`${billingIssues} billing issue${billingIssues !== 1 ? 's' : ''}`] : []),
      ...(inactiveCount > 0 ? [`${inactiveCount} inactive`] : []),
      ...(warningCount > 0 ? [`${warningCount} without members`] : []),
    ],
    href: '/admin-portal/businesses',
  };
}

export async function getBusinessIntelligenceDetail(businessId: string) {
  const detail = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      _count: {
        select: {
          members: { where: { isActive: true } },
          businessModuleInstallations: true,
          invitations: { where: { acceptedAt: null } },
        },
      },
      subscriptions: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: { status: true, tier: true, updatedAt: true },
      },
      members: {
        where: { isActive: true },
        orderBy: { joinedAt: 'desc' },
        take: 5,
        select: {
          joinedAt: true,
          user: { select: { email: true, name: true, lastActiveAt: true } },
        },
      },
      invitations: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          email: true,
          role: true,
          token: true,
          createdAt: true,
          expiresAt: true,
          acceptedAt: true,
        },
      },
    },
  });

  if (!detail) return null;

  const billingEvents = await prisma.auditLog.findMany({
    where: {
      OR: [
        { action: { contains: 'BILLING', mode: 'insensitive' } },
        { action: { contains: 'STRIPE', mode: 'insensitive' } },
        { action: { contains: 'SUBSCRIPTION', mode: 'insensitive' } },
      ],
      resourceId: businessId,
    },
    orderBy: { timestamp: 'desc' },
    take: 5,
    select: { action: true, timestamp: true, details: true },
  });

  const warnings: string[] = [];
  if (detail._count.members === 0) warnings.push('No active members');
  if (detail._count.businessModuleInstallations === 0) warnings.push('No modules installed');
  if (detail._count.invitations > 0) warnings.push(`${detail._count.invitations} pending invitation(s)`);
  const sub = detail.subscriptions[0];
  if (sub && BILLING_ISSUE_STATUSES.includes(sub.status)) {
    warnings.push(`Subscription ${sub.status}`);
  }

  const inactiveCutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000);
  if (detail.updatedAt < inactiveCutoff) {
    warnings.push('No workspace activity in 30+ days');
  }

  return {
    workspaceWarnings: warnings,
    pendingInvitations: detail.invitations
      .filter((i) => !i.acceptedAt && i.expiresAt >= new Date())
      .map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        createdAt: i.createdAt.toISOString(),
        expiresAt: i.expiresAt.toISOString(),
      })),
    invitations: detail.invitations.map((i) => {
      const status = i.acceptedAt ? 'accepted' : i.expiresAt < new Date() ? 'expired' : 'pending';
      return {
        id: i.id,
        email: i.email,
        role: i.role,
        status,
        createdAt: i.createdAt.toISOString(),
        expiresAt: i.expiresAt.toISOString(),
        acceptedAt: i.acceptedAt?.toISOString() ?? null,
      };
    }),
    recentMembers: detail.members.map((m) => ({
      email: m.user.email,
      name: m.user.name,
      joinedAt: m.joinedAt.toISOString(),
      lastLoginAt: m.user.lastActiveAt?.toISOString() ?? null,
      lastLoginRelative: relativeMinutes(m.user.lastActiveAt?.toISOString() ?? null),
    })),
    recentBillingEvents: billingEvents.map((e) => ({
      action: e.action,
      timestamp: e.timestamp.toISOString(),
      details: e.details,
    })),
    subscriptionStatus: sub?.status ?? null,
    lastActivityAt: (sub?.updatedAt ?? detail.updatedAt).toISOString(),
  };
}

export async function getEmailIntelligence() {
  const base = await adminEmailOpsService.getEmailOperationsStatus();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let recentSends: Array<{ timestamp: string; message: string; success: boolean }> = [];
  let recentTestSends: Array<{ timestamp: string; message: string }> = [];
  let sendsLast24h = 0;
  let failuresLast24h = 0;

  try {
    const logs = await prisma.log.findMany({
      where: {
        timestamp: { gte: dayAgo },
        OR: [
          { operation: 'send_email' },
          { operation: 'email_test' },
          { operation: 'email_status' },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: 40,
      select: { level: true, message: true, timestamp: true, operation: true, duration: true },
    });

    for (const log of logs) {
      if (log.operation === 'send_email') {
        sendsLast24h += 1;
        if (log.level === 'error') failuresLast24h += 1;
        if (recentSends.length < 8) {
          recentSends.push({
            timestamp: log.timestamp.toISOString(),
            message: log.message.slice(0, 120),
            success: log.level !== 'error',
          });
        }
      }
      if (log.operation === 'email_test' && recentTestSends.length < 5) {
        recentTestSends.push({
          timestamp: log.timestamp.toISOString(),
          message: log.message.slice(0, 120),
        });
      }
    }
  } catch {
    // logs optional
  }

  const failureRate =
    sendsLast24h > 0 ? Math.round((failuresLast24h / sendsLast24h) * 100) : 0;
  const status =
    !base.configured
      ? 'offline'
      : failuresLast24h > 0
        ? 'attention'
        : base.transportReady
          ? 'healthy'
          : 'warning';

  const avgLatencyMs = null;

  return {
    ...base,
    status,
    failureRate,
    sendsLast24h,
    failuresLast24h,
    lastSendRelative: relativeMinutes(base.lastSuccessfulSend),
    recentSends,
    recentTestSends,
    smtpLatencyMs: avgLatencyMs,
    providerHealth: base.transportReady ? 'healthy' : base.configured ? 'degraded' : 'unconfigured',
    placeholders: {
      bounceRate: null,
      complaintRate: null,
      deliveryAnalytics: 'Requires Postmark webhook integration',
    },
    href: '/admin-portal/email-operations',
  };
}

export async function getStripeIntelligence() {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? '';
  const mode = key.startsWith('sk_live_') ? 'live' : key.startsWith('sk_test_') ? 'test' : 'unconfigured';

  const [activeSubscriptions, renewalsToday, mrrAgg] = await Promise.all([
    prisma.subscription.count({ where: { status: 'active' } }).catch(() => 0),
    prisma.subscription
      .count({
        where: {
          status: 'active',
          currentPeriodEnd: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      })
      .catch(() => 0),
    prisma.moduleSubscription
      .aggregate({ _sum: { amount: true }, where: { status: 'active' } })
      .catch(() => ({ _sum: { amount: null } })),
  ]);

  const billingIssues = await prisma.subscription
    .count({ where: { status: { in: BILLING_ISSUE_STATUSES } } })
    .catch(() => 0);

  const ops = await adminPlatformOperationsService.getPlatformOperationsStatus();
  const stripeProbe = ops.services.stripe;

  return {
    status:
      billingIssues > 0
        ? 'attention'
        : stripeProbe.operatorStatus === 'healthy'
          ? 'healthy'
          : stripeProbe.operatorStatus,
    mode,
    mrr: mrrAgg._sum.amount ?? 0,
    activeSubscriptions,
    renewalsToday,
    billingIssues,
    attention: billingIssues > 0 ? [`${billingIssues} subscription issue(s)`] : [],
    href: '/admin-portal/billing',
  };
}

export async function getAiIntelligence() {
  const ops = await adminPlatformOperationsService.getPlatformOperationsStatus();
  const openai = ops.services.openai;
  const anthropic = ops.services.anthropic;

  const failures = [openai, anthropic].filter(
    (s) => s.operatorStatus === 'offline' || s.status === 'error',
  ).length;

  const status =
    failures > 0
      ? 'attention'
      : openai.operatorStatus === 'healthy' || anthropic.operatorStatus === 'healthy'
        ? 'healthy'
        : 'unknown';

  return {
    status,
    openai: { configured: openai.configured, status: openai.operatorStatus },
    anthropic: { configured: anthropic.configured, status: anthropic.operatorStatus },
    providerLatencyMs: null,
    recentFailures: failures,
    attention: failures > 0 ? [`${failures} provider probe failure(s)`] : [],
    href: '/admin-portal/ai-pipeline',
  };
}

export async function getOperatorIntelligenceSummary() {
  const [businesses, email, stripe, ai] = await Promise.all([
    getBusinessIntelligenceSummary(),
    getEmailIntelligence(),
    getStripeIntelligence(),
    getAiIntelligence(),
  ]);

  const attentionCount =
    businesses.attention.length +
    email.failuresLast24h +
    stripe.billingIssues +
    ai.recentFailures;

  const overallStatus =
    attentionCount > 0 ? 'attention' : email.status === 'healthy' && stripe.status === 'healthy' ? 'healthy' : 'warning';

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    attentionCount,
    businesses,
    email,
    stripe,
    ai,
  };
}
