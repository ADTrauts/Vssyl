import express, { Request, Response } from 'express';
import { locationService } from '../services/locationService';
import { authenticateJWT } from '../middleware/auth';
import { logger } from '../lib/logger';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}


const router: express.Router = express.Router();

// Get all countries
router.get('/countries', async (req: Request, res: Response) => {
  try {
    const countries = await locationService.getCountries();
    res.json(countries);
  } catch (error) {
    logSrvErr('location_error_fetching_countries', 'Error fetching countries:', error);
    res.status(500).json({ message: 'Failed to fetch countries' });
  }
});

// Get regions by country
router.get('/regions/:countryId', async (req: Request, res: Response) => {
  try {
    const { countryId } = req.params;
    const regions = await locationService.getRegionsByCountry(countryId);
    res.json(regions);
  } catch (error) {
    logSrvErr('location_error_fetching_regions', 'Error fetching regions:', error);
    res.status(500).json({ message: 'Failed to fetch regions' });
  }
});

// Get towns by region
router.get('/towns/:regionId', async (req: Request, res: Response) => {
  try {
    const { regionId } = req.params;
    const towns = await locationService.getTownsByRegion(regionId);
    res.json(towns);
  } catch (error) {
    logSrvErr('location_error_fetching_towns', 'Error fetching towns:', error);
    res.status(500).json({ message: 'Failed to fetch towns' });
  }
});

// Get user's current location (authenticated)
router.get('/user-location', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = (req.user as { id: string }).id;
    const location = await locationService.getUserLocation(userId);

    if (!location) {
      return res.status(200).json({ location: null });
    }

    const hasLocation = location.country != null && location.region != null && location.town != null;
    if (!hasLocation) {
      return res.status(200).json({ location: null });
    }

    return res.status(200).json({ location });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const userId = req.user && typeof req.user === 'object' && 'id' in req.user
      ? String((req.user as { id?: string }).id)
      : undefined;
    logger.error('User location fetch failed', {
      operation: 'get_user_location',
      userId,
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ message: 'Failed to fetch user location' });
  }
});

// Note: Location update endpoint removed for security reasons
// Block IDs are permanent and cannot be changed by users
// Administrative approval required for location changes

export default router; 