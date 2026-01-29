<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const webhooksController = require('../controllers/webhooksController');

router.post('/vendor-signed', webhooksController.vendorSigned);
router.post('/carrier', webhooksController.carrierWebhook);

module.exports = router;

=======
const express = require('express');
const router = express.Router();
const webhooksController = require('../controllers/webhooksController');

router.post('/vendor-signed', webhooksController.vendorSigned);
router.post('/carrier', webhooksController.carrierWebhook);

module.exports = router;

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
