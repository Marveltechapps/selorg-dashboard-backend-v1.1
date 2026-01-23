const express = require('express');
const authRoutes = require('./authRoutes');
const roleRoutes = require('./roleRoutes');
const permissionRoutes = require('./permissionRoutes');
const userRoutes = require('./userRoutes');
const storeWarehouseRoutes = require('./storeWarehouseRoutes');
const auditLogsRoutes = require('./auditLogsRoutes');

const router = express.Router();

// Mount auth routes
router.use('/auth', authRoutes);

// RBAC Management Routes
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/users', userRoutes);

// Store & Warehouse Management
router.use('/', storeWarehouseRoutes);

// Audit Logs
router.use('/audit', auditLogsRoutes);

module.exports = router;
