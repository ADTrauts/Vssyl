import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/schedulingPermissions';
import { logger } from '../../lib/logger';
import {
  SchedulingAiContextError,
  buildCoverageStatusContext,
  buildSchedulingConflictsContext,
  buildSchedulingOverviewContext,
  verifySchedulingAiContextAccess,
} from '../../services/schedulingAiContextService.js';

function mapAiContextError(error: unknown, res: Response, fallbackMessage: string): void {
  if (error instanceof SchedulingAiContextError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(fallbackMessage, {
    operation: 'scheduling_ai_context',
    error: { message: err.message, stack: err.stack },
  });
  res.status(500).json({ success: false, message: fallbackMessage, error: err.message });
}

export async function getSchedulingOverviewForAI(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const { businessId } = req.query;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, message: 'businessId is required' });
      return;
    }
    await verifySchedulingAiContextAccess(user.id, businessId);
    const payload = await buildSchedulingOverviewContext(businessId);
    res.json({ success: true, ...payload });
  } catch (error: unknown) {
    mapAiContextError(error, res, 'Failed to fetch scheduling overview');
  }
}

export async function getCoverageStatusForAI(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const { businessId } = req.query;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, message: 'businessId is required' });
      return;
    }
    await verifySchedulingAiContextAccess(user.id, businessId);
    const payload = await buildCoverageStatusContext(businessId);
    res.json({ success: true, ...payload });
  } catch (error: unknown) {
    mapAiContextError(error, res, 'Failed to fetch coverage status');
  }
}

export async function getSchedulingConflictsForAI(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const { businessId } = req.query;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, message: 'businessId is required' });
      return;
    }
    await verifySchedulingAiContextAccess(user.id, businessId);
    const payload = await buildSchedulingConflictsContext(businessId);
    res.json({ success: true, ...payload });
  } catch (error: unknown) {
    mapAiContextError(error, res, 'Failed to fetch scheduling conflicts');
  }
}
