const express = require('express');
const router = express.Router();
const auditLogsController = require('../controllers/auditLogsController');
const { authenticateToken } = require('../../core/middleware');

router.get('/logs', authenticateToken, auditLogsController.listLogs);
router.get('/logs/stats', authenticateToken, auditLogsController.getStats);
router.get('/logs/:id', authenticateToken, auditLogsController.getLog);

module.exports = router;
