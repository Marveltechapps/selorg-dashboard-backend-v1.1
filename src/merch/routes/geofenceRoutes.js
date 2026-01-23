const express = require('express');
const {
  getZones,
  createZone,
  updateZone,
  deleteZone,
  getStores,
  seedGeofenceData
} = require('../controllers/geofenceController');

const router = express.Router();

router.route('/zones')
  .get(getZones)
  .post(createZone);

router.route('/zones/:id')
  .put(updateZone)
  .delete(deleteZone);

router.route('/stores')
  .get(getStores);

router.route('/seed')
  .post(seedGeofenceData);

module.exports = router;
