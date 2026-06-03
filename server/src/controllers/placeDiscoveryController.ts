import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { geolocationService } from '../services/geolocationService';
import { getUserFromRequest } from '../middleware/auth';
import { respondPlaceServiceError } from '../services/place/placeErrors';
import * as placeService from '../services/place/placeService';
import * as placeVisibilityService from '../services/place/placeVisibilityService';

function logPlaceDiscoveryError(desc: string, operation: string, err: unknown): void {
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

/* <place-visibility-read-handlers> */

export async function getLocalSuggestions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const clientIP = geolocationService.getClientIP(req) ?? '';
    const result = await placeVisibilityService.getLocalSuggestions(userId, clientIP);

    res.json({
      success: true,
      data: result.results,
      location: result.location,
    });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceDiscoveryError('Error fetching local suggestions', 'place_discovery_local', err);
    res.status(500).json({ success: false, error: 'Failed to fetch local suggestions' });
  }
}

export async function getForYouSuggestions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const data = await placeVisibilityService.getForYouSuggestions(userId);
    res.json({ success: true, data });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceDiscoveryError('Error fetching for-you suggestions', 'place_discovery_foryou', err);
    res.status(500).json({ success: false, error: 'Failed to fetch suggestions' });
  }
}

export async function getPlaceConnectionsContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const payload = await placeVisibilityService.getPlaceConnectionsContext(userId);
    res.json({ success: true, ...payload });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceDiscoveryError('Error fetching connections context', 'place_discovery_connections_ctx', err);
    res.status(500).json({ success: false, error: 'Failed to fetch connections context' });
  }
}

export async function getPlaceDiscoveriesContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const payload = await placeVisibilityService.getPlaceDiscoveriesContext(userId);
    res.json({ success: true, ...payload });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceDiscoveryError('Error fetching discoveries context', 'place_discovery_discoveries_ctx', err);
    res.status(500).json({ success: false, error: 'Failed to fetch discoveries context' });
  }
}

/* </place-visibility-read-handlers> */

/* <place-discovery-write-handlers> */

export async function dismissSuggestion(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { businessId } = req.params;
    const { reason } = req.body;

    await placeService.dismissSuggestion({ userId, businessId, reason });

    res.json({ success: true, message: 'Suggestion dismissed' });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceDiscoveryError('Error dismissing suggestion', 'place_discovery_dismiss', error);
    res.status(500).json({ success: false, error: 'Failed to dismiss suggestion' });
  }
}

/* </place-discovery-write-handlers> */
