const accessService = require('../services/accessService');

const listRiderAccess = async (req, res, next) => {
  try {
    const { appAccess, deviceAssigned, riderId, page, limit } = req.query;
    const result = await accessService.listRiderAccess(
      { appAccess, deviceAssigned, riderId },
      { page, limit }
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateRiderAccess = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const accessData = req.body;
    const result = await accessService.updateRiderAccess(riderId, accessData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const assignDevice = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const deviceData = req.body;
    const result = await accessService.assignDevice(riderId, deviceData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const unassignDevice = async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const result = await accessService.unassignDevice(riderId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRiderAccess,
  updateRiderAccess,
  assignDevice,
  unassignDevice,
};
