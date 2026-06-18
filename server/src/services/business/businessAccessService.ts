import { prisma } from '../../lib/prisma';
import { BusinessServiceError } from './businessServiceErrors';

export async function assertActiveMember(userId: string, businessId: string): Promise<void> {
  const membership = await prisma.businessMember.findFirst({
    where: { businessId, userId, isActive: true },
  });
  if (!membership) {
    throw new BusinessServiceError('Access denied', 'forbidden', 403);
  }
}

export async function assertCanManage(userId: string, businessId: string): Promise<void> {
  const membership = await prisma.businessMember.findFirst({
    where: { businessId, userId, isActive: true, canManage: true },
  });
  if (!membership) {
    throw new BusinessServiceError('Insufficient permissions', 'forbidden', 403);
  }
}

export async function assertCanInvite(userId: string, businessId: string): Promise<void> {
  const membership = await prisma.businessMember.findFirst({
    where: { businessId, userId, isActive: true, canInvite: true },
  });
  if (!membership) {
    throw new BusinessServiceError('Insufficient permissions', 'forbidden', 403);
  }
}
