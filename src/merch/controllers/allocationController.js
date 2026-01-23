const Allocation = require('../models/Allocation');
const ReplenishmentAlert = require('../models/ReplenishmentAlert');
const SKU = require('../models/SKU');
const ErrorResponse = require('../../core/utils/ErrorResponse');

// @desc    Get all allocations
// @route   GET /api/v1/allocation
// @access  Public
const getAllocations = async (req, res, next) => {
  try {
    const allocations = await Allocation.find().populate('skuId');
    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update allocation
// @route   PUT /api/v1/allocation/:id
// @access  Private
const updateAllocation = async (req, res, next) => {
  try {
    const allocation = await Allocation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!allocation) {
      return next(new ErrorResponse(`Allocation not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: allocation
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get replenishment alerts
// @route   GET /api/v1/allocation/alerts
// @access  Public
const getAlerts = async (req, res, next) => {
  try {
    const alerts = await ReplenishmentAlert.find({ status: 'active' }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create replenishment alert
// @route   POST /api/v1/allocation/alerts
// @access  Private
const createAlert = async (req, res, next) => {
  try {
    const alert = await ReplenishmentAlert.create(req.body);
    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update alert status
// @route   PUT /api/v1/allocation/alerts/:id
// @access  Private
const updateAlertStatus = async (req, res, next) => {
  try {
    const alert = await ReplenishmentAlert.findByIdAndUpdate(req.params.id, { status: req.body.status }, {
      new: true,
      runValidators: true
    });

    if (!alert) {
      return next(new ErrorResponse(`Alert not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Seed initial allocation data
// @route   POST /api/v1/allocation/seed
// @access  Private
const seedAllocationData = async (req, res, next) => {
  try {
    // This is a helper to quickly populate the DB with mock data for testing
    const skus = await SKU.find().limit(3);
    
    if (skus.length === 0) {
      return next(new ErrorResponse('Please seed SKUs first', 400));
    }

    const locations = [
      { id: 'l1', name: 'Downtown Hub' },
      { id: 'l2', name: 'Westside Hub' },
      { id: 'l3', name: 'North Hub' }
    ];

    const allocationData = [];
    for (const sku of skus) {
      for (const loc of locations) {
        allocationData.push({
          skuId: sku._id,
          locationId: loc.id,
          locationName: loc.name,
          allocated: Math.floor(Math.random() * 1000) + 500,
          target: 1500,
          onHand: Math.floor(Math.random() * 800) + 200,
          inTransit: Math.floor(Math.random() * 200),
          safetyStock: 400
        });
      }
    }

    await Allocation.deleteMany({});
    const allocations = await Allocation.insertMany(allocationData);

    // Also seed some alerts
    const alertData = [
      {
        type: 'low_stock',
        severity: 'critical',
        sku: skus[0].name,
        skuId: skus[0]._id,
        location: 'North Hub',
        message: 'Below safety stock (50 units). Projected stockout in 4 hours.',
        time: '4h'
      },
      {
        type: 'expiry',
        severity: 'warning',
        sku: skus[1].name,
        skuId: skus[1]._id,
        location: 'Westside Hub',
        batch: '9921',
        message: 'Batch #9921 expiring in 3 days. Consider running a clearance promo.',
        time: '3d'
      }
    ];

    await ReplenishmentAlert.deleteMany({});
    const alerts = await ReplenishmentAlert.insertMany(alertData);

    res.status(201).json({
      success: true,
      message: 'Allocation data seeded successfully',
      allocationsCount: allocations.length,
      alertsCount: alerts.length
    });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getAllocations,
  updateAllocation,
  getAlerts,
  createAlert,
  updateAlertStatus,
  seedAllocationData
};
