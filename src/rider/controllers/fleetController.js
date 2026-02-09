const Vehicle = require('../models/Vehicle');
const MaintenanceTask = require('../models/MaintenanceTask');
const asyncHandler = require('../../middleware/asyncHandler');
const ErrorResponse = require('../../core/utils/ErrorResponse');

// @desc    Get fleet summary
// @route   GET /api/v1/rider/fleet/summary
// @access  Private
const getFleetSummary = asyncHandler(async (req, res) => {
  const totalFleet = await Vehicle.countDocuments();
  const inMaintenance = await Vehicle.countDocuments({ status: 'maintenance' });
  const evCount = await Vehicle.countDocuments({ fuelType: 'EV' });
  const evUsagePercent = totalFleet > 0 ? Math.round((evCount / totalFleet) * 100) : 0;
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const scheduledServicesNextWeek = await MaintenanceTask.countDocuments({
    scheduledDate: { $gte: new Date(), $lte: nextWeek },
    status: { $ne: 'completed' }
  });

  res.status(200).json({
    success: true,
    data: {
      totalFleet,
      inMaintenance,
      evUsagePercent,
      scheduledServicesNextWeek
    }
  });
});

// @desc    List vehicles
// @route   GET /api/v1/rider/fleet/vehicles
// @access  Private
const listVehicles = asyncHandler(async (req, res) => {
  const { status, type, fuelType } = req.query;
  const query = {};
  
  if (status && status !== 'all') {
    query.status = status;
  }
  if (type && type !== 'all') {
    query.type = type;
  }
  if (fuelType && fuelType !== 'all') {
    query.fuelType = fuelType;
  }

  const vehicles = await Vehicle.find(query).lean().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: vehicles.length,
    data: vehicles
  });
});

// @desc    Get vehicle by ID
// @route   GET /api/v1/rider/fleet/vehicles/:id
// @access  Private
const getVehicleById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findOne({ id }).lean();

  if (!vehicle) {
    return next(new ErrorResponse(`Vehicle not found with id of ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: vehicle
  });
});

// @desc    Create vehicle
// @route   POST /api/v1/rider/fleet/vehicles
// @access  Private
const createVehicle = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.documents) {
    if (typeof body.documents.rcValidTill === 'string') body.documents.rcValidTill = new Date(body.documents.rcValidTill);
    if (typeof body.documents.insuranceValidTill === 'string') body.documents.insuranceValidTill = new Date(body.documents.insuranceValidTill);
  }
  if (typeof body.lastServiceDate === 'string') body.lastServiceDate = new Date(body.lastServiceDate);
  if (typeof body.nextServiceDueDate === 'string') body.nextServiceDueDate = new Date(body.nextServiceDueDate);
  const vehicle = await Vehicle.create(body);

  res.status(201).json({
    success: true,
    data: vehicle
  });
});

// @desc    Update vehicle
// @route   PUT /api/v1/rider/fleet/vehicles/:id
// @access  Private
const updateVehicle = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findOneAndUpdate(
    { id },
    req.body,
    { new: true, runValidators: true }
  ).lean();

  if (!vehicle) {
    return next(new ErrorResponse(`Vehicle not found with id of ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: vehicle
  });
});

// @desc    List maintenance tasks
// @route   GET /api/v1/rider/fleet/maintenance
// @access  Private
const listMaintenanceTasks = asyncHandler(async (req, res) => {
  const tasks = await MaintenanceTask.find({}).lean().sort({ scheduledDate: 1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Get maintenance task by ID
// @route   GET /api/v1/rider/fleet/maintenance/:id
// @access  Private
const getMaintenanceTaskById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const task = await MaintenanceTask.findOne({ id }).lean();

  if (!task) {
    return next(new ErrorResponse(`Maintenance task not found with id of ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Create maintenance task
// @route   POST /api/v1/rider/fleet/maintenance
// @access  Private
const createMaintenanceTask = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  
  // Validate required fields
  if (!body.vehicleId) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'vehicleId is required',
      code: 400
    });
  }
  if (!body.type) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'type is required',
      code: 400
    });
  }
  if (!body.scheduledDate) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'scheduledDate is required',
      code: 400
    });
  }

  // Generate ID if not provided
  if (!body.id) {
    const last = await MaintenanceTask.findOne().sort({ id: -1 }).select('id').lean();
    const num = last && last.id && /^MNT-(\d+)$/.test(last.id) ? parseInt(last.id.replace('MNT-', ''), 10) + 1 : 1;
    body.id = `MNT-${String(num).padStart(4, '0')}`;
  }
  
  // Parse scheduledDate
  if (body.scheduledDate && typeof body.scheduledDate === 'string') {
    body.scheduledDate = new Date(body.scheduledDate);
    if (isNaN(body.scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid scheduledDate format',
        code: 400
      });
    }
  }
  
  // Set default status if not provided
  if (!body.status) {
    body.status = 'upcoming';
  }

  // Ensure vehicleInternalId is provided (required by schema)
  if (!body.vehicleInternalId) {
    if (body.vehicleId) {
      // Try to find vehicle by vehicleId to get internal ID
      const vehicle = await Vehicle.findOne({ vehicleId: body.vehicleId }).select('id').lean();
      if (vehicle) {
        body.vehicleInternalId = vehicle.id;
      } else {
        // Fallback: use vehicleId as vehicleInternalId if vehicle not found
        body.vehicleInternalId = body.vehicleId;
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'vehicleInternalId is required',
        code: 400
      });
    }
  }

  // Use findOneAndUpdate with upsert to handle duplicates and validation issues
  let task;
  try {
    task = await MaintenanceTask.findOneAndUpdate(
      { id: body.id },
      { $set: body },
      { upsert: true, new: true, runValidators: false }
    );
  } catch (createError) {
    // If duplicate key error, try with next ID
    if (createError.code === 11000) {
      const last = await MaintenanceTask.findOne().sort({ id: -1 }).select('id').lean();
      const num = last && last.id && /^MNT-(\d+)$/.test(last.id) ? parseInt(last.id.replace('MNT-', ''), 10) + 1 : 1;
      body.id = `MNT-${String(num).padStart(4, '0')}`;
      task = await MaintenanceTask.findOneAndUpdate(
        { id: body.id },
        { $set: body },
        { upsert: true, new: true, runValidators: false }
      );
    } else {
      // Log the error for debugging
      console.error('Error creating maintenance task:', createError);
      throw createError;
    }
  }

  if (!task) {
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create maintenance task',
      code: 500
    });
  }

  res.status(201).json({
    success: true,
    data: task
  });
});

// @desc    Update maintenance task
// @route   PUT /api/v1/rider/fleet/maintenance/:id
// @access  Private
const updateMaintenanceTask = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const task = await MaintenanceTask.findOneAndUpdate(
    { id },
    req.body,
    { new: true, runValidators: true }
  ).lean();

  if (!task) {
    return next(new ErrorResponse(`Maintenance task not found with id of ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

module.exports = {
  getFleetSummary,
  listVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  listMaintenanceTasks,
  getMaintenanceTaskById,
  createMaintenanceTask,
  updateMaintenanceTask
};
