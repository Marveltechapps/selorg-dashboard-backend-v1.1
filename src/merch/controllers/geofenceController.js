<<<<<<< HEAD
const Zone = require('../models/Zone');
const Store = require('../models/Store');
const ErrorResponse = require('../../core/utils/ErrorResponse');

// @desc    Get all zones
// @route   GET /api/v1/geofence/zones
// @access  Public
const getZones = async (req, res, next) => {
  try {
    const zones = await Zone.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: zones.length,
      data: zones
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new zone
// @route   POST /api/v1/geofence/zones
// @access  Private
const createZone = async (req, res, next) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json({
      success: true,
      data: zone
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update zone
// @route   PUT /api/v1/geofence/zones/:id
// @access  Private
const updateZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!zone) {
      return next(new ErrorResponse(`Zone not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: zone
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete zone
// @route   DELETE /api/v1/geofence/zones/:id
// @access  Private
const deleteZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);

    if (!zone) {
      return next(new ErrorResponse(`Zone not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all stores
// @route   GET /api/v1/geofence/stores
// @access  Public
const getStores = async (req, res, next) => {
  try {
    const stores = await Store.find();
    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Seed Geofence Data
// @route   POST /api/v1/geofence/seed
// @access  Private
const seedGeofenceData = async (req, res, next) => {
  try {
    const mockZones = [
        {
          name: 'Downtown Core',
          type: 'Serviceable',
          status: 'Active',
          isVisible: true,
          color: '#10B981',
          areaSqKm: 12.4,
          promoCount: 8,
          points: [
            { x: 30, y: 30 },
            { x: 50, y: 25 },
            { x: 55, y: 45 },
            { x: 35, y: 50 }
          ]
        },
        {
          name: 'West End Hub',
          type: 'Priority',
          status: 'Active',
          isVisible: true,
          color: '#3B82F6',
          areaSqKm: 8.2,
          promoCount: 5,
          points: [
            { x: 10, y: 40 },
            { x: 25, y: 35 },
            { x: 30, y: 60 },
            { x: 15, y: 65 }
          ]
        },
        {
          name: 'Exclusion Zone A',
          type: 'Exclusion',
          status: 'Active',
          isVisible: true,
          color: '#EF4444',
          areaSqKm: 4.1,
          promoCount: 0,
          points: [
            { x: 60, y: 60 },
            { x: 80, y: 55 },
            { x: 85, y: 75 },
            { x: 65, y: 80 }
          ]
        }
    ];

    const mockStores = [
        {
            name: 'Main St. Express',
            address: '123 Main St, Downtown',
            x: 42,
            y: 38,
            zones: ['Downtown Core'],
            serviceStatus: 'Full'
        },
        {
            name: 'Westside Market',
            address: '456 West Blvd, West End',
            x: 18,
            y: 52,
            zones: ['West End Hub'],
            serviceStatus: 'Full'
        },
        {
            name: 'North Hills Outpost',
            address: '789 North Rd, North Hills',
            x: 72,
            y: 22,
            zones: [],
            serviceStatus: 'Partial'
        }
    ];

    await Zone.deleteMany({});
    await Zone.insertMany(mockZones);

    await Store.deleteMany({});
    await Store.insertMany(mockStores);

    res.status(201).json({
      success: true,
      message: 'Geofence data seeded successfully'
    });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getZones,
  createZone,
  updateZone,
  deleteZone,
  getStores,
  seedGeofenceData
};
=======
const Zone = require('../models/Zone');
const Store = require('../models/Store');
const ErrorResponse = require('../../core/utils/ErrorResponse');

// @desc    Get all zones
// @route   GET /api/v1/geofence/zones
// @access  Public
const getZones = async (req, res, next) => {
  try {
    const zones = await Zone.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: zones.length,
      data: zones
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new zone
// @route   POST /api/v1/geofence/zones
// @access  Private
const createZone = async (req, res, next) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json({
      success: true,
      data: zone
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update zone
// @route   PUT /api/v1/geofence/zones/:id
// @access  Private
const updateZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!zone) {
      return next(new ErrorResponse(`Zone not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: zone
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete zone
// @route   DELETE /api/v1/geofence/zones/:id
// @access  Private
const deleteZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);

    if (!zone) {
      return next(new ErrorResponse(`Zone not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all stores
// @route   GET /api/v1/geofence/stores
// @access  Public
const getStores = async (req, res, next) => {
  try {
    const stores = await Store.find();
    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Seed Geofence Data
// @route   POST /api/v1/geofence/seed
// @access  Private
const seedGeofenceData = async (req, res, next) => {
  try {
    const mockZones = [
        {
          name: 'Downtown Core',
          type: 'Serviceable',
          status: 'Active',
          isVisible: true,
          color: '#10B981',
          areaSqKm: 12.4,
          promoCount: 8,
          points: [
            { x: 30, y: 30 },
            { x: 50, y: 25 },
            { x: 55, y: 45 },
            { x: 35, y: 50 }
          ]
        },
        {
          name: 'West End Hub',
          type: 'Priority',
          status: 'Active',
          isVisible: true,
          color: '#3B82F6',
          areaSqKm: 8.2,
          promoCount: 5,
          points: [
            { x: 10, y: 40 },
            { x: 25, y: 35 },
            { x: 30, y: 60 },
            { x: 15, y: 65 }
          ]
        },
        {
          name: 'Exclusion Zone A',
          type: 'Exclusion',
          status: 'Active',
          isVisible: true,
          color: '#EF4444',
          areaSqKm: 4.1,
          promoCount: 0,
          points: [
            { x: 60, y: 60 },
            { x: 80, y: 55 },
            { x: 85, y: 75 },
            { x: 65, y: 80 }
          ]
        }
    ];

    const mockStores = [
        {
            name: 'Main St. Express',
            address: '123 Main St, Downtown',
            x: 42,
            y: 38,
            zones: ['Downtown Core'],
            serviceStatus: 'Full'
        },
        {
            name: 'Westside Market',
            address: '456 West Blvd, West End',
            x: 18,
            y: 52,
            zones: ['West End Hub'],
            serviceStatus: 'Full'
        },
        {
            name: 'North Hills Outpost',
            address: '789 North Rd, North Hills',
            x: 72,
            y: 22,
            zones: [],
            serviceStatus: 'Partial'
        }
    ];

    await Zone.deleteMany({});
    await Zone.insertMany(mockZones);

    await Store.deleteMany({});
    await Store.insertMany(mockStores);

    res.status(201).json({
      success: true,
      message: 'Geofence data seeded successfully'
    });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getZones,
  createZone,
  updateZone,
  deleteZone,
  getStores,
  seedGeofenceData
};
>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
