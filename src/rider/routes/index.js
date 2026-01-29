const express = require('express');
const riderRoutes = require('./riderRoutes');
const fleetRoutes = require('./fleetRoutes');

const router = express.Router();

// Rider routes
router.use('/', riderRoutes);

// Fleet routes
router.use('/fleet', fleetRoutes);

module.exports = router;
