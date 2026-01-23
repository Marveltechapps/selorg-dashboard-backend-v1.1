const mongoose = require('mongoose');
const { Schema } = mongoose;

const StoreSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  zones: [{ type: String }],
  serviceStatus: { type: String, enum: ['Full', 'Partial', 'None'], default: 'Full' }
}, {
  timestamps: true
});

module.exports = mongoose.models.Store || mongoose.model('Store', StoreSchema);
