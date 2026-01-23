const riderService = require('../services/riderService');
const cache = require('../../utils/cache');
const appConfig = require('../../config/app');

const listRiders = async (req, res, next) => {
  try {
    const { status, zone, search, page, limit } = req.query;
    
    // In development, skip cache to ensure fresh data
    if (appConfig.nodeEnv === 'development') {
      const filters = { status, zone, search };
      const pagination = { page: parseInt(page) || 1, limit: parseInt(limit) || 50 };
      const result = await riderService.listRiders(filters, pagination);
      return res.status(200).json(result);
    }
    
    const cacheKey = `riders:${status || 'all'}:${zone || 'all'}:${search || 'all'}:${page || 1}:${limit || 50}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.status(200).json(cached);
    }

    const filters = { status, zone, search };
    const pagination = { page: parseInt(page) || 1, limit: parseInt(limit) || 50 };
    
    const result = await riderService.listRiders(filters, pagination);
    
    await cache.set(cacheKey, result, appConfig.cache.riders);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRiderById = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    
    const cacheKey = `rider:${riderId}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.status(200).json(cached);
    }

    const rider = await riderService.getRiderById(riderId);
    
    await cache.set(cacheKey, rider, appConfig.cache.riders);
    
    res.status(200).json(rider);
  } catch (error) {
    next(error);
  }
};

const updateRider = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const updateData = req.body;
    
    const rider = await riderService.updateRider(riderId, updateData);
    
    // Invalidate cache - clear all rider-related cache entries
    await cache.del(`rider:${riderId}`);
    await cache.del(`rider:location:${riderId}`);
    await cache.delByPattern('riders:*'); // Clear all list riders cache entries
    await cache.del('distribution'); // Clear distribution cache
    
    res.status(200).json(rider);
  } catch (error) {
    next(error);
  }
};

const getRiderLocation = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    
    const cacheKey = `rider:location:${riderId}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.status(200).json(cached);
    }

    const location = await riderService.getRiderLocation(riderId);
    
    await cache.set(cacheKey, location, appConfig.cache.location);
    
    res.status(200).json(location);
  } catch (error) {
    next(error);
  }
};

const getRiderDistribution = async (req, res, next) => {
  try {
    const cacheKey = 'distribution';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.status(200).json(cached);
    }

    const distribution = await riderService.getRiderDistribution();
    
    await cache.set(cacheKey, distribution, appConfig.cache.riders);
    
    res.status(200).json(distribution);
  } catch (error) {
    next(error);
  }
};

const createRider = async (req, res, next) => {
  try {
    const riderData = req.body;
    
    const rider = await riderService.createRider(riderData);
    
    // Invalidate all rider-related cache entries
    await cache.delByPattern('riders:*');
    await cache.del('distribution');
    
    res.status(201).json(rider);
  } catch (error) {
    if (error.code === 11000) {
      const duplicateError = new Error('Rider with this ID already exists');
      duplicateError.statusCode = 400;
      return next(duplicateError);
    }
    next(error);
  }
};

module.exports = {
  listRiders,
  getRiderById,
  updateRider,
  getRiderLocation,
  getRiderDistribution,
  createRider,
};

