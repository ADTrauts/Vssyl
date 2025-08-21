import { prisma } from '../lib/prisma';
import { LocationData } from './geolocationService';
import { AuditService } from './auditService';

export interface UserNumberData {
  userNumber: string;
  countryId: string;
  regionId: string;
  townId: string;
}

class UserNumberService {
  async generateUserNumber(locationData: LocationData): Promise<UserNumberData> {
    return prisma.$transaction(async (tx) => {
      // 1. Find or create Country
      let country = await tx.country.findUnique({ where: { phoneCode: locationData.countryCode } });
      if (!country) {
        country = await tx.country.create({
          data: {
            name: locationData.country,
            phoneCode: locationData.countryCode,
          },
        });
      }

      // 2. Find or create Region (3-digit code)
      let region = await tx.region.findUnique({
        where: { countryId_code: { countryId: country.id, code: locationData.regionCode } },
      });
      if (!region) {
        region = await tx.region.create({
          data: {
            name: locationData.region,
            code: locationData.regionCode.padStart(3, '0'), // Ensure 3 digits
            countryId: country.id,
          },
        });
      }

      // 3. Find or create Town (3-digit code)
      let town = await tx.town.findUnique({
        where: { regionId_code: { regionId: region.id, code: locationData.city } },
      });
      if (!town) {
        town = await tx.town.create({
          data: {
            name: locationData.city,
            code: this.generateTownCode(locationData.city).padStart(3, '0'), // Ensure 3 digits
            regionId: region.id,
          },
        });
      }

      // 4. Get and increment serial number atomically (7 digits)
      const userSerial = await tx.userSerial.upsert({
        where: { townId: town.id },
        update: { lastSerial: { increment: 1 } },
        create: { townId: town.id, lastSerial: 1 },
        select: { lastSerial: true },
      });

      // Format the serial number to 7 digits (e.g., 0000001)
      const serial = String(userSerial.lastSerial).padStart(7, '0');

      // 5. Construct the full user number: 3-3-3-7 format
      const countryCode = country.phoneCode.padStart(3, '0');
      const regionCode = region.code.padStart(3, '0');
      const townCode = town.code.padStart(3, '0');

      const fullUserNumber = `${countryCode}-${regionCode}-${townCode}-${serial}`;

      const result = {
        userNumber: fullUserNumber,
        countryId: country.id,
        regionId: region.id,
        townId: town.id,
      };

      // 6. Log the Block ID generation (after transaction completes)
      setTimeout(async () => {
        try {
          await AuditService.logBlockIdGeneration(
            'system', // Will be updated with actual user ID
            fullUserNumber,
            `${locationData.country}, ${locationData.region}, ${locationData.city}`
          );
        } catch (error) {
          console.error('Error logging Block ID generation:', error);
        }
      }, 0);

      return result;
    });
  }

  private generateTownCode(cityName: string): string {
    // Simple hash-based code generation for demonstration
    let hash = 0;
    for (let i = 0; i < cityName.length; i++) {
      const char = cityName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash % 1000).toString().padStart(3, '0');
  }
}

export const userNumberService = new UserNumberService(); 