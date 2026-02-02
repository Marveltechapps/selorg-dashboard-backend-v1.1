const complianceService = require('../services/complianceService');

const listComplianceAlerts = async (req, res, next) => {
  try {
    const { status, riderId, page, limit } = req.query;
    const result = await complianceService.listComplianceAlerts(
      { status, riderId },
      { page, limit }
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRiderSuspension = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const result = await complianceService.getRiderSuspension(riderId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const manageSuspension = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const suspensionData = req.body;
    const result = await complianceService.manageSuspension(riderId, suspensionData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRiderViolations = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const result = await complianceService.getRiderViolations(riderId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listComplianceAlerts,
  getRiderSuspension,
  manageSuspension,
  getRiderViolations,
};
