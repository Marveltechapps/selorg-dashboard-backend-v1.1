const express = require('express');
const router = express.Router();

// Import all warehouse routes
const authRoutes = require('./authRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const inboundRoutes = require('./inboundRoutes');
const outboundRoutes = require('./outboundRoutes');
// const inventoryRoutes = require('./inventoryRoutes'); // Commented out - controller missing
const transfersRoutes = require('./transfersRoutes');
const qcRoutes = require('./qcRoutes');
const workforceRoutes = require('./workforceRoutes');
const equipmentRoutes = require('./equipmentRoutes');
const exceptionsRoutes = require('./exceptionsRoutes');
const warehouseReportsRoutes = require('./warehouseReportsRoutes');
const utilitiesRoutes = require('./utilitiesRoutes');
const orderRoutes = require('./orderRoutes');
const staffRoutes = require('./staffRoutes');
const { dashboardHealth } = require('../../core/controllers/dashboardHealth.controller');

// Health check (no auth required)
router.get('/health', dashboardHealth('warehouse'));

// Mount all routes
router.use('/auth', authRoutes);
router.use('/', warehouseRoutes);
router.use('/inbound', inboundRoutes);
router.use('/outbound', outboundRoutes);
// router.use('/inventory', inventoryRoutes); // Commented out - controller missing
router.use('/transfers', transfersRoutes);
router.use('/qc', qcRoutes);
router.use('/workforce', workforceRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/exceptions', exceptionsRoutes);
router.use('/reports', warehouseReportsRoutes);
router.use('/utilities', utilitiesRoutes);
router.use('/orders', orderRoutes);
router.use('/staff', staffRoutes);

module.exports = router;
