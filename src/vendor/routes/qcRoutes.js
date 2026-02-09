
const express = require('express');
const router = express.Router();
const qcController = require('../controllers/qcController');
const { authenticateToken } = require('../../core/middleware/auth.middleware');

// GET routes don't require authentication (read-only)
router.get('/', qcController.listQCChecks);
router.get('/overview', qcController.overview);
router.get('/:qcId', qcController.getQCCheck);

// Write operations require authentication
router.post('/', authenticateToken, qcController.createQCCheck);
router.patch('/:qcId', authenticateToken, qcController.patchQCCheck);

module.exports = router;
