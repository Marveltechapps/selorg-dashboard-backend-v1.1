const GRN = require('../models/GRN');
const DockSlot = require('../models/DockSlot');
const ErrorResponse = require("../../core/utils/ErrorResponse");

/**
 * @desc Inbound Operations Service
 * Handles business logic for GRNs and Dock management
 */
const inboundService = {
  /**
   * List GRNs with optional filters
   */
  listGRNs: async (filters = {}) => {
    const {
      status,
      page = 1,
      limit = 5,
    } = filters;

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await GRN.countDocuments(query);
    const items = await GRN.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      items,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Create a new GRN
   */
  createGRN: async (grnData) => {
    // Generate a simple ID if not provided (e.g., GRN-123)
    if (!grnData.id) {
      const count = await GRN.countDocuments();
      grnData.id = `GRN-${(count + 1).toString().padStart(3, '0')}`;
    }
    return await GRN.create(grnData);
  },

  /**
   * Get GRN by ID
   */
  getGRNById: async (id) => {
    const grn = await GRN.findOne({ id });
    if (!grn) throw new ErrorResponse(`GRN not found with id ${id}`, 404);
    return grn;
  },

  /**
   * Start counting for a GRN
   */
  startCounting: async (id) => {
    const grn = await GRN.findOne({ id });
    if (!grn) throw new ErrorResponse(`GRN not found with id ${id}`, 404);
    
    grn.status = 'in-progress';
    await grn.save();
    return grn;
  },

  /**
   * Complete a GRN
   */
  completeGRN: async (id) => {
    const grn = await GRN.findOne({ id });
    if (!grn) throw new ErrorResponse(`GRN not found with id ${id}`, 404);
    
    grn.status = 'completed';
    await grn.save();
    return grn;
  },

  /**
   * Log discrepancy for a GRN
   */
  logDiscrepancy: async (id, discrepancyData) => {
    const grn = await GRN.findOne({ id });
    if (!grn) throw new ErrorResponse(`GRN not found with id ${id}`, 404);
    
    grn.status = 'discrepancy';
    // In a real system, we'd save the detailed discrepancy data to a related model
    await grn.save();
    return grn;
  },

  /**
   * List Dock Slots
   */
  listDocks: async (pagination = {}) => {
    const { page = 1, limit = 5 } = pagination;
    const skip = (page - 1) * limit;
    const total = await DockSlot.countDocuments();
    const items = await DockSlot.find()
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return {
      items,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Update Dock status
   */
  updateDock: async (id, dockData) => {
    const dock = await DockSlot.findOne({ id });
    if (!dock) throw new ErrorResponse(`Dock not found with id ${id}`, 404);
    
    Object.assign(dock, dockData);
    await dock.save();
    return dock;
  }
};

module.exports = inboundService;

