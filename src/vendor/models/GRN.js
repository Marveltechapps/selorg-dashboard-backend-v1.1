<<<<<<< HEAD
const mongoose = require('mongoose');

const GRNItemSchema = new mongoose.Schema({
  sku: String,
  quantity: Number,
  receivedQuantity: Number,
  unit: String,
  remarks: String,
});

const GRNSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true },
    poNumber: String,
    status: { type: String, default: 'PENDING' },
    receivedAt: Date,
    items: [GRNItemSchema],
    notes: String,
    rejectionReason: String,
    exceptions: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.GRN || mongoose.model('GRN', GRNSchema);

=======
const mongoose = require('mongoose');

const GRNItemSchema = new mongoose.Schema({
  sku: String,
  quantity: Number,
  receivedQuantity: Number,
  unit: String,
  remarks: String,
});

const GRNSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true },
    poNumber: String,
    status: { type: String, default: 'PENDING' },
    receivedAt: Date,
    items: [GRNItemSchema],
    notes: String,
    rejectionReason: String,
    exceptions: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.GRN || mongoose.model('GRN', GRNSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
