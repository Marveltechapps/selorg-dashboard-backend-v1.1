<<<<<<< HEAD
const mongoose = require('mongoose');

const PicklistSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true },
  customer: { type: String, required: true },
  items: { type: Number, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  status: { type: String, enum: ['queued', 'assigned', 'picking', 'completed'], default: 'queued' },
  picker: { type: String },
  zone: { type: String }
}, { timestamps: true, collection: 'warehouse_picklists' });

module.exports = mongoose.models.Picklist || mongoose.model('Picklist', PicklistSchema);

=======
const mongoose = require('mongoose');

const PicklistSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true },
  customer: { type: String, required: true },
  items: { type: Number, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  status: { type: String, enum: ['queued', 'assigned', 'picking', 'completed'], default: 'queued' },
  picker: { type: String },
  zone: { type: String }
}, { timestamps: true, collection: 'warehouse_picklists' });

module.exports = mongoose.models.Picklist || mongoose.model('Picklist', PicklistSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
