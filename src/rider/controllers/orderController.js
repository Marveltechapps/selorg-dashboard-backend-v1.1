const Order = require('../../warehouse/models/Order');
const logger = require('../../core/utils/logger');
const dispatchService = require('../services/dispatchService');

/**
 * List all orders (for rider overview / live order board)
 */
const listOrders = async (req, res, next) => {
  try {
    const { status, search, limit = 100 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { id: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }
    const orders = await Order.find(query)
      .sort({ slaDeadline: 1 })
      .limit(parseInt(limit, 10) || 100)
      .lean();
    return res.status(200).json({ success: true, data: orders, orders });
  } catch (error) {
    logger.error('Error listing orders:', error);
    next(error);
  }
};

/**
 * Assign order to rider (delegate to dispatch service)
 */
const assignOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { riderId, overrideSla } = req.body;
    if (!riderId) {
      return res.status(400).json({ error: 'Bad Request', message: 'riderId is required' });
    }
    const result = await dispatchService.assignOrder(orderId, riderId, !!overrideSla);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Order not found' || error.message === 'Rider not found') {
      return res.status(404).json({ error: 'Not Found', message: error.message });
    }
    if (error.message === 'Order is not pending' || error.message === 'Rider is at capacity') {
      return res.status(400).json({ error: 'Bad Request', message: error.message });
    }
    logger.error('Error assigning order:', error);
    next(error);
  }
};

module.exports = { listOrders, assignOrder };
