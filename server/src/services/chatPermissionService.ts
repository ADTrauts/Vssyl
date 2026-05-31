import { prisma } from '../lib/prisma';
import { ChatServiceError } from './chat/chatErrors';

export async function assertActiveConversationParticipant(
  userId: string,
  conversationId: string
): Promise<void> {
  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId,
      isActive: true,
    },
    select: { id: true },
  });

  if (!participant) {
    throw new ChatServiceError('Access denied to conversation', 'forbidden', 403);
  }
}

/**
 * When `dashboardId` is set: require the caller to own the dashboard, and require every
 * participant to be eligible for that dashboard context.
 */
export async function validateConversationDashboardAccess(
  userId: string,
  dashboardId: string | undefined,
  allParticipantIds: string[]
): Promise<void> {
  if (!dashboardId) return;

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    select: {
      businessId: true,
      householdId: true,
      institutionId: true,
    },
  });

  if (!dashboard) {
    throw new ChatServiceError('Dashboard not found or access denied', 'forbidden', 403);
  }

  const { businessId, householdId, institutionId } = dashboard;
  const hasTenantScope = Boolean(businessId || householdId || institutionId);

  if (!hasTenantScope) {
    const invalid = allParticipantIds.some((pid) => pid !== userId);
    if (invalid) {
      throw new ChatServiceError(
        'This personal workspace does not allow multi-user conversations on its dashboard',
        'invalid',
        400
      );
    }
    return;
  }

  if (businessId) {
    const members = await prisma.businessMember.findMany({
      where: {
        businessId,
        userId: { in: allParticipantIds },
        isActive: true,
      },
      select: { userId: true },
    });
    const allowed = new Set(members.map((m) => m.userId));
    if (allParticipantIds.some((pid) => !allowed.has(pid))) {
      throw new ChatServiceError(
        'All participants must be active members of this business',
        'forbidden',
        403
      );
    }
    return;
  }

  if (householdId) {
    const members = await prisma.householdMember.findMany({
      where: {
        householdId,
        userId: { in: allParticipantIds },
        isActive: true,
      },
      select: { userId: true },
    });
    const allowed = new Set(members.map((m) => m.userId));
    if (allParticipantIds.some((pid) => !allowed.has(pid))) {
      throw new ChatServiceError(
        'All participants must be active members of this household',
        'forbidden',
        403
      );
    }
    return;
  }

  if (institutionId) {
    const members = await prisma.institutionMember.findMany({
      where: {
        institutionId,
        userId: { in: allParticipantIds },
        isActive: true,
      },
      select: { userId: true },
    });
    const allowed = new Set(members.map((m) => m.userId));
    if (allParticipantIds.some((pid) => !allowed.has(pid))) {
      throw new ChatServiceError(
        'All participants must be active members of this institution',
        'forbidden',
        403
      );
    }
  }
}
