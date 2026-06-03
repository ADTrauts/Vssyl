import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { getUserFromRequest } from '../middleware/auth';
import { respondPlaceServiceError } from '../services/place/placeErrors';
import * as placeAIActionService from '../services/place/placeAIActionService';

function logPlaceAIError(desc: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(desc, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}

function getUserId(req: Request): string | null {
  const user = getUserFromRequest(req);
  return user?.id ?? null;
}

function mapOutcome(
  res: Response,
  outcome: placeAIActionService.PlaceAIActionOutcome,
  errorStatus = 400
): void {
  if (!outcome.success) {
    const status =
      outcome.error.toLowerCase().includes('authentication') ||
      outcome.error.toLowerCase().includes('required')
        ? outcome.error.toLowerCase().includes('authentication')
          ? 401
          : errorStatus
        : errorStatus;
    res.status(status).json({ success: false, error: outcome.error });
    return;
  }
  res.json({ success: true, data: outcome.data });
}

/* <place-ai-handlers> */

/**
 * GET /api/place/ai/recommendations
 */
export async function getAIRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const outcome = await placeAIActionService.recommendPlaces(userId);
    mapOutcome(res, outcome);
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceAIError('Error generating AI recommendations', 'place_ai_recommendations', error);
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
}

/**
 * POST /api/place/ai/purchase-help
 */
export async function getPurchaseHelp(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { query, businessId } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, error: 'query is required' });
      return;
    }

    const outcome = await placeAIActionService.purchaseHelp(userId, {
      query,
      businessId: typeof businessId === 'string' ? businessId : null,
    });
    mapOutcome(res, outcome);
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceAIError('Error in purchase help', 'place_ai_purchase_help', error);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
}

/**
 * POST /api/place/ai/reservation-help
 */
export async function getReservationHelp(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { businessId, date, partySize } = req.body;
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, error: 'businessId is required' });
      return;
    }

    const outcome = await placeAIActionService.reservationHelp(userId, {
      businessId,
      date: typeof date === 'string' ? date : null,
      partySize: typeof partySize === 'number' ? partySize : null,
    });
    mapOutcome(res, outcome);
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceAIError('Error in reservation help', 'place_ai_reservation_help', error);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
}

/**
 * GET /api/place/ai/context/activity
 */
export async function getPlaceActivityContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const outcome = await placeAIActionService.getPlaceContext(userId, 'activity');
    if (!outcome.success) {
      mapOutcome(res, outcome);
      return;
    }

    const payload = (outcome.data as { context?: { activity?: Record<string, unknown> } }).context
      ?.activity;
    if (payload) {
      res.json({ success: true, ...payload });
      return;
    }

    res.status(500).json({ success: false, error: 'Failed to fetch activity context' });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceAIError('Error fetching activity context', 'place_ai_activity_ctx', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity context' });
  }
}

/* </place-ai-handlers> */
