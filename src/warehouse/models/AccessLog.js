<<<<<<< HEAD
const mongoose = require('mongoose');

const AccessLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  user: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'warehouse_access_logs' });

module.exports = mongoose.models.AccessLog || mongoose.model('AccessLog', AccessLogSchema);

=======
const mongoose = require('mongoose');

const AccessLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  user: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'warehouse_access_logs' });

module.exports = mongoose.models.AccessLog || mongoose.model('AccessLog', AccessLogSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
