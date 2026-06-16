import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { softTrashScheduleTemplate } from './schedulingTrashService';
import {
  recordSchedulingScheduleTemplateCreatedDomainEvent,
  recordSchedulingScheduleTemplateUpdatedDomainEvent,
  recordSchedulingShiftTemplateArchivedDomainEvent,
  recordSchedulingShiftTemplateCreatedDomainEvent,
  recordSchedulingShiftTemplateUpdatedDomainEvent,
} from './schedulingDomainEventService';
import { SCHEDULING_NOT_TRASHED } from './schedulingTrashService';
import {
  SHIFT_TEMPLATE_INCLUDE,
  SchedulingWorkflowError,
  assertBusinessMemberActive,
} from './schedulingServiceShared';

function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function parseShiftTemplateTimes(body: Record<string, unknown>): {
  defaultStartTime: string;
  defaultEndTime: string;
  defaultBreakMinutes: number | null;
} {
  const start =
    typeof body.defaultStartTime === 'string' ? body.defaultStartTime : '08:00';
  const endExplicit =
    typeof body.defaultEndTime === 'string' ? body.defaultEndTime : undefined;
  const duration =
    typeof body.defaultDurationMinutes === 'number'
      ? body.defaultDurationMinutes
      : undefined;
  const breakMinutes =
    typeof body.defaultBreakMinutes === 'number'
      ? body.defaultBreakMinutes
      : typeof body.breakMinutes === 'number'
        ? body.breakMinutes
        : null;

  if (endExplicit) {
    return {
      defaultStartTime: start,
      defaultEndTime: endExplicit,
      defaultBreakMinutes: breakMinutes,
    };
  }

  if (duration !== undefined) {
    const [h, m] = start.split(':').map(Number);
    const endMinutes = h * 60 + m + duration;
    return {
      defaultStartTime: start,
      defaultEndTime: minutesToTimeString(endMinutes),
      defaultBreakMinutes: breakMinutes,
    };
  }

  return {
    defaultStartTime: start,
    defaultEndTime: '16:00',
    defaultBreakMinutes: breakMinutes,
  };
}

export async function listShiftTemplates(businessId: string) {
  return prisma.shiftTemplate.findMany({
    where: { businessId, isActive: true },
    include: SHIFT_TEMPLATE_INCLUDE,
    orderBy: { name: 'asc' },
  });
}

export async function getShiftTemplateById(businessId: string, templateId: string) {
  const template = await prisma.shiftTemplate.findFirst({
    where: { id: templateId, businessId, isActive: true },
    include: SHIFT_TEMPLATE_INCLUDE,
  });
  if (!template) {
    throw new SchedulingWorkflowError(404, 'Shift template not found');
  }
  return template;
}

export async function createShiftTemplate(
  businessId: string,
  body: Record<string, unknown>,
  actorUserId?: string
) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    throw new SchedulingWorkflowError(400, 'Template name is required');
  }

  const { defaultStartTime, defaultEndTime, defaultBreakMinutes } =
    parseShiftTemplateTimes(body);

  const positionId =
    typeof body.defaultPositionId === 'string'
      ? body.defaultPositionId
      : typeof body.positionId === 'string'
        ? body.positionId
        : null;

  const daysOfWeek = Array.isArray(body.daysOfWeek)
    ? (body.daysOfWeek as string[]).map((d) => d.toUpperCase())
    : [];

  const template = await prisma.shiftTemplate.create({
    data: {
      businessId,
      name,
      description:
        typeof body.description === 'string' ? body.description : null,
      defaultStartTime,
      defaultEndTime,
      defaultBreakMinutes,
      daysOfWeek,
      positionId,
      isActive: body.isActive !== false,
    },
    include: SHIFT_TEMPLATE_INCLUDE,
  });

  if (actorUserId) {
    recordSchedulingShiftTemplateCreatedDomainEvent({
      actorUserId,
      templateId: template.id,
      businessId,
    });
  }

  return template;
}

