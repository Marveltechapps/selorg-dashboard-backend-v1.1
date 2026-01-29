const Store = require('../../merch/models/Store');
const Staff = require('../../warehouse/models/Staff');
const { asyncHandler } = require('../../core/middleware');
const ErrorResponse = require('../../core/utils/ErrorResponse');

const storeWarehouseController = {
  // Stores
  listStores: asyncHandler(async (req, res) => {
    const stores = await Store.find().lean();
    res.json({ success: true, data: stores });
  }),

  getStore: asyncHandler(async (req, res) => {
    const store = await Store.findById(req.params.id).lean();
    if (!store) {
      throw new ErrorResponse('Store not found', 404);
    }
    res.json({ success: true, data: store });
  }),

  createStore: asyncHandler(async (req, res) => {
    const store = await Store.create(req.body);
    res.status(201).json({ success: true, data: store });
  }),

  updateStore: asyncHandler(async (req, res) => {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!store) {
      throw new ErrorResponse('Store not found', 404);
    }
    res.json({ success: true, data: store });
  }),

  deleteStore: asyncHandler(async (req, res) => {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) {
      throw new ErrorResponse('Store not found', 404);
    }
    res.json({ success: true, message: 'Store deleted' });
  }),

  // Warehouses - using warehouse service
  listWarehouses: asyncHandler(async (req, res) => {
    const StorageLocation = require('../../warehouse/models/StorageLocation');
    const locations = await StorageLocation.aggregate([
      { $group: { _id: '$warehouse', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: locations.map(l => ({ id: l._id, name: l._id, storageCapacity: 0, currentUtilization: 0 })) });
  }),

  // Staff
  listStaff: asyncHandler(async (req, res) => {
    const staff = await Staff.find().lean();
    res.json({ success: true, data: staff });
  }),

  getStaff: asyncHandler(async (req, res) => {
    const staff = await Staff.findById(req.params.id).lean();
    if (!staff) {
      throw new ErrorResponse('Staff not found', 404);
    }
    res.json({ success: true, data: staff });
  }),

  createStaff: asyncHandler(async (req, res) => {
    const staff = await Staff.create(req.body);
    res.status(201).json({ success: true, data: staff });
  }),

  updateStaff: asyncHandler(async (req, res) => {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!staff) {
      throw new ErrorResponse('Staff not found', 404);
    }
    res.json({ success: true, data: staff });
  }),

  deleteStaff: asyncHandler(async (req, res) => {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      throw new ErrorResponse('Staff not found', 404);
    }
    res.json({ success: true, message: 'Staff deleted' });
  }),

  // Store Performance
  getStorePerformance: asyncHandler(async (req, res) => {
    const stores = await Store.find().lean();
    const performance = stores.map(store => ({
      storeId: store._id.toString(),
      storeName: store.name,
      ordersToday: 0,
      ordersWeek: 0,
      ordersMonth: 0,
      revenueToday: 0,
      revenueWeek: 0,
      revenueMonth: 0,
      avgRating: 0,
      totalReviews: 0,
      onTimeDelivery: 0,
      capacityUtilization: 0,
    }));
    res.json({ success: true, data: performance });
  }),

  // Store Stats
  getStoreStats: asyncHandler(async (req, res) => {
    const stores = await Store.find().lean();
    const staff = await Staff.find().lean();
    res.json({
      success: true,
      data: {
        totalStores: stores.length,
        activeStores: stores.filter(s => s.serviceStatus === 'Full').length,
        darkStores: 0,
        totalWarehouses: 0,
        totalStaff: staff.length,
        avgRating: '0.0',
        totalRevenue: 0,
        avgCapacityUtilization: 0,
      }
    });
  }),
};

module.exports = storeWarehouseController;
