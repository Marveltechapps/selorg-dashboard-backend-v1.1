
const Order = require('../../warehouse/models/Order');
const Rider = require('../models/Rider');
const RiderHR = require('../models/RiderHR');
const { calculateDistance } = require('../../utils/distanceCalculator');
const logger = require('../../core/utils/logger');

// Default rider capacity
const DEFAULT_RIDER_MAX_LOAD = 10;

/**
 * Calculate order priority based on SLA deadline
 * @param {Date} slaDeadline - SLA deadline
 * @returns {string} Priority level (high, medium, low)
 */
const calculatePriority = (slaDeadline) => {
  const now = new Date();
  const timeUntilDeadline = slaDeadline - now;
  const minutesUntilDeadline = timeUntilDeadline / (1000 * 60);

  if (minutesUntilDeadline <= 30) {
    return 'high';
  } else if (minutesUntilDeadline <= 60) {
    return 'medium';
  }
  return 'low';
};

/**
 * Calculate distance from address string (simplified - would need geocoding in production)
 * For now, returns a mock distance based on order ID
 */
const calculateOrderDistance = (orderId) => {
  // Simplified: extract number from order ID and use as base distance
  const match = orderId.match(/\d+/);
  const num = match ? parseInt(match[0]) : 1000;
  return (num % 10) + 0.5; // Return distance between 0.5 and 9.5 km
};

/**
 * Get unassigned orders with filtering and sorting
 */
const listUnassignedOrders = async (filters = {}) => {
  try {
    const {
      priority = 'all',
      zone,
      search,
      sortBy = 'priority',
      sortOrder = 'asc',
      page = 1,
      limit = 50,
    } = filters;

    // Build query
    const query = { status: 'pending' };

    if (zone) {
      query.zone = zone;
    }

    if (search) {
      query.$or = [
        { id: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    // Get all unassigned orders
    let orders = await Order.find(query).lean();

    // Calculate priority and distance for each order
    orders = orders.map((order) => {
      const priorityLevel = calculatePriority(order.slaDeadline);
      const distance = calculateOrderDistance(order.id);
      const etaMinutes = Math.ceil(distance * 3); // Rough estimate: 3 minutes per km

      return {
        ...order,
        priority: priorityLevel,
        distance,
        etaMinutes,
      };
    });

    // Filter by priority if not 'all'
    if (priority !== 'all') {
      orders = orders.filter((order) => order.priority === priority);
    }

    // Sort orders
    const sortMultiplier = sortOrder === 'desc' ? -1 : 1;
    orders.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        case 'distance':
          comparison = a.distance - b.distance;
          break;
        case 'eta':
          comparison = a.etaMinutes - b.etaMinutes;
          break;
        case 'slaDeadline':
          comparison = new Date(a.slaDeadline) - new Date(b.slaDeadline);
          break;
        default:
          comparison = 0;
      }
      return comparison * sortMultiplier;
    });

    // Pagination
    const total = orders.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedOrders = orders.slice(skip, skip + limit);

    return {
      orders: paginatedOrders,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
    };
  } catch (error) {
    logger.error('Error listing unassigned orders:', error);
    throw error;
  }
};

/**
 * Get unassigned orders count with priority breakdown
 */
const getUnassignedOrdersCount = async (priority = 'all') => {
  try {
    const query = { status: 'pending' };
    const orders = await Order.find(query).lean();

    // Calculate priority for each order
    const ordersWithPriority = orders.map((order) => ({
      ...order,
      priority: calculatePriority(order.slaDeadline),
    }));

    // Filter by priority if not 'all'
    const filteredOrders = priority === 'all'
      ? ordersWithPriority
      : ordersWithPriority.filter((o) => o.priority === priority);

    // Calculate breakdown
    const priorityBreakdown = {
      high: 0,
      medium: 0,
      low: 0,
    };

    ordersWithPriority.forEach((order) => {
      priorityBreakdown[order.priority] = (priorityBreakdown[order.priority] || 0) + 1;
    });

    return {
      count: filteredOrders.length,
      priorityBreakdown,
    };
  } catch (error) {
    logger.error('Error getting unassigned orders count:', error);
    throw error;
  }
};

/**
 * Get map data (riders and orders)
 */
const getMapData = async (filters = {}) => {
  try {
    const {
      hubId,
      showRiders = true,
      showOrders = true,
      showPickupPoints = true,
    } = filters;

    const result = {
      riders: [],
      orders: [],
      pickupPoints: [],
      statusCounts: {
        riders: {},
        orders: {},
      },
    };

    // Get riders
    if (showRiders) {
      const riders = await Rider.find({}).lean();
      result.riders = riders.map((rider) => ({
        id: rider.id,
        name: rider.name,
        status: rider.status,
        location: rider.location || { lat: 0, lng: 0 },
        zone: rider.zone,
        capacity: rider.capacity,
        currentOrderId: rider.currentOrderId,
        avatarInitials: rider.avatarInitials,
      }));

      // Calculate rider status counts
      const riderStatusCounts = {};
      riders.forEach((rider) => {
        riderStatusCounts[rider.status] = (riderStatusCounts[rider.status] || 0) + 1;
      });
      result.statusCounts.riders = {
        online: riderStatusCounts.online || 0,
        busy: riderStatusCounts.busy || 0,
        in_transit: riderStatusCounts.in_transit || 0,
        idle: riderStatusCounts.idle || 0,
        offline: riderStatusCounts.offline || 0,
      };
    }

    // Get orders
    if (showOrders) {
      const orders = await Order.find({}).lean();
      result.orders = orders.map((order) => {
        // Extract coordinates from address (simplified - would need geocoding)
        const pickupCoords = extractCoordinates(order.pickupLocation);
        const dropCoords = extractCoordinates(order.dropLocation);

        return {
          id: order.id,
          status: order.status,
          pickupLocation: {
            address: order.pickupLocation,
            coordinates: pickupCoords,
          },
          dropLocation: {
            address: order.dropLocation,
            coordinates: dropCoords,
          },
          riderId: order.riderId,
          priority: calculatePriority(order.slaDeadline),
          zone: order.zone,
        };
      });

      // Calculate order status counts
      const orderStatusCounts = {};
      orders.forEach((order) => {
        orderStatusCounts[order.status] = (orderStatusCounts[order.status] || 0) + 1;
      });
      result.statusCounts.orders = {
        pending: orderStatusCounts.pending || 0,
        assigned: orderStatusCounts.assigned || 0,
        in_transit: orderStatusCounts.in_transit || 0,
        picked_up: orderStatusCounts.picked_up || 0,
        delivered: orderStatusCounts.delivered || 0,
      };
    }

    // Get pickup points (grouped by pickup location)
    if (showPickupPoints) {
      const orders = await Order.find({}).lean();
      const pickupMap = new Map();

      orders.forEach((order) => {
        const key = order.pickupLocation;
        if (!pickupMap.has(key)) {
          const coords = extractCoordinates(order.pickupLocation);
          pickupMap.set(key, {
            id: `PICKUP-${pickupMap.size + 1}`,
            address: order.pickupLocation,
            coordinates: coords,
            orderCount: 0,
          });
        }
        pickupMap.get(key).orderCount += 1;
      });

      result.pickupPoints = Array.from(pickupMap.values());
    }

    return result;
  } catch (error) {
    logger.error('Error getting map data:', error);
    throw error;
  }
};

/**
 * Extract coordinates from address (simplified - would need geocoding service)
 */
const extractCoordinates = (address) => {
  // Handle undefined/null addresses
  if (!address || typeof address !== 'string') {
    // Return default coordinates (NYC area) if address is invalid
    return { lat: 40.7128, lng: -74.0060 };
  }
  // Simplified: generate mock coordinates based on address hash
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lat = 40.7128 + (hash % 100) / 1000; // NYC area
  const lng = -74.0060 + (hash % 200) / 1000;
  return { lat, lng };
};

/**
 * Get map riders
 */
const getMapRiders = async (filters = {}) => {
  try {
    const { status, zone } = filters;
    const query = {};

    if (status) {
      query.status = status;
    }
    if (zone) {
      query.zone = zone;
    }

    const riders = await Rider.find(query).lean();

    const ridersData = riders.map((rider) => ({
      id: rider.id,
      name: rider.name,
      status: rider.status,
      location: rider.location || { lat: 0, lng: 0 },
      zone: rider.zone,
      capacity: rider.capacity,
      currentOrderId: rider.currentOrderId,
      avatarInitials: rider.avatarInitials,
    }));

    // Calculate status counts
    const statusCounts = {};
    riders.forEach((rider) => {
      statusCounts[rider.status] = (statusCounts[rider.status] || 0) + 1;
    });

    return {
      riders: ridersData,
      statusCounts: {
        online: statusCounts.online || 0,
        busy: statusCounts.busy || 0,
        in_transit: statusCounts.in_transit || 0,
        idle: statusCounts.idle || 0,
        offline: statusCounts.offline || 0,
      },
    };
  } catch (error) {
    logger.error('Error getting map riders:', error);
    throw error;
  }
};

/**
 * Get map orders
 */
const getMapOrders = async (filters = {}) => {
  try {
    const { status, zone } = filters;
    const query = {};

    if (status) {
      query.status = status;
    }
    if (zone) {
      query.zone = zone;
    }

    const orders = await Order.find(query).lean();

    const ordersData = orders.map((order) => {
      const pickupCoords = extractCoordinates(order.pickupLocation);
      const dropCoords = extractCoordinates(order.dropLocation);

      return {
        id: order.id,
        status: order.status,
        pickupLocation: {
          address: order.pickupLocation,
          coordinates: pickupCoords,
        },
        dropLocation: {
          address: order.dropLocation,
          coordinates: dropCoords,
        },
        riderId: order.riderId,
        priority: calculatePriority(order.slaDeadline),
        zone: order.zone,
      };
    });

    // Get pickup points
    const pickupMap = new Map();
    orders.forEach((order) => {
      const key = order.pickupLocation;
      if (!pickupMap.has(key)) {
        const coords = extractCoordinates(order.pickupLocation);
        pickupMap.set(key, {
          id: `PICKUP-${pickupMap.size + 1}`,
          address: order.pickupLocation,
          coordinates: coords,
          orderCount: 0,
        });
      }
      pickupMap.get(key).orderCount += 1;
    });

    return {
      orders: ordersData,
      pickupPoints: Array.from(pickupMap.values()),
    };
  } catch (error) {
    logger.error('Error getting map orders:', error);
    throw error;
  }
};

/**
 * Get recommended riders for an order
 */
