<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');

// Alerts endpoints
router.get('/', alertsController.listAlerts);
router.get('/:id', alertsController.getAlertById);
router.post('/:id/action', alertsController.performAlertAction);
router.delete('/', alertsController.clearResolvedAlerts);

module.exports = router;

=======
const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');

// Alerts endpoints
router.get('/', alertsController.listAlerts);
router.get('/:id', alertsController.getAlertById);
router.post('/:id/action', alertsController.performAlertAction);
router.delete('/', alertsController.clearResolvedAlerts);

module.exports = router;

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
