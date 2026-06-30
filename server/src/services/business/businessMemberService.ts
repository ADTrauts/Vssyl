import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { NotificationService } from '../notificationService';
import { sendBusinessInvitationEmail } from '../emailService';
import { addUsersToScheduleCalendar } from '../hrScheduleService';
import { assertActiveMember, assertCanInvite, assertCanManage } from './businessAccessService';
import { BusinessServiceError } from './businessServiceErrors';
import type { InviteMemberInput, UpdateMemberInput } from './businessServiceTypes';
import { ensureMemberBusinessCalendar } from './businessBootstrapService';
import {
  recordBusinessMemberInvited,
  recordBusinessMemberJoined,
  recordBusinessMemberRemoved,
  recordBusinessMemberUpdated,
} from './businessActivityService';

export async function getInvitationBusinessId(token: string): Promise<{ businessId: string }> {
  const invitation = await prisma.businessInvitation.findUnique({
    where: { token },
    select: { businessId: true },
  });
  if (!invitation) {
    throw new BusinessServiceError('Invitation not found', 'not_found', 404);
  }
  return invitation;
}

export type InvitationPreviewStatus = 'pending' | 'expired' | 'accepted';

export interface InvitationPreview {
  status: InvitationPreviewStatus;
  businessId: string;
  businessName: string;
  email: string;
  role: string;
  title: string | null;
  department: string | null;
  expiresAt: string;
}

export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const invitation = await prisma.businessInvitation.findUnique({
    where: { token },
    include: { business: { select: { id: true, name: true } } },
  });

  if (!invitation) {
    throw new BusinessServiceError('Invitation not found', 'not_found', 404);
  }

  let status: InvitationPreviewStatus = 'pending';
  if (invitation.acceptedAt) {
    status = 'accepted';
  } else if (invitation.expiresAt < new Date()) {
    status = 'expired';
  }

  return {
    status,
    businessId: invitation.businessId,
    businessName: invitation.business.name,
    email: invitation.email,
    role: invitation.role,
    title: invitation.title,
    department: invitation.department,
    expiresAt: invitation.expiresAt.toISOString(),
  };
}

