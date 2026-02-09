
const riderHrService = require('../services/riderHrService');
const cache = require('../../utils/cache');

const listRiders = async (req, res, next) => {
  try {
    const { status, onboardingStatus, trainingStatus, appAccess, page, limit } = req.query;
    const result = await riderHrService.listRiders(
      { status, onboardingStatus, trainingStatus, appAccess },
      { page, limit }
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRiderDetails = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const rider = await riderHrService.getRiderDetails(riderId);
    res.status(200).json(rider);
  } catch (error) {
    next(error);
  }
};

const onboardRider = async (req, res, next) => {
  try {
    const riderData = req.body;
    const rider = await riderHrService.onboardRider(riderData);

    try {
      await cache.delByPattern('riders:*').catch(() => {});
      await cache.del('distribution').catch(() => {});
      await cache.delByPattern('hr:*').catch(() => {});
    } catch (_) { /* ignore cache errors */ }

    res.status(201).json(rider);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError' ||
        error.message?.includes('required') || error.message?.includes('valid') || error.message?.includes('match')) {
      error.statusCode = 400;
    }
    if (error.code === 11000) {
      error.statusCode = 400;
      error.message = error.message || 'Rider with this phone or ID already exists';
    }
    if (!error.statusCode || error.statusCode < 400) error.statusCode = 500;
    next(error);
  }
};

const updateRider = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const updateData = req.body;
    const rider = await riderHrService.updateRider(riderId, updateData);

    try {
      await cache.delByPattern('riders:*').catch(() => {});
      await cache.del(`rider:${riderId}`).catch(() => {});
      await cache.del('distribution').catch(() => {});
      await cache.delByPattern('hr:*').catch(() => {});
    } catch (_) { /* ignore */ }

    res.status(200).json(rider);
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.statusCode = 400;
      error.message = error.message || 'Validation failed';
    }
    next(error);
  }
};

const sendReminder = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const result = await riderHrService.sendReminder(riderId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRiders,
  getRiderDetails,
  onboardRider,
  updateRider,
  sendReminder,
};
