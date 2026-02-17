module.exports = {
  port: parseInt(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  slaThresholdSeconds: parseInt(process.env.DEFAULT_SLA_THRESHOLD_SECONDS) || 1200,
  cache: {
    dashboard: parseInt(process.env.CACHE_TTL_DASHBOARD) || 15,
    riders: parseInt(process.env.CACHE_TTL_RIDERS) || 15,
    location: parseInt(process.env.CACHE_TTL_LOCATION) || 5,
    alerts: parseInt(process.env.CACHE_TTL_ALERTS) || 30,
    systemHealth: parseInt(process.env.CACHE_TTL_SYSTEM_HEALTH) || 60,
    analytics: parseInt(process.env.CACHE_TTL_ANALYTICS) || 120,
    approvals: parseInt(process.env.CACHE_TTL_APPROVALS) || 30,
    staff: parseInt(process.env.CACHE_TTL_STAFF) || 30,
    default: parseInt(process.env.REDIS_TTL_DEFAULT) || 60,
  },
  disableCache: process.env.DISABLE_CACHE === 'true',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased for development/testing
  },
};

