import { JobFunction, Prisma, StationType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { SchedulingWorkflowError } from './schedulingServiceShared';

const TIME_FIELD_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface CreateStationInput {
  businessId: string;
  name: string;
  stationType: StationType;
  jobFunction?: JobFunction | null;
  description?: string | null;
  color?: string | null;
  isRequired?: boolean;
  priority?: number | null;
  defaultStartTime?: string | null;
  defaultEndTime?: string | null;
}

export interface UpdateStationInput {
  businessId: string;
  stationId: string;
  name?: string;
  stationType?: StationType;
  jobFunction?: JobFunction | null;
  description?: string | null;
  color?: string | null;
  isRequired?: boolean;
  priority?: number | null;
  isActive?: boolean;
  defaultStartTime?: string | null;
  defaultEndTime?: string | null;
}

function normalizeTimeField(
  value: unknown,
  fieldLabel: string
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  if (typeof value === 'string' && TIME_FIELD_REGEX.test(value.trim())) {
    return value.trim();
  }
  throw new SchedulingWorkflowError(
    400,
    `Invalid ${fieldLabel}. Use HH:mm (24-hour format).`
  );
}

export async function listBusinessStations(businessId: string) {
  const stations = await prisma.businessStation.findMany({
    where: { businessId },
    orderBy: [{ priority: 'desc' }, { name: 'asc' }],
  });

  logger.info('Business stations retrieved', {
    operation: 'list_stations',
    businessId,
    count: stations.length,
  });

  return stations;
}

export async function getBusinessStationById(businessId: string, stationId: string) {
  const station = await prisma.businessStation.findUnique({
    where: { id: stationId },
  });

  if (!station) {
    throw new SchedulingWorkflowError(404, 'Station not found');
  }
  if (station.businessId !== businessId) {
    throw new SchedulingWorkflowError(403, 'Access denied');
  }

  return station;
}

export async function createBusinessStation(input: CreateStationInput) {
  const name = input.name.trim();
  if (!name) {
    throw new SchedulingWorkflowError(400, 'Station name is required');
  }

  const existing = await prisma.businessStation.findUnique({
    where: { businessId_name: { businessId: input.businessId, name } },
  });
  if (existing) {
    throw new SchedulingWorkflowError(409, 'Station with this name already exists');
  }

  const normalizedStartTime = normalizeTimeField(
    input.defaultStartTime,
    'default start time'
  );
  const normalizedEndTime = normalizeTimeField(input.defaultEndTime, 'default end time');

  const station = await prisma.businessStation.create({
    data: {
      businessId: input.businessId,
      name,
      stationType: input.stationType,
      jobFunction: input.jobFunction ?? null,
      description: input.description ?? null,
      color: input.color ?? null,
      isRequired: input.isRequired === true,
      priority: input.priority ?? null,
      isActive: true,
      defaultStartTime: normalizedStartTime ?? undefined,
      defaultEndTime: normalizedEndTime ?? undefined,
    } as Prisma.BusinessStationUncheckedCreateInput,
  });

  logger.info('Business station created', {
    operation: 'create_station',
    businessId: input.businessId,
    stationId: station.id,
  });

  return station;
}

export async function updateBusinessStation(input: UpdateStationInput) {
  const existing = await prisma.businessStation.findUnique({
    where: { id: input.stationId },
  });

  if (!existing) {
    throw new SchedulingWorkflowError(404, 'Station not found');
  }
  if (existing.businessId !== input.businessId) {
    throw new SchedulingWorkflowError(403, 'Access denied');
  }

  if (input.name && input.name.trim() !== existing.name) {
    const duplicate = await prisma.businessStation.findUnique({
      where: {
        businessId_name: { businessId: input.businessId, name: input.name.trim() },
      },
    });
    if (duplicate) {
      throw new SchedulingWorkflowError(409, 'Station with this name already exists');
    }
  }

  const data: Prisma.BusinessStationUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.stationType !== undefined) data.stationType = input.stationType;
  if (input.jobFunction !== undefined) data.jobFunction = input.jobFunction;
  if (input.description !== undefined) data.description = input.description;
  if (input.color !== undefined) data.color = input.color;
  if (input.isRequired !== undefined) data.isRequired = input.isRequired;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const startTime = normalizeTimeField(input.defaultStartTime, 'default start time');
  if (startTime !== undefined) data.defaultStartTime = startTime;
  const endTime = normalizeTimeField(input.defaultEndTime, 'default end time');
  if (endTime !== undefined) data.defaultEndTime = endTime;

  const station = await prisma.businessStation.update({
    where: { id: input.stationId },
    data,
  });

  logger.info('Business station updated', {
    operation: 'update_station',
    businessId: input.businessId,
    stationId: station.id,
  });

  return station;
}

export async function deleteBusinessStation(businessId: string, stationId: string) {
  const existing = await prisma.businessStation.findUnique({
    where: { id: stationId },
  });

  if (!existing) {
    throw new SchedulingWorkflowError(404, 'Station not found');
  }
  if (existing.businessId !== businessId) {
    throw new SchedulingWorkflowError(403, 'Access denied');
  }

  const shiftsUsingStation = await prisma.scheduleShift.count({
    where: { businessId, stationName: existing.name },
  });

  if (shiftsUsingStation > 0) {
    throw new SchedulingWorkflowError(
      409,
      `Cannot delete station that is assigned to shifts. This station is currently assigned to ${shiftsUsingStation} shift(s).`
    );
  }

  await prisma.businessStation.delete({ where: { id: stationId } });

  logger.info('Business station deleted', {
    operation: 'delete_station',
    businessId,
    stationId,
  });
}
