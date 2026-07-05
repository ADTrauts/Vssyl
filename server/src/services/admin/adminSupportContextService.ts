import { prisma } from '../../lib/prisma';
import { StripeSyncService } from '../stripeSyncService.js';
import { getAppBaseUrl } from '../email/config.js';

function invitationStatus(inv: { acceptedAt: Date | null; expiresAt: Date }): 'pending' | 'accepted' | 'expired' {
  if (inv.acceptedAt) return 'accepted';
  if (inv.expiresAt < new Date()) return 'expired';
  return 'pending';
}

export async function getSupportTicketContext(ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          lastActiveAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!ticket) return null;

  const userId = ticket.customerId;
  const userEmail = ticket.customer.email;

  const [memberships, subscriptions, invitations, auditEvents, recentLogs, aiHistory] = await Promise.all([
    prisma.businessMember.findMany({
      where: { userId, isActive: true },
      take: 5,
      orderBy: { joinedAt: 'desc' },
      select: {
        role: true,
        business: {
          select: {
            id: true,
            name: true,
            stripeCustomerId: true,
            dashboards: { take: 1, select: { id: true } },
          },
        },
      },
    }),
    prisma.subscription.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        tier: true,
        status: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        businessId: true,
        currentPeriodEnd: true,
      },
    }),
    prisma.businessInvitation.findMany({
      where: { email: { equals: userEmail, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        acceptedAt: true,
        business: { select: { id: true, name: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 8,
      select: { id: true, action: true, timestamp: true, resourceType: true, resourceId: true },
    }),
    prisma.log
      .findMany({
        where: {
          OR: [{ userId }, { message: { contains: userEmail, mode: 'insensitive' } }],
          operation: { in: ['send_email', 'email_test'] },
        },
        orderBy: { timestamp: 'desc' },
        take: 8,
        select: { message: true, timestamp: true, level: true, operation: true },
      })
      .catch(() => []),
    prisma.aIConversationHistory
      .findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { interactionType: true, createdAt: true, userQuery: true },
      })
      .catch(() => []),
  ]);

  const businesses = memberships.map((m) => ({
    id: m.business.id,
    name: m.business.name,
    role: m.role,
    stripeCustomerId: m.business.stripeCustomerId,
    dashboardId: m.business.dashboards[0]?.id ?? null,
  }));

  const primaryBusiness = businesses[0] ?? null;
  const primarySubscription = subscriptions[0] ?? null;

  const mappedInvitations = invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    businessId: inv.business.id,
    businessName: inv.business.name,
    status: invitationStatus(inv),
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    acceptedAt: inv.acceptedAt?.toISOString() ?? null,
  }));

  return {
    ticket: { id: ticket.id, title: ticket.title, customerId: userId },
    user: {
      id: ticket.customer.id,
      email: ticket.customer.email,
      name: ticket.customer.name,
      role: ticket.customer.role,
      lastActiveAt: ticket.customer.lastActiveAt?.toISOString() ?? null,
      createdAt: ticket.customer.createdAt.toISOString(),
    },
    businesses,
    workspace: primaryBusiness
      ? { businessId: primaryBusiness.id, businessName: primaryBusiness.name, dashboardId: primaryBusiness.dashboardId }
      : null,
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      tier: s.tier,
      status: s.status,
      businessId: s.businessId,
      currentPeriodEnd: s.currentPeriodEnd.toISOString(),
      stripeCustomerId: s.stripeCustomerId,
      stripeSubscriptionId: s.stripeSubscriptionId,
      stripeUrls: {
        subscription: StripeSyncService.getStripeSubscriptionUrl(s.stripeSubscriptionId),
        customer: StripeSyncService.getStripeCustomerUrl(s.stripeCustomerId),
      },
    })),
    billingStatus: primarySubscription?.status ?? null,
    pendingInvitations: mappedInvitations.filter((i) => i.status === 'pending'),
    invitations: mappedInvitations,
    recentEmails: recentLogs.map((log) => ({
      message: log.message.slice(0, 160),
      timestamp: log.timestamp.toISOString(),
      success: log.level !== 'error',
      operation: log.operation,
    })),
    recentActivity: auditEvents.map((e) => ({
      id: e.id,
      action: e.action,
      timestamp: e.timestamp.toISOString(),
      resourceType: e.resourceType,
      resourceId: e.resourceId,
    })),
    recentAiActivity: aiHistory.map((a) => ({
      interactionType: a.interactionType,
      timestamp: a.createdAt.toISOString(),
      query: a.userQuery.slice(0, 120),
    })),
    recentAuditEvents: auditEvents.map((e) => ({
      id: e.id,
      action: e.action,
      timestamp: e.timestamp.toISOString(),
    })),
    links: {
      user: `/admin-portal/users?highlight=${userId}`,
      businesses: primaryBusiness ? `/admin-portal/businesses?highlight=${primaryBusiness.id}` : '/admin-portal/businesses',
      billing: primarySubscription
        ? `/admin-portal/billing?subscription=${primarySubscription.id}`
        : primaryBusiness?.stripeCustomerId
          ? `/admin-portal/billing?customer=${primaryBusiness.stripeCustomerId}`
          : '/admin-portal/billing',
      impersonate: primaryBusiness ? `/admin-portal/impersonate?businessId=${primaryBusiness.id}` : `/admin-portal/impersonate?userId=${userId}`,
      activity: `/admin-portal/analytics?userId=${userId}`,
      emailOperations: `/admin-portal/email-operations?search=${encodeURIComponent(userEmail)}`,
      acceptInvitation: `${getAppBaseUrl()}/auth/accept-invitation`,
    },
  };
}
