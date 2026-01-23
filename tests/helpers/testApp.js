/**
 * Test app helper
 * Creates a clean Express app instance for testing without starting the server
 */

const express = require('express');
const mongoose = require('mongoose');

// Clear Mongoose models to prevent "Cannot overwrite model" errors
// This must be done before requiring any models
mongoose.models = {};
mongoose.modelSchemas = {};

const { requestIdMiddleware, errorHandler } = require('../../src/core/middleware');
const { requestLoggerMiddleware } = require('../../src/core/middleware/requestLogger.middleware');

// Import routes
const productionRoutes = require('../../src/production/routes');
const merchRoutes = require('../../src/merch/routes');
const vendorRoutes = require('../../src/vendor/routes');
const adminRoutes = require('../../src/admin/routes');
const darkstoreRoutes = require('../../src/darkstore/routes');
const financeRoutes = require('../../src/finance/routes');
const warehouseRoutes = require('../../src/warehouse/routes');
const riderRoutes = require('../../src/rider/routes');
const sharedRoutes = require('../../src/shared/routes');

// Health check controllers
const { healthCheck, readinessCheck, databaseHealthCheck } = require('../../src/core/controllers/health.controller');

function createTestApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  // Health check endpoints
  app.get('/health', healthCheck);
  app.get('/health/ready', readinessCheck);
  app.get('/health/db', databaseHealthCheck);

  // Routes
  app.use('/api/v1/darkstore', darkstoreRoutes);
  app.use('/api/v1/production', productionRoutes);
  app.use('/api/v1/merch', merchRoutes);
  app.use('/api/v1/rider', riderRoutes);
  app.use('/api/v1/finance', financeRoutes);
  app.use('/api/v1/vendor', vendorRoutes);
  app.use('/api/v1/warehouse', warehouseRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/shared', sharedRoutes);

  // Error handler
  app.use(errorHandler);

  return app;
}

module.exports = createTestApp;
