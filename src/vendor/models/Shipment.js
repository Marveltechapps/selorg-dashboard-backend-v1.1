<<<<<<< HEAD
const mongoose = require('mongoose');

const ShipmentSchema = new mongoose.Schema(
  {
    trackingNumber: { type: String, required: true },
    carrier: String,
    status: { type: String, default: 'IN_TRANSIT' },
    estimatedArrival: Date,
    deliveredAt: Date,
    relatedGRNs: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Shipment || mongoose.model('Shipment', ShipmentSchema);

=======
const mongoose = require('mongoose');

const ShipmentSchema = new mongoose.Schema(
  {
    trackingNumber: { type: String, required: true },
    carrier: String,
    status: { type: String, default: 'IN_TRANSIT' },
    estimatedArrival: Date,
    deliveredAt: Date,
    relatedGRNs: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Shipment || mongoose.model('Shipment', ShipmentSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
