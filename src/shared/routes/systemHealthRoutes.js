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

