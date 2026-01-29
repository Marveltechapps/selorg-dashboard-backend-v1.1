<<<<<<< HEAD
module.exports = {
  port: parseInt(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  slaThresholdSeconds: parseInt(process.env.DEFAULT_SLA_THRESHOLD_SECONDS) || 1200,
  cache: {
    dashboard: parseInt(process.env.CACHE_TTL_DASHBOARD) || 30,
    riders: parseInt(process.env.CACHE_TTL_RIDERS) || 15,
    location: parseInt(process.env.CACHE_TTL_LOCATION) || 5,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased for development/testing
  },
};

=======
module.exports = {
  port: parseInt(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  slaThresholdSeconds: parseInt(process.env.DEFAULT_SLA_THRESHOLD_SECONDS) || 1200,
  cache: {
    dashboard: parseInt(process.env.CACHE_TTL_DASHBOARD) || 30,
    riders: parseInt(process.env.CACHE_TTL_RIDERS) || 15,
    location: parseInt(process.env.CACHE_TTL_LOCATION) || 5,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased for development/testing
  },
};

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
