const express = require('express');
const riderRoutes = require('./riderRoutes');
const fleetRoutes = require('./fleetRoutes');
const dispatchRoutes = require('./dispatchRoutes');
const hrRoutes = require('./hrRoutes');
const orderRoutes = require('./orderRoutes');

const router = express.Router();

// Orders (list + assign for rider overview / live order board)
// MUST be registered BEFORE riderRoutes to avoid /:riderId catching /orders
router.use('/orders', orderRoutes);

// Rider routes (list, create, get, update, location, distribution)
router.use('/', riderRoutes);

// Dispatch routes (unassigned orders, assign, map)
router.use('/dispatch', dispatchRoutes);

// HR routes (dashboard, documents, riders, training, contracts)
router.use('/hr', hrRoutes);

// Fleet routes
router.use('/fleet', fleetRoutes);

module.exports = router;
