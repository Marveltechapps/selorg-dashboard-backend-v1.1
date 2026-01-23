/**
 * Simple logger utility
 * Provides console-based logging for development
 */

const logger = {
  error: (message, meta = {}) => {
    logger.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta);
  },
  
  info: (message, meta = {}) => {
    logger.info(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  },
  
  warn: (message, meta = {}) => {
    logger.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  },
  
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  },
};

module.exports = logger;
