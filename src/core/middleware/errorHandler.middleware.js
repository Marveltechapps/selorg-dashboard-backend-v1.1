const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../utils/logger');

/**
 * Global error handler middleware
 * Handles all errors thrown in the application with consistent response format
 */
const errorHandler = (err, req, res, next) => {
  const isErrorResponse = typeof ErrorResponse === 'function' && err instanceof ErrorResponse;
  const statusCode = isErrorResponse ? err.statusCode : (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500);
  const message = err.message || 'Internal server error';

  // Log error with context
  logger.error('Error occurred', {
    error: message,
    stack: err.stack,
    requestId: req.id || req.headers['x-request-id'],
    path: req.path,
    method: req.method,
    statusCode,
    userId: req.user?.userId,
  });

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      code: isErrorResponse && err.code
        ? err.code
        : `HTTP_${statusCode}`,
      message,
    },
    meta: {
      requestId: req.id || req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1.0.0',
    },
  };

  // Add details if available
  if (isErrorResponse && err.details) {
    errorResponse.error.details = err.details;
  }

  // Add stack trace in development only
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * Eliminates need for try-catch blocks in every route handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// CommonJS export for backward compatibility
module.exports = {
  errorHandler,
  asyncHandler,
};