export async function inviteMember(params: {
  actorUserId: string;
  actorName: string | null;
  actorUserNumber: string | null;
  businessId: string;
  data: InviteMemberInput;
}) {
  await assertCanInvite(params.actorUserId, params.businessId);

  const existingMember = await prisma.businessMember.findFirst({
    where: {
      businessId: params.businessId,
      user: { email: params.data.email },
      isActive: true,
    },
  });

  if (existingMember) {
    throw new BusinessServiceError('User is already a member', 'conflict', 400);
  }

  const business = await prisma.business.findUnique({
    where: { id: params.businessId },
    include: {
      members: {
        where: { userId: params.actorUserId },
        select: { role: true, title: true },
      },
    },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.businessInvitation.create({
    data: {
      businessId: params.businessId,
      email: params.data.email,
      role: params.data.role,
      title: params.data.title,
      department: params.data.department,
      invitedById: params.actorUserId,
      token,
      expiresAt,
    },
  });

  try {
    await sendBusinessInvitationEmail(
      invitation.email,
      business?.name || 'Business',
      params.actorName || 'Team Member',
      invitation.role,
      invitation.title,
      invitation.department,
      invitation.token,
      undefined,
      params.actorUserNumber || undefined
    );
  } catch (emailError: unknown) {
    const err = emailError instanceof Error ? emailError : new Error(String(emailError));
    void logger.error('Error sending business invitation email', {
      operation: 'business_invite_email',
      error: { message: err.message, stack: err.stack },
    });
  }

  try {
    const invitedUser = await prisma.user.findUnique({
      where: { email: params.data.email },
    });

    if (invitedUser) {
      await NotificationService.handleNotification({
        type: 'business_invitation',
        title: `You've been invited to join ${business?.name}`,
        body: `${params.actorName} invited you to join as ${params.data.role.toLowerCase()}`,
        data: {
          businessId: params.businessId,
          businessName: business?.name,
          invitationId: invitation.id,
          role: params.data.role,
          title: params.data.title,
          department: params.data.department,
          invitedById: params.actorUserId,
          invitedByName: params.actorName,
        },
        recipients: [invitedUser.id],
        senderId: params.actorUserId,
      });
    }
  } catch (notificationError: unknown) {
    const err = notificationError instanceof Error ? notificationError : new Error(String(notificationError));
    void logger.error('Error creating business invitation notification', {
      operation: 'business_invite_notification',
      error: { message: err.message, stack: err.stack },
    });
  }

  void recordBusinessMemberInvited({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    invitationId: invitation.id,
    email: params.data.email,
    role: params.data.role,
  });

  return invitation;
}

export async function acceptInvitation(params: {
  actorUserId: string;
  token: string;
}) {
  const invitation = await prisma.businessInvitation.findUnique({
    where: { token: params.token },
    include: { business: true },
  });

  if (!invitation) {
    throw new BusinessServiceError('Invitation not found', 'not_found', 404);
  }

  if (invitation.expiresAt < new Date()) {
    throw new BusinessServiceError('Invitation has expired', 'invalid', 400);
  }

  if (invitation.acceptedAt) {
    throw new BusinessServiceError('Invitation already accepted', 'invalid', 400);
  }

  const normalizeEmail = (e: string) => e.trim().toLowerCase();
  const account = await prisma.user.findUnique({
    where: { id: params.actorUserId },
    select: { email: true },
  });

  if (!account?.email) {
    throw new BusinessServiceError('Access denied', 'forbidden', 403);
  }

  if (normalizeEmail(account.email) !== normalizeEmail(invitation.email)) {
    throw new BusinessServiceError(
      'This invitation was sent to a different email address',
      'forbidden',
      403
    );
  }

  const existingMember = await prisma.businessMember.findFirst({
    where: {
      businessId: invitation.businessId,
      userId: params.actorUserId,
      isActive: true,
    },
  });

  if (existingMember) {
    throw new BusinessServiceError('Already a member of this business', 'conflict', 400);
  }

  const [member, dashboard] = await prisma.$transaction([
    prisma.businessMember.create({
      data: {
        businessId: invitation.businessId,
        userId: params.actorUserId,
        role: invitation.role,
        title: invitation.title,
        department: invitation.department,
        canInvite: invitation.role === 'ADMIN' || invitation.role === 'MANAGER',
        canManage: invitation.role === 'ADMIN',
        canBilling: invitation.role === 'ADMIN',
      },
      include: {
        business: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.dashboard.create({
      data: {
        userId: params.actorUserId,
        businessId: invitation.businessId,
        name: `${invitation.business.name} Dashboard`,
      },
    }),
    prisma.businessInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  await ensureMemberBusinessCalendar({
    businessId: invitation.businessId,
    businessName: invitation.business.name,
    userId: params.actorUserId,
  });

  try {
    await addUsersToScheduleCalendar(invitation.businessId, [params.actorUserId]);
  } catch (scheduleError: unknown) {
    const err = scheduleError instanceof Error ? scheduleError : new Error(String(scheduleError));
    void logger.error('Failed to add user to HR schedule calendar', {
      operation: 'business_invite_hr_schedule',
      error: { message: err.message, stack: err.stack },
    });
  }

  void recordBusinessMemberJoined({
    actorUserId: params.actorUserId,
    businessId: invitation.businessId,
    memberId: member.id,
    memberUserId: params.actorUserId,
    role: invitation.role,
  });

  return { member, dashboard };
}

export async function listBusinessMembers(userId: string, businessId: string) {
  await assertActiveMember(userId, businessId);

  return prisma.businessMember.findMany({
    where: { businessId, isActive: true },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: 'asc' },
  });
}

export async function updateBusinessMember(params: {
  actorUserId: string;
  businessId: string;
  memberUserId: string;
  data: UpdateMemberInput;
}) {
  await assertCanManage(params.actorUserId, params.businessId);

  const member = await prisma.businessMember.update({
    where: {
      businessId_userId: {
        businessId: params.businessId,
        userId: params.memberUserId,
      },
    },
    data: params.data,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  void recordBusinessMemberUpdated({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    memberId: member.id,
    memberUserId: params.memberUserId,
    changedFields: Object.keys(params.data),
  });

  return member;
}

export async function removeBusinessMember(params: {
  actorUserId: string;
  businessId: string;
  memberUserId: string;
}) {
  await assertCanManage(params.actorUserId, params.businessId);

  const targetMember = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId: params.businessId,
        userId: params.memberUserId,
      },
    },
    select: { id: true, role: true, userId: true },
  });

  if (params.memberUserId === params.actorUserId) {
    const adminCount = await prisma.businessMember.count({
      where: {
        businessId: params.businessId,
        role: 'ADMIN',
        isActive: true,
      },
    });

    if (adminCount <= 1) {
      throw new BusinessServiceError('Cannot remove the last admin', 'invalid', 400);
    }
  }

  await prisma.businessMember.update({
    where: {
      businessId_userId: {
        businessId: params.businessId,
        userId: params.memberUserId,
      },
    },
    data: {
      isActive: false,
      leftAt: new Date(),
    },
  });

  if (targetMember) {
    void recordBusinessMemberRemoved({
      actorUserId: params.actorUserId,
      businessId: params.businessId,
      memberId: targetMember.id,
      memberUserId: targetMember.userId,
      role: targetMember.role,
    });
  }
}
