import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

interface CacheConfig {
  ttl: number;
  prefix: string;
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 3600, // 1 hour
  prefix: 'analytics:'
};

export class AnalyticsCacheService {
  private static instance: AnalyticsCacheService;
  private redis: Redis;
  private config: CacheConfig;

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
  }

  public static getInstance(config?: Partial<CacheConfig>): AnalyticsCacheService {
    if (!AnalyticsCacheService.instance) {
      AnalyticsCacheService.instance = new AnalyticsCacheService(config);
    }
    return AnalyticsCacheService.instance;
  }

  private getKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting from cache:', error);
      return null;
    }
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(
        this.getKey(key),
        ttl || this.config.ttl,
        serializedValue
      );
    } catch (error) {
      logger.error('Error setting cache:', error);
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      logger.error('Error deleting from cache:', error);
    }
  }

  public async clear(pattern: string = '*'): Promise<void> {
    try {
      const keys = await this.redis.keys(this.getKey(pattern));
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      return (await this.redis.exists(this.getKey(key))) === 1;
    } catch (error) {
      logger.error('Error checking cache existence:', error);
      return false;
    }
  }

  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }
} 