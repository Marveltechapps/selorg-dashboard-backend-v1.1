<<<<<<< HEAD
const mongoose = require('mongoose');

const QCMeasurementSchema = new mongoose.Schema({
  attribute: { type: String, required: true },
  expectedRange: String,
  observedValue: Number,
});

const QCCheckSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true },
    batchId: { type: String, required: true },
    inspectorId: String,
    status: { type: String, default: 'pending' },
    measurements: [QCMeasurementSchema],
    notes: String,
    attachments: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.models.QCCheck || mongoose.model('QCCheck', QCCheckSchema);

=======
const mongoose = require('mongoose');

const QCMeasurementSchema = new mongoose.Schema({
  attribute: { type: String, required: true },
  expectedRange: String,
  observedValue: Number,
});

const QCCheckSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true },
    batchId: { type: String, required: true },
    inspectorId: String,
    status: { type: String, default: 'pending' },
    measurements: [QCMeasurementSchema],
    notes: String,
    attachments: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.models.QCCheck || mongoose.model('QCCheck', QCCheckSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
