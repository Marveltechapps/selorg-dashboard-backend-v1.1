const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Logs all incoming requests with duration tracking
 */
const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Log request start
  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    userId: req.user?.userId,
  });

  // Override res.end to capture response
  const originalEnd = res.end.bind(res);
  res.end = function (chunk, encoding, cb) {
    const duration = Date.now() - startTime;

    // Log response
    logger.logRequest(req, res, duration);

    // Record metrics if enabled
    if (process.env.ENABLE_METRICS === 'true') {
      try {
        const metrics = require('../../utils/metrics');
        metrics.recordHttpRequest(req.method, req.path, res.statusCode, duration);
      } catch (err) {
        // Ignore metrics errors
      }
    }

    // Call original end with proper signature handling
    if (typeof chunk === 'function') {
      return originalEnd(chunk);
    } else if (typeof encoding === 'function') {
      return originalEnd(chunk, encoding);
    } else {
      return originalEnd(chunk, encoding, cb);
    }
  };

  next();
};

module.exports = { requestLoggerMiddleware };
