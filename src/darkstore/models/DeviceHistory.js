<<<<<<< HEAD
const mongoose = require('mongoose');

const DeviceHistorySchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    index: true,
  },
  store_id: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: ['ASSIGN', 'UNASSIGN', 'RESET', 'LOCK', 'REBOOT', 'CLEAR_CACHE', 'RESTART_APP', 'assign', 'unassign', 'reset', 'lock', 'reboot', 'clear_cache', 'restart_app'],
    required: true,
  },
  performed_by: {
    type: String,
    default: 'system',
  },
  performed_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  previous_state: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  new_state: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Index for efficient queries
DeviceHistorySchema.index({ device_id: 1, performed_at: -1 });
DeviceHistorySchema.index({ store_id: 1, performed_at: -1 });

module.exports = mongoose.models.DeviceHistory || mongoose.model('DeviceHistory', DeviceHistorySchema);

=======
const mongoose = require('mongoose');

const DeviceHistorySchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    index: true,
  },
  store_id: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: ['ASSIGN', 'UNASSIGN', 'RESET', 'LOCK', 'REBOOT', 'CLEAR_CACHE', 'RESTART_APP', 'assign', 'unassign', 'reset', 'lock', 'reboot', 'clear_cache', 'restart_app'],
    required: true,
  },
  performed_by: {
    type: String,
    default: 'system',
  },
  performed_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  previous_state: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  new_state: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Index for efficient queries
DeviceHistorySchema.index({ device_id: 1, performed_at: -1 });
DeviceHistorySchema.index({ store_id: 1, performed_at: -1 });

module.exports = mongoose.models.DeviceHistory || mongoose.model('DeviceHistory', DeviceHistorySchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
