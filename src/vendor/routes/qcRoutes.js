<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const qcController = require('../controllers/qcController');

router.get('/', qcController.listQCChecks);
router.post('/', qcController.createQCCheck);
router.get('/overview', qcController.overview);
router.get('/:qcId', qcController.getQCCheck);
router.patch('/:qcId', qcController.patchQCCheck);

module.exports = router;

=======
const express = require('express');
const router = express.Router();
const qcController = require('../controllers/qcController');

router.get('/', qcController.listQCChecks);
router.post('/', qcController.createQCCheck);
router.get('/overview', qcController.overview);
router.get('/:qcId', qcController.getQCCheck);
router.patch('/:qcId', qcController.patchQCCheck);

module.exports = router;

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
