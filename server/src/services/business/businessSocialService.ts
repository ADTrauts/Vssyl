import { prisma } from '../../lib/prisma';

export async function followBusiness(userId: string, businessId: string) {
  const existing = await prisma.businessFollow.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });

  if (existing) {
    return { alreadyFollowing: true as const };
  }

  await prisma.businessFollow.create({
    data: { userId, businessId },
  });

  return { alreadyFollowing: false as const };
}

export async function unfollowBusiness(userId: string, businessId: string): Promise<void> {
  await prisma.businessFollow.deleteMany({
    where: { userId, businessId },
  });
}

export async function getBusinessFollowers(businessId: string) {
  const followers = await prisma.businessFollow.findMany({
    where: { businessId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return followers.map((f) => ({
    id: f.user.id,
    name: f.user.name,
    email: f.user.email,
    followedAt: f.createdAt,
  }));
}

export async function getUserFollowing(userId: string) {
  const follows = await prisma.businessFollow.findMany({
    where: { userId },
    include: {
      business: { select: { id: true, name: true, description: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return follows.map((f) => ({
    id: f.business.id,
    name: f.business.name,
    description: f.business.description,
    followedAt: f.createdAt,
  }));
}
