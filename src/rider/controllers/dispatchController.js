
const dispatchService = require('../services/dispatchService');
const { fixRiderCapacity } = require('../scripts/fixRiderCapacity');
const cache = require('../../utils/cache');
const logger = require('../../core/utils/logger');

/**
 * List unassigned orders
 */
const listUnassignedOrders = async (req, res, next) => {
  try {
    const filters = {
      priority: req.query.priority || 'all',
      zone: req.query.zone,
      search: req.query.search,
      sortBy: req.query.sortBy || 'priority',
      sortOrder: req.query.sortOrder || 'asc',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    };

    const result = await dispatchService.listUnassignedOrders(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get unassigned orders count
 */
const getUnassignedOrdersCount = async (req, res, next) => {
  try {
    const priority = req.query.priority || 'all';
    const result = await dispatchService.getUnassignedOrdersCount(priority);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get map data
 */
const getMapData = async (req, res, next) => {
  try {
    const filters = {
      hubId: req.query.hubId,
      showRiders: req.query.showRiders !== 'false',
      showOrders: req.query.showOrders !== 'false',
      showPickupPoints: req.query.showPickupPoints !== 'false',
    };

    const result = await dispatchService.getMapData(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get map riders
 */
const getMapRiders = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      zone: req.query.zone,
    };

    const result = await dispatchService.getMapRiders(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get map orders
 */
const getMapOrders = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      zone: req.query.zone,
    };

    const result = await dispatchService.getMapOrders(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recommended riders for order
 */
const getRecommendedRiders = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const filters = {
      search: req.query.search,
      limit: parseInt(req.query.limit) || 20,
    };

    const result = await dispatchService.getRecommendedRiders(orderId, filters);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found',
        code: 404,
      });
    }
    next(error);
  }
};

/**
 * Get order assignment details
 */
const getOrderAssignmentDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const result = await dispatchService.getOrderAssignmentDetails(orderId);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found',
        code: 404,
      });
    }
    next(error);
  }
};

/**
 * Create order (manual dispatch)
 */
const createOrder = async (req, res, next) => {
  try {
    const body = req.body || {};
    
    // Validate required fields
    if (!body.pickup && !body.pickupLocation) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Pickup location is required',
        code: 400 
      });
    }
    if (!body.drop && !body.dropLocation) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Drop location is required',
        code: 400 
      });
    }

    const result = await dispatchService.createOrder({
      orderId: body.orderId,
      pickup: body.pickup || body.pickupLocation,
      drop: body.drop || body.dropLocation,
      customer: body.customer || body.customerName || 'Customer',
    });
    try {
      await cache.delByPattern('orders:*').catch(() => {});
      await cache.delByPattern('dispatch:*').catch(() => {});
    } catch (_) { /* ignore */ }
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error creating order:', error);
    if (error.message === 'Order not found' || error.message === 'Rider not found') {
      return res.status(404).json({ error: 'Not Found', message: error.message });
    }
    if (error.message && error.message.includes('Database connection not ready')) {
      return res.status(503).json({ 
        error: 'Service Unavailable', 
        message: error.message,
        code: 503 
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Order with this ID already exists',
        code: 400 
      });
    }
    next(error);
  }
};

/**
 * Manually assign order to rider
 */
const assignOrder = async (req, res, next) => {
  try {
    const { orderId, riderId, overrideSla } = req.body;

    if (!orderId || !riderId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'orderId and riderId are required',
        code: 400,
      });
    }

    const result = await dispatchService.assignOrder(orderId, riderId, overrideSla || false);

    try {
      await Promise.all([
        cache.delByPattern('orders:*'),
        cache.delByPattern('riders:*'),
        cache.del(`rider:${riderId}`),
        cache.del('distribution'),
        cache.delByPattern('dashboard:*'),
        cache.delByPattern('dispatch:*'),
      ]).catch(() => {});
    } catch (_) { /* ignore cache errors */ }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in assignOrder controller:', error);
    if (error.message === 'Order not found' || error.message === 'Rider not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
        code: 404,
      });
    }
    if (error.message && error.message.includes('Database connection not ready')) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: error.message,
        code: 503,
      });
    }
    if (
      error.message === 'Order is not pending' ||
      error.message === 'Rider is at capacity' ||
      error.message === 'Rider is not available for assignment' ||
      error.message === 'Assignment would violate SLA deadline' ||
      error.message.includes('Cannot assign order') ||
      error.message.includes('has no rider assigned')
    ) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        code: 400,
      });
    }
    // For any other error, return 500 with proper error message
    const errorMessage = error.message || 'Internal server error';
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: errorMessage,
      code: 500 
    });
  }
};

/**
 * Batch assign multiple orders
 */
const batchAssignOrders = async (req, res, next) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'orderIds array is required and must not be empty',
        code: 400,
      });
    }
    
    const result = await dispatchService.batchAssignOrders(orderIds);

    try {
      await Promise.all([
        cache.delByPattern('orders:*'),
        cache.delByPattern('riders:*'),
        cache.del('distribution'),
        cache.delByPattern('dashboard:*'),
        cache.delByPattern('dispatch:*'),
      ]).catch(() => {});
    } catch (_) { /* ignore */ }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in batchAssignOrders controller:', error);
    next(error);
  }
};

/**
 * Auto-assign orders (legacy endpoint)
 */
const autoAssignOrders = async (req, res, next) => {
  try {
    const { orderIds } = req.body;
    const result = await dispatchService.autoAssignOrders(orderIds || []);

    try {
      await Promise.all([
        cache.delByPattern('orders:*'),
        cache.delByPattern('riders:*'),
        cache.del('distribution'),
        cache.delByPattern('dashboard:*'),
        cache.delByPattern('dispatch:*'),
      ]).catch(() => {});
    } catch (_) { /* ignore */ }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in autoAssignOrders controller:', error);
    next(error);
  }
};

/**
 * Fix rider capacities by recalculating based on actual assigned orders
 * This is useful when orders are deleted but rider capacities weren't updated
 * Optional body parameter: { maxLoad: number } to set a custom max capacity
 */
const fixRiderCapacities = async (req, res, next) => {
  try {
    const { maxLoad } = req.body || {};
    const targetMaxLoad = maxLoad && typeof maxLoad === 'number' && maxLoad > 0 ? maxLoad : null;
    
    logger.info('[dispatchController] Fixing rider capacities...', {
      customMaxLoad: targetMaxLoad || 'using default (10)'
    });
    
    const result = await fixRiderCapacity(targetMaxLoad);
    res.status(200).json({
      success: true,
      message: 'Rider capacities fixed successfully',
      ...result
    });
  } catch (error) {
    logger.error('Error fixing rider capacities:', error);
    next(error);
  }
};

module.exports = {
  listUnassignedOrders,
  getUnassignedOrdersCount,
  getMapData,
  getMapRiders,
  getMapOrders,
  getRecommendedRiders,
  getOrderAssignmentDetails,
  createOrder,
  assignOrder,
  batchAssignOrders,
  autoAssignOrders,
  fixRiderCapacities,
};
