<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const utilitiesController = require('../controllers/utilitiesController');

router.post('/upload-skus', utilitiesController.uploadSKUs);
router.get('/logs', utilitiesController.getLogs);
router.post('/generate-labels', utilitiesController.generateLabels);
router.post('/bin-reassignment', utilitiesController.reassignBins);
router.post('/print-barcodes', utilitiesController.printBarcodes);

module.exports = router;

=======
const express = require('express');
const router = express.Router();
const utilitiesController = require('../controllers/utilitiesController');

router.post('/upload-skus', utilitiesController.uploadSKUs);
router.get('/logs', utilitiesController.getLogs);
router.post('/generate-labels', utilitiesController.generateLabels);
router.post('/bin-reassignment', utilitiesController.reassignBins);
router.post('/print-barcodes', utilitiesController.printBarcodes);

module.exports = router;

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
