import axios from 'axios';
import { Request } from 'express';

export interface LocationData {
  country: string;
  region: string;
  city: string;
  countryCode: string;
  regionCode: string;
}

export interface GeolocationResult {
  success: boolean;
  data?: LocationData;
  error?: string;
}

class GeolocationService {
  private async getLocationFromIP(ip: string): Promise<GeolocationResult> {
    try {
      // Using ipapi.co for IP geolocation (free tier available)
      const response = await axios.get(`https://ipapi.co/${ip}/json/`);
      
      if (response.data && response.data.country_code) {
        return {
          success: true,
          data: {
            country: response.data.country_name || 'Unknown',
            region: response.data.region || 'Unknown',
            city: response.data.city || 'Unknown',
            countryCode: response.data.country_code,
            regionCode: response.data.region_code || '00'
          }
        };
      }
      
      return {
        success: false,
        error: 'Unable to determine location from IP'
      };
    } catch (error) {
      console.error('IP geolocation error:', error);
      return {
        success: false,
        error: 'IP geolocation service unavailable'
      };
    }
  }

  private getDefaultLocation(): LocationData {
    // Default to USA if geolocation fails
    return {
      country: 'United States',
      region: 'New York',
      city: 'New York',
      countryCode: '1',
      regionCode: '06'
    };
  }

  async detectUserLocation(clientIP?: string): Promise<LocationData> {
    // Try IP geolocation first
    if (clientIP) {
      const ipResult = await this.getLocationFromIP(clientIP);
      if (ipResult.success && ipResult.data) {
        return ipResult.data;
      }
    }

    // Fallback to default location
    return this.getDefaultLocation();
  }

  // Helper method to get client IP from Express request
  getClientIP(req: Request): string | undefined {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0].trim();
    }
    
    // Fallback to connection properties with proper typing
    const connection = req.connection as { remoteAddress?: string; socket?: { remoteAddress?: string } };
    const socket = req.socket as { remoteAddress?: string };
    
    return connection?.remoteAddress || 
           socket?.remoteAddress ||
           connection?.socket?.remoteAddress;
  }
}

export const geolocationService = new GeolocationService(); 