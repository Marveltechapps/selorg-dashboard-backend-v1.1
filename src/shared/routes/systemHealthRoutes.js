<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const systemHealthController = require('../controllers/systemHealthController');

// System health endpoints
router.get('/summary', systemHealthController.getSystemHealthSummary);
router.get('/devices', systemHealthController.listDeviceHealth);
router.get('/devices/:id', systemHealthController.getDeviceHealthById);
router.post('/diagnostics/run', systemHealthController.runDiagnostics);
router.get('/diagnostics/reports/:reportId', systemHealthController.getDiagnosticsReport);

module.exports = router;

=======
const express = require('express');
const router = express.Router();
const systemHealthController = require('../controllers/systemHealthController');

// System health endpoints
router.get('/summary', systemHealthController.getSystemHealthSummary);
router.get('/devices', systemHealthController.listDeviceHealth);
router.get('/devices/:id', systemHealthController.getDeviceHealthById);
router.post('/diagnostics/run', systemHealthController.runDiagnostics);
router.get('/diagnostics/reports/:reportId', systemHealthController.getDiagnosticsReport);

module.exports = router;

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
