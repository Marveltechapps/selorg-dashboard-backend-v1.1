
const express = require('express');
const router = express.Router();
const utilitiesController = require('../controllers/utilitiesController');

router.post('/upload-skus', utilitiesController.uploadSKUs);
router.get('/logs', utilitiesController.getLogs);
router.post('/generate-labels', utilitiesController.generateLabels);
router.post('/bin-reassignment', utilitiesController.reassignBins);
router.post('/print-barcodes', utilitiesController.printBarcodes);

module.exports = router;
