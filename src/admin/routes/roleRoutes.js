const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticateToken, requirePermission } = require('../../core/middleware/auth.middleware');
const asyncHandler = require('../../middleware/asyncHandler');

// All routes require authentication and manage_roles permission
router.use(authenticateToken);
router.use(requirePermission('manage_roles'));

router.get('/', asyncHandler(roleController.getRoles));
router.get('/:id', asyncHandler(roleController.getRoleById));
router.post('/', asyncHandler(roleController.createRole));
router.put('/:id', asyncHandler(roleController.updateRole));
router.delete('/:id', asyncHandler(roleController.deleteRole));

module.exports = router;
