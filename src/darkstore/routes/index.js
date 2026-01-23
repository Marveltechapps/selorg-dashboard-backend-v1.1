const express = require('express');
const router = express.Router();

// Import all darkstore routes
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const orderRoutes = require('./orderRoutes');
const picklistRoutes = require('./picklistRoutes');
const pickerRoutes = require('./pickerRoutes');
const packingRoutes = require('./packingRoutes');
const inboundRoutes = require('./inboundRoutes');
const outboundRoutes = require('./outboundRoutes');
const qcRoutes = require('./qcRoutes');
const healthRoutes = require('./healthRoutes');
const staffRoutes = require('./staffRoutes');
const alertRoutes = require('./alertRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const hsdRoutes = require('./hsdRoutes');
const utilitiesRoutes = require('./utilitiesRoutes');
const settingsRoutes = require('./settingsRoutes');

// Mount all routes under /darkstore prefix
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/picklists', picklistRoutes);
router.use('/pickers', pickerRoutes);
router.use('/packing', packingRoutes);
router.use('/inbound', inboundRoutes);
router.use('/outbound', outboundRoutes);
router.use('/qc', qcRoutes);
router.use('/health', healthRoutes);
router.use('/staff', staffRoutes);
router.use('/alerts', alertRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/hsd', hsdRoutes);
router.use('/utilities', utilitiesRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
