import { prisma } from '../lib/prisma';
import { ChatServiceError } from './chat/chatErrors';

export interface ChatUserSearchInput {
  currentUserId: string;
  query: string;
  limit?: number;
  offset?: number;
}

type UserWithOrg = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  businesses: Array<{
    business: { id: string; name: string };
    role: string;
  }>;
  institutionMembers: Array<{
    institution: { id: string; name: string };
    role: string;
  }>;
};

function getOrganizationInfo(user: UserWithOrg) {
  if (user.businesses.length > 0) {
    const membership = user.businesses[0];
    return {
      id: membership.business.id,
      name: membership.business.name,
      type: 'business' as const,
      role: membership.role,
    };
  }
  if (user.institutionMembers.length > 0) {
    const membership = user.institutionMembers[0];
    return {
      id: membership.institution.id,
      name: membership.institution.name,
      type: 'institution' as const,
      role: membership.role,
    };
  }
  return null;
}

export async function searchUsersForChatInvite(input: ChatUserSearchInput) {
  const { currentUserId, query, limit = 20, offset = 0 } = input;
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    throw new ChatServiceError('Query must be at least 2 characters', 'invalid', 400);
  }

  const currentUserBusinesses = await prisma.businessMember.findMany({
    where: { userId: currentUserId, isActive: true },
    select: { businessId: true },
  });

  const currentUserBusinessIds = currentUserBusinesses.map((m) => m.businessId);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: trimmed, mode: 'insensitive' } },
        { email: { contains: trimmed, mode: 'insensitive' } },
      ],
      NOT: { id: currentUserId },
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      businesses: {
        where: { isActive: true },
        select: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
          role: true,
        },
      },
      institutionMembers: {
        where: { isActive: true },
        select: {
          institution: {
            select: {
              id: true,
              name: true,
            },
          },
          role: true,
        },
      },
    },
    take: limit,
    skip: offset,
  });

  const relationships = await prisma.relationship.findMany({
    where: {
      OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      status: true,
      type: true,
    },
  });

  const processedUsers = users.map((user) => {
    const sentRelationship = relationships.find(
      (r) => r.senderId === user.id && r.receiverId === currentUserId
    );
    const receivedRelationship = relationships.find(
      (r) => r.receiverId === user.id && r.senderId === currentUserId
    );

    let connectionStatus = 'none';
    let relationshipId: string | null = null;

    if (sentRelationship) {
      connectionStatus = sentRelationship.status.toLowerCase();
      relationshipId = sentRelationship.id;
    } else if (receivedRelationship) {
      connectionStatus = receivedRelationship.status.toLowerCase();
      relationshipId = receivedRelationship.id;
    }

    const isColleague = user.businesses.some((membership) =>
      currentUserBusinessIds.includes(membership.business.id)
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      connectionStatus,
      relationshipId,
      organization: getOrganizationInfo(user),
      isColleague,
      canConnect: connectionStatus === 'none',
    };
  });

  return processedUsers.sort((a, b) => {
    if (a.connectionStatus === 'accepted' && b.connectionStatus !== 'accepted') return -1;
    if (b.connectionStatus === 'accepted' && a.connectionStatus !== 'accepted') return 1;
    if (a.isColleague && !b.isColleague) return -1;
    if (b.isColleague && !a.isColleague) return 1;
    return (a.name || a.email).localeCompare(b.name || b.email);
  });
}
