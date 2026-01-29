<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Analytics endpoints
router.get('/rider-performance', analyticsController.getRiderPerformance);
router.get('/sla-adherence', analyticsController.getSlaAdherence);
router.get('/fleet-utilization', analyticsController.getFleetUtilization);
router.post('/reports/export', analyticsController.exportReport);

module.exports = router;

=======
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Analytics endpoints
router.get('/rider-performance', analyticsController.getRiderPerformance);
router.get('/sla-adherence', analyticsController.getSlaAdherence);
router.get('/fleet-utilization', analyticsController.getFleetUtilization);
router.post('/reports/export', analyticsController.exportReport);

module.exports = router;

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
