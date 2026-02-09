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
    // CRITICAL: Explicitly select ALL fields including riderId to ensure it's included in results
    const orders = await Order.find(query)
      .select('id order_id riderId status etaMinutes pickupLocation dropLocation customerName items timeline slaDeadline zone completedAt deliveryTimeSeconds createdAt updatedAt')
      .sort({ slaDeadline: 1 })
      .limit(parseInt(limit, 10) || 100)
      .lean();
    
    // Ensure orders is always an array
    const ordersArray = Array.isArray(orders) ? orders : [];
    
    // CRITICAL: Log and debug riderId field from database
    logger.info('[orderController.listOrders] Fetched orders from database', {
      totalOrders: ordersArray.length,
      ordersWithRiderId: ordersArray.filter(o => o.riderId).length,
      sampleOrderIds: ordersArray.slice(0, 5).map(o => ({ id: o.id, riderId: o.riderId }))
    });
    
    // Log orders with missing riderId for debugging
    const ordersWithoutRider = ordersArray.filter(o => !o.riderId);
    if (ordersWithoutRider.length > 0) {
      logger.warn('[orderController.listOrders] Found orders without riderId', {
        count: ordersWithoutRider.length,
        orderIds: ordersWithoutRider.map(o => o.id).slice(0, 10),
        sampleOrder: ordersWithoutRider[0] ? {
          id: ordersWithoutRider[0].id,
          status: ordersWithoutRider[0].status,
          hasRiderIdField: 'riderId' in ordersWithoutRider[0],
          riderIdValue: ordersWithoutRider[0].riderId,
          allKeys: Object.keys(ordersWithoutRider[0])
        } : null
      });
    }
    
    // Ensure riderId is explicitly included in response (even if null/undefined)
    // Also ensure all fields are properly included
    const ordersWithRiderId = ordersArray.map(order => {
      // CRITICAL: Check if riderId exists in the order object from database
      const dbRiderId = order.riderId;
      const hasRiderIdField = 'riderId' in order;
      
      // Log for debugging if riderId is missing but should be there
      if (!dbRiderId && order.status !== 'pending' && order.status !== 'delayed') {
        logger.warn('[orderController.listOrders] Order missing riderId in database response', {
          orderId: order.id,
          status: order.status,
          hasRiderIdField,
          dbRiderId,
          allFields: Object.keys(order)
        });
      }
      
      const orderObj = {
        ...order,
        riderId: dbRiderId || null, // Use the actual value from database, or null if missing
        id: order.id || order.order_id || null, // Ensure id is always present
        status: order.status || 'pending',
        customerName: order.customerName || 'Customer',
        pickupLocation: order.pickupLocation || 'Hub Location',
        dropLocation: order.dropLocation || 'Customer Address',
        items: order.items || ['Order Item'],
        timeline: order.timeline || [],
        etaMinutes: order.etaMinutes || null,
        slaDeadline: order.slaDeadline || new Date()
      };
      
      return orderObj;
    });
    
    return res.status(200).json({ 
      success: true, 
      data: ordersWithRiderId, 
      orders: ordersWithRiderId,
      count: ordersWithRiderId.length 
    });
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
    
    // Clear cache to ensure fresh data on next fetch
    const cache = require('../../utils/cache');
    try {
      await Promise.all([
        cache.delByPattern('orders:*'),
        cache.delByPattern('riders:*'),
        cache.del(`rider:${riderId}`),
        cache.del('distribution'),
        cache.delByPattern('dashboard:*'),
      ]).catch(() => {});
    } catch (_) { /* ignore cache errors */ }
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error assigning order:', error);
    if (error.message === 'Order not found' || error.message === 'Rider not found') {
      return res.status(404).json({ error: 'Not Found', message: error.message });
    }
    if (error.message && (
      error.message.includes('not pending') || 
      error.message.includes('has no rider assigned') ||
      error.message === 'Rider is at capacity' ||
      error.message === 'Rider is not available for assignment' ||
      error.message.includes('Cannot assign order')
    )) {
      return res.status(400).json({ error: 'Bad Request', message: error.message });
    }
    // For any other error, return 500 with proper error message
    const errorMessage = error.message || 'Internal server error';
    return res.status(500).json({ error: 'Internal Server Error', message: errorMessage });
  }
};

/**
 * Alert order (mark as urgent/needs attention)
 */
const alertOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    // Normalize orderId
    let normalizedOrderId = orderId;
    if (typeof orderId === 'string') {
      const ordMatch = orderId.match(/^ord-(\d+)$/i);
      if (ordMatch) {
        const num = ordMatch[1];
        normalizedOrderId = `ORD-${String(parseInt(num, 10)).padStart(4, '0')}`;
      }
      const ordMatch2 = orderId.match(/^ORD-(\d+)$/);
      if (ordMatch2 && !ordMatch2[1].startsWith('0')) {
        const num = ordMatch2[1];
        normalizedOrderId = `ORD-${String(parseInt(num, 10)).padStart(4, '0')}`;
      }
    }
    
    // Try to find the order with multiple ID formats
    let order = null;
    const searchIds = [normalizedOrderId, orderId];
    if (normalizedOrderId.match(/^ORD-(\d+)$/)) {
      const num = normalizedOrderId.match(/^ORD-(\d+)$/)[1];
      const unpadded = `ORD-${parseInt(num, 10)}`;
      if (unpadded !== normalizedOrderId) searchIds.push(unpadded);
    }
    
    for (const searchId of searchIds) {
      order = await Order.findOne({ id: searchId }).lean();
      if (order) break;
    }
    
    // Also try with order_id field
    if (!order) {
      for (const searchId of searchIds) {
        order = await Order.findOne({ order_id: searchId }).lean();
        if (order) break;
      }
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
    }
    
    // Get current timeline or create new one
    const timeline = order.timeline || [];
    const currentStatus = order.status || 'pending';
    
    // Add alert to timeline
    timeline.push({
      status: currentStatus,
      time: new Date(),
      note: `Alert: ${reason || 'Order requires attention'}`,
    });
    
    // Prepare update data - use findOneAndUpdate to bypass validation
    const updateData = {
      timeline: timeline,
    };
    
    // If order status is not 'delayed', we can optionally set it (but don't force it)
    // Only update status if it's a valid warehouse status
    const validWarehouseStatuses = ['assigned', 'picked_up', 'in_transit', 'delivered', 'rto', 'returned', 'delayed', 'pending'];
    if (currentStatus && validWarehouseStatuses.includes(currentStatus)) {
      // Status is already valid, no need to change
    } else {
      // Map invalid status to valid one
      const statusMap = {
        'new': 'pending',
        'processing': 'pending',
        'ready': 'pending',
        'completed': 'delivered',
        'cancelled': 'rto',
        'rto': 'rto'
      };
      if (statusMap[currentStatus]) {
        updateData.status = statusMap[currentStatus];
      } else {
        updateData.status = 'pending'; // Default fallback
      }
    }
    
    // Remove production schema fields if they exist
    const unsetData = {};
    if (order.store_id) unsetData.store_id = '';
    if (order.item_count) unsetData.item_count = '';
    if (order.sla_timer) unsetData.sla_timer = '';
    if (order.sla_deadline && order.slaDeadline) unsetData.sla_deadline = '';
    if (order.order_type) unsetData.order_type = '';
    if (order.sla_status) unsetData.sla_status = '';
    if (order.assignee) unsetData.assignee = '';
    if (order.rto_risk) unsetData.rto_risk = '';
    if (order.rto_reason) unsetData.rto_reason = '';
    if (order.rto_notes) unsetData.rto_notes = '';
    if (order.rto_status) unsetData.rto_status = '';
    
    // Build update operation
    const updateOperation = { $set: updateData };
    if (Object.keys(unsetData).length > 0) {
      updateOperation.$unset = unsetData;
    }
    
    // Update order using findOneAndUpdate to bypass validation
    const updatedOrder = await Order.findOneAndUpdate(
      { id: order.id || normalizedOrderId },
      updateOperation,
      { new: true, runValidators: false }
    );
    
    if (!updatedOrder) {
      // Try with order_id field
      await Order.findOneAndUpdate(
        { order_id: order.order_id || normalizedOrderId },
        updateOperation,
        { new: true, runValidators: false }
      );
    }
    
    // Clear cache
    const cache = require('../../utils/cache');
    try {
      await cache.delByPattern('orders:*').catch(() => {});
    } catch (_) { /* ignore cache errors */ }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Order alerted successfully',
      orderId: order.id || normalizedOrderId 
    });
  } catch (error) {
    logger.error('Error alerting order:', error);
    
    // Provide better error message
    if (error.message && error.message.includes('validation failed')) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'HTTP_500',
          message: `Order validation failed: ${error.message}`,
          stack: error.stack
        },
        meta: {
          requestId: req.id || 'unknown',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    }
    
    next(error);
  }
};

module.exports = { listOrders, assignOrder, alertOrder };
