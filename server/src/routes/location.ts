import express, { Request, Response } from 'express';
import { locationService } from '../services/locationService';
import { authenticateJWT } from '../middleware/auth';

const router: express.Router = express.Router();

// Get all countries
router.get('/countries', async (req: Request, res: Response) => {
  try {
    const countries = await locationService.getCountries();
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
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
    console.error('Error fetching regions:', error);
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
    console.error('Error fetching towns:', error);
    res.status(500).json({ message: 'Failed to fetch towns' });
  }
});

// Get user's current location (authenticated)
router.get('/user-location', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const location = await locationService.getUserLocation(userId);
    
    if (!location) {
      return res.status(404).json({ message: 'User location not found' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Error fetching user location:', error);
    res.status(500).json({ message: 'Failed to fetch user location' });
  }
});

// Note: Location update endpoint removed for security reasons
// Block IDs are permanent and cannot be changed by users
// Administrative approval required for location changes

export default router; 