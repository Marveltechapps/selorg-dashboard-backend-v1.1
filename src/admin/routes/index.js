const express = require('express');
const { authenticateToken, requireRole } = require('../../core/middleware');
const authRoutes = require('./authRoutes');
const roleRoutes = require('./roleRoutes');
const permissionRoutes = require('./permissionRoutes');
const userRoutes = require('./userRoutes');
const storeWarehouseRoutes = require('./storeWarehouseRoutes');
const auditLogsRoutes = require('./auditLogsRoutes');
const cacheRoutes = require('./cacheRoutes');

const router = express.Router();

// Auth (login only) - no JWT required
router.use('/auth', authRoutes);

// All other routes require JWT and role: admin, super_admin
const protectedRouter = express.Router();
protectedRouter.use(authenticateToken, requireRole('admin', 'super_admin'));
protectedRouter.use('/roles', roleRoutes);
protectedRouter.use('/permissions', permissionRoutes);
protectedRouter.use('/users', userRoutes);
protectedRouter.use('/', storeWarehouseRoutes);
protectedRouter.use('/audit', auditLogsRoutes);
protectedRouter.use('/cache', cacheRoutes);
router.use(protectedRouter);

module.exports = router;
