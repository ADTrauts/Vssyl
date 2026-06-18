import { prisma } from '../../lib/prisma';
import { assertActiveMember, assertCanManage } from './businessAccessService';
import { BusinessServiceError } from './businessServiceErrors';
import {
  BUSINESS_DETAIL_INCLUDE,
  BUSINESS_LIST_INCLUDE,
  BUSINESS_WITH_ACTIVE_MEMBERS_INCLUDE,
  type CreateBusinessInput,
  type UpdateBusinessInput,
} from './businessServiceTypes';
import { provisionNewBusiness } from './businessBootstrapService';
import {
  recordBusinessCreated,
  recordBusinessUpdated,
} from './businessActivityService';

export async function findBusinessByEin(ein: string) {
  return prisma.business.findUnique({ where: { ein } });
}

export async function createBusiness(params: {
  actorUserId: string;
  data: CreateBusinessInput;
}) {
  const normalizedEin = params.data.ein.trim();
  if (!normalizedEin) {
    throw new BusinessServiceError('EIN / Tax ID is required', 'invalid', 400);
  }

  const existing = await findBusinessByEin(normalizedEin);
  if (existing) {
    throw new BusinessServiceError('Business with this EIN already exists', 'conflict', 400);
  }

  const business = await prisma.business.create({
    data: {
      ...params.data,
      ein: normalizedEin,
      members: {
        create: {
          userId: params.actorUserId,
          role: 'ADMIN',
          title: 'Owner',
          canInvite: true,
          canManage: true,
          canBilling: true,
        },
      },
      dashboards: {
        create: {
          userId: params.actorUserId,
          name: `${params.data.name} Dashboard`,
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- spread create input with nested relations
    } as any,
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      dashboards: true,
    },
  });

  await provisionNewBusiness({
    businessId: business.id,
    businessName: params.data.name,
    ownerUserId: params.actorUserId,
  });

  void recordBusinessCreated({
    actorUserId: params.actorUserId,
    businessId: business.id,
    name: params.data.name,
  });

  return business;
}

export async function listUserBusinesses(userId: string) {
  return prisma.business.findMany({
    where: {
      members: { some: { userId, isActive: true } },
    },
    include: {
      ...BUSINESS_LIST_INCLUDE,
      dashboards: { where: { userId } },
    },
  });
}

export async function getBusinessForMember(userId: string, businessId: string) {
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      members: { some: { userId, isActive: true } },
    },
    include: {
      ...BUSINESS_DETAIL_INCLUDE,
      dashboards: { where: { userId } },
    },
  });

  if (!business) {
    throw new BusinessServiceError('Business not found', 'not_found', 404);
  }

  return business;
}

export async function updateBusiness(params: {
  actorUserId: string;
  businessId: string;
  data: UpdateBusinessInput;
}) {
  await assertCanManage(params.actorUserId, params.businessId);

  const business = await prisma.business.update({
    where: { id: params.businessId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mixed profile/config JSON update payload
    data: params.data as any,
    include: BUSINESS_WITH_ACTIVE_MEMBERS_INCLUDE,
  });

  void recordBusinessUpdated({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    changedFields: Object.keys(params.data),
  });

  return business;
}

export async function getBusinessSetupStatus(userId: string, businessId: string) {
  await assertActiveMember(userId, businessId);

  const [business, orgCounts, moduleInstallCount, activeMemberCount] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        logo: true,
        branding: true,
        aiSettings: true,
        aiDigitalTwin: { select: { id: true } },
      },
    }),
    prisma.$transaction([
      prisma.organizationalTier.count({ where: { businessId } }),
      prisma.position.count({ where: { businessId } }),
    ]),
    prisma.businessModuleInstallation.count({ where: { businessId } }),
    prisma.businessMember.count({ where: { businessId, isActive: true } }),
  ]);

  const [tierCount, positionCount] = orgCounts;

  return {
    orgChart: (tierCount || 0) > 0 || (positionCount || 0) > 0,
    branding:
      !!business?.logo ||
      !!(business?.branding && Object.keys(business.branding as Record<string, unknown>).length > 0),
    modules: (moduleInstallCount || 0) > 0,
    aiAssistant: !!business?.aiSettings || !!business?.aiDigitalTwin,
    employees: (activeMemberCount || 0) > 1,
  };
}
