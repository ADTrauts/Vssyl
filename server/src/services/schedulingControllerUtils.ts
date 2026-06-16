import { Response } from 'express';
import { logger } from '../lib/logger';
import { SchedulingTrashError } from './schedulingTrashService';
import { SchedulingWorkflowError } from './schedulingPublishService';
import { TimeOffConflictError } from './schedulingServiceShared';
import { AvailabilityOverlapError } from './schedulingAvailabilityService';
import {
  PositionRequirementError,
  ShiftOverlapConflictError,
} from './schedulingShiftService';

export function mapSchedulingServiceError(
  error: unknown,
  res: Response,
  operation: string
): boolean {
  if (error instanceof SchedulingWorkflowError) {
    res.status(error.statusCode).json({ error: error.message });
    return true;
  }

  if (error instanceof TimeOffConflictError) {
    const { conflict } = error;
    res.status(409).json({
      error: 'Cannot schedule shift during employee time-off',
      message: `${conflict.employeeName} has ${conflict.type} time-off from ${conflict.startDate} to ${conflict.endDate}`,
      conflict,
    });
    return true;
  }

  if (error instanceof AvailabilityOverlapError) {
    res.status(409).json({
      error: error.message,
      conflictId: error.conflictId,
    });
    return true;
  }

  if (error instanceof ShiftOverlapConflictError) {
    const body: Record<string, unknown> = { error: error.message };
    if (error.conflictingShiftId) {
      body.conflictingShiftId = error.conflictingShiftId;
    }
    res.status(409).json(body);
    return true;
  }

  if (error instanceof PositionRequirementError) {
    res.status(403).json({
      error: error.message,
      requiredPositionId: error.requiredPositionId,
    });
    return true;
  }

  if (error instanceof SchedulingTrashError) {
    if (error.code === 'not_found') {
      res.status(404).json({ error: 'Resource not found' });
      return true;
    }
    if (error.code === 'forbidden') {
      res.status(403).json({ error: 'Access denied' });
      return true;
    }
  }

  const err = error instanceof Error ? error : new Error('Unknown error');
  logger.error(`Failed: ${operation}`, {
    operation,
    error: { message: err.message, stack: err.stack },
  });
  res.status(500).json({ error: `Failed: ${operation}` });
  return true;
}
