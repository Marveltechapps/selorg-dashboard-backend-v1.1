const express = require('express');
const {
  getAllocations,
  updateAllocation,
  getAlerts,
  createAlert,
  updateAlertStatus,
  seedAllocationData
} = require('../controllers/allocationController');

const router = express.Router();

router.route('/')
  .get(getAllocations);

router.route('/:id')
  .put(updateAllocation);

router.route('/alerts')
  .get(getAlerts)
  .post(createAlert);

router.route('/alerts/:id')
  .put(updateAlertStatus);

router.route('/seed')
  .post(seedAllocationData);

module.exports = router;
