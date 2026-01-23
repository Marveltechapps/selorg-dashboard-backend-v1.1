const express = require('express');
const router = express.Router();

// Import all shared routes
const alertsRoutes = require('./alertsRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const approvalsRoutes = require('./approvalsRoutes');
const communicationRoutes = require('./communicationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const systemHealthRoutes = require('./systemHealthRoutes');
const searchRoutes = require('./searchRoutes');
const inventorySyncRoutes = require('./inventorySyncRoutes');
const bulkOperationsRoutes = require('./bulkOperationsRoutes');
const workflowAutomationRoutes = require('./workflowAutomationRoutes');

// Mount all routes
router.use('/alerts', alertsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/approvals', approvalsRoutes);
router.use('/communication', communicationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/system-health', systemHealthRoutes);
router.use('/search', searchRoutes);
router.use('/inventory-sync', inventorySyncRoutes);
router.use('/bulk', bulkOperationsRoutes);
router.use('/automation', workflowAutomationRoutes);

module.exports = router;
