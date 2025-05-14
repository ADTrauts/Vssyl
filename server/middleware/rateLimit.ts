import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Initialize Redis client
const redis = new Redis(env.REDIS_URL || 'redis://localhost:6379');

// Rate limit configurations for different endpoints
const rateLimitConfigs = {
  default: {
    windowMs: Number(env.RATE_LIMIT_WINDOW_MS),
    max: Number(env.RATE_LIMIT_MAX),
  },
  visualization: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
  },
  recommendation: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50,
  },
  notification: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
  presence: {
    windowMs: 60 * 1000, // 1 minute
    max: 60,
  },
  search: {
    windowMs: 10 * 1000, // 10 seconds
    max: 30,
  },
  analytics: {
    windowMs: 60 * 1000, // 1 minute
    max: 20,
  },
};

// Rate limit key generator
const getRateLimitKey = (req: Request, type: string): string => {
  const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  return `ratelimit:${type}:${identifier}`;
};

// Create rate limiter with specific configuration
const createRateLimiter = (type: keyof typeof rateLimitConfigs) => {
  const config = rateLimitConfigs[type];

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = getRateLimitKey(req, type);
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get current count and window start from Redis
      const multi = redis.multi();
      multi.get(key);
      multi.get(`${key}:windowStart`);
      const results = await multi.exec();

      if (!results) {
        throw new Error('Redis multi exec failed');
      }

      const currentCount = parseInt(results[0][1] as string) || 0;
      const currentWindowStart = parseInt(results[1][1] as string) || now;

      // Reset if window has passed
      if (currentWindowStart < windowStart) {
        const resetMulti = redis.multi();
        resetMulti.set(key, '1');
        resetMulti.set(`${key}:windowStart`, now.toString());
        resetMulti.expire(key, Math.ceil(config.windowMs / 1000));
        resetMulti.expire(`${key}:windowStart`, Math.ceil(config.windowMs / 1000));
        await resetMulti.exec();

        return next();
      }

      // Check if rate limit exceeded
      if (currentCount >= config.max) {
        const retryAfter = Math.ceil(
          (currentWindowStart + config.windowMs - now) / 1000
        );

        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          status: 'error',
          message: `Too many ${type} requests, please try again later`,
          retryAfter,
        });
      }

      // Increment counter
      await redis.incr(key);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', config.max - currentCount - 1);
      res.setHeader(
        'X-RateLimit-Reset',
        Math.ceil((currentWindowStart + config.windowMs) / 1000)
      );

      next();
    } catch (error) {
      logger.error(`${type} rate limit error:`, error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
};

// Create specific rate limiters
export const rateLimit = createRateLimiter('default');
export const visualizationLimiter = createRateLimiter('visualization');
export const exportLimiter = createRateLimiter('export');
export const recommendationLimiter = createRateLimiter('recommendation');
export const notificationLimiter = createRateLimiter('notification');
export const presenceLimiter = createRateLimiter('presence');
export const searchLimiter = createRateLimiter('search');
export const analyticsLimiter = createRateLimiter('analytics');

// Cleanup function for Redis connection
export const cleanupRateLimit = async () => {
  try {
    await redis.quit();
  } catch (error) {
    logger.error('Redis cleanup error:', error);
  }
};

// Handle Redis connection errors
redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

// Error handler for rate limit exceeded
export const rateLimitErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof Error && err.message.includes('Too many requests')) {
    logger.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
    return res.status(429).json({
      status: 'error',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  }
  next(err);
}; 