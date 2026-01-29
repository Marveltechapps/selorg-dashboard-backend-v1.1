<<<<<<< HEAD
const Alert = require('../models/Alert');

async function listAlerts(query = {}) {
  const filter = {};
  if (query.vendorId) filter.vendorId = query.vendorId;
  if (query.status && query.status !== 'all') filter.status = query.status;
  const data = await Alert.find(filter).lean();
  return data;
}

async function createAlert(payload) {
  const a = new Alert({
    vendorId: payload.vendorId,
    type: payload.type,
    severity: payload.severity || 'low',
    message: payload.message,
    acknowledgedBy: payload.acknowledgedBy,
  });
  await a.save();
  return a.toObject();
}

module.exports = { listAlerts, createAlert };

=======
const Alert = require('../models/Alert');

async function listAlerts(query = {}) {
  const filter = {};
  if (query.vendorId) filter.vendorId = query.vendorId;
  if (query.status && query.status !== 'all') filter.status = query.status;
  const data = await Alert.find(filter).lean();
  return data;
}

async function createAlert(payload) {
  const a = new Alert({
    vendorId: payload.vendorId,
    type: payload.type,
    severity: payload.severity || 'low',
    message: payload.message,
    acknowledgedBy: payload.acknowledgedBy,
  });
  await a.save();
  return a.toObject();
}

module.exports = { listAlerts, createAlert };

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
