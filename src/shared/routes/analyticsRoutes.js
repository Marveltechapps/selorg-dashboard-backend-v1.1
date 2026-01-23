const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Analytics endpoints
router.get('/rider-performance', analyticsController.getRiderPerformance);
router.get('/sla-adherence', analyticsController.getSlaAdherence);
router.get('/fleet-utilization', analyticsController.getFleetUtilization);
router.post('/reports/export', analyticsController.exportReport);

module.exports = router;

