const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /dashboard/summary - Get dashboard summary (cached; per-store key in controller)
router.get('/summary', dashboardController.getDashboardSummary);

module.exports = router;

