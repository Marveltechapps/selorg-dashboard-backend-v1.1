
/**
 * Redis caching layer - Backward compatibility wrapper
 * This file provides backward compatibility for controllers using the old cache.js API
 * It re-exports the new cache service with the same interface
 * 
 * @deprecated Use cacheService from '../core/services/cache.service' directly
 */

const cacheService = require('../core/services/cache.service');

function safeDelByPattern(pattern) {
  try {
    if (typeof cacheService.delByPattern === 'function') {
      return Promise.resolve(cacheService.delByPattern(pattern)).catch(() => 0);
    }
  } catch (_) { /* ignore */ }
  return Promise.resolve(0);
}

// Re-export with backward-compatible API; never throw so controllers don't get 500 from cache
module.exports = {
  get: (key) => Promise.resolve(cacheService.get(key)).catch(() => null),
  set: (key, value, ttlSeconds) => Promise.resolve(cacheService.set(key, value, ttlSeconds)).catch(() => false),
  del: (key) => Promise.resolve(cacheService.del(key)).catch(() => false),
  delByPattern: safeDelByPattern,
  cacheMiddleware: require('../core/middleware/cache.middleware').cacheMiddleware,
  getRedisClient: () => null,
};
