import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { sendBusinessInvitationEmail } from '../emailService.js';
import { getAppBaseUrl } from '../email/config.js';

export type InvitationOpsStatus = 'pending' | 'accepted' | 'expired' | 'failed';

function deriveStatus(inv: {
  acceptedAt: Date | null;
  expiresAt: Date;
}): InvitationOpsStatus {
  if (inv.acceptedAt) return 'accepted';
  if (inv.expiresAt < new Date()) return 'expired';
  return 'pending';
}

export function buildInvitationAcceptUrl(token: string): string {
  return `${getAppBaseUrl()}/auth/accept-invitation?token=${encodeURIComponent(token)}`;
}

export async function listInvitationsForOperator(params: {
  search?: string;
  businessId?: string;
  status?: InvitationOpsStatus;
  page?: number;
  limit?: number;
}) {
  const { search, businessId, status, page = 1, limit = 25 } = params;
  const skip = (page - 1) * limit;
  const now = new Date();

  const where: Record<string, unknown> = {};
  if (businessId) where.businessId = businessId;
  if (search) {
    where.email = { contains: search, mode: 'insensitive' };
  }
  if (status === 'accepted') {
    where.acceptedAt = { not: null };
  } else if (status === 'pending') {
    where.acceptedAt = null;
    where.expiresAt = { gte: now };
  } else if (status === 'expired') {
    where.acceptedAt = null;
    where.expiresAt = { lt: now };
  }

  const [rows, total] = await Promise.all([
    prisma.businessInvitation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        createdAt: true,
        expiresAt: true,
        acceptedAt: true,
        business: { select: { id: true, name: true } },
        invitedBy: { select: { name: true, email: true } },
      },
    }),
    prisma.businessInvitation.count({ where }),
  ]);

  let failedEmailSet = new Set<string>();
  if (status === 'failed' || !status) {
    try {
      const dayAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const failureLogs = await prisma.log.findMany({
        where: {
          operation: 'send_email',
          level: 'error',
          timestamp: { gte: dayAgo },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
        select: { message: true },
      });
      for (const log of failureLogs) {
        const match = log.message.match(/[\w.+-]+@[\w.-]+\.\w+/);
        if (match) failedEmailSet.add(match[0].toLowerCase());
      }
    } catch {
      // optional
    }
  }

  const invitations = rows
    .map((inv) => {
      let derived = deriveStatus(inv);
      if (derived === 'pending' && failedEmailSet.has(inv.email.toLowerCase())) {
        derived = 'failed';
      }
      return {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        businessId: inv.business.id,
        businessName: inv.business.name,
        status: derived,
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString(),
        acceptedAt: inv.acceptedAt?.toISOString() ?? null,
        invitedByName: inv.invitedBy.name ?? inv.invitedBy.email,
        inviteUrl: buildInvitationAcceptUrl(inv.token),
      };
    })
    .filter((inv) => (status === 'failed' ? inv.status === 'failed' : true));

  const filteredTotal = status === 'failed' ? invitations.length : total;

  return {
    invitations,
    total: filteredTotal,
    page,
    totalPages: Math.ceil(filteredTotal / limit) || 1,
  };
}

export async function getInvitationLinkForOperator(invitationId: string) {
  const inv = await prisma.businessInvitation.findUnique({
    where: { id: invitationId },
    select: { id: true, email: true, token: true, expiresAt: true, acceptedAt: true },
  });
  if (!inv) return null;
  return {
    id: inv.id,
    email: inv.email,
    status: deriveStatus(inv),
    inviteUrl: buildInvitationAcceptUrl(inv.token),
    expiresAt: inv.expiresAt.toISOString(),
  };
}

export async function resendInvitationForOperator(invitationId: string, adminUserId: string) {
  const invitation = await prisma.businessInvitation.findUnique({
    where: { id: invitationId },
    include: {
      business: true,
      invitedBy: { select: { name: true } },
    },
  });

  if (!invitation) return { ok: false as const, error: 'Invitation not found' };
  if (invitation.acceptedAt) return { ok: false as const, error: 'Invitation already accepted' };
  if (invitation.expiresAt < new Date()) return { ok: false as const, error: 'Invitation has expired' };

  try {
    const result = await sendBusinessInvitationEmail(
      invitation.email,
      invitation.business.name,
      invitation.invitedBy.name || 'Vssyl Operations',
      invitation.role,
      invitation.title,
      invitation.department,
      invitation.token,
    );

    await logger.info('Admin resent business invitation', {
      operation: 'admin_resend_invitation',
      adminId: adminUserId,
      invitationId,
      email: invitation.email,
      sent: result.sent,
    });

    return {
      ok: true as const,
      sent: result.sent,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        inviteUrl: buildInvitationAcceptUrl(invitation.token),
      },
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Admin failed to resend invitation', {
      operation: 'admin_resend_invitation',
      adminId: adminUserId,
      invitationId,
      error: { message: err.message, stack: err.stack },
    });
    return { ok: false as const, error: 'Failed to resend invitation email' };
  }
}

export async function getRecentInvitationEmailsForBusiness(businessId: string, limit = 8) {
  try {
    const invitations = await prisma.businessInvitation.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { email: true, createdAt: true },
    });
    const emails = invitations.map((i) => i.email);
    if (emails.length === 0) return [];

    const logs = await prisma.log.findMany({
      where: {
        operation: 'send_email',
        OR: emails.map((email) => ({ message: { contains: email, mode: 'insensitive' as const } })),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: { message: true, timestamp: true, level: true },
    });

    return logs.map((log) => ({
      message: log.message.slice(0, 160),
      timestamp: log.timestamp.toISOString(),
      success: log.level !== 'error',
    }));
  } catch {
    return [];
  }
}
