const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requirePermission } = require('../../core/middleware/auth.middleware');
const { cacheMiddleware } = require('../../core/middleware');
const asyncHandler = require('../../middleware/asyncHandler');
const appConfig = require('../../config/app');

// All routes require authentication and user management permissions
router.use(authenticateToken);

// Get users - requires view_users permission
router.get('/', requirePermission('view_users'), cacheMiddleware(appConfig.cache.admin.users), asyncHandler(userController.getUsers));
router.get('/:id', requirePermission('view_users'), cacheMiddleware(appConfig.cache.admin.users), asyncHandler(userController.getUserById));

// Create/update/delete users - requires manage_users permission
router.post('/', requirePermission('create_users'), asyncHandler(userController.createUser));
router.put('/:id', requirePermission('edit_users'), asyncHandler(userController.updateUser));
router.delete('/:id', requirePermission('delete_users'), asyncHandler(userController.deleteUser));

// Assign role - requires assign_roles permission
router.put('/:id/role', requirePermission('assign_roles'), asyncHandler(userController.assignRole));

module.exports = router;
