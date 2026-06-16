import { BusinessRole, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { SchedulingWorkflowError } from './schedulingServiceShared';

async function assertActiveBusinessMember(userId: string, businessId: string) {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
  });

  if (!member?.isActive) {
    throw new SchedulingWorkflowError(403, 'Access denied');
  }

  return member;
}

async function assertBusinessAdmin(userId: string, businessId: string) {
  const member = await assertActiveBusinessMember(userId, businessId);
  if (member.role !== BusinessRole.ADMIN) {
    throw new SchedulingWorkflowError(403, 'Admin access required');
  }
}

export async function listBusinessJobLocations(userId: string, businessId: string) {
  await assertActiveBusinessMember(userId, businessId);

  return prisma.jobLocation.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function createBusinessJobLocation(params: {
  userId: string;
  businessId: string;
  name: string;
  address?: Prisma.InputJsonValue | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}) {
  await assertBusinessAdmin(params.userId, params.businessId);

  const name = params.name.trim();
  if (!name) {
    throw new SchedulingWorkflowError(400, 'Location name is required');
  }

  const existing = await prisma.jobLocation.findUnique({
    where: { businessId_name: { businessId: params.businessId, name } },
  });
  if (existing) {
    throw new SchedulingWorkflowError(409, 'Job location with this name already exists');
  }

  const location = await prisma.jobLocation.create({
    data: {
      businessId: params.businessId,
      name,
      address:
        params.address === undefined
          ? undefined
          : params.address === null
            ? Prisma.JsonNull
            : params.address,
      description: params.description ?? null,
      phone: params.phone ?? null,
      email: params.email ?? null,
      notes: params.notes ?? null,
      isActive: true,
    },
  });

  logger.info('Job location created', {
    operation: 'create_job_location',
    userId: params.userId,
    businessId: params.businessId,
    locationId: location.id,
  });

  return location;
}

export async function updateBusinessJobLocation(params: {
  userId: string;
  locationId: string;
  name?: string;
  address?: Prisma.InputJsonValue | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive?: boolean;
}) {
  const existing = await prisma.jobLocation.findUnique({
    where: { id: params.locationId },
  });

  if (!existing) {
    throw new SchedulingWorkflowError(404, 'Job location not found');
  }

  await assertBusinessAdmin(params.userId, existing.businessId);

  if (params.name && params.name.trim() !== existing.name) {
    const duplicate = await prisma.jobLocation.findUnique({
      where: {
        businessId_name: {
          businessId: existing.businessId,
          name: params.name.trim(),
        },
      },
    });
    if (duplicate) {
      throw new SchedulingWorkflowError(409, 'Job location with this name already exists');
    }
  }

  const data: Prisma.JobLocationUpdateInput = {};
  if (params.name) data.name = params.name.trim();
  if (params.address !== undefined) {
    data.address =
      params.address === null ? Prisma.JsonNull : params.address;
  }
  if (params.description !== undefined) data.description = params.description;
  if (params.phone !== undefined) data.phone = params.phone;
  if (params.email !== undefined) data.email = params.email;
  if (params.notes !== undefined) data.notes = params.notes;
  if (params.isActive !== undefined) data.isActive = params.isActive;

  const location = await prisma.jobLocation.update({
    where: { id: params.locationId },
    data,
  });

  logger.info('Job location updated', {
    operation: 'update_job_location',
    userId: params.userId,
    businessId: existing.businessId,
    locationId: params.locationId,
  });

  return location;
}

export async function deleteBusinessJobLocation(userId: string, locationId: string) {
  const existing = await prisma.jobLocation.findUnique({
    where: { id: locationId },
  });

  if (!existing) {
    throw new SchedulingWorkflowError(404, 'Job location not found');
  }

  await assertBusinessAdmin(userId, existing.businessId);

  const schedulesUsingLocation = await prisma.schedule.count({
    where: { businessId: existing.businessId, locationId },
  });
  const shiftsUsingLocation = await prisma.scheduleShift.count({
    where: { businessId: existing.businessId, locationId },
  });

  if (schedulesUsingLocation > 0 || shiftsUsingLocation > 0) {
    throw new SchedulingWorkflowError(
      409,
      `Cannot delete location that is in use. Used by ${schedulesUsingLocation} schedule(s) and ${shiftsUsingLocation} shift(s).`
    );
  }

  await prisma.jobLocation.delete({ where: { id: locationId } });

  logger.info('Job location deleted', {
    operation: 'delete_job_location',
    userId,
    businessId: existing.businessId,
    locationId,
  });
}
