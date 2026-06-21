/**
 * HR AI Context Provider Controller — thin HTTP adapter (BO-1A).
 */

import { Request, Response } from 'express';
import { getUserFromRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import {
  HrAiContextError,
  buildHrHeadcountContext,
  buildHrOverviewContext,
  buildHrTimeOffSummaryContext,
  verifyHrAiContextAccess,
} from '../services/hrAiContextService.js';

function logHrAiCtxError(message: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}

function mapError(error: unknown, res: Response, fallback: string): Response {
  if (error instanceof HrAiContextError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  logHrAiCtxError(fallback, 'ai_ctx_hr', error);
  return res.status(500).json({
    success: false,
    message: fallback,
    error: error instanceof Error ? error.message : 'Unknown error',
  });
}

export async function getHROverviewContext(req: Request, res: Response) {
  try {
    const userId = getUserFromRequest(req)?.id;
    const { businessId } = req.query;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!businessId || typeof businessId !== 'string') {
      return res.status(400).json({ success: false, message: 'businessId is required' });
    }
    await verifyHrAiContextAccess(userId, businessId);
    const payload = await buildHrOverviewContext(businessId);
    return res.json({ success: true, ...payload });
  } catch (error: unknown) {
    return mapError(error, res, 'Failed to fetch HR overview context');
  }
}

export async function getEmployeeHeadcountContext(req: Request, res: Response) {
  try {
    const userId = getUserFromRequest(req)?.id;
    const { businessId } = req.query;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!businessId || typeof businessId !== 'string') {
      return res.status(400).json({ success: false, message: 'businessId is required' });
    }
    await verifyHrAiContextAccess(userId, businessId);
    const payload = await buildHrHeadcountContext(businessId);
    return res.json({ success: true, ...payload });
  } catch (error: unknown) {
    return mapError(error, res, 'Failed to fetch headcount context');
  }
}

export async function getTimeOffSummaryContext(req: Request, res: Response) {
  try {
    const userId = getUserFromRequest(req)?.id;
    const { businessId } = req.query;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!businessId || typeof businessId !== 'string') {
      return res.status(400).json({ success: false, message: 'businessId is required' });
    }
    await verifyHrAiContextAccess(userId, businessId);
    const payload = await buildHrTimeOffSummaryContext(businessId);
    return res.json({ success: true, ...payload });
  } catch (error: unknown) {
    return mapError(error, res, 'Failed to fetch time-off summary context');
  }
}

// Legacy export name used by hrController re-exports
export { getTimeOffSummaryContext as getTimeOffContext };
