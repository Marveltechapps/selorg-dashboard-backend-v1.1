/**
 * Redis mocking utilities for tests
 * Provides in-memory Redis mock for testing
 */

/**
 * Create a mock Redis client for testing
 */
const createMockRedis = () => {
  const data = new Map();

  // Cleanup expired keys periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of data.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        data.delete(key);
      }
    }
  }, 1000);

  // Stop cleanup on process exit
  process.on('exit', () => clearInterval(cleanupInterval));

  return {
    data,
    async get(key) {
      const entry = data.get(key);
      if (!entry) return null;
      
      // Check if expired
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        data.delete(key);
        return null;
      }
      
      return entry.value;
    },
    
    async set(key, value, options) {
      const entry = { value };
      
      if (options?.EX) {
        entry.ttl = options.EX;
        entry.expiresAt = Date.now() + (options.EX * 1000);
      }
      
      data.set(key, entry);
      return 'OK';
    },
    
    async del(key) {
      const existed = data.has(key);
      data.delete(key);
      return existed ? 1 : 0;
    },
    
    async exists(key) {
      const entry = data.get(key);
      if (!entry) return 0;
      
      // Check if expired
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        data.delete(key);
        return 0;
      }
      
      return 1;
    },
    
    async ttl(key) {
      const entry = data.get(key);
      if (!entry || !entry.expiresAt) return -1;
      
      const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2; // -2 means key doesn't exist
    },
    
    async flushAll() {
      data.clear();
      return 'OK';
    },
    
    async keys(pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      const matchingKeys = [];
      
      for (const key of data.keys()) {
        if (regex.test(key)) {
          const entry = data.get(key);
          // Check if expired
          if (entry && (!entry.expiresAt || entry.expiresAt >= Date.now())) {
            matchingKeys.push(key);
          }
        }
      }
      
      return matchingKeys;
    },
  };
};

/**
 * Mock Redis client instance for tests
 */
const mockRedis = createMockRedis();

// CommonJS export for backward compatibility
module.exports = { createMockRedis, mockRedis };