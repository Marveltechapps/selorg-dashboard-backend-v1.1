const express = require('express');
const {
  getApprovals,
  updateApprovalStatus,
  getAudits,
  seedComplianceData
} = require('../controllers/complianceController');

const router = express.Router();

router.route('/approvals')
  .get(getApprovals);

router.route('/approvals/:id')
  .put(updateApprovalStatus);

router.route('/audits')
  .get(getAudits);

router.route('/seed')
  .post(seedComplianceData);

module.exports = router;