export async function updateShiftTemplate(
  businessId: string,
  templateId: string,
  body: Record<string, unknown>,
  actorUserId?: string
) {
  await getShiftTemplateById(businessId, templateId);

  const data: Prisma.ShiftTemplateUpdateInput = {};

  if (typeof body.name === 'string' && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (body.description !== undefined) {
    data.description =
      typeof body.description === 'string' ? body.description : null;
  }
  if (typeof body.isActive === 'boolean') {
    data.isActive = body.isActive;
  }
  if (Array.isArray(body.daysOfWeek)) {
    data.daysOfWeek = (body.daysOfWeek as string[]).map((d) => d.toUpperCase());
  }
  if (
    typeof body.defaultStartTime === 'string' ||
    typeof body.defaultEndTime === 'string' ||
    typeof body.defaultDurationMinutes === 'number'
  ) {
    const times = parseShiftTemplateTimes(body);
    data.defaultStartTime = times.defaultStartTime;
    data.defaultEndTime = times.defaultEndTime;
    if (times.defaultBreakMinutes !== null) {
      data.defaultBreakMinutes = times.defaultBreakMinutes;
    }
  }
  if (body.defaultBreakMinutes !== undefined || body.breakMinutes !== undefined) {
    const breakVal =
      typeof body.defaultBreakMinutes === 'number'
        ? body.defaultBreakMinutes
        : typeof body.breakMinutes === 'number'
          ? body.breakMinutes
          : null;
    data.defaultBreakMinutes = breakVal;
  }
  if (body.defaultPositionId !== undefined || body.positionId !== undefined) {
    const pid =
      typeof body.defaultPositionId === 'string'
        ? body.defaultPositionId
        : typeof body.positionId === 'string'
          ? body.positionId
          : null;
    data.position = pid ? { connect: { id: pid } } : { disconnect: true };
  }

  const template = await prisma.shiftTemplate.update({
    where: { id: templateId },
    data,
    include: SHIFT_TEMPLATE_INCLUDE,
  });

  if (actorUserId) {
    recordSchedulingShiftTemplateUpdatedDomainEvent({
      actorUserId,
      templateId: template.id,
      businessId,
    });
  }

  return template;
}

export async function archiveShiftTemplate(
  businessId: string,
  templateId: string,
  actorUserId?: string
) {
  await getShiftTemplateById(businessId, templateId);
  const template = await prisma.shiftTemplate.update({
    where: { id: templateId },
    data: { isActive: false },
  });

  if (actorUserId) {
    recordSchedulingShiftTemplateArchivedDomainEvent({
      actorUserId,
      templateId: template.id,
      businessId,
    });
  }

  return template;
}

export async function listScheduleTemplates(businessId: string) {
  return prisma.scheduleTemplate.findMany({
    where: { businessId, isActive: true, ...SCHEDULING_NOT_TRASHED },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getScheduleTemplateById(
  businessId: string,
  templateId: string
) {
  const template = await prisma.scheduleTemplate.findFirst({
    where: { id: templateId, businessId },
  });
  if (!template) {
    throw new SchedulingWorkflowError(404, 'Template not found');
  }
  return template;
}

export async function createScheduleTemplate(params: {
  businessId: string;
  actorUserId?: string;
  name: string;
  description?: string | null;
  scheduleType: string;
  templateData?: Prisma.InputJsonValue;
  sourceScheduleId?: string;
}) {
  let finalTemplateData: Prisma.InputJsonValue = params.templateData || {};

  if (params.sourceScheduleId) {
    const schedule = await prisma.schedule.findFirst({
      where: { id: params.sourceScheduleId, businessId: params.businessId },
      include: {
        shifts: {
          include: { position: { select: { id: true, title: true } } },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!schedule) {
      throw new SchedulingWorkflowError(404, 'Source schedule not found');
    }

    const shiftPatterns = schedule.shifts.map((shift) => {
      const startTime = new Date(shift.startTime);
      const endTime = new Date(shift.endTime);
      const dayOfWeek = startTime
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toUpperCase();

      return {
        dayOfWeek,
        startTime: `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`,
        endTime: `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`,
        positionId: shift.positionId || null,
        positionTitle: shift.position?.title || null,
        stationName: shift.stationName || null,
        breakMinutes: shift.breakMinutes || 0,
        notes: shift.notes || null,
        color: shift.color || null,
        minStaffing: shift.minStaffing || 1,
        maxStaffing: shift.maxStaffing || 1,
        isOpenShift: shift.isOpenShift || false,
      };
    });

    finalTemplateData = {
      shiftPatterns,
      sourceScheduleId: params.sourceScheduleId,
      sourceScheduleName: schedule.name,
    };
  }

  const existing = await prisma.scheduleTemplate.findUnique({
    where: { businessId_name: { businessId: params.businessId, name: params.name } },
  });

  if (existing) {
    throw new SchedulingWorkflowError(409, 'Template with this name already exists');
  }

  const template = await prisma.scheduleTemplate.create({
    data: {
      businessId: params.businessId,
      name: params.name,
      description: params.description ?? null,
      scheduleType: params.scheduleType,
      templateData: finalTemplateData,
      isActive: true,
    },
  });

  if (params.actorUserId) {
    recordSchedulingScheduleTemplateCreatedDomainEvent({
      actorUserId: params.actorUserId,
      templateId: template.id,
      businessId: params.businessId,
      scheduleType: params.scheduleType,
    });
  }

  return template;
}

export async function updateScheduleTemplate(params: {
  businessId: string;
  templateId: string;
  actorUserId?: string;
  name?: string;
  description?: string | null;
  scheduleType?: string;
  templateData?: Prisma.InputJsonValue;
  isActive?: boolean;
}) {
  const template = await getScheduleTemplateById(params.businessId, params.templateId);

  if (params.name && params.name !== template.name) {
    const existing = await prisma.scheduleTemplate.findUnique({
      where: {
        businessId_name: { businessId: params.businessId, name: params.name },
      },
    });
    if (existing) {
      throw new SchedulingWorkflowError(409, 'Template with this name already exists');
    }
  }

  const updated = await prisma.scheduleTemplate.update({
    where: { id: params.templateId },
    data: {
      ...(params.name && { name: params.name }),
      ...(params.description !== undefined && { description: params.description }),
      ...(params.scheduleType && { scheduleType: params.scheduleType }),
      ...(params.templateData && { templateData: params.templateData }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
    },
  });

  if (params.actorUserId) {
    recordSchedulingScheduleTemplateUpdatedDomainEvent({
      actorUserId: params.actorUserId,
      templateId: updated.id,
      businessId: params.businessId,
      scheduleType: updated.scheduleType,
    });
  }

  return updated;
}

export async function trashScheduleTemplate(params: {
  businessId: string;
  templateId: string;
  actorUserId: string;
}) {
  await getScheduleTemplateById(params.businessId, params.templateId);
  await softTrashScheduleTemplate({
    userId: params.actorUserId,
    businessId: params.businessId,
    templateId: params.templateId,
  });
}

export async function assertScheduleTemplateAccess(
  businessId: string,
  userId: string
): Promise<void> {
  await assertBusinessMemberActive(businessId, userId);
}
