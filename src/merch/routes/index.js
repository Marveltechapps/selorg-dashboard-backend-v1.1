const express = require('express');
const authRoutes = require('./authRoutes');
const merchRoutes = require('./merchRoutes');
const catalogRoutes = require('./catalogRoutes');
const pricingRoutes = require('./pricingRoutes');
const allocationRoutes = require('./allocationRoutes');
const geofenceRoutes = require('./geofenceRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const alertRoutes = require('./alertRoutes');
const complianceRoutes = require('./complianceRoutes');

const router = express.Router();

// Mount all merch & promo dashboard routes
router.use('/auth', authRoutes);
router.use('/', merchRoutes);
router.use('/catalog', catalogRoutes);
router.use('/pricing', pricingRoutes);
router.use('/allocation', allocationRoutes);
router.use('/geofence', geofenceRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/alerts', alertRoutes);
router.use('/compliance', complianceRoutes);

module.exports = router;
