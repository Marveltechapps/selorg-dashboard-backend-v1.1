const trainingService = require('../services/trainingService');

const listTrainingProgress = async (req, res, next) => {
  try {
    const { status, riderId, page, limit } = req.query;
    const result = await trainingService.listTrainingProgress(
      { status, riderId },
      { page, limit }
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRiderTrainingDetails = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const result = await trainingService.getRiderTrainingDetails(riderId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const markTrainingCompleted = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const { notes } = req.body || {};
    const result = await trainingService.markTrainingCompleted(riderId, notes);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTrainingProgress,
  getRiderTrainingDetails,
  markTrainingCompleted,
};
