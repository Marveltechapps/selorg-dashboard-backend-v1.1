const express = require('express');
const router = express.Router();
const approvalsController = require('../controllers/approvalsController');

// Approvals endpoints
router.get('/summary', approvalsController.getApprovalSummary);
router.get('/queue', approvalsController.listApprovals);
router.post('/queue', approvalsController.createApprovalRequest);
router.get('/queue/:id', approvalsController.getApprovalById);
router.post('/queue/:id/approve', approvalsController.approveRequest);
router.post('/queue/:id/reject', approvalsController.rejectRequest);
router.post('/batch-approve', approvalsController.batchApprove);

module.exports = router;

