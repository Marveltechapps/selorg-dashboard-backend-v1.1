const alertsService = require('../services/alertsService');
const cache = require('../../utils/cache');
const logger = require('../../core/utils/logger');

/**
 * List alerts
 */
const listAlerts = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status || 'all',
      priority: req.query.priority,
      type: req.query.type,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    };

    const result = await alertsService.listAlerts(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get alert by ID
 */
const getAlertById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await alertsService.getAlertById(id);
    res.status(200).json(alert);
  } catch (error) {
    if (error.message === 'Alert not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Alert not found',
        code: 'ALERT_NOT_FOUND',
      });
    }
    next(error);
  }
};

/**
 * Perform action on alert
 */
const performAlertAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actionPayload = req.body;

    if (!actionPayload.actionType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'actionType is required',
        code: 'MISSING_ACTION_TYPE',
      });
    }

    const alert = await alertsService.performAlertAction(id, actionPayload);
    
    // Invalidate cache
    await cache.delByPattern('alerts:*');
    await cache.del(`alert:${id}`);
    // If action affects orders/riders, invalidate those too
    if (actionPayload.actionType === 'reassign_rider') {
      await cache.delByPattern('orders:*');
      await cache.delByPattern('riders:*');
      await cache.delByPattern('dashboard:*');
    }
    
    res.status(200).json(alert);
  } catch (error) {
    logger.error('Error in performAlertAction controller:', error);
    if (error.message === 'Alert not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Alert not found',
        code: 'ALERT_NOT_FOUND',
      });
    }
    next(error);
  }
};

/**
 * Clear resolved alerts
 */
const clearResolvedAlerts = async (req, res, next) => {
  try {
    const result = await alertsService.clearResolvedAlerts();
    
    // Invalidate cache
    await cache.delByPattern('alerts:*');
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error in clearResolvedAlerts controller:', error);
    next(error);
  }
};

module.exports = {
  listAlerts,
  getAlertById,
  performAlertAction,
  clearResolvedAlerts,
};

