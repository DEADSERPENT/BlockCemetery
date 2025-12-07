/**
 * Caching Utility for Backend
 * Supports both in-memory caching and Redis (if available)
 */

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
    };
    this.defaultTTL = 300; // 5 minutes in seconds
    this.redisClient = null;

    // Try to initialize Redis
    this.initRedis();
  }

  /**
   * Initialize Redis client if available
   */
  async initRedis() {
    try {
      const redis = require('redis');
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redisClient = redis.createClient({ url: redisUrl });

      this.redisClient.on('error', (err) => {
        console.log('Redis Client Error:', err);
        this.redisClient = null;
      });

      await this.redisClient.connect();
      console.log('Redis cache initialized successfully');
    } catch (error) {
      console.log('Redis not available, using in-memory cache only');
      this.redisClient = null;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    // Try Redis first
    if (this.redisClient) {
      try {
        const value = await this.redisClient.get(key);
        if (value) {
          this.cacheStats.hits++;
          return JSON.parse(value);
        }
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }

    // Fallback to memory cache
    const cached = this.memoryCache.get(key);
    if (cached) {
      // Check if expired
      if (Date.now() < cached.expires) {
        this.cacheStats.hits++;
        return cached.value;
      } else {
        // Remove expired entry
        this.memoryCache.delete(key);
      }
    }

    this.cacheStats.misses++;
    return null;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = this.defaultTTL) {
    this.cacheStats.sets++;

    // Set in Redis
    if (this.redisClient) {
      try {
        await this.redisClient.setEx(
          key,
          ttl,
          JSON.stringify(value)
        );
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }

    // Set in memory cache
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000),
    });

    // Clean up memory cache if it gets too large
    if (this.memoryCache.size > 1000) {
      this.cleanupMemoryCache();
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  async delete(key) {
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }

    this.memoryCache.delete(key);
  }

  /**
   * Clear all cache
   */
  async clear() {
    if (this.redisClient) {
      try {
        await this.redisClient.flushAll();
      } catch (error) {
        console.error('Redis clear error:', error);
      }
    }

    this.memoryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.cacheStats,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
      memoryCacheSize: this.memoryCache.size,
      redisAvailable: this.redisClient !== null,
    };
  }

  /**
   * Clean up expired entries from memory cache
   */
  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (now >= cached.expires) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Singleton instance
const cacheManager = new CacheManager();

/**
 * Express middleware for caching responses
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Middleware function
 */
function cacheMiddleware(ttl = 300) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `http_${req.originalUrl}`;

    try {
      // Try to get cached response
      const cachedResponse = await cacheManager.get(cacheKey);

      if (cachedResponse) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedResponse);
      }

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache response
      res.json = (body) => {
        res.set('X-Cache', 'MISS');

        // Cache the response
        cacheManager.set(cacheKey, body, ttl).catch(err => {
          console.error('Cache set error:', err);
        });

        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

module.exports = {
  cacheManager,
  cacheMiddleware,
};
