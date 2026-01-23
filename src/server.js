// Load env vars FIRST before any other requires
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const { createServer } = require('http');
const connectDB = require('./config/db');
const websocketService = require('./utils/websocket');
const { requestIdMiddleware, errorHandler, validateJWTSecret } = require('./core/middleware');
const { requestLoggerMiddleware } = require('./core/middleware/requestLogger.middleware');
const validateEnvironment = require('./config/validateEnv');
const logger = require('./core/utils/logger');

// Import dashboard routes
const productionRoutes = require('./production/routes');
const merchRoutes = require('./merch/routes');
const vendorRoutes = require('./vendor/routes');
const adminRoutes = require('./admin/routes');
const darkstoreRoutes = require('./darkstore/routes');
const financeRoutes = require('./finance/routes');
const warehouseRoutes = require('./warehouse/routes');
const riderRoutes = require('./rider/routes');
const sharedRoutes = require('./shared/routes');

// Validate critical environment variables on startup (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  try {
    validateEnvironment();
    validateJWTSecret();
  } catch (error) {
    logger.error('Startup validation failed', { error: error.message });
    process.exit(1);
  }

  // Connect to database
  connectDB();
}

const app = express();

// Request ID middleware (must be first to track all requests)
app.use(requestIdMiddleware);

// Request logging middleware (after request ID is set)
app.use(requestLoggerMiddleware);

// Health check endpoints (before auth middleware - no auth required)
const { healthCheck, readinessCheck, databaseHealthCheck } = require('./core/controllers/health.controller');
app.get('/health', healthCheck);
app.get('/health/ready', readinessCheck);
app.get('/health/db', databaseHealthCheck);

// Security middleware - Helmet (sets various HTTP headers)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for API
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Prevent NoSQL injection attacks
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Prevent XSS attacks
app.use(xss());

// Response compression
const compression = require('compression');
app.use(compression());

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration - restrict to allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173']; // Default for development

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        logger.warn('CORS blocked origin', { origin, allowedOrigins });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  })
);

// Mount dashboard routers under /api/v1/<dashboard-name>
app.use('/api/v1/darkstore', darkstoreRoutes);
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/merch', merchRoutes);
app.use('/api/v1/rider', riderRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/vendor', vendorRoutes);
app.use('/api/v1/warehouse', warehouseRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/shared', sharedRoutes);

// Legacy compatibility: Mount darkstore routes at /api/darkstore for frontend compatibility
app.use('/api/darkstore', darkstoreRoutes);

// API Documentation (Swagger)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Selorg API Documentation',
  }));
  logger.info('Swagger documentation available at /api-docs');
}

// Metrics endpoint (Prometheus)
if (process.env.ENABLE_METRICS === 'true') {
  const metrics = require('./utils/metrics');
  app.get('/metrics', async (req, res) => {
    try {
      const metricsData = await metrics.getMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metricsData);
    } catch (err) {
      res.status(500).send('# Metrics not available');
    }
  });
  logger.info('Prometheus metrics available at /metrics');
}

// Global error handler middleware (must be last)
app.use(errorHandler);

// Export app for testing (after all routes are configured)
module.exports = app;

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  websocketService.initialize(httpServer);
}

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info('Server started', {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development',
      version: process.env.API_VERSION || '1.0.0',
    });
    logger.info('WebSocket server initialized');
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error('Port already in use', {
        port: PORT,
        error: err.message,
        suggestion: `Port ${PORT} is already in use. Please either:
          1. Stop the process using port ${PORT}
          2. Set a different PORT in your .env file (e.g., PORT=5001)
          3. Kill the process: lsof -ti:${PORT} | xargs kill -9`,
      });
      process.exit(1);
    } else {
      logger.error('Server startup error', {
        error: err.message,
        stack: err.stack,
      });
      process.exit(1);
    }
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection', {
    error: err.message,
    stack: err.stack,
  });
  // In dev mode, we keep the server running to allow the user to fix issues
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  // Special handling for port conflicts
  if (err.code === 'EADDRINUSE') {
    logger.error('Port conflict detected', {
      error: err.message,
      port: PORT,
      suggestion: `Port ${PORT} is already in use. Please either:
        1. Stop the process using port ${PORT}: lsof -ti:${PORT} | xargs kill -9
        2. Set a different PORT in your .env file (e.g., PORT=5001)
        3. Wait for the port to become available`,
    });
  } else {
    logger.error('Uncaught Exception', {
      error: err.message,
      stack: err.stack,
    });
  }
  // Exit process for uncaught exceptions (server is in undefined state)
  process.exit(1);
});
