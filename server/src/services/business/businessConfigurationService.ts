import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { assertCanManage } from './businessAccessService';
import { BUSINESS_WITH_ACTIVE_MEMBERS_INCLUDE } from './businessServiceTypes';
import { recordBusinessUpdated } from './businessActivityService';

export async function updateBusinessConfiguration(params: {
  actorUserId: string;
  businessId: string;
  schedulingMode?: string;
  schedulingStrategy?: string;
  schedulingConfig?: Record<string, unknown>;
  aiSettings?: Record<string, unknown>;
}) {
  await assertCanManage(params.actorUserId, params.businessId);

  const data: Prisma.BusinessUpdateInput = {};
  const changedFields: string[] = [];

  if (params.schedulingMode !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma enum field from API string
    data.schedulingMode = params.schedulingMode as any;
    changedFields.push('schedulingMode');
  }
  if (params.schedulingStrategy !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma enum field from API string
    data.schedulingStrategy = params.schedulingStrategy as any;
    changedFields.push('schedulingStrategy');
  }
  if (params.schedulingConfig !== undefined) {
    data.schedulingConfig = params.schedulingConfig as Prisma.InputJsonValue;
    changedFields.push('schedulingConfig');
  }
  if (params.aiSettings !== undefined) {
    data.aiSettings = params.aiSettings as Prisma.InputJsonValue;
    changedFields.push('aiSettings');
  }

  const business = await prisma.business.update({
    where: { id: params.businessId },
    data,
    include: BUSINESS_WITH_ACTIVE_MEMBERS_INCLUDE,
  });

  if (changedFields.length > 0) {
    void recordBusinessUpdated({
      actorUserId: params.actorUserId,
      businessId: params.businessId,
      changedFields,
      updateKind: 'configuration',
    });
  }

  return business;
}
