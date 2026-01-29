<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /dashboard/summary - Get dashboard summary
router.get('/summary', dashboardController.getDashboardSummary);

module.exports = router;

=======
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /dashboard/summary - Get dashboard summary
router.get('/summary', dashboardController.getDashboardSummary);

module.exports = router;

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
