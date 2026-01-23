const express = require('express');
const router = express.Router();

// Import all vendor routes
const authRoutes = require('./authRoutes');
const vendorRoutes = require('./vendorRoutes');
const inboundRoutes = require('./inboundRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const purchaseOrderRoutes = require('./purchaseOrderRoutes');
const qcRoutes = require('./qcRoutes');
const certificatesRoutes = require('./certificatesRoutes');
const webhooksRoutes = require('./webhooksRoutes');
const reportsRoutes = require('./reportsRoutes');
const qcComplianceRoutes = require('./qcComplianceRoutes');

// Mount all routes
router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);
router.use('/inbound', inboundRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/qc', qcRoutes);
router.use('/', certificatesRoutes); // Certificates routes already have /vendors/:vendorId/certificates prefix
router.use('/webhooks', webhooksRoutes);
router.use('/reports', reportsRoutes);
router.use('/qc-compliance', qcComplianceRoutes);
router.use('/system-gateway', require('./systemGatewayRoutes'));

module.exports = router;
