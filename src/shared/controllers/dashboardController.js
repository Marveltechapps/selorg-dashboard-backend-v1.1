
const dashboardService = require('../services/dashboardService');
const cache = require('../../utils/cache');
const appConfig = require('../../config/app');

const getDashboardSummary = async (req, res, next) => {
  try {
    // In development, skip cache to ensure fresh data
    if (appConfig.nodeEnv === 'development') {
      const summary = await dashboardService.getDashboardSummary();
      return res.status(200).json(summary);
    }

    const cacheKey = 'dashboard:summary';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.status(200).json(cached);
    }

    const summary = await dashboardService.getDashboardSummary();
    
    await cache.set(cacheKey, summary, appConfig.cache.dashboard);
    
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};
