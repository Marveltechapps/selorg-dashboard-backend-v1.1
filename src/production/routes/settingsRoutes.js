<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');

/**
 * GET /api/darkstore/settings
 * Get application settings
 */
router.get('/', getSettings);

/**
 * PUT /api/darkstore/settings
 * Update application settings
 */
router.put('/', updateSettings);

module.exports = router;

=======
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');

/**
 * GET /api/darkstore/settings
 * Get application settings
 */
router.get('/', getSettings);

/**
 * PUT /api/darkstore/settings
 * Update application settings
 */
router.put('/', updateSettings);

module.exports = router;

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
