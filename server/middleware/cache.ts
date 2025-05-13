import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Initialize Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Cache middleware
export const cache = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Generate cache key
      const key = `cache:${req.originalUrl}`;

      // Try to get cached data
      const cachedData = await redis.get(key);
      if (cachedData) {
        logger.info(`Cache hit for ${key}`);
        return res.json(JSON.parse(cachedData));
      }

      // If no cache, proceed and cache the response
      const originalJson = res.json;
      res.json = function (body) {
        // Cache the response
        redis.setex(key, duration, JSON.stringify(body));
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Clear cache for a specific key
export const clearCache = async (key: string) => {
  try {
    await redis.del(key);
    logger.info(`Cache cleared for ${key}`);
  } catch (error) {
    logger.error('Error clearing cache:', error);
  }
};

// Clear all cache
export const clearAllCache = async () => {
  try {
    const keys = await redis.keys('cache:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info('All cache cleared');
    }
  } catch (error) {
    logger.error('Error clearing all cache:', error);
  }
};

export default redis; 