<<<<<<< HEAD
const mongoose = require('mongoose');

const DockSlotSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'empty', 'offline'], default: 'empty' },
  truck: { type: String },
  vendor: { type: String },
  eta: { type: String }
}, { timestamps: true, collection: 'warehouse_dock_slots' });

module.exports = mongoose.models.DockSlot || mongoose.model('DockSlot', DockSlotSchema);

=======
const mongoose = require('mongoose');

const DockSlotSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'empty', 'offline'], default: 'empty' },
  truck: { type: String },
  vendor: { type: String },
  eta: { type: String }
}, { timestamps: true, collection: 'warehouse_dock_slots' });

module.exports = mongoose.models.DockSlot || mongoose.model('DockSlot', DockSlotSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
