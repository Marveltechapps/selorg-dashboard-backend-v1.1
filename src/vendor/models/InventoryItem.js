<<<<<<< HEAD
const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true, index: true },
    sku: { type: String, required: true },
    name: String,
    quantity: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    location: String,
    agingDays: { type: Number, default: 0 },
    lastUpdated: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.InventoryItem || mongoose.model('InventoryItem', InventoryItemSchema);

=======
const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true, index: true },
    sku: { type: String, required: true },
    name: String,
    quantity: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    location: String,
    agingDays: { type: Number, default: 0 },
    lastUpdated: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.InventoryItem || mongoose.model('InventoryItem', InventoryItemSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
