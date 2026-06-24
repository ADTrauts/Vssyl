import { Prisma, RelationshipStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/** Users discoverable in member search: shared business/household/institution or accepted connection. */
export async function buildMemberSearchVisibilityWhere(
  searcherId: string
): Promise<Prisma.UserWhereInput> {
  const [bizRows, hhRows, instRows] = await Promise.all([
    prisma.businessMember.findMany({
      where: { userId: searcherId, isActive: true },
      select: { businessId: true },
    }),
    prisma.householdMember.findMany({
      where: { userId: searcherId, isActive: true },
      select: { householdId: true },
    }),
    prisma.institutionMember.findMany({
      where: { userId: searcherId, isActive: true },
      select: { institutionId: true },
    }),
  ]);

  const bizIds = bizRows.map((r) => r.businessId);
  const hhIds = hhRows.map((r) => r.householdId);
  const instIds = instRows.map((r) => r.institutionId);

  const or: Prisma.UserWhereInput[] = [];

  if (bizIds.length > 0) {
    or.push({
      businesses: {
        some: { businessId: { in: bizIds }, isActive: true },
      },
    });
  }
  if (hhIds.length > 0) {
    or.push({
      householdMembers: {
        some: { householdId: { in: hhIds }, isActive: true },
      },
    });
  }
  if (instIds.length > 0) {
    or.push({
      institutionMembers: {
        some: { institutionId: { in: instIds }, isActive: true },
      },
    });
  }

  or.push({
    relationshipsReceived: {
      some: {
        senderId: searcherId,
        status: RelationshipStatus.ACCEPTED,
      },
    },
  });
  or.push({
    relationshipsSent: {
      some: {
        receiverId: searcherId,
        status: RelationshipStatus.ACCEPTED,
      },
    },
  });

  return { OR: or };
}
