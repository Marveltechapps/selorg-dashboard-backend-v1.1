
const WarehouseException = require('../models/WarehouseException');
const ErrorResponse = require("../../core/utils/ErrorResponse");

/**
 * @desc Exception Management Service
 */
const exceptionsService = {
  listExceptions: async (filters = {}) => {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    return await WarehouseException.find(query).sort({ createdAt: -1 });
  },

  reportException: async (data) => {
    if (!data.id) {
      const count = await WarehouseException.countDocuments();
      data.id = `EXC-${(count + 1).toString().padStart(3, '0')}`;
    }
    return await WarehouseException.create(data);
  },

  getExceptionById: async (id) => {
    const exception = await WarehouseException.findOne({ id });
    if (!exception) throw new ErrorResponse(`Exception not found with id ${id}`, 404);
    return exception;
  },

  updateStatus: async (id, status) => {
    const exception = await WarehouseException.findOne({ id });
    if (!exception) throw new ErrorResponse(`Exception not found with id ${id}`, 404);
    
    exception.status = status;
    if (status === 'resolved' || status === 'closed') {
      exception.resolvedAt = new Date();
    }
    await exception.save();
    return exception;
  },

  handleShipmentRejection: async (id) => {
    const exception = await WarehouseException.findOne({ id });
    if (!exception) throw new ErrorResponse(`Exception not found with id ${id}`, 404);
    
    // Logic for rejecting shipment
    exception.status = 'resolved';
    exception.resolutionNotes = 'Shipment rejected due to critical discrepancy';
    exception.resolvedAt = new Date();
    await exception.save();
    return exception;
  },

  handlePartialAcceptance: async (id, acceptedQuantity) => {
    const exception = await WarehouseException.findOne({ id });
    if (!exception) throw new ErrorResponse(`Exception not found with id ${id}`, 404);
    
    // Logic for partial acceptance
    exception.status = 'resolved';
    exception.resolutionNotes = `Partial shipment accepted (${acceptedQuantity} items)`;
    exception.resolvedAt = new Date();
    await exception.save();
    return exception;
  }
};

module.exports = exceptionsService;
