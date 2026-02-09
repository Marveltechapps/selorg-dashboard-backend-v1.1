/**
 * Script to fix rider capacity by recalculating currentLoad based on actual assigned orders
 * Run this script when orders are deleted but rider capacities weren't updated
 */

const mongoose = require('mongoose');
const Order = require('../../warehouse/models/Order');
const Rider = require('../models/Rider');
const logger = require('../../core/utils/logger');

const fixRiderCapacity = async (targetMaxLoad = null) => {
  try {
    const DEFAULT_MAX_LOAD = 10;
    const maxLoadToSet = targetMaxLoad || DEFAULT_MAX_LOAD;
    
    logger.info('[fixRiderCapacity] Starting rider capacity fix...', {
      targetMaxLoad: maxLoadToSet
    });

    // Get all riders
    const riders = await Rider.find({}).lean();
    logger.info(`[fixRiderCapacity] Found ${riders.length} riders`);

    let fixedCount = 0;
    let unchangedCount = 0;
    let maxLoadUpdatedCount = 0;

    for (const rider of riders) {
      // Count actual assigned orders for this rider
      const assignedOrders = await Order.countDocuments({
        riderId: rider.id,
        status: { $in: ['assigned', 'picked_up', 'in_transit'] }
      });

      const currentLoad = rider.capacity?.currentLoad || 0;
      let maxLoad = rider.capacity?.maxLoad || DEFAULT_MAX_LOAD;
      
      // Update maxLoad to target value if it's different
      const needsMaxLoadUpdate = maxLoad !== maxLoadToSet;
      if (needsMaxLoadUpdate) {
        maxLoad = maxLoadToSet;
        maxLoadUpdatedCount++;
      }

      // Update if currentLoad is different OR maxLoad needs to be updated
      if (assignedOrders !== currentLoad || needsMaxLoadUpdate) {
        logger.info(`[fixRiderCapacity] Fixing rider ${rider.id} (${rider.name})`, {
          oldLoad: currentLoad,
          newLoad: assignedOrders,
          oldMaxLoad: rider.capacity?.maxLoad,
          newMaxLoad: maxLoad
        });

        // Update rider capacity
        await Rider.updateOne(
          { id: rider.id },
          {
            $set: {
              'capacity.currentLoad': assignedOrders,
              'capacity.maxLoad': maxLoad
            }
          },
          { runValidators: false }
        );

        fixedCount++;
      } else {
        unchangedCount++;
      }
    }

    logger.info('[fixRiderCapacity] Capacity fix completed', {
      totalRiders: riders.length,
      fixed: fixedCount,
      unchanged: unchangedCount,
      maxLoadUpdated: maxLoadUpdatedCount
    });

    return {
      success: true,
      totalRiders: riders.length,
      fixed: fixedCount,
      unchanged: unchangedCount,
      maxLoadUpdated: maxLoadUpdatedCount
    };
  } catch (error) {
    logger.error('[fixRiderCapacity] Error fixing rider capacity', error);
    throw error;
  }
};

// If run directly, execute the fix
if (require.main === module) {
  const connectDB = require('../../config/db');
  
  connectDB()
    .then(() => {
      logger.info('[fixRiderCapacity] Database connected');
      return fixRiderCapacity();
    })
    .then((result) => {
      logger.info('[fixRiderCapacity] Script completed successfully', result);
      process.exit(0);
    })
    .catch((error) => {
      logger.error('[fixRiderCapacity] Script failed', error);
      process.exit(1);
    });
}

module.exports = { fixRiderCapacity };
