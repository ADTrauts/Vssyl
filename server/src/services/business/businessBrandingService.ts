import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { assertCanManage } from './businessAccessService';
import { BUSINESS_WITH_ACTIVE_MEMBERS_INCLUDE } from './businessServiceTypes';
import { recordBusinessBrandingUpdated } from './businessActivityService';

export async function updateBusinessLogo(params: {
  actorUserId: string;
  businessId: string;
  logoUrl: string;
}) {
  await assertCanManage(params.actorUserId, params.businessId);

  const business = await prisma.business.update({
    where: { id: params.businessId },
    data: { logo: params.logoUrl },
    include: BUSINESS_WITH_ACTIVE_MEMBERS_INCLUDE,
  });

  void recordBusinessBrandingUpdated({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    field: 'logo',
  });

  return business;
}

export async function removeBusinessLogo(params: {
  actorUserId: string;
  businessId: string;
}) {
  await assertCanManage(params.actorUserId, params.businessId);

  const business = await prisma.business.update({
    where: { id: params.businessId },
    data: { logo: null },
    include: BUSINESS_WITH_ACTIVE_MEMBERS_INCLUDE,
  });

  void recordBusinessBrandingUpdated({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    field: 'logo',
  });

  return business;
}

export async function updateBusinessBranding(params: {
  actorUserId: string;
  businessId: string;
  branding: Record<string, unknown>;
}) {
  await assertCanManage(params.actorUserId, params.businessId);

  const business = await prisma.business.update({
    where: { id: params.businessId },
    data: { branding: params.branding as Prisma.InputJsonValue },
    include: BUSINESS_WITH_ACTIVE_MEMBERS_INCLUDE,
  });

  void recordBusinessBrandingUpdated({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    field: 'branding',
  });

  return business;
}
