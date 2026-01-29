const express = require('express');
const router = express.Router();
const riderController = require('../controllers/riderController');
const appConfig = require('../../config/app');
const {
  validateRiderId,
  validateCreateRider,
  validateUpdateRider,
} = require('../../middleware/validator');

// Conditional rider ID validation middleware
// Skip validation in development mode, enforce in production
const conditionalValidateRiderId = appConfig.nodeEnv === 'development'
  ? (req, res, next) => next() // Skip validation in development
  : validateRiderId; // Apply validation in production

// GET /riders - List all riders
router.get('/', riderController.listRiders);

// POST /riders - Create a new rider
router.post('/', validateCreateRider, riderController.createRider);

// GET /riders/distribution - Get rider distribution statistics
router.get('/distribution', riderController.getRiderDistribution);

// GET /riders/:riderId - Get rider by ID
router.get('/:riderId', conditionalValidateRiderId, riderController.getRiderById);

// PUT /riders/:riderId - Update rider
router.put('/:riderId', conditionalValidateRiderId, validateUpdateRider, riderController.updateRider);

// GET /riders/:riderId/location - Get rider location
router.get('/:riderId/location', conditionalValidateRiderId, riderController.getRiderLocation);

module.exports = router;

