import { prisma } from '../lib/prisma';

export interface Country {
  id: string;
  name: string;
  phoneCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  countryId: string;
  country: Country;
  createdAt: Date;
  updatedAt: Date;
}

export interface Town {
  id: string;
  name: string;
  code: string;
  regionId: string;
  region: Region;
  createdAt: Date;
  updatedAt: Date;
}

export class LocationService {
  /**
   * Get all countries
   */
  async getCountries(): Promise<Country[]> {
    return await prisma.country.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get regions by country
   */
  async getRegionsByCountry(countryId: string): Promise<Region[]> {
    return await prisma.region.findMany({
      where: { countryId },
      include: { country: true },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get towns by region
   */
  async getTownsByRegion(regionId: string): Promise<Town[]> {
    return await prisma.town.findMany({
      where: { regionId },
      include: { 
        region: {
          include: {
            country: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get country by ID
   */
  async getCountryById(id: string): Promise<Country | null> {
    return await prisma.country.findUnique({
      where: { id }
    });
  }

  /**
   * Get region by ID
   */
  async getRegionById(id: string): Promise<Region | null> {
    return await prisma.region.findUnique({
      where: { id },
      include: { country: true }
    });
  }

  /**
   * Get town by ID
   */
  async getTownById(id: string): Promise<Town | null> {
    return await prisma.town.findUnique({
      where: { id },
      include: { 
        region: {
          include: {
            country: true
          }
        }
      }
    });
  }

  /**
   * Update user location
   */
  async updateUserLocation(
    userId: string, 
    countryId: string, 
    regionId: string, 
    townId: string
  ) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        countryId,
        regionId,
        townId,
        locationUpdatedAt: new Date()
      }
    });
  }

  /**
   * Get user's current location
   */
  async getUserLocation(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        country: true,
        region: true,
        town: true
      }
    });

    if (!user) {
      return null;
    }

    return {
      country: user.country,
      region: user.region,
      town: user.town,
      locationDetectedAt: user.locationDetectedAt,
      locationUpdatedAt: user.locationUpdatedAt
    };
  }
}

export const locationService = new LocationService(); 