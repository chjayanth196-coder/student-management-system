import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

/**
 * Redis Service for caching, rate limiting, and session management.
 * Gracefully falls back to in-memory cache if Redis is unavailable.
 */

interface CacheEntry<T> {
  value: T;
  expiry: number | null;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: any = null;
  private fallbackCache: Map<string, CacheEntry<any>> = new Map();
  private useFallback = true;
  private readonly defaultTtl = 300; // 5 minutes

  constructor(redisUrl: string) {
    if (redisUrl && !redisUrl.includes('null')) {
      this.initialize(redisUrl);
    } else {
      this.logger.warn('Redis not configured. Using in-memory fallback cache.');
    }
  }

  private async initialize(redisUrl: string) {
    try {
      // Dynamic import to avoid crash if ioredis is not installed
      const { Redis } = await import('ioredis');
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed after 3 retries. Using fallback cache.');
            this.client = null;
            this.useFallback = true;
            return null;
          }
          return Math.min(times * 200, 2000);
        },
      });

      await this.client.connect();
      this.useFallback = false;
      this.logger.log('Redis connected successfully');
    } catch (error) {
      this.logger.warn('Failed to connect to Redis. Using in-memory fallback cache.');
      this.client = null;
      this.useFallback = true;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useFallback || !this.client) {
      const entry = this.fallbackCache.get(key);
      if (!entry) return null;
      if (entry.expiry && Date.now() > entry.expiry) {
        this.fallbackCache.delete(key);
        return null;
      }
      return entry.value;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      this.logger.debug(`Redis get failed for key "${key}": ${err}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const expiryMs = ttl || this.defaultTtl;

    if (this.useFallback || !this.client) {
      this.fallbackCache.set(key, {
        value,
        expiry: Date.now() + expiryMs * 1000,
      });
      return;
    }

    try {
      await this.client.set(key, JSON.stringify(value), 'EX', expiryMs);
    } catch (err) {
      this.logger.debug(`Redis set failed for key "${key}": ${err}`);
    }
  }

  async del(key: string): Promise<void> {
    if (this.useFallback || !this.client) {
      this.fallbackCache.delete(key);
      return;
    }

    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.debug(`Redis del failed for key "${key}": ${err}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (this.useFallback || !this.client) {
      for (const key of this.fallbackCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          this.fallbackCache.delete(key);
        }
      }
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err) {
      this.logger.debug(`Redis delPattern failed for pattern "${pattern}": ${err}`);
    }
  }

  async flushAll(): Promise<void> {
    if (this.useFallback || !this.client) {
      this.fallbackCache.clear();
      return;
    }

    try {
      await this.client.flushall();
    } catch (err) {
      this.logger.debug(`Redis flushAll failed: ${err}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (err) {
        this.logger.debug(`Redis quit failed: ${err}`);
      }
    }
  }
}
