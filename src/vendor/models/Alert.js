<<<<<<< HEAD
const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    vendorId: String,
    type: String,
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open' },
    message: String,
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: String,
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

=======
const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    vendorId: String,
    type: String,
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open' },
    message: String,
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: String,
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
