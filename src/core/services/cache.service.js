/**
 * Redis Cache Service
 * Provides centralized caching with connection management, retry logic, and invalidation patterns
 */

const { createClient } = require('redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnecting = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Initialize Redis connection with retry logic
   */
  async connect() {
    if (this.client?.isOpen) {
      return;
    }

    if (!process.env.REDIS_URL) {
      logger.warn('REDIS_URL not configured, cache disabled');
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 2000, // 2 second timeout
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              logger.error('Redis connection failed after max retries');
              return new Error('Max retries exceeded');
            }
            return Math.min(retries * this.retryDelay, 3000);
          },
        },
      });

      // Set up promise to wait for 'ready' event
      const readyPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis connection timeout after 3 seconds'));
        }, 3000);

        const readyHandler = () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.connectionRetries = 0;
          logger.info('Redis client connected and ready');
          this.client.off('error', errorHandler);
          resolve();
        };

        const errorHandler = (err) => {
          clearTimeout(timeout);
          logger.error('Redis Client Error', { error: err.message });
          this.client.off('ready', readyHandler);
          reject(err);
        };

        this.client.once('ready', readyHandler);
        this.client.once('error', errorHandler);
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', { error: err.message });
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('reconnecting', () => {
        this.connectionRetries++;
        logger.warn('Redis client reconnecting', { attempt: this.connectionRetries });
      });

      // Start connection
      await this.client.connect().catch(err => {
        // Connection failed immediately
        throw err;
      });
      // Wait for ready event or timeout
      await readyPromise;
    } catch (err) {
      this.isConnecting = false;
      logger.warn('Redis connection failed, continuing without cache', { error: err.message });
      this.client = null;
      // Clean up the client if connection failed
      if (this.client && !this.client.isOpen) {
        try {
          await this.client.quit().catch(() => {});
        } catch (e) {
          // Ignore cleanup errors
        }
        this.client = null;
      }
    }
  }

  /**
   * Get cached value
   */
  async get(key) {
    if (!this.client?.isOpen) {
      await this.connect();
    }

    if (!this.client?.isOpen) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key, value, ttlSeconds) {
    if (!this.client?.isOpen) {
      await this.connect();
    }

    if (!this.client?.isOpen) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async del(key) {
    if (!this.client?.isOpen) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern) {
    if (!this.client?.isOpen) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error: error.message });
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.client?.isOpen) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key) {
    if (!this.client?.isOpen) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error', { key, error: error.message });
      return -1;
    }
  }

  /**
   * Invalidate cache by namespace
   */
  async invalidateNamespace(namespace) {
    return this.delPattern(`${namespace}:*`);
  }

  /**
   * Delete multiple keys by pattern (alias for delPattern for backward compatibility)
   */
  async delByPattern(pattern) {
    return this.delPattern(pattern);
  }

  /**
   * Check if Redis is ready and connected
   */
  async isReady() {
    if (!this.client) {
      await this.connect();
    }
    return this.client?.isOpen === true;
  }

  /**
   * Get cache stats for admin/monitoring (keys count, memory).
   * Returns { connected, keysCount, memoryUsed } when Redis is available.
   */
  async getStats() {
    if (!this.client?.isOpen) {
      await this.connect();
    }
    if (!this.client?.isOpen) {
      return { connected: false, keysCount: 0, memoryUsed: null };
    }
    try {
      const [dbSize, memoryInfo] = await Promise.all([
        this.client.dbSize(),
        this.client.info('memory').catch(() => ''),
      ]);
      let memoryUsed = null;
      if (memoryInfo && typeof memoryInfo === 'string') {
        const m = memoryInfo.match(/used_memory_human:(\S+)/);
        if (m) memoryUsed = m[1];
      }
      return { connected: true, keysCount: dbSize ?? 0, memoryUsed };
    } catch (err) {
      logger.warn('Cache getStats error', { error: err.message });
      return { connected: this.client?.isOpen === true, keysCount: 0, memoryUsed: null };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.client?.isOpen) {
      await this.client.quit();
      this.client = null;
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

// Initialize connection on module load (non-blocking)
if (process.env.NODE_ENV !== 'test') {
  // Use setImmediate to avoid blocking server startup
  setImmediate(() => {
    cacheService.connect().catch(err => {
      logger.warn('Failed to initialize Redis cache', { error: err.message });
    });
  });
}

// CommonJS export for backward compatibility
module.exports = cacheService;