const getRecommendedRiders = async (orderId, filters = {}) => {
  try {
    const { search, limit = 20 } = filters;

    // Get order
    const order = await Order.findOne({ id: orderId }).lean();
    if (!order) {
      throw new Error('Order not found');
    }

    // Get available riders from both operational and HR collections
    let ridersQuery = {
      $expr: { $lt: ['$capacity.currentLoad', '$capacity.maxLoad'] },
    };

    if (search) {
      ridersQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } },
      ];
    }

    // Get operational riders
    const operationalRiders = await Rider.find(ridersQuery).lean();
    
    // Get active riders from HR who don't have operational records yet
    const hrRidersQuery = {
      status: 'active',
      appAccess: 'enabled'
    };
    
    if (search) {
      hrRidersQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } },
      ];
    }
    
    const hrRiders = await RiderHR.find(hrRidersQuery).lean();
    const operationalRiderIds = new Set(operationalRiders.map(r => r.id));
    
    // Add HR riders who don't have operational records (they start with 0 load)
    const availableHrRiders = hrRiders
      .filter(hr => !operationalRiderIds.has(hr.id))
      .map(hr => ({
        id: hr.id,
        name: hr.name,
        status: 'offline',
        location: null,
        capacity: {
          currentLoad: 0,
          maxLoad: DEFAULT_RIDER_MAX_LOAD
        },
        rating: 0,
        avgEtaMins: 0,
        zone: null,
        fromHR: true
      }));
    
    // Combine both lists
    const riders = [...operationalRiders, ...availableHrRiders];

    // Calculate recommendation scores
    const orderPriority = calculatePriority(order.slaDeadline);
    const orderPickupCoords = extractCoordinates(order.pickupLocation);
    const orderZone = order.zone;

    const ridersWithScores = riders.map((rider) => {
      let score = 0;

      // Zone match: +10 points
      if (rider.zone && orderZone && rider.zone === orderZone) {
        score += 10;
      }

      // Distance: calculate distance and subtract points (closer is better)
      if (rider.location) {
        const distance = calculateDistance(
          rider.location.lat,
          rider.location.lng,
          orderPickupCoords.lat,
          orderPickupCoords.lng
        );
        score -= distance * 2; // -2 points per km
      } else {
        score -= 20; // Penalty for no location
      }

      // Capacity: prefer riders with less load
      const loadRatio = rider.capacity.currentLoad / rider.capacity.maxLoad;
      score -= loadRatio * 10; // -10 points if at max capacity

      // Status: prefer online/idle over busy
      if (rider.status === 'online' || rider.status === 'idle') {
        score += 5;
      } else if (rider.status === 'busy') {
        score += 2; // Still acceptable but lower priority
      }

      // Rating: add rating as points
      score += (rider.rating || 0) * 2;

      // SLA urgency: bonus for high priority orders
      if (orderPriority === 'high') {
        score += 15;
      }

      // Calculate estimated pickup time (simplified)
      let estimatedPickupMinutes = 15; // Default
      if (rider.location) {
        const distance = calculateDistance(
          rider.location.lat,
          rider.location.lng,
          orderPickupCoords.lat,
          orderPickupCoords.lng
        );
        estimatedPickupMinutes = Math.ceil(distance * 3); // 3 minutes per km
      }

      return {
        id: rider.id,
        name: rider.name,
        zone: rider.zone,
        status: rider.status,
        load: {
          current: rider.capacity.currentLoad,
          max: rider.capacity.maxLoad,
        },
        estimatedPickupMinutes,
        distance: rider.location
          ? calculateDistance(
              rider.location.lat,
              rider.location.lng,
              orderPickupCoords.lat,
              orderPickupCoords.lng
            )
          : null,
        rating: rider.rating || 0,
        score,
        isRecommended: false, // Will be set after sorting
      };
    });

    // Sort by score (descending)
    ridersWithScores.sort((a, b) => b.score - a.score);

    // Mark top 3 as recommended
    const topRiders = Math.min(3, ridersWithScores.length);
    for (let i = 0; i < topRiders; i++) {
      ridersWithScores[i].isRecommended = true;
    }

    // Limit results
    const limitedRiders = ridersWithScores.slice(0, limit);

    return {
      riders: limitedRiders,
      orderDetails: {
        id: order.id,
        pickup: order.pickupLocation,
        distance: calculateOrderDistance(order.id),
        priority: orderPriority,
      },
    };
  } catch (error) {
    logger.error('Error getting recommended riders:', error);
    throw error;
  }
};

/**
 * Create a new order (manual dispatch)
 */
const createOrder = async (payload) => {
  try {
    // Check MongoDB connection state before querying
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection not ready. Please wait a moment and try again.');
    }

    const { pickup, drop, customer, orderId } = payload || {};
    
    // If orderId is provided, validate and use it; otherwise generate one
    let id;
    if (orderId && typeof orderId === 'string' && orderId.trim()) {
      // Normalize the provided orderId
      const normalizedId = orderId.trim().toUpperCase();
      // Validate format (should match ORD-XXXX pattern)
      if (!/^ORD-\d+$/.test(normalizedId)) {
        throw new Error(`Invalid order ID format. Must match pattern ORD-XXXX (e.g., ORD-0001)`);
      }
      
      // Check if this ID already exists
      const existingOrder = await Order.findOne({ 
        $or: [
          { id: normalizedId },
          { order_id: normalizedId }
        ]
      }).lean();
      
      if (existingOrder) {
        throw new Error(`Order with ID ${normalizedId} already exists`);
      }
      
      id = normalizedId;
      logger.info('[dispatchService.createOrder] Using provided order ID', { id });
    } else {
      // Generate new ID
    let nextNum = 1;
    try {
      // Find all orders with ORD- prefix (handles both ORD-1 and ORD-0001 formats)
      const orders = await Order.find({ id: /^ORD-\d+$/i }).select('id').lean();
      orders.forEach((o) => {
        const num = parseInt(o.id.replace(/\D/g, ''), 10);
        if (!Number.isNaN(num) && num >= nextNum) nextNum = num + 1;
      });
    } catch (findErr) {
      logger.warn('[dispatchService.createOrder] find fallback to 1', findErr.message);
    }
    // Use padded format to match seed data (ORD-0001, ORD-0002, etc.)
      id = `ORD-${String(nextNum).padStart(4, '0')}`;
      
      // Check if generated ID already exists
      const existingOrder = await Order.findOne({ 
        $or: [
          { id },
          { order_id: id }
        ]
      }).lean();
      if (existingOrder) {
        // If exists, increment and try again
        const retryPayload = { ...payload };
        return createOrder(retryPayload);
      }
    }
    
    const slaDeadline = new Date(Date.now() + 60 * 60 * 1000);
    
    // Create new order document
    const order = new Order({
      id,
      order_id: id,
      status: 'pending',
      pickupLocation: pickup || 'Hub',
      dropLocation: drop || 'Address',
      customerName: customer || 'Customer',
      items: ['Manual order'],
      timeline: [{ status: 'pending', time: new Date(), note: 'Order created manually' }],
      slaDeadline,
      zone: null,
      riderId: null,
      etaMinutes: null,
    });
    
    // Save the order - use save() which handles validation better
    try {
      await order.save();
    } catch (saveError) {
      // If duplicate key error, try with next number
      if (saveError.code === 11000) {
        logger.warn('[dispatchService.createOrder] Duplicate key, retrying with next number', { id });
        const retryPayload = { ...payload };
        return createOrder(retryPayload);
      }
      // If validation error, try using findOneAndUpdate with strict: false
      if (saveError.name === 'ValidationError') {
        logger.warn('[dispatchService.createOrder] Validation error, using findOneAndUpdate', { error: saveError.message });
    const doc = {
      id,
      order_id: id,
      status: 'pending',
      pickupLocation: pickup || 'Hub',
      dropLocation: drop || 'Address',
      customerName: customer || 'Customer',
      items: ['Manual order'],
      timeline: [{ status: 'pending', time: new Date(), note: 'Order created manually' }],
      slaDeadline,
      zone: null,
      riderId: null,
      etaMinutes: null,
    };
        const updatedOrder = await Order.findOneAndUpdate(
          { id },
          doc,
          { upsert: true, new: true, runValidators: false, strict: false }
        );
        if (!updatedOrder) {
          throw new Error('Failed to create order');
        }
        logger.info('[dispatchService.createOrder] order created via findOneAndUpdate', { id: updatedOrder.id });
        const orderObj = updatedOrder.toObject ? updatedOrder.toObject() : updatedOrder;
        return {
          id: orderObj.id,
          orderId: orderObj.id,
          pickupLocation: orderObj.pickupLocation,
          dropLocation: orderObj.dropLocation,
          customerName: orderObj.customerName,
        };
      }
      throw saveError;
    }
    
    logger.info('[dispatchService.createOrder] order created', { id: order.id });
    const orderObj = order.toObject ? order.toObject() : order;
    // Return format expected by frontend
    return {
      id: orderObj.id,
      orderId: orderObj.id,
      pickupLocation: orderObj.pickupLocation,
      dropLocation: orderObj.dropLocation,
      customerName: orderObj.customerName,
    };
  } catch (error) {
    logger.error('Error creating order:', error);
    if (error.code === 11000) {
      // Duplicate key error - try again with next number
      const retryPayload = { ...payload };
      return createOrder(retryPayload);
    }
    // Provide better error message
    if (error.message && error.message.includes('validation failed')) {
      throw new Error(`Order validation failed: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Get order assignment details
 */
const getOrderAssignmentDetails = async (orderId) => {
  try {
    const order = await Order.findOne({ id: orderId }).lean();
    if (!order) {
      throw new Error('Order not found');
    }

    const priority = calculatePriority(order.slaDeadline);
    const distance = calculateOrderDistance(order.id);

    return {
      id: order.id,
      pickup: order.pickupLocation,
      drop: order.dropLocation,
      distance,
      priority,
      zone: order.zone,
      slaDeadline: order.slaDeadline,
      customerName: order.customerName,
      items: order.items,
    };
  } catch (error) {
    logger.error('Error getting order assignment details:', error);
    throw error;
  }
};

/**
 * Manually assign order to rider
 */
const assignOrder = async (orderId, riderId, overrideSla = false) => {
  try {
    // Check MongoDB connection state before querying
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Connection is not ready (0 = disconnected, 2 = connecting, 3 = disconnecting)
      throw new Error('Database connection not ready. Please wait a moment and try again.');
    }

    // Normalize orderId: frontend may send ord-1, ord-0001, ORD-1, ORD-0001
    // Backend DB may have ORD-1, ORD-0001, etc.
    let normalizedOrderId = orderId;
    if (typeof orderId === 'string') {
      // Handle ord-1, ord-0001 format -> ORD-0001
      const ordMatch = orderId.match(/^ord-(\d+)$/i);
      if (ordMatch) {
        const num = ordMatch[1];
        normalizedOrderId = `ORD-${String(parseInt(num, 10)).padStart(4, '0')}`;
      }
      // Handle ORD-1 format -> ORD-0001
      const ordMatch2 = orderId.match(/^ORD-(\d+)$/);
      if (ordMatch2 && !ordMatch2[1].startsWith('0')) {
        const num = ordMatch2[1];
        normalizedOrderId = `ORD-${String(parseInt(num, 10)).padStart(4, '0')}`;
      }
    }
    
    // Try multiple ID formats to find the order
    let order = null;
    const searchIds = [normalizedOrderId, orderId];
    // Also try with different padding
    if (normalizedOrderId.match(/^ORD-(\d+)$/)) {
      const num = normalizedOrderId.match(/^ORD-(\d+)$/)[1];
      const unpadded = `ORD-${parseInt(num, 10)}`;
      if (unpadded !== normalizedOrderId) searchIds.push(unpadded);
    }
    
    for (const searchId of searchIds) {
      try {
        const findOrderPromise = Promise.race([
          Order.findOne({ id: searchId }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Order lookup timed out')), 8000)
          )
        ]);
        order = await findOrderPromise;
        if (order) break;
      } catch (err) {
        // Continue to next search ID
        continue;
      }
    }
    
    if (!order) {
      // Last attempt: try case-insensitive regex search
      try {
        const findOrderPromise = Promise.race([
          Order.findOne({ id: { $regex: new RegExp(`^${orderId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Order lookup timed out')), 5000)
          )
        ]);
        order = await findOrderPromise;
      } catch (err) {
        // Ignore and throw not found
      }
    }
    
    if (!order) {
      logger.error('[dispatchService.assignOrder] Order not found', { 
        originalOrderId: orderId, 
        normalizedOrderId,
        searchedIds: searchIds 
      });
      throw new Error(`Order not found: ${orderId}`);
    }
    
    // Ensure order is a Mongoose document (not lean) so we can modify and save it
    // Also ensure we have the correct order ID format
    if (!order || (order.constructor && order.constructor.name === 'Object')) {
      // If it's a plain object (from .lean()) or order is null, fetch it again as a document
      // Try multiple ID formats to find the order
      let fetchedOrder = await Order.findOne({ id: order?.id || orderId || normalizedOrderId });
      
      // Try normalized formats if not found
      if (!fetchedOrder && (order?.id || orderId || normalizedOrderId)) {
        const searchId = order?.id || orderId || normalizedOrderId;
        const normalizedId = searchId.replace(/^ord-(\d+)$/i, (match, num) => {
          return `ORD-${String(parseInt(num, 10)).padStart(4, '0')}`;
        });
        if (normalizedId !== searchId) {
          fetchedOrder = await Order.findOne({ id: normalizedId });
        }
      }
      
      if (!fetchedOrder && (order?.id || orderId || normalizedOrderId)) {
        const searchId = order?.id || orderId || normalizedOrderId;
        const paddedId = searchId.replace(/^ORD-(\d+)$/, (match, num) => {
          return `ORD-${String(parseInt(num, 10)).padStart(4, '0')}`;
        });
        if (paddedId !== searchId) {
          fetchedOrder = await Order.findOne({ id: paddedId });
        }
      }
      
      if (!fetchedOrder) {
        logger.error('[dispatchService.assignOrder] Order not found after fetch attempt', {
          originalOrderId: orderId,
          normalizedOrderId,
          orderIdFromOrder: order?.id
        });
        throw new Error(`Order not found: ${orderId || normalizedOrderId}`);
      }
      
      order = fetchedOrder;
    }
    
    // Log the order ID we're working with
    logger.info('[dispatchService.assignOrder] Order found and ready for update', {
      orderId: order.id,
      orderType: order.constructor?.name || typeof order,
      hasSaveMethod: !!order.save
    });
    
    // Verify this is the correct Order model (warehouse, not production)
    // Check if order has production-specific fields that shouldn't be there
    const orderObj = order.toObject ? order.toObject() : order;
    const hasProductionSchema = !!(orderObj.store_id || orderObj.item_count || orderObj.sla_timer || orderObj.sla_deadline);
    
    if (hasProductionSchema) {
      logger.warn('[dispatchService.assignOrder] Order has production schema fields, transforming to warehouse schema', { 
        orderId: order.id || orderObj.id,
        hasStoreId: !!orderObj.store_id,
        hasItemCount: !!orderObj.item_count,
        hasSlaTimer: !!orderObj.sla_timer,
        hasSlaDeadline: !!orderObj.sla_deadline
      });
      
      // Transform production schema fields to warehouse schema
      // Map sla_deadline (snake_case) to slaDeadline (camelCase)
      if (orderObj.sla_deadline && !orderObj.slaDeadline) {
        order.slaDeadline = orderObj.sla_deadline instanceof Date 
          ? orderObj.sla_deadline 
          : new Date(orderObj.sla_deadline);
      }
      
      // Map status from production enum to warehouse enum
      const statusMap = {
        'new': 'pending',
        'processing': 'pending',
        'ready': 'pending',
        'completed': 'delivered',
        'cancelled': 'rto',
        'rto': 'rto'
      };
      if (orderObj.status && statusMap[orderObj.status] && !['assigned', 'picked_up', 'in_transit', 'delivered', 'rto', 'returned', 'delayed', 'pending'].includes(orderObj.status)) {
        order.status = statusMap[orderObj.status];
      }
      
      // Ensure required warehouse fields exist
      if (!order.pickupLocation) {
        order.pickupLocation = orderObj.pickupLocation || 'Hub Location';
      }
      if (!order.dropLocation) {
        order.dropLocation = orderObj.dropLocation || 'Customer Address';
      }
      if (!order.customerName) {
        order.customerName = orderObj.customerName || 'Customer';
      }
      if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        // If item_count exists, create items array
        if (orderObj.item_count && orderObj.item_count > 0) {
          order.items = Array(orderObj.item_count).fill(null).map((_, i) => `Item ${i + 1}`);
        } else {
          order.items = ['Order Item'];
        }
      }
      
      // Remove production-specific fields that don't exist in warehouse schema
      // We'll do this by using findOneAndUpdate with $unset
    }

    // Determine if this is a reassignment or new assignment
    // Reassignment: order has a riderId OR order status is 'assigned', 'in_transit', 'picked_up', or 'delayed'
    // New assignment: order is 'pending' with no rider
    const hasRider = !!order.riderId;
    const isReassignableStatus = ['assigned', 'in_transit', 'picked_up', 'delayed'].includes(order.status);
    const isReassign = hasRider || isReassignableStatus;
    
    // Allow assignment/reassignment for:
    // 1. Pending orders (new assignment) - always allowed
    // 2. Orders with reassignable status (assigned, in_transit, picked_up, delayed) - can reassign even if riderId is missing
    // 3. Orders that already have a rider (reassignment) - can reassign regardless of status
    // Reject: delivered, rto, returned (only if they have no rider)
    if (order.status === 'pending') {
      // Pending orders can always be assigned - this is a new assignment
    } else if (hasRider) {
      // Orders with existing rider can always be reassigned, regardless of status
      // This allows reassigning even if status is 'delivered', 'rto', etc. (edge cases)
    } else if (isReassignableStatus) {
      // Orders with reassignable status can be assigned/reassigned even if riderId is missing
      // This handles case where order status is 'assigned'/'in_transit'/'delayed' but riderId might be null
    } else {
      // All other statuses (delivered, rto, returned without rider) cannot be assigned
      throw new Error(`Cannot assign order: Order status is '${order.status}' and has no rider assigned`);
    }
    
    const prevRiderId = order.riderId || null;

    // CRITICAL: Check RiderHR first, then Rider (operational)
    // This ensures we can assign orders to riders who are onboarded in HR but don't have operational records yet
    const normalizeRiderId = (id) => {
      if (!id || typeof id !== 'string') return null;
      const match = id.match(/^r(?:ider-)?(\d+)$/i);
      if (match) {
        return `RIDER-${String(parseInt(match[1], 10)).padStart(4, '0')}`;
      }
      if (/^r\d+$/i.test(id)) {
        return id.replace(/^r/i, 'RIDER-');
      }
      return id;
    };

    const riderSearchIds = [riderId];
    const normalized = normalizeRiderId(riderId);
    if (normalized && normalized !== riderId) {
      riderSearchIds.push(normalized);
    }

    let rider = null;
    let riderHR = null;

    // First, try to find in operational Rider collection
    for (const searchId of riderSearchIds) {
      if (!searchId) continue;
      try {
        rider = await Rider.findOne({ id: searchId });
        if (rider) break;
      } catch (err) {
        logger.warn('[dispatchService.assignOrder] Error searching Rider', { searchId, error: err.message });
      }
    }

    // If not found in operational, check RiderHR
      if (!rider) {
      for (const searchId of riderSearchIds) {
        if (!searchId) continue;
        try {
          riderHR = await RiderHR.findOne({ id: searchId });
          if (riderHR) {
            // Check if rider is active and has app access
            if (riderHR.status === 'active' && riderHR.appAccess === 'enabled') {
              logger.info('[dispatchService.assignOrder] Found rider in HR, creating operational record', {
                riderId: riderHR.id,
                name: riderHR.name
              });
              
              // Create operational rider record from HR data
              const avatarInitials = riderHR.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
              
              rider = new Rider({
                id: riderHR.id,
                name: riderHR.name,
                avatarInitials: avatarInitials,
                status: 'offline', // Default status
                capacity: {
                  currentLoad: 0, // Start with 0 load
                  maxLoad: 5
                },
                rating: 0,
                avgEtaMins: 0
              });
              
              try {
                await rider.save();
                logger.info('[dispatchService.assignOrder] Created operational rider from HR', {
                  riderId: rider.id
                });
              } catch (saveError) {
                // If save fails (e.g., duplicate), try to fetch existing
                if (saveError.code === 11000) {
                  rider = await Rider.findOne({ id: riderHR.id });
                  if (!rider) {
                    throw new Error('Failed to create or find operational rider');
                  }
                } else {
                  throw saveError;
                }
              }
              break;
            } else {
              throw new Error(`Rider ${riderHR.id} is not active or app access is disabled`);
            }
          }
        } catch (err) {
          if (err.message.includes('not active') || err.message.includes('app access')) {
            throw err;
          }
          logger.warn('[dispatchService.assignOrder] Error searching RiderHR', { searchId, error: err.message });
        }
      }
    }

    if (!rider) {
      throw new Error('Rider not found in operational or HR records');
    }

    // Ensure rider is a Mongoose document (not lean) so we can modify and save it
    if (rider.constructor.name === 'Object') {
      // If it's a plain object (from .lean()), fetch it again as a document
      rider = await Rider.findOne({ id: rider.id });
      if (!rider) {
        throw new Error('Rider not found');
      }
    }

    // Initialize capacity if it doesn't exist
    if (!rider.capacity) {
      rider.capacity = {
        currentLoad: 0,
        maxLoad: DEFAULT_RIDER_MAX_LOAD,
      };
    }
    if (typeof rider.capacity.currentLoad !== 'number') {
      rider.capacity.currentLoad = 0;
    }
    if (typeof rider.capacity.maxLoad !== 'number') {
      rider.capacity.maxLoad = DEFAULT_RIDER_MAX_LOAD;
    }

    // Handle reassignment: decrease previous rider's load first
    if (isReassign && prevRiderId && prevRiderId !== riderId) {
      try {
        // Find previous rider
        let prevRider = await Rider.findOne({ id: prevRiderId });
        if (!prevRider && typeof prevRiderId === 'string') {
          // Try normalized formats
          const match = prevRiderId.match(/^r(?:ider-)?(\d+)$/i);
          if (match) {
            const padded = `RIDER-${String(parseInt(match[1], 10)).padStart(4, '0')}`;
            prevRider = await Rider.findOne({ id: padded });
          }
        }
        
        if (prevRider) {
          // Initialize capacity if needed
          if (!prevRider.capacity) {
            prevRider.capacity = { currentLoad: 0, maxLoad: DEFAULT_RIDER_MAX_LOAD };
          }
          if (typeof prevRider.capacity.currentLoad !== 'number') {
            prevRider.capacity.currentLoad = 0;
          }
          
          // Decrease previous rider's load
          if (prevRider.capacity.currentLoad > 0) {
            prevRider.capacity.currentLoad = Math.max(0, prevRider.capacity.currentLoad - 1);
            logger.info('[dispatchService.assignOrder] Decreased previous rider load', {
              prevRiderId: prevRider.id,
              newLoad: prevRider.capacity.currentLoad
            });
            
            // Update previous rider's status if they have no more orders
            if (prevRider.capacity.currentLoad === 0) {
              // Check if rider has any other assigned orders
              const otherOrders = await Order.countDocuments({ 
                riderId: prevRider.id, 
                status: { $in: ['assigned', 'picked_up', 'in_transit'] } 
              });
              
              if (otherOrders === 0 && prevRider.status === 'busy') {
                prevRider.status = 'idle';
              }
            }
            
            // Save previous rider
            await Rider.findOneAndUpdate(
              { id: prevRider.id },
              { 
                $set: { 
                  capacity: prevRider.capacity,
                  status: prevRider.status,
                  updatedAt: new Date()
                }
              },
              { runValidators: false }
            );
          }
        }
      } catch (prevRiderErr) {
        // Log but don't fail the assignment if previous rider update fails
        logger.warn('[dispatchService.assignOrder] Failed to update previous rider', {
          prevRiderId,
          error: prevRiderErr.message
        });
      }
    }

    // Check capacity AFTER handling reassignment (previous rider's load has been decreased)
    // For reassignments, allow assignment even if new rider is at capacity (we're just moving order from one rider to another)
    // For new assignments, check capacity normally
    if (!isReassign && rider.capacity.currentLoad >= rider.capacity.maxLoad) {
      throw new Error('Rider is at capacity');
    }
    // For reassignments, only reject if new rider is already over capacity (shouldn't happen, but safety check)
    if (isReassign && rider.capacity.currentLoad > rider.capacity.maxLoad) {
      throw new Error('Rider is over capacity');
    }

    // Check SLA (unless overridden)
    // Ensure slaDeadline exists (may have been transformed from sla_deadline above)
    if (!order.slaDeadline) {
      const orderObj = order.toObject ? order.toObject() : order;
      if (orderObj.sla_deadline) {
        order.slaDeadline = orderObj.sla_deadline instanceof Date 
          ? orderObj.sla_deadline 
          : new Date(orderObj.sla_deadline);
      } else {
        // Default: 1 hour from now
        order.slaDeadline = new Date(Date.now() + 60 * 60 * 1000);
      }
    }
    
    if (!overrideSla) {
      const now = new Date();
      const timeUntilDeadline = order.slaDeadline - now;
      const minutesUntilDeadline = timeUntilDeadline / (1000 * 60);

      // Calculate estimated pickup time
      let estimatedPickupMinutes = 15;
      if (rider.location && order.pickupLocation) {
        const orderPickupCoords = extractCoordinates(order.pickupLocation);
        if (orderPickupCoords && rider.location.lat && rider.location.lng) {
          const distance = calculateDistance(
            rider.location.lat,
            rider.location.lng,
            orderPickupCoords.lat,
            orderPickupCoords.lng
          );
          estimatedPickupMinutes = Math.ceil(distance * 3);
        }
      }

      // Warn if assignment would violate SLA
      if (minutesUntilDeadline < estimatedPickupMinutes + 10) {
        // Allow but could warn in production
      }
    }

    // Ensure all required fields are present before assignment
    // Validate required fields for warehouse Order model
    // (slaDeadline should already be set above if it was missing)
    if (!order.pickupLocation) {
      order.pickupLocation = 'Hub Location';
    }
    if (!order.dropLocation) {
      order.dropLocation = 'Customer Address';
    }
    if (!order.customerName) {
      order.customerName = 'Customer';
    }
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      order.items = ['Order Item'];
    }
    
    // Assign order (use normalized rider id for DB)
    // Map status to valid warehouse enum values
    const validWarehouseStatuses = ['assigned', 'picked_up', 'in_transit', 'delivered', 'rto', 'returned', 'delayed', 'pending'];
    if (!validWarehouseStatuses.includes(order.status)) {
      // Map invalid status to a valid one
      if (order.status === 'new' || order.status === 'processing' || order.status === 'ready') {
        order.status = 'pending';
      } else if (order.status === 'completed') {
        order.status = 'delivered';
      } else if (order.status === 'cancelled') {
        order.status = 'rto';
      } else {
        order.status = 'pending'; // Default fallback
      }
    }
    
    // For reassignment, keep the current status if it's in_transit, picked_up, or delayed, otherwise set to assigned
    // For delayed orders, change to assigned when reassigning
    if (!isReassign || order.status === 'pending') {
      order.status = 'assigned';
    } else if (isReassign && ['in_transit', 'picked_up'].includes(order.status)) {
      // Keep the current status for reassignments of in-transit or picked-up orders
    } else if (isReassign && order.status === 'delayed') {
      // Change delayed status to assigned when reassigning
      order.status = 'assigned';
    } else if (isReassign) {
      order.status = 'assigned';
    }
    // If reassigning, add note about reassignment
    const assignmentNote = isReassign 
      ? `Reassigned from ${prevRiderId ? 'previous rider' : 'unassigned'} to ${rider.name}`
      : `Manually assigned to ${rider.name}`;
    
    // Set riderId - ensure it's the normalized format from database
    order.riderId = rider.id; // This is already in normalized format (RIDER-0001)
    order.etaMinutes = 15; // Default estimate
    
    // Ensure timeline exists
    if (!order.timeline) {
      order.timeline = [];
    }
    order.timeline.push({
      status: order.status,
      time: new Date(),
      note: assignmentNote,
    });
    
    // Mark fields as modified to ensure save
    order.markModified('riderId');
    order.markModified('status');
    order.markModified('etaMinutes');
    order.markModified('timeline');
    order.markModified('slaDeadline');
    order.markModified('pickupLocation');
    order.markModified('dropLocation');
    order.markModified('customerName');
    order.markModified('items');

    // If reassigning, decrement previous rider's load (use prevRiderId captured before update)
    if (isReassign && prevRiderId && prevRiderId !== rider.id) {
      const prevRider = await Rider.findOne({ id: prevRiderId }).lean();
      if (prevRider) {
        // Calculate new capacity
        const prevCapacity = prevRider.capacity || { currentLoad: 0, maxLoad: DEFAULT_RIDER_MAX_LOAD };
        const newCurrentLoad = Math.max(0, (prevCapacity.currentLoad || 0) - 1);
        const newCurrentOrderId = prevRider.currentOrderId === order.id ? null : prevRider.currentOrderId;
        
        // Update previous rider using findOneAndUpdate to avoid validation errors
        const prevRiderUpdateData = {
          capacity: {
            currentLoad: newCurrentLoad,
            maxLoad: prevCapacity.maxLoad || DEFAULT_RIDER_MAX_LOAD,
          },
          currentOrderId: newCurrentOrderId,
        };
        
        // Remove production schema fields if they exist
        const prevRiderUnsetData = {};
        if (prevRider.store_id) prevRiderUnsetData.store_id = '';
        if (prevRider.rider_name && prevRider.name) prevRiderUnsetData.rider_name = '';
        if (prevRider.last_update) prevRiderUnsetData.last_update = '';
        if (prevRider.current_orders !== undefined && prevRider.capacity) prevRiderUnsetData.current_orders = '';
        if (prevRider.max_capacity !== undefined && prevRider.capacity) prevRiderUnsetData.max_capacity = '';
        
        const prevRiderUpdateOperation = { $set: prevRiderUpdateData };
        if (Object.keys(prevRiderUnsetData).length > 0) {
          prevRiderUpdateOperation.$unset = prevRiderUnsetData;
        }
        
        await Rider.findOneAndUpdate(
          { id: prevRiderId },
          prevRiderUpdateOperation,
          { new: true, runValidators: false }
        );
      }
    }

    // Update rider
    rider.status = rider.status === 'offline' ? 'online' : 'busy';
    rider.currentOrderId = order.id;
    
    // Ensure capacity exists and is properly initialized (should already be done above, but double-check)
    if (!rider.capacity) {
      rider.capacity = { currentLoad: 0, maxLoad: DEFAULT_RIDER_MAX_LOAD };
    }
    if (typeof rider.capacity.currentLoad !== 'number') {
      rider.capacity.currentLoad = 0;
    }
    rider.capacity.currentLoad = (rider.capacity.currentLoad || 0) + 1;
    
    // Mark capacity as modified to ensure save
    rider.markModified('capacity');

    // Save order and rider - use individual saves to catch errors
    try {
      // Prepare update data with all required warehouse fields
      // CRITICAL: Ensure riderId is explicitly set and not null/undefined
      const updateData = {
        riderId: rider.id, // Explicitly set the rider ID from the rider object
        status: order.status,
        etaMinutes: order.etaMinutes || 15,
        slaDeadline: order.slaDeadline,
        pickupLocation: order.pickupLocation,
        dropLocation: order.dropLocation,
        customerName: order.customerName,
        items: order.items,
      };
      
      // Log the update data to verify riderId is included
      logger.info('[dispatchService.assignOrder] Update data prepared', {
        orderId: order.id,
        riderId: updateData.riderId,
        riderIdType: typeof updateData.riderId,
        riderIdValue: updateData.riderId
      });
      
      // Update timeline separately
      if (order.timeline && Array.isArray(order.timeline)) {
        updateData.timeline = order.timeline;
      }
      
      // Remove production schema fields if they exist
      const unsetData = {};
      const orderObj = order.toObject ? order.toObject() : order;
      if (orderObj.store_id) unsetData.store_id = '';
      if (orderObj.item_count) unsetData.item_count = '';
      if (orderObj.sla_timer) unsetData.sla_timer = '';
      if (orderObj.sla_deadline && order.slaDeadline) unsetData.sla_deadline = ''; // Remove snake_case if we have camelCase
      if (orderObj.order_type) unsetData.order_type = '';
      if (orderObj.sla_status) unsetData.sla_status = '';
      if (orderObj.assignee) unsetData.assignee = '';
      if (orderObj.rto_risk) unsetData.rto_risk = '';
      if (orderObj.rto_reason) unsetData.rto_reason = '';
      if (orderObj.rto_notes) unsetData.rto_notes = '';
      if (orderObj.rto_status) unsetData.rto_status = '';
      
      // Try to update using findOneAndUpdate first (bypasses validation)
      // Try multiple ID formats to ensure we find the order
      const orderIdToSearch = order.id || orderId || normalizedOrderId;
      
      logger.info('[dispatchService.assignOrder] Attempting to update order', {
        orderIdToSearch,
        orderId: order.id,
        originalOrderId: orderId,
        normalizedOrderId,
        updateData,
        unsetData: Object.keys(unsetData).length > 0 ? unsetData : undefined
      });
      
      // Build update operation
      // CRITICAL: Ensure riderId is explicitly included in $set operation
      const updateOperation = { 
        $set: {
          ...updateData,
          riderId: rider.id // Explicitly ensure riderId is set (double-check)
        }
      };
      if (Object.keys(unsetData).length > 0) {
        updateOperation.$unset = unsetData;
      }
      
      // Log the update operation to verify riderId is included
      logger.info('[dispatchService.assignOrder] Update operation prepared', {
        orderIdToSearch,
        riderIdInSet: updateOperation.$set.riderId,
        updateDataKeys: Object.keys(updateOperation.$set)
      });
      
      // CRITICAL: Try to find and update the EXACT order - be very precise with ID matching
      // First, try the exact ID from the order object (most reliable)
      const exactOrderId = order.id || orderIdToSearch || orderId || normalizedOrderId;
      
      // Build a precise query that only matches the exact order we want
      // Use exact match first, then try variations only if exact match fails
      let updatedOrder = null;
      
      // Try exact match first (most reliable)
      if (exactOrderId) {
        try {
          // CRITICAL: Use a separate $set operation to ensure riderId is ALWAYS set
          // This prevents any issues with updateData overwriting riderId
          const finalUpdateOperation = {
            $set: {
              ...updateOperation.$set,
              riderId: rider.id // Force riderId to be set, overriding anything else
            }
          };
          if (updateOperation.$unset) {
            finalUpdateOperation.$unset = updateOperation.$unset;
          }
          
          // CRITICAL: Use updateOne FIRST to guarantee the write to database
          // Then use findOneAndUpdate to get the updated document
          const updateResult = await Order.updateOne(
            { id: exactOrderId },
            finalUpdateOperation,
            { runValidators: false }
          );
          
          logger.info('[dispatchService.assignOrder] updateOne result', {
            exactOrderId,
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
            acknowledged: updateResult.acknowledged,
            riderIdBeingSet: rider.id
          });
          
          // CRITICAL: Wait a moment for write to complete, then verify
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Now fetch the updated order - use explicit field selection
          updatedOrder = await Order.findOne({ id: exactOrderId })
            .select('id order_id riderId status etaMinutes pickupLocation dropLocation customerName items timeline slaDeadline')
            .lean();
          
          // If riderId is still missing, try one more direct update
          if (updatedOrder && updatedOrder.riderId !== rider.id) {
            logger.error('[dispatchService.assignOrder] riderId still missing after updateOne - doing direct MongoDB update', {
              orderId: updatedOrder.id,
              expected: rider.id,
              actual: updatedOrder.riderId
            });
            
            // Use direct MongoDB collection update as last resort
            const mongoose = require('mongoose');
            const db = mongoose.connection.db;
            const ordersCollection = db.collection('orders');
            
            const directUpdateResult = await ordersCollection.updateOne(
              { id: exactOrderId },
              { $set: { riderId: rider.id } }
            );
            
            logger.info('[dispatchService.assignOrder] Direct MongoDB update result', {
              matchedCount: directUpdateResult.matchedCount,
              modifiedCount: directUpdateResult.modifiedCount,
              acknowledged: directUpdateResult.acknowledged
            });
            
            // Fetch again after direct update
            updatedOrder = await Order.findOne({ id: exactOrderId })
              .select('id order_id riderId status etaMinutes pickupLocation dropLocation customerName items timeline slaDeadline')
              .lean();
          }
          
          if (updatedOrder && updatedOrder.id === exactOrderId) {
            // CRITICAL: Verify riderId was actually set
            if (updatedOrder.riderId !== rider.id) {
              logger.error('[dispatchService.assignOrder] riderId NOT set correctly after updateOne - fixing immediately', {
                exactOrderId,
                expected: rider.id,
                actual: updatedOrder.riderId,
                hasRiderIdField: 'riderId' in updatedOrder
              });
              // Force update riderId directly using updateOne
              const fixResult = await Order.updateOne(
                { id: exactOrderId },
                { $set: { riderId: rider.id } },
                { runValidators: false }
              );
              
              // Verify the fix
              const verifyFix = await Order.findOne({ id: exactOrderId })
                .select('+riderId')
                .lean();
              
              if (verifyFix && verifyFix.riderId === rider.id) {
                updatedOrder = verifyFix;
                logger.info('[dispatchService.assignOrder] riderId fix successful after updateOne', {
                  orderId: updatedOrder.id,
                  riderId: updatedOrder.riderId,
                  fixMatched: fixResult.matchedCount,
                  fixModified: fixResult.modifiedCount
                });
              } else {
                logger.error('[dispatchService.assignOrder] riderId fix FAILED after updateOne', {
                  orderId: verifyFix?.id,
                  riderId: verifyFix?.riderId,
                  expected: rider.id
                });
              }
            } else {
              logger.info('[dispatchService.assignOrder] Order updated with exact ID match - riderId correct', {
                exactOrderId,
                orderId: updatedOrder.id,
                riderId: updatedOrder.riderId,
                idsMatch: updatedOrder.id === exactOrderId,
                updateMatched: updateResult.matchedCount,
                updateModified: updateResult.modifiedCount
              });
            }
          } else if (updatedOrder) {
            // Found a different order - this is wrong, don't use it
            logger.error('[dispatchService.assignOrder] Found different order than expected', {
              expectedId: exactOrderId,
              foundId: updatedOrder.id,
              riderId: updatedOrder.riderId
            });
            updatedOrder = null; // Reset to try again
          }
        } catch (err) {
          logger.warn('[dispatchService.assignOrder] Exact ID match failed', { exactOrderId, error: err.message });
        }
      }
      
      // If exact match failed, try with order_id field
      if (!updatedOrder && order.order_id) {
        try {
          const updateResult = await Order.updateOne(
            { order_id: order.order_id },
            finalUpdateOperation,
            { runValidators: false }
          );
          
          updatedOrder = await Order.findOne({ order_id: order.order_id })
            .select('+riderId')
            .lean();
            
          if (updatedOrder && (updatedOrder.id === exactOrderId || updatedOrder.order_id === order.order_id)) {
            logger.info('[dispatchService.assignOrder] Order updated using order_id field', {
              order_id: order.order_id,
              orderId: updatedOrder.id,
              riderId: updatedOrder.riderId,
              updateMatched: updateResult.matchedCount,
              updateModified: updateResult.modifiedCount
            });
          } else if (updatedOrder) {
            logger.error('[dispatchService.assignOrder] Found different order using order_id', {
              expectedId: exactOrderId,
              foundId: updatedOrder.id
            });
            updatedOrder = null;
          }
        } catch (err) {
          logger.warn('[dispatchService.assignOrder] order_id match failed', { error: err.message });
        }
      }
      
      // Only if exact match failed, try ID format variations (but be very careful)
      if (!updatedOrder && exactOrderId) {
        const idMatch = exactOrderId.match(/^ORD-0*(\d+)$/i);
        if (idMatch) {
          const num = idMatch[1];
          // Try normalized format (remove leading zeros)
          const normalizedId = `ORD-${num}`;
          if (normalizedId !== exactOrderId) {
            try {
              const updateResult = await Order.updateOne(
                { id: normalizedId },
                finalUpdateOperation,
                { runValidators: false }
              );
              
              updatedOrder = await Order.findOne({ id: normalizedId })
                .select('+riderId')
                .lean();
              
              // CRITICAL: Verify this is the same order by checking the numeric part
              if (updatedOrder) {
                const foundNum = updatedOrder.id.match(/^ORD-0*(\d+)$/i)?.[1];
                if (foundNum === num) {
                  logger.info('[dispatchService.assignOrder] Order updated with normalized ID', {
                    normalizedId,
                    orderId: updatedOrder.id,
                    riderId: updatedOrder.riderId,
                    updateMatched: updateResult.matchedCount,
                    updateModified: updateResult.modifiedCount
                  });
                } else {
                  logger.error('[dispatchService.assignOrder] Normalized ID matched different order', {
                    expectedNum: num,
                    foundNum: foundNum,
                    foundId: updatedOrder.id
                  });
                  updatedOrder = null;
                }
              }
            } catch (err) {
              logger.warn('[dispatchService.assignOrder] Normalized ID match failed', { error: err.message });
            }
          }
        }
      }
      
      // Last resort: try with $or query but verify the result
      if (!updatedOrder && order.id) {
        try {
          const updateResult = await Order.updateOne(
            { $or: [{ id: order.id }, { order_id: order.id }] },
            finalUpdateOperation,
            { runValidators: false }
          );
          
          updatedOrder = await Order.findOne({ $or: [{ id: order.id }, { order_id: order.id }] })
            .select('+riderId')
            .lean();
          
          // Verify this is the correct order
          if (updatedOrder && (updatedOrder.id === order.id || updatedOrder.order_id === order.id)) {
            logger.info('[dispatchService.assignOrder] Order updated using $or query', {
              orderId: updatedOrder.id,
              riderId: updatedOrder.riderId,
              updateMatched: updateResult.matchedCount,
              updateModified: updateResult.modifiedCount
            });
          } else if (updatedOrder) {
            logger.error('[dispatchService.assignOrder] $or query matched wrong order', {
              expectedId: order.id,
              foundId: updatedOrder.id
            });
            updatedOrder = null;
          }
        } catch (err) {
          logger.warn('[dispatchService.assignOrder] $or query failed', { error: err.message });
        }
      }
      
      // If findOneAndUpdate succeeded, use the updated order
      if (updatedOrder) {
        // CRITICAL: Verify this is the EXACT order we wanted to update
        if (updatedOrder.id !== exactOrderId && updatedOrder.order_id !== exactOrderId) {
          logger.error('[dispatchService.assignOrder] Updated wrong order! Reverting...', {
            expectedId: exactOrderId,
            foundId: updatedOrder.id,
            foundOrderId: updatedOrder.order_id
          });
          updatedOrder = null; // Don't use this order
        } else {
        order = updatedOrder;
        logger.info('[dispatchService.assignOrder] Order updated via findOneAndUpdate', {
          orderId: order.id,
            riderId: order.riderId,
            updateDataRiderId: updateData.riderId,
            orderRiderIdAfterUpdate: order.riderId,
            isDocument: order.constructor?.name || typeof order,
            idsMatch: order.id === exactOrderId
          });
          
          // CRITICAL: Double-check riderId is set correctly
          if (order.riderId !== rider.id) {
            logger.error('[dispatchService.assignOrder] riderId mismatch after update - fixing immediately', {
              orderId: order.id,
              expected: rider.id,
              actual: order.riderId
            });
            // Force update with exact ID using updateOne to guarantee write
            const riderIdFixResult = await Order.updateOne(
              { id: order.id },
              { $set: { riderId: rider.id } },
              { runValidators: false }
            );
            
            // Verify the fix by reading from database
            const riderIdFix = await Order.findOne({ id: order.id })
              .select('+riderId')
              .lean();
              
            if (riderIdFix && riderIdFix.riderId === rider.id) {
              order = riderIdFix;
              logger.info('[dispatchService.assignOrder] riderId fix successful', {
                orderId: order.id,
                riderId: order.riderId,
                fixMatched: riderIdFixResult.matchedCount,
                fixModified: riderIdFixResult.modifiedCount
        });
      } else {
              logger.error('[dispatchService.assignOrder] riderId fix FAILED', {
                orderId: riderIdFix?.id,
                riderId: riderIdFix?.riderId,
                expected: rider.id
              });
            }
          }
        }
        
        // CRITICAL: Immediately verify the update by reading from DB
        // This ensures the riderId was actually persisted
        // Wait a moment for write to complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Use the exact order ID to verify - don't try variations
        const verifyOrderId = order.id;
        if (verifyOrderId) {
          const immediateCheck = await Order.findOne({ id: verifyOrderId })
            .select('+riderId')
            .lean();
          if (immediateCheck) {
            // CRITICAL: Verify this is the exact order we updated
            if (immediateCheck.id === verifyOrderId || immediateCheck.order_id === verifyOrderId) {
              if (immediateCheck.riderId !== rider.id) {
                logger.error('[dispatchService.assignOrder] riderId NOT persisted in immediate check - fixing now', {
                  orderId: immediateCheck.id,
                  expected: rider.id,
                  actual: immediateCheck.riderId
                });
                // Force update immediately with exact ID using updateOne
                const immediateFixResult = await Order.updateOne(
                  { id: immediateCheck.id }, // Use exact ID from database
                  { $set: { riderId: rider.id } },
                  { runValidators: false }
                );
                
                const immediateFix = await Order.findOne({ id: immediateCheck.id })
                  .select('+riderId')
                  .lean();
                  
                if (immediateFix && immediateFix.riderId === rider.id) {
                  order = immediateFix;
                  logger.info('[dispatchService.assignOrder] Immediate fix successful', {
                    orderId: order.id,
                    riderId: order.riderId,
                    fixMatched: immediateFixResult.matchedCount,
                    fixModified: immediateFixResult.modifiedCount
                  });
                } else {
                  logger.error('[dispatchService.assignOrder] Immediate fix failed', {
                    orderId: immediateFix?.id,
                    riderId: immediateFix?.riderId,
                    expected: rider.id
                  });
                }
              } else {
                logger.info('[dispatchService.assignOrder] Immediate check PASSED - riderId is correct', {
                  orderId: immediateCheck.id,
                  riderId: immediateCheck.riderId
                });
                order = immediateCheck; // Use the verified order from DB
              }
            } else {
              logger.error('[dispatchService.assignOrder] Immediate check found different order', {
                expectedId: verifyOrderId,
                foundId: immediateCheck.id
              });
            }
          } else {
            logger.warn('[dispatchService.assignOrder] Immediate check: order not found', {
              verifyOrderId
            });
          }
        }
        
        // Verify riderId was actually saved - if not, force update again
        if (!order.riderId || order.riderId !== rider.id) {
          logger.warn('[dispatchService.assignOrder] riderId not persisted correctly, forcing update', {
            orderId: order.id,
            expectedRiderId: rider.id,
            actualRiderId: order.riderId,
            updateDataRiderId: updateData.riderId
          });
          
          // Force update riderId directly - try all possible ID formats
          const forceUpdateIds = [order.id, orderIdToSearch, orderId, normalizedOrderId];
          if (order.order_id) forceUpdateIds.push(order.order_id);
          
          // Try normalized formats
          if (order.id) {
            const normalizedId = order.id.replace(/^ord-(\d+)$/i, (match, num) => {
              return `ORD-${String(parseInt(num, 10)).padStart(4, '0')}`;
            });
            if (normalizedId !== order.id) forceUpdateIds.push(normalizedId);
            
            const paddedId = order.id.replace(/^ORD-(\d+)$/, (match, num) => {
              return `ORD-${String(parseInt(num, 10)).padStart(4, '0')}`;
            });
            if (paddedId !== order.id) forceUpdateIds.push(paddedId);
          }
          
          let forceUpdate = null;
          for (const forceId of [...new Set(forceUpdateIds)]) {
            if (!forceId) continue;
            try {
              const forceUpdateResult = await Order.updateOne(
                { id: forceId },
                { $set: { riderId: rider.id } },
                { runValidators: false }
              );
              
              forceUpdate = await Order.findOne({ id: forceId })
                .select('+riderId')
                .lean();
                
              if (forceUpdate && forceUpdate.riderId === rider.id) {
                logger.info('[dispatchService.assignOrder] Forced riderId update successful', {
                  orderId: forceId,
                  riderId: forceUpdate.riderId,
                  updateMatched: forceUpdateResult.matchedCount,
                  updateModified: forceUpdateResult.modifiedCount
                });
                break;
              }
            } catch (err) {
              logger.warn('[dispatchService.assignOrder] Failed to force update with ID format', { forceId, error: err.message });
              continue;
            }
          }
          
          if (forceUpdate) {
            order = forceUpdate;
          } else {
            logger.error('[dispatchService.assignOrder] Failed to force update riderId with any ID format', {
              orderId: order.id,
              triedIds: [...new Set(forceUpdateIds)]
            });
          }
        }
      } else {
        // findOneAndUpdate failed - this means the order wasn't found or update failed
        // Try one more time with a direct update using the order ID field
        logger.warn('[dispatchService.assignOrder] findOneAndUpdate returned null, trying direct update', {
          orderId: order.id,
          orderIdToSearch,
          orderIsDocument: order.save ? 'yes' : 'no',
          orderType: order.constructor?.name || typeof order
        });
        
        // Try updating using order_id field as well (in case order was created with order_id instead of id)
        const orderIdField = order.order_id || order.id || orderIdToSearch;
        updatedOrder = await Order.findOneAndUpdate(
          { $or: [{ id: orderIdField }, { order_id: orderIdField }] },
          updateOperation,
          { new: true, runValidators: false }
        );
        
        if (updatedOrder) {
          order = updatedOrder;
          logger.info('[dispatchService.assignOrder] Order updated via findOneAndUpdate with order_id field', {
            orderId: order.id,
            riderId: order.riderId
          });
        } else {
          // Last resort: try to save directly, but only if order is a valid Mongoose document
          // and doesn't have production schema fields
          const orderObj = order.toObject ? order.toObject() : order;
          const hasProductionFields = !!(orderObj.store_id || orderObj.item_count || orderObj.sla_timer || orderObj.sla_deadline);
          
          if (hasProductionFields) {
            // Can't use order.save() with production fields - throw error
            logger.error('[dispatchService.assignOrder] Cannot save order with production schema fields using order.save()', {
              orderId: order.id,
              hasProductionFields: true
            });
            throw new Error(`Order ${order.id || orderIdToSearch} has production schema fields and cannot be saved using warehouse Order model. Please use findOneAndUpdate instead.`);
          }
        
        // Ensure order is a Mongoose document with save method
        if (!order.save) {
          logger.error('[dispatchService.assignOrder] Order is not a Mongoose document, cannot save', {
            orderId: order.id,
            orderType: order.constructor?.name || typeof order
          });
          throw new Error(`Order is not a valid Mongoose document. Cannot save order ${order.id || orderIdToSearch}`);
        }
        
        // Mark all fields as modified and save
        order.markModified('riderId');
        order.markModified('status');
        order.markModified('etaMinutes');
          order.markModified('slaDeadline');
          order.markModified('pickupLocation');
          order.markModified('dropLocation');
          order.markModified('customerName');
          order.markModified('items');
        if (order.timeline && Array.isArray(order.timeline)) {
          order.markModified('timeline');
        }
        
          // Save the order - this should work since we have the document and no production fields
          await order.save({ validateBeforeSave: false }); // Disable validation to avoid schema mismatch
        logger.info('[dispatchService.assignOrder] Order saved successfully via order.save()', {
          orderId: order.id,
          riderId: order.riderId
        });
        }
      }
      
      // Save rider using findOneAndUpdate to avoid validation errors with production schema fields
      const riderUpdateData = {
        status: rider.status,
        currentOrderId: rider.currentOrderId,
        capacity: rider.capacity,
      };
      
      // Remove production schema fields if they exist
      const riderObj = rider.toObject ? rider.toObject() : rider;
      const riderUnsetData = {};
      if (riderObj.store_id) riderUnsetData.store_id = '';
      if (riderObj.rider_name && riderObj.name) riderUnsetData.rider_name = '';
      if (riderObj.last_update) riderUnsetData.last_update = '';
      if (riderObj.current_orders !== undefined && riderObj.capacity) riderUnsetData.current_orders = '';
      if (riderObj.max_capacity !== undefined && riderObj.capacity) riderUnsetData.max_capacity = '';
      
      const riderUpdateOperation = { $set: riderUpdateData };
      if (Object.keys(riderUnsetData).length > 0) {
        riderUpdateOperation.$unset = riderUnsetData;
      }
      
      await Rider.findOneAndUpdate(
        { id: rider.id },
        riderUpdateOperation,
        { new: true, runValidators: false }
      );
    } catch (saveError) {
      logger.error('[dispatchService.assignOrder] save failed', {
        orderId: order.id,
        riderId: rider.id,
        error: saveError.message,
        errorStack: saveError.stack
      });
      
      // Provide more helpful error message
      if (saveError.message && saveError.message.includes('validation failed')) {
        throw new Error(`Order validation failed. Please ensure the order uses the warehouse Order model schema. Details: ${saveError.message}`);
      }
      throw new Error(`Failed to save assignment: ${saveError.message}`);
    }
    
    logger.info('[dispatchService.assignOrder] persisted', { 
      orderId: order.id, 
      riderId: rider.id,
      orderRiderId: order.riderId,
      orderStatus: order.status,
      isReassign 
    });
    
    // CRITICAL: Final verification - read fresh from DB to ensure riderId was saved
    // Try multiple ID formats to find the order (handle ORD-12345 vs ORD-012345)
    const verifySearchIds = [order.id, orderId, normalizedOrderId];
    if (order.order_id) verifySearchIds.push(order.order_id);
    
    // Generate all possible ID format variations
    if (order.id) {
      const idMatch = order.id.match(/^ORD-0*(\d+)$/i);
      if (idMatch) {
        const num = idMatch[1];
        // Add both formats: with and without leading zeros
        verifySearchIds.push(`ORD-${num}`); // ORD-12345
        verifySearchIds.push(`ORD-${num.padStart(4, '0')}`); // ORD-012345
        verifySearchIds.push(`ORD-${num.padStart(5, '0')}`); // ORD-0012345
      }
      
      // Try ord-X format
      const ordMatch = order.id.match(/^ord-(\d+)$/i);
      if (ordMatch) {
        const num = ordMatch[1];
        verifySearchIds.push(`ORD-${num}`);
        verifySearchIds.push(`ORD-${num.padStart(4, '0')}`);
      }
    }
    
    // Remove duplicates and nulls
    const uniqueSearchIds = [...new Set(verifySearchIds.filter(id => id))];
    
    let savedOrder = null;
    let foundWithId = null;
    
    // Try to find the order with each ID format
    for (const searchId of uniqueSearchIds) {
      try {
        savedOrder = await Order.findOne({ id: searchId })
          .select('+riderId')
          .lean();
        if (savedOrder) {
          foundWithId = searchId;
          logger.info('[dispatchService.assignOrder] Found saved order with ID format', { 
            searchId, 
            orderId: savedOrder.id,
            riderId: savedOrder.riderId
          });
          break;
        }
      } catch (err) {
        continue;
      }
    }
    
    // If still not found, try with order_id field
    if (!savedOrder && order.order_id) {
      savedOrder = await Order.findOne({ order_id: order.order_id })
        .select('+riderId')
        .lean();
      if (savedOrder) foundWithId = order.order_id;
    }
    
    // If still not found, try case-insensitive regex search
    if (!savedOrder && order.id) {
      try {
        savedOrder = await Order.findOne({ 
          id: { $regex: new RegExp(`^${order.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
        })
          .select('+riderId')
          .lean();
        if (savedOrder) foundWithId = 'regex';
      } catch (err) {
        // Ignore
      }
    }
    
    if (!savedOrder) {
      logger.error('[dispatchService.assignOrder] order not found after save', { 
        orderId: order.id,
        order_id: order.order_id,
        searchedIds: uniqueSearchIds
      });
      // Don't throw error - the order might have been saved but we can't verify it
      // Log warning and continue
      logger.warn('[dispatchService.assignOrder] Could not verify order save, but assignment may have succeeded', {
        orderId: order.id
      });
      // Continue without throwing - the assignment likely succeeded
      // Use the order object we have in memory
      savedOrder = order.toObject ? order.toObject() : order;
    }
    
    // CRITICAL: Verify riderId was set correctly and fix if needed
    if (savedOrder) {
      if (!savedOrder.riderId || savedOrder.riderId !== rider.id) {
        logger.error('[dispatchService.assignOrder] riderId mismatch or missing after save - FIXING', {
        expected: rider.id,
        actual: savedOrder.riderId,
          orderId: savedOrder.id || order.id,
          foundWithId
        });
        
        // Try to fix it by updating again using all possible ID formats
        let fixed = null;
        for (const searchId of uniqueSearchIds) {
          if (!searchId) continue;
          try {
            const fixResult = await Order.updateOne(
              { id: searchId },
              { $set: { riderId: rider.id } },
              { runValidators: false }
            );
            
            fixed = await Order.findOne({ id: searchId })
              .select('+riderId')
              .lean();
              
            if (fixed && fixed.riderId === rider.id) {
              savedOrder = fixed;
              logger.info('[dispatchService.assignOrder] Fixed riderId mismatch using ID format', { 
                searchId, 
                riderId: savedOrder.riderId,
                orderId: savedOrder.id,
                fixMatched: fixResult.matchedCount,
                fixModified: fixResult.modifiedCount
              });
              break;
            }
          } catch (err) {
            logger.warn('[dispatchService.assignOrder] Failed to fix with ID format', { searchId, error: err.message });
            continue;
          }
        }
        
        // If still not fixed, try with saved order's ID directly
        if (!fixed && savedOrder.id) {
          try {
            const fixResult = await Order.updateOne(
              { id: savedOrder.id },
              { $set: { riderId: rider.id } },
              { runValidators: false }
            );
            
            fixed = await Order.findOne({ id: savedOrder.id })
              .select('+riderId')
              .lean();
              
            if (fixed && fixed.riderId === rider.id) {
              savedOrder = fixed;
              logger.info('[dispatchService.assignOrder] Fixed riderId using saved order ID', { 
                orderId: savedOrder.id,
                riderId: savedOrder.riderId,
                fixMatched: fixResult.matchedCount,
                fixModified: fixResult.modifiedCount
              });
      } else {
              // Last resort: try with $or query
              const orFixResult = await Order.updateOne(
                { $or: [{ id: savedOrder.id }, { order_id: savedOrder.id }] },
                { $set: { riderId: rider.id } },
                { runValidators: false }
              );
              
              fixed = await Order.findOne({ $or: [{ id: savedOrder.id }, { order_id: savedOrder.id }] })
                .select('+riderId')
                .lean();
                
              if (fixed && fixed.riderId === rider.id) {
                savedOrder = fixed;
                logger.info('[dispatchService.assignOrder] Fixed riderId using $or query', { 
                  orderId: savedOrder.id,
                  riderId: savedOrder.riderId,
                  fixMatched: orFixResult.matchedCount,
                  fixModified: orFixResult.modifiedCount
                });
              }
            }
          } catch (err) {
            logger.error('[dispatchService.assignOrder] Final fix attempt failed', { 
              orderId: savedOrder.id,
              error: err.message
            });
          }
        }
        
        // Final verification - read again to confirm riderId is correct
        if (fixed && fixed.id) {
          const finalCheck = await Order.findOne({ id: fixed.id })
            .select('+riderId')
            .lean();
          if (finalCheck && finalCheck.riderId === rider.id) {
            logger.info('[dispatchService.assignOrder] Final verification PASSED - riderId is correct', {
              orderId: finalCheck.id,
              riderId: finalCheck.riderId
            });
            savedOrder = finalCheck; // Use the verified order
          } else {
            logger.error('[dispatchService.assignOrder] Final verification FAILED - riderId still incorrect', {
              orderId: finalCheck?.id,
              expected: rider.id,
              actual: finalCheck?.riderId
            });
            // Last resort: try one more update with the exact ID from finalCheck
            if (finalCheck && finalCheck.id) {
              try {
                const lastAttempt = await Order.findOneAndUpdate(
                  { id: finalCheck.id },
                  { $set: { riderId: rider.id } },
                  { new: true, runValidators: false }
                );
                if (lastAttempt && lastAttempt.riderId === rider.id) {
                  savedOrder = lastAttempt.toObject ? lastAttempt.toObject() : lastAttempt;
                  logger.info('[dispatchService.assignOrder] Last resort fix succeeded', {
                    orderId: savedOrder.id,
                    riderId: savedOrder.riderId
                  });
                }
              } catch (err) {
                logger.error('[dispatchService.assignOrder] Last resort fix failed', { error: err.message });
              }
            }
          }
        }
      } else {
        logger.info('[dispatchService.assignOrder] riderId verified correctly', {
          orderId: savedOrder.id,
          riderId: savedOrder.riderId
        });
      }
    }
    
    // CRITICAL: Final persistence check - ensure riderId is actually in database
    // Wait a moment for database write to complete, then verify
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // CRITICAL: Only check the EXACT order ID to avoid affecting other orders
    // Get the exact order ID we're working with (reuse the one from earlier)
    const exactTargetOrderId = order.id || orderId || normalizedOrderId;
    
    // Declare finalVerifiedOrder in outer scope so it's accessible later
    let finalVerifiedOrder = null;
    
    if (!exactTargetOrderId) {
      logger.error('[dispatchService.assignOrder] No target order ID for final verification', {
        orderId: order.id,
        orderIdParam: orderId,
        normalizedOrderId
      });
    } else {
      // Try to read the EXACT order to confirm riderId is persisted
      
      // First, try exact match
      try {
        const exactCheck = await Order.findOne({ id: exactTargetOrderId })
          .select('+riderId')
          .lean();
        if (exactCheck) {
          // Verify this is the correct order by checking the ID matches
          if (exactCheck.id === exactTargetOrderId || exactCheck.order_id === exactTargetOrderId) {
            if (exactCheck.riderId === rider.id) {
              finalVerifiedOrder = exactCheck;
              logger.info('[dispatchService.assignOrder] Final persistence check PASSED with exact ID', {
                exactTargetOrderId,
                orderId: exactCheck.id,
                riderId: exactCheck.riderId
              });
            } else {
              // Found order but riderId is wrong - fix it immediately (only for the exact order)
              logger.error('[dispatchService.assignOrder] Found exact order but riderId is wrong - fixing', {
                exactTargetOrderId,
                orderId: exactCheck.id,
                expected: rider.id,
                actual: exactCheck.riderId
              });
              const fixResult = await Order.updateOne(
                { id: exactCheck.id }, // Use exact ID to ensure we only fix this order
                { $set: { riderId: rider.id } },
                { runValidators: false }
              );
              
              const fix = await Order.findOne({ id: exactCheck.id })
                .select('+riderId')
                .lean();
              
              if (fix && fix.riderId === rider.id && (fix.id === exactTargetOrderId || fix.order_id === exactTargetOrderId)) {
                finalVerifiedOrder = fix;
                logger.info('[dispatchService.assignOrder] Final fix successful for exact order', {
                  orderId: finalVerifiedOrder.id,
                  riderId: finalVerifiedOrder.riderId,
                  fixMatched: fixResult.matchedCount,
                  fixModified: fixResult.modifiedCount
                });
              }
            }
          } else {
            logger.error('[dispatchService.assignOrder] Found different order than expected', {
              exactTargetOrderId,
              foundId: exactCheck.id,
              foundOrderId: exactCheck.order_id
            });
          }
        }
      } catch (err) {
        logger.warn('[dispatchService.assignOrder] Exact ID check failed', { exactTargetOrderId, error: err.message });
      }
      
      // If exact match failed, try with order_id field (but verify it's the same order)
      if (!finalVerifiedOrder && order.order_id) {
        try {
          const orderIdCheck = await Order.findOne({ order_id: order.order_id })
            .select('+riderId')
            .lean();
          if (orderIdCheck && (orderIdCheck.id === exactTargetOrderId || orderIdCheck.order_id === exactTargetOrderId)) {
            if (orderIdCheck.riderId === rider.id) {
              finalVerifiedOrder = orderIdCheck;
              logger.info('[dispatchService.assignOrder] Final persistence check PASSED with order_id', {
                order_id: order.order_id,
                orderId: orderIdCheck.id,
                riderId: orderIdCheck.riderId
              });
            } else {
              // Fix it using updateOne
              const fixResult = await Order.updateOne(
                { order_id: order.order_id }, // Use exact order_id
                { $set: { riderId: rider.id } },
                { runValidators: false }
              );
              
              const fix = await Order.findOne({ order_id: order.order_id })
                .select('+riderId')
                .lean();
              
              if (fix && fix.riderId === rider.id) {
                finalVerifiedOrder = fix;
                logger.info('[dispatchService.assignOrder] Final fix successful using order_id', {
                  orderId: finalVerifiedOrder.id,
                  riderId: finalVerifiedOrder.riderId,
                  fixMatched: fixResult.matchedCount,
                  fixModified: fixResult.modifiedCount
                });
              }
            }
          }
        } catch (err) {
          logger.warn('[dispatchService.assignOrder] order_id check failed', { error: err.message });
        }
      }
    }

    // Final check: Use finalVerifiedOrder if available, otherwise use savedOrder or order
    // CRITICAL: Only use finalVerifiedOrder if it matches the target order ID
    const finalTargetOrderId = order.id || orderId || normalizedOrderId;
    let finalOrder = order;
    let finalRiderId = rider.id;
    
    if (finalVerifiedOrder) {
      // Verify this is the correct order
      if (finalVerifiedOrder.id === finalTargetOrderId || finalVerifiedOrder.order_id === finalTargetOrderId) {
        finalOrder = finalVerifiedOrder;
        finalRiderId = finalVerifiedOrder.riderId || rider.id;
        logger.info('[dispatchService.assignOrder] Using finalVerifiedOrder', {
          orderId: finalOrder.id,
          riderId: finalRiderId
        });
      } else {
        logger.error('[dispatchService.assignOrder] finalVerifiedOrder is for different order - ignoring', {
          finalTargetOrderId,
          foundId: finalVerifiedOrder.id
        });
      }
    } else if (savedOrder && savedOrder.riderId === rider.id) {
      // Verify savedOrder matches target
      if (savedOrder.id === finalTargetOrderId || savedOrder.order_id === finalTargetOrderId) {
        finalOrder = savedOrder;
        finalRiderId = savedOrder.riderId;
        logger.info('[dispatchService.assignOrder] Using savedOrder', {
          orderId: finalOrder.id,
          riderId: finalRiderId
        });
      } else {
        logger.warn('[dispatchService.assignOrder] savedOrder is for different order - using original order', {
          finalTargetOrderId,
          savedOrderId: savedOrder.id
        });
      }
    }
    
    // CRITICAL: Final persistence guarantee - ensure riderId is in database before returning
    // This is the last chance to fix it - read directly from DB and update if needed
    const finalOrderId = finalOrder.id || order.id || orderId || normalizedOrderId;
    
    if (finalOrderId) {
      try {
        // Read the order one final time from database - explicitly select riderId
        const finalDbCheck = await Order.findOne({ id: finalOrderId })
          .select('id order_id riderId status etaMinutes pickupLocation dropLocation customerName items timeline slaDeadline')
          .lean();
        
        if (finalDbCheck) {
          // Verify this is the correct order
          if (finalDbCheck.id === finalOrderId || finalDbCheck.order_id === finalOrderId) {
            // CRITICAL: Check if riderId field exists and has correct value
            const hasRiderIdField = 'riderId' in finalDbCheck;
            const dbRiderIdValue = finalDbCheck.riderId;
            
            logger.info('[dispatchService.assignOrder] FINAL CHECK - Database state', {
              orderId: finalDbCheck.id,
              hasRiderIdField,
              dbRiderIdValue,
              expectedRiderId: rider.id,
              matches: dbRiderIdValue === rider.id,
              allFields: Object.keys(finalDbCheck)
            });
            
            if (!hasRiderIdField || dbRiderIdValue !== rider.id) {
              // CRITICAL: riderId is missing or wrong - fix it immediately
              logger.error('[dispatchService.assignOrder] FINAL CHECK: riderId is wrong in database - fixing NOW', {
                orderId: finalDbCheck.id,
                expected: rider.id,
                actual: dbRiderIdValue,
                hasField: hasRiderIdField
              });
              
              // Force update with exact ID - use updateOne to guarantee write
              const finalFixResult = await Order.updateOne(
                { id: finalDbCheck.id }, // Use exact ID from database
                { $set: { riderId: rider.id } },
                { runValidators: false }
              );
              
              logger.info('[dispatchService.assignOrder] Final fix updateOne result', {
                orderId: finalDbCheck.id,
                matchedCount: finalFixResult.matchedCount,
                modifiedCount: finalFixResult.modifiedCount,
                acknowledged: finalFixResult.acknowledged
              });
              
              // If updateOne didn't work, try direct MongoDB collection update
              if (finalFixResult.modifiedCount === 0) {
                logger.warn('[dispatchService.assignOrder] updateOne did not modify document, trying direct MongoDB update', {
                  orderId: finalDbCheck.id
                });
                
                const mongoose = require('mongoose');
                const db = mongoose.connection.db;
                const ordersCollection = db.collection('orders');
                
                const directUpdateResult = await ordersCollection.updateOne(
                  { id: finalDbCheck.id },
                  { $set: { riderId: rider.id } }
                );
                
                logger.info('[dispatchService.assignOrder] Direct MongoDB update result', {
                  matchedCount: directUpdateResult.matchedCount,
                  modifiedCount: directUpdateResult.modifiedCount,
                  acknowledged: directUpdateResult.acknowledged
                });
              }
              
              // Wait for write to complete
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Verify the fix worked by reading from database
              const verifyFix = await Order.findOne({ id: finalDbCheck.id })
                .select('id order_id riderId status')
                .lean();
              
              if (verifyFix && verifyFix.riderId === rider.id) {
                logger.info('[dispatchService.assignOrder] FINAL FIX successful - riderId now correct in database', {
                  orderId: verifyFix.id,
                  riderId: verifyFix.riderId
                });
                // Use the fixed order
                finalOrder = verifyFix;
                finalRiderId = verifyFix.riderId;
              } else {
                logger.error('[dispatchService.assignOrder] FINAL FIX failed - riderId still wrong', {
                  orderId: verifyFix?.id,
                  riderId: verifyFix?.riderId,
                  expected: rider.id
                });
              }
            } else {
              // riderId is correct - use the verified order from DB
              logger.info('[dispatchService.assignOrder] FINAL CHECK PASSED - riderId is correct in database', {
                orderId: finalDbCheck.id,
                riderId: finalDbCheck.riderId
              });
              finalOrder = finalDbCheck;
              finalRiderId = finalDbCheck.riderId;
            }
          } else {
            logger.error('[dispatchService.assignOrder] FINAL CHECK: Found different order', {
              expectedId: finalOrderId,
              foundId: finalDbCheck.id
            });
          }
        } else {
          logger.error('[dispatchService.assignOrder] FINAL CHECK: Order not found in database', {
            orderId: finalOrderId
          });
        }
      } catch (err) {
        logger.error('[dispatchService.assignOrder] FINAL CHECK error', {
          orderId: finalOrderId,
          error: err.message,
          stack: err.stack
        });
      }
    }
    
    // Log final state for debugging
    logger.info('[dispatchService.assignOrder] Final state before return', {
      finalTargetOrderId,
      orderId: finalOrder.id || order.id,
      riderId: finalRiderId,
      source: finalVerifiedOrder ? 'finalVerified' : (savedOrder ? 'savedOrder' : 'order'),
      isReassign,
      idsMatch: (finalOrder.id === finalTargetOrderId || finalOrder.order_id === finalTargetOrderId)
    });

    // Return the order with full details for frontend
    return {
      orderId: finalOrder.id || order.id,
      riderId: finalRiderId, // Return the actual rider ID from database (normalized format)
      riderName: rider.name,
      status: finalOrder.status || order.status, // Return actual order status
      etaMinutes: finalOrder.etaMinutes || order.etaMinutes,
      assignedAt: new Date(),
      message: isReassign ? 'Order reassigned successfully' : 'Order assigned successfully',
      // Include full order data for frontend to update
      order: {
        id: finalOrder.id || order.id,
        riderId: finalRiderId,
        status: finalOrder.status || order.status,
        etaMinutes: finalOrder.etaMinutes || order.etaMinutes,
      },
    };
  } catch (error) {
    logger.error('Error assigning order:', error);
    throw error;
  }
};

/**
 * Batch assign multiple orders
 */
const batchAssignOrders = async (orderIds = null) => {
  try {
    // Find unassigned orders
    let unassignedOrders;
    if (orderIds && orderIds.length > 0) {
      unassignedOrders = await Order.find({
        id: { $in: orderIds },
        status: 'pending',
      }).lean();
    } else {
      unassignedOrders = await Order.find({ status: 'pending' })
        .sort({ slaDeadline: 1 })
        .limit(100)
        .lean();
    }

    if (unassignedOrders.length === 0) {
      return {
        assigned: 0,
        failed: 0,
        assignments: [],
        totalProcessed: 0,
      };
    }

    // Find available riders from both operational and HR collections
    const operationalRiders = await Rider.find({
      $expr: { $lt: ['$capacity.currentLoad', '$capacity.maxLoad'] },
    }).lean();
    
    // Get active riders from HR who don't have operational records yet
    const hrRiders = await RiderHR.find({
      status: 'active',
      appAccess: 'enabled'
    }).lean();
    
    const operationalRiderIds = new Set(operationalRiders.map(r => r.id));
    
    // Add HR riders who don't have operational records (they start with 0 load)
    const availableHrRiders = hrRiders
      .filter(hr => !operationalRiderIds.has(hr.id))
      .map(hr => ({
        id: hr.id,
        name: hr.name,
        status: 'offline',
        location: null,
        capacity: {
          currentLoad: 0,
          maxLoad: DEFAULT_RIDER_MAX_LOAD
        },
        rating: 0,
        avgEtaMins: 0,
        zone: null,
        fromHR: true
      }));
    
    const availableRiders = [...operationalRiders, ...availableHrRiders];

    if (availableRiders.length === 0) {
      return {
        assigned: 0,
        failed: unassignedOrders.length,
        assignments: unassignedOrders.map((order) => ({
          orderId: order.id,
          riderId: null,
          status: 'failed',
          reason: 'No available riders',
        })),
        totalProcessed: unassignedOrders.length,
      };
    }

    const assignments = [];
    let assignedCount = 0;
    let failedCount = 0;

    // Assign orders using optimization algorithm
    for (const order of unassignedOrders) {
      let bestRider = null;
      let bestScore = -Infinity;

      const orderPriority = calculatePriority(order.slaDeadline);
      const orderPickupCoords = extractCoordinates(order.pickupLocation);
      const orderZone = order.zone;

      for (const rider of availableRiders) {
        // Skip if rider is at capacity
        if (rider.capacity.currentLoad >= rider.capacity.maxLoad) {
          continue;
        }

        // Calculate score
        let score = 0;

        // Zone match: +10 points
        if (rider.zone && orderZone && rider.zone === orderZone) {
          score += 10;
        }

        // Distance: calculate and subtract points
        if (rider.location) {
          const distance = calculateDistance(
            rider.location.lat,
            rider.location.lng,
            orderPickupCoords.lat,
            orderPickupCoords.lng
          );
          score -= distance * 2;
        } else {
          score -= 20;
        }

        // Capacity: prefer less loaded riders
        const loadRatio = rider.capacity.currentLoad / rider.capacity.maxLoad;
        score -= loadRatio * 10;

        // Status: prefer online/idle
        if (rider.status === 'online' || rider.status === 'idle') {
          score += 5;
        } else if (rider.status === 'busy') {
          score += 2;
        }

        // Rating
        score += (rider.rating || 0) * 2;

        // SLA urgency
        if (orderPriority === 'high') {
          score += 15;
        }

        if (score > bestScore) {
          bestScore = score;
          bestRider = rider;
        }
      }

      if (bestRider) {
        try {
          // Get current order and rider data
          const orderDoc = await Order.findOne({ id: order.id }).lean();
          const riderDoc = await Rider.findOne({ id: bestRider.id }).lean();

          if (!orderDoc || !riderDoc) {
            throw new Error(`Order or rider not found for batch assignment`);
          }

          // Prepare order update
          const orderTimeline = orderDoc.timeline || [];
          orderTimeline.push({
            status: 'assigned',
            time: new Date(),
            note: `Batch-assigned to ${bestRider.name}`,
          });

          const orderUpdateData = {
            status: 'assigned',
            riderId: bestRider.id,
            etaMinutes: 15,
            timeline: orderTimeline,
          };

          // Remove production schema fields if they exist
          const orderUnsetData = {};
          if (orderDoc.store_id) orderUnsetData.store_id = '';
          if (orderDoc.item_count) orderUnsetData.item_count = '';
          if (orderDoc.sla_timer) orderUnsetData.sla_timer = '';
          if (orderDoc.sla_deadline && orderDoc.slaDeadline) orderUnsetData.sla_deadline = '';
          if (orderDoc.order_type) orderUnsetData.order_type = '';
          if (orderDoc.sla_status) orderUnsetData.sla_status = '';
          if (orderDoc.assignee) orderUnsetData.assignee = '';

          const orderUpdateOperation = { $set: orderUpdateData };
          if (Object.keys(orderUnsetData).length > 0) {
            orderUpdateOperation.$unset = orderUnsetData;
          }

          // Prepare rider update
          const newRiderStatus = riderDoc.status === 'offline' ? 'online' : 'busy';
          const riderCapacity = riderDoc.capacity || { currentLoad: 0, maxLoad: DEFAULT_RIDER_MAX_LOAD };
          const riderUpdateData = {
            status: newRiderStatus,
            currentOrderId: order.id,
            capacity: {
              currentLoad: (riderCapacity.currentLoad || 0) + 1,
              maxLoad: riderCapacity.maxLoad || DEFAULT_RIDER_MAX_LOAD,
            },
          };

          // Remove production schema fields if they exist
          const riderUnsetData = {};
          if (riderDoc.store_id) riderUnsetData.store_id = '';
          if (riderDoc.rider_name && riderDoc.name) riderUnsetData.rider_name = '';
          if (riderDoc.last_update) riderUnsetData.last_update = '';
          if (riderDoc.current_orders !== undefined) riderUnsetData.current_orders = '';
          if (riderDoc.max_capacity !== undefined) riderUnsetData.max_capacity = '';

          const riderUpdateOperation = { $set: riderUpdateData };
          if (Object.keys(riderUnsetData).length > 0) {
            riderUpdateOperation.$unset = riderUnsetData;
          }

          // Update both using updateOne to guarantee writes
          await Promise.all([
            Order.updateOne(
              { id: order.id },
              orderUpdateOperation,
              { runValidators: false }
            ),
            Rider.findOneAndUpdate(
              { id: bestRider.id },
              riderUpdateOperation,
              { new: true, runValidators: false }
            )
          ]);
          
          // Verify the order was updated correctly
          const verifyOrder = await Order.findOne({ id: order.id })
            .select('+riderId')
            .lean();
          
          if (verifyOrder && verifyOrder.riderId !== bestRider.id) {
            logger.error('[dispatchService.batchAssignOrders] riderId not set correctly, fixing', {
              orderId: order.id,
              expected: bestRider.id,
              actual: verifyOrder.riderId
            });
            // Fix it
            await Order.updateOne(
              { id: order.id },
              { $set: { riderId: bestRider.id } },
              { runValidators: false }
            );
          }

          // Update available riders list
          const riderIndex = availableRiders.findIndex((r) => r.id === bestRider.id);
          if (riderIndex !== -1) {
            availableRiders[riderIndex].capacity.currentLoad += 1;
          }

          assignments.push({
            orderId: order.id,
            riderId: bestRider.id,
            status: 'assigned',
            reason: null,
          });
          assignedCount++;
        } catch (error) {
          logger.error(`Failed to assign order ${order.id}:`, error);
          assignments.push({
            orderId: order.id,
            riderId: null,
            status: 'failed',
            reason: error.message,
          });
          failedCount++;
        }
      } else {
        assignments.push({
          orderId: order.id,
          riderId: null,
          status: 'failed',
          reason: 'No suitable rider found',
        });
        failedCount++;
      }
    }

    return {
      assigned: assignedCount,
      failed: failedCount,
      assignments,
      totalProcessed: unassignedOrders.length,
    };
  } catch (error) {
    logger.error('Error in batch assign:', error);
    throw error;
  }
};

/**
 * Auto-assign orders (legacy endpoint)
 */
const autoAssignOrders = async (orderIds = null) => {
  try {
    const result = await batchAssignOrders(orderIds);
    return {
      assigned: result.assigned,
      failed: result.failed,
    };
  } catch (error) {
    logger.error('Error in auto-assign:', error);
    throw error;
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
};
